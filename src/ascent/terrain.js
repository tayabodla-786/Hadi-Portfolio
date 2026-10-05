import * as THREE from 'three';

// Deterministic procedural massif: one dominant peak at the origin, ridged flanks,
// and a trail that spirals up the faces to the summit.

export const TERRAIN_SIZE = 90;
export const PEAK = new THREE.Vector3(0, 0, 0);

const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const smooth = (t) => t * t * (3 - 2 * t);

function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smooth(xf);
  const v = smooth(yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

function fbm(x, y, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// Sharp crests where the noise crosses zero — reads as knife-edge ridges
function ridged(x, y, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let weight = 1;
  for (let i = 0; i < octaves; i++) {
    let n = 1 - Math.abs(valueNoise(x * freq + 13.1, y * freq - 7.7));
    n *= n * weight;
    weight = Math.min(1, n * 2);
    sum += n * amp;
    freq *= 2.1;
    amp *= 0.5;
  }
  return sum;
}

export function heightAt(x, z) {
  const d = Math.hypot(x, z);
  const massif = 17 * Math.pow(Math.max(0, 1 - d / 38), 1.2);
  const falloff = 1 - THREE.MathUtils.smoothstep(d, 6, 40);
  const ridges = ridged(x * 0.07, z * 0.07) * 7 * falloff;
  // Secondary crests and broken rock so faces read as stone, not clay
  const crags = ridged(x * 0.19 + 3.3, z * 0.19 - 1.7, 4) * 2.4 * falloff;
  const detail = fbm(x * 0.42, z * 0.42, 5) * 0.9;
  const spire = 5.5 * Math.exp(-(d * d) / 7);
  const valley = fbm(x * 0.03 + 4, z * 0.03 - 2, 3) * 2.2;
  return massif + ridges + crags + detail + spire + valley - 3.6;
}

export const MAX_HEIGHT = heightAt(0, 0);

const COLORS = {
  meadow: new THREE.Color('#3c4a31'),
  scree: new THREE.Color('#6b6153'),
  rock: new THREE.Color('#403c3d'),
  darkRock: new THREE.Color('#2a2729'),
  snow: new THREE.Color('#e9eef5'),
  blueSnow: new THREE.Color('#b9c8dc'),
};

export function buildTerrainGeometry(segments) {
  const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, segments, segments);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  }
  g.computeVertexNormals();

  // Colour by altitude and slope: meadow → scree → rock, snow on high flats
  const colors = new Float32Array(pos.count * 3);
  const normal = g.attributes.normal;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const flat = normal.getY(i);
    const h = y / MAX_HEIGHT;
    const n = fbm(x * 0.5, z * 0.5, 3) * 0.08;

    c.copy(COLORS.meadow).lerp(COLORS.scree, THREE.MathUtils.smoothstep(h + n, 0.05, 0.3));
    c.lerp(COLORS.rock, THREE.MathUtils.smoothstep(h + n, 0.25, 0.5));
    c.lerp(COLORS.darkRock, THREE.MathUtils.smoothstep(1 - flat, 0.25, 0.6) * 0.8);

    const snowline = 0.34 + n * 1.5;
    const snow = THREE.MathUtils.smoothstep(h, snowline, snowline + 0.08) * THREE.MathUtils.smoothstep(flat, 0.45, 0.7);
    const cap = THREE.MathUtils.smoothstep(h, 0.82, 0.92);
    const snowColor = COLORS.snow.clone().lerp(COLORS.blueSnow, 1 - THREE.MathUtils.smoothstep(flat, 0.6, 0.9));
    c.lerp(snowColor, Math.max(snow, cap * 0.85));

    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

// Spiral trail from the valley floor to the summit, hugging the surface
export function buildTrail() {
  const pts = [];
  const steps = 140;
  const startR = 30;
  const startA = Math.PI * 0.35;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const r = startR * Math.pow(1 - s, 0.9) + 0.05;
    const a = startA + s * Math.PI * 2.3;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    pts.push(new THREE.Vector3(x, heightAt(x, z) + 0.35, z));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}
