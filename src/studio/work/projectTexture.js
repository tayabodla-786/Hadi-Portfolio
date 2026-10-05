import * as THREE from 'three';
import { ARCHES, archPath } from '../arches.js';

// 2:1, close to the browser-window screenshots, so little of each site is cropped
export const TEX_W = 1440;
export const TEX_H = 720;

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

// Cover-fit, anchored to the top so site headers stay in frame
const drawCover = (ctx, img) => {
  const s = Math.max(TEX_W / img.width, TEX_H / img.height);
  ctx.drawImage(img, (TEX_W - img.width * s) / 2, 0, img.width * s, img.height * s);
};

const fitText = (ctx, text, weight, size, family, maxWidth) => {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    s -= 4;
  } while (ctx.measureText(text).width > maxWidth && s > 24);
};

// Poster art for projects without a screenshot
const drawPoster = (ctx, project, index) => {
  ctx.fillStyle = '#1c1b1f';
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  [
    [TEX_W * 0.8, TEX_H * 0.2, 760, 'rgba(175, 0, 241, 0.55)'],
    [TEX_W * 0.05, TEX_H * 1.05, 620, 'rgba(217, 0, 255, 0.22)'],
  ].forEach(([x, y, r, c]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  });

  ctx.strokeStyle = 'rgba(248, 245, 238, 0.07)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    const x = Math.round((TEX_W / 12) * i) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TEX_H);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(248, 245, 238, 0.28)';
  ctx.lineWidth = 3;
  ARCHES.forEach((a) => ctx.stroke(new Path2D(archPath(a, 600, TEX_W * 0.76, TEX_H * 0.42))));

  const mono = '"Roboto Mono", ui-monospace, monospace';
  const display = '"Albert Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(248, 245, 238, 0.7)';
  ctx.font = `500 26px ${mono}`;
  ctx.letterSpacing = '6px';
  ctx.fillText(String(index + 1).padStart(2, '0'), 72, 96);
  ctx.fillText(project.tagline.toUpperCase(), 72, TEX_H - 190);

  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#ffffff';
  fitText(ctx, project.name, 700, 124, display, TEX_W * 0.62);
  ctx.fillText(project.name, 68, TEX_H - 80);
};

export async function buildProjectTextures(projects) {
  await Promise.all([
    document.fonts?.load('700 124px "Albert Sans"'),
    document.fonts?.load('500 26px "Roboto Mono"'),
  ]).catch(() => {});

  return Promise.all(
    projects.map(async (project, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = TEX_W;
      canvas.height = TEX_H;
      const ctx = canvas.getContext('2d');
      const img = project.image ? await loadImage(project.image) : null;
      if (img) drawCover(ctx, img);
      else drawPoster(ctx, project, i);
      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      return tex;
    })
  );
}
