import React from 'react';
import Mask from './Mask.jsx';
import Globe from './Globe.jsx';
import { CONTACT_LINES, EMAIL, LOCATION } from '../content.js';
import { NAV_TARGETS, progress, rise, scrollToSvu, T, useSvu } from '../scroll.js';

const LINKS = [
  { label: 'Work', to: NAV_TARGETS.work },
  { label: 'Services', to: NAV_TARGETS.services },
  { label: 'About', to: NAV_TARGETS.about },
  { label: 'Contact', href: `mailto:${EMAIL}` },
];

const ContactScene = () => {
  const v = useSvu(T.contact - 0.5, T.end + 0.5);
  const start = T.contact;
  const on = v > start - 0.05;
  const globeIn = progress(v, start + 0.5, start + 1);

  return (
    <div className="st-layer st-contact" style={{ visibility: on ? 'visible' : 'hidden', opacity: on ? 1 : 0 }} aria-hidden={!on}>
      <h2 className="sr-only">Contact</h2>
      <div className="st-contact-menu">
        <nav aria-label="Footer menu">
          <ul>
            {LINKS.map((l, i) => {
              const a = start + 0.08 * i;
              const props = l.to !== undefined
                ? { href: `#${l.label.toLowerCase()}`, onClick: (e) => { e.preventDefault(); scrollToSvu(l.to, 2.4); } }
                : { href: l.href };
              return (
                <li key={l.label}>
                  <Mask y={rise(v, a, a + 0.45)}>
                    <a className="st-contact-link" tabIndex={on ? 0 : -1} {...props}>
                      {l.label}
                    </a>
                  </Mask>
                </li>
              );
            })}
          </ul>
        </nav>
        <address>
          <ul>
            {CONTACT_LINES.map((c, i) => {
              const a = start + 0.45 + 0.05 * i;
              return (
                <li key={c.line}>
                  <Mask y={rise(v, a, a + 0.35)}>
                    {c.href ? (
                      <a href={c.href} tabIndex={on ? 0 : -1}>
                        {c.line}
                      </a>
                    ) : (
                      c.line
                    )}
                  </Mask>
                </li>
              );
            })}
          </ul>
          <div className="st-contact-socials" style={{ opacity: progress(v, start + 0.7, start + 1) }}>
            <a className="st-link" href={`mailto:${EMAIL}`} tabIndex={on ? 0 : -1}>
              Start a project <span aria-hidden="true">↗</span>
            </a>
          </div>
        </address>
      </div>
      <p className="st-contact-vertical" style={{ opacity: progress(v, start + 0.6, start + 1) }}>
        Proudly building from {LOCATION.label}
      </p>
      <div className="st-contact-globe" style={{ opacity: globeIn }}>
        <Globe active={v > start - 0.3} />
      </div>
    </div>
  );
};

export default ContactScene;
