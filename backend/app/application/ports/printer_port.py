"""
Interface abstrata para a impressora térmica.

Os casos de uso chamam esta interface. A implementação concreta
(EscPosPrinter ou MockPrinter) é injetada em tempo de execução.
"""

from abc import ABC, abstractmethod


class PrinterPort(ABC):
    """Porta de saída para impressão de senhas."""

    @abstractmethod
    def imprimir_senha(self, codigo: str, tipo: str, data_hora: str) -> None:
        """Imprime uma senha na impressora térmica (ou simula no terminal)."""
        ...

    @abstractmethod
    def verificar_conexao(self) -> bool:
        """Verifica se a impressora está conectada e pronta."""
        ...
