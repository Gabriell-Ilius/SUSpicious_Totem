from typing import Optional
from app.domain.senha import Senha, StatusSenha, agora_sp
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class ChamarProximaSenhaUseCase:
    def __init__(self, senha_repo: SenhaRepositoryPort):
        self.senha_repo = senha_repo

    def execute(self, setor_destino: Optional[str] = None, senha_id: Optional[str] = None) -> Optional[Senha]:
        if senha_id:
            senha = self.senha_repo.buscar_por_id(senha_id)
        else:
            senha = self.senha_repo.buscar_proxima_senha()

        if not senha:
            return None
            
        senha.status = StatusSenha.CHAMADA
        senha.data_hora_chamada = agora_sp()
        if setor_destino:
            senha.setor_destino = setor_destino
        
        return self.senha_repo.salvar(senha)
