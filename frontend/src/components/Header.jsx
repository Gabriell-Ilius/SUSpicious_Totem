import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

/**
 * Componente de Cabeçalho do Totem (Header)
 * Exibe:
 * - Identificação da Unidade Básica de Saúde (UBS)
 * - Relógio digital atualizado a cada segundo
 * - Badge dinâmico de Conexão/Sincronização (Online vs Offline-First)
 */
export default function Header() {
  // Estado da hora atual formatada (HH:MM:SS)
  const [timeStr, setTimeStr] = useState('');
  // Estado da conexão com o Backend FastAPI
  const [isOnline, setIsOnline] = useState(true);

  // Efeito 1: Atualiza o relógio a cada 1 segundo
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Efeito 2: Monitora a saúde da API a cada 5 segundos para atualizar o badge
  useEffect(() => {
    const pollHealth = async () => {
      const online = await checkBackendHealth();
      setIsOnline(online);
    };
    pollHealth();
    const interval = setInterval(pollHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="kiosk-header">
      {/* Nome e Identidade Visual da UBS */}
      <div className="ubs-brand">
        <div className="ubs-brand-icon">
          <Activity size={32} color="#FFFFFF" />
        </div>
        <div>
          <h1 className="ubs-title">UBS Central - SUS</h1>
          <p className="ubs-subtitle">Sistema de Autoatendimento SUSpicious Totem</p>
        </div>
      </div>

      {/* Relógio e Badge de Status de Conexão */}
      <div className="header-status-area">
        {/* Badge de Resiliência Offline */}
        <div className={`sync-badge ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? (
            <>
              <Wifi size={18} />
              <span>Sincronizado (Online)</span>
            </>
          ) : (
            <>
              <WifiOff size={18} />
              <span>Modo Resiliente (Offline)</span>
            </>
          )}
        </div>

        {/* Relógio Digital */}
        <div className="clock-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#60A5FA" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
