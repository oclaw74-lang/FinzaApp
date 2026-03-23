from calendar import monthrange
from datetime import date, datetime
from postgrest import APIError
from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def _fecha_rango(year: int, mes: int) -> tuple[str, str]:
    """Return (fecha_inicio, fecha_fin) strings for the given year/month."""
    dias_en_mes = monthrange(year, mes)[1]
    return f"{year}-{mes:02d}-01", f"{year}-{mes:02d}-{dias_en_mes:02d}"


def _calc_ahorro(client, user_id: str, mes: int, year: int) -> int:
    """Savings rate: (income - expenses) / income. >=20% = 25pts, linear scale."""
    fecha_inicio, fecha_fin = _fecha_rango(year, mes)
    try:
        ingresos_r = (
            client.table("ingresos")
            .select("monto")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
            .execute()
        )
        egresos_r = (
            client.table("egresos")
            .select("monto")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
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
    fecha_inicio, fecha_fin = _fecha_rango(year, mes)
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
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
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
    """Debt-to-income ratio + credit card utilization. Max 25pts."""
    today = date.today()
    try:
        prestamos_r = (
            client.table("prestamos")
            .select("monto_pendiente")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .execute()
        )
        tarjetas_r = (
            client.table("tarjetas")
            .select("saldo_actual,limite_credito,tipo")
            .eq("user_id", user_id)
            .eq("activa", True)
            .eq("tipo", "credito")
            .execute()
        )
        fecha_inicio_hoy, fecha_fin_hoy = _fecha_rango(today.year, today.month)
        ingresos_r = (
            client.table("ingresos")
            .select("monto")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio_hoy)
            .lte("fecha", fecha_fin_hoy)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    deuda_total = sum(float(r["monto_pendiente"]) for r in (prestamos_r.data or []))
    ingreso_mensual = sum(float(r["monto"]) for r in (ingresos_r.data or []))

    # Credit card utilization penalty (0-12.5 pts deducted from 25)
    tarjetas = tarjetas_r.data or []
    utilizacion_pts = 0
    if tarjetas:
        total_saldo = sum(float(t.get("saldo_actual") or 0) for t in tarjetas)
        total_limite = sum(float(t.get("limite_credito") or 0) for t in tarjetas if t.get("limite_credito"))
        if total_limite > 0:
            utilizacion = total_saldo / total_limite
            if utilizacion > 0.30:
                # Penalty: up to 12 pts for 100% utilization
                utilizacion_pts = int(min((utilizacion - 0.30) / 0.70 * 12, 12))

    if deuda_total <= 0 and not tarjetas:
        return 25  # no debt, no cards = max score

    if deuda_total <= 0:
        # Only credit card utilization affects score
        return max(0, 25 - utilizacion_pts)

    if ingreso_mensual <= 0:
        return 0

    ratio = deuda_total / ingreso_mensual
    if ratio <= 0.30:
        base = 25
    elif ratio >= 2.0:
        base = 0
    else:
        base = int(max(0, (2.0 - ratio) / (2.0 - 0.30) * 25))

    return max(0, base - utilizacion_pts)


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
            .select("monto,fecha")
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

    egresos_recientes = []
    for e in (egresos_r.data or []):
        fecha_str = e.get("fecha", "")
        if fecha_str:
            d = datetime.strptime(fecha_str[:10], "%Y-%m-%d")
            if (d.year, d.month) in meses_recientes:
                egresos_recientes.append(float(e["monto"]))

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
