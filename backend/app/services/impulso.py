from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def evaluar_impulsos(user_jwt: str, user_id: str, mes: int, year: int) -> dict:
    """Detect impulsive purchases using 2 criteria and mark egresos accordingly."""
    client = get_user_client(user_jwt)
    try:
        egresos_r = (
            client.table("egresos")
            .select("id,monto,categoria_id,impulso_clasificado")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .eq("impulso_clasificado", False)
            .execute()
        )
        presupuestos_r = (
            client.table("presupuestos")
            .select("categoria_id,monto_limite")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
        historico_r = (
            client.table("egresos")
            .select("monto,categoria_id,mes,year")
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    egresos = egresos_r.data or []
    presupuestos = presupuestos_r.data or []
    historico = historico_r.data or []

    # Build budget map: categoria_id -> limite
    budget_map: dict[str, float] = {}
    for p in presupuestos:
        budget_map[str(p["categoria_id"])] = float(p["monto_limite"])

    # Build gasto actual por categoria this month
    gasto_mes: dict[str, float] = {}
    for e in historico:
        if int(e.get("mes", 0)) == mes and int(e.get("year", 0)) == year:
            cat = str(e.get("categoria_id", ""))
            gasto_mes[cat] = gasto_mes.get(cat, 0.0) + float(e["monto"])

    # Build historical average per categoria (last 3 months excluding current)
    from datetime import date
    today = date.today()
    meses_hist: list[tuple[int, int]] = []
    for i in range(1, 4):
        m = today.month - i
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        meses_hist.append((y, m))

    hist_totals: dict[str, list[float]] = {}
    for e in historico:
        key = (int(e.get("year", 0)), int(e.get("mes", 0)))
        if key in meses_hist:
            cat = str(e.get("categoria_id", ""))
            hist_totals.setdefault(cat, []).append(float(e["monto"]))

    hist_avg: dict[str, float] = {
        cat: sum(amounts) / len(amounts) for cat, amounts in hist_totals.items()
    }

    evaluados = 0
    marcados = 0

    for egreso in egresos:
        eid = str(egreso["id"])
        cat = str(egreso.get("categoria_id", ""))
        monto = float(egreso["monto"])
        evaluados += 1
        es_impulso = False

        # Criterion 1: category exceeded budget
        if cat in budget_map and gasto_mes.get(cat, 0.0) > budget_map[cat]:
            es_impulso = True

        # Criterion 2: monto > 2x historical average for category
        if not es_impulso and cat in hist_avg and hist_avg[cat] > 0:
            if monto > 2 * hist_avg[cat]:
                es_impulso = True

        try:
            client.table("egresos").update({
                "is_impulso": es_impulso,
                "impulso_clasificado": not es_impulso,  # auto-discard if not impulso
            }).eq("id", eid).execute()
        except APIError as e:
            _handle_api_error(e)

        if es_impulso:
            marcados += 1

    return {"evaluados": evaluados, "marcados_impulso": marcados}


def clasificar_impulso(user_jwt: str, user_id: str, egreso_id: str, es_impulso: bool) -> dict:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("egresos")
            .update({"is_impulso": es_impulso, "impulso_clasificado": True})
            .eq("id", egreso_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    if not r.data:
        raise HTTPException(status_code=404, detail="Egreso no encontrado.")
    return r.data[0]


def get_resumen_impulso(user_jwt: str, user_id: str, mes: int, year: int) -> dict:
    client = get_user_client(user_jwt)
    try:
        egresos_r = (
            client.table("egresos")
            .select("monto,is_impulso")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    egresos = egresos_r.data or []
    total_mes = sum(float(e["monto"]) for e in egresos)
    impulsos = [e for e in egresos if e.get("is_impulso") is True]
    total_impulso = sum(float(e["monto"]) for e in impulsos)
    porcentaje = (total_impulso / total_mes * 100) if total_mes > 0 else 0.0

    return {
        "cantidad_impulso": len(impulsos),
        "total_impulso": round(total_impulso, 2),
        "porcentaje_del_total": round(porcentaje, 2),
    }
