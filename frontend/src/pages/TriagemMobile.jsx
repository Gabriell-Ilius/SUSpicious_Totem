import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, HeartPulse, Clock, AlertTriangle, Activity } from 'lucide-react';

const TriagemMobile = () => {
  const { id } = useParams();
  const [enviado, setEnviado] = useState(false);
  const [dor, setDor] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui faríamos um POST para o backend salvando a pré-triagem no prontuário do e-SUS
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#38a169', marginTop: '50px' }}>
          <CheckCircle2 size={80} style={{ margin: '0 auto' }} />
        </motion.div>
        <h2 style={{ color: '#2d3748', marginTop: '20px' }}>Escuta Qualificada Recebida!</h2>
        <p style={{ color: '#4a5568', lineHeight: '1.5' }}>
          Suas informações já estão na tela do Enfermeiro de Triagem. Aguarde ser chamado pelo painel visual.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f7fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#0056A8' }}>
        <ClipboardList size={32} />
        <h2 style={{ margin: 0 }}>Pré-Triagem (e-SUS APS)</h2>
      </div>

      <div style={{ backgroundColor: '#ebf8ff', padding: '15px', borderRadius: '8px', marginBottom: '25px', fontSize: '14px', color: '#2b6cb0', lineHeight: '1.4' }}>
        Preencha os dados abaixo enquanto aguarda na recepção. Isso ajuda nossa equipe a classificar sua prioridade de atendimento com precisão.
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 1. Queixa Principal */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>
            1. Qual o principal motivo da sua vinda à unidade hoje?
          </label>
          <textarea 
            required
            rows={3}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '16px', boxSizing: 'border-box' }}
            placeholder="Ex: Dor de cabeça forte, febre, troca de receita..."
          />
        </div>

        {/* 2. Tempo de Evolução */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>
            <Clock size={18} /> 2. Há quanto tempo começaram os sintomas?
          </label>
          <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '16px', backgroundColor: 'white' }}>
            <option value="hoje">Começou hoje (Agudo)</option>
            <option value="dias">Há alguns dias</option>
            <option value="semanas">Há semanas ou meses (Crônico)</option>
            <option value="nao_se_aplica">Não se aplica (Rotina/Receita)</option>
          </select>
        </div>

        {/* 3. Escala de Dor */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>
            <Activity size={18} /> 3. Escala de Dor / Desconforto (0 a 10)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input 
              type="range" 
              min="0" max="10" 
              value={dor} 
              onChange={(e) => setDor(e.target.value)}
              style={{ flex: 1, accentColor: dor > 6 ? '#e53e3e' : dor > 3 ? '#d69e2e' : '#38a169' }} 
            />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: dor > 6 ? '#e53e3e' : '#4a5568', width: '30px', textAlign: 'center' }}>
              {dor}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            <span>0 (Sem dor)</span>
            <span>10 (Dor Insurportável)</span>
          </div>
        </div>

        {/* 4. Sinais de Alerta */}
        <div style={{ backgroundColor: '#fff5f5', padding: '15px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: 'bold', color: '#c53030' }}>
            <AlertTriangle size={18} /> 4. Sinais de Alerta (Marque se tiver)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748' }}><input type="checkbox" style={{ transform: 'scale(1.2)' }} /> Falta de ar intensa ou dor no peito</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748' }}><input type="checkbox" style={{ transform: 'scale(1.2)' }} /> Sangramento ativo ou desmaio</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748' }}><input type="checkbox" style={{ transform: 'scale(1.2)' }} /> Alteração súbita na fala ou movimento</label>
          </div>
        </div>

        {/* 5. Comorbidades / Contexto */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>
            <HeartPulse size={18} /> 5. Condições de Saúde Previas
          </label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2d3748' }}><input type="checkbox" /> Hipertensão (Pressão Alta)</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2d3748' }}><input type="checkbox" /> Diabetes</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2d3748' }}><input type="checkbox" /> Gestante</label>
          </div>
        </div>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          type="submit" 
          style={{ 
            backgroundColor: '#0056A8', 
            color: 'white', 
            border: 'none', 
            padding: '16px', 
            borderRadius: '8px', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginTop: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Enviar Avaliação
        </motion.button>
      </form>
    </div>
  );
};

export default TriagemMobile;
