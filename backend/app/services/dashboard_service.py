import calendar
import logging
from collections import defaultdict
from datetime import date

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

        ingresos = resp_ingresos.data or []
        egresos = resp_egresos.data or []

        # --- KPIs ---
        total_ingresos = sum(float(r["monto"]) for r in ingresos)
        total_egresos = sum(float(r["monto"]) for r in egresos)
        balance = total_ingresos - total_egresos
        ahorro_estimado = max(balance, 0.0)

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
