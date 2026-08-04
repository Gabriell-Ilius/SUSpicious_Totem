from datetime import datetime, timedelta, time
import sys
from sqlmodel import Session, select, SQLModel
from app.db.session import engine
from app.models.appointment import Appointment

def seed_appointments(force: bool = False):
    """
    Popula o banco de dados com agendamentos simulados para o Pitch.
    Se force=True, limpa os agendamentos antigos antes de popular.
    """
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        if force:
            existing_appointments = session.exec(select(Appointment)).all()
            for appt in existing_appointments:
                session.delete(appt)
            session.commit()
            print("[INFO] Agendamentos anteriores removidos.")

        # Verifica se já existem consultas cadastradas
        existing = session.exec(select(Appointment)).first()
        if existing and not force:
            print("[INFO] Banco de dados já possui consultas cadastradas.")
            return

        now = datetime.now()
        today = now.date()

        mock_appointments = [
            # CPF 111.111.111-11: Paciente de Demonstração Principal do Pitch
            Appointment(
                cpf="11111111111",
                cns="700000000000001",
                patient_name="João da Silva Santos (Demo Pitch)",
                doctor_name="Dra. Camila Rocha",
                specialty="Clínica Geral",
                room="Consultório 02",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 1) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # CPF 123.456.789-00
            Appointment(
                cpf="12345678900",
                cns="700000000000002",
                patient_name="Maria Silva Santos",
                doctor_name="Dra. Ana Costa",
                specialty="Clínica Geral",
                room="Consultório 01",
                scheduled_time=datetime.combine(today, time(hour=now.hour, minute=30)),
                status="SCHEDULED"
            ),
            # CPF 987.654.321-00
            Appointment(
                cpf="98765432100",
                cns="700000000000003",
                patient_name="João Pereira Oliveira",
                doctor_name="Dr. Carlos Souza",
                specialty="Pediatria",
                room="Consultório 04",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 2) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # CPF 111.222.333-44
            Appointment(
                cpf="11122233344",
                cns="700000000000004",
                patient_name="Francisca Rodrigues",
                doctor_name="Dra. Ana Costa",
                specialty="Clínica Geral",
                room="Consultório 01",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 3) % 24, minute=15)),
                status="SCHEDULED"
            ),
            # Agendamento futuro para o mesmo CPF do João (para teste de consulta futura)
            Appointment(
                cpf="11111111111",
                cns="700000000000001",
                patient_name="João da Silva Santos (Demo Pitch)",
                doctor_name="Dr. Lucas Fonseca",
                specialty="Odontologia",
                room="Consultório Odonto 01",
                scheduled_time=now + timedelta(days=5),
                status="SCHEDULED"
            ),
        ]

        session.add_all(mock_appointments)
        session.commit()
        print("[SUCCESS] Banco de dados populado com agendamentos simulados para o Pitch!")

if __name__ == "__main__":
    force_flag = "--force" in sys.argv or "-f" in sys.argv
    seed_appointments(force=force_flag)