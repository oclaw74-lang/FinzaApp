from calendar import monthrange
from datetime import date, datetime, timezone, timedelta
from postgrest import APIError
from fastapi import HTTPException

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def _calc_proximo_pago_simple(
    fecha_prestamo: date,
    pagos: list[dict],
    plazo_meses: int,
) -> date | None:
    """Estimate next payment date. Used internally by notification triggers."""
    dia_pago = fecha_prestamo.day
    today = date.today()
    if pagos:
        ultimo_str = pagos[0].get("fecha", "")[:10] if pagos else ""
        if ultimo_str:
            ultimo = date.fromisoformat(ultimo_str)
            m, y = ultimo.month + 1, ultimo.year
            if m > 12:
                m -= 12
                y += 1
            return date(y, m, min(dia_pago, monthrange(y, m)[1]))
    m, y = fecha_prestamo.month + 1, fecha_prestamo.year
    if m > 12:
        m -= 12
        y += 1
    next_date = date(y, m, min(dia_pago, monthrange(y, m)[1]))
    while next_date < today:
        m, y = next_date.month + 1, next_date.year
        if m > 12:
            m -= 12
            y += 1
        next_date = date(y, m, min(dia_pago, monthrange(y, m)[1]))
    return next_date


def get_notificaciones(
    user_jwt: str, user_id: str, solo_no_leidas: bool = False
) -> list[dict]:
    """List notifications for user, newest first."""
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("notificaciones")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
        )
        if solo_no_leidas:
            query = query.eq("leida", False)
        result = query.execute()
    except APIError as e:
        _handle_api_error(e)
    return result.data or []


