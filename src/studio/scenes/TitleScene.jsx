import React, { useId, useMemo } from 'react';
import { TITLE } from '../content.js';
import { useTween } from '../hooks.js';
import { clamp01, easeIn, easeOut, progress, T, useSvu } from '../scroll.js';

const MAX_BLUR = 20;

// Words of the headline, each letter keeping the class of the segment it came from
const splitWords = (segments) => {
  const words = [];
  let word = [];
  let gi = 0;
  for (const seg of segments) {
    for (const ch of seg.text) {
      if (ch === ' ') {
        if (word.length) words.push(word);
        word = [];
      } else word.push({ ch, className: seg.className ?? '', gi: gi++ });
    }
  }
  if (word.length) words.push(word);
  return words;
};

// The headline condenses out of a gooey blur on arrival and melts away again on scroll
const TitleScene = ({ entered, reduced }) => {
  const v = useSvu(-1, 1.3);
  const tween = useTween(entered, 1700);
  const enter = reduced ? 1 : tween;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const words = useMemo(() => splitWords(TITLE), []);

  const states = words.map((_, wi) => {
    const e = easeOut(clamp01((enter - wi * 0.09) / 0.55));
    const start = T.titleOut + wi * 0.06;
    const out = progress(v, start, start + 0.45);
    const blur = reduced ? 0 : Math.max(MAX_BLUR * (1 - e), MAX_BLUR * 1.1 * easeIn(out) + (out > 0 ? 2 : 0));
    return { blur, opacity: (0.3 + 0.7 * e) * (1 - out) };
  });

  const hidden = v > 1.1;

  return (
    <div className="st-layer st-title-layer" style={{ visibility: hidden ? 'hidden' : 'visible' }} aria-hidden={hidden}>
      <svg className="st-defs" aria-hidden="true">
        <defs>
          {states.map((s, i) => (
            <filter key={i} id={`${id}-goo-${i}`} x="-70%" y="-70%" width="240%" height="240%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation={s.blur.toFixed(2)} result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
            </filter>
          ))}
        </defs>
      </svg>
      <h1 className="st-title">
        {words.map((word, wi) => {
          const s = states[wi];
          return (
            <span
              key={wi}
              className="st-title-word"
              style={{ filter: s.blur > 0.3 ? `url(#${id}-goo-${wi})` : 'none', opacity: s.opacity }}
            >
              {word.map(({ ch, className, gi }) => {
                const y = 100 * (1 - easeOut(clamp01((enter - gi * 0.018) / 0.5)));
                return (
                  <span key={gi} className="st-mask">
                    <span className={`st-mask-inner ${className}`} style={{ transform: `translate3d(0, ${y}%, 0)` }}>
                      {ch}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </h1>
      <p className="st-title-kicker" style={{ opacity: enter * (1 - progress(v, 0.05, 0.35)) }}>
        Scroll to enter
      </p>
    </div>
  );
};

export default TitleScene;
