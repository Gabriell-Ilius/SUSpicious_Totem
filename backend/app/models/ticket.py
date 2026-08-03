"""
Módulo de Modelos de Dados para Gerenciamento da Fila Diária (tb_fila_diaria).
Alinhado com a Seção 2.4 da Solução Técnica do Biochallenge 2026.
"""

from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class CategoryType(str, Enum):
    """Categorias de atendimento disponíveis no Totem da UBS."""
    AGENDADO = "AGENDADO"             # Paciente com consulta prever agendada no e-SUS
    ESPONTANEO = "ESPONTANEO"         # Paciente que chegou para acolhimento/demanda espontânea
    VACINACAO = "VACINACAO"           # Fila dedicada para salas de vacina
    TRIAGEM_DIGITAL = "TRIAGEM_DIGITAL" # Pré-triagem rápida via QR Code no celular


class PriorityType(str, Enum):
    """Níveis de prioridade previstos por lei e pela triagem de acolhimento."""
    NORMAL = "NORMAL"
    PREFERENCIAL = "PREFERENCIAL"     # Idosos (60+), Gestantes, PCD, Lactantes, Autistas


class TicketStatus(str, Enum):
    """Ciclo de vida de uma senha no atendimento da UBS."""
    WAITING = "WAITING"               # Aguardando ser chamado no painel
    CALLED = "CALLED"                 # Chamado no painel / consultório
    IN_SERVICE = "IN_SERVICE"         # Em atendimento pelo profissional
    COMPLETED = "COMPLETED"           # Atendimento finalizado
    CANCELLED = "CANCELLED"           # Paciente ausente ou desistência


class TicketBase(SQLModel):
    """Campos base compartilhados para criação e leitura de senhas."""
    tipo_demanda: CategoryType = Field(description="Classificação do paciente ('AGENDADO', 'ESPONTANEO', 'VACINACAO', 'TRIAGEM_DIGITAL')")
    prioridade_fila: int = Field(default=0, description="0 = Atendimento Normal, 1 = Atendimento Preferencial")
    cpf_paciente: Optional[str] = Field(default=None, description="CPF do paciente para busca no e-SUS PEC (ex: 12345678900)")
    patient_name: Optional[str] = Field(default=None, description="Nome do paciente (opcional no totem)")


class Ticket(TicketBase, table=True):
    """
    Tabela de Gerenciamento do Fluxo Diário (tb_fila_diaria) gravada no SQLite local.
    Alinhada estritamente com os atributos da Seção 2.4 da Solução Técnica.
    """
    __tablename__ = "tb_fila_diaria"

    id_atendimento: Optional[int] = Field(default=None, primary_key=True, description="Chave primária de controle")
    ticket_number: str = Field(index=True, description="Número formatado da senha (ex: ESP-001, VAC-P002)")
    setor_destino: str = Field(default="Triagem", description="Direcionamento físico (ex: 'Consultório 03', 'Sala de Vacinação 02')")
    status_sincronizacao: bool = Field(default=False, description="Booleano validando espelhamento com a API do e-SUS PEC")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Data e hora exata da emissão da senha"
    )
    status: TicketStatus = Field(default=TicketStatus.WAITING, description="Status atual da senha na UBS")
    qr_code_data: Optional[str] = Field(default=None, description="URL contida no QR Code para cadastro móvel no celular")

    # Propriedades auxiliares para compatibilidade de API
    @property
    def id(self) -> Optional[int]:
        return self.id_atendimento

    @property
    def category(self) -> CategoryType:
        return self.tipo_demanda

    @property
    def priority(self) -> PriorityType:
        return PriorityType.PREFERENCIAL if self.prioridade_fila == 1 else PriorityType.NORMAL


class TicketCreate(SQLModel):
    """Schema Pydantic recebido na API ao solicitar nova senha pelo Totem."""
    tipo_demanda: CategoryType
    prioridade_fila: int = 0
    cpf_paciente: Optional[str] = None
    patient_name: Optional[str] = None


class TicketRead(SQLModel):
    """Schema Pydantic retornado nas respostas HTTP da API."""
    id_atendimento: int
    ticket_number: str
    tipo_demanda: CategoryType
    prioridade_fila: int
    cpf_paciente: Optional[str]
    setor_destino: str
    status_sincronizacao: bool
    created_at: datetime
    status: TicketStatus
    qr_code_data: Optional[str]
