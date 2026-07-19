import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

const Header = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <header className="app-header">
      <div className="header-logo">
        <Activity size={40} color="var(--sus-blue)" />
        <div>
          <h1 style={{ fontSize: '24px', margin: 0 }}>SUSpicious Totem</h1>
          <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-secondary)' }}>Unidade Básica de Saúde</p>
        </div>
      </div>
      
      <div className="header-time" style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <Clock size={20} />
          <span>{formatTime(time)}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'normal', textTransform: 'capitalize' }}>
          {formatDate(time)}
        </div>
      </div>
    </header>
  );
};

export default Header;
