import React from 'react';
import Mask from './Mask.jsx';
import { STATEMENT, STATEMENT_ACCENT } from '../content.js';
import { rise, T, useSvu } from '../scroll.js';

const StatementScene = () => {
  const v = useSvu(0.8, 2.9);
  const { in: start, out } = T.statement;
  const hidden = v < start - 0.05 || v > out[1] + 0.2;
  let k = 0;

  return (
    <div className="st-layer st-center" style={{ visibility: hidden ? 'hidden' : 'visible' }} aria-hidden={hidden}>
      <p className="st-statement">
        {STATEMENT.map((lines, gi) => (
          <span key={gi} className={`st-statement-group ${gi ? 'is-indent' : ''}`}>
            {lines.map((words, li) => (
              <span key={li} className="st-statement-line">
                {words.map((word) => {
                  const i = k++;
                  const a = start + i * 0.045;
                  const y = rise(v, a, a + 0.4, out[0] + i * 0.012, out[1] + i * 0.012);
                  return (
                    <Mask key={word + i} y={y} className={STATEMENT_ACCENT.has(word) ? 'is-lilac' : ''}>
                      {word}
                    </Mask>
                  );
                })}
              </span>
            ))}
          </span>
        ))}
      </p>
    </div>
  );
};

export default StatementScene;
