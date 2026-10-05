import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const bandA = ['Full-stack development', 'React & Three.js', 'Scalable architecture', 'Creative motion'];
const bandB = ['Innovation', 'Precision', 'Trust', 'Collaboration', 'Excellence'];

const Band = ({ words, reverse, className }) => {
  const track = useRef(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const width = el.scrollWidth / 2;
    const tween = gsap.fromTo(el, { x: reverse ? -width : 0 }, { x: reverse ? 0 : -width, duration: 28, ease: 'none', repeat: -1 });
    return () => tween.kill();
  }, [reverse]);

  const loop = [...words, ...words, ...words, ...words];
  return (
    <div className={`marquee-band ${className}`}>
      <div ref={track} className="flex whitespace-nowrap">
        {loop.map((w, i) => (
          <span key={i} className="flex items-center gap-10 px-10">
            <span>{w}</span>
            <span className="marquee-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// Two ribbons crossing in 3D space
const MarqueeQuote = () => (
  <section className="relative py-32 overflow-hidden select-none hud-font [perspective:1000px]" aria-hidden="true">
    <Band words={bandA} className="marquee-band--a" />
    <Band words={bandB} reverse className="marquee-band--b" />
  </section>
);

export default MarqueeQuote;