def marcar_leida(user_jwt: str, user_id: str, notificacion_id: str) -> dict:
    """Mark a single notification as read."""
    client = get_user_client(user_jwt)
    try:
        result = (
            client.table("notificaciones")
            .update({"leida": True})
            .eq("id", notificacion_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    if not result.data:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return result.data[0]


def marcar_todas_leidas(user_jwt: str, user_id: str) -> dict:
    """Mark all notifications as read for the user."""
    client = get_user_client(user_jwt)
    try:
        result = (
            client.table("notificaciones")
            .update({"leida": True})
            .eq("user_id", user_id)
            .eq("leida", False)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    count = len(result.data or [])
    return {"actualizadas": count}


def eliminar_notificacion(user_jwt: str, user_id: str, notificacion_id: str) -> None:
    """Delete a notification."""
    client = get_user_client(user_jwt)
    try:
        result = (
            client.table("notificaciones")
            .delete()
            .eq("id", notificacion_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    if not result.data:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")


def _ya_existe_notificacion_reciente(
    client, user_id: str, categoria: str, horas: int = 24
) -> bool:
    """Check if a notification for the same category was created in the last N hours."""
    threshold = (datetime.now(timezone.utc) - timedelta(hours=horas)).isoformat()
    try:
        result = (
            client.table("notificaciones")
            .select("id")
            .eq("user_id", user_id)
            .eq("categoria", categoria)
            .gte("created_at", threshold)
            .limit(1)
            .execute()
        )
    except APIError:
        return False
    return bool(result.data)


def _crear_notificacion(
    client,
    user_id: str,
    tipo: str,
    categoria: str,
    titulo: str,
    mensaje: str,
) -> bool:
    """Create a notification if not already created recently. Returns True if created."""
    if _ya_existe_notificacion_reciente(client, user_id, categoria):
        return False
    try:
        client.table("notificaciones").insert(
            {
                "user_id": user_id,
                "tipo": tipo,
                "categoria": categoria,
                "titulo": titulo,
                "mensaje": mensaje,
            }
        ).execute()
        return True
    except APIError:
        return False


def generar_notificaciones(user_jwt: str, user_id: str) -> dict:
    """
    Evaluate triggers and create smart notifications. Idempotent (24h window).

    Triggers:
    1. Budget at 80%+ → urgente / presupuesto_{cat_id}
    2. Score > 80 (no logro today) → logro / motivacion
    3. Loan due in ≤3 days → urgente / recordatorio_prestamo_{id}
    4. Day 25 of month → emergency fund reminder → informativa / recordatorio_emergencia
    """
    client = get_user_client(user_jwt)
    today = date.today()
    generadas = 0

    # --- Trigger 1: Presupuestos al 80%+ ---
    try:
        presupuestos_r = (
            client.table("presupuestos")
            .select("monto_limite,categoria_id")
            .eq("user_id", user_id)
            .eq("mes", today.month)
            .eq("year", today.year)
            .execute()
        )
        dias_mes = monthrange(today.year, today.month)[1]
        fecha_inicio = f"{today.year}-{today.month:02d}-01"
        fecha_fin = f"{today.year}-{today.month:02d}-{dias_mes:02d}"
        egresos_r = (
            client.table("egresos")
            .select("monto,categoria_id,fecha")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
            .execute()
        )
        categorias_r = client.table("categorias").select("id,nombre").execute()
    except APIError:
        presupuestos_r = type("_R", (), {"data": []})()
        egresos_r = type("_R", (), {"data": []})()
        categorias_r = type("_R", (), {"data": []})()

    cat_nombres = {str(c["id"]): c["nombre"] for c in (categorias_r.data or [])}
    gasto_por_cat: dict[str, float] = {}
    for e in (egresos_r.data or []):
        cat_id = str(e["categoria_id"]) if e.get("categoria_id") else "sin_categoria"
        gasto_por_cat[cat_id] = gasto_por_cat.get(cat_id, 0.0) + float(e["monto"])

    for p in (presupuestos_r.data or []):
        limite = float(p["monto_limite"])
        if limite <= 0:
            continue
        cat_id = str(p["categoria_id"])
        gasto = gasto_por_cat.get(cat_id, 0.0)
        porcentaje = (gasto / limite) * 100
        if porcentaje >= 80:
            nombre_cat = cat_nombres.get(cat_id, "tu categoría")
            pct = int(porcentaje)
            titulo = f"Presupuesto de {nombre_cat} al {pct}%"
            mensaje = (
                f"Has usado el {pct}% de tu presupuesto para {nombre_cat}. "
                f"Llevas ${gasto:.0f} de ${limite:.0f} este mes."
            )
            if _crear_notificacion(
                client, user_id, "urgente", f"presupuesto_{cat_id}", titulo, mensaje
            ):
                generadas += 1

    # --- Trigger 3 / 7: Préstamos con próximo pago en ≤7 días ---
    try:
        prestamos_activos_r = (
            client.table("prestamos")
            .select(
                "id,descripcion,persona,monto_pendiente,fecha_prestamo,"
                "fecha_vencimiento,plazo_meses,tasa_interes"
            )
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .is_("deleted_at", "null")
            .execute()
        )
        pagos_r_all: dict[str, list[dict]] = {}
        for p in (prestamos_activos_r.data or []):
            pagos_resp = (
                client.table("pagos_prestamo")
                .select("fecha")
                .eq("prestamo_id", p["id"])
                .order("fecha", desc=True)
                .limit(1)
                .execute()
            )
            pagos_r_all[p["id"]] = pagos_resp.data or []
    except APIError:
        prestamos_activos_r = type("_R", (), {"data": []})()
        pagos_r_all = {}

    for p in (prestamos_activos_r.data or []):
        plazo = int(p["plazo_meses"]) if p.get("plazo_meses") else None
        prox_pago = None
        if plazo:
            fecha_inicio_p = date.fromisoformat(p["fecha_prestamo"][:10])
            prox_pago = _calc_proximo_pago_simple(
                fecha_inicio_p, pagos_r_all.get(p["id"], []), plazo
            )
        elif p.get("fecha_vencimiento"):
            venc = date.fromisoformat(p["fecha_vencimiento"][:10])
            if venc >= today:
                prox_pago = venc

        if not prox_pago:
            continue
        dias = (prox_pago - today).days
        if 0 <= dias <= 7:
            desc = p.get("descripcion") or p.get("persona") or "préstamo"
            monto = float(p.get("monto_pendiente", 0))
            cat_key = f"prestamo_pago_{p['id']}"
            if dias == 0:
                tipo_n = "urgente"
                titulo = f"Pago de préstamo hoy: {desc}"
                mensaje = (
                    f"Hay un pago del préstamo '{desc}' programado para hoy. "
                    f"Pendiente: ${monto:.0f}."
                )
            else:
                tipo_n = "advertencia"
                titulo = f"Próximo pago: {desc}"
                mensaje = (
                    f"El préstamo '{desc}' tiene un pago en {dias} día(s). "
                    f"Monto pendiente: ${monto:.0f}."
                )
            if _crear_notificacion(client, user_id, tipo_n, cat_key, titulo, mensaje):
                generadas += 1

    # --- Trigger 4: Día 25 → recordatorio fondo de emergencia ---
    if today.day == 25:
        if _crear_notificacion(
            client,
            user_id,
            "informativa",
            "recordatorio_emergencia",
            "Revisa tu fondo de emergencia",
            "Fin de mes próximo. ¿Has aportado a tu fondo de emergencia este mes?",
        ):
            generadas += 1

    # --- Trigger 2: Score > 80 → logro ---
    try:
        from app.services.score import get_score

        score_result = get_score(user_jwt, user_id)
        if score_result["score"] > 80:
            if _crear_notificacion(
                client,
                user_id,
                "logro",
                "motivacion",
                "¡Excelente salud financiera!",
                f"Tu score financiero es {score_result['score']}/100. ¡Sigue así!",
            ):
                generadas += 1
    except Exception:
        pass  # Non-critical — score failure shouldn't block notifications

    # --- Trigger 5: Suscripciones próximas a cobro (≤7 días) ---
    try:
        fecha_limite_sus = (today + timedelta(days=7)).isoformat()
        suscripciones_r = (
            client.table("suscripciones")
            .select("id,nombre,monto,fecha_proximo_cobro")
            .eq("user_id", user_id)
            .eq("activa", True)
            .lte("fecha_proximo_cobro", fecha_limite_sus)
            .gte("fecha_proximo_cobro", today.isoformat())
            .execute()
        )
    except APIError:
        suscripciones_r = type("_R", (), {"data": []})()

    for s in (suscripciones_r.data or []):
        nombre = s.get("nombre", "suscripción")
        monto = float(s.get("monto", 0))
        fecha_cobro = s.get("fecha_proximo_cobro", "")[:10]
        dias = (date.fromisoformat(fecha_cobro) - today).days if fecha_cobro else 0

        cat_key = f"suscripcion_cobro_{s['id']}"
        if dias == 0:
            tipo_n = "urgente"
            titulo = f"Cobro hoy: {nombre}"
            mensaje = f"Se cobra hoy ${monto:.0f} por {nombre}."
        else:
            tipo_n = "advertencia"
            titulo = f"Próximo cobro: {nombre}"
            mensaje = f"{nombre} se cobra en {dias} día(s). Monto: ${monto:.0f}."

        if _crear_notificacion(client, user_id, tipo_n, cat_key, titulo, mensaje):
            generadas += 1

    # --- Trigger 6: Recurrentes mensuales próximos (≤7 días) ---
    try:
        recurrentes_r = (
            client.table("recurrentes")
            .select("id,descripcion,monto,frecuencia,dia_del_mes,fecha_inicio")
            .eq("user_id", user_id)
            .eq("activo", True)
            .eq("tipo", "egreso")
            .execute()
        )
    except APIError:
        recurrentes_r = type("_R", (), {"data": []})()

    for rec in (recurrentes_r.data or []):
        # Only alert mensual recurrentes with dia_del_mes set
        if rec.get("frecuencia") != "mensual" or not rec.get("dia_del_mes"):
            continue
        dia = int(rec["dia_del_mes"])
        try:
            prox = date(
                today.year,
                today.month,
                min(dia, monthrange(today.year, today.month)[1]),
            )
            if prox < today:
                m = today.month + 1
                y = today.year
                if m > 12:
                    m -= 12
                    y += 1
                prox = date(y, m, min(dia, monthrange(y, m)[1]))
        except ValueError:
            continue

        dias = (prox - today).days
        if 0 <= dias <= 7:
            desc = rec.get("descripcion", "recurrente")
            monto = float(rec.get("monto", 0))
            cat_key = f"recurrente_pago_{rec['id']}"
            if dias == 0:
                tipo_n = "urgente"
                titulo = f"Pago hoy: {desc}"
                mensaje = f"Tienes un pago recurrente hoy: {desc} por ${monto:.0f}."
            else:
                tipo_n = "advertencia"
                titulo = f"Pago próximo: {desc}"
                mensaje = f"{desc} vence en {dias} día(s). Monto: ${monto:.0f}."
            if _crear_notificacion(client, user_id, tipo_n, cat_key, titulo, mensaje):
                generadas += 1

    return {
        "generadas": generadas,
        "mensaje": f"Se generaron {generadas} notificación(es) nueva(s).",
    }
