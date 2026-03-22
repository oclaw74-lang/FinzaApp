from calendar import monthrange
from datetime import date, datetime
import logging

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.fondo_emergencia import FondoEmergenciaCreate, FondoEmergenciaUpdate
from app.services.base import _handle_api_error

log = logging.getLogger(__name__)

# Factors to convert any subscription/recurrente frequency to monthly equivalent
_FREQ_TO_MONTHLY: dict[str, float] = {
    "mensual": 1.0,
    "quincenal": 2.0,
    "semanal": 4.33,
    "diaria": 30.0,
    "anual": 1 / 12,
    "trimestral": 1 / 3,
}


def _get_promedio_egresos(client, user_id: str) -> float:
    """Average monthly egresos over the last 3 calendar months."""
    today = date.today()
    meses: list[tuple[int, int]] = []
    for i in range(3):
        m = today.month - i
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        meses.append((y, m))

    # Build date range: first day of oldest month to last day of current month
    oldest_y, oldest_m = meses[-1]
    newest_y, newest_m = meses[0]
    fecha_inicio = f"{oldest_y}-{oldest_m:02d}-01"
    last_day = monthrange(newest_y, newest_m)[1]
    fecha_fin = f"{newest_y}-{newest_m:02d}-{last_day:02d}"

    try:
        r = (
            client.table("egresos")
            .select("monto,fecha")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
            .execute()
        )
    except APIError:
        return 0.0

    meses_set = set(meses)
    totales: dict[tuple[int, int], float] = {}
    for e in r.data or []:
        fecha_str = e.get("fecha", "")
        if fecha_str:
            d = datetime.strptime(fecha_str[:10], "%Y-%m-%d")
            key = (d.year, d.month)
            if key in meses_set:
                totales[key] = totales.get(key, 0.0) + float(e.get("monto") or 0)

    if not totales:
        return 0.0
    return sum(totales.values()) / len(meses)


def _get_cuota_prestamos(client, user_id: str) -> float:
    """Estimated monthly payment for active loans (monto_pendiente / months_remaining)."""
    today = date.today()
    try:
        r = (
            client.table("prestamos")
            .select("monto_pendiente,fecha_vencimiento")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .is_("deleted_at", "null")
            .execute()
        )
    except APIError:
        return 0.0

    total = 0.0
    for p in r.data or []:
        pendiente = float(p.get("monto_pendiente") or 0)
        if pendiente <= 0:
            continue
        vencimiento = p.get("fecha_vencimiento")
        if vencimiento:
            try:
                venc_date = datetime.strptime(vencimiento[:10], "%Y-%m-%d").date()
                months_remaining = max(1, (venc_date.year - today.year) * 12 + (venc_date.month - today.month))
                total += pendiente / months_remaining
            except ValueError:
                # No valid date: add 10% of pending as conservative monthly estimate
                total += pendiente * 0.10
        else:
            # No vencimiento set: 10% of pending as estimate
            total += pendiente * 0.10
    return total


def _get_suscripciones_mensual(client, user_id: str) -> float:
    """Sum of active subscriptions normalized to monthly amount."""
    try:
        r = (
            client.table("suscripciones")
            .select("monto,frecuencia")
            .eq("user_id", user_id)
            .eq("activa", True)
            .execute()
        )
    except APIError:
        return 0.0

    total = 0.0
    for s in r.data or []:
        monto = float(s.get("monto") or 0)
        freq = s.get("frecuencia", "mensual")
        total += monto * _FREQ_TO_MONTHLY.get(freq, 1.0)
    return total


def _get_recurrentes_mensual(client, user_id: str) -> float:
    """Sum of active recurring egresos normalized to monthly amount."""
    try:
        r = (
            client.table("recurrentes")
            .select("monto,frecuencia")
            .eq("user_id", user_id)
            .eq("tipo", "egreso")
            .eq("activo", True)
            .execute()
        )
    except APIError:
        return 0.0

    total = 0.0
    for rec in r.data or []:
        monto = float(rec.get("monto") or 0)
        freq = rec.get("frecuencia", "mensual")
        total += monto * _FREQ_TO_MONTHLY.get(freq, 1.0)
    return total


