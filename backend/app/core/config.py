from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configurações globais da aplicação, carregadas do .env."""
    PROJECT_NAME: str = "SUSpicious Totem"
    DATABASE_URL: str = "sqlite:///./suspicious.db"
    ENVIRONMENT: str = "development"

    # Impressora: "mock" (terminal) ou "escpos" (impressora real)
    PRINTER_MODE: str = "mock"
    PRINTER_VENDOR_ID: str = "0x04b8"
    PRINTER_PRODUCT_ID: str = "0x0202"

    # Integração e-SUS PEC
    ESUS_API_URL: str = "https://localhost:443"
    ESUS_API_USER: str = ""
    ESUS_API_PASSWORD: str = ""
    ESUS_API_TOKEN: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instância global de configuração (singleton)
settings = Settings()
