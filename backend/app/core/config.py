"""
Módulo de Configuração Centralizada do Backend.
Utiliza Pydantic Settings para carregar e validar variáveis de ambiente a partir do arquivo .env.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Classe de configurações globais da aplicação.
    As variáveis são lidas automaticamente do arquivo .env ou do ambiente do sistema.
    """
    # Nome público da aplicação
    PROJECT_NAME: str = "SUSpicious Totem"

    # Versão da API
    API_V1_STR: str = "/api/v1"

    # Modo de operação da impressora: 'mock' (desenvolvimento) ou 'escpos' (impressora física)
    PRINTER_MODE: str = "mock"

    # Identificadores USB da Impressora Térmica (exemplo Epson/Genérica)
    PRINTER_VENDOR_ID: str = "0x04b8"
    PRINTER_PRODUCT_ID: str = "0x0202"

    # Caminho do Banco de Dados SQLite local
    DATABASE_URL: str = "sqlite:///./suspicious_totem.db"

    # Configuração de suporte ao arquivo .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Instância global das configurações acessível em qualquer ponto da aplicação
settings = Settings()
