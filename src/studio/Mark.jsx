import React from 'react';
import { ARCHES, archPath } from './arches.js';

// Three arched windows: the same triptych the hero opens on
const Mark = ({ className = '' }) => (
  <svg viewBox="0 0 88 60" fill="currentColor" className={`st-mark ${className}`} aria-hidden="true">
    {ARCHES.map((a, i) => (
      <path key={i} d={archPath(a, 100, 44, 30)} style={{ '--i': i }} />
    ))}
  </svg>
);

export default Mark;
