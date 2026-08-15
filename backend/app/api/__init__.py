from fastapi import APIRouter
from .router_senha import router as router_senha
from .router_paciente import router as router_paciente
from .router_fila import router as router_fila
from .router_sync import router_sync

api_router = APIRouter()
api_router.include_router(router_senha)
api_router.include_router(router_paciente)
api_router.include_router(router_fila)
api_router.include_router(router_sync, prefix="/sync", tags=["sync"])
