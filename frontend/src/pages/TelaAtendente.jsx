import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, User, Bell, CheckCircle2,
  Users, Clock, AlertTriangle, ArrowRight,
  ShieldAlert, ShieldCheck, RefreshCw, Eye, X,
  Settings, Calendar, FileText, Activity, Volume2,
  PhoneCall, ChevronRight, Zap, Check, HeartPulse
} from 'lucide-react';
import filaService from '../services/filaService';
import api from '../services/api';

const SALAS_PREDEFINIDAS = [
  "Consultório 01 - Dra. Ana Costa (Clínica Geral)",
  "Consultório 02 - Dra. Camila Rocha (Clínica Geral)",
  "Consultório 03 - Dr. Roberto Alves (Cardiologia)",
  "Consultório 04 - Dr. Carlos Souza (Pediatria)",
  "Consultório 05 - Dr. Marcos Vinicius (Geriatria)",
  "Sala 02 - Vacinação & Imunização",
  "Guichê 01 - Farmácia Básica",
  "Mesa 01 - Acolhimento & Triagem de Enfermagem"
];

// Som de alerta de emergência / risco crítico (Web Audio API)
const playEmergencyAlert = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Pulso duplo de alarme clínico
    [0, 0.25, 0.5].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + delay + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch (e) {
    console.log("Audio prevented", e);
  }
};

