from datetime import datetime, timedelta, time
import sys
from sqlmodel import Session, select, SQLModel
from app.db.session import engine
from app.models.appointment import Appointment

def seed_appointments(force: bool = False):
    """
    Popula ou atualiza o banco de dados com agendamentos simulados para o Pitch.
    Garante que CPFs de demonstração (como 111.111.111-11) existam para a data de HOJE.
    """
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        if force:
            existing_appointments = session.exec(select(Appointment)).all()
            for appt in existing_appointments:
                session.delete(appt)
            session.commit()
            print("[INFO] Agendamentos anteriores removidos.")

        now = datetime.now()
        today = now.date()

        # Garante que o agendamento principal do Pitch (CPF 11111111111) esteja sempre criado para HOJE
        main_demo = session.exec(
            select(Appointment).where(
                Appointment.cpf == "11111111111",
                Appointment.status == "SCHEDULED"
            )
        ).first()

        if not main_demo or force:
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
            print("[SUCCESS] Banco de dados populado com agendamentos simulados para o Pitch!")
        else:
            # Se já existir, garante que o horário do agendamento esteja atualizado para o dia de hoje
            main_demo.scheduled_time = datetime.combine(today, time(hour=(now.hour + 1) % 24, minute=0))
            session.add(main_demo)
            session.commit()
            print("[INFO] Agendamento de demonstração (CPF 11111111111) atualizado para hoje.")

if __name__ == "__main__":
    force_flag = "--force" in sys.argv or "-f" in sys.argv
    seed_appointments(force=force_flag)
