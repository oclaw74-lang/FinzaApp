from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error

# Normalización de frecuencias de suscripción a monto mensual equivalente
_FREQ_TO_MONTHLY: dict[str, float] = {
    "mensual": 1.0,
    "anual": 1.0 / 12.0,
    "semanal": 52.0 / 12.0,
    "trimestral": 1.0 / 3.0,
}


def _calc_cuota_mensual(
    monto_original: float,
    tasa_interes: float | None,
    plazo_meses: int | None,
) -> float:
    """French amortization formula. Returns 0.0 if insufficient data."""
    if not plazo_meses or plazo_meses <= 0:
        return 0.0
    if tasa_interes and tasa_interes > 0:
        r = tasa_interes / 100.0 / 12.0
        n = plazo_meses
        cuota = monto_original * (r * (1 + r) ** n) / ((1 + r) ** n - 1)
    else:
        cuota = monto_original / plazo_meses
    return round(cuota, 2)


def _crear_notif_deficit(
    client,
    user_id: str,
    mes: int,
    year: int,
    deficit: float,
    ingreso_esperado: float,
    egresos_proyectados: float,
) -> None:
    """Create a deficit prediction notification (idempotent 24h window)."""
    categoria = f"prediccion_deficit_{mes}_{year}"
    threshold = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    try:
        existing = (
            client.table("notificaciones")
            .select("id")
            .eq("user_id", user_id)
            .eq("categoria", categoria)
            .gte("created_at", threshold)
            .limit(1)
            .execute()
        )
        if existing.data:
            return
        client.table("notificaciones").insert(
            {
                "user_id": user_id,
                "tipo": "urgente",
                "categoria": categoria,
                "titulo": "Proyección de déficit este mes",
                "mensaje": (
                    f"Según tus datos, podrías terminar el mes con un déficit de "
                    f"${deficit:,.0f}. Ingreso esperado: ${ingreso_esperado:,.0f} | "
                    f"Egresos proyectados: ${egresos_proyectados:,.0f}."
                ),
            }
        ).execute()
    except Exception:
        pass  # Notification failure must never block the prediction response


