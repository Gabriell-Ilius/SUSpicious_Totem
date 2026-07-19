"""
Mock da impressora para desenvolvimento.

Imprime as senhas no terminal ao invés de usar a impressora real.
Permite desenvolver e testar no Windows sem hardware.
"""

from app.application.ports.printer_port import PrinterPort


class MockPrinter(PrinterPort):
    """Simulação da impressora térmica para ambiente de desenvolvimento."""

    def imprimir_senha(self, codigo: str, tipo: str, data_hora: str, senha_id: str = None) -> bool:
        print("\n" + "="*30)
        print(f"| SUSpicious Totem            |")
        print(f"|-----------------------------|")
        print(f"| SENHA: {codigo.ljust(21)}|")
        print(f"| TIPO:  {tipo.ljust(21)}|")
        print(f"| DATA:  {data_hora.ljust(21)}|")
        if senha_id:
            print(f"| QRCODE: {senha_id.ljust(20)}|")
        print("="*30 + "\n")
        return True
        print()

    def verificar_conexao(self) -> bool:
        """Mock sempre retorna True."""
        return True
