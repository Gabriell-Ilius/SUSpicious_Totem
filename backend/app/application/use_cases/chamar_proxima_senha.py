from typing import Optional
from app.domain.senha import Senha, StatusSenha, agora_sp
from app.application.ports.senha_repository_port import SenhaRepositoryPort
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class ChamarProximaSenhaUseCase:
    def __init__(self, senha_repo: SenhaRepositoryPort):
        self.senha_repo = senha_repo

    def execute(self) -> Optional[Senha]:
        proxima = self.senha_repo.buscar_proxima_senha()
        if not proxima:
            return None
            
        proxima.status = StatusSenha.CHAMADA
        proxima.data_hora_chamada = agora_sp()
        
        return self.senha_repo.salvar(proxima)
