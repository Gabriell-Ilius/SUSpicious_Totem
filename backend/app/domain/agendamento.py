from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Agendamento(SQLModel, table=True):
    """
    Entidade Agendamento no banco de dados local.
    Espelha a tabela de consultas agendadas sincronizadas com o e-SUS PEC.
    """
    __tablename__ = "agendamentos"

    id: Optional[int] = Field(default=None, primary_key=True)
    cpf: str = Field(index=True)
    cns: Optional[str] = Field(default=None)
    patient_name: str
    doctor_name: str
    specialty: str
    room: str
    scheduled_time: datetime = Field(default_factory=datetime.now)
    status: str = Field(default="SCHEDULED")
