import math
from calendar import monthrange
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.prestamo import PagoPrestamoCreate, PrestamoCreate, PrestamoUpdate
from app.services.base import _handle_api_error


def _calc_cuota_mensual(
    monto_original: float,
    tasa_interes: float | None,
    plazo_meses: int | None,
) -> float | None:
    """French amortization formula. Returns None if insufficient data."""
    if not plazo_meses or plazo_meses <= 0:
        return None
    if tasa_interes and tasa_interes > 0:
        r = tasa_interes / 100 / 12
        n = plazo_meses
        cuota = monto_original * (r * (1 + r) ** n) / ((1 + r) ** n - 1)
    else:
        # No interest: simple division
        cuota = monto_original / plazo_meses
    return round(cuota, 2)


def _calc_proximo_pago(
    fecha_prestamo: date,
    pagos: list[dict],
    plazo_meses: int | None,
) -> date | None:
    """Estimate next payment date based on loan origination day."""
    if not plazo_meses:
        return None
    today = date.today()
    dia_pago = fecha_prestamo.day  # same day of month as loan start

    if pagos:
        ultimas_fechas = sorted(p["fecha"][:10] for p in pagos if p.get("fecha"))
        if ultimas_fechas:
            ultimo = datetime.strptime(ultimas_fechas[-1], "%Y-%m-%d").date()
            m = ultimo.month + 1
            y = ultimo.year
            if m > 12:
                m -= 12
                y += 1
            max_day = monthrange(y, m)[1]
            return date(y, m, min(dia_pago, max_day))

    # No payments yet: first payment is 1 month after start
    m = fecha_prestamo.month + 1
    y = fecha_prestamo.year
    if m > 12:
        m -= 12
        y += 1
    max_day = monthrange(y, m)[1]
    next_date = date(y, m, min(dia_pago, max_day))

    # Advance to future if already passed
    while next_date < today:
        m = next_date.month + 1
        y = next_date.year
        if m > 12:
            m -= 12
            y += 1
        max_day = monthrange(y, m)[1]
        next_date = date(y, m, min(dia_pago, max_day))

    return next_date


def _enrich_prestamo(row: dict) -> dict:
    """Add calculated fields: cuota_mensual, total_intereses, proximo_pago."""
    monto_orig = float(row.get("monto_original", 0))
    tasa = float(row["tasa_interes"]) if row.get("tasa_interes") else None
    plazo = int(row["plazo_meses"]) if row.get("plazo_meses") else None
    pagos = row.get("pagos", [])

    cuota = _calc_cuota_mensual(monto_orig, tasa, plazo)
    proximo = _calc_proximo_pago(
        datetime.strptime(row["fecha_prestamo"][:10], "%Y-%m-%d").date(),
        pagos,
        plazo,
    )
    total_int = round(cuota * plazo - monto_orig, 2) if cuota and plazo else None

    row["cuota_mensual"] = cuota
    row["total_intereses"] = total_int
    row["proximo_pago"] = proximo.isoformat() if proximo else None
    return row


def get_prestamos(
    user_jwt: str,
    user_id: str,
    tipo: str | None = None,
    estado: str | None = None,
) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("prestamos")
            .select("*")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
        )
        if tipo:
            query = query.eq("tipo", tipo)
        if estado:
            query = query.eq("estado", estado)

        response = query.execute()
        return response.data
    except APIError as e:
        _handle_api_error(e)
    return []


def create_prestamo(user_jwt: str, user_id: str, data: PrestamoCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_none=True)
    payload["user_id"] = user_id

    monto_original = Decimal(str(payload["monto_original"]))
    monto_ya_pagado = Decimal(str(payload.get("monto_ya_pagado", "0")))
    monto_pendiente = max(monto_original - monto_ya_pagado, Decimal("0"))

    payload["monto_original"] = str(monto_original)
    payload["monto_pendiente"] = str(monto_pendiente)
    payload["monto_ya_pagado"] = str(monto_ya_pagado)
    payload["fecha_prestamo"] = str(payload["fecha_prestamo"])
    if payload.get("fecha_vencimiento"):
        payload["fecha_vencimiento"] = str(payload["fecha_vencimiento"])
    if "tasa_interes" in payload:
        payload["tasa_interes"] = str(payload["tasa_interes"])

    try:
        response = client.table("prestamos").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(
            status_code=500, detail="Prestamo no encontrado tras insercion."
        )
    except APIError as e:
        _handle_api_error(e)
    return {}


