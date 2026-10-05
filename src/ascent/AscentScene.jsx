import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html, Sky } from '@react-three/drei';
import { Bloom, EffectComposer, GodRays, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { buildTerrainGeometry, buildTrail, heightAt, MAX_HEIGHT } from './terrain.js';
import { formatAltitude, STAGES, TIMES } from './stages.js';
import { createCardTexture } from '../components/three/work/cardTexture.js';

const { clamp, damp, lerp, smoothstep, degToRad } = THREE.MathUtils;
const CARD_COLORS = ['#c98a3a', '#b3262e', '#2f6fd6', '#8e4dff'];

/* ---------- Time of day ---------- */

const TIME_COLORS = TIMES.map((t) => ({
  sun: new THREE.Color(t.sun),
  ambient: new THREE.Color(t.ambient),
  fog: new THREE.Color(t.fog),
  cloud: new THREE.Color(t.cloud),
}));

// Blends the two presets either side of a fractional phase (0 = dawn … 4 = night)
function blendTime(phase, out) {
  const i = clamp(Math.floor(phase), 0, TIMES.length - 2);
  const f = clamp(phase - i, 0, 1);
  const a = TIMES[i];
  const b = TIMES[i + 1];
  for (const key of ['elevation', 'azimuth', 'intensity', 'ambientIntensity', 'turbidity', 'rayleigh', 'stars']) {
    out[key] = lerp(a[key], b[key], f);
  }
  for (const key of ['sun', 'ambient', 'fog', 'cloud']) {
    out[key].copy(TIME_COLORS[i][key]).lerp(TIME_COLORS[i + 1][key], f);
  }
  return out;
}

const noiseGlsl = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += vnoise(p) * a; p *= 2.02; a *= 0.5; }
    return s;
  }
`;

/* ---------- Terrain ---------- */

const Terrain = ({ segments }) => {
  const geometry = useMemo(() => buildTerrainGeometry(segments), [segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.93} metalness={0} />
      </mesh>
      {/* Distant valley floor so the horizon never shows the edge of the world */}
      <mesh rotation-x={-Math.PI / 2} position-y={-3.2} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#23252b" roughness={1} />
      </mesh>
    </>
  );
};

/* ---------- Cloud sea ---------- */

const cloudVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const cloudFragment = /* glsl */ `
  uniform float uTime;
  uniform float uThreshold;
  uniform float uOpacity;
  uniform float uScale;
  uniform vec3 uColor;
  uniform vec3 uShade;
  uniform vec3 uFog;
  uniform vec3 uCam;
  varying vec3 vWorld;
  ${noiseGlsl}
  void main() {
    vec2 p = vWorld.xz * uScale + vec2(uTime * 0.012, uTime * 0.005);
    float n = fbm(p);
    float n2 = fbm(p * 2.3 - uTime * 0.02);
    float c = smoothstep(uThreshold, uThreshold + 0.3, n * 0.7 + n2 * 0.3);
    float dist = length(vWorld.xz - uCam.xz);
    vec3 col = mix(uShade, uColor, smoothstep(0.3, 0.8, n2));
    col = mix(col, uFog, smoothstep(40.0, 260.0, dist));
    float alpha = c * uOpacity * (1.0 - smoothstep(220.0, 330.0, dist));
    gl_FragColor = vec4(col, alpha);
  }
