"""
Mock da impressora para desenvolvimento.

Imprime as senhas no terminal ao invés de usar a impressora real.
Permite desenvolver e testar no Windows sem hardware.
"""

from app.application.ports.printer_port import PrinterPort


class MockPrinter(PrinterPort):
    """Simulação da impressora térmica para ambiente de desenvolvimento."""

    def imprimir_senha(self, codigo: str, tipo: str, data_hora: str) -> None:
        """Imprime a senha no terminal."""
        print("=" * 40)
        print("   🖨️  [MOCK PRINTER] Senha Impressa")
        print("=" * 40)
        print(f"   Código:    {codigo}")
        print(f"   Tipo:      {tipo}")
        print(f"   Data/Hora: {data_hora}")
        print("=" * 40)
        print()

    def verificar_conexao(self) -> bool:
        """Mock sempre retorna True."""
        return True
