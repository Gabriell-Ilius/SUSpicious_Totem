from fastapi import APIRouter, Depends
from app.application.use_cases.consultar_fila_atual import ConsultarFilaAtualUseCase
from app.api.dependencies import get_consultar_fila_uc

router = APIRouter(prefix="/filas", tags=["filas"])

@router.get("/")
def listar_fila_atual(uc: ConsultarFilaAtualUseCase = Depends(get_consultar_fila_uc)):
    return uc.execute()
