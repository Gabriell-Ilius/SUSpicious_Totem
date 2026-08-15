from app.domain.senha import Senha
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class ConsultarFilaAtualUseCase:
    def __init__(self, senha_repo: SenhaRepositoryPort):
        self.senha_repo = senha_repo

    def execute(self) -> dict:
        aguardando = self.senha_repo.listar_fila_atual()
        ultimas_chamadas = self.senha_repo.listar_ultimas_chamadas(limite=6)
        
        # Ordena as senhas emitidas mais recentes primeiro
        ultimas_emitidas = sorted(aguardando, key=lambda s: s.data_hora_emissao, reverse=True)[:6]

        return {
            "total_aguardando": len(aguardando),
            "senhas": aguardando,
            "aguardando": aguardando,
            "ultimas_emitidas": ultimas_emitidas,
            "ultimas_chamadas": ultimas_chamadas
        }
