import asyncio
import logging
from app.application.ports.senha_repository_port import SenhaRepositoryPort
from app.application.ports.esus_gateway_port import EsusGatewayPort

logger = logging.getLogger(__name__)

class SyncEngine:
    def __init__(self, senha_repo: SenhaRepositoryPort, esus_gateway: EsusGatewayPort):
        self.senha_repo = senha_repo
        self.esus_gateway = esus_gateway
        self._running = False
        self._task = None

    async def start(self, interval_seconds: int = 10):
        if self._running:
            return
        
        self._running = True
        logger.info(f"SyncEngine iniciado. Polling a cada {interval_seconds}s...")
        
        self._task = asyncio.create_task(self._loop(interval_seconds))

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("SyncEngine parado.")

    async def _loop(self, interval_seconds: int):
        while self._running:
            try:
                await asyncio.to_thread(self.processar_pendentes)
            except Exception as e:
                logger.error(f"Erro no ciclo do SyncEngine: {e}")
            
            await asyncio.sleep(interval_seconds)

    def processar_pendentes(self):
        # Busca todas as senhas não sincronizadas (offline)
        pendentes = self.senha_repo.listar_nao_sincronizadas()
        if not pendentes:
            return
            
        logger.info(f"SyncEngine: Tentando sincronizar {len(pendentes)} registro(s)...")
        
        for senha in pendentes:
            try:
                # Tenta enviar para o gateway
                sucesso = self.esus_gateway.enviar_senha(senha)
                
                if sucesso:
                    # Atualiza o status
                    senha.status_sincronizacao = True
                    self.senha_repo.salvar(senha)
                    logger.info(f"Senha {senha.codigo} sincronizada com sucesso!")
                else:
                    logger.warning(f"Falha ao sincronizar senha {senha.codigo}. Será retentada.")
                    
            except Exception as e:
                logger.error(f"Falha na sincronização da senha {senha.codigo}: {e}")
                
        logger.info("Fim do ciclo de sincronização.")
