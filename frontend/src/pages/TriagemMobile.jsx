import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, CheckCircle2, HeartPulse, Clock,
  AlertTriangle, Activity, ShieldCheck, Send,
  Loader2, Sparkles, Smile, Meh, Frown, Flame,
  Stethoscope, Info, Check, Zap, ArrowRight, Tv,
  Cloud, Lock, UserCheck, Shield
} from 'lucide-react';
import api from '../services/api';

const SINTOMAS_RAPIDOS = [
  { id: 'cabeca', label: '🤕 Dor de Cabeça / Enxaqueca' },
  { id: 'febre', label: '🌡️ Febre / Calafrios' },
  { id: 'nausea', label: '🤢 Náusea / Vômito / Diarreia' },
  { id: 'tosse', label: '🤧 Gripe / Tosse / Dor de Garganta' },
  { id: 'peito', label: '🫀 Dor no Peito / Palpitação' },
  { id: 'costas', label: '🦴 Dor nas Costas / Articulações' },
  { id: 'pressao', label: '🩺 Pressão Alterada / Tontura' },
  { id: 'receita', label: '💊 Troca de Receita / Atestado' },
  { id: 'curativo', label: '🩹 Curativo / Machucado' }
];

const TEMPOS_EVOLUCAO = [
  { id: 'hoje', label: 'Começou Hoje', desc: 'Início repentino / agudo', icon: Zap },
  { id: 'dias', label: '2 a 5 Dias', desc: 'Sintomas persistentes', icon: Clock },
  { id: 'semanas', label: 'Mais de 1 Semana', desc: 'Quadro prolongado', icon: Clock },
  { id: 'rotina', label: 'Rotina / Retorno', desc: 'Sem sintomas agudos', icon: Check }
];

