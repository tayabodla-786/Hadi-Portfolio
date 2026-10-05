import React, { useEffect, useRef, useState } from 'react';
import { ARCH_BASE, ARCHES, archPath } from './arches.js';
import { easeInOut, progress, stage, T } from './scroll.js';
import { hasWebGL } from './hooks.js';

const [L, C, R] = ARCHES;
const f = (n) => n.toFixed(4);

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// A procedural dusk landscape seen through three arched windows
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uZoom;
uniform float uFit;
uniform float uReveal;
uniform vec2 uMouse;

#define BASE ${f(ARCH_BASE)}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 q = fract(p);
  vec2 u = q * q * (3.0 - 2.0 * q);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float ridge(float x, float seed) {
  float v = 0.0;
  float a = 0.5;
  float fr = 1.0;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(noise(vec2(x * fr + seed, seed * 1.7)) * 2.0 - 1.0);
    v += a * n * n;
    fr *= 2.1;
    a *= 0.5;
  }
  return v;
}

vec3 sky(vec2 u) {
  float t = clamp((u.y + 0.07) / 0.55, 0.0, 1.0);
  vec3 c = mix(vec3(0.98, 0.66, 0.48), vec3(0.70, 0.27, 0.56), smoothstep(0.0, 0.4, t));
  c = mix(c, vec3(0.16, 0.06, 0.26), smoothstep(0.32, 1.0, t));

  float d = length((u - vec2(0.05, 0.13)) * vec2(1.0, 1.1));
  c += vec3(1.0, 0.72, 0.5) * (0.5 * exp(-d * 10.0) + 0.22 * exp(-d * 3.0));
  c = mix(c, vec3(1.0, 0.94, 0.84), smoothstep(0.05, 0.045, d));

  vec2 cu = vec2(u.x * 2.4 + uTime * 0.01, u.y * 8.0);
  float cl = fbm(cu + 0.7 * fbm(cu * 1.4 + 3.1));
  float band = smoothstep(0.05, 0.16, u.y) * (1.0 - smoothstep(0.3, 0.42, u.y));
  vec3 cc = mix(vec3(1.0, 0.74, 0.66), vec3(0.46, 0.2, 0.46), smoothstep(0.08, 0.38, u.y));
  return mix(c, cc, smoothstep(0.5, 0.78, cl) * band * 0.7);
}

float layer(float h, float y) { return smoothstep(h + 0.0015, h - 0.0015, y); }

vec3 scene(vec2 u) {
  vec2 m = uMouse;
  vec3 c = sky(u - m * 0.004);

  float x0 = u.x - m.x * 0.008;
  float h0 = -0.06 + 0.2 * ridge(x0 * 1.25 + 11.0, 2.0);
  vec3 c0 = mix(vec3(0.6, 0.38, 0.64), vec3(0.93, 0.6, 0.55), 0.3);
  float snow = smoothstep(h0 - 0.04, h0 - 0.01, u.y) * smoothstep(0.04, 0.1, h0);
  c0 = mix(c0, vec3(1.0, 0.9, 0.88), snow * 0.75);
  c0 *= 0.95 + 0.07 * noise(vec2(x0 * 45.0, u.y * 30.0));
  c = mix(c, c0, layer(h0, u.y));

  float x1 = u.x - m.x * 0.014;
  float h1 = -0.08 + 0.15 * ridge(x1 * 1.9 + 4.0, 5.0);
  vec3 c1 = mix(vec3(0.38, 0.2, 0.46), vec3(0.62, 0.34, 0.52), smoothstep(h1 - 0.1, h1, u.y) * 0.6);
  c1 *= 0.92 + 0.12 * noise(vec2(x1 * 40.0, u.y * 60.0));
  c = mix(c, c1, layer(h1, u.y));

  float x2 = u.x - m.x * 0.02;
  float h2 = -0.13 + 0.1 * ridge(x2 * 2.7 + 7.0, 9.0);
  vec3 c2 = mix(vec3(0.2, 0.1, 0.28), vec3(0.36, 0.17, 0.38), smoothstep(h2 - 0.08, h2, u.y) * 0.5);
  c = mix(c, c2, layer(h2, u.y));

  float x3 = u.x - m.x * 0.03;
  float h3 = -0.175 + 0.035 * fbm(vec2(x3 * 5.0, 3.0)) + 0.024 * noise(vec2(x3 * 110.0, 1.0)) * noise(vec2(x3 * 9.0, 4.0));
  return mix(c, vec3(0.09, 0.045, 0.12), layer(h3, u.y));
}

