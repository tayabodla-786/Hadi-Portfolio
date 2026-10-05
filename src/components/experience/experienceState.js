// Tiny shared channel between DOM sections and the WebGL scene.
// Read every frame inside useFrame; written through these setters from UI events.
const state = {
  accent: null,
  burstAt: -Infinity,
  introAt: null,
};

export const experienceState = state;

export const setAccent = (hex) => {
  state.accent = hex;
};

export const triggerBurst = () => {
  state.burstAt = performance.now();
};

export const startIntro = () => {
  if (state.introAt === null) state.introAt = performance.now();
};
