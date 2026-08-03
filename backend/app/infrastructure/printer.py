"""
Módulo de Abstração de Impressora Térmica (ESC/POS).
Permite que a aplicação funcione tanto com uma impressora física real (USB/Serial no Raspberry Pi)
quanto com uma impressora Simulada (MockPrinter) que imprime os cupons no terminal durante o desenvolvimento.
"""

from abc import ABC, abstractmethod
import logging
from app.core.config import settings

# Configuração de logs para exibição limpa no console
logger = logging.getLogger("PrinterService")
logging.basicConfig(level=logging.INFO)


class BasePrinter(ABC):
    """Classe Base Abstrata para Serviços de Impressão."""

    @abstractmethod
    def print_ticket(
        self,
        ticket_number: str,
        category_name: str,
        priority_name: str,
        setor_destino: str,
        date_str: str,
        cpf_paciente: str = None,
        qr_code_url: str = None
    ) -> bool:
        """
        Imprime o cupom contendo número da senha, setor de destino, prioridade, CPF e QR Code.
        """
        pass


class MockPrinter(BasePrinter):
    """
    Impressora Simulada para Ambiente de Desenvolvimento (Windows/macOS/Linux sem impressora física).
    Exibe uma representação gráfica ASCII do cupom térmico no terminal.
    """

    def print_ticket(
        self,
        ticket_number: str,
        category_name: str,
        priority_name: str,
        setor_destino: str,
        date_str: str,
        cpf_paciente: str = None,
        qr_code_url: str = None
    ) -> bool:
        cpf_formatted = f"{cpf_paciente[:3]}.***.***-{cpf_paciente[-2:]}" if cpf_paciente and len(cpf_paciente) == 11 else (cpf_paciente or "NÃO INFORMADO")

        receipt_ascii = f"""
========================================
       UNIDADE BÁSICA DE SAÚDE (UBS)
             SUSpicious Totem
========================================
 DATA/HORA: {date_str}
 CPF PACIENTE: {cpf_formatted}

 DEMANDA: {category_name}
 PRIORIDADE: {priority_name}

   ----------------------------------
   SENHA:  [ {ticket_number} ]
   ----------------------------------

   >>> DIRIJA-SE AO: {setor_destino.upper()} <<<

   Por favor, aguarde a chamada no painel.
   Guarde este comprovante.
"""
        if qr_code_url:
            receipt_ascii += f"   QR Code Triagem: {qr_code_url}\n"
        
        receipt_ascii += "========================================\n"

        logger.info("[PRINTER MOCK] Emissão de Cupom em Andamento:")
        print(receipt_ascii)
        return True


class EscposPrinter(BasePrinter):
    """
    Impressora Térmica Física ESC/POS via USB (para uso no Raspberry Pi em produção).
    Utiliza a biblioteca `python-escpos`.
    """

    def __init__(self):
        try:
            self.vendor_id = int(settings.PRINTER_VENDOR_ID, 16)
            self.product_id = int(settings.PRINTER_PRODUCT_ID, 16)
        except Exception:
            self.vendor_id = 0x04b8
            self.product_id = 0x0202

    def print_ticket(
        self,
        ticket_number: str,
        category_name: str,
        priority_name: str,
        setor_destino: str,
        date_str: str,
        cpf_paciente: str = None,
        qr_code_url: str = None
    ) -> bool:
        try:
            from escpos.printer import Usb
            p = Usb(self.vendor_id, self.product_id, profile="TM-T20")
            p.set(align='center', font='a', width=1, height=1)
            p.text("UNIDADE BÁSICA DE SAÚDE (UBS)\n")
            p.text("SUSpicious Totem\n\n")
            p.text(f"Data: {date_str}\n")
            p.text(f"CPF: {cpf_paciente or 'N/A'}\n")
            p.text(f"Demanda: {category_name}\n")
            p.text(f"Prioridade: {priority_name}\n\n")
            
            p.set(align='center', font='a', width=3, height=3)
            p.text(f"{ticket_number}\n\n")
            
            p.set(align='center', font='a', width=2, height=2)
            p.text(f"DIRIJA-SE AO:\n{setor_destino.upper()}\n\n")
            
            p.set(align='center', font='a', width=1, height=1)
            if qr_code_url:
                p.qr(qr_code_url, size=6)
                p.text("\nEscaneie para Triagem Digital\n")
                
            p.text("\nAguarde ser chamado no painel.\n\n\n")
            p.cut()
            return True
        except Exception as e:
            logger.error(f"[PRINTER ESCPOS] Erro na impressora física USB: {e}")
            mock = MockPrinter()
            return mock.print_ticket(ticket_number, category_name, priority_name, setor_destino, date_str, cpf_paciente, qr_code_url)


def get_printer() -> BasePrinter:
    """Retorna a fábrica da impressora (mock ou física escpos)."""
    if settings.PRINTER_MODE.lower() == "escpos":
        return EscposPrinter()
    return MockPrinter()
