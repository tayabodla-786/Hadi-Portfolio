import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { createCardTexture } from './cardTexture.js';
import { cardVertex, cardFragment, particleVertex, particleFragment } from './shaders.js';
import { CARD_H, CARD_W, MODES } from './modes.js';
import { Helix, PortalRings } from './centerpieces.jsx';

export { CAM_Z, FOV } from './modes.js';
const PARTICLE_COLORS = ['#ff3fa4', '#3ee8ff', '#8a5cff', '#2fd9c4', '#ffb347', '#3a6bff', '#ff5d5d'];

const { damp, clamp } = THREE.MathUtils;

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Raw sRGB triplet — the custom shaders output without colour-space conversion
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);

/* ---------- Project screen ---------- */

const Card = ({ project, index, count, color, layout, fade, progressRef, hoverRef, onCardClick }) => {
  const group = useRef();
  const frontMat = useRef();
  const texture = useMemo(() => createCardTexture(project, index, color), [project, index, color]);
  useEffect(() => () => texture.dispose(), [texture]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uActive: { value: 0 },
      uBack: { value: 0 },
      uFade: { value: 1 },
      uBend: { value: 0.035 },
      uTint: { value: rawColor(color) },
      uSize: { value: new THREE.Vector2(CARD_W, CARD_H) },
    }),
    [texture, color]
  );
  // Shares every uniform object with the front face except the back flag
  const backUniforms = useMemo(() => ({ ...uniforms, uBack: { value: 1 } }), [uniforms]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = progressRef.current.smooth * (count - 1);
    const active = clamp(1 - Math.abs(p - index), 0, 1);
    // Front and back materials share these uniform objects
    const u = frontMat.current.uniforms;
    const hover = damp(u.uHover.value, hoverRef.current === index ? 1 : 0, 6, dt);
    u.uTime.value = t;
    u.uActive.value = active;
    u.uHover.value = hover;
    u.uFade.value = fade(p - index);
    group.current.visible = u.uFade.value > 0.001;

    const g = group.current;
    g.position.set(layout.x, layout.y + Math.sin(t * 0.6 + index) * 0.06, layout.z + hover * 0.25);
    g.rotation.set(
      -state.pointer.y * 0.1 * active + Math.sin(t * 0.4 + index) * 0.02,
      layout.ry + state.pointer.x * 0.14 * active,
      layout.rz
    );
    g.scale.setScalar(layout.scale * (0.93 + 0.07 * active + 0.03 * hover));
  });

  // Faded-out cards should not catch the pointer
  const isFaded = () => frontMat.current.uniforms.uFade.value < 0.2;

  return (
    <group ref={group}>
      <mesh
        onPointerOver={(e) => {
          if (isFaded()) return;
          e.stopPropagation();
          hoverRef.current = index;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (hoverRef.current === index) hoverRef.current = -1;
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          if (isFaded()) return;
          e.stopPropagation();
          onCardClick(index);
        }}
      >
        <planeGeometry args={[CARD_W, CARD_H, 48, 24]} />
        <shaderMaterial
          ref={frontMat}
          vertexShader={cardVertex}
          fragmentShader={cardFragment}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -0.08]} scale={1.012}>
        <planeGeometry args={[CARD_W, CARD_H, 48, 24]} />
        <shaderMaterial
          vertexShader={cardVertex}
          fragmentShader={cardFragment}
          uniforms={backUniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/* ---------- Crystal spine ---------- */

const Spine = ({ top, bottom, progressRef, scale = 1 }) => {
  const group = useRef();
  const bodies = useRef();
  const spikes = useRef();
  const step = 0.5;
  const count = Math.ceil((top - bottom) / step);

  const bodyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Hash on the rounded position so shared corners move together
      const h = Math.sin(Math.round(v.x * 100) * 12.9898 + Math.round(v.y * 100) * 78.233 + Math.round(v.z * 100) * 37.719) * 43758.5453;
      v.multiplyScalar(0.82 + (h - Math.floor(h)) * 0.32);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const spikeGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.13, 1, 5);
    g.rotateZ(-Math.PI / 2);
    g.translate(0.5, 0, 0);
    return g;
  }, []);

  useEffect(() => () => {
    bodyGeo.dispose();
    spikeGeo.dispose();
  }, [bodyGeo, spikeGeo]);

  useLayoutEffect(() => {
    const rand = mulberry32(42);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const y = top - i * step;
      const twist = i * 0.42;
      const s = 0.62 + rand() * 0.14;

      e.set((rand() - 0.5) * 0.3, twist, (rand() - 0.5) * 0.3);
      q.setFromEuler(e);
      pos.set((rand() - 0.5) * 0.08, y, 0);
      scl.set(s * 1.25, s * 0.48, s * 1.1);
      m.compose(pos, q, scl);
      bodies.current.setMatrixAt(i, m);

      for (let k = 0; k < 2; k++) {
        const a = twist + k * Math.PI + (rand() - 0.5) * 0.6;
        e.set(0, a, -0.25 - rand() * 0.3);
        q.setFromEuler(e);
        pos.set(Math.cos(a) * 0.55 * s, y - 0.05, -Math.sin(a) * 0.55 * s);
        const len = 0.3 + rand() * 0.6;
        scl.set(len, 0.7 + rand() * 0.6, 0.7 + rand() * 0.6);
        m.compose(pos, q, scl);
        spikes.current.setMatrixAt(i * 2 + k, m);
      }
    }
    bodies.current.instanceMatrix.needsUpdate = true;
    spikes.current.instanceMatrix.needsUpdate = true;
  }, [count, top]);

  useFrame((state) => {
    group.current.rotation.y = state.clock.elapsedTime * 0.08 + progressRef.current.smooth * 2.4;
  });

  return (
    <group ref={group} scale={[scale, 1, scale]}>
      <instancedMesh ref={bodies} args={[bodyGeo, undefined, count]}>
        <meshPhysicalMaterial
          color="#6b5f8f"
          metalness={0.4}
          roughness={0.2}
          iridescence={1}
          iridescenceIOR={1.6}
          iridescenceThicknessRange={[100, 800]}
          clearcoat={1}
          flatShading
        />
      </instancedMesh>
      <instancedMesh ref={spikes} args={[spikeGeo, undefined, count * 2]}>
        <meshPhysicalMaterial
          color="#4a5f78"
          metalness={0.45}
          roughness={0.22}
          iridescence={1}
          iridescenceIOR={1.4}
          clearcoat={1}
          flatShading
        />
      </instancedMesh>
    </group>
  );
};

