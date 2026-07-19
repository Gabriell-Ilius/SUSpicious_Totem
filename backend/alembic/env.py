"""
Alembic Environment Configuration.

Configura o Alembic para usar os mesmos modelos SQLModel do projeto.
Usa batch_alter_table por padrão para compatibilidade com SQLite.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Importa os metadados dos modelos SQLModel
from sqlmodel import SQLModel

# Importar todos os modelos aqui para que o Alembic os detecte
# (serão adicionados no Marco 1 quando criarmos as entidades)
# from app.domain.paciente import Paciente
# from app.domain.senha import Senha
# from app.domain.fila import Fila

from app.core.config import settings

# Configuração de logging do Alembic
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# Sobrescreve a URL do banco com a do nosso config.py
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Metadados alvo — o Alembic compara isso com o banco para gerar migrações
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Executa migrações em modo 'offline' (sem conexão ao banco)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # SQLite: usar batch_alter_table
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Executa migrações em modo 'online' (com conexão ao banco)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # SQLite: usar batch_alter_table
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
