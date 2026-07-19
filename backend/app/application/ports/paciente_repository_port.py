from abc import ABC, abstractmethod
from typing import Optional
from app.domain.paciente import Paciente

class PacienteRepositoryPort(ABC):
    """Porta de saída para persistência de pacientes."""

    @abstractmethod
    def buscar_por_cpf(self, cpf: str) -> Optional[Paciente]:
        """Busca um paciente pelo CPF. Retorna None se não encontrado."""
        ...

    @abstractmethod
    def salvar(self, paciente: Paciente) -> Paciente:
        """Salva um novo paciente ou atualiza existente."""
        ...

    @abstractmethod
    def listar_todos(self) -> list[Paciente]:
        """Lista todos os pacientes cadastrados."""
        ...
