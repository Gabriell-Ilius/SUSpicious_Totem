import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Componente do Card de Serviço Touch Screen
 * Botões gigantes com áreas de toque generosas para fácil interação no Totem.
 * 
 * @param {Object} props
 * @param {string} props.title Título do Serviço (ex: Consulta Agendada)
 * @param {string} props.description Breve descrição orientando o cidadão
 * @param {string} props.tag Rótulo identificador (ex: AGENDADOS)
 * @param {React.ReactNode} props.icon Ícone Lucide correspondente
 * @param {string} props.iconBgClass Classe CSS para a cor de fundo do ícone
 * @param {Function} props.onClick Função executada ao tocar no card
 */
export default function ServiceCard({
  title,
  description,
  tag,
  icon,
  iconBgClass = 'icon-blue',
  onClick,
}) {
  return (
    <div className="service-card" onClick={onClick}>
      <div className="service-card-header">
        <div className={`service-icon-box ${iconBgClass}`}>
          {icon}
        </div>
        <span className="service-tag">{tag}</span>
      </div>

      <div className="service-card-body">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="service-card-footer">
        <span>Toque para selecionar</span>
        <ChevronRight size={20} />
      </div>
    </div>
  );
}
