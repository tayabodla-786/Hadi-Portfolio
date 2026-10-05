export const cardVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBend;
  uniform float uHover;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    // Curve the screen slightly away from the viewer
    p.z -= p.x * p.x * uBend;
    p.z += sin(p.y * 4.0 - uTime * 3.0) * 0.015 * uHover;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const cardFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uHover;
  uniform float uActive;
  uniform float uBack;
  uniform float uFade;
  uniform vec3 uTint;
  uniform vec2 uSize;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = sdRoundBox(p, uSize * 0.5, 0.16);
    float alpha = 1.0 - smoothstep(-0.012, 0.0, d);
    alpha *= uFade;
    if (alpha <= 0.001) discard;
    float rim = 1.0 - smoothstep(0.0, 0.06, -d);

    // Back plate: gives the screen a visible thickness when seen at an angle
    if (uBack > 0.5) {
      gl_FragColor = vec4(uTint * 0.2 + rim * uTint * 0.55, alpha);
      return;
    }

    float t = floor(uTime * 14.0);
    float strength = 0.18 + uHover * 0.8 + (1.0 - uActive) * 0.35;
    float burst = step(1.0 - 0.07 * (1.0 + strength * 3.0), hash(vec2(t, 3.1)));

    // Horizontal band tearing
    vec2 uv = vUv;
    float band = floor(vUv.y * 22.0);
    float r = hash(vec2(band, t));
    uv.x += (r - 0.5) * 0.14 * burst * step(0.55, r);
    uv.x += sin(vUv.y * 90.0 + uTime * 20.0) * 0.0015 * uHover;

    // Chromatic aberration
    float split = 0.003 + strength * 0.006 + burst * 0.018;
    vec3 col;
    col.r = texture2D(uMap, uv + vec2(split, 0.0)).r;
    col.g = texture2D(uMap, uv).g;
    col.b = texture2D(uMap, uv - vec2(split, 0.0)).b;

    vec3 wash = mix(uTint * 1.1, uTint * 0.25, vUv.x * 0.6 + (1.0 - vUv.y) * 0.4);
    col = mix(col, col * 0.6 + wash * 0.55, 0.4);

    col *= 0.88 + 0.12 * sin(vUv.y * 700.0 + uTime * 6.0);
    col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.07;

    float s = vUv.x + vUv.y * 0.35 - fract(uTime * 0.12) * 2.4 + 0.5;
    col += exp(-s * s * 60.0) * 0.12 * (0.4 + uHover);

    vec2 v = vUv - 0.5;
    col *= 1.0 - dot(v, v) * 0.9;
    col *= 0.5 + 0.5 * uActive + 0.1 * uHover;
    col += rim * uTint * (0.5 + 0.5 * uHover);

    gl_FragColor = vec4(col, alpha * (0.72 + 0.28 * uActive));
  }
`;

export const particleVertex = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831;
    p.x += sin(uTime * 0.35 + s) * 0.12;
    p.y += cos(uTime * 0.25 + s * 1.3) * 0.1;
    p.z += sin(uTime * 0.3 + s * 0.7) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Clamped so particles the camera flies through don't fill the screen
    gl_PointSize = min(uSize * aScale * uPixelRatio / -mv.z, 36.0 * uPixelRatio);
    vColor = aColor;
    vAlpha = 0.55 + 0.45 * sin(uTime * 1.5 + s * 3.0);
  }
`;

export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.3, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * (0.8 + 0.4 * smoothstep(0.35, 0.0, d)), a * vAlpha);
  }
`;