/* ---------- Particle clouds ---------- */

// Particles are generated along Y; axis="z" lays the same field out along a tunnel
const Particles = ({ top, bottom, compact, axis = 'y' }) => {
  const material = useRef();
  const { gl } = useThree();

  const { positions, colors, scales, seeds } = useMemo(() => {
    const rand = mulberry32(7);
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
    const pts = [];
    const cols = [];
    const add = (x, y, z, hex, scale) => {
      const c = rawColor(hex);
      pts.push({ x, y, z, scale });
      cols.push(c);
    };

    const clusterCount = compact ? 10 : 18;
    for (let c = 0; c < clusterCount; c++) {
      const side = rand() > 0.5 ? 1 : -1;
      const cx = side * (0.5 + rand() * 3.2);
      const cy = top - rand() * (top - bottom);
      const cz = -1.5 + rand() * 2.5;
      const spread = 0.25 + rand() * 0.6;
      const hex = PARTICLE_COLORS[c % PARTICLE_COLORS.length];
      const n = (compact ? 70 : 140) + Math.floor(rand() * 120);
      for (let i = 0; i < n; i++) {
        add(cx + gauss() * spread * 1.4, cy + gauss() * spread, cz + gauss() * spread, rand() > 0.85 ? '#ffffff' : hex, 0.5 + rand() * 1.2);
      }
    }

    // Dust shedding off the spine
    const dust = compact ? 350 : 700;
    for (let i = 0; i < dust; i++) {
      const a = rand() * Math.PI * 2;
      const r = 0.7 + Math.pow(rand(), 2) * 1.6;
      add(Math.cos(a) * r, top - rand() * (top - bottom), Math.sin(a) * r, PARTICLE_COLORS[Math.floor(rand() * PARTICLE_COLORS.length)], 0.3 + rand() * 0.8);
    }

    // Faint ambient field
    const ambient = compact ? 500 : 1200;
    for (let i = 0; i < ambient; i++) {
      add((rand() - 0.5) * 16, top - rand() * (top - bottom), -6 + rand() * 8, rand() > 0.5 ? '#7fa8ff' : '#c9a8ff', 0.2 + rand() * 0.5);
    }

    const positions = new Float32Array(pts.length * 3);
    const colors = new Float32Array(pts.length * 3);
    const scales = new Float32Array(pts.length);
    const seeds = new Float32Array(pts.length);
    pts.forEach((p, i) => {
      positions.set(axis === 'z' ? [p.x, (p.z + 2) * 1.2, p.y] : [p.x, p.y, p.z], i * 3);
      colors.set([cols[i].r, cols[i].g, cols[i].b], i * 3);
      scales[i] = p.scale;
      seeds[i] = rand();
    });
    return { positions, colors, scales, seeds };
  }, [top, bottom, compact, axis]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 66 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
    }),
    [gl]
  );

  useFrame((state) => {
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/* ---------- Scene ---------- */

const WorkScene = ({ mode = 'spine', projects, colors, progressRef, hoverRef, onCardClick }) => {
  const { size, camera } = useThree();
  const lights = useRef();
  const track = useRef();
  const pointerOffset = useRef(new THREE.Vector2());
  const config = MODES[mode] ?? MODES.spine;
  const n = projects.length;
  const aspect = size.width / size.height;
  const compact = aspect < 0.9;
  const { start, end } = config.extent(n);

  const layouts = useMemo(() => config.layouts(n, aspect, compact), [config, n, aspect, compact]);

  useFrame((state, dt) => {
    const pr = progressRef.current;
    pr.smooth = damp(pr.smooth, pr.target, 4, dt);

    pointerOffset.current.x = damp(pointerOffset.current.x, state.pointer.x * 0.6, 3, dt);
    pointerOffset.current.y = damp(pointerOffset.current.y, state.pointer.y * 0.4, 3, dt);
    config.camera(camera, track.current, pr.smooth * (n - 1), n, pointerOffset.current);

    lights.current.position.copy(camera.position);
  });

  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="ring" intensity={3} color="#ff3fa4" position={[4, 2, -3]} scale={4} />
        <Lightformer form="rect" intensity={3} color="#3ee8ff" position={[-5, 0, 2]} scale={[3, 8, 1]} />
        <Lightformer intensity={2} color="#8a5cff" position={[0, 6, -4]} scale={[10, 2, 1]} />
        <Lightformer intensity={1.5} color="#ffffff" position={[0, -4, 5]} scale={[6, 1, 1]} />
      </Environment>

      <ambientLight intensity={0.25} />
      {/* Follows the camera so the centrepiece stays lit along the whole path */}
      <group ref={lights}>
        <pointLight position={[3, 2, -5]} intensity={18} color="#ff3fa4" />
        <pointLight position={[-3, -2, -5]} intensity={18} color="#3ee8ff" />
        <pointLight position={[0, 0, -11]} intensity={10} color="#8a5cff" />
      </group>

      {mode === 'spine' && <Spine top={start} bottom={end} progressRef={progressRef} scale={compact ? 0.7 : 1} />}
      {mode === 'helix' && <Helix top={start} bottom={end} progressRef={progressRef} scale={compact ? 0.7 : 1} />}
      {mode === 'tunnel' && <PortalRings start={start} end={end} compact={compact} />}
      <Particles key={mode} top={start} bottom={end} compact={compact} axis={config.axis} />

      <group ref={track}>
        {projects.map((project, i) => (
          <Card
            key={project.id}
            project={project}
            index={i}
            count={n}
            color={colors[i % colors.length]}
            layout={layouts[i]}
            fade={config.fade}
            progressRef={progressRef}
            hoverRef={hoverRef}
            onCardClick={onCardClick}
          />
        ))}
      </group>
    </>
  );
};

export default WorkScene;
