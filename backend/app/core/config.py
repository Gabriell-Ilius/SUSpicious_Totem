"""
SUSpicious Totem — Configurações centralizadas.

Carrega variáveis de ambiente do arquivo .env usando Pydantic BaseSettings.
Nunca hardcode valores sensíveis aqui; use o .env ou variáveis do sistema.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações globais da aplicação, carregadas do .env."""

    # Banco de Dados
    DATABASE_URL: str = "sqlite:///./suspicious.db"

    # Ambiente: "development" ou "production"
    ENVIRONMENT: str = "development"

    # Impressora: "mock" (terminal) ou "escpos" (impressora real)
    PRINTER_MODE: str = "mock"

    # Integração e-SUS PEC
    ESUS_API_URL: str = "https://localhost:443"
    ESUS_API_USER: str = ""
    ESUS_API_PASSWORD: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instância global de configuração (singleton)
settings = Settings()
