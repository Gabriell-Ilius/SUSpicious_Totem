"""
Fixtures compartilhadas para testes.

Configura banco in-memory, client HTTP de teste e mocks padrão.
"""

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """Client HTTP de teste para os endpoints FastAPI."""
    with TestClient(app) as c:
        yield c
