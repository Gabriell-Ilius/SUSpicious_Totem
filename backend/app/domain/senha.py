import uuid
from typing import Optional
from datetime import datetime
from enum import Enum
from zoneinfo import ZoneInfo
from sqlmodel import SQLModel, Field

def agora_sp() -> datetime:
    try:
        return datetime.now(ZoneInfo("America/Sao_Paulo"))
    except Exception:
        return datetime.now()

class StatusSenha(str, Enum):
    AGUARDANDO = "AGUARDANDO"
    CHAMADA = "CHAMADA"
    FINALIZADA = "FINALIZADA"
    CANCELADA = "CANCELADA"

class TipoAtendimento(str, Enum):
    AGENDADA = "AGENDADA"
    ESPONTANEA = "ESPONTANEA"
    VACINACAO = "VACINACAO"
    FARMACIA = "FARMACIA"
    TRIAGEM_DIGITAL = "TRIAGEM_DIGITAL"

class Senha(SQLModel, table=True):
    __tablename__ = "senhas"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    codigo: str = Field(index=True)
    tipo_atendimento: TipoAtendimento
    prioridade: int = Field(default=0)  # 0 = Normal, 1 = Preferencial
    sub_prioridade: Optional[str] = Field(default=None) # Ex: "80+ Anos", "Gestante", "PCD", "TEA"
    setor_destino: Optional[str] = Field(default=None)  # Ex: "Consultório 02 - Dra. Camila Rocha"
    patient_name: Optional[str] = Field(default=None)
    cpf: Optional[str] = Field(default=None)
    qr_code_data: Optional[str] = Field(default=None)
    status: StatusSenha = Field(default=StatusSenha.AGUARDANDO)
    data_hora_emissao: datetime = Field(default_factory=agora_sp)
    data_hora_chamada: Optional[datetime] = None
    paciente_id: Optional[uuid.UUID] = Field(default=None, foreign_key="pacientes.id")
    status_sincronizacao: bool = Field(default=False)
