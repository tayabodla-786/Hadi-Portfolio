import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HELIX_COLORS = { a: '#ff3fa4', b: '#3ee8ff', rung: '#b9a6ff' };
const RING_COLORS = ['#ff3fa4', '#3ee8ff', '#8a5cff', '#2fd9c4', '#ffb347'];

/* ---------- DNA double helix ---------- */

export const Helix = ({ top, bottom, progressRef, scale = 1 }) => {
  const group = useRef();
  const beads = useRef();
  const rungs = useRef();
  const step = 0.2;
  const radius = 0.95;
  const turn = 0.32; // radians per bead
  const count = Math.ceil((top - bottom) / step);
  const rungEvery = 3;
  const rungCount = Math.ceil(count / rungEvery);

  const beadGeo = useMemo(() => new THREE.IcosahedronGeometry(0.13, 1), []);
  const rungGeo = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 1, 6), []);
  useEffect(() => () => {
    beadGeo.dispose();
    rungGeo.dispose();
  }, [beadGeo, rungGeo]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const colA = new THREE.Color(HELIX_COLORS.a);
    const colB = new THREE.Color(HELIX_COLORS.b);
    const colR = new THREE.Color(HELIX_COLORS.rung);

    for (let i = 0; i < count; i++) {
      const y = top - i * step;
      const a = i * turn;
      const s = 0.8 + 0.4 * Math.abs(Math.sin(i * 0.37));
      for (let k = 0; k < 2; k++) {
        const ang = a + k * Math.PI;
        pos.set(Math.cos(ang) * radius, y, Math.sin(ang) * radius);
        m.compose(pos, q.identity(), scl.setScalar(s));
        beads.current.setMatrixAt(i * 2 + k, m);
        beads.current.setColorAt(i * 2 + k, k === 0 ? colA : colB);
      }
    }

    for (let j = 0; j < rungCount; j++) {
      const i = j * rungEvery;
      const y = top - i * step;
      const a = i * turn;
      dir.set(Math.cos(a), 0, Math.sin(a));
      q.setFromUnitVectors(up, dir);
      m.compose(pos.set(0, y, 0), q, scl.set(1, radius * 2, 1));
      rungs.current.setMatrixAt(j, m);
      rungs.current.setColorAt(j, colR);
    }

    beads.current.instanceMatrix.needsUpdate = true;
    beads.current.instanceColor.needsUpdate = true;
    rungs.current.instanceMatrix.needsUpdate = true;
    rungs.current.instanceColor.needsUpdate = true;
  }, [count, rungCount, top]);

  useFrame((state) => {
    group.current.rotation.y = state.clock.elapsedTime * 0.35 + progressRef.current.smooth * 3;
  });

  return (
    <group ref={group} scale={[scale, 1, scale]}>
      <instancedMesh ref={beads} args={[beadGeo, undefined, count * 2]}>
        <meshPhysicalMaterial
          metalness={0.3}
          roughness={0.15}
          iridescence={1}
          iridescenceIOR={1.5}
          clearcoat={1}
          emissive="#2a1440"
          emissiveIntensity={0.6}
        />
      </instancedMesh>
      <instancedMesh ref={rungs} args={[rungGeo, undefined, rungCount]}>
        <meshStandardMaterial metalness={0.5} roughness={0.3} transparent opacity={0.55} />
      </instancedMesh>
    </group>
  );
};

/* ---------- Portal ring tunnel ---------- */

export const PortalRings = ({ start, end, compact }) => {
  const circles = useRef();
  const hexes = useRef();
  const spacing = 1.6;
  const total = Math.ceil((start - end) / spacing);
  const radius = compact ? 2.6 : 4.2;

  const circleGeo = useMemo(() => new THREE.TorusGeometry(1, 0.012, 6, 96), []);
  const hexGeo = useMemo(() => new THREE.TorusGeometry(1, 0.02, 4, 6), []);
  useEffect(() => () => {
    circleGeo.dispose();
    hexGeo.dispose();
  }, [circleGeo, hexGeo]);

  // Alternate hexagon / circle rings along the tunnel
  const rings = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => ({
        hex: i % 3 === 0,
        z: start - i * spacing,
        speed: (i % 2 === 0 ? 1 : -1) * (0.1 + (i % 5) * 0.05),
        r: radius * (0.9 + ((i * 7) % 5) * 0.05),
        color: RING_COLORS[i % RING_COLORS.length],
      })),
    [total, start, radius]
  );
  const circleCount = rings.filter((r) => !r.hex).length;
  const hexCount = total - circleCount;

  useLayoutEffect(() => {
    const c = new THREE.Color();
    let ci = 0;
    let hi = 0;
    rings.forEach((ring) => {
      c.set(ring.color);
      if (ring.hex) hexes.current.setColorAt(hi++, c);
      else circles.current.setColorAt(ci++, c);
    });
    circles.current.instanceColor.needsUpdate = true;
    hexes.current.instanceColor.needsUpdate = true;
  }, [rings]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    let ci = 0;
    let hi = 0;
    rings.forEach((ring, i) => {
      // Rings breathe slightly and spin in alternating directions
      const pulse = 1 + Math.sin(t * 1.2 - i * 0.45) * 0.04;
      e.set(0, 0, t * ring.speed + i * 0.3);
      q.setFromEuler(e);
      m.compose(pos.set(0, 0, ring.z), q, scl.set(ring.r * pulse, ring.r * pulse * 0.82, 1));
      if (ring.hex) hexes.current.setMatrixAt(hi++, m);
      else circles.current.setMatrixAt(ci++, m);
    });
    circles.current.instanceMatrix.needsUpdate = true;
    hexes.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={circles} args={[circleGeo, undefined, circleCount]}>
        <meshBasicMaterial transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={hexes} args={[hexGeo, undefined, hexCount]}>
        <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
