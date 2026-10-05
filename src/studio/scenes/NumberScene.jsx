import React, { useId, useState } from 'react';
import Mask from './Mask.jsx';
import { COUNT_CAPTION, FLANK_LEFT, FLANK_RIGHT, PROJECT_COUNT } from '../content.js';
import { playNote } from '../hooks.js';
import { easeIn, progress, rise, T, useSvu } from '../scroll.js';

// "04" built from quarter rings and bars on a grid of 110px cells
const S = 110;
const G = 10;
const D2 = 2 * S + G + 22;
const at = (col, row, dx = 0) => [dx + col * (S + G), row * (S + G)];
const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const ROT = { tl: 0, tr: 1, br: 2, bl: 3 };

const square = (x, y) => rect(x, y, S, S);
const halfBar = (x, y, side) => rect(side === 'l' ? x : x + S / 2, y, S / 2, S);
// Quarter ring whose outer curve sits on the given corner of the cell
const quarterRing = (x, y, corner) => {
  const pt = (lx, ly) => {
    let dx = lx - S / 2;
    let dy = ly - S / 2;
    for (let i = 0; i < ROT[corner]; i++) [dx, dy] = [-dy, dx];
    return `${x + S / 2 + dx} ${y + S / 2 + dy}`;
  };
  const ri = S / 2;
  return `M${pt(0, S)}A${S} ${S} 0 0 1 ${pt(S, 0)}L${pt(S, ri)}A${ri} ${ri} 0 0 0 ${pt(ri, S)}Z`;
};

const ZERO = (dx) => [
  [quarterRing, 0, 0, 'tl'],
  [quarterRing, 1, 0, 'tr'],
  [halfBar, 0, 1, 'l'],
  [halfBar, 1, 1, 'r'],
  [quarterRing, 0, 2, 'bl'],
  [quarterRing, 1, 2, 'br'],
].map(([fn, c, r, o]) => ({ d: fn(...at(c, r, dx), o), box: at(c, r, dx) }));

const DIGITS = {
  0: ZERO,
  1: (dx) => [
    [quarterRing, 0, 0, 'tl'],
    [halfBar, 1, 0, 'l'],
    [halfBar, 1, 1, 'l'],
    [halfBar, 1, 2, 'l'],
  ].map(([fn, c, r, o]) => ({ d: fn(...at(c, r, dx), o), box: at(c, r, dx) })),
  4: (dx) => [
    [halfBar, 0, 0, 'l'],
    [quarterRing, 0, 1, 'bl'],
    [halfBar, 1, 0, 'l'],
    [square, 1, 1],
    [halfBar, 1, 2, 'l'],
  ].map(([fn, c, r, o]) => ({ d: fn(...at(c, r, dx), o), box: at(c, r, dx) })),
};

const DIGITS_TEXT = String(PROJECT_COUNT).padStart(2, '0');
// Only some digits have cell glyphs; any other count is set in type instead
const CELLS = /^\d\d$/.test(DIGITS_TEXT) && [...DIGITS_TEXT].every((n) => DIGITS[n])
  ? [...DIGITS_TEXT].flatMap((n, i) => DIGITS[n](i * D2))
  : null;

const Cell = ({ cell, index, clipId, rise: y, transition, interactive }) => {
  const [hover, setHover] = useState(false);
  const [x, top] = cell.box;
  const shape = { transform: `translateY(${y}%)`, transformBox: 'fill-box', transition };
  return (
    <g clipPath={`url(#${clipId})`}>
      <g
        style={{
          transform: hover ? `rotate(${index % 2 ? 90 : -90}deg)` : 'none',
          transformBox: 'view-box',
          transformOrigin: `${x + S / 2}px ${top + S / 2}px`,
          transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <path d={cell.d} style={{ ...shape, fill: hover ? 'var(--c-signal)' : 'var(--c-paper)', transition: `${transition}, fill 140ms ease` }} />
      </g>
      <path
        d={rect(x, top, S, S)}
        fill="transparent"
        style={{ ...shape, cursor: 'pointer', pointerEvents: interactive ? 'auto' : 'none' }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onClick={() => playNote(index)}
      />
    </g>
  );
};

const Flank = ({ words, v, start, className }) => {
  const { out } = T.flank;
  return words.map((w, i) => {
    const a = start + i * 0.18;
    return (
      <Mask key={w} y={rise(v, a, a + 0.4, out[0], out[1])} className={className}>
        {w}
      </Mask>
    );
  });
};

const NumberScene = ({ reduced }) => {
  const v = useSvu(3.6, 6.2);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { in: inL, inRight: inR, out } = T.flank;
  const hidden = v < inL - 0.05 || v > out[1] + 0.1;
  const triggered = v > T.cellsIn;
  const exit = progress(v, out[0], out[1]);
  const label = `${PROJECT_COUNT} ${COUNT_CAPTION.toLowerCase()}`;

  return (
    <div className="st-layer st-center" style={{ visibility: hidden ? 'hidden' : 'visible' }} aria-hidden={hidden}>
      <div className="st-flank st-flank-left">
        <Flank words={FLANK_LEFT} v={v} start={inL} />
      </div>
      <div className="st-flank st-flank-right">
        <Flank words={FLANK_RIGHT} v={v} start={inR} />
      </div>

      <figure className="st-number">
        {!CELLS && (
          <Mask y={triggered ? 120 * easeIn(exit) : 120} className="st-number-text" style={{ transition: reduced ? 'none' : 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {DIGITS_TEXT}
          </Mask>
        )}
        {CELLS && (
        <svg viewBox={`0 0 ${D2 + 2 * S + G} ${3 * S + 2 * G}`} role="img" aria-label={label}>
          <defs>
            {CELLS.map((c, i) => (
              <clipPath key={i} id={`${id}-c${i}`}>
                <rect x={c.box[0] - 0.5} y={c.box[1] - 0.5} width={S + 1} height={S + 1} />
              </clipPath>
            ))}
          </defs>
          {CELLS.map((c, i) => {
            let y;
            let transition;
            if (exit > 0) {
              y = 120 * easeIn(exit);
              transition = 'transform 100ms linear';
            } else if (triggered) {
              y = 0;
              transition = reduced ? 'none' : `transform 800ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 55}ms`;
            } else {
              y = 120;
              transition = 'none';
            }
            return (
              <Cell
                key={i}
                cell={c}
                index={i}
                clipId={`${id}-c${i}`}
                rise={y}
                transition={transition}
                interactive={triggered && exit === 0}
              />
            );
          })}
        </svg>
        )}
        <figcaption>
          <Mask y={rise(v, T.cellsIn + 0.3, T.cellsIn + 0.7, out[0], out[1])}>{COUNT_CAPTION}</Mask>
        </figcaption>
      </figure>
    </div>
  );
};

export default NumberScene;
