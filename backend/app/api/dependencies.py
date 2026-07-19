from fastapi import Depends
from sqlmodel import Session

from app.infrastructure.database.session import get_session
from app.infrastructure.database.senha_repository import SenhaRepository
from app.infrastructure.database.paciente_repository import PacienteRepository
from app.infrastructure.hardware.mock_printer import MockPrinter
from app.infrastructure.external.mock_esus_gateway import MockEsusGateway

from app.application.use_cases.gerar_senha import GerarSenhaUseCase
from app.application.use_cases.validar_cpf import ValidarCPFUseCase
from app.application.use_cases.chamar_proxima_senha import ChamarProximaSenhaUseCase
from app.application.use_cases.consultar_fila_atual import ConsultarFilaAtualUseCase

# --- Infra providers ---

def get_printer():
    return MockPrinter()

def get_esus_gateway():
    return MockEsusGateway()

# --- Use Case providers ---

def get_validar_cpf_uc(
    session: Session = Depends(get_session),
    gateway = Depends(get_esus_gateway)
) -> ValidarCPFUseCase:
    repo = PacienteRepository(session)
    return ValidarCPFUseCase(repo, gateway)

def get_gerar_senha_uc(
    session: Session = Depends(get_session),
    printer = Depends(get_printer),
    validar_cpf_uc: ValidarCPFUseCase = Depends(get_validar_cpf_uc)
) -> GerarSenhaUseCase:
    repo = SenhaRepository(session)
    return GerarSenhaUseCase(repo, printer, validar_cpf_uc)

def get_chamar_proxima_senha_uc(
    session: Session = Depends(get_session)
) -> ChamarProximaSenhaUseCase:
    repo = SenhaRepository(session)
    return ChamarProximaSenhaUseCase(repo)

def get_consultar_fila_uc(
    session: Session = Depends(get_session)
) -> ConsultarFilaAtualUseCase:
    repo = SenhaRepository(session)
    return ConsultarFilaAtualUseCase(repo)
