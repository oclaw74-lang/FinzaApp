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
    # --- Trigger 16: Encuesta pendiente ---
    try:
        survey_r = (
            client.table("survey_responses")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        if (survey_r.count or 0) == 0:
            if _crear_notificacion(
                client,
                user_id,
                "informativa",
                "encuesta_pendiente",
                "¡Ayúdanos a mejorar Finza!",
                "Tienes una encuesta pendiente. Solo toma 2 minutos y nos ayuda a mejorar la app para ti.",
            ):
                generadas += 1
    except Exception:
        pass

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
                tipo_n = "informativa"
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
            tipo_n = "informativa"
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
                tipo_n = "informativa"
                titulo = f"Pago próximo: {desc}"
                mensaje = f"{desc} vence en {dias} día(s). Monto: ${monto:.0f}."
            if _crear_notificacion(client, user_id, tipo_n, cat_key, titulo, mensaje):
                generadas += 1

    # --- Trigger 7: Meta sin contribución en ≥30 días ---
    try:
        metas_activas_r = (
            client.table("metas_ahorro")
            .select("id,nombre,monto_actual,monto_objetivo,created_at")
            .eq("user_id", user_id)
            .eq("estado", "activa")
            .execute()
        )
        for meta in (metas_activas_r.data or []):
            try:
                ultima_contrib_r = (
                    client.table("contribuciones_meta")
                    .select("fecha")
                    .eq("meta_id", meta["id"])
                    .order("fecha", desc=True)
                    .limit(1)
                    .execute()
                )
                ultimas = ultima_contrib_r.data or []
                if ultimas:
                    ultima_fecha = date.fromisoformat(ultimas[0]["fecha"][:10])
                    dias = (today - ultima_fecha).days
                    sin_contribucion = dias >= 30
                else:
                    created = date.fromisoformat(meta["created_at"][:10])
                    dias = (today - created).days
                    sin_contribucion = dias >= 30
                if sin_contribucion:
                    if _crear_notificacion(
                        client,
                        user_id,
                        "urgente",
                        f"meta_sin_contribucion_{meta['id']}",
                        f"Tu meta '{meta['nombre']}' necesita atención",
                        f"Llevas {dias} días sin contribuir a tu meta '{meta['nombre']}'. ¡Un pequeño aporte hoy marca la diferencia!",
                    ):
                        generadas += 1
            except Exception:
                pass
    except Exception:
        pass

    # --- Trigger 8: Meta próxima a vencer (≤15 días) ---
    try:
        metas_vencer_r = (
            client.table("metas_ahorro")
            .select("id,nombre,monto_actual,monto_objetivo,fecha_objetivo")
            .eq("user_id", user_id)
            .eq("estado", "activa")
            .not_.is_("fecha_objetivo", "null")
            .execute()
        )
        for meta in (metas_vencer_r.data or []):
            try:
                if not meta.get("fecha_objetivo"):
                    continue
                fecha_obj = date.fromisoformat(meta["fecha_objetivo"][:10])
                dias_restantes = (fecha_obj - today).days
                if dias_restantes < 0 or dias_restantes > 15:
                    continue
                monto_obj = float(meta["monto_objetivo"])
                monto_act = float(meta["monto_actual"])
                pct = round((monto_act / monto_obj) * 100) if monto_obj > 0 else 0
                if pct >= 90:
                    continue
                tipo_n = "urgente" if dias_restantes <= 7 else "informativa"
                fecha_str = fecha_obj.strftime("%d/%m/%Y")
                if _crear_notificacion(
                    client,
                    user_id,
                    tipo_n,
                    f"meta_por_vencer_{meta['id']}",
                    f"Tu meta '{meta['nombre']}' vence pronto",
                    f"Tu meta '{meta['nombre']}' vence el {fecha_str} y llevas el {pct}% completado. ¡Aún puedes lograrlo!",
                ):
                    generadas += 1
            except Exception:
                pass
    except Exception:
        pass

    # --- Trigger 9: Préstamo vencido ---
    try:
        prestamos_vencidos_r = (
            client.table("prestamos")
            .select("id,persona,monto_pendiente,fecha_vencimiento")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .eq("tipo", "yo_debo")
            .execute()
        )
        for prestamo in (prestamos_vencidos_r.data or []):
            try:
                if not prestamo.get("fecha_vencimiento"):
                    continue
                fecha_venc = date.fromisoformat(prestamo["fecha_vencimiento"][:10])
                if fecha_venc >= today:
                    continue
                monto_pendiente = float(prestamo.get("monto_pendiente", 0))
                fecha_str = fecha_venc.strftime("%d/%m/%Y")
                if _crear_notificacion(
                    client,
                    user_id,
                    "urgente",
                    f"prestamo_vencido_{prestamo['id']}",
                    f"Préstamo vencido con {prestamo['persona']}",
                    f"Tu préstamo con {prestamo['persona']} venció el {fecha_str}. Monto pendiente: ${monto_pendiente:,.0f}",
                ):
                    generadas += 1
            except Exception:
                pass
    except Exception:
        pass

    # --- Trigger 10: Fondo de emergencia crítico (<50%) ---
    try:
        fondo_r = (
            client.table("fondo_emergencia")
            .select("monto_actual,meta_meses")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        fondos = fondo_r.data or []
        if fondos:
            fondo = fondos[0]
            # Calcular promedio de egresos de los últimos 3 meses
            meses_calc = []
            for i in range(3):
                m = today.month - i
                y = today.year
                if m <= 0:
                    m += 12
                    y -= 1
                meses_calc.append((y, m))
            total_egresos_3m = 0.0
            for y_m, m_m in meses_calc:
                fi, ff = f"{y_m}-{m_m:02d}-01", f"{y_m}-{m_m:02d}-{monthrange(y_m, m_m)[1]:02d}"
                eg_r = (
                    client.table("egresos")
                    .select("monto")
                    .eq("user_id", user_id)
                    .gte("fecha", fi)
                    .lte("fecha", ff)
                    .execute()
                )
                total_egresos_3m += sum(float(e["monto"]) for e in (eg_r.data or []))
            promedio_mensual = total_egresos_3m / 3
            meta_calculada = fondo["meta_meses"] * promedio_mensual
            if promedio_mensual > 0 and meta_calculada > 0:
                pct = round((float(fondo["monto_actual"]) / meta_calculada) * 100)
                if pct < 50:
                    if _crear_notificacion(
                        client,
                        user_id,
                        "urgente",
                        "fondo_emergencia_critico",
                        "Tu fondo de emergencia está en riesgo",
                        f"Tu fondo de emergencia tiene solo el {pct}% de lo recomendado (${meta_calculada:,.0f} para {fondo['meta_meses']} meses). Ante cualquier imprevisto, estarías vulnerable.",
                    ):
                        generadas += 1
    except Exception:
        pass

    # --- Trigger 11: Gastos impulsivos detectados este mes ---
    try:
        mes_actual = today.month
        year_actual = today.year
        dias_mes = monthrange(year_actual, mes_actual)[1]
        fi_mes = f"{year_actual}-{mes_actual:02d}-01"
        ff_mes = f"{year_actual}-{mes_actual:02d}-{dias_mes:02d}"
        impulso_r = (
            client.table("egresos")
            .select("monto")
            .eq("user_id", user_id)
            .gte("fecha", fi_mes)
            .lte("fecha", ff_mes)
            .eq("is_impulso", True)
            .execute()
        )
        impulsos = impulso_r.data or []
        count_impulsos = len(impulsos)
        if count_impulsos >= 2:
            total_impulso = sum(float(e["monto"]) for e in impulsos)
            if _crear_notificacion(
                client,
                user_id,
                "informativa",
                f"gastos_impulso_{mes_actual}_{year_actual}",
                "Detectamos gastos impulsivos este mes",
                f"Este mes tienes {count_impulsos} gastos potencialmente impulsivos por un total de ${total_impulso:,.0f}. Revísalos en tus egresos para mejorar tu control financiero.",
            ):
                generadas += 1
    except Exception:
        pass

    # --- Trigger 12: Presupuesto excedido (>100%) ---
    try:
        presupuestos_exc_r = (
            client.table("presupuestos")
            .select("monto_limite,categoria_id")
            .eq("user_id", user_id)
            .eq("mes", today.month)
            .eq("year", today.year)
            .execute()
        )
        for p in (presupuestos_exc_r.data or []):
            try:
                limite = float(p["monto_limite"])
                if limite <= 0:
                    continue
                cat_id = str(p["categoria_id"])
                gasto = gasto_por_cat.get(cat_id, 0.0)
                porcentaje = (gasto / limite) * 100
                if porcentaje > 100:
                    exceso = gasto - limite
                    pct = int(porcentaje)
                    nombre_cat = cat_nombres.get(cat_id, "tu categoría")
                    if _crear_notificacion(
                        client,
                        user_id,
                        "urgente",
                        f"presupuesto_excedido_{cat_id}",
                        f"¡Presupuesto de {nombre_cat} excedido!",
                        f"Ya gastaste el {pct}% de tu presupuesto de {nombre_cat}. Llevas ${exceso:,.0f} sobre el límite este mes.",
                    ):
                        generadas += 1
            except Exception:
                pass
    except Exception:
        pass

    # --- Trigger 13: Score financiero crítico (<40) ---
    try:
        from app.services.score import get_score  # noqa: F811

        score_result_critico = get_score(user_jwt, user_id)
        if score_result_critico["score"] < 40:
            if _crear_notificacion(
                client,
                user_id,
                "urgente",
                "score_critico",
                "Tu salud financiera necesita atención urgente",
                f"Tu score financiero es {score_result_critico['score']}/100 (estado crítico). Revisa tus presupuestos, reduce gastos y apórtale a tu fondo de emergencia para mejorar.",
            ):
                generadas += 1
    except Exception:
        pass

    # --- Trigger 14: Educación pendiente (sin completar lecciones en ≥7 días) ---
    try:
        total_lecciones_r = (
            client.table("lecciones")
            .select("id", count="exact")
            .execute()
        )
        total_lecciones = total_lecciones_r.count or 0
        ultima_leccion_r = (
            client.table("user_lecciones")
            .select("completada_en")
            .eq("user_id", user_id)
            .eq("completada", True)
            .order("completada_en", desc=True)
            .limit(1)
            .execute()
        )
        completadas_r = (
            client.table("user_lecciones")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("completada", True)
            .execute()
        )
        lecciones_completadas = completadas_r.count or 0
        if total_lecciones > 0 and lecciones_completadas < total_lecciones:
            ultimas_lec = ultima_leccion_r.data or []
            debe_notificar = False
            if not ultimas_lec:
                debe_notificar = True
            else:
                ultima_completada_str = ultimas_lec[0].get("completada_en", "")
                if ultima_completada_str:
                    ultima_completada = datetime.fromisoformat(
                        ultima_completada_str.replace("Z", "+00:00")
                    )
                    dias_sin_leccion = (
                        datetime.now(timezone.utc) - ultima_completada
                    ).days
                    debe_notificar = dias_sin_leccion >= 7
                else:
                    debe_notificar = True
            if debe_notificar:
                if _crear_notificacion(
                    client,
                    user_id,
                    "informativa",
                    "educacion_pendiente",
                    "¿Cuándo fue tu última lección financiera?",
                    "Tienes lecciones de educación financiera pendientes en Finza. Solo 3 minutos al día pueden transformar tu relación con el dinero.",
                ):
                    generadas += 1
    except Exception:
        pass

    # --- Trigger 15: Balance negativo (egresos > ingresos este mes) ---
    try:
        mes_actual = today.month
        year_actual = today.year
        dias_mes = monthrange(year_actual, mes_actual)[1]
        fi_mes = f"{year_actual}-{mes_actual:02d}-01"
        ff_mes = f"{year_actual}-{mes_actual:02d}-{dias_mes:02d}"
        ingresos_mes_r = (
            client.table("ingresos")
            .select("monto")
            .eq("user_id", user_id)
            .gte("fecha", fi_mes)
            .lte("fecha", ff_mes)
            .execute()
        )
        egresos_mes_r = (
            client.table("egresos")
            .select("monto")
            .eq("user_id", user_id)
            .gte("fecha", fi_mes)
            .lte("fecha", ff_mes)
            .execute()
        )
        total_ingresos_mes = sum(float(i["monto"]) for i in (ingresos_mes_r.data or []))
        total_egresos_mes = sum(float(e["monto"]) for e in (egresos_mes_r.data or []))
        if total_egresos_mes > total_ingresos_mes and total_ingresos_mes > 0:
            diferencia = total_egresos_mes - total_ingresos_mes
            if _crear_notificacion(
                client,
                user_id,
                "urgente",
                f"balance_negativo_{mes_actual}_{year_actual}",
                "Estás gastando más de lo que ganas este mes",
                f"Este mes tus gastos (${total_egresos_mes:,.0f}) superan tus ingresos (${total_ingresos_mes:,.0f}) por ${diferencia:,.0f}. Revisa tus presupuestos.",
            ):
                generadas += 1
    except Exception:
        pass

    # --- Trigger 16: Encuesta pendiente ---
    try:
        survey_r = (
            client.table("survey_responses")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        if (survey_r.count or 0) == 0:
            if _crear_notificacion(
                client,
                user_id,
                "informativa",
                "encuesta_pendiente",
                "¡Ayúdanos a mejorar Finza!",
                "Tienes una encuesta pendiente. Solo toma 2 minutos y nos ayuda a mejorar la app para ti.",
            ):
                generadas += 1
    except Exception:
        pass

    return {
        "generadas": generadas,
        "mensaje": f"Se generaron {generadas} notificación(es) nueva(s).",
    }
