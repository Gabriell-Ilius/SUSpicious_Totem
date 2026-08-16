import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, User, Bell, CheckCircle2,
  Users, Clock, AlertTriangle, ArrowRight,
  ShieldCheck, RefreshCw, Eye, X, Settings
} from 'lucide-react';
import filaService from '../services/filaService';

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

const TelaAtendente = () => {
  const [minhaSala, setMinhaSala] = useState(SALAS_PREDEFINIDAS[1]); // Padrão Consultório 02
  const [salaCustomizada, setSalaCustomizada] = useState('');
  const [isEditandoSala, setIsEditandoSala] = useState(false);
  
  const [pacienteAtual, setPacienteAtual] = useState(null);
  const [fila, setFila] = useState([]);
  const [totalAguardando, setTotalAguardando] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalTriagemSenha, setModalTriagemSenha] = useState(null);

  const salaAtiva = isEditandoSala && salaCustomizada ? salaCustomizada : minhaSala;

  // Polling da fila a cada 1.5s
  useEffect(() => {
    const carregarFila = async () => {
      try {
        const data = await filaService.consultarFilas();
        setFila(data.aguardando || data.senhas || []);
        setTotalAguardando(data.total_aguardando || 0);
      } catch (err) {
        console.error("Erro ao carregar fila no painel do atendente:", err);
      }
    };

    carregarFila();
    const interval = setInterval(carregarFila, 1500);
    return () => clearInterval(interval);
  }, []);

  // Chamar o próximo da fila ou uma senha específica para esta sala
  const handleChamar = async (senhaId = null) => {
    setLoading(true);
    try {
      const chamada = await filaService.chamarProxima(salaAtiva, senhaId);
      setPacienteAtual(chamada);
      const data = await filaService.consultarFilas();
      setFila(data.aguardando || data.senhas || []);
      setTotalAguardando(data.total_aguardando || 0);
    } catch (err) {
      alert("Nenhuma senha aguardando na fila.");
    } finally {
      setLoading(false);
    }
  };

  // Re-chamar o mesmo paciente na TV
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

  // Finalizar o atendimento do paciente atual
  const handleConcluir = async () => {
    if (!pacienteAtual) return;
    try {
      await filaService.concluirAtendimento(pacienteAtual.id);
      setPacienteAtual(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#071324',
      color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      padding: '24px 32px',
      boxSizing: 'border-box'
    }}>
      {/* ============================================================ */}
      {/* 1. CABEÇALHO DO PROFISSIONAL / MESA DE ATENDIMENTO            */}
      {/* ============================================================ */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0B192C', border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '20px', padding: '16px 28px', marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#0056A8', padding: '12px', borderRadius: '14px', color: '#FFF' }}>
            <Stethoscope size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              Mesa do Profissional / Atendente
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700 }}>
              e-SUS APS • Chamador de Consultório & Guichê
            </span>
          </div>
        </div>

        {/* Seletor de Sala / Consultório */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={20} color="#94A3B8" />
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase' }}>
              Local de Atendimento:
            </span>
            <select
              value={minhaSala}
              onChange={(e) => { setMinhaSala(e.target.value); setIsEditandoSala(false); }}
              style={{
                background: '#071324', color: '#FFD100',
                border: '1px solid #38BDF8', borderRadius: '10px',
                padding: '8px 14px', fontSize: '0.95rem', fontWeight: 700,
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
      {/* 2. GRID PRINCIPAL (ATENDIMENTO ATUAL + FILA AO VIVO)          */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px' }}>
        
        {/* --- COLUNA ESQUERDA: PACIENTE ATUAL EM CONSULTA --- */}
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
              <span>Paciente em Atendimento na Sala</span>
            </h2>

            {pacienteAtual ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  display: 'inline-flex', padding: '6px 16px', borderRadius: '999px',
                  background: '#FFD100', color: '#071324', fontWeight: 900, fontSize: '0.9rem',
                  marginBottom: '12px'
                }}>
                  CHAMADO PARA: {salaAtiva.toUpperCase()}
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

                {/* Botões de Ação do Paciente Atual */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    onClick={handleRechamar}
                    disabled={loading}
                    style={{
                      flex: 1, background: '#1E293B', color: '#FFD100',
                      border: '1px solid #FFD100', borderRadius: '12px',
                      padding: '14px', fontSize: '1rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
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
                      padding: '14px', fontSize: '1rem', fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Concluir Atendimento</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                <div style={{ fontSize: '1.1rem', color: '#94A3B8', marginBottom: '16px' }}>
                  Nenhum paciente sendo atendido nesta sala no momento.
                </div>
                <button
                  onClick={() => handleChamar()}
                  disabled={loading || totalAguardando === 0}
                  style={{
                    background: totalAguardando > 0 ? 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)' : '#334155',
                    color: '#FFF', border: 'none', borderRadius: '14px',
                    padding: '16px 28px', fontSize: '1.1rem', fontWeight: 800,
                    cursor: totalAguardando > 0 ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    boxShadow: totalAguardando > 0 ? '0 4px 15px rgba(2, 132, 199, 0.4)' : 'none'
                  }}
                >
                  <Bell size={20} />
                  <span>{loading ? 'Chamando...' : 'Chamar Próximo Paciente'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- COLUNA DIREITA: FILA GERAL DE ESPERA AO VIVO --- */}
        <div style={{
          background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px', padding: '24px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={22} color="#38BDF8" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
                Fila de Espera na Recepção
              </h2>
            </div>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8',
              padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800
            }}>
              {totalAguardando} aguardando
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', maxHeight: '550px' }}>
            {fila.length > 0 ? (
              fila.map((senha) => (
                <div
                  key={senha.id}
                  style={{
                    background: senha.prioridade === 1 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                    border: senha.prioridade === 1 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFF' }}>
                        {senha.codigo}
                      </span>
                      {senha.prioridade === 1 && (
                        <span style={{ background: '#DC2626', color: '#FFF', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                          PREFERENCIAL {senha.sub_prioridade ? `• ${senha.sub_prioridade}` : ''}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginTop: '4px' }}>
                      {senha.patient_name || senha.tipo_atendimento}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setModalTriagemSenha(senha)}
                      title="Ver Pré-Triagem / Queixa do Paciente"
                      style={{
                        background: '#1E293B', color: '#38BDF8',
                        border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px',
                        padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Eye size={16} />
                      <span>Triagem</span>
                    </button>

                    <button
                      onClick={() => handleChamar(senha.id)}
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)',
                        color: '#FFF', border: 'none', borderRadius: '10px',
                        padding: '8px 14px', fontSize: '0.85rem', fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 2px 8px rgba(0, 86, 168, 0.4)'
                      }}
                    >
                      <Bell size={14} />
                      <span>Chamar</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B' }}>
                <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '1rem' }}>Fila limpa! Nenhum paciente aguardando.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MODAL DE PRÉ-TRIAGEM DO PACIENTE                           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {modalTriagemSenha && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
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
                    Pré-Triagem Digital — {modalTriagemSenha.codigo}
                  </h3>
                </div>
                <button
                  onClick={() => setModalTriagemSenha(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
                <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Paciente</span>
                  <strong style={{ color: '#FFF', fontSize: '1.05rem' }}>{modalTriagemSenha.patient_name || 'Paciente Geral'}</strong>
                </div>

                <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Queixa Principal Informada</span>
                  <p style={{ margin: '4px 0 0', color: '#E2E8F0' }}>
                    "Sintomas leves de dor de cabeça e necessidade de acolhimento inicial."
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Escala de Dor</span>
                    <strong style={{ color: '#F59E0B', fontSize: '1.3rem' }}>4 / 10 (Moderada)</strong>
                  </div>
                  <div style={{ background: '#071324', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block' }}>Sinais de Gravidade</span>
                    <strong style={{ color: '#10B981', fontSize: '1rem' }}>Nenhum sinal agudo</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setModalTriagemSenha(null)}
                  className="action-btn-secondary"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const sId = modalTriagemSenha.id;
                    setModalTriagemSenha(null);
                    handleChamar(sId);
                  }}
                  className="action-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Bell size={18} />
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
