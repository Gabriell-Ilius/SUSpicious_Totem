from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from sqlmodel import Session, select
from app.infrastructure.database.session import get_session
from app.domain.triagem import Triagem
from app.domain.senha import Senha, agora_sp
from app.infrastructure.database.senha_repository import SenhaRepository

class TriagemCreateRequest(BaseModel):
    senha_codigo: str
    cpf: Optional[str] = None
    dor: int = 0
    tempo: str = "hoje"
    queixa: Optional[str] = ""
    falta_ar: bool = False
    sangramento: bool = False
    fala_movimento: bool = False
    hipertensao: bool = False
    diabetes: bool = False
    gestante: bool = False

router = APIRouter(prefix="/triagem", tags=["triagem"])

def calcular_classificacao_manchester(req: TriagemCreateRequest) -> tuple[str, int]:
    """
    Classifica a gravidade do paciente baseado no Protocolo de Manchester e sinais vitais relatados:
    - Vermelho (Emergência): Dor >= 9, falta de ar severa ou alteração na fala/movimento.
    - Laranja (Muito Urgente): Dor >= 7 ou sangramento ativo ou dor intensa com comorbidade.
    - Amarelo (Urgente): Dor >= 4 ou febre/tempo prolongado.
    - Verde (Pouco Urgente): Dor <= 3, sem sinais de alarme.
    """
    if req.falta_ar or req.fala_movimento or req.dor >= 9:
        return "VERMELHO - EMERGÊNCIA", 4
    elif req.sangramento or req.dor >= 7 or (req.dor >= 5 and (req.hipertensao or req.diabetes or req.gestante)):
        return "LARANJA - MUITO URGENTE", 3
    elif req.dor >= 4:
        return "AMARELO - URGENTE", 2
    elif req.dor >= 1:
        return "VERDE - POUCO URGENTE", 1
    return "AZUL - NÃO URGENTE", 0

@router.post("", response_model=Triagem)
@router.post("/", response_model=Triagem)
def registrar_triagem(req: TriagemCreateRequest, session: Session = Depends(get_session)):
    classificacao, nivel = calcular_classificacao_manchester(req)
    
    # Se enviou CPF e a Senha no banco não tinha CPF, vincula para sincronização e-SUS na nuvem
    repo_senha = SenhaRepository(session)
    senha_obj = repo_senha.buscar_por_id(req.senha_codigo)
    cpf_final = req.cpf
    if senha_obj:
        if not senha_obj.cpf and req.cpf:
            senha_obj.cpf = req.cpf
            senha_obj.status_sincronizacao = False
            repo_senha.salvar(senha_obj)
        elif senha_obj.cpf and not cpf_final:
            cpf_final = senha_obj.cpf

    triagem = Triagem(
        senha_codigo=req.senha_codigo.upper(),
        cpf=cpf_final,
        dor=req.dor,
        tempo=req.tempo,
        queixa=req.queixa,
        falta_ar=req.falta_ar,
        sangramento=req.sangramento,
        fala_movimento=req.fala_movimento,
        hipertensao=req.hipertensao,
        diabetes=req.diabetes,
        gestante=req.gestante,
        classificacao_risco=classificacao,
        nivel_risco=nivel,
        data_hora=agora_sp()
    )
    
    session.add(triagem)
    session.commit()
    session.refresh(triagem)
    return triagem

@router.get("", response_model=List[Triagem])
@router.get("/", response_model=List[Triagem])
def listar_triagens(session: Session = Depends(get_session)):
    statement = select(Triagem).order_by(Triagem.data_hora.desc()).limit(30)
    return list(session.exec(statement).all())

@router.get("/{senha_codigo}", response_model=Optional[Triagem])
def buscar_triagem_por_senha(senha_codigo: str, session: Session = Depends(get_session)):
    statement = select(Triagem).where(Triagem.senha_codigo == senha_codigo.upper()).order_by(Triagem.data_hora.desc())
    return session.exec(statement).first()
