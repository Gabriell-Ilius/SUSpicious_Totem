"""
SUSpicious Totem — Ponto de entrada da aplicação FastAPI.
Inicializa o servidor, executa o seed de dados para a demonstração, 
inicia o SyncEngine para e-SUS offline-first e configura middlewares e CORS.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
from contextlib import asynccontextmanager
from sqlmodel import Session, SQLModel

from app.api import api_router
from app.core.config import settings
from app.infrastructure.database.session import engine
from app.domain.triagem import Triagem
from app.application.services.sync_service import SyncEngine
from app.infrastructure.database.senha_repository import SenhaRepository
from app.infrastructure.database.seed_data import seed_agendamentos
from app.infrastructure.external.mock_esus_gateway import MockEsusGateway

sync_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Cria tabelas, popula agendamentos de hoje e inicia o motor de sincronização
    logging.info("Iniciando a API do SUSpicious Totem...")
    SQLModel.metadata.create_all(engine)
    
    # Popula agendamentos do Pitch
    seed_agendamentos()

    global sync_engine
    with Session(engine) as session:
        senha_repo = SenhaRepository(session)
        esus_gateway = MockEsusGateway()
        
        sync_engine = SyncEngine(senha_repo=senha_repo, esus_gateway=esus_gateway)
        await sync_engine.start(interval_seconds=10)
    
    yield
    
    # Shutdown
    logging.info("Parando servicos do SUSpicious Totem...")
    if sync_engine:
        await sync_engine.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API do Totem de Autoatendimento para Unidades Básicas de Saúde (UBS).",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — permite acesso do Totem Kiosk, celular e múltiplos computadores na rede local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Servir os arquivos estáticos do frontend em modo de produção (se compilado)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/static_dist", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    logging.warning("Diretório frontend/dist não encontrado. Servindo apenas a API.")

@app.get("/health", tags=["Sistema"])
async def health_check():
    """Verifica se o servidor está ativo."""
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "printer_mode": settings.PRINTER_MODE,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
