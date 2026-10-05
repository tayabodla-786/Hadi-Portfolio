import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../content.js';
import { hasWebGL } from '../hooks.js';
import { progress, scrollToSvu, stage, T, useStage } from '../scroll.js';

const loadCanvas = () => import('../work/WorkCanvas.jsx');
const WorkCanvas = lazy(loadCanvas);

const COUNT = PROJECTS.length;
const pad = (n) => String(n).padStart(2, '0');
const svuFor = (i) => T.work[0] + (i / Math.max(1, COUNT - 1)) * (T.work[1] - T.work[0]);

// Which slice of the timeline the work stage is in: hidden, mounted (preloading) or visible
const phaseOf = (v) => {
  if (v < T.bars - 0.6 || v > T.contact + 0.3) return 0;
  // shown once the bars have mostly closed over the painting
  if (v < T.bars + 0.4 || v > T.contact - 0.05) return 1;
  return 2;
};
const indexOf = (v) => Math.round(progress(v, T.work[0], T.work[1]) * (COUNT - 1));

const scrubBy = (px) => {
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(lenis.scroll + px, { immediate: true });
  else window.scrollBy(0, px);
};

const Fallback = () => (
  <div className="st-work-grid">
    {PROJECTS.map((p) => (
      <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer" className="st-work-card">
        {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span>{p.name}</span>}
      </a>
    ))}
  </div>
);

const WorkScene = () => {
  const phase = useStage(phaseOf);
  const index = useStage(indexOf);
  const [webgl] = useState(hasWebGL);
  const [hovered, setHovered] = useState(null);
  const drag = useRef(null);
  const project = PROJECTS[index];
  const visible = phase === 2;

  // fetch three.js while the visitor is still reading the opening scenes
  useEffect(() => {
    if (!webgl) return;
    const id = setTimeout(loadCanvas, 4000);
    return () => clearTimeout(id);
  }, [webgl]);

  const onSelect = useCallback(
    (i) => {
      if (drag.current?.moved) return;
      if (i === indexOf(stage.get())) window.open(PROJECTS[i].href, '_blank', 'noopener,noreferrer');
      else scrollToSvu(svuFor(i), 1.4);
    },
    []
  );

  // Window listeners rather than pointer capture, which would steal the canvas's click events
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const d = { x: e.clientX, moved: false };
    drag.current = d;
    const perProject = ((T.work[1] - T.work[0]) / Math.max(1, COUNT - 1)) * window.innerHeight;
    const move = (ev) => {
      const dx = ev.clientX - d.x;
      if (!d.moved && Math.abs(dx) < 6) return;
      d.moved = true;
      d.x = ev.clientX;
      // one project per ~280px of drag
      scrubBy((-dx * perProject) / 280);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      // let the click that follows this pointerup still see `moved`
      setTimeout(() => {
        if (drag.current === d) drag.current = null;
      }, 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const cursor = hovered === null ? 'Drag' : hovered === index ? 'Open ↗' : 'View';

  return (
    <div
      className="st-layer st-work"
      style={{ opacity: visible ? 1 : 0, visibility: phase ? 'visible' : 'hidden', pointerEvents: visible ? 'auto' : 'none' }}
      aria-hidden={!visible}
    >
      <h2 className="sr-only">Selected work</h2>
      {phase > 0 && webgl && (
        <div
          className="st-work-canvas"
          data-cursor={cursor}
          onPointerDown={onPointerDown}
        >
          <Suspense fallback={null}>
            <WorkCanvas projects={PROJECTS} hovered={hovered} onHover={setHovered} onSelect={onSelect} />
          </Suspense>
        </div>
      )}
      {!webgl && <Fallback />}

      <div className="st-work-head">
        <span>(Selected work)</span>
        <span className="st-work-hint">Scroll or drag</span>
      </div>

      <div className="st-work-info">
        <div className="st-work-count">
          <span className="st-mask">
            <span key={index} className="st-mask-inner st-roll-in">
              {pad(index + 1)}
            </span>
          </span>
          <span className="st-work-total">/ {pad(COUNT)}</span>
        </div>
        <h3 className="st-work-name">
          <span className="st-mask">
            <span key={index} className="st-mask-inner st-roll-in">
              {project.name}
            </span>
          </span>
        </h3>
        <p key={`t${index}`} className="st-work-tagline st-fade-in">
          {project.tagline}
        </p>
        <p key={`d${index}`} className="st-work-desc st-fade-in">
          {project.description}
        </p>
        <div className="st-work-actions">
          <ul key={`f${index}`} className="st-work-tags st-fade-in">
            {project.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <a className="st-link" href={project.href} target="_blank" rel="noopener noreferrer" tabIndex={visible ? 0 : -1}>
            {project.status === 'soon' ? 'Launching soon' : 'Visit live site'} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <nav className="st-work-rail" aria-label="Projects">
        {PROJECTS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={i === index ? 'is-active' : ''}
            aria-label={`${p.name} (${i + 1} of ${COUNT})`}
            aria-current={i === index}
            tabIndex={visible ? 0 : -1}
            onClick={() => scrollToSvu(svuFor(i), 1.4)}
          >
            <span />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default WorkScene;
