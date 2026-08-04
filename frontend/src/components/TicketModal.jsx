import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer, CheckCircle, UserCheck, HeartHandshake, X,
  Navigation, User, Smartphone, AlertTriangle
} from 'lucide-react';

// URL base do formulário de pré-triagem digital
const PRE_TRIAGEM_URL = 'https://forms.gle/sus-pretriagem';

/**
 * Componente Modal do Totem (Kiosk Touch UI)
 * Fluxo em 2 Passos (CPF já coletado na tela inicial do App):
 *  1. Seleção de Prioridade SUS (Normal vs Preferencial + Sub-Prioridades por Lei)
 *  2. Comprovante Impresso com Setor de Destino + QR Code de Pré-Triagem (apenas Consulta Espontânea)
 */
export default function TicketModal({ service, cpf, patientName, onClose, onConfirm }) {
  // step 1 = seleção de prioridade; step 2 = comprovante
  const [step, setStep] = useState(1);
  const [priority, setPriority] = useState('NORMAL');
  const [subPriority, setSubPriority] = useState(null);
  const [issuedTicket, setIssuedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  // 5 minutos de inatividade para reset automático
  const [countdown, setCountdown] = useState(300);

  // Verifica se é Consulta Espontânea (exibe QR Code de Pré-Triagem no comprovante)
  const isEspontaneo = service?.category === 'ESPONTANEO';

  // Sub-prioridades previstas na legislação SUS
  const subPrioritiesList = [
    { id: 'GESTANTE', label: 'Gestante / Lactante / Colo', icon: '🤰' },
    { id: 'IDOSO_60', label: 'Idoso (60 a 79 anos)', icon: '👴' },
    { id: 'IDOSO_80', label: 'Idoso 80+ (Superprioridade Lei 13.466)', icon: '🧓' },
    { id: 'PCD', label: 'PCD (Pessoa com Deficiência)', icon: '♿' },
    { id: 'AUTISMO', label: 'Autismo (TEA Lei 12.764)', icon: '🧩' },
  ];

  // Contagem regressiva de inatividade — só começa no comprovante (step 2)
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (step === 2 && countdown === 0) {
      onClose(); // volta para tela CPF
    }
    return () => clearInterval(timer);
  }, [step, countdown, onClose]);

  // Formata countdown como MM:SS
  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Gera URL do QR Code de pré-triagem, embutindo o CPF se disponível
  const getPreTriagemUrl = () => {
    return cpf ? `${PRE_TRIAGEM_URL}?cpf=${cpf}` : PRE_TRIAGEM_URL;
  };

  // Confirmar Emissão no Servidor
  const handleFinalConfirm = async () => {
    setLoading(true);
    const selectedSub = priority === 'PREFERENCIAL' ? (subPriority || 'PREFERENCIAL') : null;
    const ticketData = await onConfirm(service.category, priority, cpf || null, selectedSub);
    setLoading(false);
    setIssuedTicket(ticketData);
    setCountdown(300);
    setStep(2);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        {/* Botão Fechar — sempre retorna para tela de CPF */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
        >
          <X size={28} />
        </button>

        {/* ============================================================ */}
        {/* PASSO 1: Seleção de Prioridade SUS                           */}
        {/* ============================================================ */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', marginBottom: '4px' }}>
              {service.title}
            </h2>

            {/* Banner com nome do paciente identificado */}
            {patientName && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#38BDF8',
                fontWeight: 700
              }}>
                <User size={18} />
                <span>{patientName}</span>
              </div>
            )}

            <p style={{ color: '#94A3B8', marginBottom: '16px' }}>
              Selecione seu tipo de atendimento conforme prioridade por lei:
            </p>

            <div className="priority-selector" style={{ marginBottom: '16px' }}>
              <button
                className={`priority-btn ${priority === 'NORMAL' ? 'active' : ''}`}
                onClick={() => { setPriority('NORMAL'); setSubPriority(null); }}
              >
                <UserCheck size={32} color={priority === 'NORMAL' ? '#38BDF8' : '#94A3B8'} />
                <span>Atendimento Normal</span>
              </button>

              <button
                className={`priority-btn ${priority === 'PREFERENCIAL' ? 'active' : ''}`}
                onClick={() => setPriority('PREFERENCIAL')}
              >
                <HeartHandshake size={32} color={priority === 'PREFERENCIAL' ? '#38BDF8' : '#94A3B8'} />
                <span>Preferencial (Por Lei)</span>
              </button>
            </div>

            {/* Sub-Prioridades — aparece ao selecionar Preferencial */}
            {priority === 'PREFERENCIAL' && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                  Selecione sua Prioridade Específica por Lei:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {subPrioritiesList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSubPriority(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: subPriority === item.id ? '2px solid #38BDF8' : '1px solid var(--card-border)',
                        background: subPriority === item.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        color: subPriority === item.id ? '#38BDF8' : '#FFF',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="action-btn-primary"
              disabled={loading}
              onClick={handleFinalConfirm}
            >
              {loading ? 'Gerando Senha...' : 'EMITIR E IMPRIMIR SENHA'}
            </button>

            <button className="action-btn-secondary" onClick={onClose}>
              ← Voltar
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASSO 2: Comprovante + QR Code (se Consulta Espontânea)       */}
        {/* ============================================================ */}
        {step === 2 && issuedTicket && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34D399', marginBottom: '12px' }}>
              <CheckCircle size={28} />
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Senha Emitida com Sucesso!</span>
            </div>

            {/* Comprovante de Papel */}
            <div className="ticket-paper">
              <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: '#64748B', fontWeight: 700 }}>
                UNIDADE BÁSICA DE SAÚDE - SUS
              </p>

              <div className="ticket-number-display">
                {issuedTicket.ticket_number}
              </div>

              {/* Nome do Paciente */}
              {(issuedTicket.patient_name || patientName) && (
                <div style={{
                  background: 'rgba(15, 41, 66, 0.06)',
                  border: '1px dashed #64748B',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  margin: '8px 0',
                  color: '#0F2942',
                  fontWeight: '800',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <User size={18} color="#0F2942" />
                  <span>PACIENTE: {issuedTicket.patient_name || patientName}</span>
                </div>
              )}

              {/* Setor de Destino */}
              <div style={{
                background: '#0F2942',
                color: '#FFF',
                padding: '14px',
                borderRadius: '12px',
                margin: '12px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <Navigation size={24} color="#38BDF8" />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#93C5FD', display: 'block' }}>
                    Direcionamento para Atendimento:
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: '#FFF' }}>
                    {issuedTicket.setor_destino}
                  </strong>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '6px' }}>
                CPF: {cpf ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9, 11)}` : 'Não informado'} | Prioridade: {issuedTicket.prioridade_fila === 1 ? `PREFERENCIAL (${issuedTicket.sub_prioridade || 'LEI'})` : 'NORMAL'}
              </p>

              {/* QR Code de Pré-Triagem — apenas para Consulta Espontânea, após emissão da senha */}
              {isEspontaneo && (
                <div style={{ marginTop: '16px', background: '#F8FAFC', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Smartphone size={18} color="#0F2942" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2942' }}>
                      Pré-Triagem Digital (Opcional)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <QRCodeSVG value={getPreTriagemUrl()} size={110} />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                  }}>
                    <AlertTriangle size={15} color="#B45309" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: '#92400E', fontSize: '0.72rem', lineHeight: 1.4 }}>
                      <strong>A pré-triagem digital NÃO substitui</strong> a triagem presencial feita pelo enfermeiro ou médico.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#60A5FA', fontSize: '1rem', margin: '12px 0' }}>
              <Printer className="animate-pulse" size={24} />
              <span>Retire o cupom de papel na impressora</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Retornando ao início em <strong>{formatCountdown(countdown)}</strong>
            </p>

            <button className="action-btn-secondary" style={{ marginTop: '8px' }} onClick={onClose}>
              Encerrar Atendimento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
