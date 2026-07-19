import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import BigButton from '../components/BigButton';

const ConfirmarPaciente = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tipoAtendimento, paciente } = location.state || { tipoAtendimento: 'ESPONTANEA', paciente: null };

  const handleConfirmar = () => {
    navigate('/senha', { state: { tipoAtendimento, cpf: paciente?.cpf } });
  };

  const handleCorrigir = () => {
    navigate('/cpf', { state: { tipoAtendimento } });
  };

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="page-title">
        <h2>Confirmar Paciente</h2>
        <p className="page-subtitle">Verifique se os dados estão corretos</p>
      </div>

      <div className="glass-panel" style={{ padding: '40px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', marginBottom: '16px' }}>
          {paciente ? paciente.nome_completo : "Paciente Desconhecido"}
        </h1>
        <div style={{ fontSize: '20px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <strong>CNS:</strong> {paciente ? paciente.cartao_sus : "N/A"}
        </div>
      </div>

      <div className="buttons-column" style={{ flexDirection: 'row', maxWidth: '600px' }}>
        <BigButton 
          icon={XCircle}
          title="Não sou eu"
          variant="secondary"
          onClick={handleCorrigir}
        />
        <BigButton 
          icon={CheckCircle2}
          title="Sim, confirmar"
          variant="success"
          onClick={handleConfirmar}
        />
      </div>
    </motion.div>
  );
};

export default ConfirmarPaciente;
