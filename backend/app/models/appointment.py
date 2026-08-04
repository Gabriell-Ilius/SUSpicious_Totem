from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class AppointmentBase(SQLModel):
    cpf: str = Field(index=True)                  # CPF do paciente (apenas números)
    cns: Optional[str] = Field(default=None, index=True) # Cartão Nacional de Saúde
    patient_name: str                             # Nome do paciente
    doctor_name: str                              # Nome do médico/enfermeiro
    specialty: str                                # Ex: "Clínica Geral", "Pediatria"
    room: str                                     # Consultório (ex: "Consultório 03")
    scheduled_time: datetime                      # Data e hora agendada
    status: str = Field(default="SCHEDULED")      # SCHEDULED, CONFIRMED, COMPLETED, CANCELLED

class Appointment(AppointmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentRead(AppointmentBase):
    id: int