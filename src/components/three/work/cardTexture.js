import * as THREE from 'three';

const W = 1024;
const H = 640;
const FONT = '"Chakra Petch", "Inter", sans-serif';

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

// Cover-fit, anchored to the top so website headers stay visible
const drawCover = (ctx, img) => {
  const s = Math.max(W / img.width, H / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, (W - iw) / 2, 0, iw, ih);
};

// Placeholder art for projects without a screenshot
const drawGenerative = (ctx, color, seed) => {
  const rand = mulberry32(seed * 977 + 13);
  const palette = [color, '#ff3fa4', '#3ee8ff', '#8a5cff', '#2fd9c4'];
  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 120 + rand() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, palette[i % palette.length] + 'aa');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
};

const paint = (ctx, project, index, color, img) => {
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  if (img) {
    ctx.fillStyle = '#07080c';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.85;
    drawCover(ctx, img);
    ctx.globalAlpha = 1;
  } else {
    drawGenerative(ctx, color, index + 1);
  }

  // Colour wash + legibility gradients
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  const side = ctx.createLinearGradient(0, 0, W, 0);
  side.addColorStop(0, 'rgba(5,6,10,0.78)');
  side.addColorStop(0.65, 'rgba(5,6,10,0.25)');
  side.addColorStop(1, 'rgba(5,6,10,0.05)');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, W, H);

  const bottom = ctx.createLinearGradient(0, H * 0.4, 0, H);
  bottom.addColorStop(0, 'rgba(5,6,10,0)');
  bottom.addColorStop(1, 'rgba(5,6,10,0.85)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';

  // Top row: index + label box
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`/0${index + 1}  PROJECT ARCHIVE`, 56, 76);

  const label = `${project.frameworks[0]?.name ?? 'WEB'} 26`.toUpperCase();
  ctx.font = `700 30px ${FONT}`;
  const lw = ctx.measureText(label).width + 36;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 3;
  ctx.strokeRect(W - lw - 56, 44, lw, 50);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(label, W - lw - 38, 80);

  // Title, shrunk to fit, with an offset ghost copy for the doubled glitch look
  const title = project.name.toUpperCase();
  let size = 112;
  ctx.font = `700 ${size}px ${FONT}`;
  while (ctx.measureText(title).width > W - 130 && size > 48) {
    size -= 4;
    ctx.font = `700 ${size}px ${FONT}`;
  }
  const ty = H - 150;
  ctx.fillStyle = color + 'aa';
  ctx.fillText(title, 68, ty + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(title, 62, ty - 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 56, ty);

  ctx.font = `500 28px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(project.tagline.toUpperCase(), 58, H - 104);

  // Tech tags
  ctx.font = `600 20px ${FONT}`;
  let x = 56;
  project.frameworks.forEach((fw) => {
    const text = fw.name.toUpperCase();
    const w = ctx.measureText(text).width + 32;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, H - 82, w, 40, 20);
    else ctx.rect(x, H - 82, w, 40);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(text, x + 16, H - 55);
    x += w + 12;
  });
};

export function createCardTexture(project, index, color) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;

  paint(ctx, project, index, color, null);
  texture.needsUpdate = true;

  Promise.all([
    project.image ? loadImage(project.image) : Promise.resolve(null),
    document.fonts ? document.fonts.load(`700 90px "Chakra Petch"`).catch(() => null) : null,
  ]).then(([img]) => {
    paint(ctx, project, index, color, img);
    texture.needsUpdate = true;
  });

  return texture;
}
