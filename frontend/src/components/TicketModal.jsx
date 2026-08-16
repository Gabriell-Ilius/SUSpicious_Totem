import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Check, AlertCircle, Sparkles, Heart, Baby, Accessibility, ShieldCheck, Printer, QrCode, ExternalLink } from 'lucide-react';

const TicketModal = ({ service, cpf, onClose, onConfirm }) => {
  const [priority, setPriority] = useState(0); // 0 = Normal, 1 = Preferencial
  const [subPriority, setSubPriority] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const subPriorityOptions = [
    { id: '80+', label: 'Idoso 80+ anos (Super Prioridade)', icon: Sparkles, color: '#F59E0B' },
    { id: 'Idoso 60+', label: 'Idoso 60 a 79 anos', icon: ShieldCheck, color: '#3B82F6' },
    { id: 'Gestante/Lactante', label: 'Gestante ou Lactante', icon: Baby, color: '#EC4899' },
    { id: 'PCD', label: 'Pessoa com Deficiência (PCD)', icon: Accessibility, color: '#10B981' },
    { id: 'TEA', label: 'Autismo / TEA / Doença Rara', icon: Heart, color: '#8B5CF6' },
  ];

  const handleEmitTicket = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const ticket = await onConfirm(service.category, priority, cpf, subPriority);
      setGeneratedTicket(ticket);
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao emitir comprovante na impressora. Procure a recepção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal-content-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {service.icon && <service.icon size={26} color="#0056A8" />}
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>
              {service.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={24} />
          </button>
        </div>

        {!generatedTicket ? (
          <div>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
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
                style={{ marginBottom: '20px', padding: '14px', background: '#071324', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>
                  Identificação do Atendimento Preferencial (Opcional):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {subPriorityOptions.map((opt) => {
                    const isSelected = subPriority === opt.id;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSubPriority(isSelected ? null : opt.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '8px',
                          border: isSelected ? `2px solid ${opt.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isSelected ? `${opt.color}25` : '#0F243E',
                          color: '#F8FAFC', textAlign: 'left', cursor: 'pointer'
                        }}
                      >
                        <IconComponent size={18} color={opt.color} />
                        <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? '700' : '500' }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#DC2626', marginBottom: '16px' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '0.9rem' }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn-secondary" onClick={onClose} disabled={loading}>
                Voltar
              </button>
              <button
                className="action-btn-primary"
                onClick={handleEmitTicket}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
            
            <div className="ticket-number-display" style={{ fontSize: '3rem', fontWeight: 900, color: '#38BDF8', margin: '8px 0', letterSpacing: '1px' }}>
              {generatedTicket.codigo}
            </div>

            {generatedTicket.setor_destino && (
              <div style={{ background: '#071324', border: '1px solid #FFD100', borderRadius: '10px', padding: '10px 14px', color: '#FFD100', fontWeight: 'bold', margin: '8px 0', fontSize: '1rem' }}>
                DIRIJA-SE AO: {generatedTicket.setor_destino.toUpperCase()}
              </div>
            )}

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
              Retire o cupom na impressora e aguarde a chamada no painel.
            </p>
            <button className="action-btn-primary" onClick={onClose} style={{ marginTop: '12px' }}>
              Concluir
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TicketModal;
