import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, HeartPulse, Clock, AlertTriangle, Activity, ShieldCheck, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

const TriagemMobile = () => {
  const { id } = useParams();
  const [enviado, setEnviado] = useState(false);
  const [dor, setDor] = useState(3);
  const [tempo, setTempo] = useState('hoje');
  const [queixa, setQueixa] = useState('');
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/triagem/', {
        senha_codigo: id || 'GERAL',
        dor: Number(dor),
        tempo,
        queixa,
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
      setEnviado(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (enviado) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%',
        backgroundColor: '#071324', color: '#F8FAFC',
        padding: '32px 20px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10B981',
            padding: '24px', borderRadius: '50%',
            color: '#34D399', marginBottom: '24px'
          }}
        >
          <CheckCircle2 size={64} />
        </motion.div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399', margin: '0 0 12px' }}>
          Pré-Triagem Enviada!
        </h2>
        
        <div style={{ background: '#0B192C', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '16px 24px', margin: '16px 0', maxWidth: '380px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SENHA VINCULADA:
          </span>
          <strong style={{ fontSize: '2rem', color: '#38BDF8', fontWeight: 900 }}>
            {id || 'ATENDIMENTO'}
          </strong>
        </div>

        <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.5', maxWidth: '400px', margin: '12px 0 24px' }}>
          Suas informações já foram integradas e estão na tela do <strong>Enfermeiro de Acolhimento</strong>. Aguarde ser chamado pelo painel da recepção.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.12)', padding: '10px 18px', borderRadius: '10px', color: '#38BDF8', fontSize: '0.9rem', fontWeight: 700 }}>
          <ShieldCheck size={20} />
          <span>Atendimento Humanizado — SUS</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#071324',
      color: '#F8FAFC',
      padding: '20px 16px 80px 16px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Topo do Formulário */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#0056A8', padding: '10px', borderRadius: '10px' }}>
              <ClipboardList size={26} color="#FFF" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
                Pré-Triagem Digital
              </h1>
              <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 700 }}>
                e-SUS APS • Acolhimento
              </span>
            </div>
          </div>

          {id && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8',
              borderRadius: '8px', padding: '6px 12px', textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase' }}>Senha</span>
              <strong style={{ fontSize: '1rem', color: '#38BDF8', fontWeight: 900 }}>{id}</strong>
            </div>
          )}
        </header>

        <div style={{
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '14px 16px', borderRadius: '12px', marginBottom: '24px',
          fontSize: '0.9rem', color: '#E0F2FE', lineHeight: '1.4'
        }}>
          💡 <strong>Acelere seu atendimento:</strong> Preencha os campos abaixo enquanto aguarda na recepção para adiantar a avaliação do enfermeiro.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Queixa Principal */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>
              1. Qual o principal motivo da sua vinda à unidade hoje?
            </label>
            <textarea 
              required
              rows={3}
              value={queixa}
              onChange={(e) => setQueixa(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: '#071324', color: '#FFF', fontSize: '1rem',
                boxSizing: 'border-box', outline: 'none', resize: 'vertical'
              }}
              placeholder="Ex: Dor de cabeça forte, febre desde ontem, mal-estar..."
            />
          </div>

          {/* 2. Tempo de Evolução */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>
              <Clock size={18} color="#38BDF8" />
              <span>2. Há quanto tempo começaram os sintomas?</span>
            </label>
            <select
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: '#071324', color: '#FFF', fontSize: '1rem',
                outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="hoje">Começou hoje (Início Agudo)</option>
              <option value="dias">Há alguns dias (2 a 5 dias)</option>
              <option value="semanas">Há mais de uma semana</option>
              <option value="nao_se_aplica">Rotina / Troca de Receita</option>
            </select>
          </div>

          {/* 3. Escala de Dor */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#38BDF8" />
                <span>3. Escala de Dor (0 a 10)</span>
              </span>
              <span style={{
                fontSize: '1.4rem', fontWeight: 900,
                color: dor >= 7 ? '#EF4444' : dor >= 4 ? '#F59E0B' : '#10B981',
                background: 'rgba(255, 255, 255, 0.08)', padding: '2px 10px', borderRadius: '8px'
              }}>
                {dor}
              </span>
            </label>
            
            <input 
              type="range" 
              min="0" max="10" 
              value={dor} 
              onChange={(e) => setDor(parseInt(e.target.value))}
              style={{
                width: '100%', height: '8px', borderRadius: '5px',
                accentColor: dor >= 7 ? '#EF4444' : dor >= 4 ? '#F59E0B' : '#10B981',
                cursor: 'pointer', margin: '10px 0'
              }} 
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
              <span>0 (Sem dor)</span>
              <span>5 (Moderada)</span>
              <span>10 (Insuportável)</span>
            </div>
          </div>

          {/* 4. Sinais de Alerta */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px', padding: '16px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, fontSize: '0.95rem', color: '#F87171' }}>
              <AlertTriangle size={18} />
              <span>4. Sinais de Gravidade (Marque se tiver)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertas.faltaAr}
                  onChange={(e) => setAlertas({ ...alertas, faltaAr: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#EF4444' }}
                />
                <span>Falta de ar intensa ou dor no peito</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertas.sangramento}
                  onChange={(e) => setAlertas({ ...alertas, sangramento: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#EF4444' }}
                />
                <span>Sangramento ativo, tontura ou desmaio</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertas.falaMovimento}
                  onChange={(e) => setAlertas({ ...alertas, falaMovimento: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#EF4444' }}
                />
                <span>Alteração súbita na fala ou perda de força</span>
              </label>
            </div>
          </div>

          {/* 5. Condições Prévia */}
          <div style={{ background: '#0B192C', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>
              <HeartPulse size={18} color="#34D399" />
              <span>5. Condições de Saúde</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={comorbidades.hipertensao}
                  onChange={(e) => setComorbidades({ ...comorbidades, hipertensao: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#38BDF8' }}
                />
                <span>Hipertensão (Pressão Alta)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={comorbidades.diabetes}
                  onChange={(e) => setComorbidades({ ...comorbidades, diabetes: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#38BDF8' }}
                />
                <span>Diabetes</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={comorbidades.gestante}
                  onChange={(e) => setComorbidades({ ...comorbidades, gestante: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#38BDF8' }}
                />
                <span>Gestante</span>
              </label>
            </div>
          </div>

          {/* Botão de Envio com destaque e feedback */}
          {/* Botão de Enviar */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="action-btn-primary"
            style={{
              width: '100%',
              height: '60px',
              fontSize: '1.2rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
              marginTop: '12px'
            }}
          >
            {submitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            <span>{submitting ? 'Enviando ao Enfermeiro...' : 'Enviar Avaliação ao Enfermeiro'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TriagemMobile;
