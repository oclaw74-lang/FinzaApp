import calendar
import logging
from collections import defaultdict
from datetime import date
from decimal import Decimal

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client

logger = logging.getLogger(__name__)

MONTH_LABELS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]


def _fetch_month_totals(
    client,
    user_id: str,
    target_mes: int,
    target_year: int,
) -> tuple[float, float]:
    """Return (total_ingresos, total_egresos) for a given month/year."""
    primer_dia = str(date(target_year, target_mes, 1))
    ultimo_dia = str(date(target_year, target_mes, calendar.monthrange(target_year, target_mes)[1]))

    resp_ing = (
        client.table("ingresos")
        .select("monto")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .gte("fecha", primer_dia)
        .lte("fecha", ultimo_dia)
        .execute()
    )
    resp_egr = (
        client.table("egresos")
        .select("monto")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .gte("fecha", primer_dia)
        .lte("fecha", ultimo_dia)
        .execute()
    )

    t_ing = sum(float(r["monto"]) for r in (resp_ing.data or []))
    t_egr = sum(float(r["monto"]) for r in (resp_egr.data or []))
    return t_ing, t_egr


def _build_breakdown(
    records: list[dict],
    tipo: str,
    total: float,
) -> list[dict]:
    """Group records by category and compute percentages."""
    by_cat: dict[str, dict] = defaultdict(lambda: {"monto": 0.0, "nombre": ""})

    for r in records:
        cid = r.get("categoria_id") or "__sin_categoria__"
        by_cat[cid]["monto"] += float(r["monto"])
        by_cat[cid]["nombre"] = (r.get("categorias") or {}).get("nombre", "")

    breakdown = []
    for cid, data in sorted(by_cat.items(), key=lambda x: x[1]["monto"], reverse=True):
        pct = round(data["monto"] / total * 100, 1) if total > 0 else 0.0
        breakdown.append({
            "categoria_id": cid if cid != "__sin_categoria__" else None,
            "nombre": data["nombre"],
            "tipo": tipo,
            "monto": data["monto"],
            "porcentaje": pct,
        })

    return breakdown