`;

const CloudLayer = ({ y, threshold, opacity, scale, timeRef }) => {
  const material = useRef();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uThreshold: { value: threshold },
      uOpacity: { value: opacity },
      uScale: { value: scale },
      uColor: { value: new THREE.Color() },
      uShade: { value: new THREE.Color() },
      uFog: { value: new THREE.Color() },
      uCam: { value: new THREE.Vector3() },
    }),
    [threshold, opacity, scale]
  );

  useFrame((state) => {
    const u = material.current.uniforms;
    const env = timeRef.current.env;
    u.uTime.value = state.clock.elapsedTime;
    u.uColor.value.copy(env.cloud);
    u.uShade.value.copy(env.ambient).multiplyScalar(0.55);
    u.uFog.value.copy(env.fog);
    u.uCam.value.copy(state.camera.position);
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} renderOrder={2}>
      <planeGeometry args={[700, 700]} />
      <shaderMaterial
        ref={material}
        vertexShader={cloudVertex}
        fragmentShader={cloudFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/* ---------- Valley mist ---------- */

const mistTexture = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

const Mist = ({ timeRef, count }) => {
  const group = useRef();
  const texture = useMemo(() => mistTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  const puffs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = i * 2.39996;
        const r = 9 + ((i * 37) % 23);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return { x, z, y: heightAt(x, z) + 1.2 + (i % 4) * 0.6, s: 7 + (i % 5) * 2.2, phase: i * 1.7 };
      }),
    [count]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cloud = timeRef.current.env.cloud;
    group.current.children.forEach((sprite, i) => {
      const p = puffs[i];
      sprite.position.x = p.x + Math.sin(t * 0.05 + p.phase) * 1.5;
      sprite.material.color.copy(cloud);
    });
  });

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} position={[p.x, p.y, p.z]} scale={[p.s, p.s * 0.45, 1]}>
          <spriteMaterial map={texture} transparent opacity={0.16} depthWrite={false} fog />
        </sprite>
      ))}
    </group>
  );
};

/* ---------- Snow & stars ---------- */

const snowVertex = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCam;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vSeed;
  void main() {
    vec3 drift = vec3(uTime * 1.4, -uTime * 1.8, uTime * 0.5) * (0.6 + aSeed);
    vec3 p = mod(position + drift - uCam + 15.0, 30.0) - 15.0 + uCam;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min((8.0 + aSeed * 12.0) * uPixelRatio / -mv.z, 6.0 * uPixelRatio);
    vSeed = aSeed;
  }
`;
const snowFragment = /* glsl */ `
  uniform float uAmount;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(0.95, 0.97, 1.0), smoothstep(0.5, 0.0, d) * uAmount * (0.4 + vSeed * 0.6));
  }
`;

const Snow = ({ count }) => {
  const material = useRef();
  const { gl } = useThree();
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const h = (n) => {
        const s = Math.sin((i + 1) * n) * 43758.5453;
        return s - Math.floor(s);
      };
      positions.set([h(12.9) * 30, h(78.2) * 30, h(37.7) * 30], i * 3);
      seeds[i] = h(4.1);
    }
    return { positions, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uAmount: { value: 0 }, uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) } }),
    [gl]
  );

  useFrame((state, dt) => {
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uCam.value.copy(state.camera.position);
    // Snow only blows once you're high on the mountain
    const high = smoothstep(state.camera.position.y / MAX_HEIGHT, 0.35, 0.75);
    u.uAmount.value = damp(u.uAmount.value, high, 2, dt);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={material} vertexShader={snowVertex} fragmentShader={snowFragment} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
};

const starVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 1.0 + aSeed * 2.2;
    vTwinkle = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 80.0);
  }
`;
const starFragment = /* glsl */ `
  uniform float uAmount;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * 1.4, uAmount * (0.35 + 0.65 * vTwinkle) * smoothstep(0.5, 0.1, d));
  }
`;

const Stars = ({ timeRef }) => {
  const material = useRef();
  const { positions, seeds } = useMemo(() => {
    const n = 2600;
    const positions = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const u = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const w = (Math.sin(i * 78.233) * 12345.678) % 1;
      v.setFromSphericalCoords(380, Math.acos(Math.abs(u)) * 0.98, Math.abs(w) * Math.PI * 2);
      positions.set([v.x, Math.abs(v.y), v.z], i * 3);
      seeds[i] = Math.abs((Math.sin(i * 4.1) * 999.1) % 1);
    }
    return { positions, seeds };
  }, []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmount: { value: 0 } }), []);

  useFrame((state) => {
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uAmount.value = timeRef.current.env.stars;
  });

  return (
    <points frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={material} vertexShader={starVertex} fragmentShader={starFragment} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
};

/* ---------- Trail & camps ---------- */

const trailVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const trailFragment = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float along = vUv.x;
    float done = step(along, uProgress);
    float dash = step(0.45, fract(along * 320.0 - uTime * 0.9));
    float head = exp(-pow((along - uProgress) * 120.0, 2.0));
    vec3 col = uColor * (1.0 + head * 3.0);
    float a = done * (0.6 + 0.4 * dash) + (1.0 - done) * 0.18 * dash + head;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

const Trail = ({ curve, climbRef }) => {
  const material = useRef();
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 900, 0.06, 6, false), [curve]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(() => ({ uProgress: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color('#ffc36b') } }), []);

  useFrame((state) => {
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uProgress.value = climbRef.current.smooth;
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial ref={material} vertexShader={trailVertex} fragmentShader={trailFragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
};

const beamVertex = trailVertex;
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 2.2) * uStrength;
    gl_FragColor = vec4(uColor * 2.0, a);
  }
`;

