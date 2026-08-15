import React from 'react';
import { motion } from 'framer-motion';

const ServiceCard = ({ title, description, tag, icon: Icon, iconBgClass, onClick }) => {
  return (
    <motion.div
      className="service-card"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      style={{ cursor: 'pointer' }}
    >
      <div className={`service-icon-wrapper ${iconBgClass || ''}`}>
        {Icon && <Icon size={32} color="#FFF" />}
      </div>
      <div className="service-info">
        {tag && <span className="service-tag">{tag}</span>}
        <h3 className="service-title">{title}</h3>
        <p className="service-description">{description}</p>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