def get_dashboard(
    user_jwt: str,
    user_id: str,
    mes: int,
    year: int,
) -> dict:
    client = get_user_client(user_jwt)

    primer_dia = str(date(year, mes, 1))
    ultimo_dia = str(date(year, mes, calendar.monthrange(year, mes)[1]))

    try:
        # --- Current month: ingresos and egresos with category join ---
        resp_ingresos = (
            client.table("ingresos")
            .select("id, monto, descripcion, fecha, categoria_id, categorias(nombre)")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("fecha", primer_dia)
            .lte("fecha", ultimo_dia)
            .execute()
        )
        resp_egresos = (
            client.table("egresos")
            .select("id, monto, descripcion, fecha, categoria_id, categorias(nombre)")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("fecha", primer_dia)
            .lte("fecha", ultimo_dia)
            .execute()
        )

        # --- Savings totals for total_ahorrado accumulator ---
        resp_metas_saldo = (
            client.table("metas_ahorro")
            .select("monto_actual")
            .execute()
        )
        resp_fondo_saldo = (
            client.table("fondo_emergencia")
            .select("monto_actual")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        ingresos = resp_ingresos.data or []
        egresos = resp_egresos.data or []

        # --- KPIs ---
        total_ingresos = sum(float(r["monto"]) for r in ingresos)
        total_egresos = sum(float(r["monto"]) for r in egresos)
        balance = total_ingresos - total_egresos
        ahorro_estimado = max(balance, 0.0)

        total_metas = sum(float(r["monto_actual"]) for r in (resp_metas_saldo.data or []))
        total_fondo = (
            float(resp_fondo_saldo.data.get("monto_actual") or 0)
            if resp_fondo_saldo and resp_fondo_saldo.data
            else 0.0
        )
        total_ahorrado = total_metas + total_fondo

        # --- Category breakdown ---
        breakdown = _build_breakdown(ingresos, "ingreso", total_ingresos)
        breakdown += _build_breakdown(egresos, "egreso", total_egresos)

        # --- Monthly trend: last 6 months ---
        trend = []
        for i in range(5, -1, -1):
            target_mes = mes - i
            target_year = year
            while target_mes < 1:
                target_mes += 12
                target_year -= 1

            t_ing, t_egr = _fetch_month_totals(client, user_id, target_mes, target_year)
            trend.append({
                "mes": target_mes,
                "year": target_year,
                "label": MONTH_LABELS[target_mes - 1],
                "total_ingresos": t_ing,
                "total_egresos": t_egr,
            })

        # --- Recent transactions: last 5 sorted by date DESC ---
        all_tx = [
            {
                "id": r["id"],
                "tipo": "ingreso",
                "monto": float(r["monto"]),
                "descripcion": r.get("descripcion"),
                "fecha": str(r["fecha"]),
                "categoria_nombre": (r.get("categorias") or {}).get("nombre"),
            }
            for r in ingresos
        ] + [
            {
                "id": r["id"],
                "tipo": "egreso",
                "monto": float(r["monto"]),
                "descripcion": r.get("descripcion"),
                "fecha": str(r["fecha"]),
                "categoria_nombre": (r.get("categorias") or {}).get("nombre"),
            }
            for r in egresos
        ]
        all_tx.sort(key=lambda x: x["fecha"], reverse=True)
        recent = all_tx[:5]

        return {
            "mes": mes,
            "year": year,
            "kpis": {
                "total_ingresos": total_ingresos,
                "total_egresos": total_egresos,
                "balance": balance,
                "ahorro_estimado": ahorro_estimado,
                "total_ahorrado": total_ahorrado,
            },
            "categoria_breakdown": breakdown,
            "monthly_trend": trend,
            "recent_transactions": recent,
        }

    except APIError as e:
        logger.error("Supabase APIError en dashboard: code=%s message=%s", e.code, e.message)
        code = e.code or ""
        try:
            status = int(code)
        except (ValueError, TypeError):
            raise HTTPException(status_code=500, detail="Error interno del servidor.")
        if status in (400, 401, 403, 404):
            raise HTTPException(status_code=status, detail=str(e.message))
        raise HTTPException(status_code=500, detail="Error interno del servidor.")


def _prev_month(mes: int, year: int) -> tuple[int, int]:
    """Return (mes, year) for the month prior to the given mes/year."""
    if mes == 1:
        return 12, year - 1
    return mes - 1, year


def _build_egresos_por_categoria(egresos: list[dict], total_egresos: float) -> list[dict]:
    """Aggregate egresos by category, sorted by total descending with percentages."""
    by_cat: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "nombre": ""})

    for r in egresos:
        cid = r.get("categoria_id") or "__sin_categoria__"
        by_cat[cid]["total"] += float(r["monto"])
        cat_data = r.get("categorias")
        nombre = (cat_data.get("nombre", "") if isinstance(cat_data, dict) else "") or "Sin categoria"
        by_cat[cid]["nombre"] = nombre

    result = []
    for data in sorted(by_cat.values(), key=lambda x: x["total"], reverse=True):
        pct = round(data["total"] / total_egresos * 100, 1) if total_egresos > 0 else 0.0
        result.append({
            "categoria": data["nombre"],
            "total": data["total"],
            "porcentaje": pct,
        })

    return result


def _build_presupuestos_estado(
    presupuestos: list[dict],
    egresos: list[dict],
    fecha_inicio: str,
    fecha_fin: str,
    client,
) -> list[dict]:
    """Build budget status list for the given month using pre-fetched egresos."""
    # Index egresos by categoria_id for fast lookup
    egresos_by_cat: dict[str, float] = defaultdict(float)
    for e in egresos:
        cid = e.get("categoria_id")
        if cid:
            egresos_by_cat[cid] += float(e["monto"])

    resultado = []
    for p in presupuestos:
        monto_limite = float(p.get("monto_limite", 0) or 0)
        cat_id = p.get("categoria_id")
        gasto_actual = egresos_by_cat.get(str(cat_id), 0.0) if cat_id else 0.0
        porcentaje = round(gasto_actual / monto_limite * 100, 2) if monto_limite > 0 else 0.0

        cat_data = p.get("categorias")
        categoria_nombre = (
            cat_data.get("nombre", "") if isinstance(cat_data, dict) else ""
        ) or "Sin categoria"

        resultado.append({
            "categoria": categoria_nombre,
            "monto_presupuestado": monto_limite,
            "gasto_actual": round(gasto_actual, 2),
            "porcentaje_usado": porcentaje,
            "alerta": porcentaje >= 80,
        })

    return resultado


