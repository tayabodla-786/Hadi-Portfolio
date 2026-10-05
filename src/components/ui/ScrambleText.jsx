import React, { useEffect, useRef, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

// Decodes its text from random glyphs the first time it scrolls into view
const ScrambleText = ({ text, as = 'span', className = '', duration = 900, ...rest }) => {
  const Tag = as;
  const ref = useRef(null);
  const [output, setOutput] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf;
    let started = false;

    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const revealed = Math.floor(t * text.length);
        let next = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (i < revealed || ch === ' ') next += ch;
          else next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setOutput(next);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration]);

  return (
    <Tag ref={ref} className={className} aria-label={text} {...rest}>
      <span aria-hidden="true">{output}</span>
    </Tag>
  );
};

export default ScrambleText;
