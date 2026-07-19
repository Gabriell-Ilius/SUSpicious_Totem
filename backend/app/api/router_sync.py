from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.infrastructure.database.session import get_session
from app.infrastructure.database.senha_repository import SenhaRepository

router_sync = APIRouter()

@router_sync.get("/status")
def get_sync_status(session: Session = Depends(get_session)):
    repo = SenhaRepository(session)
    pendentes = repo.listar_nao_sincronizadas()
    
    return {
        "total_pendentes": len(pendentes),
        "status": "online"
    }
