import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import Lenis from 'lenis';
import * as THREE from 'three';
import { Icon } from '@iconify/react';
import AscentScene from './AscentScene.jsx';
import { formatAltitude, STAGES, TIMES } from './stages.js';
import './ascent.css';
import { aboutData, contactInfo, heroData, projectsData, servicesData, socialLinks } from '../data/portfolioData.js';

const { clamp, lerp, smoothstep } = THREE.MathUtils;
const SPEEDS = [0.5, 1, 2, 4];
const STACK = ['JavaScript', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Three.js', 'Tailwind', 'Stripe', 'Vite', 'Vercel', 'Docker', 'Git'];

const scrollToY = (y, opts) => {
  if (window.__lenis) window.__lenis.scrollTo(y, opts);
  else window.scrollTo({ top: y, behavior: 'smooth' });
};
const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) scrollToY(el.offsetTop + Math.max(0, (el.offsetHeight - window.innerHeight) / 2), { duration: 2.2 });
};

/* ---------- Stage cards ---------- */

const StageLabel = ({ stage }) => (
  <div className="ascent-stage-label">
    <span>Stage {stage.numeral}</span>
    <span>{formatAltitude(stage.altitude)}</span>
  </div>
);

const FieldData = ({ rows }) => (
  <dl className="ascent-field">
    <p>Field data</p>
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v}</dd>
      </div>
    ))}
  </dl>
);

const HeroStage = ({ onPlay }) => (
  <div className="ascent-hero">
    <p className="ascent-kicker">An interactive portfolio · Nine stages · 8,848 m</p>
    <h1 className="ascent-display">The Ascent</h1>
    <p className="ascent-lede">
      <strong>Tayyab Imran</strong>, full-stack developer. A climb from first commit to the summit, with one camp for every
      product shipped along the way.
    </p>
    <div className="flex flex-wrap gap-3 pt-2">
      <button type="button" className="ascent-btn ascent-btn--solid" onClick={() => scrollToId('toolkit')}>
        Begin the climb ↓
      </button>
      <button type="button" className="ascent-btn" onClick={onPlay}>
        <Icon icon="lucide:play" className="size-3.5" /> Experience
      </button>
      <a className="ascent-btn" href={heroData.resumeLink} download="Tayyab_Imran_Resume.txt">
        Download CV
      </a>
    </div>
    <p className="ascent-hint">Scroll to climb · Keys 1–5 change the light · F for free flight</p>
  </div>
);

const ServicesStage = ({ stage }) => (
  <article className="ascent-card">
    <StageLabel stage={stage} />
    <h2 className="ascent-title">The Toolkit</h2>
    <p className="ascent-body">Five disciplines packed for the climb. Each one carried from idea to production.</p>
    <ol className="ascent-list">
      {servicesData.map((s, i) => (
        <li key={s.id}>
          <span className="ascent-num">0{i + 1}</span>
          <div>
            <h3>{s.title}</h3>
            <p>{s.items.map((it) => it.title).join(' · ')}</p>
          </div>
        </li>
      ))}
    </ol>
  </article>
);

const AboutStage = ({ stage }) => (
  <article className="ascent-card">
    <StageLabel stage={stage} />
    <h2 className="ascent-title">The Climber</h2>
    <p className="ascent-body">{aboutData.intro}</p>
    <ul className="ascent-bullets">
      {aboutData.highlights.map((h) => (
        <li key={h}>{h}</li>
      ))}
    </ul>
    <blockquote className="ascent-quote">“{aboutData.subtitle}.”</blockquote>
  </article>
);

const ProjectStage = ({ stage }) => {
  const p = stage.data;
  return (
    <article className="ascent-card">
      <StageLabel stage={stage} />
      <p className="ascent-kicker !mb-1">{stage.name}</p>
      <h2 className="ascent-title">{p.name}</h2>
      <p className="ascent-sub">{p.tagline}</p>
      <p className="ascent-body">{p.description}</p>
      <FieldData
        rows={[
          ['Stack', p.frameworks.map((f) => f.name).join(', ')],
          ['Status', 'Live'],
          ['Route', new URL(p.href).hostname],
        ]}
      />
      <a className="ascent-btn ascent-btn--solid mt-5" href={p.href} target="_blank" rel="noopener noreferrer">
        Visit the camp ↗
      </a>
    </article>
  );
};

