from typing import Optional
from sqlalchemy import func
from sqlmodel import Session, select
from app.domain.senha import Senha, TipoAtendimento, StatusSenha, agora_sp
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class SenhaRepository(SenhaRepositoryPort):
    def __init__(self, session: Session):
        self.session = session

    def gerar_codigo_senha(self, tipo: TipoAtendimento, prioridade: int = 0) -> str:
        hoje = agora_sp().replace(hour=0, minute=0, second=0, microsecond=0)
        count = self.session.exec(
            select(func.count(Senha.id)).where(
                Senha.tipo_atendimento == tipo,
                Senha.data_hora_emissao >= hoje
            )
        ).one() or 0
        
        prefixos = {
            TipoAtendimento.AGENDADA: "AGN",
            TipoAtendimento.ESPONTANEA: "ESP",
            TipoAtendimento.VACINACAO: "VAC",
            TipoAtendimento.FARMACIA: "FAR",
            TipoAtendimento.TRIAGEM_DIGITAL: "TRG"
        }
        prefixo = prefixos.get(tipo, "SNH")
        p_flag = "P" if prioridade == 1 else ""
        return f"{prefixo}-{p_flag}{count + 1:03d}"

    def salvar(self, senha: Senha) -> Senha:
        self.session.add(senha)
        self.session.commit()
        self.session.refresh(senha)
        return senha

    def buscar_proxima_senha(self) -> Optional[Senha]:
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

    def listar_ultimas_chamadas(self, limite: int = 4) -> list[Senha]:
        statement = select(Senha).where(Senha.status == StatusSenha.CHAMADA).order_by(
            Senha.data_hora_chamada.desc()
        ).limit(limite)
        return list(self.session.exec(statement).all())

    def listar_nao_sincronizadas(self) -> list[Senha]:
        statement = select(Senha).where(Senha.status_sincronizacao == False).order_by(
            Senha.data_hora_emissao.asc()
        )
        return list(self.session.exec(statement).all())
