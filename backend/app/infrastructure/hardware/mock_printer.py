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

        print("\n" + "="*48)
        print("         UNIDADE BÁSICA DE SAÚDE (UBS)")
        print("               SUSpicious Totem")
        print("="*48)
        print(f" DATA/HORA: {data_hora}")
        print(f" CPF PACIENTE: {cpf_formatted}")
        if patient_line:
            print(patient_line.rstrip())
        print(f" DEMANDA: {tipo}")
        print(f" PRIORIDADE: {prioridade or 'NORMAL'}")
        print("   ----------------------------------------")
        print(f"   SENHA:  [ {codigo} ]")
        print("   ----------------------------------------")
        print("   >>> POR FAVOR, AGUARDE NA RECEPÇÃO! <<<")
        print("   FIQUE ATENTO AO PAINEL DA TV PARA A SUA")
        print("   CHAMADA E A INDICAÇÃO DO CONSULTÓRIO.")
        print("   ----------------------------------------")
        if qr_code_url:
            print(f"   QR Code Pré-Triagem: {qr_code_url}")
        print("="*48 + "\n")
        return True

    def verificar_conexao(self) -> bool:
        return True
