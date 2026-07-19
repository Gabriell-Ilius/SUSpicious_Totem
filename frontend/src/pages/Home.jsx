import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Users, Syringe } from 'lucide-react';
import { motion } from 'framer-motion';
import BigButton from '../components/BigButton';

const Home = () => {
  const navigate = useNavigate();

  const handleAction = (tipo) => {
    // No Marco 2, salvamos o tipo no state do router e vamos para o CPF
    navigate('/cpf', { state: { tipoAtendimento: tipo } });
  };

  return (
    <motion.div 
      className="page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="page-title">
        <h2>Selecione o seu atendimento</h2>
        <p className="page-subtitle">Toque na opção desejada abaixo</p>
      </div>

      <div className="buttons-column">
        <BigButton 
          icon={CalendarCheck}
          title="Consulta Agendada"
          subtitle="Para pacientes com horário já marcado"
          variant="primary"
          onClick={() => handleAction('AGENDADA')}
        />
        
        <BigButton 
          icon={Users}
          title="Consulta Espontânea"
          subtitle="Clínico geral ou acolhimento sem agendamento"
          variant="primary"
          onClick={() => handleAction('ESPONTANEA')}
        />
        
        <BigButton 
          icon={Syringe}
          title="Vacinação / Procedimentos"
          subtitle="Vacinas, curativos e retirada de exames"
          variant="secondary"
          onClick={() => handleAction('VACINACAO')}
        />
      </div>
    </motion.div>
  );
};

export default Home;
