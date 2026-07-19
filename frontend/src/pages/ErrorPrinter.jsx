import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const ErrorPrinter = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ justifyContent: 'center', height: '100%' }}
    >
      <div style={{ backgroundColor: '#e53e3e', padding: '40px', borderRadius: '50%', marginBottom: '40px', color: 'white' }}>
        <Printer size={80} />
      </div>
      
      <h1 className="page-title" style={{ color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <AlertTriangle size={48} />
        Erro na Impressora
      </h1>
      
      <p className="page-subtitle" style={{ color: 'var(--text-primary)', maxWidth: '600px', margin: '20px auto 40px auto' }}>
        Ocorreu um problema ao comunicar com a impressora térmica (falta de papel ou desconectada). <br/><br/>
        <b>Sua senha foi gerada no sistema</b>, mas não pôde ser impressa. Por favor, dirija-se à recepção informando o seu CPF.
      </p>

      <button 
        className="big-button secondary" 
        onClick={() => navigate('/')}
        style={{ width: '100%', maxWidth: '400px', justifyContent: 'center' }}
      >
        Voltar ao Início
      </button>

    </motion.div>
  );
};

export default ErrorPrinter;
