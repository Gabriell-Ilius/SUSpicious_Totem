import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BigButton from '../components/BigButton';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ justifyContent: 'center', height: '100%', gap: '40px' }}>
      <AlertTriangle size={100} color="var(--color-error)" />
      
      <div className="page-title">
        <h2 style={{ color: 'var(--color-error)', fontSize: '36px' }}>Sistema Temporariamente Indisponível</h2>
        <p className="page-subtitle" style={{ fontSize: '24px', maxWidth: '600px', margin: '20px auto' }}>
          O totem de autoatendimento está fora do ar. Por favor, dirija-se à recepção principal para retirar sua senha manualmente.
        </p>
      </div>

      <BigButton 
        title="Tentar Novamente"
        variant="secondary"
        onClick={() => navigate('/')}
      />
    </div>
  );
};

export default ErrorPage;
