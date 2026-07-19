import uuid
from typing import Optional
from datetime import datetime
from enum import Enum
from zoneinfo import ZoneInfo
from sqlmodel import SQLModel, Field

def agora_sp() -> datetime:
    return datetime.now(ZoneInfo("America/Sao_Paulo"))

class StatusSenha(str, Enum):
    AGUARDANDO = "AGUARDANDO"
    CHAMADA = "CHAMADA"
    FINALIZADA = "FINALIZADA"
    CANCELADA = "CANCELADA"

class TipoAtendimento(str, Enum):
    AGENDADA = "AGENDADA"
    ESPONTANEA = "ESPONTANEA"
    VACINACAO = "VACINACAO"

class Senha(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    codigo: str = Field(index=True)
    tipo_atendimento: TipoAtendimento
    prioridade: int = Field(default=0)
    status: StatusSenha = Field(default=StatusSenha.AGUARDANDO)
    data_hora_emissao: datetime = Field(default_factory=agora_sp)
    data_hora_chamada: Optional[datetime] = None
    paciente_id: Optional[uuid.UUID] = Field(default=None, foreign_key="paciente.id")
    status_sincronizacao: bool = Field(default=False)
