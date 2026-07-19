"""SUSpicious Totem — Interfaces abstratas (Ports) para inversão de dependência."""

from .printer_port import PrinterPort
from .paciente_repository_port import PacienteRepositoryPort
from .esus_gateway_port import EsusGatewayPort
from .senha_repository_port import SenhaRepositoryPort

__all__ = ["PrinterPort", "PacienteRepositoryPort", "EsusGatewayPort", "SenhaRepositoryPort"]
