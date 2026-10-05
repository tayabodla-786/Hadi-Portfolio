import { useSyncExternalStore } from 'react';

// Scroll position of the page, measured in viewport heights ("svu")
let svu = 0;
const subs = new Set();

export const stage = {
  get: () => svu,
  set(v) {
    if (v === svu) return;
    svu = v;
    subs.forEach((f) => f());
  },
  subscribe(f) {
    subs.add(f);
    return () => subs.delete(f);
  },
};

// Re-renders only while the scroll position is inside [min, max]
export const useSvu = (min = -Infinity, max = Infinity) =>
  useSyncExternalStore(stage.subscribe, () => Math.min(max, Math.max(min, svu)));

// Re-renders only when the derived primitive changes
export const useStage = (select) => useSyncExternalStore(stage.subscribe, () => select(svu));

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const easeOut = (t) => 1 - Math.pow(1 - t, 5);
export const easeIn = (t) => t * t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const progress = (v, a, b) => clamp01((v - a) / (b - a));

// translateY (%) for a masked line: rises in over [inA, inB], drops out over [outA, outB]
export const rise = (v, inA, inB, outA = 99, outB = 100) =>
  100 * (1 - easeOut(progress(v, inA, inB))) - 100 * easeIn(progress(v, outA, outB));

// The whole page is one sticky stage; every scene is placed on this timeline
export const T = {
  zoom: [0.08, 1.5],
  dim: [0.85, 1.7],
  titleOut: 0.25,
  statement: { in: 1.05, out: [2.25, 2.65] },
  services: { in: 2.7, out: [3.62, 3.92] },
  flank: { in: 3.95, inRight: 4.45, out: [5.35, 5.85] },
  cellsIn: 4.15,
  bars: 5.85,
  // ~0.9 viewport heights of scroll per project
  work: [6.45, 9.15],
  contact: 9.4,
  end: 10.4,
};
export const STAGE_VH = (T.end + 1) * 100;

export const NAV_TARGETS = { about: 1.8, services: 3.3, work: T.work[0], contact: T.end };

export const scrollToSvu = (s, duration = 2) => {
  const y = s * window.innerHeight;
  if (window.__lenis) window.__lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: 'smooth' });
};
