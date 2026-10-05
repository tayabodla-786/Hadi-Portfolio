import React from 'react';
import Mask from './Mask.jsx';
import { SERVICES } from '../content.js';
import { rise, T, useSvu } from '../scroll.js';

// What I build, cascading down the stage in light italics
const ServicesScene = () => {
  const v = useSvu(2.4, 4.2);
  const { in: start, out } = T.services;
  const hidden = v < start - 0.05 || v > out[1] + 0.25;

  return (
    <div className="st-layer st-center" style={{ visibility: hidden ? 'hidden' : 'visible' }} aria-hidden={hidden}>
      <div className="st-services">
        <Mask y={rise(v, start - 0.1, start + 0.3, out[0], out[1])} className="st-kicker">
          (What I build)
        </Mask>
        {SERVICES.map((s, i) => {
          const a = start + i * 0.1;
          return (
            <Mask key={s} y={rise(v, a, a + 0.4, out[0] + i * 0.03, out[1] + i * 0.03)} className="st-service" style={{ '--i': i }}>
              {s}
            </Mask>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesScene;
