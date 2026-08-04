from datetime import datetime, timedelta, time
import sys
from sqlmodel import Session, select, SQLModel
from app.db.session import engine
from app.models.appointment import Appointment

def seed_appointments(force: bool = False):
    """
    Popula e atualiza o banco de dados com agendamentos simulados para o Pitch.
    Executado a CADA INICIALIZACAO do servidor para garantir que os CPFs de demonstracao
    estejam SEMPRE ativos e com status SCHEDULED para a data de HOJE.
    """
    SQLModel.metadata.create_all(engine)

    demo_cpfs = ["11111111111", "12345678900", "98765432100", "11122233344"]

    with Session(engine) as session:
        # Limpa agendamentos anteriores dos CPFs de demonstracao para renovar para hoje
        all_appointments = session.exec(select(Appointment)).all()
        for appt in all_appointments:
            if appt.cpf in demo_cpfs:
                session.delete(appt)
        session.commit()

        now = datetime.now()
        today = now.date()

        mock_appointments = [
            # CPF 111.111.111-11: Paciente de Demonstracao Principal do Pitch
            Appointment(
                cpf="11111111111",
                cns="700000000000001",
                patient_name="Joao da Silva Santos (Demo Pitch)",
                doctor_name="Dra. Camila Rocha",
                specialty="Clinica Geral",
                room="Consultorio 02",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 1) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # CPF 123.456.789-00
            Appointment(
                cpf="12345678900",
                cns="700000000000002",
                patient_name="Maria Silva Santos",
                doctor_name="Dra. Ana Costa",
                specialty="Clinica Geral",
                room="Consultorio 01",
                scheduled_time=datetime.combine(today, time(hour=now.hour, minute=30)),
                status="SCHEDULED"
            ),
            # CPF 987.654.321-00
            Appointment(
                cpf="98765432100",
                cns="700000000000003",
                patient_name="Joao Pereira Oliveira",
                doctor_name="Dr. Carlos Souza",
                specialty="Pediatria",
                room="Consultorio 04",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 2) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # CPF 111.222.333-44
            Appointment(
                cpf="11122233344",
                cns="700000000000004",
                patient_name="Francisca Rodrigues",
                doctor_name="Dra. Ana Costa",
                specialty="Clinica Geral",
                room="Consultorio 01",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 3) % 24, minute=15)),
                status="SCHEDULED"
            ),
        ]

        session.add_all(mock_appointments)
        session.commit()
        print("[SUCCESS] Banco de dados renovado com agendamentos para HOJE!")

if __name__ == "__main__":
    force_flag = "--force" in sys.argv or "-f" in sys.argv
    seed_appointments(force=force_flag)
