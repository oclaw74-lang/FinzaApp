from fastapi import APIRouter

from app.api.v1.routes.categorias import router as categorias_router
from app.api.v1.routes.egresos import router as egresos_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.ingresos import router as ingresos_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(categorias_router)
api_router.include_router(ingresos_router)
api_router.include_router(egresos_router)
