import uuid
from typing import Optional
from app.domain.senha import Senha, TipoAtendimento
from app.application.ports.senha_repository_port import SenhaRepositoryPort
from app.application.ports.printer_port import PrinterPort
from app.application.use_cases.validar_cpf import ValidarCPFUseCase

class GerarSenhaUseCase:
    def __init__(self, senha_repo: SenhaRepositoryPort, printer: PrinterPort, validar_cpf_uc: Optional[ValidarCPFUseCase] = None):
        self.senha_repo = senha_repo
        self.printer = printer
        self.validar_cpf_uc = validar_cpf_uc

    def execute(self, tipo: TipoAtendimento, cpf: Optional[str] = None, prioridade: int = 0) -> Senha:
        paciente_id = None
        if cpf and self.validar_cpf_uc:
            paciente = self.validar_cpf_uc.execute(cpf)
            if paciente:
                paciente_id = paciente.id

        codigo = self.senha_repo.gerar_codigo_senha(tipo)
        
        nova_senha = Senha(
            codigo=codigo,
            tipo_atendimento=tipo,
            prioridade=prioridade,
            paciente_id=paciente_id
        )
        
        senha_salva = self.senha_repo.salvar(nova_senha)
        
        # Imprime a ficha
        sucesso = self.printer.imprimir_senha(
            codigo=senha_salva.codigo,
            tipo=senha_salva.tipo_atendimento.value,
            data_hora=senha_salva.data_hora_emissao.strftime("%d/%m/%Y %H:%M:%S"),
            senha_id=str(senha_salva.id)
        )
        
        if not sucesso:
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="Falha na impressora. Sem papel ou desconectada.")
        
        return senha_salva
