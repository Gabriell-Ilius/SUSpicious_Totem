"""
Interface abstrata para o repositório de pacientes.

Define o contrato que qualquer implementação de persistência deve seguir.
"""

from abc import ABC, abstractmethod
from typing import Optional


class PacienteRepositoryPort(ABC):
    """Porta de saída para persistência de pacientes."""

    @abstractmethod
    def buscar_por_cpf(self, cpf: str) -> Optional[dict]:
        """Busca um paciente pelo CPF. Retorna None se não encontrado."""
        ...

    @abstractmethod
    def salvar(self, paciente: dict) -> dict:
        """Salva um novo paciente ou atualiza existente."""
        ...

    @abstractmethod
    def listar_todos(self) -> list[dict]:
        """Lista todos os pacientes cadastrados."""
        ...
