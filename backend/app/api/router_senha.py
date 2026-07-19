from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.domain.senha import Senha, TipoAtendimento
from app.application.use_cases.gerar_senha import GerarSenhaUseCase
from app.application.use_cases.chamar_proxima_senha import ChamarProximaSenhaUseCase
from app.api.dependencies import get_gerar_senha_uc, get_chamar_proxima_senha_uc

class GerarSenhaRequest(BaseModel):
    tipo_atendimento: TipoAtendimento
    cpf: Optional[str] = None
    prioridade: int = 0

router = APIRouter(prefix="/senhas", tags=["senhas"])


@router.post("/", response_model=Senha)
def gerar_senha(request: GerarSenhaRequest, uc: GerarSenhaUseCase = Depends(get_gerar_senha_uc)):
    senha = uc.execute(
        tipo=request.tipo_atendimento,
        cpf=request.cpf,
        prioridade=request.prioridade
    )
    return senha

@router.post("/proxima", response_model=Senha)
def chamar_proxima_senha(uc: ChamarProximaSenhaUseCase = Depends(get_chamar_proxima_senha_uc)):
    senha = uc.execute()
    if not senha:
        raise HTTPException(status_code=404, detail="Não há senhas aguardando.")
    return senha