const Camp = ({ stage, index, position, active, reached, compact }) => {
  const ring = useRef();
  const beam = useRef();
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#ffc36b') }, uStrength: { value: 0.3 } }), []);
  const texture = useMemo(
    () => (stage.kind === 'project' ? createCardTexture(stage.data, stage.project, CARD_COLORS[stage.project % CARD_COLORS.length]) : null),
    [stage]
  );
  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const s = active ? 1 : reached ? 0.45 : 0.25;
    beam.current.material.uniforms.uStrength.value = damp(beam.current.material.uniforms.uStrength.value, s, 4, dt);
    ring.current.scale.setScalar(1 + ((t * 0.6 + index * 0.3) % 1) * 1.8);
    ring.current.material.opacity = (1 - ((t * 0.6 + index * 0.3) % 1)) * (active ? 0.9 : 0.35);
  });

  return (
    <group position={position}>
      {/* The summit keeps only its ring so the beam never cuts through the closing headline */}
      <mesh ref={beam} position-y={texture ? 0.75 : 2.5} visible={stage.kind !== 'contact'}>
        <cylinderGeometry args={[0.03, 0.09, texture ? 1.5 : 5, 8, 1, true]} />
        <shaderMaterial vertexShader={beamVertex} fragmentShader={beamFragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.05}>
        <ringGeometry args={[0.35, 0.42, 48]} />
        <meshBasicMaterial color="#ffc36b" transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <Html position={[0, texture ? 4.1 : 5.6, 0]} center distanceFactor={compact ? 18 : 14} zIndexRange={[5, 0]}>
        {/* The active camp is described by its HTML card, so its label steps aside */}
        <div className={`ascent-marker ${active ? 'ascent-marker--hidden' : reached ? 'ascent-marker--reached' : ''}`}>
          <span>{stage.numeral}</span>
          <strong>{stage.name}</strong>
          <em>{formatAltitude(stage.altitude)}</em>
        </div>
      </Html>

      {texture && (
        <Billboard position={[0, 2.6, 0]}>
          <mesh scale={active ? 1 : 0.8}>
            <planeGeometry args={[3.2, 2]} />
            <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={active ? 1 : 0.55} />
          </mesh>
          <mesh position-z={-0.02} scale={active ? 1 : 0.8}>
            <planeGeometry args={[3.3, 2.1]} />
            <meshBasicMaterial color={CARD_COLORS[stage.project % CARD_COLORS.length]} toneMapped={false} transparent opacity={active ? 0.9 : 0.3} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
};

/* ---------- Lighting & sky ---------- */

const Atmosphere = ({ timeRef, shadowSize, onSun }) => {
  const sky = useRef();
  const light = useRef();
  const hemi = useRef();
  const sun = useRef();
  const fog = useRef();
  const camAz = useRef(null);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => onSun(sun.current), [onSun]);

  useFrame((state, dt) => {
    const time = timeRef.current;
    time.smooth = damp(time.smooth, time.target, 1.6, dt);
    const env = blendTime(time.smooth, time.env);

    // Track the camera around the massif (shortest-arc smoothing)
    const az = Math.atan2(state.camera.position.x, state.camera.position.z);
    if (camAz.current === null) camAz.current = az;
    camAz.current += Math.atan2(Math.sin(az - camAz.current), Math.cos(az - camAz.current)) * Math.min(1, dt * 0.8);
    dir.setFromSphericalCoords(1, degToRad(90 - env.elevation), camAz.current + degToRad(env.azimuth));
    const u = sky.current.material.uniforms;
    u.sunPosition.value.copy(dir);
    u.turbidity.value = env.turbidity;
    u.rayleigh.value = env.rayleigh;

    light.current.position.copy(dir).multiplyScalar(70);
    light.current.color.copy(env.sun);
    // At night the "sun" becomes moonlight from above
    light.current.intensity = env.intensity;
    if (env.elevation < 2) light.current.position.set(dir.x * 70, 45, dir.z * 70);

    hemi.current.color.copy(env.ambient);
    hemi.current.intensity = env.ambientIntensity;
    fog.current.color.copy(env.fog);

    sun.current.position.copy(dir).multiplyScalar(260);
    sun.current.material.color.copy(env.sun);
    sun.current.visible = env.elevation > -3;
  });

  return (
    <>
      <fogExp2 ref={fog} attach="fog" args={['#b8cde6', 0.0105]} />
      <Sky ref={sky} distance={450000} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <hemisphereLight ref={hemi} groundColor="#1c1714" />
      <directionalLight
        ref={light}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <mesh ref={sun}>
        <sphereGeometry args={[9, 24, 24]} />
        <meshBasicMaterial fog={false} toneMapped={false} />
      </mesh>
    </>
  );
};

/* ---------- Camera ---------- */

const CameraRig = ({ curve, climbRef, freeFlight }) => {
  const s = useRef(null);
  // Scratch vectors, mutated every frame
  const scratch = useRef({
      p: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      out: new THREE.Vector3(1, 0, 0),
      lastOut: new THREE.Vector3(1, 0, 0),
      desired: new THREE.Vector3(),
      look: new THREE.Vector3(),
      orbit: new THREE.Vector3(),
      peak: new THREE.Vector3(0, MAX_HEIGHT - 1.5, 0),
  });

  useFrame((state, dt) => {
    const v = scratch.current;
    const c = climbRef.current;
    c.smooth = damp(c.smooth, c.target, 2.2, dt);
    c.orbitSmooth = damp(c.orbitSmooth, c.orbit, 2.2, dt);
    if (freeFlight) return;

    const cam = state.camera;
    if (!s.current) s.current = { pos: cam.position.clone(), look: new THREE.Vector3() };
    const t = clamp(c.smooth, 0, 1);

    curve.getPointAt(t, v.p);
    curve.getTangentAt(Math.min(t, 0.999), v.tan);
    v.out.set(v.p.x, 0, v.p.z);
    if (v.out.length() > 2) v.lastOut.copy(v.out.normalize());
    v.out.copy(v.lastOut);

    // Outside and a little behind the climber, looking up the trail
    const dist = lerp(10, 7.5, t);
    const height = lerp(3.4, 2.4, t);
    v.desired.copy(v.p).addScaledVector(v.out, dist).addScaledVector(v.tan, -3);
    v.desired.y += height;
    v.look.copy(v.p).addScaledVector(v.tan, 2.5);
    v.look.y += 0.8;

    // Past the summit: a slow orbit around the peak
    const o = smoothstep(c.orbitSmooth, 0, 0.35);
    if (o > 0) {
      const a = Math.atan2(v.lastOut.z, v.lastOut.x) + c.orbitSmooth * 1.8 + state.clock.elapsedTime * 0.02;
      v.orbit.set(Math.cos(a) * 17, MAX_HEIGHT + 3.5 - c.orbitSmooth * 2, Math.sin(a) * 17);
      v.desired.lerp(v.orbit, o);
      v.look.lerp(v.peak, o);
    }

    // Pointer parallax
    v.desired.x += state.pointer.x * 0.6;
    v.desired.y += state.pointer.y * 0.4;
    v.desired.y = Math.max(v.desired.y, heightAt(v.desired.x, v.desired.z) + 1.6);

    s.current.pos.x = damp(s.current.pos.x, v.desired.x, 3, dt);
    s.current.pos.y = damp(s.current.pos.y, v.desired.y, 3, dt);
    s.current.pos.z = damp(s.current.pos.z, v.desired.z, 3, dt);
    s.current.look.x = damp(s.current.look.x, v.look.x, 3.5, dt);
    s.current.look.y = damp(s.current.look.y, v.look.y, 3.5, dt);
    s.current.look.z = damp(s.current.look.z, v.look.z, 3.5, dt);
    cam.position.copy(s.current.pos);
    cam.lookAt(s.current.look);
  });

  return null;
};

// Mouse-look + WASD flight. Pointer lock when available, drag-to-look otherwise.
const FreeFlight = ({ onExit }) => {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);
  const move = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    euler.setFromQuaternion(camera.quaternion);
    const el = gl.domElement;
    let dragging = false;
    let locked = false;
    try {
      el.requestPointerLock?.()?.catch?.(() => null);
    } catch {
      // Pointer lock unavailable — drag-to-look still works
    }

    const look = (e) => {
      if (!locked && !dragging) return;
      euler.y -= e.movementX * 0.0022;
      euler.x = clamp(euler.x - e.movementY * 0.0022, -1.4, 1.4);
      camera.quaternion.setFromEuler(euler);
    };
    const lockChange = () => {
      const now = document.pointerLockElement === el;
      if (locked && !now) onExit();
      locked = now;
    };
    const down = (e) => {
      keys.current[e.code] = true;
      if (e.code === 'Escape') onExit();
    };
    const up = (e) => {
      keys.current[e.code] = false;
    };
    const mdown = () => {
      dragging = true;
    };
    const mup = () => {
      dragging = false;
    };

    document.addEventListener('pointerlockchange', lockChange);
    window.addEventListener('mousemove', look);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousedown', mdown);
    window.addEventListener('mouseup', mup);
    return () => {
      document.removeEventListener('pointerlockchange', lockChange);
      window.removeEventListener('mousemove', look);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousedown', mdown);
      window.removeEventListener('mouseup', mup);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [camera, gl, euler, onExit]);

  useFrame((state, dt) => {
    const cam = state.camera;
    const k = keys.current;
    const speed = (k.ShiftLeft || k.ShiftRight ? 22 : 7) * dt;
    move.set((k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), (k.Space ? 1 : 0) - (k.KeyC ? 1 : 0), (k.KeyS ? 1 : 0) - (k.KeyW ? 1 : 0));
    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(speed).applyQuaternion(cam.quaternion);
    cam.position.add(move);
    cam.position.y = Math.max(cam.position.y, heightAt(cam.position.x, cam.position.z) + 0.8);
  });

  return null;
};

