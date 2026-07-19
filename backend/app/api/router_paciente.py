from fastapi import APIRouter, Depends, HTTPException
from app.domain.paciente import Paciente
from app.application.use_cases.validar_cpf import ValidarCPFUseCase
from app.api.dependencies import get_validar_cpf_uc

router = APIRouter(prefix="/pacientes", tags=["pacientes"])

@router.get("/{cpf}", response_model=Paciente)
def buscar_paciente(cpf: str, uc: ValidarCPFUseCase = Depends(get_validar_cpf_uc)):
    paciente = uc.execute(cpf)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return paciente
