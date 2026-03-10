from decimal import Decimal

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.meta_ahorro import ContribucionMetaCreate, MetaAhorroCreate, MetaAhorroUpdate
from app.services.base import _handle_api_error


def get_metas(user_jwt: str, estado: str | None = None) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("metas_ahorro")
            .select("*")
            .order("created_at", desc=True)
        )
        if estado:
            query = query.eq("estado", estado)

        response = query.execute()
        return response.data or []
    except APIError as e:
        _handle_api_error(e)
    return []


def get_meta_by_id(user_jwt: str, meta_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("metas_ahorro")
            .select("*")
            .eq("id", meta_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Meta no encontrada.")
        return response.data
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def create_meta(user_jwt: str, user_id: str, data: MetaAhorroCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = data.model_dump()
    payload["user_id"] = user_id
    payload["monto_objetivo"] = str(payload["monto_objetivo"])
    payload["fecha_inicio"] = str(payload["fecha_inicio"])
    if payload.get("fecha_objetivo"):
        payload["fecha_objetivo"] = str(payload["fecha_objetivo"])

    try:
        response = client.table("metas_ahorro").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(
            status_code=500, detail="Meta no encontrada tras insercion."
        )
    except APIError as e:
        _handle_api_error(e)
    return {}


def update_meta(user_jwt: str, meta_id: str, data: MetaAhorroUpdate) -> dict:
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_unset=True)

    if not payload:
        raise HTTPException(status_code=422, detail="No hay campos para actualizar.")

    if "monto_objetivo" in payload and payload["monto_objetivo"] is not None:
        payload["monto_objetivo"] = str(payload["monto_objetivo"])
    if "fecha_objetivo" in payload and payload["fecha_objetivo"] is not None:
        payload["fecha_objetivo"] = str(payload["fecha_objetivo"])

    try:
        response = (
            client.table("metas_ahorro")
            .update(payload)
            .eq("id", meta_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Meta no encontrada.")
        return response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def delete_meta(user_jwt: str, meta_id: str) -> None:
    client = get_user_client(user_jwt)
    try:
        # Verificar si tiene contribuciones antes de eliminar
        contribuciones_check = (
            client.table("contribuciones_meta")
            .select("id")
            .eq("meta_id", meta_id)
            .limit(1)
            .execute()
        )
        if contribuciones_check.data:
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar una meta con contribuciones registradas.",
            )

        response = (
            client.table("metas_ahorro")
            .delete()
            .eq("id", meta_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Meta no encontrada.")
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)


def get_contribuciones(user_jwt: str, meta_id: str) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        # Verificar que la meta existe (y pertenece al usuario via RLS)
        meta_check = (
            client.table("metas_ahorro")
            .select("id")
            .eq("id", meta_id)
            .maybe_single()
            .execute()
        )
        if not meta_check.data:
            raise HTTPException(status_code=404, detail="Meta no encontrada.")

        response = (
            client.table("contribuciones_meta")
            .select("*")
            .eq("meta_id", meta_id)
            .order("fecha", desc=True)
            .execute()
        )
        return response.data or []
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return []


def agregar_contribucion(
    user_jwt: str,
    meta_id: str,
    data: ContribucionMetaCreate,
) -> dict:
    client = get_user_client(user_jwt)
    try:
        client.rpc(
            "agregar_contribucion_meta",
            {
                "p_meta_id": meta_id,
                "p_monto": float(data.monto),
                "p_tipo": data.tipo,
                "p_fecha": str(data.fecha),
                "p_notas": data.notas or "",
            },
        ).execute()

        # Obtener la contribucion recien insertada (la mas reciente de esa meta)
        contribucion_response = (
            client.table("contribuciones_meta")
            .select("*")
            .eq("meta_id", meta_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not contribucion_response.data:
            raise HTTPException(
                status_code=500, detail="Contribucion no encontrada tras insercion."
            )
        return contribucion_response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        msg = str(e.message) if e.message else ""
        if "no encontrada" in msg.lower() or "no pertenece" in msg.lower():
            raise HTTPException(status_code=404, detail="Meta no encontrada.")
        if "supera el monto actual" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="El monto de retiro supera el monto actual de la meta.",
            )
        _handle_api_error(e)
    return {}


def delete_contribucion(
    user_jwt: str, meta_id: str, contribucion_id: str
) -> None:
    client = get_user_client(user_jwt)
    try:
        # Verificar que la contribucion existe y pertenece a la meta
        check = (
            client.table("contribuciones_meta")
            .select("id, monto, tipo")
            .eq("id", contribucion_id)
            .eq("meta_id", meta_id)
            .maybe_single()
            .execute()
        )
        if not check.data:
            raise HTTPException(status_code=404, detail="Contribucion no encontrada.")

        contribucion = check.data
        monto = Decimal(str(contribucion["monto"]))
        tipo = contribucion["tipo"]

        # Eliminar contribucion
        client.table("contribuciones_meta").delete().eq("id", contribucion_id).execute()

        # Revertir el efecto en monto_actual de la meta
        meta_response = (
            client.table("metas_ahorro")
            .select("monto_actual, monto_objetivo, estado")
            .eq("id", meta_id)
            .maybe_single()
            .execute()
        )
        if not meta_response.data:
            raise HTTPException(status_code=404, detail="Meta no encontrada.")

        meta = meta_response.data
        monto_actual = Decimal(str(meta["monto_actual"]))

        if tipo == "deposito":
            nuevo_monto = max(Decimal("0"), monto_actual - monto)
        else:
            nuevo_monto = monto_actual + monto

        # Recalcular estado si corresponde
        monto_objetivo = Decimal(str(meta["monto_objetivo"]))
        nuevo_estado = meta["estado"]
        if meta["estado"] == "completada" and nuevo_monto < monto_objetivo:
            nuevo_estado = "activa"

        client.table("metas_ahorro").update(
            {
                "monto_actual": str(nuevo_monto),
                "estado": nuevo_estado,
            }
        ).eq("id", meta_id).execute()

    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)


def get_resumen(user_jwt: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("metas_ahorro")
            .select("estado, monto_actual, monto_objetivo")
            .execute()
        )
        metas = response.data or []

        activas = [m for m in metas if m["estado"] == "activa"]
        completadas = [m for m in metas if m["estado"] == "completada"]

        total_ahorrado = sum(Decimal(str(m["monto_actual"])) for m in metas)

        porcentajes = []
        for m in activas:
            objetivo = Decimal(str(m["monto_objetivo"]))
            actual = Decimal(str(m["monto_actual"]))
            if objetivo > 0:
                porcentajes.append(float(actual / objetivo) * 100)

        promedio = round(sum(porcentajes) / len(porcentajes), 2) if porcentajes else 0.0

        return {
            "total_ahorrado": str(total_ahorrado),
            "metas_activas": len(activas),
            "metas_completadas": len(completadas),
            "porcentaje_promedio_cumplimiento": promedio,
        }
    except APIError as e:
        _handle_api_error(e)
    return {}
