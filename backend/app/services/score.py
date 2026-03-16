from datetime import date
from postgrest import APIError
from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def _calc_ahorro(client, user_id: str, mes: int, year: int) -> int:
    """Savings rate: (income - expenses) / income. >=20% = 25pts, linear scale."""
    try:
        ingresos_r = (
            client.table("ingresos")
            .select("monto")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
        egresos_r = (
            client.table("egresos")
            .select("monto")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    total_ingresos = sum(float(r["monto"]) for r in (ingresos_r.data or []))
    total_egresos = sum(float(r["monto"]) for r in (egresos_r.data or []))

    if total_ingresos <= 0:
        return 0

    tasa = (total_ingresos - total_egresos) / total_ingresos
    if tasa >= 0.20:
        return 25
    if tasa <= 0:
        return 0
    return int(tasa / 0.20 * 25)


def _calc_presupuesto(client, user_id: str, mes: int, year: int) -> int:
    """Budget compliance: avg of min(spent,limit)/limit per category. 100% = 25pts."""
    try:
        presupuestos_r = (
            client.table("presupuestos")
            .select("monto_limite,categoria_id")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
        egresos_r = (
            client.table("egresos")
            .select("monto,categoria_id")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    presupuestos = presupuestos_r.data or []
    if not presupuestos:
        return 12  # neutral if no budgets configured

    egresos = egresos_r.data or []
    gasto_por_cat: dict[str, float] = {}
    for e in egresos:
        cat_id = str(e["categoria_id"])
        gasto_por_cat[cat_id] = gasto_por_cat.get(cat_id, 0.0) + float(e["monto"])

    ratios = []
    for p in presupuestos:
        limite = float(p["monto_limite"])
        if limite <= 0:
            continue
        gasto = gasto_por_cat.get(str(p["categoria_id"]), 0.0)
        ratio = min(gasto, limite) / limite
        ratios.append(ratio)

    if not ratios:
        return 12

    promedio = sum(ratios) / len(ratios)
    return int(promedio * 25)


def _calc_deuda(client, user_id: str) -> int:
    """Debt-to-income ratio. Debt < 30% monthly income = 25pts."""
    today = date.today()
    try:
        prestamos_r = (
            client.table("prestamos")
            .select("monto_pendiente")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .execute()
        )
        ingresos_r = (
            client.table("ingresos")
            .select("monto")
            .eq("user_id", user_id)
            .eq("mes", today.month)
            .eq("year", today.year)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    deuda_total = sum(float(r["monto_pendiente"]) for r in (prestamos_r.data or []))
    ingreso_mensual = sum(float(r["monto"]) for r in (ingresos_r.data or []))

    if deuda_total <= 0:
        return 25  # no debt = max score
    if ingreso_mensual <= 0:
        return 0

    ratio = deuda_total / ingreso_mensual
    if ratio <= 0.30:
        return 25
    if ratio >= 2.0:
        return 0
    return int(max(0, (2.0 - ratio) / (2.0 - 0.30) * 25))


def _calc_emergencia(client, user_id: str) -> int:
    """Emergency fund proxy: savings vs 3 months of avg expenses. 100% = 25pts."""
    today = date.today()
    try:
        metas_r = (
            client.table("metas_ahorro")
            .select("monto_actual")
            .eq("user_id", user_id)
            .execute()
        )
        egresos_r = (
            client.table("egresos")
            .select("monto,year,mes")
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    # Collect last 3 months
    meses_recientes: set[tuple[int, int]] = set()
    for i in range(3):
        m = today.month - i
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        meses_recientes.add((y, m))

    egresos_recientes = [
        float(e["monto"])
        for e in (egresos_r.data or [])
        if (int(e["year"]), int(e["mes"])) in meses_recientes
    ]

    total_egresos_3m = sum(egresos_recientes)
    objetivo_emergencia = total_egresos_3m  # 3 months of expenses

    if objetivo_emergencia <= 0:
        return 12  # neutral if no expense history

    ahorro_actual = sum(float(m["monto_actual"]) for m in (metas_r.data or []))
    ratio = min(ahorro_actual / objetivo_emergencia, 1.0)
    return int(ratio * 25)


def get_score(user_jwt: str, user_id: str) -> dict:
    """Calculate the financial health score for a user (0-100)."""
    client = get_user_client(user_jwt)
    today = date.today()

    ahorro = _calc_ahorro(client, user_id, today.month, today.year)
    presupuesto = _calc_presupuesto(client, user_id, today.month, today.year)
    deuda = _calc_deuda(client, user_id)
    emergencia = _calc_emergencia(client, user_id)

    score = ahorro + presupuesto + deuda + emergencia

    if score <= 40:
        estado = "critico"
    elif score <= 65:
        estado = "en_riesgo"
    elif score <= 80:
        estado = "bueno"
    else:
        estado = "excelente"

    return {
        "score": score,
        "estado": estado,
        "breakdown": {
            "ahorro": ahorro,
            "presupuesto": presupuesto,
            "deuda": deuda,
            "emergencia": emergencia,
        },
    }