const TelaAtendente = () => {
  const [activeTab, setActiveTab] = useState('fila'); // 'fila' | 'agendados' | 'risco' | 'historico'
  const [minhaSala, setMinhaSala] = useState(SALAS_PREDEFINIDAS[1]); // Padrão Consultório 02
  const [salaCustomizada, setSalaCustomizada] = useState('');
  const [isEditandoSala, setIsEditandoSala] = useState(false);
  
  const [pacienteAtual, setPacienteAtual] = useState(null);
  const [fila, setFila] = useState([]);
  const [agendados, setAgendados] = useState([]);
  const [triagens, setTriagens] = useState([]);
  const [historicoAtendidos, setHistoricoAtendidos] = useState([]);
  const [totalAguardando, setTotalAguardando] = useState(0);
  const [loading, setLoading] = useState(false);

  // Alerta de Risco
  const [alertaRiscoAtivo, setAlertaRiscoAtivo] = useState(null);
  const prevRiscoIdRef = useRef(null);

  // Modais
  const [modalTriagem, setModalTriagem] = useState(null);
  const [modalChamarSenha, setModalChamarSenha] = useState(null); // Senha selecionada para escolher sala

  const salaAtiva = isEditandoSala && salaCustomizada ? salaCustomizada : minhaSala;

  // Polling geral a cada 1.5s
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // 1. Fila de Senhas
        const dataFila = await filaService.consultarFilas();
        setFila(dataFila.aguardando || dataFila.senhas || []);
        setTotalAguardando(dataFila.total_aguardando || 0);

        // 2. Pacientes Agendados de Hoje
        try {
          const resAg = await api.get('/agendamentos/hoje');
          setAgendados(resAg.data || []);
        } catch (e) {
          console.log("Erro ao buscar agendamentos", e);
        }

        // 3. Triagens Recebidas
        try {
          const resTrg = await api.get('/triagem/');
          const listaTriagens = resTrg.data || [];
          setTriagens(listaTriagens);

          // Verifica se há alguma triagem recente com risco crítico (VERMELHO ou LARANJA)
          const riscoCritico = listaTriagens.find(t => 
            t.classificacao_risco.includes('VERMELHO') || 
            t.classificacao_risco.includes('LARANJA') ||
            t.dor >= 7 || t.falta_ar || t.sangramento || t.fala_movimento
          );

          if (riscoCritico && riscoCritico.id !== prevRiscoIdRef.current) {
            setAlertaRiscoAtivo(riscoCritico);
            playEmergencyAlert();
            prevRiscoIdRef.current = riscoCritico.id;
          }
        } catch (e) {
          console.log("Erro ao buscar triagens", e);
        }

      } catch (err) {
        console.error("Erro no polling da mesa do atendente:", err);
      }
    };

    carregarDados();
    const interval = setInterval(carregarDados, 1500);
    return () => clearInterval(interval);
  }, []);

  // Chamar paciente para uma sala específica
  const handleChamarParaSala = async (senhaId = null, salaDestino = null) => {
    setLoading(true);
    const destinoFinal = salaDestino || salaAtiva;
    try {
      const chamada = await filaService.chamarProxima(destinoFinal, senhaId);
      setPacienteAtual(chamada);
      setModalChamarSenha(null);

      // Atualiza lista
      const dataFila = await filaService.consultarFilas();
      setFila(dataFila.aguardando || dataFila.senhas || []);
      setTotalAguardando(dataFila.total_aguardando || 0);
    } catch (err) {
      alert("Nenhuma senha aguardando na fila.");
    } finally {
      setLoading(false);
    }
  };

  // Re-chamar paciente na TV
  const handleRechamar = async () => {
    if (!pacienteAtual) return;
    setLoading(true);
    try {
      const chamada = await filaService.chamarProxima(salaAtiva, pacienteAtual.id);
      setPacienteAtual(chamada);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Concluir atendimento
  const handleConcluir = async () => {
    if (!pacienteAtual) return;
    try {
      await filaService.concluirAtendimento(pacienteAtual.id);
      setHistoricoAtendidos(prev => [pacienteAtual, ...prev]);
      setPacienteAtual(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Encontra pré-triagem vinculada a um código de senha
  const getTriagemDaSenha = (codigo) => {
    if (!codigo) return null;
    return triagens.find(t => t.senha_codigo === codigo.toUpperCase());
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundColor: '#071324', color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif", padding: '20px 32px',
      boxSizing: 'border-box'
    }}>
      {/* ============================================================ */}
      {/* 🚨 BANNER DE ALERTA DE RISCO CLÍNICO (EMERGÊNCIA / MANCHESTER) */}
      {/* ============================================================ */}
      <AnimatePresence>
        {alertaRiscoAtivo && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'linear-gradient(90deg, #991B1B 0%, #DC2626 100%)',
              border: '2px solid #F87171', borderRadius: '16px',
              padding: '14px 24px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 8px 30px rgba(220, 38, 38, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: '#FFF', color: '#DC2626', padding: '10px',
                borderRadius: '12px', display: 'flex', alignItems: 'center'
              }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#000', color: '#FFF', fontSize: '0.8rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px' }}>
                    {alertaRiscoAtivo.classificacao_risco}
                  </span>
                  <strong style={{ fontSize: '1.15rem', color: '#FFF' }}>
                    🚨 ALERTA CLÍNICO: Senha {alertaRiscoAtivo.senha_codigo} apresentou sintomas de risco na Pré-Triagem!
                  </strong>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: '#FEE2E2' }}>
                  Escala de Dor: <strong>{alertaRiscoAtivo.dor}/10</strong> • Sintomas: {alertaRiscoAtivo.falta_ar ? 'Falta de Ar • ' : ''}{alertaRiscoAtivo.sangramento ? 'Sangramento • ' : ''}{alertaRiscoAtivo.queixa ? `"${alertaRiscoAtivo.queixa}"` : 'Acolhimento Urgente'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  const s = fila.find(f => f.codigo === alertaRiscoAtivo.senha_codigo);
                  handleChamarParaSala(s ? s.id : null, salaAtiva);
                  setAlertaRiscoAtivo(null);
                }}
                style={{
                  background: '#FFF', color: '#991B1B', border: 'none',
                  borderRadius: '10px', padding: '10px 18px',
                  fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <Zap size={18} />
                <span>Chamar Imediatamente</span>
              </button>

              <button
                onClick={() => setAlertaRiscoAtivo(null)}
                style={{ background: 'transparent', border: 'none', color: '#FEE2E2', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 1. CABEÇALHO DA ESTAÇÃO DO PROFISSIONAL & CONTROLE DE SALA    */}
      {/* ============================================================ */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0B192C', border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '20px', padding: '16px 28px', marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#0056A8', padding: '12px', borderRadius: '14px', color: '#FFF' }}>
            <Stethoscope size={30} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#FFF' }}>
              Central de Atendimento & Acolhimento
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700 }}>
              e-SUS APS • Gestão de Fila, Triagem e Consultórios
            </span>
          </div>
        </div>

        {/* Seleção do Consultório/Guichê Atual da Atendente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Settings size={20} color="#94A3B8" />
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Meu Consultório / Local de Atendimento:
            </span>
            <select
              value={minhaSala}
              onChange={(e) => { setMinhaSala(e.target.value); setIsEditandoSala(false); }}
              style={{
                background: '#071324', color: '#FFD100',
                border: '2px solid #38BDF8', borderRadius: '10px',
                padding: '8px 14px', fontSize: '0.95rem', fontWeight: 800,
                outline: 'none', cursor: 'pointer'
              }}
            >
              {SALAS_PREDEFINIDAS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. CARDS DE ESTATÍSTICAS E MÉTRICAS EM TEMPO REAL            */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#0B192C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>Fila Aguardando</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>{totalAguardando}</div>
          </div>
          <Users size={32} color="#38BDF8" style={{ opacity: 0.8 }} />
        </div>

        <div style={{ background: '#0B192C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>Agendados de Hoje</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFD100', marginTop: '2px' }}>{agendados.length}</div>
          </div>
          <Calendar size={32} color="#FFD100" style={{ opacity: 0.8 }} />
        </div>

        <div style={{ background: '#0B192C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>Pré-Triagens no Celular</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>{triagens.length}</div>
          </div>
          <HeartPulse size={32} color="#34D399" style={{ opacity: 0.8 }} />
        </div>

        <div style={{ background: '#0B192C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>Atendidos Hoje</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#A78BFA', marginTop: '2px' }}>{historicoAtendidos.length}</div>
          </div>
          <CheckCircle2 size={32} color="#A78BFA" style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. NAVEGAÇÃO POR ABAS                                         */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('fila')}
          style={{
            background: activeTab === 'fila' ? '#0056A8' : '#0B192C',
            color: activeTab === 'fila' ? '#FFF' : '#94A3B8',
            border: activeTab === 'fila' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: activeTab === 'fila' ? '0 4px 12px rgba(0, 86, 168, 0.4)' : 'none'
          }}
        >
          <Users size={18} />
          <span>Fila Geral & Acolhimento ({totalAguardando})</span>
        </button>

        <button
          onClick={() => setActiveTab('agendados')}
          style={{
            background: activeTab === 'agendados' ? '#0056A8' : '#0B192C',
            color: activeTab === 'agendados' ? '#FFF' : '#94A3B8',
            border: activeTab === 'agendados' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: activeTab === 'agendados' ? '0 4px 12px rgba(0, 86, 168, 0.4)' : 'none'
          }}
        >
          <Calendar size={18} />
          <span>Pacientes Agendados de Hoje ({agendados.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('risco')}
          style={{
            background: activeTab === 'risco' ? '#DC2626' : '#0B192C',
            color: activeTab === 'risco' ? '#FFF' : '#94A3B8',
            border: activeTab === 'risco' ? '1px solid #F87171' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: activeTab === 'risco' ? '0 4px 12px rgba(220, 38, 38, 0.4)' : 'none'
          }}
        >
          <ShieldAlert size={18} />
          <span>Central de Risco & Pré-Triagem ({triagens.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          style={{
            background: activeTab === 'historico' ? '#0056A8' : '#0B192C',
            color: activeTab === 'historico' ? '#FFF' : '#94A3B8',
            border: activeTab === 'historico' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <CheckCircle2 size={18} />
          <span>Histórico & Atendidos ({historicoAtendidos.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 4. CONTEÚDO PRINCIPAL (COM PAINEL LATERAL DO PACIENTE ATUAL)  */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* --- LADO ESQUERDO: CONTEÚDO DA ABA SELECIONADA --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ==================== ABA 1: FILA GERAL ==================== */}
          {activeTab === 'fila' && (
            <div style={{ background: '#0B192C', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38BDF8', margin: 0 }}>
                  Pacientes Aguardando na Recepção
                </h2>
                <button
                  onClick={() => handleChamarParaSala(null, salaAtiva)}
                  disabled={loading || totalAguardando === 0}
                  style={{
                    background: totalAguardando > 0 ? 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)' : '#334155',
                    color: '#FFF', border: 'none', borderRadius: '10px',
                    padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800,
                    cursor: totalAguardando > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Bell size={16} />
                  <span>Chamar Próximo da Fila</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                {fila.length > 0 ? (
                  fila.map((senha) => {
                    const triagemVinculada = getTriagemDaSenha(senha.codigo);
                    const temRisco = triagemVinculada && (triagemVinculada.dor >= 7 || triagemVinculada.falta_ar);

                    return (
                      <div
                        key={senha.id}
                        style={{
                          background: temRisco ? 'rgba(220, 38, 38, 0.12)' : (senha.prioridade === 1 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255,255,255,0.04)'),
                          border: temRisco ? '2px solid #EF4444' : (senha.prioridade === 1 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.08)'),
                          borderRadius: '16px', padding: '14px 18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFF' }}>
                              {senha.codigo}
                            </span>
                            {senha.prioridade === 1 && (
                              <span style={{ background: '#DC2626', color: '#FFF', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                                PREFERENCIAL {senha.sub_prioridade ? `• ${senha.sub_prioridade}` : ''}
                              </span>
                            )}
                            {temRisco && (
                              <span style={{ background: '#EF4444', color: '#FFF', fontSize: '0.75rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShieldAlert size={12} />
                                <span>RISCO: DOR {triagemVinculada.dor}/10</span>
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.95rem', color: '#CBD5E1', marginTop: '4px', fontWeight: 600 }}>
                            {senha.patient_name || senha.tipo_atendimento}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {triagemVinculada ? (
                            <button
                              onClick={() => setModalTriagem(triagemVinculada)}
                              style={{
                                background: temRisco ? 'rgba(239, 68, 68, 0.2)' : '#1E293B',
                                color: temRisco ? '#F87171' : '#38BDF8',
                                border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px',
                                padding: '8px 12px', fontSize: '0.85rem', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <Eye size={16} />
                              <span>Ver Triagem</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748B', padding: '0 4px' }}>Sem pré-triagem</span>
                          )}

                          {/* Botão de Chamar Escolhendo a Sala */}
                          <button
                            onClick={() => setModalChamarSenha(senha)}
                            style={{
                              background: 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)',
                              color: '#FFF', border: 'none', borderRadius: '10px',
                              padding: '8px 14px', fontSize: '0.85rem', fontWeight: 800,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                              boxShadow: '0 2px 8px rgba(0, 86, 168, 0.4)'
                            }}
                          >
                            <PhoneCall size={14} />
                            <span>Chamar para Sala...</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B' }}>
                    <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '1rem' }}>Fila limpa! Nenhum paciente aguardando.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ABA 2: AGENDADOS DE HOJE ==================== */}
          {activeTab === 'agendados' && (
            <div style={{ background: '#0B192C', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFD100', margin: 0 }}>
                    Grade de Consultas Agendadas para Hoje
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Sincronizado automaticamente com a agenda médica do e-SUS PEC
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                {agendados.map((ag) => (
                  <div
                    key={ag.id}
                    style={{
                      background: ag.presenca_confirmada ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: ag.presenca_confirmada ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '1.1rem', color: '#FFF' }}>{ag.patient_name}</strong>
                        {ag.presenca_confirmada ? (
                          <span style={{ background: '#0284C7', color: '#FFF', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                            CHEGOU • SENHA {ag.senha_codigo}
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                            AGENDADO (PREVISTO)
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
                        CPF: <span style={{ color: '#F8FAFC' }}>{ag.cpf}</span> • Médico(a): <span style={{ color: '#FFD100' }}>{ag.doctor_name}</span> ({ag.specialty}) • {ag.room}
                      </div>
                    </div>

                    <div>
                      {ag.presenca_confirmada ? (
                        <button
                          onClick={() => handleChamarParaSala(ag.senha_id, `${ag.room} - ${ag.doctor_name}`)}
                          style={{
                            background: '#0056A8', color: '#FFF', border: 'none',
                            borderRadius: '10px', padding: '8px 14px', fontSize: '0.85rem',
                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <PhoneCall size={14} />
                          <span>Chamar p/ {ag.room}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>
                          Aguardando no totem
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== ABA 3: CENTRAL DE RISCO ==================== */}
          {activeTab === 'risco' && (
            <div style={{ background: '#0B192C', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F87171', margin: 0 }}>
                    Classificação de Risco & Protocolo de Manchester
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Avaliações preenchidas pelos pacientes em tempo real via celular
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                {triagens.length > 0 ? (
                  triagens.map((t) => {
                    const isCritico = t.classificacao_risco.includes('VERMELHO') || t.dor >= 7;
                    return (
                      <div
                        key={t.id}
                        style={{
                          background: isCritico ? 'rgba(220, 38, 38, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: isCritico ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px', padding: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              background: isCritico ? '#DC2626' : (t.dor >= 4 ? '#D97706' : '#059669'),
                              color: '#FFF', fontSize: '0.8rem', fontWeight: 900, padding: '4px 10px', borderRadius: '8px'
                            }}>
                              {t.classificacao_risco}
                            </span>
                            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFF' }}>
                              Senha {t.senha_codigo}
                            </span>
                          </div>

                          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#CBD5E1' }}>
                            Dor: <strong style={{ color: t.dor >= 7 ? '#F87171' : '#FFD100' }}>{t.dor}/10</strong> • {t.queixa ? `"${t.queixa}"` : 'Sem queixa descrita'}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            {t.falta_ar && <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>FALTA DE AR</span>}
                            {t.sangramento && <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>SANGRAMENTO</span>}
                            {t.fala_movimento && <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ALTERAÇÃO MOTORA</span>}
                            {t.gestante && <span style={{ background: '#831843', color: '#F472B6', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>GESTANTE</span>}
                          </div>
                        </div>

                        <button
                          onClick={() => setModalTriagem(t)}
                          style={{
                            background: '#1E293B', color: '#38BDF8',
                            border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px',
                            padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <Eye size={16} />
                          <span>Ver Ficha Completa</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B' }}>
                    <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Nenhuma pré-triagem registrada ainda.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ABA 4: HISTÓRICO ATENDIDOS ==================== */}
          {activeTab === 'historico' && (
            <div style={{ background: '#0B192C', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#A78BFA', margin: '0 0 16px' }}>
                Histórico de Consultas Concluídas Hoje
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                {historicoAtendidos.length > 0 ? (
                  historicoAtendidos.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '12px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={20} color="#10B981" />
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>{s.codigo}</span>
                        <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{s.patient_name || s.tipo_atendimento}</span>
                      </div>
                      <span style={{ color: '#FFD100', fontSize: '0.85rem', fontWeight: 700 }}>
                        {s.setor_destino}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B' }}>
                    Nenhum atendimento finalizado nesta sessão ainda.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* --- LADO DIREITO: CARD DO PACIENTE ATUAL EM CONSULTA --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#0B192C', border: '2px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px', padding: '28px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8',
              textTransform: 'uppercase', letterSpacing: '1px',
              margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <User size={20} />
              <span>Paciente em Atendimento no Seu Consultório</span>
            </h2>

            {pacienteAtual ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  display: 'inline-flex', padding: '6px 16px', borderRadius: '999px',
                  background: '#FFD100', color: '#071324', fontWeight: 900, fontSize: '0.85rem',
                  marginBottom: '12px'
                }}>
                  {salaAtiva.toUpperCase()}
                </div>

                <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '2px', margin: '4px 0' }}>
                  {pacienteAtual.codigo}
                </div>

                {pacienteAtual.patient_name && (
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '12px', padding: '10px', margin: '12px 0',
                    fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC'
                  }}>
                    {pacienteAtual.patient_name}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '12px 0' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>
                    {pacienteAtual.tipo_atendimento}
                  </span>
                  {pacienteAtual.prioridade === 1 && (
                    <span style={{ background: '#DC2626', color: '#FFF', padding: '6px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800 }}>
                      PREFERENCIAL {pacienteAtual.sub_prioridade ? `(${pacienteAtual.sub_prioridade})` : ''}
                    </span>
                  )}
                </div>

                {/* Botões de Ação */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    onClick={handleRechamar}
                    disabled={loading}
                    style={{
                      flex: 1, background: '#1E293B', color: '#FFD100',
                      border: '1px solid #FFD100', borderRadius: '12px',
                      padding: '14px', fontSize: '0.95rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <Bell size={18} />
                    <span>Re-chamar na TV</span>
                  </button>

                  <button
                    onClick={handleConcluir}
                    style={{
                      flex: 1.2, background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                      color: '#FFF', border: 'none', borderRadius: '12px',
                      padding: '14px', fontSize: '0.95rem', fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Concluir</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                <div style={{ fontSize: '1.05rem', color: '#94A3B8', marginBottom: '16px' }}>
                  Nenhum paciente em atendimento nesta sala no momento.
                </div>
                <button
                  onClick={() => handleChamarParaSala(null, salaAtiva)}
                  disabled={loading || totalAguardando === 0}
                  style={{
                    background: totalAguardando > 0 ? 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)' : '#334155',
                    color: '#FFF', border: 'none', borderRadius: '14px',
                    padding: '14px 24px', fontSize: '1rem', fontWeight: 800,
                    cursor: totalAguardando > 0 ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    boxShadow: totalAguardando > 0 ? '0 4px 15px rgba(2, 132, 199, 0.4)' : 'none'
                  }}
                >
                  <Bell size={18} />
                  <span>{loading ? 'Chamando...' : 'Chamar Próximo Paciente'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 5. MODAL DE ESCOLHA DE SALA / GUICHÊ AO CHAMAR                */}
      {/* ============================================================ */}
      <AnimatePresence>
        {modalChamarSenha && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                width: '100%', maxWidth: '540px', background: '#0B192C',
                border: '2px solid rgba(56, 189, 248, 0.3)', borderRadius: '24px',
                padding: '24px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#FFF' }}>
                    Chamar Senha: <span style={{ color: '#38BDF8' }}>{modalChamarSenha.codigo}</span>
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                    {modalChamarSenha.patient_name || modalChamarSenha.tipo_atendimento}
                  </span>
                </div>
                <button onClick={() => setModalChamarSenha(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <p style={{ color: '#CBD5E1', fontSize: '0.95rem', margin: '0 0 14px' }}>
                Selecione o consultório ou guichê para onde o paciente deve se dirigir:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {SALAS_PREDEFINIDAS.map((sala) => (
                  <button
                    key={sala}
                    onClick={() => handleChamarParaSala(modalChamarSenha.id, sala)}
                    style={{
                      background: sala === salaAtiva ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: sala === salaAtiva ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px', padding: '12px 16px',
                      color: sala === salaAtiva ? '#FFD100' : '#F8FAFC',
                      fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{sala}</span>
                    <PhoneCall size={16} />
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button onClick={() => setModalChamarSenha(null)} className="action-btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 6. MODAL DE PRÉ-TRIAGEM DETALHADA                             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {modalTriagem && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                width: '100%', maxWidth: '520px', background: '#0B192C',
                border: '2px solid rgba(56, 189, 248, 0.3)', borderRadius: '24px',
                padding: '24px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={26} color="#38BDF8" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#FFF' }}>
                    Ficha de Pré-Triagem — Senha {modalTriagem.senha_codigo}
                  </h3>
                </div>
                <button onClick={() => setModalTriagem(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Classificação de Gravidade</span>
                  <strong style={{ color: modalTriagem.dor >= 7 ? '#F87171' : '#38BDF8', fontSize: '1.15rem' }}>{modalTriagem.classificacao_risco}</strong>
                </div>

                <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Queixa Principal do Paciente</span>
                  <p style={{ margin: '4px 0 0', color: '#E2E8F0', fontSize: '0.95rem' }}>
                    {modalTriagem.queixa ? `"${modalTriagem.queixa}"` : "Paciente não detalhou a queixa por texto."}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Escala de Dor</span>
                    <strong style={{ color: modalTriagem.dor >= 7 ? '#F87171' : '#FFD100', fontSize: '1.3rem' }}>{modalTriagem.dor} / 10</strong>
                  </div>
                  <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Tempo de Sintomas</span>
                    <strong style={{ color: '#FFF', fontSize: '1rem' }}>{modalTriagem.tempo}</strong>
                  </div>
                </div>

                <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Sinais de Alerta & Comorbidades</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {modalTriagem.falta_ar && <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>Falta de Ar</span>}
                    {modalTriagem.sangramento && <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>Sangramento</span>}
                    {modalTriagem.fala_movimento && <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>Alteração de Fala/Movimento</span>}
                    {modalTriagem.hipertensao && <span style={{ background: '#1E293B', color: '#93C5FD', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>Hipertensão</span>}
                    {modalTriagem.diabetes && <span style={{ background: '#1E293B', color: '#93C5FD', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>Diabetes</span>}
                    {modalTriagem.gestante && <span style={{ background: '#831843', color: '#F472B6', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>Gestante</span>}
                    {!modalTriagem.falta_ar && !modalTriagem.sangramento && !modalTriagem.fala_movimento && !modalTriagem.hipertensao && !modalTriagem.diabetes && !modalTriagem.gestante && (
                      <span style={{ color: '#10B981', fontSize: '0.85rem' }}>Nenhum sinal agudo relatado</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setModalTriagem(null)} className="action-btn-secondary">
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const s = fila.find(f => f.codigo === modalTriagem.senha_codigo);
                    setModalTriagem(null);
                    handleChamarParaSala(s ? s.id : null, salaAtiva);
                  }}
                  className="action-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <PhoneCall size={18} />
                  <span>Chamar para {salaAtiva.split('-')[0]}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TelaAtendente;
