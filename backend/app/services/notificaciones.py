from datetime import date, datetime, timezone, timedelta
from postgrest import APIError
from fastapi import HTTPException

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


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
        egresos_r = (
            client.table("egresos")
            .select("monto,categoria_id")
            .eq("user_id", user_id)
            .eq("mes", today.month)
            .eq("year", today.year)
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

    # --- Trigger 3: Préstamos con vencimiento en ≤3 días ---
    try:
        fecha_limite = (today + timedelta(days=3)).isoformat()
        prestamos_r = (
            client.table("prestamos")
            .select("id,descripcion,fecha_vencimiento,monto_pendiente")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .lte("fecha_vencimiento", fecha_limite)
            .gte("fecha_vencimiento", today.isoformat())
            .execute()
        )
    except APIError:
        prestamos_r = type("_R", (), {"data": []})()

    for p in (prestamos_r.data or []):
        descripcion = p.get("descripcion", "un préstamo")
        monto = float(p.get("monto_pendiente", 0))
        cat_key = f"recordatorio_prestamo_{p['id']}"
        titulo = f"Vencimiento próximo: {descripcion}"
        mensaje = (
            f"El préstamo '{descripcion}' vence en los próximos 3 días. "
            f"Monto pendiente: ${monto:.0f}"
        )
        if _crear_notificacion(client, user_id, "urgente", cat_key, titulo, mensaje):
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

    return {
        "generadas": generadas,
        "mensaje": f"Se generaron {generadas} notificación(es) nueva(s).",
    }
