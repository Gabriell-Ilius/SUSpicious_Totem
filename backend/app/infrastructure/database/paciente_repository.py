from typing import Optional
from sqlmodel import Session, select
from app.domain.paciente import Paciente
from app.application.ports.paciente_repository_port import PacienteRepositoryPort

class PacienteRepository(PacienteRepositoryPort):
    def __init__(self, session: Session):
        self.session = session

    def buscar_por_cpf(self, cpf: str) -> Optional[Paciente]:
        statement = select(Paciente).where(Paciente.cpf == cpf)
        return self.session.exec(statement).first()

    def salvar(self, paciente: Paciente) -> Paciente:
        self.session.add(paciente)
        self.session.commit()
        self.session.refresh(paciente)
        return paciente

    def listar_todos(self) -> list[Paciente]:
        return list(self.session.exec(select(Paciente)).all())
