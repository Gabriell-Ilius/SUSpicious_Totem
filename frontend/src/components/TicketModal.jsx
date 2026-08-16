import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Check, QrCode, ExternalLink, Tv } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SUB_PRIORITIES = [
  { id: '80+', label: '80+ Anos (Prioridade Especial)' },
  { id: 'PCD', label: 'Pessoa com Deficiência (PCD)' },
  { id: 'Gestante', label: 'Gestante / Lactante' },
  { id: 'TEA', label: 'Transtorno do Espectro Autista (TEA)' },
  { id: 'Idoso', label: 'Idoso (60+ Anos)' },
];

const TicketModal = ({ service, cpf, onClose, onConfirm }) => {
  const [priority, setPriority] = useState(0); // 0: Normal, 1: Preferencial
  const [subPriority, setSubPriority] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);

  const handleEmitTicket = async () => {
    setLoading(true);
    try {
      // Passa service.category ('ESPONTANEA', 'VACINACAO', etc), prioridade, cpf e sub-prioridade
      const category = service.category || service.id.toUpperCase();
      const ticket = await onConfirm(category, priority, cpf, subPriority);
      setGeneratedTicket(ticket);
    } catch (error) {
      console.error('Erro ao emitir senha:', error);
      alert('Erro ao emitir senha. Verifique o servidor e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: '#0B192C',
          border: '2px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          color: '#F8FAFC',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
              {service.title}
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              {cpf ? `CPF Identificado: ${cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}` : 'Atendimento sem CPF'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={24} />
          </button>
        </div>

        {!generatedTicket ? (
          <div>
            <p style={{ fontSize: '1rem', color: '#CBD5E1', marginBottom: '16px' }}>
              Selecione o tipo de atendimento para a emissão da senha:
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                className={`priority-btn ${priority === 0 ? 'active-normal' : ''}`}
                onClick={() => { setPriority(0); setSubPriority(null); }}
              >
                <span>Atendimento Normal</span>
              </button>

              <button
                className={`priority-btn ${priority === 1 ? 'active-preferential' : ''}`}
                onClick={() => setPriority(1)}
              >
                <span>Atendimento Preferencial</span>
              </button>
            </div>

            {priority === 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="sub-priority-section"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '20px'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', display: 'block', marginBottom: '8px' }}>
                  Identificação do Atendimento Prioritário (Lei 14.626/23):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {SUB_PRIORITIES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubPriority(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: subPriority === item.id ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: subPriority === item.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: subPriority === item.id ? '#EF4444' : '#94A3B8',
                        fontWeight: subPriority === item.id ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="action-btn-secondary" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
                Voltar
              </button>
              <button
                className="action-btn-primary"
                onClick={handleEmitTicket}
                disabled={loading}
                style={{ flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Printer size={20} />
                <span>{loading ? 'Imprimindo...' : 'Confirmar e Emitir Senha'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', color: '#34D399', marginBottom: '8px' }}>
              <Check size={36} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: '#34D399', margin: '0 0 6px' }}>Senha Emitida com Sucesso!</h3>
            
            <div className="ticket-number-display" style={{ fontSize: '3.2rem', fontWeight: 900, color: '#38BDF8', margin: '8px 0', letterSpacing: '1px' }}>
              {generatedTicket.codigo}
            </div>

            {/* Aviso em Destaque: Aguarde na TV */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '2px solid #38BDF8',
              borderRadius: '14px',
              padding: '14px 18px',
              margin: '12px 0 16px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <Tv size={32} color="#FFD100" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '1rem', color: '#FFD100', display: 'block', textTransform: 'uppercase' }}>
                  Aguarde no Painel da TV!
                </strong>
                <span style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>
                  Sua senha será chamada na TV com o número da sua sala ou consultório de atendimento.
                </span>
              </div>
            </div>

            {/* QR Code na tela para a Triagem Digital / Celular */}
            <div style={{
              background: '#071324', border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px', padding: '20px', margin: '16px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={22} /> Pré-Triagem Opcional (Escaneie com a câmera do celular):
              </span>
              <div style={{ background: '#FFF', padding: '16px', borderRadius: '16px', border: '2px solid #CBD5E1', display: 'inline-block', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)' }}>
                <QRCodeSVG
                  value={`http://${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '192.168.15.34' : window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/triagem/${generatedTicket.codigo}`}
                  size={220}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <a
                href={`/triagem/${generatedTicket.codigo}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.9rem', color: '#38BDF8', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <span>Ou clique aqui para abrir a pré-triagem no navegador</span>
                <ExternalLink size={16} />
              </a>
            </div>

            <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '8px 0' }}>
              Retire o cupom na impressora abaixo.
            </p>
            <button className="action-btn-primary" onClick={onClose} style={{ marginTop: '12px', width: '100%' }}>
              Concluir
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TicketModal;