vec3 painting(vec2 u) {
  u += 0.0025 * vec2(noise(u * 55.0), noise(u * 55.0 + 7.1));
  float shore = -0.195;
  vec3 c;
  if (u.y > shore) {
    c = scene(u);
  } else {
    float depth = smoothstep(shore, shore - 0.12, u.y);
    vec2 r = vec2(u.x + 0.003 * depth * sin(u.y * 260.0 + uTime * 1.4), 2.0 * shore - u.y);
    c = scene(r) * vec3(0.62, 0.55, 0.72);
    c += 0.06 * smoothstep(0.6, 0.9, noise(vec2(u.x * 40.0, u.y * 400.0 + uTime * 0.5)));
    float hb = -0.31 + 0.03 * fbm(vec2(u.x * 4.0, 8.0));
    c = mix(c, vec3(0.06, 0.03, 0.08), layer(hb, u.y));
  }
  return c * (0.96 + 0.05 * noise(u * 320.0));
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdArch(vec2 p, float cx, float w, float h) {
  vec2 q = p - vec2(cx, BASE);
  float rh = h - w;
  return min(sdBox(q - vec2(0.0, rh * 0.5), vec2(w, rh * 0.5)), length(q - vec2(0.0, rh)) - w);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y / uFit;
  vec2 F = vec2(0.0, 0.02);
  vec2 w = (p - F) / uZoom + F;
  // the painting sits deeper than the frames, so it parallaxes as we push in
  vec2 u = (p - F) / pow(uZoom, 0.6) + F;
  float px = 1.0 / (uRes.y * uFit * uZoom);

  float r = length((p - vec2(0.0, -0.08)) * vec2(0.75, 1.0));
  vec3 col = mix(vec3(0.165, 0.071, 0.188), vec3(0.102), smoothstep(0.0, 0.5, r));
  col = mix(col, vec3(0.047), smoothstep(0.5, 1.05, r));

  float revC = smoothstep(0.0, 1.0, clamp(uReveal * 1.45, 0.0, 1.0));
  float revS = smoothstep(0.0, 1.0, clamp(uReveal * 1.45 - 0.45, 0.0, 1.0));

  float dL = sdArch(w, ${f(L.cx)}, ${f(L.w)}, ${f(L.h)});
  float dC = sdArch(w, ${f(C.cx)}, ${f(C.w)}, ${f(C.h)});
  float dR = sdArch(w, ${f(R.cx)}, ${f(R.w)}, ${f(R.h)});
  float dS = min(dL, dR);

  col += vec3(0.42, 0.0, 0.62) * 0.16 * exp(-max(min(dC, dS), 0.0) * uZoom * 10.0) * revC;

  float lvC = (w.y - BASE) / ${f(C.h)};
  float lvS = (w.y - BASE) / ${f(L.h)};
  float inC = (1.0 - smoothstep(-px, px, dC)) * (1.0 - smoothstep(revC * 1.1 - 0.08, revC * 1.1, lvC));
  float inS = (1.0 - smoothstep(-px, px, dS)) * (1.0 - smoothstep(revS * 1.1 - 0.08, revS * 1.1, lvS));
  float inside = max(inC, inS);

  if (inside > 0.001) {
    vec3 pc = painting(u);
    float lv = inC > inS ? lvC : lvS;
    pc *= mix(0.62, 1.0, smoothstep(0.0, 0.3, lv)) * mix(0.7, 1.0, smoothstep(1.0, 0.7, lv));
    col = mix(col, pc, inside);
  }

  float fw = 0.0032;
  float fC = (1.0 - smoothstep(fw - px, fw + px, abs(dC))) * (1.0 - smoothstep(revC * 1.15 - 0.05, revC * 1.15, lvC));
  float fS = (1.0 - smoothstep(fw - px, fw + px, abs(dS))) * (1.0 - smoothstep(revS * 1.15 - 0.05, revS * 1.15, lvS));
  col = mix(col, vec3(0.973, 0.961, 0.933), max(fC, fS));

  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 100.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`;

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    return null;
  }
  return s;
};

const zoomAt = (v) => Math.pow(10, easeInOut(progress(v, T.zoom[0], T.zoom[1])));

// Static stand-in when WebGL is unavailable
const Fallback = ({ revealed }) => {
  const ref = useRef(null);
  useEffect(() => {
    const unsub = stage.subscribe(() => {
      if (ref.current) ref.current.style.transform = `scale(${zoomAt(stage.get())})`;
    });
    return unsub;
  }, []);
  return (
    <div className="st-painting-fallback">
      <svg ref={ref} viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet" style={{ opacity: revealed ? 1 : 0 }}>
        <defs>
          <linearGradient id="st-dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a0f42" />
            <stop offset="45%" stopColor="#b3458f" />
            <stop offset="72%" stopColor="#f6a87a" />
            <stop offset="100%" stopColor="#3a1a48" />
          </linearGradient>
        </defs>
        {ARCHES.map((a, i) => (
          <path key={i} d={archPath(a, 100, 60, 38)} fill="url(#st-dusk)" stroke="#f8f5ee" strokeWidth="0.6" />
        ))}
      </svg>
    </div>
  );
};

const PaintingCanvas = ({ entered }) => {
  const canvasRef = useRef(null);
  const enteredAt = useRef(null);
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    if (entered && enteredAt.current === null) enteredAt.current = performance.now();
  }, [entered]);

  useEffect(() => {
    if (!webgl) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const loc = Object.fromEntries(
      ['uRes', 'uTime', 'uZoom', 'uFit', 'uReveal', 'uMouse'].map((n) => [n, gl.getUniformLocation(prog, n)])
    );

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      // cap the pixel count: the painting is soft, the fill rate is not free
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1.8e6 / Math.max(1, w * h)));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      gl.uniform1f(loc.uFit, Math.min(1, w / h / 0.98));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf;
    let frame = 0;
    let last = '';
    let parked = false;
    const t0 = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const v = stage.get();
      // fully covered by the work stage's bars from here on; draw one last
      // frame at the current zoom so a jump-scroll can't leave a stale one behind
      const covered = v > T.bars + 0.6;
      if (covered && parked) return;
      const finalFrame = covered;
      parked = covered;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const reveal = enteredAt.current === null ? 0 : Math.min(1, (now - enteredAt.current) / 1900);
      const zoom = zoomAt(v);
      // when nothing but the clouds is moving, every third frame is plenty
      const key = `${zoom.toFixed(4)}|${reveal}|${mouse.x.toFixed(3)}|${mouse.y.toFixed(3)}`;
      frame++;
      if (!finalFrame && key === last && frame % 3) return;
      last = key;
      gl.uniform1f(loc.uTime, (now - t0) / 1000);
      gl.uniform1f(loc.uZoom, zoom);
      gl.uniform1f(loc.uReveal, reveal);
      gl.uniform2f(loc.uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      // no loseContext(): StrictMode remounts onto this same canvas and would get the dead context back
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [webgl]);

  if (!webgl) return <Fallback revealed={entered} />;
  return <canvas ref={canvasRef} className="st-painting" aria-hidden="true" />;
};

export default PaintingCanvas;
