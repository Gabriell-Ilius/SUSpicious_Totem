"""
======================================================
         SUSpicious Totem - Servidor FastAPI
======================================================
Ponto de entrada principal da aplicação Backend.
Configura middlewares de CORS, eventos de inicialização do banco SQLite,
e registra as rotas da API REST.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.v1.endpoints.router import api_router
from seed_data import seed_appointments


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciador de Ciclo de Vida da Aplicação (Lifespan).
    Executa tarefas de inicialização (startup) antes do servidor aceitar conexões,
    e tarefas de encerramento (shutdown) quando o servidor é desligado.
    """
    # STARTUP: Cria automaticamente o banco SQLite e suas tabelas
    print("🚀 Iniciando o backend do SUSpicious Totem...")
    print("📂 Verificando e inicializando banco de dados SQLite local...")
    init_db()
    seed_appointments()
    print(f"🖨️  Modo de Impressora configurado: [{settings.PRINTER_MODE.upper()}]")
    yield
    # SHUTDOWN: Limpeza ou encerramento de conexões
    print("🛑 Encerrando o servidor backend do SUSpicious Totem.")


# Instância Principal do Framework FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend para Totem de Autoatendimento em Unidades Básicas de Saúde (UBS) do SUS",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",  # Interface gráfica interativa Swagger
    redoc_url="/redoc" # Documentação ReDoc
)


# Configuração do Middleware de CORS (Cross-Origin Resource Sharing)
# Permite que o Frontend React (rodando em http://localhost:5173 ou IP do Raspberry Pi)
# acesse os endpoints da API FastAPI sem bloqueios de segurança do navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção no Kiosk, permite qualquer origem local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registro dos Roteadores de API
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/api/v1/health", tags=["Health Check"])
def health_check():
    """
    Endpoint de Verificação de Saúde da API (Health Check).
    Usado pelo Frontend e por scripts de monitoramento do Raspberry Pi para saber
    se o backend está ativo e respondendo normalmente.
    """
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "printer_mode": settings.PRINTER_MODE
    }


if __name__ == "__main__":
    import uvicorn
    # Permite rodar o arquivo diretamente com: python main.py
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
