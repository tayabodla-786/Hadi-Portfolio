import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildProjectTextures, TEX_H, TEX_W } from './projectTexture.js';
import { progress, stage, T } from '../scroll.js';

// Panels hang on the inside of a cylinder around the camera
const RADIUS = 6;
const ARC = 0.66;
const SPACING = 0.76;
const HEIGHT = (RADIUS * ARC) / (TEX_W / TEX_H);
// raised so the project title below never sits on top of the active panel
const LIFT = 0.6;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uReady;
uniform float uActive;
uniform float uHover;
uniform float uVel;
uniform float uAspect;
varying vec2 vUv;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // seen from inside the cylinder, so u runs backwards
  vec2 uv = vec2(1.0 - vUv.x, vUv.y);
  vec2 c = uv - 0.5;
  vec2 suv = 0.5 + c * (1.0 - 0.05 * uActive - 0.03 * uHover);
  float shift = clamp(uVel, -3.0, 3.0) * 0.004;
  vec3 col = vec3(
    texture2D(uMap, suv + vec2(shift, 0.0)).r,
    texture2D(uMap, suv).g,
    texture2D(uMap, suv - vec2(shift, 0.0)).b
  );
  col = mix(vec3(0.11, 0.105, 0.12), col, uReady);
  float gray = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(gray) * vec3(0.86, 0.8, 0.96), col, 0.3 + 0.7 * uActive);
  col *= 0.42 + 0.58 * uActive;

  vec2 pa = c * vec2(uAspect, 1.0);
  float d = sdRound(pa, vec2(uAspect * 0.5, 0.5), 0.025);
  float aa = fwidth(d);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  float edge = 1.0 - smoothstep(0.0, aa * 1.5, abs(d + 0.004));
  col = mix(col, vec3(0.973, 0.961, 0.933), edge * (0.25 + 0.5 * uActive));
  gl_FragColor = vec4(col, mask);
}
`;

const Panel = ({ index, texture, onHover, onSelect }) => {
  const materialRef = useRef(null);
  // args must keep their identity, or R3F rebuilds the material every render
  const materialArgs = useMemo(
    () => [
      {
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: {
          uMap: { value: null },
          uReady: { value: 0 },
          uActive: { value: 0 },
          uHover: { value: 0 },
          uVel: { value: 0 },
          uAspect: { value: TEX_W / TEX_H },
        },
      },
    ],
    []
  );
  const phi = Math.PI - index * SPACING;

  useEffect(() => {
    const u = materialRef.current.uniforms;
    u.uMap.value = texture;
    u.uReady.value = texture ? 1 : 0;
  }, [texture]);

  return (
    <mesh
      position-y={LIFT}
      userData={{ index }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
    >
      <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 48, 1, true, phi - ARC / 2, ARC]} />
      <shaderMaterial ref={materialRef} args={materialArgs} />
    </mesh>
  );
};

const WorkRing = ({ projects, hovered, onHover, onSelect }) => {
  const group = useRef(null);
  const smooth = useRef(null);
  const [textures, setTextures] = useState([]);
  const { camera, size } = useThree();
  const count = projects.length;

  useEffect(() => {
    let alive = true;
    let built = [];
    buildProjectTextures(projects).then((t) => {
      built = t;
      if (alive) setTextures(t);
      else t.forEach((x) => x.dispose());
    });
    return () => {
      alive = false;
      built.forEach((x) => x.dispose());
    };
  }, [projects]);

  // Widen the lens on narrow screens so the active panel always fits
  useEffect(() => {
    const aspect = size.width / size.height;
    // active panel spans at most ~85% of the width
    const halfFov = Math.atan(Math.tan(ARC / 2 / 0.85) / aspect);
    camera.fov = Math.max(42, (2 * halfFov * 180) / Math.PI);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((state, dt) => {
    const target = progress(stage.get(), T.work[0], T.work[1]) * (count - 1);
    smooth.current ??= target;
    const prev = smooth.current;
    smooth.current += (target - smooth.current) * (1 - Math.exp(-dt * 6));
    const vel = (smooth.current - prev) / Math.max(dt, 1e-3);
    group.current.rotation.y = smooth.current * SPACING;

    camera.rotation.y += (-state.pointer.x * 0.05 - camera.rotation.y) * 0.05;
    camera.rotation.x += (state.pointer.y * 0.03 - camera.rotation.x) * 0.05;

    group.current.children.forEach((mesh) => {
      const { index } = mesh.userData;
      const u = mesh.material.uniforms;
      u.uActive.value = 1 - Math.min(1, Math.abs(index - smooth.current));
      u.uHover.value += ((hovered === index ? 1 : 0) - u.uHover.value) * 0.12;
      u.uVel.value = vel;
    });
  });

  return (
    <group ref={group}>
      {projects.map((p, i) => (
        <Panel key={p.id} index={i} texture={textures[i] ?? null} onHover={onHover} onSelect={onSelect} />
      ))}
    </group>
  );
};

export default WorkRing;
