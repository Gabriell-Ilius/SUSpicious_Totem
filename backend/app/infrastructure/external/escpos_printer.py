import logging
from typing import Optional
from app.application.ports.printer_port import PrinterPort
from app.core.config import settings

logger = logging.getLogger(__name__)

class EscPosPrinter(PrinterPort):
    def __init__(self):
        try:
            self.id_vendor = int(settings.PRINTER_VENDOR_ID, 16)
            self.id_product = int(settings.PRINTER_PRODUCT_ID, 16)
        except Exception:
            self.id_vendor = 0x04b8
            self.id_product = 0x0202

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
        try:
            from escpos.printer import Usb
            p = Usb(self.id_vendor, self.id_product, timeout=1000, profile="TM-T20")
            
            p.set(align='center', font='a', width=1, height=1)
            p.text("UNIDADE BASICA DE SAUDE (UBS)\n")
            p.text("SUSpicious Totem\n\n")
            
            p.text(f"Data: {data_hora}\n")
            p.text(f"CPF: {cpf or 'N/A'}\n")
            if patient_name:
                p.text(f"Paciente: {patient_name.upper()}\n")
            p.text(f"Demanda: {tipo}\n")
            p.text(f"Prioridade: {prioridade or 'NORMAL'}\n\n")

            p.set(align='center', font='a', width=3, height=3)
            p.text(f"{codigo}\n\n")

            if setor_destino:
                p.set(align='center', font='a', width=2, height=2)
                p.text(f"DIRIJA-SE AO:\n{setor_destino.upper()}\n\n")

            p.set(align='center', font='a', width=1, height=1)
            target_qr = qr_code_url or (f"http://192.168.15.34:5173/triagem/{senha_id}" if senha_id else None)
            if target_qr:
                p.qr(target_qr, size=6)
                p.text("\nEscaneie para Triagem Digital\n")

            p.text("\nAguarde ser chamado no painel.\n\n\n")
            p.cut()
            logger.info(f"EscPosPrinter: Senha {codigo} impressa com sucesso (USB).")
            return True
        except Exception as e:
            logger.error(f"EscPosPrinter: Erro na impressora física USB ({e}). Usando fallback mock.")
            from app.infrastructure.hardware.mock_printer import MockPrinter
            mock = MockPrinter()
            return mock.imprimir_senha(codigo, tipo, data_hora, senha_id, setor_destino, prioridade, cpf, patient_name, target_qr)

    def verificar_conexao(self) -> bool:
        return True
