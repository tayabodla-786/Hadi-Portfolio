import { useEffect, useState } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

let webgl;
export const hasWebGL = () => {
  if (webgl !== undefined) return webgl;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    webgl = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
};

// 0 → 1 over `duration` ms, starting once `on` turns true
export const useTween = (on, duration) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf;
    let start;
    const tick = (now) => {
      start ??= now;
      const k = Math.min(1, (now - start) / duration);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, duration]);
  return t;
};

let audio;
const STEPS = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];

// A soft pentatonic pluck for the clickable number cells
export const playNote = (i) => {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const now = audio.currentTime;
    const freq = 220 * Math.pow(2, STEPS[i % STEPS.length] / 12);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    gain.connect(audio.destination);
    ['sine', 'triangle'].forEach((type, k) => {
      const osc = audio.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * (k ? 2 : 1);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  } catch {
    /* audio is a nicety */
  }
};