def get_dashboard_v2(
    user_jwt: str,
    user_id: str,
    mes: int,
    year: int,
) -> dict:
    """Return consolidated financial dashboard data for the given month/year."""
    client = get_user_client(user_jwt)

    primer_dia = str(date(year, mes, 1))
    ultimo_dia = str(date(year, mes, calendar.monthrange(year, mes)[1]))

    mes_ant, year_ant = _prev_month(mes, year)
    primer_dia_ant = str(date(year_ant, mes_ant, 1))
    ultimo_dia_ant = str(date(year_ant, mes_ant, calendar.monthrange(year_ant, mes_ant)[1]))

    try:
        # --- Current month transactions ---
        resp_ingresos = (
            client.table("ingresos")
            .select("id, monto, descripcion, fecha, categoria_id, categorias(nombre)")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("fecha", primer_dia)
            .lte("fecha", ultimo_dia)
            .execute()
        )
        resp_egresos = (
            client.table("egresos")
            .select("id, monto, descripcion, fecha, categoria_id, categorias(nombre)")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("fecha", primer_dia)
            .lte("fecha", ultimo_dia)
            .execute()
        )

        # --- Previous month totals ---
        resp_ing_ant = (
            client.table("ingresos")
            .select("monto")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("fecha", primer_dia_ant)
            .lte("fecha", ultimo_dia_ant)
            .execute()
        )
        resp_egr_ant = (
            client.table("egresos")
            .select("monto")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("fecha", primer_dia_ant)
            .lte("fecha", ultimo_dia_ant)
            .execute()
        )

        # --- Presupuestos ---
        resp_presupuestos = (
            client.table("presupuestos")
            .select("*, categorias(nombre)")
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )

        # --- Metas activas ---
        resp_metas = (
            client.table("metas_ahorro")
            .select("nombre, monto_objetivo, monto_actual, fecha_objetivo, estado")
            .neq("estado", "completada")
            .execute()
        )

        # --- Prestamos pendientes ---
        resp_prestamos = (
            client.table("prestamos")
            .select("monto_pendiente, fecha_vencimiento, estado")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .is_("deleted_at", "null")
            .execute()
        )

        # --- Fondo de emergencia saldo ---
        resp_fondo_v2 = (
            client.table("fondo_emergencia")
            .select("monto_actual")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

    except APIError as e:
        logger.error("Supabase APIError en dashboard_v2: code=%s message=%s", e.code, e.message)
        code = e.code or ""
        try:
            status = int(code)
        except (ValueError, TypeError):
            raise HTTPException(status_code=500, detail="Error interno del servidor.")
        if status in (400, 401, 403, 404):
            raise HTTPException(status_code=status, detail=str(e.message))
        raise HTTPException(status_code=500, detail="Error interno del servidor.")

    ingresos = resp_ingresos.data or []
    egresos = resp_egresos.data or []
    presupuestos = resp_presupuestos.data or []
    metas = resp_metas.data or []
    prestamos = resp_prestamos.data or []

    # --- total_ahorrado: current balance across all metas + emergency fund ---
    total_metas_v2 = sum(float(m.get("monto_actual") or 0) for m in metas)
    total_fondo_v2 = (
        float(resp_fondo_v2.data.get("monto_actual") or 0)
        if resp_fondo_v2 and resp_fondo_v2.data
        else 0.0
    )
    total_ahorrado_v2 = total_metas_v2 + total_fondo_v2

    # --- Resumen financiero ---
    ingresos_mes = sum(float(r["monto"]) for r in ingresos)
    egresos_mes = sum(float(r["monto"]) for r in egresos)
    balance_mes = ingresos_mes - egresos_mes
    tasa_ahorro = round(balance_mes / ingresos_mes * 100, 2) if ingresos_mes > 0 else 0.0

    ingresos_mes_anterior = sum(float(r["monto"]) for r in (resp_ing_ant.data or []))
    egresos_mes_anterior = sum(float(r["monto"]) for r in (resp_egr_ant.data or []))

    variacion_ingresos_pct = (
        round((ingresos_mes - ingresos_mes_anterior) / ingresos_mes_anterior * 100, 2)
        if ingresos_mes_anterior > 0
        else 0.0
    )
    variacion_egresos_pct = (
        round((egresos_mes - egresos_mes_anterior) / egresos_mes_anterior * 100, 2)
        if egresos_mes_anterior > 0
        else 0.0
    )

    # --- Presupuestos estado ---
    presupuestos_estado = _build_presupuestos_estado(
        presupuestos, egresos, primer_dia, ultimo_dia, client
    )

    # --- Metas activas ---
    metas_activas = []
    for m in metas:
        monto_obj = float(m.get("monto_objetivo") or 0)
        monto_act = float(m.get("monto_actual") or 0)
        pct = round(monto_act / monto_obj * 100, 2) if monto_obj > 0 else 0.0
        fecha_objetivo = m.get("fecha_objetivo")
        metas_activas.append({
            "nombre": m.get("nombre", ""),
            "monto_objetivo": monto_obj,
            "monto_actual": monto_act,
            "porcentaje_completado": pct,
            "fecha_limite": str(fecha_objetivo) if fecha_objetivo else None,
        })

    # --- Prestamos activos ---
    total_deuda = sum(float(p.get("monto_pendiente") or 0) for p in prestamos)
    vencimientos = [
        p["fecha_vencimiento"]
        for p in prestamos
        if p.get("fecha_vencimiento")
    ]
    proximo_vencimiento = min(vencimientos) if vencimientos else None

    # --- Ultimas transacciones (5 mas recientes, mes actual) ---
    all_tx = [
        {
            "tipo": "ingreso",
            "descripcion": r.get("descripcion") or "",
            "monto": float(r["monto"]),
            "fecha": str(r["fecha"]),
            "categoria": (r.get("categorias") or {}).get("nombre") if isinstance(r.get("categorias"), dict) else None,
        }
        for r in ingresos
    ] + [
        {
            "tipo": "egreso",
            "descripcion": r.get("descripcion") or "",
            "monto": float(r["monto"]),
            "fecha": str(r["fecha"]),
            "categoria": (r.get("categorias") or {}).get("nombre") if isinstance(r.get("categorias"), dict) else None,
        }
        for r in egresos
    ]
    all_tx.sort(key=lambda x: x["fecha"], reverse=True)
    ultimas_transacciones = all_tx[:5]

    # --- Egresos por categoria ---
    egresos_por_categoria = _build_egresos_por_categoria(egresos, egresos_mes)

    return {
        "resumen_financiero": {
            "ingresos_mes": ingresos_mes,
            "egresos_mes": egresos_mes,
            "balance_mes": balance_mes,
            "tasa_ahorro": tasa_ahorro,
            "ingresos_mes_anterior": ingresos_mes_anterior,
            "egresos_mes_anterior": egresos_mes_anterior,
            "variacion_ingresos_pct": variacion_ingresos_pct,
            "variacion_egresos_pct": variacion_egresos_pct,
            "total_ahorrado": total_ahorrado_v2,
        },
        "presupuestos_estado": presupuestos_estado,
        "metas_activas": metas_activas,
        "prestamos_activos": {
            "total_deuda": total_deuda,
            "count": len(prestamos),
            "proximo_vencimiento": str(proximo_vencimiento) if proximo_vencimiento else None,
        },
        "ultimas_transacciones": ultimas_transacciones,
        "egresos_por_categoria": egresos_por_categoria,
    }
