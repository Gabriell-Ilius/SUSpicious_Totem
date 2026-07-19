import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import SenhaCard from '../components/SenhaCard';
import senhaService from '../services/senhaService';

const SenhaGerada = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tipoAtendimento, cpf } = location.state || { tipoAtendimento: 'ESPONTANEA', cpf: null };

  const [senha, setSenha] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;
    const fetchSenha = async () => {
      try {
        const data = await senhaService.gerarSenha(tipoAtendimento, cpf);
        setSenha(data);
        
        // Redireciona para o QR Code de triagem após exibir a senha por 6 segundos
        timer = setTimeout(() => {
          navigate('/qrcode');
        }, 6000);
      } catch (error) {
        console.error("Erro ao gerar senha", error);
        if (error.response && error.response.status === 503) {
          navigate('/error-impressora');
        } else {
          navigate('/error');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSenha();

    return () => clearTimeout(timer);
  }, [navigate, tipoAtendimento, cpf]);

  if (loading) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', height: '100%' }}>
        <Loader2 size={64} className="animate-spin" color="var(--sus-blue)" />
        <h2 style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>Gerando sua senha...</h2>
      </div>
    );
  }

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

      <SenhaCard codigo={senha.codigo} tipo={senha.tipo_atendimento} highlight={true} />

    </motion.div>
  );
};

export default SenhaGerada;
