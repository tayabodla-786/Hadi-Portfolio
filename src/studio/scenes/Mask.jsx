import React from 'react';

// A line clipped by its own box, so text can rise into place from below
const Mask = ({ y, className = '', style, children }) => (
  <span className="st-mask">
    <span
      className={`st-mask-inner ${className}`}
      style={{ transform: `translate3d(0, ${y}%, 0)`, opacity: Math.abs(y) > 97 ? 0 : 1, ...style }}
    >
      {children}
    </span>
  </span>
);

export default Mask;
