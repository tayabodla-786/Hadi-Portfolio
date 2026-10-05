// Shared triptych geometry, in a unit space where y runs up and every window base sits at ARCH_BASE.
// The painting shader, the preloader and the logo mark all draw from this.
export const ARCH_BASE = -0.3;
export const ARCHES = [
  { cx: -0.33, w: 0.11, h: 0.46 },
  { cx: 0, w: 0.135, h: 0.6 },
  { cx: 0.33, w: 0.11, h: 0.46 },
];

// SVG path for one arch, mapped into a y-down viewBox
export const archPath = ({ cx, w, h }, scale, ox, oy) => {
  const x0 = ox + (cx - w) * scale;
  const x1 = ox + (cx + w) * scale;
  const yb = oy - ARCH_BASE * scale;
  const yt = oy - (ARCH_BASE + h - w) * scale;
  const r = w * scale;
  return `M${x0} ${yb}V${yt}A${r} ${r} 0 0 1 ${x1} ${yt}V${yb}Z`;
};
