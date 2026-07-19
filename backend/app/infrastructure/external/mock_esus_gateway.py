"""
Mock do gateway e-SUS para desenvolvimento.

Retorna dados fictícios sem precisar de conexão com o PEC real.
"""

from typing import Optional

from app.application.ports.esus_gateway_port import EsusGatewayPort


class MockEsusGateway(EsusGatewayPort):
    """Simulação da API do e-SUS PEC para ambiente de desenvolvimento."""

    def buscar_paciente(self, cpf: str) -> Optional[dict]:
        """Retorna um paciente fictício para qualquer CPF válido."""
        return {
            "cpf": cpf,
            "nome": "Paciente Simulado",
            "cns": "000000000000000",
            "data_nascimento": "1990-01-01",
        }

    def enviar_registro(self, registro: dict) -> bool:
        """Simula envio bem-sucedido."""
        print(f"[MOCK e-SUS] Registro enviado: {registro.get('tipo', 'N/A')}")
        return True

    def verificar_conexao(self) -> bool:
        """Mock sempre retorna True."""
        return True
