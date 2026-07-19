import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeTriagem = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Retorna para a home após 10 segundos
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="page-title">
        <h2>Acelere seu atendimento</h2>
        <p className="page-subtitle">Aponte a câmera do celular para o QR Code e preencha sua triagem digital enquanto aguarda.</p>
      </div>

      <div className="glass-panel" style={{ padding: '40px', borderRadius: 'var(--radius-lg)', background: '#fff' }}>
        <QRCodeSVG 
          value="https://sus.gov.br/triagem-rapida" 
          size={300} 
          level="M"
          includeMargin={true}
        />
      </div>

      <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
        Esta tela fechará automaticamente em instantes...
      </div>
    </motion.div>
  );
};

export default QRCodeTriagem;
