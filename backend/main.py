"""
SUSpicious Totem — Ponto de entrada da aplicação FastAPI.

Inicializa o servidor, registra os routers e configura CORS.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from contextlib import asynccontextmanager
from sqlmodel import Session

from app.api import api_router
from app.core.config import settings
from app.infrastructure.database.session import engine
from app.application.services.sync_service import SyncEngine
from app.infrastructure.database.senha_repository import SenhaRepository
from app.infrastructure.external.mock_esus_gateway import MockEsusGateway

# Variável global para o engine (poderíamos injetar, mas para background task isso simplifica)
sync_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logging.info("Iniciando a API e Serviços de Background...")
    
    global sync_engine
    with Session(engine) as session:
        senha_repo = SenhaRepository(session)
        esus_gateway = MockEsusGateway()
        
        sync_engine = SyncEngine(senha_repo=senha_repo, esus_gateway=esus_gateway)
        await sync_engine.start(interval_seconds=10)
    
    yield
    
    # Shutdown
    logging.info("Parando serviços...")
    if sync_engine:
        await sync_engine.stop()

app = FastAPI(
    title="SUSpicious Totem API",
    description="API do totem de autoatendimento para Unidades Básicas de Saúde (UBS).",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/api")

# Servir os arquivos estáticos do frontend em modo de produção
import os
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    logging.warning("Diretório frontend/dist não encontrado. Servindo apenas a API.")

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
