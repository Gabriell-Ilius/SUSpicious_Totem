import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, HeartPulse, Thermometer, AlertCircle } from 'lucide-react';

const TriagemMobile = () => {
  const { id } = useParams();
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#38a169', marginTop: '50px' }}>
          <CheckCircle2 size={80} style={{ margin: '0 auto' }} />
        </motion.div>
        <h2 style={{ color: '#2d3748', marginTop: '20px' }}>Triagem Enviada!</h2>
        <p style={{ color: '#4a5568', lineHeight: '1.5' }}>
          As informações foram enviadas diretamente para a enfermeira. Aguarde ser chamado no painel!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f7fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', color: '#0056A8' }}>
        <ClipboardList size={32} />
        <h2 style={{ margin: 0 }}>Pré-Triagem SUS</h2>
      </div>

      <div style={{ backgroundColor: '#ebf8ff', padding: '15px', borderRadius: '8px', marginBottom: '25px', fontSize: '14px', color: '#2b6cb0', display: 'flex', gap: '10px' }}>
        <AlertCircle size={20} />
        <span>Preencha os dados abaixo enquanto aguarda. Isso agilizará o seu atendimento na sala de triagem.</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568' }}>Quais seus principais sintomas hoje?</label>
          <textarea 
            required
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '16px', boxSizing: 'border-box' }}
            placeholder="Ex: Dor de cabeça, febre há 2 dias..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={18} /> Você está com febre?
          </label>
          <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '16px', backgroundColor: 'white' }}>
            <option>Não tenho certeza</option>
            <option>Sim, alta (acima de 38°)</option>
            <option>Sim, baixa</option>
            <option>Não</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HeartPulse size={18} /> Possui doenças crônicas?
          </label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" /> Hipertensão</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" /> Diabetes</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" /> Asma</label>
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
            marginTop: '10px',
            cursor: 'pointer'
          }}
        >
          Enviar Triagem
        </motion.button>
      </form>
    </div>
  );
};

export default TriagemMobile;
