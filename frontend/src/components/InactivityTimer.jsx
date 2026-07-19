import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const InactivityTimer = ({ children, timeoutMs = 60000 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Não aplica timer na tela Home ou no Painel
    if (location.pathname === '/' || location.pathname === '/painel') {
      return;
    }

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        navigate('/');
      }, timeoutMs);
    };

    // Listeners para qualquer interação
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);
    
    // Inicia o timer logo que o componente monta
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [navigate, location.pathname, timeoutMs]);

  return <>{children}</>;
};

export default InactivityTimer;
