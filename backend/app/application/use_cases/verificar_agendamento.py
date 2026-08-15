from datetime import datetime
from typing import Optional
from sqlmodel import Session, select
from app.domain.agendamento import Agendamento

# Mock de contingência / Fallback
MOCK_ESUS_FALLBACK = {
    "11111111111": {"paciente": "João da Silva Santos (Demo Pitch)", "consultorio": "Consultório 02 - Dra. Camila Rocha", "horario": "14:00"},
    "12345678900": {"paciente": "Maria Silva Santos", "consultorio": "Consultório 01 - Dra. Ana Costa", "horario": "14:30"},
    "98765432100": {"paciente": "João Pereira Oliveira", "consultorio": "Consultório 04 - Dr. Carlos Souza", "horario": "15:00"},
    "11122233344": {"paciente": "Francisca Rodrigues", "consultorio": "Consultório 01 - Dra. Ana Costa", "horario": "14:15"}
}

class VerificarAgendamento:
    def __init__(self, session: Session):
        self.session = session

    def executar(self, cpf: str) -> dict:
        clean_cpf = "".join(filter(str.isdigit, cpf))
        
        today_start = datetime.combine(datetime.now().date(), datetime.min.time())
        today_end = datetime.combine(datetime.now().date(), datetime.max.time())
        
        statement = select(Agendamento).where(
            Agendamento.cpf == clean_cpf,
            Agendamento.scheduled_time >= today_start,
            Agendamento.scheduled_time <= today_end,
            Agendamento.status == "SCHEDULED"
        )
        appt = self.session.exec(statement).first()
        
        if appt:
            return {
                "has_schedule": True,
                "paciente": appt.patient_name,
                "consultorio": f"{appt.room} - {appt.doctor_name}",
                "horario": appt.scheduled_time.strftime("%H:%M"),
                "agendamento_id": appt.id
            }

        # Fallback para dicionário mock
        if clean_cpf in MOCK_ESUS_FALLBACK:
            schedule = MOCK_ESUS_FALLBACK[clean_cpf]
            return {
                "has_schedule": True,
                "paciente": schedule["paciente"],
                "consultorio": schedule["consultorio"],
                "horario": schedule["horario"]
            }

        return {
            "has_schedule": False,
            "message": "Nenhum agendamento encontrado para este CPF hoje."
        }
