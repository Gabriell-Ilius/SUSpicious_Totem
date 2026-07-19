import logging
from escpos.printer import Usb
from app.application.ports.printer_port import PrinterPort
from app.domain.senha import Senha
from app.core.config import settings

logger = logging.getLogger(__name__)

class EscPosPrinter(PrinterPort):
    def __init__(self):
        # Valores hardcoded padrão de muitas impressoras térmicas genéricas
        # Ideialmente, deveriam vir do .env
        self.id_vendor = 0x04b8  # Exemplo padrão Epson
        self.id_product = 0x0202 # Exemplo padrão Epson
        
    def imprimir_senha(self, codigo: str, tipo: str, data_hora: str, senha_id: str = None) -> bool:
        try:
            # Inicializa a impressora USB
            # Caso a impressora exata seja diferente, isso precisará de ajuste na UBS
            printer = Usb(self.id_vendor, self.id_product, timeout=0, in_ep=0x81, out_ep=0x03)
            
            # Formatação
            printer.set(align='center', font='a', width=2, height=2)
            printer.text("SUSpicious Totem\n")
            printer.set(align='center', font='b', width=1, height=1)
            printer.text("Sistema Unico de Saude\n\n")
            
            # Código da Senha Gigante
            printer.set(align='center', font='a', width=4, height=4)
            printer.text(f"{codigo}\n\n")
            
            # Informações Adicionais
            printer.set(align='center', font='a', width=1, height=1)
            printer.text(f"Tipo: {tipo}\n")
            printer.text(f"Data: {data_hora}\n\n")
            
            # QR Code de Triagem
            if senha_id:
                printer.text("Acesse a triagem online:\n")
                url_triagem = f"http://192.168.15.34:5173/triagem/{senha_id}"
                printer.qr(url_triagem, size=6, center=True)
                printer.text("\n\n")
            
            # Corta o papel
            printer.cut()
            
            logger.info(f"EscPosPrinter: Senha {codigo} impressa com sucesso (USB).")
            return True
            
        except Exception as e:
            logger.error(f"EscPosPrinter: Erro crítico ao imprimir senha {codigo}: {e}")
            return False
