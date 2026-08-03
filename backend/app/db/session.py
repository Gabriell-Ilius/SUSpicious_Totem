"""
Módulo de Gerenciamento de Sessões do Banco de Dados SQLite.
Cria o engine do SQLModel e fornece um gerador de dependência `get_session` para as rotas da API.
"""

from typing import Generator
from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# Conexão SQLite: `connect_args={"check_same_thread": False}` é necessário
# porque o FastAPI lida com requisições assíncronas em múltiplas threads.
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # Altere para True se quiser ver os comandos SQL no terminal durante o dev
    connect_args={"check_same_thread": False}
)


def init_db() -> None:
    """
    Cria as tabelas do banco de dados automaticamente se elas ainda não existirem.
    Executada durante a inicialização do FastAPI.
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Função geradora de dependência (Dependency Injection) do FastAPI.
    Abre uma sessão com o banco de dados e garante que ela seja fechada após a requisição.
    """
    with Session(engine) as session:
        yield session
