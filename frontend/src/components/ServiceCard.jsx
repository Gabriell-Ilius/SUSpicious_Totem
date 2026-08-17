import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const ServiceCard = ({ title, description, tag, icon: Icon, iconBgClass, onClick }) => {
  return (
    <motion.div
      className="service-card"
      onClick={onClick}
      whileHover={{ scale: 1.025, translateY: -4 }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer' }}
    >
      <div className={`service-icon-wrapper ${iconBgClass || ''}`}>
        {Icon && <Icon size={54} color="#FFF" strokeWidth={2.2} />}
      </div>
      <div className="service-info">
        {tag && <span className="service-tag">{tag}</span>}
        <h3 className="service-title">{title}</h3>
        <p className="service-description">{description}</p>
      </div>
      <div className="service-arrow">
        <ChevronRight size={32} color="#38BDF8" style={{ opacity: 0.8 }} />
      </div>
    </motion.div>
  );
};

export default ServiceCard;
