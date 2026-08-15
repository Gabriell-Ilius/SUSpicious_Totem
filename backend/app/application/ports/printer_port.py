"""
Interface abstrata para a impressora térmica.
Permite que o sistema imprima tanto na impressora USB real (ESC/POS) quanto no terminal (Mock).
"""

from abc import ABC, abstractmethod
from typing import Optional


class PrinterPort(ABC):
    """Porta de saída para impressão de senhas e comprovantes de atendimento."""

    @abstractmethod
    def imprimir_senha(
        self,
        codigo: str,
        tipo: str,
        data_hora: str,
        senha_id: Optional[str] = None,
        setor_destino: Optional[str] = None,
        prioridade: Optional[str] = None,
        cpf: Optional[str] = None,
        patient_name: Optional[str] = None,
        qr_code_url: Optional[str] = None
    ) -> bool:
        """Imprime o cupom de senha no formato físico ou mockado."""
        ...

    @abstractmethod
    def verificar_conexao(self) -> bool:
        """Verifica se a impressora está conectada e pronta para imprimir."""
        ...
