from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.core.supabase_client import get_user_client
from app.schemas.prestamo import (
    PagoPrestamoCreate,
    PagoPrestamoResponse,
    PrestamoCreate,
    PrestamoResumen,
    PrestamoResponse,
    PrestamoUpdate,
)
from app.services import prestamos as svc
from app.services.prestamos import generar_tabla_amortizacion

router = APIRouter(prefix="/prestamos", tags=["prestamos"])


@router.get("", response_model=list[PrestamoResponse])
async def list_prestamos(
    tipo: str | None = Query(None, description="Filtrar por tipo: me_deben o yo_debo"),
    estado: str | None = Query(
        None, description="Filtrar por estado: activo, pagado, vencido"
    ),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_prestamos(
        user_jwt=token,
        user_id=current_user["user_id"],
        tipo=tipo,
        estado=estado,
    )


@router.post("", response_model=PrestamoResponse, status_code=201)
async def create_prestamo(
    data: PrestamoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.create_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        data=data,
    )
    result.setdefault("pagos", [])
    return result


@router.get("/resumen", response_model=PrestamoResumen)
async def get_resumen(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_resumen(
        user_jwt=token,
        user_id=current_user["user_id"],
    )


@router.get("/{prestamo_id}", response_model=PrestamoResponse)
async def get_prestamo(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.get_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    return result


@router.put("/{prestamo_id}", response_model=PrestamoResponse)
async def update_prestamo(
    prestamo_id: UUID,
    data: PrestamoUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.update_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
        data=data,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    result.setdefault("pagos", [])
    return result


@router.delete("/{prestamo_id}", status_code=204)
async def delete_prestamo(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
    )


@router.get("/{prestamo_id}/pagos", response_model=list[PagoPrestamoResponse])
async def list_pagos(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_pagos(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
    )


@router.post(
    "/{prestamo_id}/pagos",
    response_model=dict,
    status_code=201,
)
async def registrar_pago(
    prestamo_id: UUID,
    data: PagoPrestamoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.registrar_pago(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
        data=data,
    )


@router.delete("/{prestamo_id}/pagos/{pago_id}", status_code=204)
async def delete_pago(
    prestamo_id: UUID,
    pago_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_pago(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
        pago_id=str(pago_id),
    )


@router.get("/{prestamo_id}/amortizacion")
async def get_tabla_amortizacion(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Return the full amortization schedule for a loan, with actual payment data overlaid."""
    client = get_user_client(token)

    prestamo_r = (
        client.table("prestamos")
        .select("*")
        .eq("id", str(prestamo_id))
        .eq("user_id", current_user["user_id"])
        .is_("deleted_at", "null")
        .maybe_single()
        .execute()
    )
    if not prestamo_r.data:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")

    p = prestamo_r.data

    if not p.get("plazo_meses"):
        return {
            "tabla": [],
            "resumen": {
                "sin_plazo": True,
                "monto_original": float(p["monto_original"]),
                "monto_pendiente": float(p["monto_pendiente"]),
            },
        }

    pagos_r = (
        client.table("pagos_prestamo")
        .select("*")
        .eq("prestamo_id", str(prestamo_id))
        .is_("deleted_at", "null")
        .order("numero_cuota")
        .execute()
    )
    pagos = pagos_r.data or []

    tabla = generar_tabla_amortizacion(
        monto_original=float(p["monto_original"]),
        tasa_interes_anual=float(p["tasa_interes"]) if p.get("tasa_interes") else None,
        plazo_meses=int(p["plazo_meses"]),
        fecha_inicio=date.fromisoformat(p["fecha_prestamo"][:10]),
        pagos_registrados=pagos,
    )

    total_pagado_capital = sum(float(pg.get("monto_capital") or 0) for pg in pagos)
    total_pagado_intereses = sum(float(pg.get("monto_interes") or 0) for pg in pagos)
    total_intereses_proyectados = sum(row["interes"] for row in tabla)

    return {
        "tabla": tabla,
        "resumen": {
            "monto_original": float(p["monto_original"]),
            "monto_pendiente": float(p["monto_pendiente"]),
            "total_pagado_capital": round(total_pagado_capital, 2),
            "total_pagado_intereses": round(total_pagado_intereses, 2),
            "total_intereses_proyectados": round(total_intereses_proyectados, 2),
            "cuotas_pagadas": len(pagos),
            "cuotas_totales": int(p["plazo_meses"]),
        },
    }