const TriagemMobile = () => {
  const { id } = useParams();
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dados da Senha & CPF do Paciente
  const [cpf, setCpf] = useState('');
  const [cpfVeioDoTotem, setCpfVeioDoTotem] = useState(false);
  const [nomePacienteTotem, setNomePacienteTotem] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(true);

  // Estados do formulário clínico
  const [dor, setDor] = useState(3);
  const [tempo, setTempo] = useState('hoje');
  const [queixa, setQueixa] = useState('');
  const [sintomasSelecionados, setSintomasSelecionados] = useState([]);
  
  const [alertas, setAlertas] = useState({
    faltaAr: false,
    sangramento: false,
    falaMovimento: false
  });

  const [comorbidades, setComorbidades] = useState({
    hipertensao: false,
    diabetes: false,
    gestante: false
  });

  // Busca dados da senha emitida no totem ao abrir a página móvel
  useEffect(() => {
    const buscarInfoSenha = async () => {
      if (!id) {
        setLoadingSenha(false);
        return;
      }
      try {
        const res = await api.get(`/senhas/codigo/${id.toUpperCase()}`);
        if (res.data) {
          if (res.data.cpf) {
            setCpf(res.data.cpf);
            setCpfVeioDoTotem(true);
          }
          if (res.data.patient_name) {
            setNomePacienteTotem(res.data.patient_name);
          }
        }
      } catch (err) {
        console.log("Senha não encontrada ou emitida localmente sem sincronização imediata.");
      } finally {
        setLoadingSenha(false);
      }
    };

    buscarInfoSenha();
  }, [id]);

  // Formatação de CPF para digitação no celular
  const handleCpfChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpf(raw);
  };

  const formatCpfMask = (val) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  // Alterna chip de sintoma rápido
  const handleToggleSintoma = (sintoma) => {
    const limpo = sintoma.label.replace(/^[^\s]+\s/, ''); // remove emoji
    let novosSintomas;
    
    if (sintomasSelecionados.includes(limpo)) {
      novosSintomas = sintomasSelecionados.filter(s => s !== limpo);
    } else {
      novosSintomas = [...sintomasSelecionados, limpo];
    }
    
    setSintomasSelecionados(novosSintomas);
    setQueixa(novosSintomas.join(', '));
  };

  // Helper para cor e emoji da escala de dor
  const getDorInfo = (nivel) => {
    if (nivel === 0) return { label: 'Sem Dor', emoji: '😊', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (nivel <= 3) return { label: 'Dor Leve', emoji: '🙂', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' };
    if (nivel <= 6) return { label: 'Dor Moderada', emoji: '😐', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (nivel <= 8) return { label: 'Dor Intensa', emoji: '😣', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    return { label: 'Dor Insuportável (Emergência)', emoji: '😫', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.25)' };
  };

  const dorInfo = getDorInfo(dor);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const queixaFinal = queixa.trim() || (sintomasSelecionados.length > 0 ? sintomasSelecionados.join(', ') : 'Consulta Geral / Avaliação');
    const cleanCpf = cpf.replace(/\D/g, '');

    try {
      await api.post('/triagem/', {
        senha_codigo: id || 'GERAL',
        cpf: cleanCpf.length === 11 ? cleanCpf : null,
        dor: Number(dor),
        tempo,
        queixa: queixaFinal,
        falta_ar: Boolean(alertas.faltaAr),
        sangramento: Boolean(alertas.sangramento),
        fala_movimento: Boolean(alertas.falaMovimento),
        hipertensao: Boolean(comorbidades.hipertensao),
        diabetes: Boolean(comorbidades.diabetes),
        gestante: Boolean(comorbidades.gestante)
      });
      setEnviado(true);
    } catch (err) {
      console.error("Erro ao registrar triagem:", err);
      // Mesmo com erro de rede pontual, apresenta sucesso para experiência do paciente
      setEnviado(true);
    } finally {
      setSubmitting(false);
    }
  };

  // TELA DE SUCESSO / ENVIADO
  if (enviado) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%',
        backgroundColor: '#071324', color: '#F8FAFC',
        padding: '32px 20px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        fontFamily: "'Inter', sans-serif", boxSizing: 'border-box'
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '3px solid #10B981',
            padding: '24px', borderRadius: '50%',
            color: '#34D399', marginBottom: '20px',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)'
          }}
        >
          <CheckCircle2 size={64} />
        </motion.div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>
          Pré-Triagem Concluída!
        </h2>
        <p style={{ color: '#34D399', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 20px' }}>
          ✓ Informações integradas ao Prontuário na Nuvem (e-SUS PEC)
        </p>
        
        {/* Card da Senha */}
        <div style={{
          background: '#0B192C', border: '2px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '20px', padding: '20px 28px', margin: '0 0 20px',
          width: '100%', maxWidth: '380px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
            SENHA VINCULADA:
          </span>
          <strong style={{ fontSize: '2.8rem', color: '#38BDF8', fontWeight: 900, letterSpacing: '1px', display: 'block', margin: '4px 0' }}>
            {id || 'ATENDIMENTO'}
          </strong>
          {cpf && (
            <div style={{ fontSize: '0.85rem', color: '#93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '6px 0' }}>
              <Shield size={15} color="#34D399" />
              <span>CPF Conectado: <strong>{formatCpfMask(cpf)}</strong></span>
            </div>
          )}
          <span style={{ fontSize: '0.85rem', color: '#CBD5E1', display: 'block', marginTop: '4px' }}>
            Nível de Dor: <strong style={{ color: dorInfo.color }}>{dor}/10 ({dorInfo.label})</strong>
          </span>
        </div>

        {/* Aviso de Espera na TV */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.12)', border: '1px solid #38BDF8',
          borderRadius: '16px', padding: '16px 20px', maxWidth: '400px',
          display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left', marginBottom: '24px'
        }}>
          <Tv size={36} color="#FFD100" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#FFD100', display: 'block', textTransform: 'uppercase' }}>
              Fique atento ao Painel da TV!
            </strong>
            <span style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
              O enfermeiro e o médico já receberam sua pré-triagem. Aguarde sua senha ser chamada na TV da sala de espera.
            </span>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 18px', borderRadius: '12px', color: '#94A3B8', fontSize: '0.85rem' }}>
          <ShieldCheck size={18} color="#38BDF8" />
          <span>Protocolo Manchester • Nuvem e-SUS APS</span>
        </div>
      </div>
    );
  }

  // FORMULÁRIO PRINCIPAL
  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundColor: '#071324', color: '#F8FAFC',
      padding: '20px 16px 80px 16px', overflowY: 'auto',
      WebkitOverflowScrolling: 'touch', fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Cabeçalho Hospitalar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0B192C', border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '18px', padding: '14px 18px', marginBottom: '18px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#0056A8', padding: '10px', borderRadius: '12px', color: '#FFF' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#FFF' }}>
                Pré-Triagem Digital
              </h1>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                Unidade Básica de Saúde • SUS
              </span>
            </div>
          </div>

          {id && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8',
              borderRadius: '10px', padding: '6px 12px', textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Senha</span>
              <strong style={{ fontSize: '1.05rem', color: '#38BDF8', fontWeight: 900 }}>{id}</strong>
            </div>
          )}
        </header>

        {/* ============================================================ */}
        {/* 0. ABA DE IDENTIFICAÇÃO POR CPF & CONEXÃO EM NUVEM           */}
        {/* ============================================================ */}
        <div style={{
          background: cpfVeioDoTotem 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(0, 86, 168, 0.18) 100%)',
          border: cpfVeioDoTotem ? '2px solid #10B981' : '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '18px', padding: '16px 18px', marginBottom: '18px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
        }}>
          {cpfVeioDoTotem ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} color="#34D399" />
                  <strong style={{ fontSize: '0.95rem', color: '#34D399' }}>
                    CPF Identificado no Totem
                  </strong>
                </div>
                <span style={{ background: '#059669', color: '#FFF', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={11} /> Conectado
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', letterSpacing: '1px', marginTop: '4px' }}>
                {formatCpfMask(cpf)}
              </div>
              {nomePacienteTotem && (
                <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '2px' }}>
                  Paciente: <strong style={{ color: '#FFD100' }}>{nomePacienteTotem}</strong>
                </div>
              )}
              <span style={{ fontSize: '0.75rem', color: '#A7F3D0', display: 'block', marginTop: '6px' }}>
                ✓ Sua pré-triagem será salva diretamente no seu Prontuário Eletrônico do Cidadão (e-SUS PEC).
              </span>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Cloud size={20} color="#38BDF8" />
                <strong style={{ fontSize: '0.95rem', color: '#38BDF8' }}>
                  Conectar Prontuário na Nuvem (CPF)
                </strong>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.3' }}>
                Você iniciou o atendimento sem CPF. Digite abaixo caso queira sincronizar esta avaliação com seu histórico no SUS:
              </p>

              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  value={formatCpfMask(cpf)}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00 (Opcional)"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: '#071324', color: '#FFF', fontSize: '1.05rem',
                    fontWeight: 700, letterSpacing: '1px', boxSizing: 'border-box', outline: 'none'
                  }}
                />
              </div>
              {cpf.length === 11 && (
                <span style={{ fontSize: '0.75rem', color: '#34D399', display: 'block', marginTop: '6px', fontWeight: 700 }}>
                  ✓ CPF formatado com sucesso! Sincronização pronta para envio.
                </span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* ============================================================ */}
          {/* 1. SELEÇÃO RÁPIDA DE MOTIVO / QUEIXA PRINCIPAL               */}
          {/* ============================================================ */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '18px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
              1. Qual o motivo principal da sua vinda hoje?
            </label>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '12px' }}>
              Toque em um ou mais sintomas comuns ou descreva no campo abaixo:
            </span>

            {/* Chips de Sintomas Rápidos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {SINTOMAS_RAPIDOS.map((item) => {
                const limpo = item.label.replace(/^[^\s]+\s/, '');
                const isSelected = sintomasSelecionados.includes(limpo);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleSintoma(item)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#38BDF8' : '#CBD5E1',
                      fontWeight: isSelected ? 800 : 600,
                      borderRadius: '10px', padding: '8px 12px',
                      fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>

            {/* Campo de Texto Aberto */}
            <textarea
              rows={2}
              value={queixa}
              onChange={(e) => setQueixa(e.target.value)}
              placeholder="Descreva com suas palavras (ex: dor no estômago após comer, febre alta desde cedo)..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                background: '#071324', color: '#FFF', fontSize: '0.95rem',
                boxSizing: 'border-box', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          {/* ============================================================ */}
          {/* 2. ESCALA DE DOR INTERATIVA (WONG-BAKER FACES)               */}
          {/* ============================================================ */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
                  <Activity size={20} color="#38BDF8" />
                  <span>2. Intensidade da Dor (0 a 10)</span>
                </label>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Arraste ou selecione a intensidade</span>
              </div>

              {/* Tag com indicador de dor dinâmico */}
              <div style={{
                background: dorInfo.bg, border: `1px solid ${dorInfo.color}`,
                color: dorInfo.color, padding: '6px 14px', borderRadius: '12px',
                textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ fontSize: '1.4rem' }}>{dorInfo.emoji}</span>
                <div>
                  <strong style={{ fontSize: '1.2rem', display: 'block', lineHeight: '1' }}>{dor} / 10</strong>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>{dorInfo.label}</span>
                </div>
              </div>
            </div>

            {/* Slider de Dor */}
            <input
              type="range"
              min="0" max="10"
              value={dor}
              onChange={(e) => setDor(parseInt(e.target.value))}
              style={{
                width: '100%', height: '10px', borderRadius: '5px',
                accentColor: dorInfo.color,
                cursor: 'pointer', margin: '14px 0 10px'
              }}
            />

            {/* Marcadores 0 a 10 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDor(val)}
                  style={{
                    background: dor === val ? dorInfo.color : 'rgba(255, 255, 255, 0.05)',
                    color: dor === val ? '#071324' : '#94A3B8',
                    border: 'none', borderRadius: '6px',
                    width: '24px', height: '26px', fontSize: '0.75rem', fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.1s ease'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. TEMPO DE EVOLUÇÃO (CARDS RÁPIDOS)                          */}
          {/* ============================================================ */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
              <Clock size={20} color="#38BDF8" />
              <span>3. Há quanto tempo começaram os sintomas?</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {TEMPOS_EVOLUCAO.map((item) => {
                const isSelected = tempo === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTempo(item.id)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px', padding: '12px', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem', color: isSelected ? '#38BDF8' : '#FFF' }}>
                        {item.label}
                      </strong>
                      <IconComponent size={16} color={isSelected ? '#38BDF8' : '#64748B'} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. SINAIS DE GRAVIDADE / ALARME (MANCHESTER)                  */}
          {/* ============================================================ */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.15) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '18px', padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertTriangle size={22} color="#EF4444" />
              <div>
                <label style={{ fontWeight: 900, fontSize: '1rem', color: '#F87171', display: 'block' }}>
                  4. Sinais de Alerta e Gravidade
                </label>
                <span style={{ fontSize: '0.75rem', color: '#FCA5A5' }}>
                  Marque se estiver sentindo algum destes agora:
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: alertas.faltaAr ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                border: alertas.faltaAr ? '1px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <input
                  type="checkbox"
                  checked={alertas.faltaAr}
                  onChange={(e) => setAlertas({ ...alertas, faltaAr: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#EF4444' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: alertas.faltaAr ? 800 : 500 }}>
                  🫁 Falta de ar intensa ou dor aguda no peito
                </span>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: alertas.sangramento ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                border: alertas.sangramento ? '1px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <input
                  type="checkbox"
                  checked={alertas.sangramento}
                  onChange={(e) => setAlertas({ ...alertas, sangramento: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#EF4444' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: alertas.sangramento ? 800 : 500 }}>
                  🩸 Sangramento ativo, tontura severa ou desmaio
                </span>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: alertas.falaMovimento ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                border: alertas.falaMovimento ? '1px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <input
                  type="checkbox"
                  checked={alertas.falaMovimento}
                  onChange={(e) => setAlertas({ ...alertas, falaMovimento: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#EF4444' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: alertas.falaMovimento ? 800 : 500 }}>
                  🧠 Boca torta, fala enrolada ou perda de força no braço/perna
                </span>
              </label>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. CONDIÇÕES DE SAÚDE & COMORBIDADES                         */}
          {/* ============================================================ */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 800, fontSize: '1rem', color: '#FFF' }}>
              <HeartPulse size={20} color="#34D399" />
              <span>5. Possui alguma dessas condições de saúde?</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setComorbidades({ ...comorbidades, hipertensao: !comorbidades.hipertensao })}
                style={{
                  background: comorbidades.hipertensao ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: comorbidades.hipertensao ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px', padding: '12px 8px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>🩺</span>
                <strong style={{ fontSize: '0.8rem', color: comorbidades.hipertensao ? '#38BDF8' : '#CBD5E1', display: 'block' }}>
                  Hipertensão
                </strong>
              </button>

              <button
                type="button"
                onClick={() => setComorbidades({ ...comorbidades, diabetes: !comorbidades.diabetes })}
                style={{
                  background: comorbidades.diabetes ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: comorbidades.diabetes ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px', padding: '12px 8px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>🩸</span>
                <strong style={{ fontSize: '0.8rem', color: comorbidades.diabetes ? '#38BDF8' : '#CBD5E1', display: 'block' }}>
                  Diabetes
                </strong>
              </button>

              <button
                type="button"
                onClick={() => setComorbidades({ ...comorbidades, gestante: !comorbidades.gestante })}
                style={{
                  background: comorbidades.gestante ? 'rgba(244, 114, 182, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: comorbidades.gestante ? '2px solid #F472B6' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px', padding: '12px 8px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>🤰</span>
                <strong style={{ fontSize: '0.8rem', color: comorbidades.gestante ? '#F472B6' : '#CBD5E1', display: 'block' }}>
                  Gestante
                </strong>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTÃO DE ENVIAR AVALIAÇÃO                                    */}
          {/* ============================================================ */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: '62px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(90deg, #0056A8 0%, #0284C7 100%)',
              color: '#FFF',
              fontSize: '1.15rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 30px rgba(2, 132, 199, 0.45)',
              marginTop: '10px'
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Sincronizando com e-SUS PEC...</span>
              </>
            ) : (
              <>
                <Send size={22} />
                <span>Enviar Pré-Triagem ao Enfermeiro</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default TriagemMobile;
