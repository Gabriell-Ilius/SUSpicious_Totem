import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Bell, Users, Volume2, ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';
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
  const [totalAguardando, setTotalAguardando] = useState(0);
  const [time, setTime] = useState(new Date());
  const [calling, setCalling] = useState(false);
  const prevChamadaIdRef = useRef(null);

  // Relógio do painel (atualiza a cada 1s)
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Polling em tempo real das chamadas (a cada 1 segundo)
  useEffect(() => {
    const fetchFila = async () => {
      try {
        const data = await filaService.consultarFilas();
        setTotalAguardando(data.total_aguardando || 0);

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
      setTotalAguardando(0);
      prevChamadaIdRef.current = null;
    } catch (err) {
      console.error("Erro ao resetar fila:", err);
    }
  };

  const formatClock = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
        height: '96px', background: '#0B192C',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ background: '#0056A8', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={40} color="#FFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: '#FFF', letterSpacing: '0.5px' }}>
              UNIDADE BÁSICA DE SAÚDE — SUS
            </h1>
            <span style={{ fontSize: '1rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
              Painel Eletrônico de Atendimento
            </span>
          </div>
        </div>

        {/* Relógio e Contador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '10px 20px', borderRadius: '12px', color: '#38BDF8'
          }}>
            <Users size={24} />
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {totalAguardando} {totalAguardando === 1 ? 'paciente na fila' : 'pacientes na fila'}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFD100', letterSpacing: '1px', fontFamily: 'monospace' }}>
              {formatClock(time)}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94A3B8', textTransform: 'capitalize' }}>
              {formatDate(time)}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. CORPO PRINCIPAL (LETRA GIGANTE + HISTÓRICO RECENTE)        */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flex: 1, padding: '24px 36px', gap: '32px', overflow: 'hidden' }}>
        
        {/* --- LADO ESQUERDO (65%): SENHA ATUAL CHAMADA (LETRA GIGANTE) --- */}
        <div style={{
          flex: '1.8',
          background: ultimaChamada 
            ? 'linear-gradient(135deg, #0A2540 0%, #0056A8 100%)'
            : 'linear-gradient(135deg, #0B192C 0%, #071324 100%)',
          borderRadius: '28px',
          border: ultimaChamada ? '3px solid #38BDF8' : '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '36px', position: 'relative', overflow: 'hidden'
        }}>
          {ultimaChamada ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={ultimaChamada.id || ultimaChamada.codigo}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Badge Alerta */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '12px',
                  background: '#FFD100', color: '#071324',
                  padding: '10px 32px', borderRadius: '999px',
                  fontSize: '1.4rem', fontWeight: 900, letterSpacing: '3px',
                  boxShadow: '0 6px 20px rgba(255, 209, 0, 0.5)',
                  marginBottom: '16px'
                }}>
                  <Bell size={26} />
                  <span>SENHA CHAMADA</span>
                </div>

                {/* Código Gigante da Senha */}
                <div style={{
                  fontSize: 'clamp(140px, 17vw, 240px)',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-3px',
                  color: '#FFFFFF',
                  textShadow: '0 12px 35px rgba(0, 0, 0, 0.7)',
                  margin: '12px 0 20px'
                }}>
                  {ultimaChamada.codigo}
                </div>

                {/* Local de Destino em Destaque Dourado */}
                <div style={{
                  background: '#071324',
                  border: '3px solid #FFD100',
                  borderRadius: '22px',
                  padding: '24px 44px',
                  width: '92%',
                  maxWidth: '750px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#94A3B8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    DIRIJA-SE AO LOCAL:
                  </span>
                  <strong style={{ fontSize: 'clamp(2rem, 3.4vw, 3.2rem)', color: '#FFD100', fontWeight: 900 }}>
                    {(ultimaChamada.setor_destino || 'Consultório 01').toUpperCase()}
                  </strong>
                </div>

                {/* Tipo / Prioridade */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '14px' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', padding: '8px 20px',
                    borderRadius: '10px', fontSize: '1.15rem', fontWeight: 800
                  }}>
                    {ultimaChamada.tipo_atendimento}
                  </span>
                  {ultimaChamada.prioridade === 1 && (
                    <span style={{
                      background: '#DC2626', color: '#FFF', padding: '8px 20px',
                      borderRadius: '10px', fontSize: '1.15rem', fontWeight: 900
                    }}>
                      PREFERENCIAL {ultimaChamada.sub_prioridade ? `(${ultimaChamada.sub_prioridade})` : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '28px',
                border: '2px solid rgba(56, 189, 248, 0.3)'
              }}>
                <Volume2 size={54} color="#38BDF8" />
              </div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 16px', color: '#FFF' }}>
                Aguardando Chamada de Atendimento
              </h2>
              <p style={{ fontSize: '1.4rem', color: '#94A3B8', maxWidth: '550px', margin: '0 auto 28px', lineHeight: '1.4' }}>
                As chamadas para os consultórios e salas aparecerão aqui na tela com aviso sonoro.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(56, 189, 248, 0.15)', padding: '12px 24px', borderRadius: '14px', color: '#38BDF8', fontWeight: 800, fontSize: '1.1rem' }}>
                <CheckCircle2 size={24} />
                <span>Painel de Transmissão Ativo</span>
              </div>
            </div>
          )}
        </div>

        {/* --- LADO DIREITO (35%): HISTÓRICO DE CHAMADAS RECENTES --- */}
        <div style={{
          flex: '1',
          background: '#0B192C',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '28px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}>
          <h2 style={{
            fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8',
            textTransform: 'uppercase', letterSpacing: '1.5px',
            borderBottom: '2px solid rgba(255,255,255,0.08)',
            paddingBottom: '16px', margin: '0 0 20px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>Últimas Chamadas</span>
            <Clock size={24} />
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            {historicoChamadas.length > 0 ? (
              historicoChamadas.map((senha, idx) => (
                <motion.div
                  key={senha.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>
                      {senha.codigo}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px' }}>
                      {senha.tipo_atendimento}
                      {senha.prioridade === 1 && (
                        <span style={{ color: '#F87171', marginLeft: '6px' }}>
                          • {senha.sub_prioridade || 'PREFERENCIAL'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFD100' }}>
                      {senha.setor_destino || 'Consultório 01'}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#64748B', padding: '60px 10px', fontSize: '1.1rem' }}>
                Nenhuma chamada anterior no histórico.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BARRA DE CONTROLE DISCRETA PARA O PITCH                    */}
      {/* ============================================================ */}
      <footer style={{
        height: '56px', background: '#0B192C',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', fontSize: '0.9rem', color: '#64748B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
          <span>Transmissão em Tempo Real</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleResetarFila}
            title="Zera o histórico e a fila"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px', padding: '6px 14px',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Trash2 size={15} />
            <span>Zerar Fila (Pitch)</span>
          </button>

          <button
            onClick={handleChamarProxima}
            disabled={calling || totalAguardando === 0}
            style={{
              background: totalAguardando > 0 ? 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)' : '#334155',
              color: '#FFF', border: 'none',
              borderRadius: '10px', padding: '8px 18px',
              fontSize: '0.9rem', fontWeight: 800,
              cursor: totalAguardando > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: totalAguardando > 0 ? '0 2px 10px rgba(0, 86, 168, 0.4)' : 'none'
            }}
          >
            <Bell size={16} />
            <span>{calling ? 'Chamando...' : 'Chamar Próxima Senha'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PainelSenhas;
