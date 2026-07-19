"""
Interface abstrata para integração com o e-SUS PEC.

Define o contrato para envio/consulta de dados ao sistema e-SUS.
A implementação concreta usa a API REST do PEC (LEDI APS).
"""

from abc import ABC, abstractmethod
from typing import Optional

class EsusGatewayPort(ABC):
    """Porta de saída para integração com o e-SUS PEC."""

    @abstractmethod
    def buscar_paciente(self, cpf: str) -> Optional[dict]:
        """Consulta se o paciente existe no e-SUS."""
        ...

    @abstractmethod
    def enviar_registro(self, registro: dict) -> bool:
        """Envia um registro (ficha) para o e-SUS PEC via LEDI APS."""
        ...

    @abstractmethod
    def verificar_conexao(self) -> bool:
        """Verifica se a API do e-SUS está acessível."""
        ...
