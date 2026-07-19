import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import NumPad from '../components/NumPad';
import BigButton from '../components/BigButton';

const InserirCPF = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cpf, setCpf] = useState('');
  
  const tipoAtendimento = location.state?.tipoAtendimento || 'ESPONTANEA';

  const handleKeyPress = (key) => {
    if (cpf.length < 11) setCpf((prev) => prev + key);
  };

  const handleDelete = () => {
    setCpf((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCpf('');
  };

  const handleVoltar = () => {
    navigate('/');
  };

  const handleContinuar = () => {
    if (cpf.length === 11) {
      // Mock logic: se preencheu tudo, vai para confirmar. 
      // No Marco 3 chamará API.
      navigate('/confirmar', { state: { cpf, tipoAtendimento } });
    } else if (cpf.length === 0) {
      // Permite emitir senha sem CPF (paciente não sabe)
      navigate('/senha', { state: { tipoAtendimento } });
    }
  };

  // Formata 12345678900 para 123.456.789-00
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <div className="page-title">
        <h2>Digite o seu CPF</h2>
        <p className="page-subtitle">Opcional, mas ajuda no seu atendimento.</p>
      </div>

      <div className="cpf-display">
        {cpf ? formatCPF(cpf) : <span style={{ color: '#cbd5e1' }}>000.000.000-00</span>}
      </div>

      <NumPad onKeyPress={handleKeyPress} onDelete={handleDelete} onClear={handleClear} />

      <div style={{ display: 'flex', gap: '24px', width: '100%', maxWidth: '600px', marginTop: '16px' }}>
        <button 
          className="big-button secondary" 
          style={{ width: 'auto', padding: '0 24px', height: '80px' }}
          onClick={handleVoltar}
        >
          <ChevronLeft size={32} />
          Voltar
        </button>
        <button 
          className="big-button primary" 
          style={{ flex: 1, justifyContent: 'center', height: '80px', backgroundColor: cpf.length === 11 ? 'var(--sus-green)' : 'var(--sus-blue)' }}
          onClick={handleContinuar}
        >
          {cpf.length === 11 ? (
            <><CheckCircle2 size={32} /> Confirmar CPF</>
          ) : (
            cpf.length === 0 ? "Não tenho / Pular" : "Preencha 11 dígitos"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default InserirCPF;