def get_prestamo(user_jwt: str, user_id: str, prestamo_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("prestamos")
            .select("*")
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not response.data:
            return None

        prestamo = response.data

        pagos_response = (
            client.table("pagos_prestamo")
            .select("*")
            .eq("prestamo_id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("fecha", desc=True)
            .execute()
        )
        prestamo["pagos"] = pagos_response.data or []
        prestamo = _enrich_prestamo(prestamo)
        return prestamo
    except APIError as e:
        _handle_api_error(e)
    return None


def update_prestamo(
    user_jwt: str, user_id: str, prestamo_id: str, data: PrestamoUpdate
) -> dict | None:
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_unset=True)

    if not payload:
        raise HTTPException(status_code=422, detail="No hay campos para actualizar.")

    if "fecha_vencimiento" in payload and payload["fecha_vencimiento"]:
        payload["fecha_vencimiento"] = str(payload["fecha_vencimiento"])
    if "tasa_interes" in payload and payload["tasa_interes"] is not None:
        payload["tasa_interes"] = str(payload["tasa_interes"])

    try:
        response = (
            client.table("prestamos")
            .update(payload)
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        return response.data[0] if response.data else None
    except IndexError:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    except APIError as e:
        _handle_api_error(e)
    return None


def delete_prestamo(user_jwt: str, user_id: str, prestamo_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("prestamos")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    except APIError as e:
        _handle_api_error(e)
    return {}


def get_pagos(
    user_jwt: str, user_id: str, prestamo_id: str
) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        prestamo_check = (
            client.table("prestamos")
            .select("id")
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not prestamo_check.data:
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")

        response = (
            client.table("pagos_prestamo")
            .select("*")
            .eq("prestamo_id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("fecha", desc=True)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return []


def registrar_pago(
    user_jwt: str,
    user_id: str,
    prestamo_id: str,
    data: PagoPrestamoCreate,
) -> dict:
    client = get_user_client(user_jwt)
    try:
        result = client.rpc(
            "registrar_pago_prestamo",
            {
                "p_prestamo_id": prestamo_id,
                "p_user_id": user_id,
                "p_monto": str(data.monto),
                "p_fecha": str(data.fecha),
                "p_notas": data.notas,
            },
        ).execute()

        if not result.data:
            raise HTTPException(
                status_code=500, detail="Error al registrar el pago."
            )
    except HTTPException:
        raise
    except APIError as e:
        msg = str(e.message) if e.message else ""
        if "no encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
        if "no esta activo" in msg.lower():
            raise HTTPException(
                status_code=400, detail="El prestamo no esta activo."
            )
        if "excede el pendiente" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="El monto del pago excede el monto pendiente.",
            )
        _handle_api_error(e)
        return {}

    # Auto-create egreso to reflect the payment in the user's balance
    try:
        # Extract pago_id from RPC result for traceability
        pago_id = result.data.get("pago_id") if isinstance(result.data, dict) else None

        prestamo_r = (
            client.table("prestamos")
            .select("persona")
            .eq("id", prestamo_id)
            .maybe_single()
            .execute()
        )
        prestamo_persona = (
            prestamo_r.data["persona"]
            if (prestamo_r and prestamo_r.data)
            else "prestamo"
        )

        cat_r = (
            client.table("categorias")
            .select("id")
            .eq("nombre", "Otros Egresos")
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        cat_id = cat_r.data[0]["id"] if cat_r.data else None

        egreso_payload: dict = {
            "user_id": user_id,
            "monto": str(data.monto),
            "moneda": "DOP",
            "descripcion": f"Pago prestamo: {prestamo_persona}",
            "metodo_pago": "transferencia",
            "fecha": str(data.fecha),
            "categoria_id": cat_id,
        }
        if data.notas:
            egreso_payload["notas"] = data.notas
        if pago_id:
            egreso_payload["pago_prestamo_id"] = str(pago_id)

        client.table("egresos").insert(egreso_payload).execute()
    except Exception:
        pass  # Do not fail the payment if egreso creation fails (MVP)

    return result.data


def delete_pago(
    user_jwt: str, user_id: str, prestamo_id: str, pago_id: str
) -> dict:
    client = get_user_client(user_jwt)
    try:
        pago_response = (
            client.table("pagos_prestamo")
            .select("*")
            .eq("id", pago_id)
            .eq("prestamo_id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not pago_response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        pago = pago_response.data
        monto_pago = Decimal(str(pago["monto"]))

        soft_delete_response = (
            client.table("pagos_prestamo")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", pago_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not soft_delete_response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        prestamo_response = (
            client.table("prestamos")
            .select("monto_pendiente, monto_original, estado")
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not prestamo_response.data:
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")

        prestamo = prestamo_response.data
        nuevo_pendiente = Decimal(str(prestamo["monto_pendiente"])) + monto_pago
        monto_original = Decimal(str(prestamo["monto_original"]))

        if nuevo_pendiente > monto_original:
            nuevo_pendiente = monto_original

        nuevo_estado = "activo" if nuevo_pendiente > 0 else "pagado"

        client.table("prestamos").update(
            {
                "monto_pendiente": str(nuevo_pendiente),
                "estado": nuevo_estado,
            }
        ).eq("id", prestamo_id).eq("user_id", user_id).execute()

        return soft_delete_response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def generar_tabla_amortizacion(
    monto_original: float,
    tasa_interes_anual: float | None,
    plazo_meses: int,
    fecha_inicio: date,
    pagos_registrados: list[dict],
) -> list[dict]:
    """
    Generate French amortization schedule.

    pagos_registrados: list of payment records with numero_cuota,
                       monto_capital, monto_interes, monto, fecha.
    Returns one row per installment with projected vs. actual data.
    """
    if not plazo_meses or plazo_meses <= 0:
        return []

    tasa_mensual = (tasa_interes_anual or 0) / 100.0 / 12.0
    saldo = float(monto_original)

    if tasa_mensual > 0:
        cuota = saldo * (tasa_mensual * math.pow(1 + tasa_mensual, plazo_meses)) / (
            math.pow(1 + tasa_mensual, plazo_meses) - 1
        )
    else:
        cuota = saldo / plazo_meses

    pagos_por_cuota: dict[int, dict] = {
        p["numero_cuota"]: p
        for p in pagos_registrados
        if p.get("numero_cuota") is not None
    }

    tabla: list[dict] = []

    for i in range(1, plazo_meses + 1):
        # Compute estimated payment date: fecha_inicio + i months (manual, no dateutil)
        year = fecha_inicio.year
        month = fecha_inicio.month + i
        while month > 12:
            month -= 12
            year += 1
        max_day = monthrange(year, month)[1]
        dia = min(fecha_inicio.day, max_day)
        fecha_estimada = date(year, month, dia)

        interes = round(saldo * tasa_mensual, 2)
        capital = round(cuota - interes, 2)

        # Clamp last installment to remaining balance
        if capital > saldo or i == plazo_meses:
            capital = round(saldo, 2)
            cuota_real = capital + interes
        else:
            cuota_real = round(cuota, 2)

        saldo = max(round(saldo - capital, 2), 0)

        pago_real = pagos_por_cuota.get(i)
        tabla.append({
            "numero": i,
            "fecha_estimada": str(fecha_estimada),
            "cuota": cuota_real,
            "capital": capital,
            "interes": interes,
            "saldo_restante": saldo,
            "pagado": pago_real is not None,
            "pago_real": {
                "monto": float(pago_real.get("monto", 0)),
                "capital": float(pago_real.get("monto_capital") or 0),
                "interes": float(pago_real.get("monto_interes") or 0),
                "fecha": pago_real.get("fecha"),
            } if pago_real else None,
        })

    return tabla


def get_resumen(user_jwt: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("prestamos")
            .select("tipo, estado, monto_original, monto_pendiente")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        prestamos = response.data or []

        me_deben_activos = [
            p for p in prestamos if p["tipo"] == "me_deben" and p["estado"] == "activo"
        ]
        yo_debo_activos = [
            p for p in prestamos if p["tipo"] == "yo_debo" and p["estado"] == "activo"
        ]

        def sumar(lista: list[dict], campo: str) -> Decimal:
            return sum(Decimal(str(p[campo])) for p in lista)

        return {
            "total_me_deben": float(sumar(me_deben_activos, "monto_pendiente")),
            "total_yo_debo": float(sumar(yo_debo_activos, "monto_pendiente")),
            "cantidad_activos": sum(1 for p in prestamos if p["estado"] == "activo"),
            "cantidad_vencidos": sum(1 for p in prestamos if p["estado"] == "vencido"),
        }
    except APIError as e:
        _handle_api_error(e)
    return {}
