from datetime import datetime, time
from sqlmodel import Session, select, SQLModel
from app.infrastructure.database.session import engine
from app.domain.agendamento import Agendamento

def seed_agendamentos():
    """
    Popula e atualiza o banco de dados com agendamentos simulados para o Pitch.
    Garante que os CPFs de demonstração estejam SEMPRE ativos e com status SCHEDULED
    para a data de HOJE, com horários dinâmicos baseados no momento da execução.
    """
    SQLModel.metadata.create_all(engine)

    demo_cpfs = [
        "11111111111", "22222222222", "33333333333", "44444444444", 
        "55555555555", "12345678900", "98765432100", "11122233344"
    ]

    with Session(engine) as session:
        # Limpa agendamentos anteriores dos CPFs de demonstração para renovar para hoje
        statement = select(Agendamento)
        all_appointments = session.exec(statement).all()
        for appt in all_appointments:
            if appt.cpf in demo_cpfs:
                session.delete(appt)
        session.commit()

        now = datetime.now()
        today = now.date()

        mock_appointments = [
            # 1. CPF 111.111.111-11 — Paciente Principal do Pitch
            Agendamento(
                cpf="11111111111",
                cns="700000000000001",
                patient_name="João da Silva Santos (Demo Pitch)",
                doctor_name="Dra. Camila Rocha",
                specialty="Clínica Geral",
                room="Consultório 02",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 1) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # 2. CPF 222.222.222-22 — Cardiologia / Hipertensão
            Agendamento(
                cpf="22222222222",
                cns="700000000000002",
                patient_name="Maria Aparecida Lima",
                doctor_name="Dr. Roberto Alves",
                specialty="Cardiologia",
                room="Consultório 03",
                scheduled_time=datetime.combine(today, time(hour=now.hour, minute=45)),
                status="SCHEDULED"
            ),
            # 3. CPF 333.333.333-33 — Pediatria / Puericultura
            Agendamento(
                cpf="33333333333",
                cns="700000000000003",
                patient_name="Carlos Eduardo Pereira",
                doctor_name="Dr. Carlos Souza",
                specialty="Pediatria",
                room="Consultório 04",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 1) % 24, minute=30)),
                status="SCHEDULED"
            ),
            # 4. CPF 444.444.444-44 — Saúde da Mulher / Pré-Natal
            Agendamento(
                cpf="44444444444",
                cns="700000000000004",
                patient_name="Ana Paula Fernandes",
                doctor_name="Dra. Ana Costa",
                specialty="Saúde da Mulher / Pré-Natal",
                room="Consultório 01",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 2) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # 5. CPF 555.555.555-55 — Geriatria / Prioritário 80+
            Agendamento(
                cpf="55555555555",
                cns="700000000000005",
                patient_name="Sr. Antonio Gomes (80+)",
                doctor_name="Dr. Marcos Vinicius",
                specialty="Geriatria",
                room="Consultório 05",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 2) % 24, minute=15)),
                status="SCHEDULED"
            ),
            # 6. CPF 123.456.789-00 — Clínica Geral
            Agendamento(
                cpf="12345678900",
                cns="700000000000006",
                patient_name="Juliana Martins Costa",
                doctor_name="Dra. Ana Costa",
                specialty="Clínica Geral",
                room="Consultório 01",
                scheduled_time=datetime.combine(today, time(hour=now.hour, minute=30)),
                status="SCHEDULED"
            ),
            # 7. CPF 987.654.321-00 — Odontologia / Saúde Bucal
            Agendamento(
                cpf="98765432100",
                cns="700000000000007",
                patient_name="Lucas Henrique Souza",
                doctor_name="Dr. Carlos Souza",
                specialty="Odontologia",
                room="Consultório 04",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 3) % 24, minute=0)),
                status="SCHEDULED"
            ),
            # 8. CPF 111.222.333-44 — Enfermagem / Curativos
            Agendamento(
                cpf="11122233344",
                cns="700000000000008",
                patient_name="Francisca Rodrigues",
                doctor_name="Dra. Camila Rocha",
                specialty="Enfermagem",
                room="Consultório 02",
                scheduled_time=datetime.combine(today, time(hour=(now.hour + 3) % 24, minute=30)),
                status="SCHEDULED"
            ),
        ]

        session.add_all(mock_appointments)
        session.commit()
        print(f"[SEED] {len(mock_appointments)} agendamentos de demonstracao renovados com sucesso para HOJE!")
