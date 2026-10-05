import React, { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [data-cursor]';

// A blend-mode dot that swells over anything clickable and can carry a label.
// The glow lives in its own fixed layer: blending on a child of a fixed element
// would only blend inside that element's stacking context.
const Cursor = () => {
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const layers = [dotRef.current, glowRef.current];
    const label = labelRef.current;
    const set = (cls, on) => layers.forEach((l) => l.classList.toggle(cls, on));
    document.documentElement.classList.add('st-has-cursor');

    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    let text = '';
    const onMove = (e) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      set('is-visible', true);
      const el = e.target.closest?.(INTERACTIVE);
      set('is-hover', !!el);
      const next = el?.closest('[data-cursor]')?.dataset.cursor || '';
      if (next !== text) {
        text = next;
        label.textContent = text;
        set('has-label', !!text);
      }
    };
    const onLeave = () => set('is-visible', false);
    const onDown = () => set('is-down', true);
    const onUp = () => set('is-down', false);

    let raf;
    const loop = () => {
      pos.x += (pos.tx - pos.x) * 0.3;
      pos.y += (pos.ty - pos.y) * 0.3;
      const t = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      layers.forEach((l) => (l.style.transform = t));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.classList.remove('st-has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="st-cursor st-cursor-glow-layer" aria-hidden="true">
        <span className="st-cursor-glow" />
      </div>
      <div ref={dotRef} className="st-cursor st-cursor-dot-layer" aria-hidden="true">
        <span className="st-cursor-dot" />
        <span ref={labelRef} className="st-cursor-label" />
      </div>
    </>
  );
};

export default Cursor;
