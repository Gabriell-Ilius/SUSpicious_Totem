from typing import Optional
from app.domain.paciente import Paciente
from app.application.ports.paciente_repository_port import PacienteRepositoryPort
from app.application.ports.esus_gateway_port import EsusGatewayPort

class ValidarCPFUseCase:
    def __init__(self, paciente_repo: PacienteRepositoryPort, esus_gateway: EsusGatewayPort):
        self.paciente_repo = paciente_repo
        self.esus_gateway = esus_gateway

    def execute(self, cpf: str) -> Optional[Paciente]:
        # 1. Busca localmente
        paciente = self.paciente_repo.buscar_por_cpf(cpf)
        if paciente:
            return paciente
        
        # 2. Se não achou, busca no e-SUS (Mock)
        dados_esus = self.esus_gateway.buscar_paciente(cpf)
        if dados_esus:
            # Cadastra localmente para cache
            novo_paciente = Paciente(
                cpf=dados_esus["cpf"],
                nome=dados_esus["nome"],
                cns=dados_esus.get("cns")
            )
            return self.paciente_repo.salvar(novo_paciente)
            
        return None
