from abc import ABC, abstractmethod
from typing import Optional
from app.domain.senha import Senha, TipoAtendimento

class SenhaRepositoryPort(ABC):
    """Porta de saída para persistência de senhas e filas."""

    @abstractmethod
    def gerar_codigo_senha(self, tipo: TipoAtendimento) -> str:
        """Gera o próximo código sequencial para o tipo de atendimento."""
        ...

    @abstractmethod
    def salvar(self, senha: Senha) -> Senha:
        """Salva uma nova senha ou atualiza existente."""
        ...

    @abstractmethod
    def buscar_proxima_senha(self) -> Optional[Senha]:
        """Busca a próxima senha da fila, respeitando prioridade e ordem de chegada."""
        ...

    @abstractmethod
    def listar_fila_atual(self) -> list[Senha]:
        """Retorna todas as senhas que estão aguardando."""
        ...

    @abstractmethod
    def listar_ultimas_chamadas(self, limite: int = 4) -> list[Senha]:
        """Retorna as últimas senhas chamadas (histórico para o painel)."""
        ...
