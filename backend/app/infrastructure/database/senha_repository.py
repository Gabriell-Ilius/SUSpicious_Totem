import uuid
from typing import Optional
from sqlmodel import Session, select, func
from app.domain.senha import Senha, StatusSenha, TipoAtendimento, agora_sp
from app.application.ports.senha_repository_port import SenhaRepositoryPort

class SenhaRepository(SenhaRepositoryPort):
    def __init__(self, session: Session):
        self.session = session

    def proximo_numero_sequencial(self, tipo: TipoAtendimento) -> int:
        hoje_inicio = agora_sp().replace(hour=0, minute=0, second=0, microsecond=0)
        statement = (
            select(func.count(Senha.id))
            .where(Senha.tipo_atendimento == tipo)
            .where(Senha.data_hora_emissao >= hoje_inicio)
        )
        total = self.session.exec(statement).one()
        return total + 1

    def gerar_codigo(self, tipo: TipoAtendimento, prioridade: int = 0) -> str:
        seq = self.proximo_numero_sequencial(tipo)
        prefix_map = {
            TipoAtendimento.AGENDADA: "AGN",
            TipoAtendimento.ESPONTANEA: "ESP",
            TipoAtendimento.VACINACAO: "VAC",
            TipoAtendimento.FARMACIA: "FAR",
            TipoAtendimento.TRIAGEM_DIGITAL: "TRG",
        }
        prefix = prefix_map.get(tipo, "ATD")
        flag = "P" if prioridade == 1 else ""
        return f"{prefix}-{flag}{seq:03d}"

    def gerar_codigo_senha(self, tipo: TipoAtendimento, prioridade: int = 0) -> str:
        return self.gerar_codigo(tipo, prioridade)

    def salvar(self, senha: Senha) -> Senha:
        self.session.add(senha)
        self.session.commit()
        self.session.refresh(senha)
        return senha

    def buscar_por_id(self, senha_id: str) -> Optional[Senha]:
        if not senha_id:
            return None
        
        # Tenta buscar por UUID objeto
        try:
            uid = uuid.UUID(str(senha_id))
            statement = select(Senha).where(Senha.id == uid)
            senha = self.session.exec(statement).first()
            if senha:
                return senha
        except Exception:
            pass

        # Tenta buscar por código textual da senha (ex: "ESP-001", "AGN-001")
        statement = select(Senha).where(Senha.codigo == str(senha_id).upper())
        return self.session.exec(statement).first()

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

    def listar_ultimas_chamadas(self, limite: int = 6) -> list[Senha]:
        statement = select(Senha).where(Senha.status == StatusSenha.CHAMADA).order_by(
            Senha.data_hora_chamada.desc()
        ).limit(limite)
        return list(self.session.exec(statement).all())

    def listar_nao_sincronizadas(self) -> list[Senha]:
        statement = select(Senha).where(Senha.status_sincronizacao == False).order_by(
            Senha.data_hora_emissao.asc()
        )
        return list(self.session.exec(statement).all())

    def limpar_todas_senhas(self) -> int:
        statement = select(Senha)
        senhas = list(self.session.exec(statement).all())
        for s in senhas:
            self.session.delete(s)
        self.session.commit()
        return len(senhas)
