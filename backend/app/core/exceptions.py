from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    def __init__(self, detail: str = "Recurso no encontrado."):
        self.detail = detail


class DuplicateError(Exception):
    def __init__(self, detail: str = "El recurso ya existe."):
        self.detail = detail


class ForbiddenError(Exception):
    def __init__(self, detail: str = "No tienes permiso para esta accion."):
        self.detail = detail


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": exc.detail})

    @app.exception_handler(DuplicateError)
    async def duplicate_handler(request: Request, exc: DuplicateError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": exc.detail})

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse(status_code=403, content={"detail": exc.detail})
