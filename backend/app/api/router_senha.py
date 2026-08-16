from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Session, select
from app.domain.senha import Senha, StatusSenha, TipoAtendimento
from app.domain.triagem import Triagem
from app.application.use_cases.gerar_senha import GerarSenhaUseCase
from app.application.use_cases.verificar_agendamento import VerificarAgendamento
from app.application.use_cases.chamar_proxima_senha import ChamarProximaSenhaUseCase
from app.api.dependencies import get_gerar_senha_uc, get_chamar_proxima_senha_uc, get_verificar_agendamento_uc
from app.infrastructure.database.session import get_session
from app.infrastructure.database.senha_repository import SenhaRepository

class CPFCheckRequest(BaseModel):
    cpf: str

class GerarSenhaRequest(BaseModel):
    tipo_atendimento: TipoAtendimento
    cpf: Optional[str] = None
    prioridade: int = 0
    sub_prioridade: Optional[str] = None

class ChamarSenhaRequest(BaseModel):
    setor_destino: Optional[str] = None
    senha_id: Optional[str] = None

router = APIRouter(prefix="/senhas", tags=["senhas"])

@router.post("/check-cpf")
def check_cpf(
    request: CPFCheckRequest,
    uc: VerificarAgendamento = Depends(get_verificar_agendamento_uc)
):
    """
    Verifica se o paciente possui consulta agendada prévia para hoje no e-SUS PEC.
    """
    return uc.executar(request.cpf)

@router.post("/", response_model=Senha)
def gerar_senha(request: GerarSenhaRequest, uc: GerarSenhaUseCase = Depends(get_gerar_senha_uc)):
    """
    Emite a senha no totem e aciona a impressora térmica física ou mock.
    """
    senha = uc.execute(
        tipo=request.tipo_atendimento,
        cpf=request.cpf,
        prioridade=request.prioridade,
        sub_prioridade=request.sub_prioridade
    )
    return senha

@router.get("/codigo/{codigo}", response_model=Optional[Senha])
def buscar_senha_por_codigo(codigo: str, session: Session = Depends(get_session)):
    """
    Busca informações da senha pelo código impresso no totem (ex: ESP-001, AGN-001).
    Usado pelo celular na pré-triagem para identificar se o paciente já digitou o CPF no totem.
    """
    repo = SenhaRepository(session)
    senha = repo.buscar_por_id(codigo)
    if not senha:
        raise HTTPException(status_code=404, detail="Senha não encontrada.")
    return senha

@router.post("/proxima", response_model=Senha)
def chamar_proxima_senha(
    request: Optional[ChamarSenhaRequest] = None,
    uc: ChamarProximaSenhaUseCase = Depends(get_chamar_proxima_senha_uc)
):
    """
    Chama a próxima senha da fila (ou uma específica) direcionando para o guichê/consultório informado.
    """
    setor = request.setor_destino if request else None
    senha_id = request.senha_id if request else None
    senha = uc.execute(setor_destino=setor, senha_id=senha_id)
    if not senha:
        raise HTTPException(status_code=404, detail="Não há senhas aguardando.")
    return senha

@router.post("/{senha_id}/concluir")
def concluir_atendimento(senha_id: str, session: Session = Depends(get_session)):
    """
    Finaliza o atendimento de uma senha.
    """
    repo = SenhaRepository(session)
    senha = repo.buscar_por_id(senha_id)
    if not senha:
        raise HTTPException(status_code=404, detail="Senha não encontrada.")
    senha.status = StatusSenha.ATENDIDA
    repo.salvar(senha)
    return {"message": "Atendimento concluído com sucesso!", "senha": senha}

@router.post("/reset")
def resetar_senhas(session: Session = Depends(get_session)):
    """
    Zera a fila e todo o histórico de senhas e triagens para uma apresentação limpa do Pitch.
    """
    repo = SenhaRepository(session)
    count = repo.limpar_todas_senhas()
    
    # Limpa também as triagens da Central de Risco
    triagens = list(session.exec(select(Triagem)).all())
    for t in triagens:
        session.delete(t)
    session.commit()
    
    return {"message": f"{count} senhas e {len(triagens)} triagens removidas. Fila e Central de Risco 100% zeradas!"}