def _get_salario(client, user_id: str) -> float:
    """User's net monthly salary from profile, 0 if not set."""
    try:
        r = (
            client.table("profiles")
            .select("salario_mensual_neto")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except APIError:
        return 0.0
    if r is None or not r.data:
        return 0.0
    sal = r.data.get("salario_mensual_neto")
    return float(sal) if sal else 0.0


def _get_presupuestos_mensual(client, user_id: str) -> float:
    """Sum of all budgeted amounts for the current month from the presupuestos table."""
    today = date.today()
    mes_actual = f"{today.year}-{today.month:02d}"
    try:
        r = (
            client.table("presupuestos")
            .select("monto_presupuestado")
            .eq("user_id", user_id)
            .eq("mes", mes_actual)
            .execute()
        )
    except APIError:
        return 0.0
    return sum(float(p.get("monto_presupuestado") or 0) for p in (r.data or []))


def _calc_meta(client, user_id: str, meta_meses: int) -> float:
    """
    Emergency fund target based on committed monthly expenses only.

    base_mensual = presupuestos_mensual + recurrentes_mensual + cuota_prestamos

    meta_calculada = base_mensual * meta_meses
    """
    presupuestos = _get_presupuestos_mensual(client, user_id)
    cuota_prestamos = _get_cuota_prestamos(client, user_id)
    recurrentes = _get_recurrentes_mensual(client, user_id)

    base_mensual = presupuestos + cuota_prestamos + recurrentes
    return round(base_mensual * meta_meses, 2)


def _enrich(row: dict, client, user_id: str) -> dict:
    try:
        meta_calculada = _calc_meta(client, user_id, row.get("meta_meses", 3))
    except Exception as exc:
        log.warning("_calc_meta failed: %s", exc)
        meta_calculada = 0.0
    monto_actual = float(row.get("monto_actual") or 0)
    porcentaje = min(monto_actual / meta_calculada * 100, 100.0) if meta_calculada > 0 else 0.0
    return {
        **row,
        "monto_actual": monto_actual,
        "meta_calculada": meta_calculada if meta_calculada > 0 else None,
        "porcentaje": round(porcentaje, 2),
    }


def get_or_none(user_jwt: str, user_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("fondo_emergencia")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    # maybe_single() returns None directly when no row found
    if r is None or not r.data:
        return None
    return _enrich(r.data, client, user_id)


def create_fondo(user_jwt: str, user_id: str, data: FondoEmergenciaCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = {
        "user_id": user_id,
        "monto_actual": str(data.monto_actual),
        "meta_meses": data.meta_meses,
        "notas": data.notas,
    }
    try:
        r = client.table("fondo_emergencia").insert(payload).execute()
    except APIError as e:
        _handle_api_error(e)
    return _enrich(r.data[0], client, user_id)


def update_fondo(user_jwt: str, user_id: str, data: FondoEmergenciaUpdate) -> dict:
    client = get_user_client(user_jwt)
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "monto_actual" in payload:
        payload["monto_actual"] = str(payload["monto_actual"])
    if not payload:
        raise HTTPException(status_code=422, detail="No fields to update.")
    try:
        client.table("fondo_emergencia").update(payload).eq("user_id", user_id).execute()
    except APIError as e:
        _handle_api_error(e)
    # Fetch updated row (update() does not return rows in this SDK version)
    try:
        r = (
            client.table("fondo_emergencia")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    if r is None or not r.data:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    return _enrich(r.data, client, user_id)


def _crear_transaccion_fondo(client, user_id: str, tipo: str, monto: float) -> None:
    """
    Create a linked egreso (depositar) or ingreso (retirar) for the emergency fund.
    Silently skips if the system category is not found.
    """
    try:
        cat_nombre = "Ahorro / Metas" if tipo == "depositar" else "Retiro de Ahorro"
        resp = (
            client.table("categorias")
            .select("id")
            .eq("nombre", cat_nombre)
            .eq("es_sistema", True)
            .maybe_single()
            .execute()
        )
        cat_id = resp.data["id"] if (resp and resp.data) else None
        if not cat_id:
            return

        hoy = str(date.today())
        if tipo == "depositar":
            client.table("egresos").insert({
                "user_id": user_id,
                "categoria_id": cat_id,
                "monto": str(monto),
                "moneda": "DOP",
                "descripcion": "Abono a fondo de emergencia",
                "metodo_pago": "efectivo",
                "fecha": hoy,
            }).execute()
        else:
            client.table("ingresos").insert({
                "user_id": user_id,
                "categoria_id": cat_id,
                "monto": str(monto),
                "moneda": "DOP",
                "descripcion": "Retiro de fondo de emergencia",
                "fecha": hoy,
            }).execute()
    except Exception as exc:
        log.warning("Could not create linked transaction for fondo emergencia: %s", exc)


def depositar(user_jwt: str, user_id: str, monto: float) -> dict:
    client = get_user_client(user_jwt)
    fondo = get_or_none(user_jwt, user_id)
    if fondo is None:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    nuevo_monto = fondo["monto_actual"] + monto
    resultado = update_fondo(user_jwt, user_id, FondoEmergenciaUpdate(monto_actual=nuevo_monto))
    _crear_transaccion_fondo(client, user_id, "depositar", monto)
    return resultado


def retirar(user_jwt: str, user_id: str, monto: float) -> dict:
    client = get_user_client(user_jwt)
    fondo = get_or_none(user_jwt, user_id)
    if fondo is None:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    nuevo_monto = max(0.0, fondo["monto_actual"] - monto)
    resultado = update_fondo(user_jwt, user_id, FondoEmergenciaUpdate(monto_actual=nuevo_monto))
    _crear_transaccion_fondo(client, user_id, "retirar", monto)
    return resultado
