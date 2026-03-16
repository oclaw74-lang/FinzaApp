from calendar import monthrange
from datetime import date
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def get_prediccion_mes(user_jwt: str, user_id: str) -> dict:
    """Linear projection of end-of-month balance based on current daily spending rate."""
    client = get_user_client(user_jwt)
    today = date.today()
    mes = today.month
    year = today.year
    dias_mes = monthrange(year, mes)[1]
    dias_transcurridos = today.day
    dias_restantes = dias_mes - dias_transcurridos

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
            .select("monto,categoria_id")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
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
        categorias_r = client.table("categorias").select("id,nombre").execute()
    except APIError as e:
        _handle_api_error(e)

    total_ingresos = sum(float(r["monto"]) for r in (ingresos_r.data or []))
    egresos_data = egresos_r.data or []
    total_egresos = sum(float(e["monto"]) for e in egresos_data)

    # Daily spending rate and linear projection
    gasto_diario = total_egresos / dias_transcurridos if dias_transcurridos > 0 else 0.0
    egreso_proyectado = gasto_diario * dias_mes
    saldo_proyectado = total_ingresos - egreso_proyectado

    # Balance if budgets are respected
    presupuestos = presupuestos_r.data or []
    if presupuestos:
        suma_limites = sum(float(p["monto_limite"]) for p in presupuestos)
        saldo_si_presupuesto: float | None = total_ingresos - suma_limites
    else:
        saldo_si_presupuesto = None

    # Category with highest spending impact
    categoria_mayor_impacto = None
    if egresos_data and total_egresos > 0:
        cat_nombres = {str(c["id"]): c["nombre"] for c in (categorias_r.data or [])}
        gasto_por_cat: dict[str, float] = {}
        for e in egresos_data:
            cat_id = str(e["categoria_id"]) if e.get("categoria_id") else "sin_categoria"
            gasto_por_cat[cat_id] = gasto_por_cat.get(cat_id, 0.0) + float(e["monto"])

        if gasto_por_cat:
            max_cat_id = max(gasto_por_cat, key=lambda k: gasto_por_cat[k])
            max_monto = gasto_por_cat[max_cat_id]
            nombre = cat_nombres.get(max_cat_id, "Otros")
            porcentaje = (max_monto / total_egresos) * 100.0
            categoria_mayor_impacto = {
                "nombre": nombre,
                "monto": max_monto,
                "porcentaje_del_total": round(porcentaje, 1),
            }

    # Generate suggestion
    if categoria_mayor_impacto and total_egresos > 0:
        ahorro_potencial = categoria_mayor_impacto["monto"] * 0.20
        sugerencia = (
            f"Si reduces {categoria_mayor_impacto['nombre']} un 20%, "
            f"ahorras ${ahorro_potencial:.0f} este mes"
        )
    elif saldo_proyectado >= 0:
        sugerencia = "Tu proyección de saldo es positiva. ¡Buen ritmo!"
    else:
        sugerencia = "Tu gasto proyectado supera tus ingresos. Considera reducir gastos."

    return {
        "saldo_proyectado": round(saldo_proyectado, 2),
        "saldo_si_presupuesto": (
            round(saldo_si_presupuesto, 2) if saldo_si_presupuesto is not None else None
        ),
        "es_negativa": saldo_proyectado < 0,
        "categoria_mayor_impacto": categoria_mayor_impacto,
        "sugerencia": sugerencia,
        "dias_restantes": dias_restantes,
        "gasto_diario_promedio": round(gasto_diario, 2),
    }
