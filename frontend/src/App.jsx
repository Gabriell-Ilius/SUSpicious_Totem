import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Calendar, Stethoscope, Syringe, Pill,
  QrCode, CheckCircle, Navigation, Delete,
  ArrowRight, Keyboard
} from 'lucide-react';

import Header from './components/Header';
import ServiceCard from './components/ServiceCard';
import TicketModal from './components/TicketModal';
import PainelSenhas from './pages/PainelSenhas';
import TriagemMobile from './pages/TriagemMobile';
import ErrorPrinter from './pages/ErrorPrinter';
import senhaService from './services/senhaService';

// Serviços disponíveis no Totem
const SERVICES_CONFIG = [
  {
    id: 'agendado',
    title: 'Consulta Agendada',
    description: 'Já possuo horário marcado com médico ou enfermeiro',
    tag: 'COM HORÁRIO',
    category: 'AGENDADA',
    icon: Calendar,
    iconBgClass: 'icon-blue'
  },
  {
    id: 'espontaneo',
    title: 'Consulta Espontânea',
    description: 'Sintomas agudos, mal-estar ou acolhimento inicial',
    tag: 'ACOLHIMENTO',
    category: 'ESPONTANEA',
    icon: Stethoscope,
    iconBgClass: 'icon-green'
  },
  {
    id: 'vacina',
    title: 'Vacinação / Imunização',
    description: 'Atualização de caderneta, gripe, covid e rotina',
    tag: 'SALA DE VACINAS',
    category: 'VACINACAO',
    icon: Syringe,
    iconBgClass: 'icon-amber'
  },
  {
    id: 'farmacia',
    title: 'Farmácia Básica',
    description: 'Retirada e dispensação de medicamentos com receita',
    tag: 'MEDICAMENTOS',
    category: 'FARMACIA',
    icon: Pill,
    iconBgClass: 'icon-purple'
  },
  {
    id: 'triagem',
    title: 'Pré-Triagem Digital (QR)',
    description: 'Agilize o atendimento preenchendo no seu celular',
    tag: 'CELULAR (QR)',
    category: 'TRIAGEM_DIGITAL',
    icon: QrCode,
    iconBgClass: 'icon-cyan'
  }
];

