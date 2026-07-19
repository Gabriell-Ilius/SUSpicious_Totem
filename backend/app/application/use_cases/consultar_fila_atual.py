from app.domain.senha import Senha
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class ConsultarFilaAtualUseCase:
    def __init__(self, senha_repo: SenhaRepositoryPort):
        self.senha_repo = senha_repo

    def execute(self) -> dict:
        aguardando = self.senha_repo.listar_fila_atual()
        ultimas_chamadas = self.senha_repo.listar_ultimas_chamadas()
        
        resumo = {
            "total_aguardando": len(aguardando),
            "senhas": aguardando,
            "ultimas_chamadas": ultimas_chamadas
        }
        return resumo
