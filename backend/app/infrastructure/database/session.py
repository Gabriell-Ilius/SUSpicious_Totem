"""
Sessão do banco de dados SQLite.

Configura o engine SQLAlchemy/SQLModel e fornece a sessão para os repositórios.
Usa check_same_thread=False para compatibilidade com FastAPI (multi-thread).
"""

from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings

# check_same_thread=False é necessário para SQLite + FastAPI
connect_args = {"check_same_thread": False}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)


def get_session():
    """Dependency injection: fornece uma sessão do banco para os endpoints."""
    with Session(engine) as session:
        yield session
