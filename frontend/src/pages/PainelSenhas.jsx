import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Bell, Users, Volume2, ArrowRight, CheckCircle2 } from 'lucide-react';
import filaService from '../services/filaService';

// Sintetizador de áudio Web Audio API (som de chamada hospitalar "Ding-Dong")
const playHospitalChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Primeiro tom (D5 - 587 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Segundo tom (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.log("Audio autoplay prevented", e);
  }
};

const PainelSenhas = () => {
  const [ultimaChamada, setUltimaChamada] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [totalAguardando, setTotalAguardando] = useState(0);
  const [time, setTime] = useState(new Date());
  const [calling, setCalling] = useState(false);
  const prevChamadaIdRef = useRef(null);

  // Relógio do painel (atualiza a cada 1s)
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Polling rápido do status das filas (a cada 1.5s)
  useEffect(() => {
    const fetchFila = async () => {
      try {
        const data = await filaService.consultarFilas();
        setTotalAguardando(data.total_aguardando || 0);

        if (data.ultimas_chamadas && data.ultimas_chamadas.length > 0) {
          const current = data.ultimas_chamadas[0];
          const history = data.ultimas_chamadas.slice(1, 6);

          // Toca o som de chamada caso seja uma nova senha chamada
          if (current.id !== prevChamadaIdRef.current) {
            if (prevChamadaIdRef.current !== null) {
              playHospitalChime();
            }
            prevChamadaIdRef.current = current.id;
          }

          setUltimaChamada(current);
          setHistorico(history);
        } else {
          setUltimaChamada(null);
          setHistorico([]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do painel:", error);
      }
    };

    fetchFila();
    const interval = setInterval(fetchFila, 1500);
    return () => clearInterval(interval);
  }, []);

  // Função para simular a chamada da próxima senha no painel (para o Pitch)
  const handleChamarProxima = async () => {
    setCalling(true);
    try {
      await filaService.chamarProxima();
      playHospitalChime();
      const data = await filaService.consultarFilas();
      if (data.ultimas_chamadas && data.ultimas_chamadas.length > 0) {
        setUltimaChamada(data.ultimas_chamadas[0]);
        setHistorico(data.ultimas_chamadas.slice(1, 6));
      }
      setTotalAguardando(data.total_aguardando || 0);
    } catch (err) {
      console.log("Nenhuma senha aguardando para chamar.");
    } finally {
      setCalling(false);
    }
  };

  const formatClock = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      backgroundColor: '#0A192F', color: '#FFFFFF',
      fontFamily: "'Inter', sans-serif", overflow: 'hidden'
    }}>
      {/* ============================================================ */}
      {/* 1. CABEÇALHO DO PAINEL DE TV                                  */}
      {/* ============================================================ */}
      <header style={{
        height: '90px', background: '#071324',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#0056A8', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={36} color="#FFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#FFF', letterSpacing: '0.5px' }}>
              UNIDADE BÁSICA DE SAÚDE — SUS
            </h1>
            <span style={{ fontSize: '0.95rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Painel Eletrônico de Atendimento
            </span>
          </div>
        </div>

        {/* Informações de Fila e Relógio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '8px 18px', borderRadius: '10px', color: '#38BDF8'
          }}>
            <Users size={22} />
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>
              {totalAguardando} {totalAguardando === 1 ? 'paciente na fila' : 'pacientes na fila'}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFD100', letterSpacing: '1px', fontFamily: 'monospace' }}>
              {formatClock(time)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', textTransform: 'capitalize' }}>
              {formatDate(time)}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. CORPO PRINCIPAL: SENHA ATUAL + HISTÓRICO LATERAL           */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flex: 1, padding: '24px 32px', gap: '24px', overflow: 'hidden' }}>
        
        {/* --- LADO ESQUERDO (65%): SENHA ATUAL CHAMADA --- */}
        <div style={{
          flex: '1.8',
          background: 'linear-gradient(135deg, #0D2847 0%, #0056A8 100%)',
          borderRadius: '24px',
          border: '2px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px', position: 'relative', overflow: 'hidden'
        }}>
          {ultimaChamada ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={ultimaChamada.id}
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Badge Alerta de Chamada */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: '#FFD100', color: '#0F172A',
                  padding: '8px 24px', borderRadius: '999px',
                  fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px',
                  boxShadow: '0 4px 15px rgba(255, 209, 0, 0.4)',
                  marginBottom: '16px'
                }}>
                  <Bell size={22} className="animate-bounce" />
                  <span>SENHA CHAMADA</span>
                </div>

                {/* Código Gigante da Senha */}
                <div style={{
                  fontSize: 'clamp(110px, 14vw, 190px)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-2px',
                  color: '#FFFFFF',
                  textShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  margin: '12px 0'
                }}>
                  {ultimaChamada.codigo}
                </div>

                {/* Nome do Paciente (se houver) */}
                {ultimaChamada.patient_name && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    padding: '8px 20px', borderRadius: '12px',
                    fontSize: '1.3rem', fontWeight: 700, color: '#E2E8F0',
                    marginBottom: '16px'
                  }}>
                    {ultimaChamada.patient_name}
                  </div>
                )}

                {/* Local de Destino em Destaque Dourado */}
                <div style={{
                  background: '#071324',
                  border: '2px solid #FFD100',
                  borderRadius: '18px',
                  padding: '16px 36px',
                  width: '90%',
                  maxWidth: '700px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    DIRIJA-SE AO LOCAL:
                  </span>
                  <strong style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)', color: '#FFD100', fontWeight: 800 }}>
                    {(ultimaChamada.setor_destino || 'Consultório 01').toUpperCase()}
                  </strong>
                </div>

                {/* Tipo de Atendimento / Prioridade */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', padding: '6px 16px',
                    borderRadius: '8px', fontSize: '1rem', fontWeight: 700
                  }}>
                    {ultimaChamada.tipo_atendimento}
                  </span>
                  {ultimaChamada.prioridade === 1 && (
                    <span style={{
                      background: '#DC2626', color: '#FFF', padding: '6px 16px',
                      borderRadius: '8px', fontSize: '1rem', fontWeight: 800
                    }}>
                      PREFERENCIAL {ultimaChamada.sub_prioridade ? `(${ultimaChamada.sub_prioridade})` : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
              }}>
                <Volume2 size={48} color="#38BDF8" />
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px', color: '#FFF' }}>
                Aguardando Chamada de Atendimento
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#94A3B8', maxWidth: '500px', margin: '0 auto 24px' }}>
                As senhas emitidas no totem aparecerão aqui na tela com som de aviso assim que o profissional chamar.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.15)', padding: '10px 20px', borderRadius: '12px', color: '#38BDF8', fontWeight: 700 }}>
                <CheckCircle2 size={20} />
                <span>Totem conectado e pronto</span>
              </div>
            </div>
          )}
        </div>

        {/* --- LADO DIREITO (35%): ÚLTIMAS CHAMADAS --- */}
        <div style={{
          flex: '1',
          background: '#071324',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 800, color: '#38BDF8',
            textTransform: 'uppercase', letterSpacing: '1px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px', margin: '0 0 16px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>Últimas Chamadas</span>
            <Clock size={20} />
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {historico.length > 0 ? (
              historico.map((senha, idx) => (
                <motion.div
                  key={senha.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFF' }}>
                      {senha.codigo}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
                      {senha.tipo_atendimento} {senha.prioridade === 1 ? '• PREFERENCIAL' : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFD100' }}>
                      {senha.setor_destino || 'Consultório 01'}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 10px', fontSize: '0.95rem' }}>
                Histórico vazio no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BARRA DE CONTROLE PARA APRESENTAÇÃO / PITCH                */}
      {/* ============================================================ */}
      <footer style={{
        height: '56px', background: '#071324',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', fontSize: '0.85rem', color: '#64748B'
      }}>
        <div>
          <span>SUSpicious Totem • Sistema em Tempo Real</span>
        </div>

        {/* Botão de Demonstração Interativa do Pitch */}
        <button
          onClick={handleChamarProxima}
          disabled={calling}
          style={{
            background: 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)',
            color: '#FFF', border: 'none',
            borderRadius: '8px', padding: '8px 18px',
            fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 86, 168, 0.4)'
          }}
        >
          <Bell size={16} />
          <span>{calling ? 'Chamando...' : 'Simular: Chamar Próxima Senha (Pitch)'}</span>
          <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
};

export default PainelSenhas;