function TotemKiosk() {
  const [phase, setPhase] = useState('cpf'); // 'cpf' | 'services' | 'scheduled'
  const [cpfDigits, setCpfDigits] = useState('');
  const [loadingCpf, setLoadingCpf] = useState(false);
  const [scheduledTicket, setScheduledTicket] = useState(null);
  const [scheduledInfo, setScheduledInfo] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [countdown, setCountdown] = useState(15);

  // Inatividade: reseta para tela de CPF após 60s
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (phase !== 'cpf') {
          resetToStart();
        }
      }, 60000);
    };

    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [phase]);

  // Captura de teclado físico USB (além do toque na tela)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase !== 'cpf') return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (cpfDigits.length === 11) {
          handleCpfNext();
        }
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, cpfDigits]);

  // Contagem regressiva na tela de confirmação de agendamento
  useEffect(() => {
    if (phase === 'scheduled') {
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            resetToStart();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const resetToStart = () => {
    setPhase('cpf');
    setCpfDigits('');
    setSelectedService(null);
    setScheduledTicket(null);
    setScheduledInfo(null);
  };

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

  const formatCPFDisplay = (digits) => {
    const padded = digits.padEnd(11, '•');
    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`;
  };

  const handleCpfNext = async () => {
    if (cpfDigits.length !== 11) return;
    setLoadingCpf(true);

    try {
      const result = await senhaService.checkCpfSchedule(cpfDigits);
      if (result.has_schedule) {
        // Se possui agendamento, emite a senha automaticamente
        const ticket = await senhaService.gerarSenha('AGENDADA', cpfDigits, 0);
        setScheduledTicket(ticket);
        setScheduledInfo(result);
        setPhase('scheduled');
      } else {
        // Se não possui agendamento para hoje, vai para a grade de serviços
        setPhase('services');
      }
    } catch (error) {
      console.error('Erro na validação do CPF:', error);
      setPhase('services');
    } finally {
      setLoadingCpf(false);
    }
  };

  const handleConfirmTicket = async (category, priority, cpf, subPriority) => {
    return await senhaService.gerarSenha(category, cpf, priority, subPriority);
  };

  return (
    <div className="kiosk-container">
      <Header />

      {/* ============================================================ */}
      {/* FASE 1: Identificação por CPF (Touch + Teclado USB)           */}
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
            <div className="cpf-display-box">
              {formatCPFDisplay(cpfDigits)}
            </div>

            <div className="numpad-grid">
              {['1','2','3','4','5','6','7','8','9'].map((num) => (
                <button key={num} className="numpad-btn" onClick={() => handleKeyPress(num)}>
                  {num}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="numpad-btn"
                style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '1rem' }}
              >
                LIMPAR
              </button>
              <button key="0" className="numpad-btn" onClick={() => handleKeyPress('0')}>
                0
              </button>
              <button
                onClick={handleDelete}
                className="numpad-btn"
                style={{ background: '#FEF3C7', color: '#D97706' }}
              >
                <Delete size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                className="action-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setPhase('services')}
                disabled={loadingCpf}
              >
                Não Sei / Pular CPF
              </button>
              <button
                className="action-btn-primary"
                style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleCpfNext}
                disabled={loadingCpf || cpfDigits.length < 11}
              >
                <span>{loadingCpf ? 'Verificando...' : 'Confirmar CPF'}</span>
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="keyboard-hint">
              <Keyboard size={16} />
              <span>Você pode digitar os números direto no teclado físico USB</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FASE 2: Comprovante de Paciente com Agendamento Hoje         */}
      {/* ============================================================ */}
      {phase === 'scheduled' && scheduledTicket && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, padding: '24px 16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            background: '#FFFFFF', border: '1px solid #E2E8F0',
            borderRadius: '24px', padding: '32px',
            boxShadow: 'var(--shadow-lg)', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#16A34A', marginBottom: '16px' }}>
              <CheckCircle size={36} />
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Consulta Confirmada!</span>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '20px', margin: '16px 0' }}>
              <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: '#64748B', fontWeight: 700 }}>
                UNIDADE BÁSICA DE SAÚDE - SUS
              </p>

              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--sus-blue)', margin: '12px 0' }}>
                {scheduledTicket.codigo}
              </div>

              {scheduledInfo?.paciente && (
                <div style={{
                  background: '#EFF6FF', border: '1px solid #BFDBFE',
                  borderRadius: '8px', padding: '10px', margin: '10px 0',
                  color: '#1E40AF', fontWeight: 800, fontSize: '1rem'
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
                    {scheduledTicket.setor_destino || scheduledInfo?.consultorio}
                  </strong>
                </div>
              </div>

              {scheduledInfo?.horario && (
                <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
                  Horário: <strong style={{ color: '#0F172A' }}>{scheduledInfo.horario}</strong>
                </p>
              )}
            </div>

            <div style={{ color: 'var(--sus-blue)', fontSize: '1rem', fontWeight: 600, margin: '12px 0' }}>
              Retire o cupom impresso abaixo
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
      {/* FASE 3: Grade de Serviços (Sem agendamento prévio)            */}
      {/* ============================================================ */}
      {phase === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', padding: '20px 0' }}>
          <section className="welcome-banner">
            <h1>Como podemos te ajudar hoje?</h1>
            <p>Toque no serviço que você precisa:</p>
          </section>

          <main className="services-grid">
            {SERVICES_CONFIG.map((service) => (
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
            style={{ maxWidth: '280px', margin: '0 auto', fontSize: '0.95rem' }}
            onClick={resetToStart}
          >
            ← Voltar ao Início
          </button>
        </div>
      )}

      {/* Modal Interativo de Emissão de Senha com Sub-Prioridades */}
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

function App() {
  const location = useLocation();

  if (location.pathname === '/painel') {
    return <PainelSenhas />;
  }

  if (location.pathname.startsWith('/triagem')) {
    return (
      <Routes>
        <Route path="/triagem/:id" element={<TriagemMobile />} />
      </Routes>
    );
  }

  if (location.pathname === '/error-impressora') {
    return <ErrorPrinter />;
  }

  return <TotemKiosk />;
}

export default App;
