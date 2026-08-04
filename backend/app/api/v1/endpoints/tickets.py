"""
Rotas de API para Emissão e Gerenciamento de Senhas (tb_fila_diaria).
Alinhado com as especificações do Escopo e da Solução Técnica do Biochallenge 2026.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select, func

from app.db.session import get_session
from app.models.ticket import (
    Ticket, TicketCreate, TicketRead,
    CategoryType, PriorityType, TicketStatus
)
from app.infrastructure.printer import get_printer

# Instância do Roteador FastAPI para o módulo de Senhas
from app.models.appointment import Appointment

# Instância do Roteador FastAPI para o módulo de Senhas
router = APIRouter(tags=["Tickets / tb_fila_diaria"])


# Mock de Banco de Dados do e-SUS PEC (Agendamentos prévios por CPF - Fallback)
MOCK_ESUS_SCHEDULES = {
    "12345678900": {"paciente": "Maria Silva Santos", "consultorio": "Consultório 03 - Dr. Carlos Andrade", "horario": "14:30"},
    "98765432100": {"paciente": "João Pereira Lima", "consultorio": "Consultório 01 - Dra. Ana Souza", "horario": "15:00"},
    "11122233344": {"paciente": "Francisca Oliveira", "consultorio": "Consultório 05 - Enfermagem Acolhimento", "horario": "14:15"}
}


class CPFCheckRequest(BaseModel):
    cpf: str


def generate_ticket_code(category: CategoryType, priority_num: int, count: int) -> str:
    """Gera o código amigável impresso na senha (ex: ESP-001, VAC-P005, FAR-001)."""
    prefixes = {
        CategoryType.AGENDADO: "AGN",
        CategoryType.ESPONTANEO: "ESP",
        CategoryType.VACINACAO: "VAC",
        CategoryType.FARMACIA: "FAR",
        CategoryType.TRIAGEM_DIGITAL: "TRG"
    }
    prefix = prefixes.get(category, "SNH")
    p_flag = "P" if priority_num == 1 else ""
    return f"{prefix}-{p_flag}{count:03d}"


def calculate_setor_destino(category: CategoryType, cpf: Optional[str], db: Optional[Session] = None) -> str:
    """
    Calcula o Setor de Destino na UBS (ex: 'Consultório 03', 'Sala de Vacinação 02', 'Farmácia').
    Simula o roteamento dinâmico com a base do e-SUS PEC conforme o Escopo do Projeto.
    """
    if category == CategoryType.AGENDADO and cpf:
        if db:
            today_start = datetime.combine(datetime.now().date(), datetime.min.time())
            today_end = datetime.combine(datetime.now().date(), datetime.max.time())
            statement = select(Appointment).where(
                Appointment.cpf == cpf,
                Appointment.scheduled_time >= today_start,
                Appointment.scheduled_time <= today_end
            )
            appt = db.exec(statement).first()
            if appt:
                return f"{appt.room} - {appt.doctor_name}"

        if cpf in MOCK_ESUS_SCHEDULES:
            return MOCK_ESUS_SCHEDULES[cpf]["consultorio"]
    
    # Roteamentos por demanda
    destinos = {
        CategoryType.AGENDADO: "Consultório 02 - Atendimento Agendado",
        CategoryType.ESPONTANEO: "Balcão 01 - Acolhimento & Triagem",
        CategoryType.VACINACAO: "Sala de Imunização 02 - Vacinas",
        CategoryType.FARMACIA: "Farmácia Básica - Dispensação de Medicamentos",
        CategoryType.TRIAGEM_DIGITAL: "Balcão de Triagem Digital (QR)"
    }
    return destinos.get(category, "Balcão de Atendimento Generalista")


@router.post("/check-cpf")
def check_cpf_schedule(request: CPFCheckRequest, db: Session = Depends(get_session)):
    """
    Endpoint de Busca no e-SUS PEC:
    Verifica se o CPF possui consulta agendada prévia para hoje na UBS.
    """
    clean_cpf = "".join(filter(str.isdigit, request.cpf))
    
    # Busca agendamento no banco de dados SQLite real
    today_start = datetime.combine(datetime.now().date(), datetime.min.time())
    today_end = datetime.combine(datetime.now().date(), datetime.max.time())
    
    statement = select(Appointment).where(
        Appointment.cpf == clean_cpf,
        Appointment.scheduled_time >= today_start,
        Appointment.scheduled_time <= today_end,
        Appointment.status == "SCHEDULED"
    )
    appt = db.exec(statement).first()
    if appt:
        return {
            "has_schedule": True,
            "paciente": appt.patient_name,
            "consultorio": f"{appt.room} - {appt.doctor_name}",
            "horario": appt.scheduled_time.strftime("%H:%M"),
            "appointment_id": appt.id
        }

    # Fallback para dicionário mock
    if clean_cpf in MOCK_ESUS_SCHEDULES:
        schedule = MOCK_ESUS_SCHEDULES[clean_cpf]
        return {
            "has_schedule": True,
            "paciente": schedule["paciente"],
            "consultorio": schedule["consultorio"],
            "horario": schedule["horario"]
        }

    return {
        "has_schedule": False,
        "message": "Nenhum agendamento encontrado para este CPF hoje. Redirecionando para Atendimento Espontâneo."
    }


@router.post("/", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_session)
):
    """
    Endpoint principal do Totem para Emitir Senha (Grava na tabela tb_fila_diaria):
    1. Higieniza o CPF informado.
    2. Calcula a sequência do dia.
    3. Identifica o setor_destino com a base do e-SUS.
    4. Grava no SQLite local e dispara a impressora física/mock.
    """
    clean_cpf = "".join(filter(str.isdigit, ticket_in.cpf_paciente)) if ticket_in.cpf_paciente else None

    # Conta quantas senhas da mesma demanda já foram emitidas hoje
    statement = select(func.count(Ticket.id_atendimento)).where(Ticket.tipo_demanda == ticket_in.tipo_demanda)
    existing_count = db.exec(statement).one() or 0
    next_number = existing_count + 1

    ticket_number = generate_ticket_code(ticket_in.tipo_demanda, ticket_in.prioridade_fila, next_number)
    setor_destino = calculate_setor_destino(ticket_in.tipo_demanda, clean_cpf, db)

    # Busca o nome do paciente no banco de agendamentos se não fornecido
    patient_name = ticket_in.patient_name
    if not patient_name and clean_cpf:
        statement = select(Appointment).where(Appointment.cpf == clean_cpf)
        appt = db.exec(statement).first()
        if appt:
            patient_name = appt.patient_name
        elif clean_cpf in MOCK_ESUS_SCHEDULES:
            patient_name = MOCK_ESUS_SCHEDULES[clean_cpf]["paciente"]

    # QR Code ativado para Triagem Digital e para Consulta Espontânea (pré-triagem enquanto aguarda)
    qr_url = f"https://ubs-triagem.gov.br/triar?ticket={ticket_number}" if ticket_in.tipo_demanda in (CategoryType.TRIAGEM_DIGITAL, CategoryType.ESPONTANEO) else None

    # Gravação na tabela tb_fila_diaria
    db_ticket = Ticket(
        tipo_demanda=ticket_in.tipo_demanda,
        prioridade_fila=ticket_in.prioridade_fila,
        sub_prioridade=ticket_in.sub_prioridade,
        cpf_paciente=clean_cpf,
        patient_name=patient_name,
        ticket_number=ticket_number,
        setor_destino=setor_destino,
        status_sincronizacao=True, # Simulação de espelhamento e-SUS
        qr_code_data=qr_url,
        status=TicketStatus.WAITING
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    # Dispara a impressora térmica física ou mock
    printer = get_printer()
    date_formatted = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    priority_label = f"PREFERENCIAL ({db_ticket.sub_prioridade})" if (db_ticket.prioridade_fila == 1 and db_ticket.sub_prioridade) else ("PREFERENCIAL" if db_ticket.prioridade_fila == 1 else "NORMAL")

    printer.print_ticket(
        ticket_number=db_ticket.ticket_number,
        category_name=db_ticket.tipo_demanda.value,
        priority_name=priority_label,
        setor_destino=db_ticket.setor_destino,
        date_str=date_formatted,
        cpf_paciente=clean_cpf,
        qr_code_url=qr_url,
        patient_name=db_ticket.patient_name
    )

    return db_ticket


@router.get("/", response_model=List[TicketRead])
def list_tickets(
    status_filter: Optional[TicketStatus] = None,
    db: Session = Depends(get_session)
):
    """Retorna as senhas cadastradas na tb_fila_diaria."""
    statement = select(Ticket)
    if status_filter:
        statement = statement.where(Ticket.status == status_filter)
    
    statement = statement.order_by(Ticket.prioridade_fila.desc(), Ticket.created_at.asc())
    tickets = db.exec(statement).all()
    return tickets
