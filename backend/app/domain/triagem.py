from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.domain.senha import agora_sp

class Triagem(SQLModel, table=True):
    __tablename__ = "triagens"

    id: Optional[int] = Field(default=None, primary_key=True)
    senha_codigo: str = Field(index=True)
    dor: int = Field(default=0)  # 0 a 10
    tempo: str = Field(default="hoje")
    queixa: Optional[str] = Field(default="")
    falta_ar: bool = Field(default=False)
    sangramento: bool = Field(default=False)
    fala_movimento: bool = Field(default=False)
    hipertensao: bool = Field(default=False)
    diabetes: bool = Field(default=False)
    gestante: bool = Field(default=False)
    classificacao_risco: str = Field(default="VERDE")  # VERMELHO, LARANJA, AMARELO, VERDE, AZUL
    nivel_risco: int = Field(default=1)  # 1 = Baixo, 2 = Médio, 3 = Alto, 4 = Emergência
    data_hora: datetime = Field(default_factory=agora_sp)