def get_prediccion_mes(user_jwt: str, user_id: str) -> dict:
    """
    End-of-month financial projection enriched with full user financial data.

    Uses:
    - salario_neto from profile (or avg_ingresos_3m as fallback)
    - avg_egresos_3m: 3-month average monthly expenses
    - sum_cuotas_prestamos: monthly installment sum for active loans
    - sum_suscripciones: monthly-normalized active subscription costs
    - sum_compromisos_ahorro: required monthly contribution toward active savings goals
    """
    client = get_user_client(user_jwt)
    today = date.today()
    mes = today.month
    year = today.year
    dias_mes = monthrange(year, mes)[1]
    dias_transcurridos = today.day
    dias_restantes = dias_mes - dias_transcurridos

    fecha_inicio = f"{year}-{mes:02d}-01"
    fecha_fin = f"{year}-{mes:02d}-{dias_mes:02d}"

    # Build last 3 months as (year, month) tuples
    meses_3m: list[tuple[int, int]] = []
    for i in range(3):
        m = mes - i
        y = year
        if m <= 0:
            m += 12
            y -= 1
        meses_3m.append((y, m))

    # ------------------------------------------------------------------ #
    # Fetch current-month core data                                        #
    # ------------------------------------------------------------------ #
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
            .select("monto,categoria_id")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
            .execute()
        )
        presupuestos_r = (
            client.table("presupuestos")
            .select("monto_limite")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
        categorias_r = client.table("categorias").select("id,nombre,nombre_en").execute()

        # Profile — salary field
        profile_r = (
            client.table("profiles")
            .select("salario_neto")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        # Active loans (yo_debo) → monthly installments
        prestamos_r = (
            client.table("prestamos")
            .select("monto_original,tasa_interes,plazo_meses")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .eq("tipo", "yo_debo")
            .is_("deleted_at", "null")
            .execute()
        )

        # Active subscriptions
        suscripciones_r = (
            client.table("suscripciones")
            .select("monto,frecuencia")
            .eq("user_id", user_id)
            .eq("activa", True)
            .execute()
        )

        # Active savings goals → required monthly contribution
        metas_r = (
            client.table("metas_ahorro")
            .select("monto_objetivo,monto_actual,fecha_objetivo")
            .eq("user_id", user_id)
            .eq("estado", "activa")
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    # ------------------------------------------------------------------ #
    # 3-month historical averages                                          #
    # ------------------------------------------------------------------ #
    total_egresos_3m = 0.0
    total_ingresos_3m = 0.0
    try:
        for y_m, m_m in meses_3m:
            dm = monthrange(y_m, m_m)[1]
            fi = f"{y_m}-{m_m:02d}-01"
            ff = f"{y_m}-{m_m:02d}-{dm:02d}"
            eg_3 = (
                client.table("egresos")
                .select("monto")
                .eq("user_id", user_id)
                .gte("fecha", fi)
                .lte("fecha", ff)
                .execute()
            )
            ing_3 = (
                client.table("ingresos")
                .select("monto")
                .eq("user_id", user_id)
                .gte("fecha", fi)
                .lte("fecha", ff)
                .execute()
            )
            total_egresos_3m += sum(float(e["monto"]) for e in (eg_3.data or []))
            total_ingresos_3m += sum(float(i["monto"]) for i in (ing_3.data or []))
    except APIError:
        pass  # Historical data unavailable; proceed with 0

    avg_egresos_3m = total_egresos_3m / 3.0
    avg_ingresos_3m = total_ingresos_3m / 3.0

    # ------------------------------------------------------------------ #
    # Derived financial figures                                            #
    # ------------------------------------------------------------------ #
    # Salary from profile (or fallback to 3-month income average)
    salario_neto: float | None = None
    if profile_r and profile_r.data:
        s = profile_r.data.get("salario_neto")
        if s is not None:
            try:
                salario_neto = float(s)
            except (ValueError, TypeError):
                pass

    # Monthly loan installments (French amortization)
    sum_cuotas_prestamos = 0.0
    for p in (prestamos_r.data or []):
        mo = float(p["monto_original"]) if p.get("monto_original") else 0.0
        tasa = float(p["tasa_interes"]) if p.get("tasa_interes") else None
        plazo = int(p["plazo_meses"]) if p.get("plazo_meses") else None
        sum_cuotas_prestamos += _calc_cuota_mensual(mo, tasa, plazo)

    # Monthly-normalized subscription costs
    sum_suscripciones = 0.0
    for s in (suscripciones_r.data or []):
        monto = float(s["monto"]) if s.get("monto") else 0.0
        freq = s.get("frecuencia", "mensual")
        factor = _FREQ_TO_MONTHLY.get(freq, 1.0)
        sum_suscripciones += monto * factor

    # Required monthly contribution toward active savings goals
    sum_compromisos_ahorro = 0.0
    for meta in (metas_r.data or []):
        obj = float(meta["monto_objetivo"]) if meta.get("monto_objetivo") else 0.0
        actual = float(meta["monto_actual"]) if meta.get("monto_actual") else 0.0
        restante = max(obj - actual, 0.0)
        if restante <= 0:
            continue
        if meta.get("fecha_objetivo"):
            try:
                fecha_obj = date.fromisoformat(str(meta["fecha_objetivo"])[:10])
                meses_restantes = max(
                    (fecha_obj.year - today.year) * 12
                    + (fecha_obj.month - today.month),
                    1,
                )
                sum_compromisos_ahorro += restante / meses_restantes
            except (ValueError, TypeError):
                pass
        # Metas without target date do not add a fixed monthly commitment

    # ------------------------------------------------------------------ #
    # Current month calculations (backward-compatible projection)          #
    # ------------------------------------------------------------------ #
    total_ingresos = sum(float(r["monto"]) for r in (ingresos_r.data or []))
    egresos_data = egresos_r.data or []
    total_egresos = sum(float(e["monto"]) for e in egresos_data)

    gasto_diario = total_egresos / dias_transcurridos if dias_transcurridos > 0 else 0.0
    egreso_proyectado_lineal = gasto_diario * dias_mes  # original linear projection
    saldo_proyectado = total_ingresos - egreso_proyectado_lineal

    # ------------------------------------------------------------------ #
    # Enriched projection                                                  #
    # ------------------------------------------------------------------ #
    ingreso_esperado = salario_neto if salario_neto else avg_ingresos_3m
    gasto_esperado = (
        avg_egresos_3m
        + sum_cuotas_prestamos
        + sum_suscripciones
        + sum_compromisos_ahorro
    )

    # Projected egresos = accrued this month + (3m daily avg × remaining days)
    avg_diario_3m = avg_egresos_3m / dias_mes if dias_mes > 0 else 0.0
    egresos_proyectados = total_egresos + (avg_diario_3m * dias_restantes)
    balance_final = ingreso_esperado - egresos_proyectados

    # ------------------------------------------------------------------ #
    # Deficit notification                                                 #
    # ------------------------------------------------------------------ #
    if balance_final < 0:
        _crear_notif_deficit(
            client,
            user_id,
            mes,
            year,
            abs(balance_final),
            ingreso_esperado,
            egresos_proyectados,
        )

    # ------------------------------------------------------------------ #
    # Budget projection if limits respected                                #
    # ------------------------------------------------------------------ #
    presupuestos = presupuestos_r.data or []
    if presupuestos:
        suma_limites = sum(float(p["monto_limite"]) for p in presupuestos)
        saldo_si_presupuesto: float | None = total_ingresos - suma_limites
    else:
        saldo_si_presupuesto = None

    # ------------------------------------------------------------------ #
    # Category with highest spending impact                                #
    # ------------------------------------------------------------------ #
    categoria_mayor_impacto = None
    if egresos_data and total_egresos > 0:
        cat_info = {str(c["id"]): c for c in (categorias_r.data or [])}
        gasto_por_cat: dict[str, float] = {}
        for e in egresos_data:
            cat_id = str(e["categoria_id"]) if e.get("categoria_id") else "sin_categoria"
            gasto_por_cat[cat_id] = gasto_por_cat.get(cat_id, 0.0) + float(e["monto"])

        if gasto_por_cat:
            max_cat_id = max(gasto_por_cat, key=lambda k: gasto_por_cat[k])
            max_monto = gasto_por_cat[max_cat_id]
            cat = cat_info.get(max_cat_id, {})
            nombre = cat.get("nombre", "Otros")
            nombre_en = cat.get("nombre_en")
            porcentaje = (max_monto / total_egresos) * 100.0
            categoria_mayor_impacto = {
                "nombre": nombre,
                "nombre_en": nombre_en,
                "monto": max_monto,
                "porcentaje_del_total": round(porcentaje, 1),
            }

    # ------------------------------------------------------------------ #
    # Suggestion                                                           #
    # ------------------------------------------------------------------ #
    if categoria_mayor_impacto and total_egresos > 0:
        ahorro_potencial = categoria_mayor_impacto["monto"] * 0.20
        sugerencia_tipo = "reducir"
        sugerencia_datos = {
            "categoria": categoria_mayor_impacto["nombre"],
            "categoria_en": categoria_mayor_impacto.get("nombre_en"),
            "monto": round(ahorro_potencial, 0),
        }
    elif saldo_proyectado >= 0:
        sugerencia_tipo = "positivo"
        sugerencia_datos = None
    else:
        sugerencia_tipo = "negativo"
        sugerencia_datos = None

    return {
        # Backward-compatible fields
        "saldo_proyectado": round(saldo_proyectado, 2),
        "saldo_si_presupuesto": (
            round(saldo_si_presupuesto, 2) if saldo_si_presupuesto is not None else None
        ),
        "es_negativa": saldo_proyectado < 0,
        "categoria_mayor_impacto": categoria_mayor_impacto,
        "sugerencia_tipo": sugerencia_tipo,
        "sugerencia_datos": sugerencia_datos,
        "dias_restantes": dias_restantes,
        "gasto_diario_promedio": round(gasto_diario, 2),
        # Enriched fields (Fix #19)
        "ingreso_esperado": round(ingreso_esperado, 2),
        "gasto_esperado": round(gasto_esperado, 2),
        "balance_final": round(balance_final, 2),
        "avg_egresos_3m": round(avg_egresos_3m, 2),
        "sum_cuotas_prestamos": round(sum_cuotas_prestamos, 2),
        "sum_suscripciones": round(sum_suscripciones, 2),
        "sum_compromisos_ahorro": round(sum_compromisos_ahorro, 2),
        "egresos_proyectados": round(egresos_proyectados, 2),
    }

