import React, { useState, useEffect } from 'react';
import { Stethoscope, Syringe, QrCode, Pill, Delete, ArrowRight, CheckCircle, Navigation, Keyboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Header from './components/Header';
import ServiceCard from './components/ServiceCard';
import TicketModal from './components/TicketModal';
import { createTicket, checkCPFSchedule } from './services/api';

/**
 * Componente Principal (App) do SUSpicious Totem
 *
 * Fluxo:
 *  Fase 'cpf'      → Teclado de identificação por CPF
 *    ↳ Com agendamento hoje → emite senha AGN, mostra comprovante
 *    ↳ Sem agendamento / Pular → Fase 'services'
 *  Fase 'services' → Grade de 3 serviços (Espontâneo, Vacinação, Farmácia)
 *    ↳ Seleciona serviço → TicketModal (prioridade + QR Code de Pré-Triagem no comprovante)
 */
export default function App() {
  // Fase atual: 'cpf' | 'services' | 'scheduled'
  const [phase, setPhase] = useState('cpf');

  // Digitação do CPF na Fase 1
  const [cpfDigits, setCpfDigits] = useState('');
  const [loadingCpf, setLoadingCpf] = useState(false);

  // Serviço selecionado na grade (Fase 2)
  const [selectedService, setSelectedService] = useState(null);

  // Dados do paciente e ticket agendado (Fase 'scheduled')
  const [scheduledInfo, setScheduledInfo] = useState(null);
  const [scheduledTicket, setScheduledTicket] = useState(null);
  const [countdown, setCountdown] = useState(300); // 5 min de timeout

  // Countdown para fechar comprovante de agendado
  useEffect(() => {
    let timer;
    if (phase === 'scheduled' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (phase === 'scheduled' && countdown === 0) {
      resetToStart();
    }
    return () => clearInterval(timer);
  }, [phase, countdown]);

  // Serviços disponíveis na grade (sem consulta agendada)
  const services = [
    {
      id: 'espontaneo',
      category: 'ESPONTANEO',
      title: 'Consulta Espontânea / Triagem',
      description: 'Acolhimento para sintomas do dia. Emita sua senha e faça a pré-triagem no celular enquanto aguarda.',
      tag: 'Acolhimento + QR Pré-Triagem',
      icon: <Stethoscope size={36} />,
      iconBgClass: 'icon-emerald',
    },
    {
      id: 'vacinacao',
      category: 'VACINACAO',
      title: 'Sala de Vacinação',
      description: 'Atualização de caderneta de vacinação, doses de rotina ou campanhas de imunização SUS.',
      tag: 'Imunização SUS',
      icon: <Syringe size={36} />,
      iconBgClass: 'icon-purple',
    },
    {
      id: 'farmacia',
      category: 'FARMACIA',
      title: 'Farmácia Básica',
      description: 'Retirada e dispensação de medicamentos prescritos pelos médicos da Unidade Básica de Saúde.',
      tag: 'Dispensação de Medicamentos',
      icon: <Pill size={36} />,
      iconBgClass: 'icon-rose',
    },
  ];

  const resetToStart = () => {
    setPhase('cpf');
    setCpfDigits('');
    setSelectedService(null);
    setScheduledInfo(null);
    setScheduledTicket(null);
    setCountdown(300);
    setLoadingCpf(false);
  };

  // Digitação do CPF
  const handleKeyPress = (num) => {
    setCpfDigits((prev) => (prev.length < 11 ? prev + num : prev));
  };
  const handleDelete = () => setCpfDigits((prev) => prev.slice(0, -1));
  const handleClear = () => setCpfDigits('');

  const formatCPFDisplay = (digits) => {
    const padded = digits.padEnd(11, '_');
    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`;
  };

  // Suporte a Teclado Físico USB / Acessibilidade (digitação direta)
  useEffect(() => {
    if (phase !== 'cpf') return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleCpfNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, cpfDigits, loadingCpf]);

  // Confirmar CPF → verifica agendamento
  const handleCpfNext = async () => {
    setLoadingCpf(true);
    let schedule = null;
    if (cpfDigits.length === 11) {
      schedule = await checkCPFSchedule(cpfDigits);
    }
    setLoadingCpf(false);

    if (schedule && schedule.has_schedule) {
      // Paciente tem consulta → emite senha AGN e mostra comprovante
      const ticket = await createTicket('AGENDADO', 'NORMAL', cpfDigits, null);
      setScheduledInfo(schedule);
      setScheduledTicket(ticket);
      setCountdown(300);
      setPhase('scheduled');
    } else {
      // Sem agendamento → grade de serviços
      setPhase('services');
    }
  };

  // Handler de confirmação de senha (chamado pelo TicketModal)
  const handleConfirmTicket = async (category, priority, cpf, subPriority) => {
    return await createTicket(category, priority, cpf, subPriority);
  };

  return (
    <div className="kiosk-container">
      {/* Cabeçalho com UBS, Relógio e Badge de Conexão */}
      <Header />

      {/* ============================================================ */}
      {/* FASE 1: Identificação por CPF na entrada do Totem             */}
      {/* ============================================================ */}
      {phase === 'cpf' && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, padding: '12px 16px'
        }}>
          <section className="welcome-banner">
            <h1>Seja bem-vindo(a) à nossa Unidade!</h1>
            <p>Digite seu CPF na tela ou no teclado físico para iniciar:</p>
          </section>

          <div className="cpf-box-card">
            {/* Display do CPF */}
            <div className="cpf-display-box">
              {formatCPFDisplay(cpfDigits)}
            </div>

            {/* Teclado numérico touch */}
            <div className="numpad-grid">
              {['1','2','3','4','5','6','7','8','9'].map((num) => (
                <button key={num} className="numpad-btn" onClick={() => handleKeyPress(num)}>
                  {num}
                </button>
              ))}
              <button onClick={handleClear} className="numpad-btn" style={{
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.15)', color: '#F87171', fontSize: '1rem'
              }}>
                LIMPAR
              </button>
              <button onClick={() => handleKeyPress('0')} className="numpad-btn">
                0
              </button>
              <button onClick={handleDelete} className="numpad-btn" style={{
                border: '1px solid rgba(245,158,11,0.4)',
                background: 'rgba(245,158,11,0.15)', color: '#FBBF24',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Delete size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="action-btn-secondary"
                style={{ flex: 1, marginTop: 0 }}
                onClick={() => setPhase('services')}
                disabled={loadingCpf}
              >
                Não Sei / Pular CPF
              </button>
              <button
                className="action-btn-primary"
                style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 0 }}
                onClick={handleCpfNext}
                disabled={loadingCpf || cpfDigits.length < 11}
              >
                <span>{loadingCpf ? 'Verificando...' : 'Confirmar CPF'}</span>
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Dica de Acessibilidade com Teclado Físico */}
            <div className="keyboard-hint">
              <Keyboard size={16} />
              <span>Você pode digitar os números direto no teclado físico USB</span>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* COMPROVANTE: Paciente com Consulta Agendada Hoje              */}
      {/* ============================================================ */}
      {phase === 'scheduled' && scheduledTicket && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, padding: '24px 16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: '20px', padding: '28px',
            backdropFilter: 'blur(12px)', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34D399', marginBottom: '16px' }}>
              <CheckCircle size={32} />
              <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>Consulta Confirmada!</span>
            </div>

            <div className="ticket-paper">
              <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: '#64748B', fontWeight: 700 }}>
                UNIDADE BÁSICA DE SAÚDE - SUS
              </p>

              <div className="ticket-number-display">
                {scheduledTicket.ticket_number}
              </div>

              {scheduledInfo?.paciente && (
                <div style={{
                  background: 'rgba(56,189,248,0.1)', border: '1px solid #38BDF8',
                  borderRadius: '8px', padding: '10px', margin: '10px 0',
                  color: '#38BDF8', fontWeight: 800
                }}>
                  {scheduledInfo.paciente}
                </div>
              )}

              <div style={{
                background: '#0F2942', color: '#FFF', padding: '14px',
                borderRadius: '12px', margin: '12px 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}>
                <Navigation size={24} color="#38BDF8" />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#93C5FD', display: 'block' }}>
                    Dirija-se a:
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>
                    {scheduledTicket.setor_destino}
                  </strong>
                </div>
              </div>

              {scheduledInfo?.horario && (
                <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
                  Horário: <strong style={{ color: '#CBD5E1' }}>{scheduledInfo.horario}</strong>
                </p>
              )}
            </div>

            <div style={{ color: '#60A5FA', fontSize: '0.95rem', margin: '16px 0' }}>
              Retire o cupom na impressora
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Retornando ao início em <strong>{countdown}s</strong>...
            </p>
            <button className="action-btn-secondary" style={{ marginTop: '8px' }} onClick={resetToStart}>
              Encerrar
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FASE 2: Grade de Seleção de Serviços (sem agendamento)        */}
      {/* ============================================================ */}
      {phase === 'services' && (
        <>
          <section className="welcome-banner">
            <h1>Como podemos te ajudar hoje?</h1>
            <p>Toque no serviço que você precisa:</p>
          </section>

          <main className="services-grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                tag={service.tag}
                icon={service.icon}
                iconBgClass={service.iconBgClass}
                onClick={() => setSelectedService(service)}
              />
            ))}
          </main>

          <button
            className="action-btn-secondary"
            style={{ maxWidth: '300px', margin: '0 auto 16px', fontSize: '0.9rem' }}
            onClick={resetToStart}
          >
            ← Voltar ao Início
          </button>
        </>
      )}

      {/* Modal Interativo de Emissão de Senha */}
      {selectedService && (
        <TicketModal
          service={selectedService}
          cpf={cpfDigits.length === 11 ? cpfDigits : null}
          onClose={resetToStart}
          onConfirm={handleConfirmTicket}
        />
      )}
    </div>
  );
}
