import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, Bell, Users, Volume2, VolumeX,
  ArrowRight, CheckCircle2, Trash2, ShieldAlert,
  Sparkles, Star
} from 'lucide-react';
import filaService from '../services/filaService';
import { playHospitalChime, speakChamada, unlockAudio, getAudioContext } from '../utils/audio';

const PainelSenhas = () => {
  const [ultimaChamada, setUltimaChamada] = useState(null);
  const [historicoChamadas, setHistoricoChamadas] = useState([]);
  const [totalAguardando, setTotalAguardando] = useState(0);
  const [time, setTime] = useState(new Date());
  const [calling, setCalling] = useState(false);
  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const [vozAtiva, setVozAtiva] = useState(true);
  
  const prevChamadaSignatureRef = useRef(null);

  // Desbloqueia áudio ao clicar em qualquer lugar da tela
  const handleAtivarAudio = () => {
    unlockAudio();
    playHospitalChime();
    setAudioHabilitado(true);
  };

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

          // Assinatura única da chamada (ID + Código + Horário) para disparar som até mesmo em rechamadas
          const signature = `${current.id}-${current.codigo}-${current.data_hora_chamada || ''}`;

          if (signature !== prevChamadaSignatureRef.current) {
            if (prevChamadaSignatureRef.current !== null) {
              playHospitalChime();
              if (vozAtiva) {
                speakChamada(current.codigo, current.setor_destino);
              }
            }
            prevChamadaSignatureRef.current = signature;
          }

          setUltimaChamada(current);
          setHistoricoChamadas(history);
        } else {
          setUltimaChamada(null);
          setHistoricoChamadas([]);
          prevChamadaSignatureRef.current = null;
        }
      } catch (error) {
        console.error("Erro ao buscar dados do painel:", error);
      }
    };

    fetchFila();
    const interval = setInterval(fetchFila, 1000);
    return () => clearInterval(interval);
  }, [vozAtiva]);

  // Função para chamar a próxima senha do banco
  const handleChamarProxima = async () => {
    setCalling(true);
    try {
      unlockAudio();
      await filaService.chamarProxima();
      playHospitalChime();
      const data = await filaService.consultarFilas();
      if (data.ultimas_chamadas && data.ultimas_chamadas.length > 0) {
        setUltimaChamada(data.ultimas_chamadas[0]);
        setHistoricoChamadas(data.ultimas_chamadas.slice(1, 6));
        if (vozAtiva) {
          speakChamada(data.ultimas_chamadas[0].codigo, data.ultimas_chamadas[0].setor_destino);
        }
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
      prevChamadaSignatureRef.current = null;
    } catch (err) {
      console.error("Erro ao resetar fila:", err);
    }
  };

  const formatClock = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      onClick={handleAtivarAudio}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', width: '100vw',
        backgroundColor: '#071324', color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif", overflow: 'hidden'
      }}
    >
      {/* ============================================================ */}
      {/* 0. BANNER DE DESBLOQUEIO DE ÁUDIO DO NAVEGADOR               */}
      {/* ============================================================ */}
      {!audioHabilitado && (
        <div
          onClick={handleAtivarAudio}
          style={{
            background: 'linear-gradient(90deg, #D97706 0%, #B45309 100%)',
            color: '#FFF', padding: '10px 20px', textAlign: 'center',
            fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 4px 15px rgba(217, 119, 6, 0.5)', zIndex: 100
          }}
        >
          <Volume2 size={22} className="animate-bounce" />
          <span>🔊 Clique aqui (ou em qualquer lugar da tela) para habilitar o Bip e Voz do Painel da TV!</span>
          <span style={{ background: '#FFF', color: '#B45309', padding: '2px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 900 }}>
            ATIVAR SOM
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. CABEÇALHO DA TV                                            */}
      {/* ============================================================ */}
      <header style={{
        height: '84px',
        backgroundColor: '#0B192C',
        borderBottom: '2px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: '#0056A8', padding: '10px 18px', borderRadius: '12px',
            color: '#FFF', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '2px'
          }}>
            SUS
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#FFF' }}>
              Unidade Básica de Saúde
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700, letterSpacing: '1px' }}>
              Painel Eletrônico de Atendimento • e-SUS APS
            </span>
          </div>
        </div>

        {/* Data, Hora e Controles de Som */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAtivarAudio();
            }}
            title="Toca o som de teste de chamada"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              borderRadius: '10px', padding: '8px 14px',
              fontSize: '0.85rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Volume2 size={18} />
            <span>Testar Bip</span>
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFD100', letterSpacing: '1px' }}>
              {formatClock(time)}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', textTransform: 'capitalize' }}>
              {formatDate(time)}
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. CORPO PRINCIPAL: SENHA ATUAL (65%) + HISTÓRICO (35%)      */}
      {/* ============================================================ */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '24px',
        padding: '24px 32px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        
        {/* --- LADO ESQUERDO (65%): SENHA PRINCIPAL CHAMADA --- */}
        <div style={{
          flex: '1.85',
          background: 'linear-gradient(135deg, #0B192C 0%, #0D2847 100%)',
          borderRadius: '28px',
          border: '2px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {ultimaChamada ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={ultimaChamada.id + ultimaChamada.codigo}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Badge Alerta: Preferencial vs Normal */}
                {ultimaChamada.prioridade === 1 ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
                    color: '#FFFFFF',
                    padding: '10px 32px', borderRadius: '999px',
                    fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px',
                    boxShadow: '0 6px 25px rgba(220, 38, 38, 0.6)',
                    marginBottom: '10px'
                  }}>
                    <Star size={24} fill="#FFD100" color="#FFD100" />
                    <span>ATENDIMENTO PREFERENCIAL {ultimaChamada.sub_prioridade ? `• ${ultimaChamada.sub_prioridade.toUpperCase()}` : ''}</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: '#FFD100', color: '#071324',
                    padding: '10px 32px', borderRadius: '999px',
                    fontSize: '1.3rem', fontWeight: 900, letterSpacing: '3px',
                    boxShadow: '0 6px 20px rgba(255, 209, 0, 0.5)',
                    marginBottom: '10px'
                  }}>
                    <Bell size={24} />
                    <span>SENHA CHAMADA</span>
                  </div>
                )}

                {/* Código Gigante da Senha (Garantido em 1 Linha com whiteSpace nowrap) */}
                <div style={{
                  fontSize: ultimaChamada.codigo.length > 7 ? 'clamp(95px, 12vw, 175px)' : 'clamp(120px, 15vw, 210px)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-2px',
                  color: '#FFFFFF',
                  textShadow: '0 12px 35px rgba(0, 0, 0, 0.8)',
                  margin: '8px 0 16px',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  overflow: 'visible'
                }}>
                  {ultimaChamada.codigo}
                </div>

                {/* Local de Destino em Destaque Dourado */}
                <div style={{
                  background: '#071324',
                  border: '3px solid #FFD100',
                  borderRadius: '22px',
                  padding: '20px 36px',
                  width: '92%',
                  maxWidth: '750px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#94A3B8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    DIRIJA-SE AO LOCAL:
                  </span>
                  <strong style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.9rem)', color: '#FFD100', fontWeight: 900, display: 'block', lineHeight: 1.15 }}>
                    {(ultimaChamada.setor_destino || 'Consultório 01').toUpperCase()}
                  </strong>
                </div>

                {/* Tag de Demanda / Tipo de Atendimento */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.15)', padding: '6px 18px',
                    borderRadius: '10px', fontSize: '1.05rem', fontWeight: 800, color: '#CBD5E1'
                  }}>
                    Demanda: {ultimaChamada.tipo_atendimento}
                  </span>
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
                As chamadas para os consultórios e guichês aparecerão aqui na tela com aviso sonoro.
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
          padding: '24px 28px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}>
          <h2 style={{
            fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8',
            textTransform: 'uppercase', letterSpacing: '1.5px',
            borderBottom: '2px solid rgba(255,255,255,0.08)',
            paddingBottom: '14px', margin: '0 0 16px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>Últimas Chamadas</span>
            <Clock size={24} />
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {historicoChamadas.length > 0 ? (
              historicoChamadas.map((senha, idx) => (
                <motion.div
                  key={senha.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: senha.prioridade === 1 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: senha.prioridade === 1 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#FFF', lineHeight: 1, whiteSpace: 'nowrap' }}>
                        {senha.codigo}
                      </span>
                      {senha.prioridade === 1 && (
                        <span style={{ background: '#DC2626', color: '#FFF', fontSize: '0.7rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                          PREF
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px' }}>
                      {senha.tipo_atendimento}
                      {senha.prioridade === 1 && senha.sub_prioridade && (
                        <span style={{ color: '#FCA5A5', marginLeft: '4px' }}>
                          ({senha.sub_prioridade})
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFD100' }}>
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
        height: '52px', background: '#0B192C',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', fontSize: '0.85rem', color: '#64748B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
            <span>Transmissão em Tempo Real</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#94A3B8' }} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={vozAtiva}
              onChange={(e) => setVozAtiva(e.target.checked)}
              style={{ accentColor: '#38BDF8' }}
            />
            <span>Voz de Acessibilidade (Fala a Senha)</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetarFila();
            }}
            title="Zera o histórico e a fila"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Trash2 size={13} />
            <span>Zerar Painel</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PainelSenhas;
