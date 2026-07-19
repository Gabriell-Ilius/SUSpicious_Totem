import React from 'react';
import { motion } from 'framer-motion';

const BigButton = ({ icon: Icon, title, subtitle, variant = 'primary', onClick }) => {
  return (
    <motion.button 
      className={`big-button ${variant}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
    >
      {Icon && (
        <div className="icon-wrapper">
          <Icon size={32} />
        </div>
      )}
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ fontSize: '28px', lineHeight: '1.2' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '16px', fontWeight: 'normal', opacity: 0.9, marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default BigButton;
