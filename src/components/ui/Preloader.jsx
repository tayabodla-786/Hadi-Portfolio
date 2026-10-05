import React, { useEffect, useState } from 'react';
import { startIntro } from '../experience/experienceState.js';

const DURATION = 1700;
const LINES = ['BOOTING RENDER CORE', 'SAMPLING PARTICLE FIELD', 'LINKING PROJECT ARCHIVE', 'SIGNAL ACQUIRED'];

const Preloader = () => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 200 : DURATION;
    const start = performance.now();
    let raf;
    let exitTimer;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(Math.round((1 - Math.pow(1 - t, 2)) * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Wait for the display font so the particle name is ready to assemble
        const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
        fonts.then(() => {
          setDone(true);
          startIntro();
          exitTimer = setTimeout(() => setGone(true), 900);
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
    };
  }, []);

  if (gone) return null;

  const line = LINES[Math.min(LINES.length - 1, Math.floor((progress / 100) * LINES.length))];

  return (
    <div className={`preloader ${done ? 'preloader--done' : ''}`} role="status" aria-live="polite">
      <div className="preloader__inner">
        <span className="glitch preloader__count" data-text={String(progress).padStart(3, '0')}>
          {String(progress).padStart(3, '0')}
        </span>
        <div className="preloader__bar">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <p className="preloader__line">&gt; {line}</p>
      </div>
    </div>
  );
};

export default Preloader;
