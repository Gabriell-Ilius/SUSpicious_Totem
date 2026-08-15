import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.infrastructure.database.session import get_session
from app.domain import Paciente, Senha
from app.domain.agendamento import Agendamento
from main import app

sqlite_url = "sqlite:///./test.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_check_cpf_schedule(client: TestClient):
    response = client.post("/api/senhas/check-cpf", json={"cpf": "11111111111"})
    assert response.status_code == 200
    data = response.json()
    assert data["has_schedule"] is True
    assert "paciente" in data
    assert "consultorio" in data

def test_gerar_senha(client: TestClient):
    response = client.post("/api/senhas/", json={"tipo_atendimento": "VACINACAO", "prioridade": 1, "sub_prioridade": "PCD"})
    assert response.status_code == 200
    data = response.json()
    assert data["tipo_atendimento"] == "VACINACAO"
    assert "VAC-P001" in data["codigo"]
    assert data["status"] == "AGUARDANDO"
    assert data["prioridade"] == 1
    assert data["sub_prioridade"] == "PCD"

def test_chamar_proxima_senha(client: TestClient):
    client.post("/api/senhas/", json={"tipo_atendimento": "ESPONTANEA", "prioridade": 0})
    client.post("/api/senhas/", json={"tipo_atendimento": "VACINACAO", "prioridade": 1})
    
    response = client.post("/api/senhas/proxima")
    assert response.status_code == 200
    data = response.json()
    assert data["tipo_atendimento"] == "VACINACAO"
    assert data["status"] == "CHAMADA"

def test_consultar_fila_atual(client: TestClient):
    client.post("/api/senhas/", json={"tipo_atendimento": "ESPONTANEA", "prioridade": 0})
    
    response = client.get("/api/filas/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_aguardando"] == 1
    assert data["senhas"][0]["tipo_atendimento"] == "ESPONTANEA"
