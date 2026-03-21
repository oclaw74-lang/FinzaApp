import uuid
from datetime import datetime, timezone
from typing import List

from app.core.supabase_client import get_user_client
from app.schemas.importar import FilaError, ImportResponse, TransaccionImport


def _find_categoria_id(client, user_id: str, nombre: str | None, tipo: str) -> str | None:
    """Find a category by name (case-insensitive). Returns None if not found."""
    tipo_cat = "egreso" if tipo == "egreso" else "ingreso"

    if nombre:
        response = (
            client.table("categorias")
            .select("id")
            .eq("user_id", user_id)
            .eq("tipo", tipo_cat)
            .ilike("nombre", nombre.strip())
            .maybe_single()
            .execute()
        )
        if response and response.data:
            return response.data["id"]

    # Fallback: get first available category of the correct type
    fallback = (
        client.table("categorias")
        .select("id")
        .eq("user_id", user_id)
        .eq("tipo", tipo_cat)
        .limit(1)
        .execute()
    )
    if fallback and fallback.data:
        return fallback.data[0]["id"]

    return None


def _is_duplicate(
    client, user_id: str, tipo: str, fecha: str, monto: float, descripcion: str | None
) -> bool:
    """Check if a transaction with same date+monto+descripcion already exists."""
    table = "egresos" if tipo == "egreso" else "ingresos"
    query = (
        client.table(table)
        .select("id")
        .eq("user_id", user_id)
        .eq("fecha", fecha)
        .eq("monto", str(monto))
        .is_("deleted_at", "null")
    )
    if descripcion:
        query = query.eq("descripcion", descripcion)

    response = query.limit(1).execute()
    return bool(response and response.data)


def bulk_import(
    user_jwt: str, user_id: str, transacciones: List[TransaccionImport]
) -> ImportResponse:
    client = get_user_client(user_jwt)
    importados = 0
    duplicados = 0
    errores: List[FilaError] = []

    for i, t in enumerate(transacciones, start=1):
        try:
            fecha_str = t.fecha.isoformat()
            monto_float = float(t.monto)

            # Check duplicate
            if _is_duplicate(client, user_id, t.tipo, fecha_str, monto_float, t.descripcion):
                duplicados += 1
                continue

            # Find category
            categoria_id = _find_categoria_id(client, user_id, t.categoria_nombre, t.tipo)
            if not categoria_id:
                errores.append(
                    FilaError(
                        fila=i,
                        campo="categoria_nombre",
                        mensaje=f"No se encontró ninguna categoría de tipo '{t.tipo}' para este usuario",
                    )
                )
                continue

            # Build insert row
            now = datetime.now(timezone.utc).isoformat()
            table = "egresos" if t.tipo == "egreso" else "ingresos"

            row: dict = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "categoria_id": categoria_id,
                "monto": monto_float,
                "moneda": t.moneda,
                "fecha": fecha_str,
                "created_at": now,
                "updated_at": now,
            }
            if t.descripcion:
                row["descripcion"] = t.descripcion
            if t.notas:
                row["notas"] = t.notas
            if t.tipo == "egreso":
                row["metodo_pago"] = "efectivo"  # default for imports

            response = client.table(table).insert(row).execute()
            if response and response.data:
                importados += 1
            else:
                errores.append(
                    FilaError(fila=i, campo="insert", mensaje="Error al insertar la fila")
                )

        except Exception as e:
            errores.append(FilaError(fila=i, campo="general", mensaje=str(e)))

    return ImportResponse(
        importados=importados,
        errores=errores,
        duplicados_omitidos=duplicados,
    )
