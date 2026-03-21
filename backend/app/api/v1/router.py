from fastapi import APIRouter

from app.api.v1.routes.catalogos import router as catalogos_router
from app.api.v1.routes.categorias import router as categorias_router
from app.api.v1.routes.fondo_emergencia import router as fondo_emergencia_router
from app.api.v1.routes.impulso import router as impulso_router
from app.api.v1.routes.comparativa import router as comparativa_router
from app.api.v1.routes.educacion import router as educacion_router
from app.api.v1.routes.profiles import router as profiles_router
from app.api.v1.routes.recurrentes import router as recurrentes_router
from app.api.v1.routes.retos import router as retos_router
from app.api.v1.routes.suscripciones import router as suscripciones_router
from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.egresos import router as egresos_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.ingresos import router as ingresos_router
from app.api.v1.routes.metas import router as metas_router
from app.api.v1.routes.notificaciones import router as notificaciones_router
from app.api.v1.routes.prediccion import router as prediccion_router
from app.api.v1.routes.prestamos import router as prestamos_router
from app.api.v1.routes.presupuestos import router as presupuestos_router
from app.api.v1.routes.score import router as score_router
from app.api.v1.routes.tarjetas import router as tarjetas_router
from app.api.v1.routes.surveys import router as surveys_router
from app.api.v1.routes.estados_cuenta import router as estados_cuenta_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(catalogos_router)
api_router.include_router(categorias_router)
api_router.include_router(ingresos_router)
api_router.include_router(egresos_router)
api_router.include_router(dashboard_router)
api_router.include_router(prestamos_router)
api_router.include_router(metas_router)
api_router.include_router(presupuestos_router)
api_router.include_router(tarjetas_router)
api_router.include_router(recurrentes_router)
api_router.include_router(score_router)
api_router.include_router(prediccion_router)
api_router.include_router(notificaciones_router)
api_router.include_router(fondo_emergencia_router)
api_router.include_router(impulso_router)
api_router.include_router(suscripciones_router)
api_router.include_router(retos_router)
api_router.include_router(educacion_router)
api_router.include_router(comparativa_router)
api_router.include_router(profiles_router)
api_router.include_router(surveys_router)
api_router.include_router(estados_cuenta_router)
