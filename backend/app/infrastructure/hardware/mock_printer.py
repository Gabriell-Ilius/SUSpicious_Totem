from typing import Optional
from app.application.ports.printer_port import PrinterPort

class MockPrinter(PrinterPort):
    """Implementação mock da impressora para desenvolvimento sem hardware."""

    def imprimir_senha(
        self,
        codigo: str,
        tipo: str,
        data_hora: str,
        senha_id: Optional[str] = None,
        setor_destino: Optional[str] = None,
        prioridade: Optional[str] = None,
        cpf: Optional[str] = None,
        patient_name: Optional[str] = None,
        qr_code_url: Optional[str] = None
    ) -> bool:
        cpf_formatted = f"{cpf[:3]}.***.***-{cpf[-2:]}" if cpf and len(cpf) == 11 else (cpf or "NÃO INFORMADO")
        patient_line = f" PACIENTE: {patient_name.upper()}\n" if patient_name else ""
        destino_line = f"   >>> DIRIJA-SE AO: {setor_destino.upper()} <<<\n" if setor_destino else ""

        print("\n" + "="*44)
        print("       UNIDADE BÁSICA DE SAÚDE (UBS)")
        print("             SUSpicious Totem")
        print("="*44)
        print(f" DATA/HORA: {data_hora}")
        print(f" CPF PACIENTE: {cpf_formatted}")
        if patient_line:
            print(patient_line.rstrip())
        print(f" DEMANDA: {tipo}")
        print(f" PRIORIDADE: {prioridade or 'NORMAL'}")
        print("   ----------------------------------------")
        print(f"   SENHA:  [ {codigo} ]")
        print("   ----------------------------------------")
        if destino_line:
            print(destino_line.rstrip())
        print("   Por favor, aguarde a chamada no painel.")
        print("   Guarde este comprovante.")
        if qr_code_url:
            print(f"   QR Code Triagem: {qr_code_url}")
        print("="*44 + "\n")
        return True

    def verificar_conexao(self) -> bool:
        return True
