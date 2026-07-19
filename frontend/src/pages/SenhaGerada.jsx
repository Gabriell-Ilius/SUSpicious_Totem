import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SenhaCard from '../components/SenhaCard';

const SenhaGerada = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tipoAtendimento } = location.state || { tipoAtendimento: 'ESPONTANEA' };

  // Mock de senha gerada (no Marco 3 isso virá da API)
  const senhaMock = {
    codigo: tipoAtendimento === 'AGENDADA' ? 'AGE-042' : 'ESP-103',
    tipo: tipoAtendimento
  };

  useEffect(() => {
    // Redireciona para o QR Code de triagem após exibir a senha por 6 segundos
    const timer = setTimeout(() => {
      navigate('/qrcode');
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-title">
        <motion.h2
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          style={{ color: 'var(--sus-green)' }}
        >
          Senha Emitida com Sucesso!
        </motion.h2>
        <p className="page-subtitle">Retire a sua ficha na impressora logo abaixo.</p>
      </div>

      <SenhaCard codigo={senhaMock.codigo} tipo={senhaMock.tipo} highlight={true} />

    </motion.div>
  );
};

export default SenhaGerada;
