import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32, sampleGalaxy, samplePlanet, sampleTerrain, sampleText, sampleVortex } from './shapes.js';
import { entityFragment, entityVertex, starFragment, starVertex } from './entityShaders.js';
import { experienceState } from './experienceState.js';

const CAM_Z = 10;
const FOV = 45;

// Section ids in page order; index = morph target
const SECTIONS = ['hero', 'services', 'about', 'works', 'contact'];

const PALETTES = [
  ['#ffffff', '#ff3fa4', '#3ee8ff'],
  ['#8a5cff', '#3ee8ff', '#ffffff'],
  ['#ffb347', '#ff3fa4', '#8a5cff'],
  ['#2fd9c4', '#3a6bff', '#ffffff'],
  ['#ff3fa4', '#8a5cff', '#ffb347'],
];

// Where the entity sits for each section so it frames the HTML content
const PLACEMENTS = {
  wide: [
    { x: 0, y: 0.55, s: 1 },
    { x: 3.6, y: 0, s: 0.95 },
    { x: -3.7, y: 0, s: 0.85 },
    { x: 0, y: -2.1, s: 1 },
    { x: 0, y: 1.7, s: 1 },
  ],
  compact: [
    { x: 0, y: 0.9, s: 1 },
    { x: 0, y: 0.6, s: 0.62 },
    { x: 0, y: 0.6, s: 0.58 },
    { x: 0, y: -2.2, s: 0.7 },
    { x: 0, y: 0.6, s: 0.62 },
  ],
};

const { damp, smoothstep } = THREE.MathUtils;
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const easeOutCubic = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

/* ---------- Particle entity ---------- */

