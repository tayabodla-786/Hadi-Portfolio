import React, { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';
import Mark from '../Mark.jsx';
import { EMAIL, LOCATION, NAME, ROLE } from '../content.js';

const DEG = Math.PI / 180;
// cobe's rotation that brings a lat/long to the centre of the disc
const TARGET_PHI = Math.PI - (LOCATION.lon * DEG - Math.PI / 2);
const TARGET_THETA = LOCATION.lat * DEG;

// A dotted globe that spins round to the pin, then opens a little calling card
const Globe = ({ active, className = '' }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const measure = () => Math.max(120, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));

    let size = measure();
    canvas.style.width = canvas.style.height = `${size}px`;
    const marker = (s) => [{ location: [LOCATION.lat, LOCATION.lon], size: s }];
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size,
      height: size,
      phi: TARGET_PHI - 2.4,
      theta: TARGET_THETA * 0.4,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 5.5,
      mapBaseBrightness: 0.04,
      baseColor: [0.3, 0.29, 0.32],
      markerColor: [0.85, 0, 1],
      glowColor: [0.36, 0.18, 0.44],
      markers: marker(0.06),
      opacity: 0.95,
    });

    const ro = new ResizeObserver(() => {
      size = measure();
      canvas.style.width = canvas.style.height = `${size}px`;
      globe.update({ width: size, height: size });
    });
    ro.observe(wrap);

    let phi = TARGET_PHI - 2.4;
    let theta = TARGET_THETA * 0.4;
    let dragX = 0;
    let dragY = 0;
    let pointer = null;
    let shown = false;

    const onDown = (e) => {
      pointer = { x: e.clientX, y: e.clientY, bx: dragX, by: dragY };
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!pointer) return;
      dragX = pointer.bx + (e.clientX - pointer.x) * 0.006;
      dragY = Math.max(-0.6, Math.min(0.6, pointer.by + (e.clientY - pointer.y) * 0.004));
    };
    const onUp = () => {
      pointer = null;
      canvas.style.cursor = '';
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    let raf;
    const t0 = performance.now();
    let last = t0;
    const loop = (now) => {
      // time-based easing, so slow GPUs still settle on the pin
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt * 2.8);
      // released drags spring back so the pin returns to centre
      if (!pointer) {
        const decay = Math.exp(-dt * 3.6);
        dragX *= decay;
        dragY *= decay;
      }
      phi += (TARGET_PHI + dragX - phi) * k;
      theta += (TARGET_THETA + dragY - theta) * k;
      const t = (now - t0) / 1000;
      globe.update({ phi, theta, markers: marker(0.055 + 0.015 * Math.sin(t * 3)) });

      const near = Math.abs(TARGET_PHI - phi) < 0.05 && Math.abs(TARGET_THETA - theta) < 0.05 && !pointer;
      if (near !== shown) {
        shown = near;
        setSettled(near);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      globe.destroy();
      setSettled(false);
    };
  }, [active]);

  return (
    <div ref={wrapRef} className={`st-globe ${className}`} role="img" aria-label={`A globe of the world with ${LOCATION.label} marked`}>
      <canvas ref={canvasRef} data-cursor="Drag" />
      <div className={`st-globe-card ${settled ? 'is-on' : ''}`}>
        <a href={`mailto:${EMAIL}`} tabIndex={settled ? 0 : -1} data-cursor="Say hi">
          <span className="st-globe-card-art">
            <Mark />
            <span className="st-status">
              <i /> Available
            </span>
          </span>
          <span className="st-globe-card-body">
            <b>{NAME}</b>
            <span>
              {ROLE} · {LOCATION.label}
            </span>
          </span>
        </a>
      </div>
    </div>
  );
};

export default Globe;
