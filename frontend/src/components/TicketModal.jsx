import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckCircle, UserCheck, HeartHandshake, X, Delete, ArrowRight, Navigation } from 'lucide-react';

/**
 * Componente Modal do Totem (Kiosk Touch UI)
 * Fluxo em 3 Passos:
 * 1. Digitação do CPF via Teclado Numérico Touch Screen (Conforme Seção 2.4 da Solução Técnica)
 * 2. Seleção de Prioridade SUS (Normal vs Preferencial)
 * 3. Comprovante Impresso destacando o SETOR DE DESTINO ("Dirija-se ao Consultório X")
 */
export default function TicketModal({ service, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1: CPF Touch Numpad, 2: Priority, 3: Printed Receipt
  const [cpfDigits, setCpfDigits] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [issuedTicket, setIssuedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Efeito de Contagem Regressiva para fechar o comprovante impresso
  useEffect(() => {
    let timer;
    if (step === 3 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (step === 3 && countdown === 0) {
      onClose();
    }
    return () => clearInterval(timer);
  }, [step, countdown, onClose]);

  // Digitação pelo Teclado Numérico Touch
  const handleKeyPress = (num) => {
    if (cpfDigits.length < 11) {
      setCpfDigits((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setCpfDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCpfDigits('');
  };

  // Formatação visual da máscara do CPF
  const formatCPFDisplay = (digits) => {
    const padded = digits.padEnd(11, '_');
    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`;
  };

  // Confirmar Emissão no Servidor
  const handleFinalConfirm = async () => {
    setLoading(true);
    const ticketData = await onConfirm(service.category, priority, cpfDigits.length === 11 ? cpfDigits : null);
    setLoading(false);
    setIssuedTicket(ticketData);
    setStep(3);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: step === 1 ? '560px' : '540px' }}>
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
        >
          <X size={28} />
        </button>

        {/* PASSO 1: Teclado Numérico Touch Screen para CPF */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '4px' }}>
              Identificação por CPF
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '16px' }}>
              Digite seu CPF no teclado numérico abaixo para localizar seus dados no e-SUS:
            </p>

            {/* Display de Visualização do CPF */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '2px solid var(--sus-blue-primary)',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '2rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              letterSpacing: '4px',
              color: '#38BDF8',
              marginBottom: '20px'
            }}>
              {formatCPFDisplay(cpfDigits)}
            </div>

            {/* Teclado Numérico Touch Screen de Botões Gigantes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  style={{
                    padding: '18px',
                    borderRadius: '14px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255, 255, 255, 0.07)',
                    color: '#FFF',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={handleClear}
                style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontWeight: '700' }}
              >
                LIMPAR
              </button>

              <button
                onClick={() => handleKeyPress('0')}
                style={{ padding: '18px', borderRadius: '14px', border: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.07)', color: '#FFF', fontSize: '1.8rem', fontWeight: '700' }}
              >
                0
              </button>

              <button
                onClick={handleDelete}
                style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Delete size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="action-btn-secondary"
                style={{ flex: 1, marginTop: 0 }}
                onClick={() => setStep(2)}
              >
                Não Sei / Pular CPF
              </button>

              <button
                className="action-btn-primary"
                style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setStep(2)}
              >
                <span>Avançar</span>
                <ArrowRight size={22} />
              </button>
            </div>
          </div>
        )}

        {/* PASSO 2: Seleção de Prioridade SUS */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', marginBottom: '8px' }}>
              {service.title}
            </h2>
            <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
              Selecione seu tipo de atendimento conforme prioridade por lei:
            </p>

            <div className="priority-selector">
              <button
                className={`priority-btn ${priority === 'NORMAL' ? 'active' : ''}`}
                onClick={() => setPriority('NORMAL')}
              >
                <UserCheck size={32} color={priority === 'NORMAL' ? '#38BDF8' : '#94A3B8'} />
                <span>Atendimento Normal</span>
              </button>

              <button
                className={`priority-btn ${priority === 'PREFERENCIAL' ? 'active' : ''}`}
                onClick={() => setPriority('PREFERENCIAL')}
              >
                <HeartHandshake size={32} color={priority === 'PREFERENCIAL' ? '#38BDF8' : '#94A3B8'} />
                <span>Preferencial (60+, PCD, Gestantes)</span>
              </button>
            </div>

            <button
              className="action-btn-primary"
              disabled={loading}
              onClick={handleFinalConfirm}
            >
              {loading ? 'Gerando Senha...' : 'EMITIR E IMPRIMIR SENHA'}
            </button>

            <button className="action-btn-secondary" onClick={() => setStep(1)}>
              Voltar para Digitação do CPF
            </button>
          </div>
        )}

        {/* PASSO 3: Comprovante Impresso e Direcionamento do Setor */}
        {step === 3 && issuedTicket && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34D399', marginBottom: '12px' }}>
              <CheckCircle size={28} />
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Senha Emitida com Sucesso!</span>
            </div>

            {/* Comprovante de Papel Impresso */}
            <div className="ticket-paper">
              <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: '#64748B', fontWeight: 700 }}>
                UNIDADE BÁSICA DE SAÚDE - SUS
              </p>

              <div className="ticket-number-display">
                {issuedTicket.ticket_number}
              </div>

              {/* SETOR DE DESTINO EM DESTAQUE TOTAL (Requisito do Escopo) */}
              <div style={{
                background: '#0F2942',
                color: '#FFF',
                padding: '14px',
                borderRadius: '12px',
                margin: '12px 0',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
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
                CPF: {cpfDigits.length === 11 ? `${cpfDigits.slice(0, 3)}.***.***-${cpfDigits.slice(9, 11)}` : 'Não informado'} | Prioridade: {issuedTicket.prioridade_fila === 1 ? 'PREFERENCIAL' : 'NORMAL'}
              </p>

              {/* QR Code para Pré-Triagem Móvel */}
              {issuedTicket.qr_code_data && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <QRCodeSVG value={issuedTicket.qr_code_data} size={105} />
                  <span style={{ fontSize: '0.75rem', marginTop: '6px', color: '#475569', fontWeight: 600 }}>
                    Escaneie para responder a pré-triagem no smartphone
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#60A5FA', fontSize: '1rem', margin: '12px 0' }}>
              <Printer className="animate-pulse" size={24} />
              <span>Retire o cupom de papel na impressora</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Retornando ao início em <strong>{countdown}s</strong>...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