const LedgerStage = ({ stage }) => (
  <article className="ascent-card">
    <StageLabel stage={stage} />
    <h2 className="ascent-title">The Ledger</h2>
    <p className="ascent-body">The numbers behind the climb, and the gear that got me here.</p>
    <div className="ascent-stats">
      {[
        ['04', 'Live products'],
        ['05', 'Disciplines'],
        ['14', 'Tools in the pack'],
      ].map(([v, l]) => (
        <div key={l}>
          <strong>{v}</strong>
          <span>{l}</span>
        </div>
      ))}
    </div>
    <ul className="ascent-chips">
      {STACK.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  </article>
);

const SummitStage = ({ stage }) => (
  <div className="ascent-summit">
    <StageLabel stage={stage} />
    <h2 className="ascent-display">Let’s talk.</h2>
    <p className="ascent-lede whitespace-pre-line">{contactInfo.text}</p>
    <a className="ascent-email" href={`mailto:${contactInfo.email}`}>
      {contactInfo.email}
    </a>
    <div className="flex flex-wrap justify-center gap-3">
      <a className="ascent-btn ascent-btn--solid" href={`mailto:${contactInfo.email}`}>
        Start a project
      </a>
      <a className="ascent-btn" href={`tel:${contactInfo.phone}`}>
        {contactInfo.phone}
      </a>
    </div>
  </div>
);

/* ---------- HUD ---------- */

const Altimeter = ({ activeStage, altitudeRef }) => (
  <nav className="ascent-altimeter" aria-label="Stages">
    <span ref={altitudeRef} className="ascent-altimeter__value">
      {formatAltitude(STAGES[0].altitude)}
    </span>
    <ol>
      {[...STAGES].reverse().map((s) => {
        const i = STAGES.indexOf(s);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => scrollToId(s.id)}
              className={i === activeStage ? 'is-active' : i < activeStage ? 'is-reached' : ''}
              aria-label={`Stage ${s.numeral}: ${s.name}`}
            >
              <span>{s.numeral}</span>
              <i />
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

/* ---------- Page ---------- */

const Ascent = () => {
  const compact = useMemo(() => window.innerWidth < 768, []);
  // ?lite trades effects and resolution for frame rate on weak GPUs
  const lite = useMemo(() => new URLSearchParams(window.location.search).has('lite'), []);
  const lowPower = compact || lite;
  const climbRef = useRef({ target: STAGES[0].t, smooth: STAGES[0].t, orbit: 0, orbitSmooth: 0 });
  const timeRef = useRef({
    target: 0,
    smooth: 0,
    env: { sun: new THREE.Color(), ambient: new THREE.Color(), fog: new THREE.Color(), cloud: new THREE.Color() },
  });
  const altitudeRef = useRef(null);
  const autoPhase = useRef(0);

  const [activeStage, setActiveStage] = useState(0);
  const [timeMode, setTimeMode] = useState('auto');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [freeFlight, setFreeFlight] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ effects: !lowPower, godRays: !lowPower, quality: lite ? 'low' : 'auto' });
  const [dpr, setDpr] = useState(compact ? 1.25 : 1.5);

  // Smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.4, smoothWheel: true, touchMultiplier: 1.6 });
    window.__lenis = lenis;
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // Scroll → position on the trail, altitude and time of day
  useEffect(() => {
    const update = () => {
      const mid = window.innerHeight / 2;
      const centers = STAGES.map((s) => {
        const r = document.getElementById(s.id).getBoundingClientRect();
        return r.top + r.height / 2;
      });
      let s = 0;
      for (let i = 0; i < centers.length; i++) {
        if (mid >= centers[i]) s = i;
        if (i < centers.length - 1 && mid > centers[i] && mid < centers[i + 1]) {
          // Linger at each camp, travel between them
          s = i + smoothstep((mid - centers[i]) / (centers[i + 1] - centers[i]), 0.2, 0.8);
          break;
        }
      }
      const i0 = Math.min(Math.floor(s), STAGES.length - 2);
      const f = s - i0;
      climbRef.current.target = lerp(STAGES[i0].t, STAGES[i0 + 1].t, f);

      // Past the summit, the camera orbits the peak as the Record Book scrolls by
      const summitAbs = centers[centers.length - 1] + window.scrollY;
      const midAbs = window.scrollY + mid;
      const endAbs = document.documentElement.scrollHeight - mid;
      climbRef.current.orbit = clamp((midAbs - summitAbs) / Math.max(1, endAbs - summitAbs), 0, 1);

      if (altitudeRef.current) altitudeRef.current.textContent = formatAltitude(lerp(STAGES[i0].altitude, STAGES[i0 + 1].altitude, f));
      autoPhase.current = (s / (STAGES.length - 1)) * (TIMES.length - 1);
      const idx = Math.round(s);
      setActiveStage((prev) => (prev === idx ? prev : idx));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Time of day: follows the climb unless the viewer picks a light
  useEffect(() => {
    let raf;
    const loop = () => {
      timeRef.current.target = timeMode === 'auto' ? autoPhase.current : timeMode;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timeMode]);

  // Experience mode: hands-free climb that slows down at every camp
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = performance.now();
    const stop = () => setPlaying(false);
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const lenis = window.__lenis;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = lenis ? lenis.scroll : window.scrollY;
      if (y >= max - 2) {
        stop();
        return;
      }
      const mid = y + window.innerHeight / 2;
      const nearest = Math.min(
        ...STAGES.map((s) => {
          const el = document.getElementById(s.id);
          return Math.abs(el.offsetTop + el.offsetHeight / 2 - mid) / window.innerHeight;
        })
      );
      const crawl = 0.35 + 0.65 * smoothstep(nearest, 0, 0.6);
      const next = y + 120 * speed * crawl * dt;
      if (lenis) lenis.scrollTo(next, { immediate: true });
      else window.scrollTo(0, next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
  }, [playing, speed]);

  const enterFreeFlight = useCallback(() => {
    setPlaying(false);
    window.__lenis?.stop();
    setFreeFlight(true);
  }, []);
  const exitFreeFlight = useCallback(() => {
    window.__lenis?.start();
    setFreeFlight(false);
  }, []);

  // Keyboard: 1–5 light, 0 auto, F free flight
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key >= '1' && e.key <= '5') setTimeMode(Number(e.key) - 1);
      else if (e.key === '0') setTimeMode('auto');
      else if ((e.key === 'f' || e.key === 'F') && !compact) {
        if (freeFlight) exitFreeFlight();
        else enterFreeFlight();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compact, freeFlight, enterFreeFlight, exitFreeFlight]);

  const quality = settings.quality === 'auto' ? dpr : settings.quality === 'high' ? 2 : 1;
  const stageContent = (stage) => {
    switch (stage.kind) {
      case 'hero':
        return <HeroStage onPlay={() => setPlaying(true)} />;
      case 'services':
        return <ServicesStage stage={stage} />;
      case 'about':
        return <AboutStage stage={stage} />;
      case 'project':
        return <ProjectStage stage={stage} />;
      case 'ledger':
        return <LedgerStage stage={stage} />;
      default:
        return <SummitStage stage={stage} />;
    }
  };

  return (
    <div className={`ascent ${playing ? 'ascent--playing' : ''} ${freeFlight ? 'ascent--flight' : ''}`}>
      <div className="ascent-canvas" aria-hidden="true">
        <Canvas shadows dpr={quality} camera={{ position: [40, 8, 40], fov: 50, near: 0.1, far: 1200 }} gl={{ antialias: !settings.effects }}>
          {/* One-way: only ever steps quality down. Raising it back up made the canvas
              resize back and forth, which showed up as blinking. */}
          <PerformanceMonitor
            flipflops={1}
            onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
            onFallback={() => {
              setDpr(1);
              setSettings((s) => (s.quality === 'auto' ? { ...s, godRays: false } : s));
            }}
          />
          <Suspense fallback={null}>
            <AscentScene
              climbRef={climbRef}
              timeRef={timeRef}
              activeStage={activeStage}
              freeFlight={freeFlight}
              onExitFreeFlight={exitFreeFlight}
              settings={settings}
              compact={compact}
              lowPower={lowPower}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="ascent-letterbox" aria-hidden="true" />

      {/* Top bar */}
      <header className="ascent-topbar">
        <button type="button" className="ascent-brand" onClick={() => scrollToY(0, { duration: 2.5 })}>
          <span>Tayyab Imran</span>
          <em>The Ascent</em>
        </button>
        <p className="ascent-now">
          <span>Stage {STAGES[activeStage].numeral}</span> {STAGES[activeStage].name}
        </p>
        <div className="ascent-controls">
          {playing ? (
            <div className="ascent-speed" role="group" aria-label="Playback speed">
              {SPEEDS.map((s) => (
                <button key={s} type="button" className={s === speed ? 'is-active' : ''} onClick={() => setSpeed(s)}>
                  {s === 0.5 ? '½' : s}×
                </button>
              ))}
              <button type="button" onClick={() => setPlaying(false)} aria-label="Stop experience">
                <Icon icon="lucide:pause" className="size-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" className="ascent-chip" onClick={() => setPlaying(true)}>
              <Icon icon="lucide:play" className="size-3.5" /> Experience
            </button>
          )}
          {!compact && (
            <button type="button" className="ascent-chip" onClick={freeFlight ? exitFreeFlight : enterFreeFlight}>
              <Icon icon="lucide:plane" className="size-3.5" /> {freeFlight ? 'Exit flight' : 'Free flight'}
            </button>
          )}
          <button type="button" className="ascent-chip ascent-chip--icon" onClick={() => setSettingsOpen((o) => !o)} aria-label="Settings" aria-expanded={settingsOpen}>
            <Icon icon="lucide:settings-2" className="size-4" />
          </button>
          {settingsOpen && (
            <div className="ascent-settings">
              <p>Picture</p>
              <label>
                <input type="checkbox" checked={settings.effects} onChange={(e) => setSettings((s) => ({ ...s, effects: e.target.checked }))} />
                Bloom & film grain
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.godRays}
                  disabled={!settings.effects}
                  onChange={(e) => setSettings((s) => ({ ...s, godRays: e.target.checked }))}
                />
                God rays
              </label>
              <p>Resolution</p>
              <div className="ascent-seg">
                {['auto', 'high', 'low'].map((q) => (
                  <button key={q} type="button" className={settings.quality === q ? 'is-active' : ''} onClick={() => setSettings((s) => ({ ...s, quality: q }))}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <Altimeter activeStage={activeStage} altitudeRef={altitudeRef} />

      {/* Time of day */}
      <div className="ascent-time" role="group" aria-label="Time of day">
        <button type="button" className={timeMode === 'auto' ? 'is-active' : ''} onClick={() => setTimeMode('auto')}>
          Auto
        </button>
        {TIMES.map((t, i) => (
          <button key={t.id} type="button" className={timeMode === i ? 'is-active' : ''} onClick={() => setTimeMode(i)}>
            <kbd>{i + 1}</kbd> {t.label}
          </button>
        ))}
      </div>

      {freeFlight && (
        <div className="ascent-flight-hint" role="status">
          <span className="ascent-crosshair" />
          <p>
            <kbd>W A S D</kbd> move · <kbd>Mouse</kbd> look · <kbd>Space</kbd> / <kbd>C</kbd> up / down · <kbd>Shift</kbd> boost · <kbd>Esc</kbd> exit
          </p>
        </div>
      )}

      <main className="ascent-track">
        {STAGES.map((stage, i) => (
          <section
            key={stage.id}
            id={stage.id}
            className={`ascent-stage ascent-stage--${stage.kind} ${i % 2 === 1 ? 'ascent-stage--right' : ''}`}
          >
            <div className="ascent-stage__inner">{stageContent(stage)}</div>
          </section>
        ))}

        <section id="record-book" className="ascent-after">
          <div className="ascent-panel">
            <p className="ascent-kicker">After the summit</p>
            <h2 className="ascent-title">The Record Book</h2>
            <ol className="ascent-record">
              {projectsData.map((p, i) => (
                <li key={p.id} className={i < 4 ? 'is-first' : ''}>
                  <span className="ascent-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.tagline}</p>
                  </div>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.name}`}>
                    <Icon icon="lucide:arrow-up-right" className="size-5" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer id="maker" className="ascent-after ascent-after--footer">
          <div className="ascent-panel">
            <p className="ascent-kicker">The maker</p>
            <h2 className="ascent-title">Built by one climber.</h2>
            <p className="ascent-body">
              Design, terrain, lighting and engineering by Tayyab Imran. The mountain is generated procedurally and rendered live in your
              browser.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((l) => (
                <a key={l.name} className="ascent-btn" href={l.href} target="_blank" rel="noreferrer">
                  {l.name} ↗
                </a>
              ))}
              <a className="ascent-btn" href={`mailto:${contactInfo.email}`}>
                Email ↗
              </a>
            </div>
            <p className="ascent-credits">© {new Date().getFullYear()} Tayyab Imran · React Three Fiber · Three.js</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Ascent;
