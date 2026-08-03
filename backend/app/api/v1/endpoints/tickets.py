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
router = APIRouter(prefix="/tickets", tags=["Tickets / tb_fila_diaria"])


# Mock de Banco de Dados do e-SUS PEC (Agendamentos prévios por CPF)
MOCK_ESUS_SCHEDULES = {
    "12345678900": {"paciente": "Maria Silva Santos", "consultorio": "Consultório 03 - Dr. Carlos Andrade", "horario": "14:30"},
    "98765432100": {"paciente": "João Pereira Lima", "consultorio": "Consultório 01 - Dra. Ana Souza", "horario": "15:00"},
    "11122233344": {"paciente": "Francisca Oliveira", "consultorio": "Consultório 05 - Enfermagem Acolhimento", "horario": "14:15"}
}


class CPFCheckRequest(BaseModel):
    cpf: str


def generate_ticket_code(category: CategoryType, priority_num: int, count: int) -> str:
    """Gera o código amigável impresso na senha (ex: ESP-001, VAC-P005)."""
    prefixes = {
        CategoryType.AGENDADO: "AGN",
        CategoryType.ESPONTANEO: "ESP",
        CategoryType.VACINACAO: "VAC",
        CategoryType.TRIAGEM_DIGITAL: "TRG"
    }
    prefix = prefixes.get(category, "SNH")
    p_flag = "P" if priority_num == 1 else ""
    return f"{prefix}-{p_flag}{count:03d}"


def calculate_setor_destino(category: CategoryType, cpf: Optional[str]) -> str:
    """
    Calcula o Setor de Destino na UBS (ex: 'Consultório 03', 'Sala de Vacinação 02').
    Simula o roteamento dinâmico com a base do e-SUS PEC conforme o Escopo do Projeto.
    """
    # 1. Se for consulta agendada e o CPF consta no e-SUS
    if category == CategoryType.AGENDADO and cpf in MOCK_ESUS_SCHEDULES:
        return MOCK_ESUS_SCHEDULES[cpf]["consultorio"]
    
    # 2. Roteamentos por demanda
    destinos = {
        CategoryType.AGENDADO: "Consultório 02 - Atendimento Agendado",
        CategoryType.ESPONTANEO: "Balcão 01 - Acolhimento & Triagem",
        CategoryType.VACINACAO: "Sala de Imunização 02 - Vacinas",
        CategoryType.TRIAGEM_DIGITAL: "Balcão de Triagem Digital (QR)"
    }
    return destinos.get(category, "Balcão de Atendimento Generalista")


@router.post("/check-cpf")
def check_cpf_schedule(request: CPFCheckRequest):
    """
    Endpoint de Busca no e-SUS PEC:
    Verifica se o CPF possui consulta agendada prévia para hoje na UBS.
    """
    clean_cpf = "".join(filter(str.isdigit, request.cpf))
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
    setor_destino = calculate_setor_destino(ticket_in.tipo_demanda, clean_cpf)

    qr_url = f"https://ubs-triagem.gov.br/triar?ticket={ticket_number}" if ticket_in.tipo_demanda == CategoryType.TRIAGEM_DIGITAL else None

    # Gravação na tabela tb_fila_diaria
    db_ticket = Ticket(
        tipo_demanda=ticket_in.tipo_demanda,
        prioridade_fila=ticket_in.prioridade_fila,
        cpf_paciente=clean_cpf,
        patient_name=ticket_in.patient_name,
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
    priority_label = "PREFERENCIAL" if db_ticket.prioridade_fila == 1 else "NORMAL"

    printer.print_ticket(
        ticket_number=db_ticket.ticket_number,
        category_name=db_ticket.tipo_demanda.value,
        priority_name=priority_label,
        setor_destino=db_ticket.setor_destino,
        date_str=date_formatted,
        cpf_paciente=clean_cpf,
        qr_code_url=qr_url
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
