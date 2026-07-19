import React from 'react';
import { Delete } from 'lucide-react';

const NumPad = ({ onKeyPress, onDelete, onClear }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="numpad">
      {keys.map((key) => (
        <button
          key={key}
          className="numpad-btn"
          onClick={() => onKeyPress(key)}
        >
          {key}
        </button>
      ))}
      <button className="numpad-btn action" onClick={onClear}>
        C
      </button>
      <button className="numpad-btn" onClick={() => onKeyPress('0')}>
        0
      </button>
      <button className="numpad-btn action" onClick={onDelete}>
        <Delete size={32} style={{ margin: '0 auto' }} />
      </button>
    </div>
  );
};

export default NumPad;
