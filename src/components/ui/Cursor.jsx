import React, { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [role="button"], [data-cursor]';

// Trailing ring + dot; hidden on touch devices via CSS
const Cursor = () => {
  const ring = useRef(null);
  const dot = useRef(null);

  useEffect(() => {
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const trail = { ...pos };
    let hovering = false;
    let pressed = false;
    let raf;

    const move = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      hovering = Boolean(e.target.closest?.(INTERACTIVE));
    };
    const down = () => {
      pressed = true;
    };
    const up = () => {
      pressed = false;
    };

    const loop = () => {
      trail.x += (pos.x - trail.x) * 0.18;
      trail.y += (pos.y - trail.y) * 0.18;
      const scale = (hovering ? 1.9 : 1) * (pressed ? 0.75 : 1);
      if (ring.current) {
        ring.current.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        ring.current.classList.toggle('cursor-ring--hover', hovering);
      }
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
};

export default Cursor;
