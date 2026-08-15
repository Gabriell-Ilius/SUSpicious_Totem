import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import select
from app.domain.senha import Senha, TipoAtendimento
from app.domain.agendamento import Agendamento
from app.application.ports.senha_repository_port import SenhaRepositoryPort
from app.application.ports.printer_port import PrinterPort
from app.application.use_cases.validar_cpf import ValidarCPFUseCase

MOCK_ESUS_FALLBACK = {
    "11111111111": {"paciente": "João da Silva Santos (Demo Pitch)", "consultorio": "Consultório 02 - Dra. Camila Rocha"},
    "12345678900": {"paciente": "Maria Silva Santos", "consultorio": "Consultório 01 - Dra. Ana Costa"},
    "98765432100": {"paciente": "João Pereira Oliveira", "consultorio": "Consultório 04 - Dr. Carlos Souza"},
    "11122233344": {"paciente": "Francisca Rodrigues", "consultorio": "Consultório 01 - Dra. Ana Costa"}
}

class GerarSenhaUseCase:
    def __init__(self, senha_repo: SenhaRepositoryPort, printer: PrinterPort, validar_cpf_uc: Optional[ValidarCPFUseCase] = None, session = None):
        self.senha_repo = senha_repo
        self.printer = printer
        self.validar_cpf_uc = validar_cpf_uc
        self.session = session

    def _calcular_setor_destino(self, tipo: TipoAtendimento, clean_cpf: Optional[str]) -> tuple[str, Optional[str]]:
        patient_name = None
        if tipo == TipoAtendimento.AGENDADA and clean_cpf and self.session:
            today_start = datetime.combine(datetime.now().date(), datetime.min.time())
            today_end = datetime.combine(datetime.now().date(), datetime.max.time())
            statement = select(Agendamento).where(
                Agendamento.cpf == clean_cpf,
                Agendamento.scheduled_time >= today_start,
                Agendamento.scheduled_time <= today_end
            )
            appt = self.session.exec(statement).first()
            if appt:
                return f"{appt.room} - {appt.doctor_name}", appt.patient_name

        if clean_cpf and clean_cpf in MOCK_ESUS_FALLBACK:
            return MOCK_ESUS_FALLBACK[clean_cpf]["consultorio"], MOCK_ESUS_FALLBACK[clean_cpf]["paciente"]

        destinos = {
            TipoAtendimento.AGENDADA: "Consultório 02 - Atendimento Agendado",
            TipoAtendimento.ESPONTANEA: "Balcão 01 - Acolhimento & Triagem",
            TipoAtendimento.VACINACAO: "Sala de Imunização 02 - Vacinas",
            TipoAtendimento.FARMACIA: "Farmácia Básica - Dispensação de Medicamentos",
            TipoAtendimento.TRIAGEM_DIGITAL: "Balcão de Triagem Digital (QR)"
        }
        return destinos.get(tipo, "Balcão de Atendimento Geral"), None

    def execute(
        self,
        tipo: TipoAtendimento,
        cpf: Optional[str] = None,
        prioridade: int = 0,
        sub_prioridade: Optional[str] = None
    ) -> Senha:
        clean_cpf = "".join(filter(str.isdigit, cpf)) if cpf else None
        paciente_id = None
        
        if clean_cpf and self.validar_cpf_uc:
            paciente = self.validar_cpf_uc.execute(clean_cpf)
            if paciente:
                paciente_id = paciente.id

        setor_destino, detected_patient_name = self._calcular_setor_destino(tipo, clean_cpf)
        codigo = self.senha_repo.gerar_codigo_senha(tipo, prioridade)

        qr_url = f"http://192.168.15.34:5173/triagem/{codigo}" if tipo in (TipoAtendimento.TRIAGEM_DIGITAL, TipoAtendimento.ESPONTANEA) else None

        nova_senha = Senha(
            codigo=codigo,
            tipo_atendimento=tipo,
            prioridade=prioridade,
            sub_prioridade=sub_prioridade,
            setor_destino=setor_destino,
            patient_name=detected_patient_name,
            cpf=clean_cpf,
            qr_code_data=qr_url,
            paciente_id=paciente_id
        )
        
        senha_salva = self.senha_repo.salvar(nova_senha)
        
        priority_label = f"PREFERENCIAL ({sub_prioridade})" if (prioridade == 1 and sub_prioridade) else ("PREFERENCIAL" if prioridade == 1 else "NORMAL")

        sucesso = self.printer.imprimir_senha(
            codigo=senha_salva.codigo,
            tipo=senha_salva.tipo_atendimento.value,
            data_hora=senha_salva.data_hora_emissao.strftime("%d/%m/%Y %H:%M:%S"),
            senha_id=str(senha_salva.id),
            setor_destino=senha_salva.setor_destino,
            prioridade=priority_label,
            cpf=clean_cpf,
            patient_name=senha_salva.patient_name,
            qr_code_url=qr_url
        )
        
        if not sucesso:
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail="Falha na impressora. Sem papel ou desconectada.")
        
        return senha_salva
