import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Bell, Users, Volume2, ArrowRight, CheckCircle2, Ticket, Stethoscope, Sparkles, Trash2 } from 'lucide-react';
import filaService from '../services/filaService';

// Som de chamada hospitalar "Ding-Dong" (Web Audio API)
const playHospitalChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.log("Audio play prevented", e);
  }
};

const PainelSenhas = () => {
  const [ultimaChamada, setUltimaChamada] = useState(null);
  const [historicoChamadas, setHistoricoChamadas] = useState([]);
  const [ultimasEmitidas, setUltimasEmitidas] = useState([]);
  const [totalAguardando, setTotalAguardando] = useState(0);
  const [time, setTime] = useState(new Date());
  const [calling, setCalling] = useState(false);
  const prevChamadaIdRef = useRef(null);
  const prevEmitidaCodeRef = useRef(null);

  // Relógio do painel (atualiza a cada 1s)
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Polling em tempo real do status das filas (a cada 1 segundo)
  useEffect(() => {
    const fetchFila = async () => {
      try {
        const data = await filaService.consultarFilas();
        setTotalAguardando(data.total_aguardando || 0);
        setUltimasEmitidas(data.ultimas_emitidas || data.aguardando || []);

        if (data.ultimas_chamadas && data.ultimas_chamadas.length > 0) {
          const current = data.ultimas_chamadas[0];
          const history = data.ultimas_chamadas.slice(1, 6);

          if (current.id !== prevChamadaIdRef.current) {
            if (prevChamadaIdRef.current !== null) {
              playHospitalChime();
            }
            prevChamadaIdRef.current = current.id;
          }

          setUltimaChamada(current);
          setHistoricoChamadas(history);
        } else {
          setUltimaChamada(null);
          setHistoricoChamadas([]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do painel:", error);
      }
    };

    fetchFila();
    const interval = setInterval(fetchFila, 1000);
    return () => clearInterval(interval);
  }, []);

  // Função para chamar a próxima senha do banco
  const handleChamarProxima = async () => {
    setCalling(true);
    try {
      await filaService.chamarProxima();
      playHospitalChime();
      const data = await filaService.consultarFilas();
      if (data.ultimas_chamadas && data.ultimas_chamadas.length > 0) {
        setUltimaChamada(data.ultimas_chamadas[0]);
        setHistoricoChamadas(data.ultimas_chamadas.slice(1, 6));
      }
      setUltimasEmitidas(data.ultimas_emitidas || data.aguardando || []);
      setTotalAguardando(data.total_aguardando || 0);
    } catch (err) {
      console.log("Nenhuma senha aguardando para chamar.");
    } finally {
      setCalling(false);
    }
  };

  // Função para zerar a fila de senhas e começar demonstração limpa
  const handleResetarFila = async () => {
    try {
      await filaService.resetarFila();
      setUltimaChamada(null);
      setHistoricoChamadas([]);
      setUltimasEmitidas([]);
      setTotalAguardando(0);
      prevChamadaIdRef.current = null;
    } catch (err) {
      console.error("Erro ao resetar fila:", err);
    }
  };

  const formatClock = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // A senha em exibição no destaque:
  // Se houver chamada ativa, mostra a chamada.
  // Senão, se houver senhas emitidas aguardando, mostra a mais recente emitida no totem!
  const destaque = ultimaChamada || (ultimasEmitidas.length > 0 ? ultimasEmitidas[0] : null);
  const isChamadaAtiva = Boolean(ultimaChamada);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      backgroundColor: '#071324', color: '#FFFFFF',
      fontFamily: "'Inter', sans-serif", overflow: 'hidden'
    }}>
      {/* ============================================================ */}
      {/* 1. CABEÇALHO DA TV                                            */}
      {/* ============================================================ */}
      <header style={{
        height: '84px', background: '#0B192C',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 36px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#0056A8', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={34} color="#FFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#FFF', letterSpacing: '0.5px' }}>
              UNIDADE BÁSICA DE SAÚDE — SUS
            </h1>
            <span style={{ fontSize: '0.9rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Painel Eletrônico em Tempo Real
            </span>
          </div>
        </div>

        {/* Relógio e Contador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '8px 16px', borderRadius: '10px', color: '#38BDF8'
          }}>
            <Users size={20} />
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>
              {totalAguardando} {totalAguardando === 1 ? 'paciente na fila' : 'pacientes na fila'}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFD100', letterSpacing: '1px', fontFamily: 'monospace' }}>
              {formatClock(time)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'capitalize' }}>
              {formatDate(time)}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. CORPO PRINCIPAL                                            */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flex: 1, padding: '20px 32px', gap: '24px', overflow: 'hidden' }}>
        
        {/* --- LADO ESQUERDO (65%): DESTAQUE DA SENHA --- */}
        <div style={{
          flex: '1.7',
          background: isChamadaAtiva 
            ? 'linear-gradient(135deg, #0A2540 0%, #0056A8 100%)'
            : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '24px',
          border: isChamadaAtiva ? '2px solid #38BDF8' : '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px', position: 'relative', overflow: 'hidden'
        }}>
          {destaque ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={destaque.id || destaque.codigo}
                initial={{ opacity: 0, scale: 0.85, y: 25 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Badge Alerta */}
                {isChamadaAtiva ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: '#FFD100', color: '#0F172A',
                    padding: '8px 24px', borderRadius: '999px',
                    fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px',
                    boxShadow: '0 4px 15px rgba(255, 209, 0, 0.4)',
                    marginBottom: '12px'
                  }}>
                    <Bell size={22} />
                    <span>SENHA CHAMADA</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: '#0284C7', color: '#FFF',
                    padding: '8px 20px', borderRadius: '999px',
                    fontSize: '1.1rem', fontWeight: 800, letterSpacing: '1px',
                    marginBottom: '12px'
                  }}>
                    <Ticket size={20} />
                    <span>ÚLTIMA SENHA EMITIDA NO TOTEM</span>
                  </div>
                )}

                {/* Código Gigante da Senha */}
                <div style={{
                  fontSize: 'clamp(100px, 13vw, 180px)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-2px',
                  color: '#FFFFFF',
                  textShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                  margin: '8px 0'
                }}>
                  {destaque.codigo}
                </div>

                {/* Nome do Paciente */}
                {destaque.patient_name && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '6px 20px', borderRadius: '10px',
                    fontSize: '1.25rem', fontWeight: 700, color: '#E2E8F0',
                    marginBottom: '12px'
                  }}>
                    {destaque.patient_name}
                  </div>
                )}

                {/* Local de Destino */}
                <div style={{
                  background: '#071324',
                  border: isChamadaAtiva ? '2px solid #FFD100' : '1px solid #38BDF8',
                  borderRadius: '16px',
                  padding: '14px 32px',
                  width: '90%',
                  maxWidth: '650px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  marginTop: '6px'
                }}>
                  <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
                    {isChamadaAtiva ? 'DIRIJA-SE AO LOCAL:' : 'SETOR DE ATENDIMENTO:'}
                  </span>
                  <strong style={{ fontSize: 'clamp(1.3rem, 2.5vw, 2rem)', color: isChamadaAtiva ? '#FFD100' : '#38BDF8', fontWeight: 800 }}>
                    {(destaque.setor_destino || 'Consultório 01').toUpperCase()}
                  </strong>
                </div>

                {/* Tipo / Prioridade */}
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.15)', padding: '6px 14px',
                    borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700
                  }}>
                    {destaque.tipo_atendimento}
                  </span>
                  {destaque.prioridade === 1 && (
                    <span style={{
                      background: '#DC2626', color: '#FFF', padding: '6px 14px',
                      borderRadius: '8px', fontSize: '0.95rem', fontWeight: 800
                    }}>
                      PREFERENCIAL {destaque.sub_prioridade ? `(${destaque.sub_prioridade})` : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Volume2 size={40} color="#38BDF8" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 10px', color: '#FFF' }}>
                Painel Conectado ao Totem
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#94A3B8', maxWidth: '450px', margin: '0 auto 20px' }}>
                Emita uma senha no Totem de autoatendimento para visualizá-la aqui em tempo real.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.12)', padding: '8px 16px', borderRadius: '10px', color: '#38BDF8', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} />
                <span>Aguardando novos pacientes</span>
              </div>
            </div>
          )}
        </div>

        {/* --- LADO DIREITO (35%): HISTÓRICO & FILA ATIVA --- */}
        <div style={{
          flex: '1',
          display: 'flex', flexDirection: 'column', gap: '16px',
          overflow: 'hidden'
        }}>
          {/* Card 1: Últimas Chamadas aos Consultórios */}
          <div style={{
            flex: 1,
            background: '#0B192C',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h2 style={{
              fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8',
              textTransform: 'uppercase', letterSpacing: '1px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '10px', margin: '0 0 12px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>Chamadas Recentes</span>
              <Bell size={18} />
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {historicoChamadas.length > 0 ? (
                historicoChamadas.map((senha) => (
                  <div
                    key={senha.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF' }}>
                        {senha.codigo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {senha.tipo_atendimento}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFD100' }}>
                      {senha.setor_destino || 'Consultório'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '20px 0', fontSize: '0.85rem' }}>
                  Nenhuma chamada anterior.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Senhas na Fila de Espera (Emitidas Recentemente) */}
          <div style={{
            flex: 1,
            background: '#0B192C',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h2 style={{
              fontSize: '1.1rem', fontWeight: 800, color: '#4ADE80',
              textTransform: 'uppercase', letterSpacing: '1px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '10px', margin: '0 0 12px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>Fila de Espera (Emitidas)</span>
              <Users size={18} />
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {ultimasEmitidas.length > 0 ? (
                ultimasEmitidas.slice(0, 4).map((senha) => (
                  <div
                    key={senha.id}
                    style={{
                      background: 'rgba(74, 222, 128, 0.08)',
                      border: '1px solid rgba(74, 222, 128, 0.2)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ADE80' }}>
                        {senha.codigo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                        {senha.tipo_atendimento} {senha.prioridade === 1 ? '• PREF' : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', color: '#94A3B8' }}>
                      Aguardando
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '20px 0', fontSize: '0.85rem' }}>
                  Fila vazia.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BARRA DE CONTROLE PARA APRESENTAÇÃO / PITCH                */}
      {/* ============================================================ */}
      <footer style={{
        height: '52px', background: '#0B192C',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', fontSize: '0.85rem', color: '#64748B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
          <span>Sincronização Ativa (1s)</span>
        </div>

        {/* Botões de Ação do Pitch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleResetarFila}
            title="Zera a fila e o histórico para um novo teste"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px', padding: '6px 14px',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Trash2 size={14} />
            <span>Zerar Fila (Pitch Demo)</span>
          </button>

          <button
            onClick={handleChamarProxima}
            disabled={calling || totalAguardando === 0}
            style={{
              background: totalAguardando > 0 ? 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)' : '#334155',
              color: '#FFF', border: 'none',
              borderRadius: '8px', padding: '7px 16px',
              fontSize: '0.85rem', fontWeight: 700,
              cursor: totalAguardando > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: totalAguardando > 0 ? '0 2px 8px rgba(0, 86, 168, 0.4)' : 'none'
            }}
          >
            <Bell size={15} />
            <span>{calling ? 'Chamando...' : 'Chamar Próxima Senha da Fila'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PainelSenhas;
