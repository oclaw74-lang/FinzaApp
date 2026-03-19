from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error

# Proxy rate used for savings accounts in RD (annual %)
_TASA_AHORRO_PROXY = 4.0


def get_comparativa(user_jwt: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        prestamos = (
            client.table("prestamos")
            .select("*")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .execute()
        )
        metas = (
            client.table("metas_ahorro")
            .select("*")
            .eq("user_id", user_id)
            .eq("estado", "activa")
            .execute()
        )

        deudas = []
        total_costo = 0.0
        for p in prestamos.data or []:
            tasa = float(p.get("tasa_interes", 0) or 0)
            pendiente = float(p.get("monto_pendiente", 0) or 0)
            costo_mensual = pendiente * (tasa / 100 / 12)
            deudas.append(
                {
                    "nombre": p.get("descripcion") or p.get("prestamista", "Prestamo"),
                    "tipo": "deuda",
                    "monto": pendiente,
                    "tasa_anual": tasa,
                    "costo_o_rendimiento_mensual": round(costo_mensual, 2),
                }
            )
            total_costo += costo_mensual

        ahorros = []
        total_rendimiento = 0.0
        for m in metas.data or []:
            monto_actual = float(m.get("monto_actual", 0) or 0)
            rendimiento_mensual = monto_actual * (_TASA_AHORRO_PROXY / 100 / 12)
            ahorros.append(
                {
                    "nombre": m.get("nombre", "Meta de ahorro"),
                    "tipo": "ahorro",
                    "monto": monto_actual,
                    "tasa_anual": _TASA_AHORRO_PROXY,
                    "costo_o_rendimiento_mensual": round(rendimiento_mensual, 2),
                }
            )
            total_rendimiento += rendimiento_mensual

        diferencia = total_costo - total_rendimiento
        if diferencia > 0:
            recomendacion = (
                f"Tus deudas te cuestan RD${total_costo:.0f}/mes en intereses vs "
                f"RD${total_rendimiento:.0f}/mes que genera tu ahorro. "
                "Conviene priorizar el pago de deudas."
            )
        elif diferencia < -50:
            recomendacion = (
                f"Tu ahorro genera RD${total_rendimiento:.0f}/mes, mas que el costo de "
                f"tus deudas (RD${total_costo:.0f}/mes). Puedes continuar ahorrando."
            )
        else:
            recomendacion = (
                "El costo de tus deudas y el rendimiento de tu ahorro estan balanceados. "
                "Mantén ambos."
            )

        return {
            "deudas": deudas,
            "ahorros": ahorros,
            "total_costo_deuda": round(total_costo, 2),
            "total_rendimiento_ahorro": round(total_rendimiento, 2),
            "diferencia": round(diferencia, 2),
            "recomendacion": recomendacion,
        }
    except Exception as e:
        _handle_api_error(e)
