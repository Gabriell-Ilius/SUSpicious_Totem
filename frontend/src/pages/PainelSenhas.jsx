import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import filaService from '../services/filaService';

const PainelSenhas = () => {
  const [ultimaChamada, setUltimaChamada] = useState(null);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const fetchFila = async () => {
      try {
        const data = await filaService.consultarFilas();
        
        if (data.ultimas_chamadas && data.ultimas_chamadas.length > 0) {
          setUltimaChamada(data.ultimas_chamadas[0]);
          setHistorico(data.ultimas_chamadas.slice(1, 4));
        } else {
          setUltimaChamada(null);
          setHistorico([]);
        }
      } catch (error) {
        console.error("Erro ao buscar fila", error);
      }
    };

    fetchFila(); // call immediately on mount
    const timer = setInterval(fetchFila, 5000); // pool every 5s

    return () => clearInterval(timer);
  }, []);

  if (!ultimaChamada) {
    return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '32px' }}>
        Nenhuma senha chamada ainda.
      </div>
    );
  }

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
              Consultório 01
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
                <div style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>Consultório 01</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PainelSenhas;
