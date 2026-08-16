from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlmodel import Session, select
from app.infrastructure.database.session import get_session
from app.domain.agendamento import Agendamento
from app.domain.senha import Senha, StatusSenha, agora_sp

class AgendamentoStatusResponse(BaseModel):
    id: int
    cpf: str
    patient_name: str
    doctor_name: str
    specialty: str
    room: str
    scheduled_time: datetime
    status_agendamento: str
    presenca_confirmada: bool
    senha_codigo: Optional[str] = None
    senha_status: Optional[str] = None
    senha_id: Optional[str] = None

router = APIRouter(prefix="/agendamentos", tags=["agendamentos"])

@router.get("/hoje", response_model=List[AgendamentoStatusResponse])
def listar_agendamentos_hoje(session: Session = Depends(get_session)):
    """
    Retorna a lista de pacientes agendados para hoje com o status de presença no totem.
    """
    statement = select(Agendamento).order_by(Agendamento.scheduled_time.asc())
    agendamentos = list(session.exec(statement).all())
    
    # Busca todas as senhas de hoje para verificar presença
    senhas_statement = select(Senha)
    senhas = list(session.exec(senhas_statement).all())
    senhas_por_cpf = {s.cpf: s for s in senhas if s.cpf}

    resultado = []
    for ag in agendamentos:
        senha_vinculada = senhas_por_cpf.get(ag.cpf)
        presenca = senha_vinculada is not None
        
        resultado.append(AgendamentoStatusResponse(
            id=ag.id,
            cpf=ag.cpf,
            patient_name=ag.patient_name,
            doctor_name=ag.doctor_name,
            specialty=ag.specialty,
            room=ag.room,
            scheduled_time=ag.scheduled_time,
            status_agendamento=ag.status,
            presenca_confirmada=presenca,
            senha_codigo=senha_vinculada.codigo if senha_vinculada else None,
            senha_status=senha_vinculada.status.value if senha_vinculada else None,
            senha_id=str(senha_vinculada.id) if senha_vinculada else None
        ))
        
    return resultado
