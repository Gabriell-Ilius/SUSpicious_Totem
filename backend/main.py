"""
SUSpicious Totem — Ponto de entrada da aplicação FastAPI.

Inicializa o servidor, registra os routers e configura CORS.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="SUSpicious Totem API",
    description="API do totem de autoatendimento para Unidades Básicas de Saúde (UBS).",
    version="0.1.0",
)

# CORS — permite que o frontend (Vite dev server) acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Sistema"])
async def health_check():
    """Verifica se o servidor está rodando."""
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "printer_mode": settings.PRINTER_MODE,
    }
