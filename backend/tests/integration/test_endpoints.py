import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.infrastructure.database.session import get_session
from app.domain import Paciente, Senha
from main import app

# Setup test DB (SQLite local file to avoid :memory: connection loss)
sqlite_url = "sqlite:///./test.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

@pytest.fixture(name="session")
def session_fixture():
    print("Tables before create_all:", SQLModel.metadata.tables.keys())
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

def test_gerar_senha(client: TestClient):
    response = client.post("/api/senhas/", json={"tipo_atendimento": "VACINACAO", "prioridade": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["tipo_atendimento"] == "VACINACAO"
    assert data["codigo"] == "VAC-001"
    assert data["status"] == "AGUARDANDO"
    assert data["prioridade"] == 1

def test_chamar_proxima_senha(client: TestClient):
    # Gerar duas senhas
    client.post("/api/senhas/", json={"tipo_atendimento": "ESPONTANEA", "prioridade": 0})
    client.post("/api/senhas/", json={"tipo_atendimento": "VACINACAO", "prioridade": 1}) # Prioridade maior
    
    # Chamar próxima
    response = client.post("/api/senhas/proxima")
    assert response.status_code == 200
    data = response.json()
    # A de maior prioridade deve ser chamada primeiro
    assert data["tipo_atendimento"] == "VACINACAO"
    assert data["status"] == "CHAMADA"

def test_consultar_fila_atual(client: TestClient):
    client.post("/api/senhas/", json={"tipo_atendimento": "ESPONTANEA", "prioridade": 0})
    
    response = client.get("/api/filas/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_aguardando"] == 1
    assert data["senhas"][0]["tipo_atendimento"] == "ESPONTANEA"

def test_validar_cpf_mock(client: TestClient):
    # O mock retorna dados para um CPF específico (ex: 11111111111 ou 00000000000)
    # Veja mock_esus_gateway.py para CPF exato (normalmente qualquer no mock funciona se não estiver vazio)
    response = client.get("/api/pacientes/12345678901")
    assert response.status_code == 200
    data = response.json()
    assert data["cpf"] == "12345678901"
    assert "nome" in data
