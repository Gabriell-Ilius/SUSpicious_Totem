from fastapi import APIRouter
from .router_senha import router as router_senha
from .router_paciente import router as router_paciente
from .router_fila import router as router_fila
from .router_triagem import router as router_triagem
from .router_agendamento import router as router_agendamento
from .router_sync import router_sync

api_router = APIRouter()
api_router.include_router(router_senha)
api_router.include_router(router_paciente)
api_router.include_router(router_fila)
api_router.include_router(router_triagem)
api_router.include_router(router_agendamento)
api_router.include_router(router_sync, prefix="/sync", tags=["sync"])
