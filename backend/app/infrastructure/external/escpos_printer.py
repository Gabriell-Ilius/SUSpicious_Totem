import logging
from typing import Optional
from app.application.ports.printer_port import PrinterPort

logger = logging.getLogger(__name__)

class EscPosPrinter(PrinterPort):
    """
    Driver de impressão térmica ESC/POS para Raspberry Pi via USB.
    Gera tickets estilizados do SUS com QR Code e aviso de espera na TV.
    """

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
            # IDs de fornecedor/produto comuns em impressoras térmicas ESC/POS (Epson, POS58, Bematech)
            # timeout=1000 previne travamentos se a impressora for desconectada
            p = Usb(0x04b8, 0x0202, timeout=1000, in_ep=0x81, out_ep=0x02)
            
            p.set(align='center', font='a', width=2, height=2)
            p.text("UNIDADE BASICA DE SAUDE\n")
            p.text("SUSpicious Totem\n\n")

            p.set(align='left', font='a', width=1, height=1)
            p.text(f"Data/Hora: {data_hora}\n")
            if cpf:
                cpf_masked = f"{cpf[:3]}.***.***-{cpf[-2:]}" if len(cpf) == 11 else cpf
                p.text(f"CPF: {cpf_masked}\n")
            if patient_name:
                p.text(f"Paciente: {patient_name.upper()}\n")
            p.text(f"Demanda: {tipo}\n")
            p.text(f"Prioridade: {prioridade or 'NORMAL'}\n\n")

            p.set(align='center', font='a', width=3, height=3)
            p.text(f"{codigo}\n\n")

            p.set(align='center', font='a', width=1, height=1)
            p.text("----------------------------------------\n")
            p.text("POR FAVOR, AGUARDE NA RECEPCAO!\n")
            p.text("FIQUE ATENTO AO PAINEL DA TV PARA A SUA\n")
            p.text("CHAMADA E A INDICACAO DO CONSULTORIO.\n")
            p.text("----------------------------------------\n\n")

            target_qr = qr_code_url or (f"http://192.168.15.34:5173/triagem/{senha_id}" if senha_id else None)
            if target_qr:
                p.qr(target_qr, size=6)
                p.text("\nEscaneie para Pre-Triagem Digital\n")

            p.text("\n\n\n")
            p.cut()
            logger.info(f"EscPosPrinter: Senha {codigo} impressa com sucesso (USB).")
            return True
        except Exception as e:
            logger.error(f"EscPosPrinter: Erro na impressora física USB ({e}). Usando fallback mock.")
            from app.infrastructure.hardware.mock_printer import MockPrinter
            mock = MockPrinter()
            return mock.imprimir_senha(codigo, tipo, data_hora, senha_id, setor_destino, prioridade, cpf, patient_name, qr_code_url)

    def verificar_conexao(self) -> bool:
        return True
