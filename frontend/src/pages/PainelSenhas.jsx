import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PainelSenhas = () => {
  // Mock data for Marco 2
  const [senhas, setSenhas] = useState([
    { id: 1, codigo: 'AGE-042', guiche: 'Guichê 03' },
    { id: 2, codigo: 'ESP-102', guiche: 'Consultório 01' },
    { id: 3, codigo: 'VAC-015', guiche: 'Sala de Vacina' },
    { id: 4, codigo: 'ESP-101', guiche: 'Consultório 02' },
  ]);

  const [ultimaChamada, setUltimaChamada] = useState(senhas[0]);
  const historico = senhas.slice(1, 4);

  useEffect(() => {
    // Simula uma nova chamada a cada 10 segundos
    const timer = setInterval(() => {
      setSenhas(prev => {
        const newId = prev.length + 1;
        const newSenha = { id: newId, codigo: `AGE-0${42 + newId}`, guiche: `Guichê 0${(newId % 4) + 1}` };
        const newState = [newSenha, ...prev].slice(0, 4);
        setUltimaChamada(newState[0]);
        return newState;
      });
      
      // Toca um som de notificação (simulado)
      // const audio = new Audio('/notificacao.mp3');
      // audio.play();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000' }}>
      {/* Lado Esquerdo: Última Senha (Gigante) */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '40px', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--sus-blue)', color: 'white' }}>
        <h2 style={{ fontSize: '40px', marginBottom: '20px', opacity: 0.9 }}>SENHA ATUAL</h2>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={ultimaChamada.id}
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ textAlign: 'center', width: '100%' }}
          >
            <div style={{ fontSize: '180px', fontWeight: '900', lineHeight: 1, letterSpacing: '-4px', margin: '20px 0' }}>
              {ultimaChamada.codigo}
            </div>
            <div style={{ fontSize: '60px', fontWeight: 'bold', color: 'var(--sus-yellow)', marginTop: '40px' }}>
              {ultimaChamada.guiche}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Lado Direito: Histórico */}
      <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '40px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '32px', color: 'var(--sus-blue)', marginBottom: '40px', borderBottom: '2px solid var(--bg-primary)', paddingBottom: '20px' }}>
          Últimas Chamadas
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <AnimatePresence>
            {historico.map((senha) => (
              <motion.div 
                key={senha.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}
              >
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{senha.codigo}</div>
                <div style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>{senha.guiche}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PainelSenhas;
