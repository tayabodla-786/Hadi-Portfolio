// Point samplers for the particle entity's morph targets.
// Shapes are stored "at rest"; spin, tilt and waves are applied in the vertex shader.

export const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const gaussian = (rand) => (rand() + rand() + rand() - 1.5) / 1.5;

// A share of every shape is a loose halo so silhouettes feel alive, not stamped
const HALO = 0.1;
const halo = (out, i, rand, spread) => {
  out[i * 3] = (rand() - 0.5) * spread;
  out[i * 3 + 1] = (rand() - 0.5) * spread * 0.6;
  out[i * 3 + 2] = (rand() - 0.5) * spread * 0.5;
};

export function sampleText(lines, count, width, seed = 1) {
  const rand = mulberry32(seed);
  const W = 1400;
  const H = 360 * lines.length;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let size = 300;
  const font = (s) => `700 ${s}px "Chakra Petch", "Inter", sans-serif`;
  ctx.font = font(size);
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  size = Math.floor(size * Math.min(1, (W - 80) / widest));
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  lines.forEach((line, i) => ctx.fillText(line, W / 2, (i + 0.5) * (H / lines.length)));

  const data = ctx.getImageData(0, 0, W, H).data;
  const pixels = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) pixels.push(x, y);
    }
  }

  const out = new Float32Array(count * 3);
  const scale = width / W;
  const total = pixels.length / 2;
  for (let i = 0; i < count; i++) {
    if (rand() < HALO || total === 0) {
      halo(out, i, rand, width * 1.2);
      continue;
    }
    const k = Math.floor(rand() * total) * 2;
    out[i * 3] = (pixels[k] - W / 2 + (rand() - 0.5) * 2) * scale;
    out[i * 3 + 1] = -(pixels[k + 1] - H / 2 + (rand() - 0.5) * 2) * scale;
    out[i * 3 + 2] = gaussian(rand) * 0.12;
  }
  return out;
}

export function samplePlanet(count, seed = 2) {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const roll = rand();
    if (roll < HALO) {
      halo(out, i, rand, 11);
    } else if (roll < 0.62) {
      // Sphere shell with a little depth
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = 2.1 + gaussian(rand) * 0.05;
      const s = Math.sqrt(1 - u * u);
      out[i * 3] = Math.cos(a) * s * r;
      out[i * 3 + 1] = u * r;
      out[i * 3 + 2] = Math.sin(a) * s * r;
    } else {
      // Ring bands, with a visible gap
      const band = rand() < 0.65 ? 2.9 + rand() * 0.9 : 4.0 + rand() * 0.5;
      const a = rand() * Math.PI * 2;
      out[i * 3] = Math.cos(a) * band;
      out[i * 3 + 1] = gaussian(rand) * 0.03;
      out[i * 3 + 2] = Math.sin(a) * band;
    }
  }
  return out;
}

export function sampleGalaxy(count, seed = 3) {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  const arms = 4;
  for (let i = 0; i < count; i++) {
    if (rand() < HALO) {
      halo(out, i, rand, 12);
      continue;
    }
    const r = 0.15 + Math.pow(rand(), 0.75) * 4.4;
    const arm = Math.floor(rand() * arms);
    const a = (arm / arms) * Math.PI * 2 + r * 0.95 + gaussian(rand) * (0.45 / (r * 0.4 + 0.6));
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = gaussian(rand) * 0.18 * (1.4 - r / 5);
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

export function sampleTerrain(count, seed = 4) {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  // Jittered grid so the wave reads as a surface
  const cols = Math.ceil(Math.sqrt(count * 2.4));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cz = Math.floor(i / cols);
    out[i * 3] = (cx / cols - 0.5) * 18 + (rand() - 0.5) * 0.05;
    out[i * 3 + 1] = 0;
    out[i * 3 + 2] = (cz / rows - 0.5) * 8 + (rand() - 0.5) * 0.05;
  }
  return out;
}

export function sampleVortex(count, seed = 5) {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (rand() < HALO) {
      halo(out, i, rand, 12);
      continue;
    }
    const r = 0.35 + Math.pow(rand(), 1.6) * 4.6;
    const a = rand() * Math.PI * 2;
    // Funnel: dips sharply toward the event horizon
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = -1.3 / (r + 0.15) + gaussian(rand) * 0.05;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}
