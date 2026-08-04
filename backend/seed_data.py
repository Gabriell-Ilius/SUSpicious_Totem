from datetime import datetime, timedelta, time
import sys
from sqlmodel import Session, select, SQLModel
from app.db.session import engine
from app.models.appointment import Appointment

def seed_appointments(force: bool = False):
    """
    Popula e atualiza o banco de dados com agendamentos simulados para o Pitch.
    Executado a CADA INICIALIZAÇÃO do servidor para garantir que os CPFs de demonstração
    (especialmente 111.111.111-11 - João da Silva Santos) estejam SEMPRE ativos e com status SCHEDULED para a data de HOJE.
    """
    SQLModel.metadata.create_all(engine)
    
    demo_cpfs = ["11111111111", "12345678900", "98765432100", "11122233344"]

    with Session(engine) as session:
        # Se force=True ou em cada startup, limpa agendamentos anteriores dos CPFs de teste para renovar a demonstração
        existing = session.exec(select(Appointment).where(col(Appointment.cpf).in_(demo_cpfs))).all()
        for appt in existing:
            session.delete(appt)
        session.commit()

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
        ]

        session.add_all(mock_appointments)
        session.commit()
        print("[SUCCESS] Banco de dados renovado com agendamentos simulados para a data de HOJE!")

if __name__ == "__main__":
    force_flag = "--force" in sys.argv or "-f" in sys.argv
    seed_appointments(force=force_flag)

