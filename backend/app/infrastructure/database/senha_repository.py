from typing import Optional
from sqlalchemy import func
from sqlmodel import Session, select
from app.domain.senha import Senha, TipoAtendimento, StatusSenha, agora_sp
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class SenhaRepository(SenhaRepositoryPort):
    def __init__(self, session: Session):
        self.session = session

    def gerar_codigo_senha(self, tipo: TipoAtendimento) -> str:
        hoje = agora_sp().replace(hour=0, minute=0, second=0, microsecond=0)
        count = self.session.exec(
            select(func.count(Senha.id)).where(
                Senha.tipo_atendimento == tipo,
                Senha.data_hora_emissao >= hoje
            )
        ).one()
        
        prefixo = "AGE" if tipo == TipoAtendimento.AGENDADA else ("ESP" if tipo == TipoAtendimento.ESPONTANEA else "VAC")
        # +1 para ser o próximo
        return f"{prefixo}-{count + 1:03d}"

    def salvar(self, senha: Senha) -> Senha:
        self.session.add(senha)
        self.session.commit()
        self.session.refresh(senha)
        return senha

    def buscar_proxima_senha(self) -> Optional[Senha]:
        # Busca a próxima aguardando, ordem: maior prioridade primeiro, depois a mais antiga
        statement = select(Senha).where(Senha.status == StatusSenha.AGUARDANDO).order_by(
            Senha.prioridade.desc(),
            Senha.data_hora_emissao.asc()
        )
        return self.session.exec(statement).first()

    def listar_fila_atual(self) -> list[Senha]:
        statement = select(Senha).where(Senha.status == StatusSenha.AGUARDANDO).order_by(
            Senha.prioridade.desc(),
            Senha.data_hora_emissao.asc()
        )
        return list(self.session.exec(statement).all())
