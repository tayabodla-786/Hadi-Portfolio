export const TARGET_COUNT = 5;

export const entityVertex = /* glsl */ `
  attribute vec3 aT0;
  attribute vec3 aT1;
  attribute vec3 aT2;
  attribute vec3 aT3;
  attribute vec3 aT4;
  attribute vec3 aRand;
  attribute float aSeed;

  uniform float uTime;
  uniform float uMorph;
  uniform float uIntro;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform float uRepel;
  uniform float uRepelRadius;
  uniform vec3 uBurstPos;
  uniform float uBurst;
  uniform vec3 uPal[15];
  uniform vec3 uAccent;
  uniform float uAccentMix;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }

  // Each target gets its own life: the name ripples, planet spins, galaxy swirls,
  // terrain rolls and the vortex drains faster toward its core.
  vec3 target(float i) {
    if (i < 0.5) {
      vec3 p = aT0;
      p.z += sin(p.x * 0.7 + uTime * 1.2) * 0.12;
      return p;
    }
    if (i < 1.5) {
      vec3 p = rotY(aT1, uTime * 0.18);
      return rotZ(rotX(p, 0.38), 0.28);
    }
    if (i < 2.5) {
      vec3 p = rotY(aT2, uTime * 0.12);
      return rotX(p, 1.05);
    }
    if (i < 3.5) {
      vec3 p = aT3;
      p.y = sin(p.x * 0.55 + uTime * 0.8) * 0.45 + sin(p.z * 0.9 + uTime * 0.6) * 0.3 + sin((p.x + p.z) * 1.4 + uTime * 1.3) * 0.08;
      return rotX(p, 0.18);
    }
    vec3 p = aT4;
    float r = length(p.xz);
    p = rotY(p, uTime * (1.1 / (r + 0.3)));
    return rotX(p, 1.15);
  }

  vec3 palette(float i) {
    int base = int(i + 0.5) * 3;
    if (aSeed < 0.55) return uPal[base];
    if (aSeed < 0.85) return uPal[base + 1];
    return uPal[base + 2];
  }

  void main() {
    float m = clamp(uMorph, 0.0, 4.0);
    float i0 = min(floor(m), 3.0);
    float f = m - i0;
    // Staggered hand-off: particles leave one shape at different moments
    float k = smoothstep(0.0, 1.0, clamp((f - aSeed * 0.35) / 0.65, 0.0, 1.0));

    vec3 p = mix(target(i0), target(i0 + 1.0), k);
    // Scatter mid-flight, then regroup
    p += aRand * sin(k * 3.14159) * 1.6;
    // Idle shimmer
    p += vec3(sin(uTime * 0.9 + aSeed * 40.0), cos(uTime * 0.7 + aSeed * 31.0), sin(uTime * 0.8 + aSeed * 17.0)) * 0.025;
    // Intro: assemble out of a wide cloud
    p = mix(aRand * 14.0 + vec3(0.0, 0.0, 4.0), p, uIntro);

    vec4 world = modelMatrix * vec4(p, 1.0);

    vec2 d = world.xy - uMouse.xy;
    float dist = length(d);
    world.xy += normalize(d + 1e-5) * smoothstep(uRepelRadius, 0.0, dist) * 0.7 * uRepel;

    vec3 bd = world.xyz - uBurstPos;
    float bl = length(bd);
    world.xyz += normalize(bd + 1e-5) * uBurst * 2.6 * exp(-bl * 0.55);

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * (0.35 + aSeed) * uPixelRatio / -mv.z, 18.0 * uPixelRatio);

    vec3 col = mix(palette(i0), palette(i0 + 1.0), k);
    col = mix(col, uAccent, uAccentMix * step(0.35, aSeed));
    // Particles pushed by the cursor or shockwave flare up
    col += smoothstep(uRepelRadius, 0.0, dist) * uRepel * 0.35 + uBurst * exp(-bl * 0.55) * 0.5;
    vColor = col;
    vAlpha = (0.55 + 0.45 * sin(uTime * 2.0 + aSeed * 50.0)) * uIntro;
  }
`;

export const entityFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
  }
`;

export const starVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScroll;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Parallax: deeper stars drift slower with scroll
    p.y = mod(p.y + uScroll * (0.6 + aSeed * 1.4) + 20.0, 40.0) - 20.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 + aSeed * 2.0) * uPixelRatio;
    vAlpha = 0.25 + 0.5 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed * 2.0) + aSeed * 90.0));
  }
`;

export const starFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(0.75, 0.8, 1.0), vAlpha * smoothstep(0.5, 0.0, d));
  }
`;
