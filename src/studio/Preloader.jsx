import React, { useEffect, useRef, useState } from 'react';
import { ARCHES, archPath } from './arches.js';
import { PROJECTS } from './content.js';

const MIN_MS = 1700;
const MAX_MS = 6000;
const COLS = 12;

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

const Preloader = ({ onReveal, reduced }) => {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState('loading');
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;

  useEffect(() => {
    if (reduced) {
      revealRef.current();
      setPhase('done');
      return;
    }
    const tasks = [document.fonts?.ready ?? Promise.resolve(), ...PROJECTS.filter((p) => p.image).map((p) => loadImage(p.image))];
    let ready = 0;
    tasks.forEach((t) => t.then(() => ready++, () => ready++));

    const timers = [];
    const start = performance.now();
    let last = start;
    let shown = 0;
    let raf;
    const tick = (now) => {
      // a frame's timestamp can predate `start`
      const elapsed = Math.max(0, now - start);
      const dt = Math.max(0, now - last) / 1000;
      last = now;
      const loaded = elapsed > MAX_MS ? 1 : ready / tasks.length;
      const target = Math.min(loaded, Math.min(1, elapsed / MIN_MS)) * 100;
      // time-based, so a slow device doesn't crawl to 100%
      shown += (target - shown) * (1 - Math.exp(-dt * 9));
      if (target - shown < 0.4) shown = target;
      setPct(Math.round(shown));
      if (shown >= 100) {
        timers.push(setTimeout(() => setPhase('leaving'), 220));
        timers.push(setTimeout(() => revealRef.current(), 520));
        timers.push(setTimeout(() => setPhase('done'), 2000));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [reduced]);

  if (phase === 'done') return null;

  return (
    <div className={`st-loader ${phase === 'leaving' ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="st-loader-cols">
        {Array.from({ length: COLS }, (_, i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>
      <div className="st-loader-grid" />
      <div className="st-loader-inner">
        <svg className="st-loader-arches" viewBox="0 0 120 80">
          {ARCHES.map((a, i) => (
            <path key={i} d={archPath(a, 100, 60, 38)} pathLength="1" style={{ '--i': i }} />
          ))}
        </svg>
        <p className="st-loader-label">
          <b>Portfolio:</b> a body of work, arranged to tell the story of how its maker thinks and builds.
        </p>
        <span className="st-loader-pct">{pct}%</span>
        <div className="st-loader-progress">
          <span style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>
    </div>
  );
};

export default Preloader;