/* ---------- Post-processing ---------- */

// Memoised: EffectComposer rebuilds its passes whenever its children change identity.
// multisampling stays 0 — an MSAA HalfFloat target renders mostly black frames on
// integrated AMD GPUs (ANGLE/D3D11), which was the blinking. SMAA handles edges instead.
const Effects = React.memo(({ sun, godRays }) => (
  <EffectComposer multisampling={0}>
    {godRays && sun ? (
      <GodRays sun={sun} samples={48} density={0.92} decay={0.93} weight={0.35} exposure={0.4} clampMax={1} blur />
    ) : (
      <></>
    )}
    <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    <Vignette offset={0.28} darkness={0.62} />
    <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
    <SMAA />
  </EffectComposer>
));
Effects.displayName = 'Effects';

/* ---------- Root ---------- */

const AscentScene = ({ climbRef, timeRef, activeStage, freeFlight, onExitFreeFlight, settings, compact, lowPower }) => {
  const curve = useMemo(() => buildTrail(), []);
  const [sun, setSun] = useState(null);
  const campPositions = useMemo(() => STAGES.map((s) => curve.getPointAt(s.t)), [curve]);

  return (
    <>
      <Atmosphere timeRef={timeRef} shadowSize={lowPower ? 1024 : 2048} onSun={setSun} />
      <Stars timeRef={timeRef} />
      <Terrain segments={lowPower ? 160 : 280} />
      <CloudLayer y={-1.6} threshold={0.42} opacity={0.92} scale={0.03} timeRef={timeRef} />
      <CloudLayer y={7.5} threshold={0.6} opacity={0.5} scale={0.018} timeRef={timeRef} />
      <Mist timeRef={timeRef} count={lowPower ? 14 : 28} />
      <Snow count={lowPower ? 900 : 2200} />
      <Trail curve={curve} climbRef={climbRef} />

      {STAGES.map((stage, i) => (
        <Camp
          key={stage.id}
          stage={stage}
          index={i}
          position={campPositions[i]}
          active={i === activeStage}
          reached={i < activeStage}
          compact={compact}
        />
      ))}

      <CameraRig curve={curve} climbRef={climbRef} freeFlight={freeFlight} />
      {freeFlight && <FreeFlight onExit={onExitFreeFlight} />}

      {settings.effects && <Effects sun={sun} godRays={settings.godRays} />}
    </>
  );
};

export default AscentScene;
