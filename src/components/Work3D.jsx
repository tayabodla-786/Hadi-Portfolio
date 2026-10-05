import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Link as ScrollLink } from 'react-scroll';
import WorkScene, { CAM_Z, FOV } from './three/work/WorkScene.jsx';
import { SCENE_MODES } from './three/work/modes.js';
import { projectsData } from '../data/portfolioData.js';

const CARD_COLORS = ['#c98a3a', '#b3262e', '#2f6fd6', '#8e4dff', '#16a89a', '#d4386c', '#d9a02a'];

const MODE_KEY = 'work3d-scene';

// ?scene=helix in the URL wins, then the viewer's last choice, then the default
const initialMode = () => {
  const valid = (m) => SCENE_MODES.some((s) => s.id === m);
  const fromUrl = new URLSearchParams(window.location.search).get('scene');
  if (valid(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (valid(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode); fall back to the default
  }
  return SCENE_MODES[0].id;
};

const Work3D = () => {
  const sectionRef = useRef(null);
  const progressRef = useRef({ target: 0, smooth: 0 });
  const hoverRef = useRef(-1);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const n = projectsData.length;

  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      progressRef.current.target = p;
      const idx = Math.round(p * (n - 1));
      setActive((prev) => (prev === idx ? prev : idx));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [n]);

  // Only render the WebGL scene while the section is on screen
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '200px' });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToIndex = useCallback(
    (i) => {
      const el = sectionRef.current;
      const index = (i + n) % n;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y = top + (index / (n - 1)) * (el.offsetHeight - window.innerHeight) + 1;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.4 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    },
    [n]
  );

  // Clicking a background card brings it forward; clicking the focused card opens it
  const handleCardClick = useCallback(
    (i) => {
      const current = Math.round(progressRef.current.target * (n - 1));
      if (i === current) window.open(projectsData[i].href, '_blank', 'noopener,noreferrer');
      else scrollToIndex(i);
    },
    [n, scrollToIndex]
  );

  const changeMode = (id) => {
    setMode(id);
    hoverRef.current = -1;
    document.body.style.removeProperty('cursor');
    try {
      localStorage.setItem(MODE_KEY, id);
    } catch {
      // Non-essential preference
    }
  };

  const project = projectsData[active];

  return (
    <section id="work" ref={sectionRef} className="relative bg-[#050609]" style={{ height: `${n * 75 + 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden work3d-ui">
        <div className="absolute inset-0 work3d-bg" />

        <div className="absolute inset-0">
          <Canvas
            frameloop={inView ? 'always' : 'never'}
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, CAM_Z], fov: FOV }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <WorkScene
                mode={mode}
                projects={projectsData}
                colors={CARD_COLORS}
                progressRef={progressRef}
                hoverRef={hoverRef}
                onCardClick={handleCardClick}
              />
            </Suspense>
          </Canvas>
        </div>

        <div className="absolute inset-0 work3d-vignette pointer-events-none" />

        {/* HUD */}
        <div className="absolute inset-0 pointer-events-none px-6 sm:px-12 lg:px-20 pt-28 pb-10 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
            <div>
              <p className="ux-step text-white/50"><em>/04 Selected Work</em></p>
              <h2 className="glitch text-3xl sm:text-5xl font-bold uppercase tracking-wider text-white" data-text="Work Archive">
                Work Archive
              </h2>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-3 sm:pt-2">
              <span className="hidden sm:block text-xs tracking-[0.3em] text-white/50">
                {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </span>
              <div className="work3d-switch flex items-center gap-1 p-1 rounded-lg pointer-events-auto" role="group" aria-label="3D scene style">
                {SCENE_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => changeMode(m.id)}
                    className={`px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] tracking-[0.2em] uppercase transition-colors ${
                      mode === m.id ? 'bg-white/10 text-[#3ee8ff]' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <div className="hidden md:block pointer-events-auto">
              <p className="text-sm tracking-[0.2em] text-white mb-5">WHAT ARE YOU LOOKING FOR?</p>
              <ul className="space-y-3">
                {projectsData.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => scrollToIndex(i)}
                      className={`text-sm tracking-[0.15em] uppercase transition-all duration-300 ${
                        i === active ? 'text-[#c9a8ff] translate-x-3' : 'text-[#8a7bd8]/70 hover:text-[#c9a8ff]'
                      }`}
                    >
                      {i === active && <span className="mr-2">&gt;</span>}
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
              <ScrollLink
                to="contact"
                smooth
                offset={-80}
                duration={800}
                className="mt-8 inline-block px-6 py-3 rounded-full border border-[#8a7bd8]/60 text-[#8a7bd8] text-xs tracking-[0.2em] hover:text-[#c9a8ff] hover:border-[#c9a8ff] transition-colors cursor-pointer"
              >
                ASK ME ANYTHING...
              </ScrollLink>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3 pointer-events-auto">
              <div className="work3d-switch flex items-center gap-2 p-1.5 rounded-lg">
                <button type="button" aria-label="Previous project" onClick={() => scrollToIndex(active - 1)} className="work3d-arrow">&lt;&lt;</button>
                <span className="min-w-36 text-center text-[11px] tracking-[0.2em] text-white/70 uppercase truncate px-2">
                  {project.name}
                </span>
                <button type="button" aria-label="Next project" onClick={() => scrollToIndex(active + 1)} className="work3d-arrow">&gt;&gt;</button>
              </div>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.25em] text-white/80 hover:text-[#3ee8ff] transition-colors"
              >
                OPEN PROJECT &#8599;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Work3D;
