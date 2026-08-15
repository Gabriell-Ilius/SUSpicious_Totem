from abc import ABC, abstractmethod
from typing import Optional

class EsusGatewayPort(ABC):
    """Porta de saída para integração com o e-SUS PEC."""

    @abstractmethod
    def buscar_paciente(self, cpf: str) -> Optional[dict]:
        ...

    @abstractmethod
    def enviar_registro(self, registro: dict) -> bool:
        ...

    @abstractmethod
    def enviar_senha(self, senha) -> bool:
        ...

    @abstractmethod
    def verificar_conexao(self) -> bool:
        ...
