import React, { useCallback, useEffect, useState } from 'react';
import Lenis from 'lenis';
import Cursor from './Cursor.jsx';
import Header from './Header.jsx';
import Mark from './Mark.jsx';
import PaintingCanvas from './PaintingCanvas.jsx';
import Preloader from './Preloader.jsx';
import ContactScene from './scenes/ContactScene.jsx';
import NumberScene from './scenes/NumberScene.jsx';
import ServicesScene from './scenes/ServicesScene.jsx';
import StatementScene from './scenes/StatementScene.jsx';
import TitleScene from './scenes/TitleScene.jsx';
import WorkScene from './scenes/WorkScene.jsx';
import { DISCIPLINES, NAME, ROLE } from './content.js';
import { useMediaQuery, useReducedMotion } from './hooks.js';
import { easeOut, progress, stage, STAGE_VH, T, useSvu } from './scroll.js';
import './studio.css';

// Darkens the painting once we're through the window
const Dim = () => {
  const v = useSvu(T.dim[0] - 0.1, T.dim[1] + 0.1);
  return <div className="st-dim" style={{ opacity: progress(v, T.dim[0], T.dim[1]) }} />;
};

// Columns that rise to close the painting off before the work stage
const Bars = ({ cols }) => {
  const v = useSvu(T.bars - 0.2, T.bars + 0.8);
  return (
    <div className="st-bars" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }, (_, i) => {
        const a = T.bars + 0.025 * i;
        return <span key={i} style={{ transform: `translate3d(0, ${100 * (1 - easeOut(progress(v, a, a + 0.3)))}%, 0)` }} />;
      })}
    </div>
  );
};

const BottomBar = ({ entered }) => (
  <div className={`st-bottom ${entered ? 'is-entered' : ''}`}>
    <a className="st-mark-link st-in" style={{ transitionDelay: '120ms' }} href="#top" aria-label="Back to top" onClick={(e) => { e.preventDefault(); window.__lenis ? window.__lenis.scrollTo(0, { duration: 2.4 }) : window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      <Mark />
    </a>
    <div className="st-bottom-list">
      {DISCIPLINES.map((d, i) => (
        <span key={d} className="st-in" style={{ transitionDelay: `${220 + i * 90}ms` }}>
          {d}
        </span>
      ))}
    </div>
    <div className="st-bottom-status st-in" style={{ transitionDelay: '620ms' }}>
      <i /> Open to work
    </div>
  </div>
);

const Studio = () => {
  const [entered, setEntered] = useState(false);
  const reduced = useReducedMotion();
  const narrow = useMediaQuery('(max-width: 640px)');
  const reveal = useCallback(() => setEntered(true), []);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const update = () => stage.set(window.scrollY / window.innerHeight);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    let lenis;
    let raf;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.4 });
      window.__lenis = lenis;
      const loop = (t) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
      lenis?.destroy();
      delete window.__lenis;
    };
  }, [reduced]);

  // Hold the page still until the preloader has lifted
  useEffect(() => {
    const root = document.documentElement;
    if (entered) {
      root.classList.remove('st-locked');
      window.__lenis?.start();
    } else {
      root.classList.add('st-locked');
      window.__lenis?.stop();
    }
    return () => root.classList.remove('st-locked');
  }, [entered, reduced]);

  return (
    <div className="studio" id="top">
      <Preloader onReveal={reveal} reduced={reduced} />
      <Cursor />
      <Header entered={entered} />
      <main>
        <section className="st-stage" style={{ height: `${STAGE_VH}vh` }} aria-label={`${NAME}, ${ROLE.toLowerCase()}`}>
          <div className="st-sticky">
            <div className="st-bg">
              <PaintingCanvas entered={entered} />
            </div>
            <div className="st-topfade" />
            <Dim />
            <Bars cols={narrow ? 6 : 12} />
            <div className={`st-grid ${entered ? 'is-entered' : ''}`} style={{ '--cols': narrow ? 6 : 12 }}>
              <span className="st-grid-line is-top" />
              <span className="st-grid-line is-bottom" />
            </div>
            <div className="st-content">
              <div className="st-scenes">
                <TitleScene entered={entered} reduced={reduced} />
                <StatementScene />
                <ServicesScene />
                <NumberScene reduced={reduced} />
                <WorkScene />
                <ContactScene />
              </div>
              <BottomBar entered={entered} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Studio;
