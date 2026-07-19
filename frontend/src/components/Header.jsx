import React, { useState, useEffect } from 'react';
import { Activity, Clock, WifiOff } from 'lucide-react';

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isOffline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', backgroundColor: '#e53e3e', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontWeight: 'bold' }}>
            <WifiOff size={24} /> Offline (Sincronização Pausada)
          </div>
        )}
        <div className="header-time" style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <Clock size={20} />
            <span>{formatTime(time)}</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'normal', textTransform: 'capitalize' }}>
            {formatDate(time)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
