import React from 'react';
import { motion } from 'framer-motion';

const SenhaCard = ({ codigo, tipo, highlight = false }) => {
  return (
    <motion.div 
      className="senha-card glass-panel"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: highlight ? "0 0 40px rgba(0, 86, 168, 0.4)" : "var(--shadow-lg)"
      }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <div className="senha-type">{tipo}</div>
      <div className="senha-code">{codigo}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>
        Aguarde ser chamado no painel
      </div>
    </motion.div>
  );
};

export default SenhaCard;
