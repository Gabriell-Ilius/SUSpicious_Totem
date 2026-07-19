import uuid
from typing import Optional
from datetime import date
from sqlmodel import SQLModel, Field

class Paciente(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    cpf: str = Field(index=True, unique=True, max_length=11)
    nome: str
    cns: Optional[str] = None
    data_nascimento: Optional[date] = None