const Entity = ({ morphRef, compact }) => {
  const points = useRef();
  const material = useRef();
  const { gl, size } = useThree();
  const [fontsReady, setFontsReady] = useState(false);
  const smooth = useRef({ morph: 0, accent: 0, burstSeen: -Infinity, burst: new THREE.Vector3() });
  const accent = useMemo(() => new THREE.Color(), []);

  // The hero name is sampled from rendered text, so wait for the display font
  useEffect(() => {
    let alive = true;
    const load = document.fonts ? document.fonts.load('700 100px "Chakra Petch"') : Promise.resolve();
    load.catch(() => null).finally(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const count = compact ? 7000 : 16000;

  const geometry = useMemo(() => {
    if (!fontsReady) return null;
    const rand = mulberry32(99);
    const g = new THREE.BufferGeometry();
    const t0 = sampleText(['TAYYAB', 'IMRAN'], count, compact ? 3.9 : 9.6);
    g.setAttribute('position', new THREE.BufferAttribute(t0, 3));
    g.setAttribute('aT0', new THREE.BufferAttribute(t0, 3));
    g.setAttribute('aT1', new THREE.BufferAttribute(samplePlanet(count), 3));
    g.setAttribute('aT2', new THREE.BufferAttribute(sampleGalaxy(count), 3));
    g.setAttribute('aT3', new THREE.BufferAttribute(sampleTerrain(count), 3));
    g.setAttribute('aT4', new THREE.BufferAttribute(sampleVortex(count), 3));
    const rnd = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(0.3 + rand() * 0.7);
      rnd.set([v.x, v.y, v.z], i * 3);
      seeds[i] = rand();
    }
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [fontsReady, count, compact]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uIntro: { value: 0 },
      uSize: { value: compact ? 30 : 36 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uRepel: { value: compact ? 0.6 : 1 },
      uRepelRadius: { value: compact ? 0.6 : 1.4 },
      uBurstPos: { value: new THREE.Vector3() },
      uBurst: { value: 0 },
      uPal: { value: PALETTES.flat().map((hex) => new THREE.Vector3(...rawColor(hex).toArray())) },
      uAccent: { value: new THREE.Vector3() },
      uAccentMix: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [gl, compact]
  );

  useFrame((state, dt) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    const s = smooth.current;
    const now = performance.now();
    const place = PLACEMENTS[compact ? 'compact' : 'wide'];

    s.morph = damp(s.morph, morphRef.current, 2.6, dt);
    u.uTime.value = state.clock.elapsedTime;
    u.uMorph.value = s.morph;

    // Glide between per-section placements
    const i0 = Math.min(Math.floor(s.morph), place.length - 2);
    const f = smoothstep(s.morph - i0, 0, 1);
    const a = place[i0];
    const b = place[i0 + 1];
    const g = points.current;
    g.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 0);
    g.scale.setScalar(a.s + (b.s - a.s) * f);
    g.rotation.y = damp(g.rotation.y, state.pointer.x * 0.3, 2, dt);
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.18, 2, dt);

    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    u.uMouse.value.set(state.pointer.x * halfH * (size.width / size.height), state.pointer.y * halfH, 0);

    if (experienceState.burstAt !== s.burstSeen) {
      s.burstSeen = experienceState.burstAt;
      u.uBurstPos.value.copy(u.uMouse.value);
    }
    const since = (now - experienceState.burstAt) / 1000;
    u.uBurst.value = since < 1.4 ? Math.pow(1 - since / 1.4, 2) * Math.min(1, since * 12) : 0;

    u.uIntro.value = experienceState.introAt === null ? 0 : easeOutCubic((now - experienceState.introAt) / 2400);

    if (experienceState.accent) {
      accent.setStyle(experienceState.accent, THREE.LinearSRGBColorSpace);
      u.uAccent.value.set(accent.r, accent.g, accent.b);
    }
    s.accent = damp(s.accent, experienceState.accent ? 0.75 : 0, 5, dt);
    u.uAccentMix.value = s.accent;

    // On phones the entity sits behind copy, so it steps back after the hero
    u.uOpacity.value = compact ? 1 - smoothstep(s.morph, 0.3, 0.9) * 0.45 : 1;
  });

  if (!geometry) return null;

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={entityVertex}
        fragmentShader={entityFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/* ---------- Deep star field ---------- */

const Stars = ({ scrollRef }) => {
  const material = useRef();
  const { gl } = useThree();

  const { positions, seeds } = useMemo(() => {
    const rand = mulberry32(12);
    const n = 1400;
    const positions = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      positions.set([(rand() - 0.5) * 44, (rand() - 0.5) * 40, -6 - rand() * 18], i * 3);
      seeds[i] = rand();
    }
    return { positions, seeds };
  }, []);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uScroll: { value: 0 }, uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) } }),
    [gl]
  );

  useFrame((state) => {
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uScroll.value = scrollRef.current * 0.004;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
};

const CameraRig = () => {
  useFrame((state, dt) => {
    const cam = state.camera;
    cam.position.x = damp(cam.position.x, state.pointer.x * 0.5, 2, dt);
    cam.position.y = damp(cam.position.y, state.pointer.y * 0.3, 2, dt);
    cam.lookAt(0, 0, 0);
  });
  return null;
};

/* ---------- Page-level canvas ---------- */

const Experience = () => {
  const morphRef = useRef(0);
  const scrollRef = useRef(0);
  const [covered, setCovered] = useState(false);
  const [compact, setCompact] = useState(() => window.innerWidth / window.innerHeight < 0.9);
  const [eventSource] = useState(() => document.getElementById('root'));

  useEffect(() => {
    const update = () => {
      scrollRef.current = window.scrollY;
      const mid = window.innerHeight / 2;
      const centers = SECTIONS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });

      // Hold each shape while its section is centred, morph quickly in between
      let morph = 0;
      for (let i = 0; i < centers.length; i++) {
        const c = centers[i];
        if (c === null) continue;
        if (mid >= c) morph = i;
        const next = centers[i + 1];
        if (next != null && mid > c && mid < next) {
          morph = i + smoothstep((mid - c) / (next - c), 0.25, 0.75);
          break;
        }
      }
      morphRef.current = morph;

      // The Work archive runs its own full-screen scene; pause this one underneath it
      const work = document.getElementById('work');
      if (work) {
        const r = work.getBoundingClientRect();
        const isCovered = r.top <= 0 && r.bottom >= window.innerHeight;
        setCovered((prev) => (prev === isCovered ? prev : isCovered));
      }
    };
    const resize = () => {
      setCompact(window.innerWidth / window.innerHeight < 0.9);
      update();
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 experience-bg" />
      <Canvas
        frameloop={covered ? 'never' : 'always'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, CAM_Z], fov: FOV }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        eventSource={eventSource}
        eventPrefix="client"
      >
        <CameraRig />
        <Stars scrollRef={scrollRef} />
        <Entity key={compact ? 'compact' : 'wide'} morphRef={morphRef} compact={compact} />
      </Canvas>
      <div className="absolute inset-0 experience-vignette" />
    </div>
  );
};

export default Experience;
