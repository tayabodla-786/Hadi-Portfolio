import React, { useEffect, useState } from 'react';
import Mark from './Mark.jsx';
import { EMAIL, LOCATION, NAME } from './content.js';
import { NAV_TARGETS, scrollToSvu } from './scroll.js';

const NAV = [
  { label: 'Work', to: NAV_TARGETS.work },
  { label: 'Services', to: NAV_TARGETS.services },
  { label: 'About', to: NAV_TARGETS.about },
];

// Label that rolls up to a purple copy of itself on hover
export const Roll = ({ children }) => (
  <>
    <span className="st-roll-a">{children}</span>
    <span className="st-roll-b" aria-hidden="true">
      {children}
    </span>
  </>
);

const go = (to, after) => (e) => {
  e.preventDefault();
  after?.();
  scrollToSvu(to, 2.2);
};

const NavLink = ({ item, className, style, onNavigate }) => (
  <a className={className} style={style} href={`#${item.label.toLowerCase()}`} onClick={go(item.to, onNavigate)}>
    <Roll>{item.label}</Roll>
  </a>
);

const Header = ({ entered }) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const lenis = window.__lenis;
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const delay = (ms) => ({ transitionDelay: `${ms}ms` });

  return (
    <header className={`st-header ${entered ? 'is-entered' : ''} ${open ? 'is-open' : ''}`}>
      <div className="st-header-row">
        <a className="st-mark-link st-in" style={delay(80)} href="#top" aria-label={`${NAME}, back to top`} onClick={go(0, close)}>
          <Mark />
        </a>

        <a className="st-wordmark st-in" style={delay(180)} href="#top" onClick={go(0, close)}>
          <span className="sr-only">{NAME}</span>
          <span aria-hidden="true" className="st-wordmark-letters">
            {[...NAME].map((ch, i) => (
              <span key={i} className="st-wm-ch" style={{ '--i': i }}>
                <span>{ch === ' ' ? ' ' : ch}</span>
                <span>{ch === ' ' ? ' ' : ch}</span>
              </span>
            ))}
          </span>
        </a>

        <nav className="st-nav" aria-label="Primary">
          {NAV.map((item, i) => (
            <NavLink key={item.label} item={item} className="st-roll st-in" style={delay(280 + i * 70)} />
          ))}
          <a className="st-pill st-in" style={delay(560)} href="#contact" onClick={go(NAV_TARGETS.contact)}>
            <Roll>Let&apos;s talk</Roll>
          </a>
        </nav>

        <button
          type="button"
          className="st-burger st-in"
          style={delay(280)}
          aria-expanded={open}
          aria-controls="st-drawer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>

      <div id="st-drawer" className="st-drawer" aria-hidden={!open}>
        <div className="st-drawer-cols" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} style={{ '--i': i }} />
          ))}
        </div>
        <div className="st-drawer-body">
          <p className="st-drawer-socials">(Menu)</p>
          <nav className="st-drawer-nav" aria-label="Primary mobile">
            {[...NAV, { label: 'Contact', to: NAV_TARGETS.contact }].map((item, i) => (
              <span key={item.label} className="st-mask">
                <NavLink item={item} className="st-roll st-drawer-link" style={{ '--i': i }} onNavigate={close} />
              </span>
            ))}
          </nav>
          <address className="st-drawer-address">
            <a href={`mailto:${EMAIL}`} tabIndex={open ? 0 : -1}>
              {EMAIL}
            </a>
            <span>Based in {LOCATION.label}</span>
          </address>
        </div>
      </div>
    </header>
  );
};

export default Header;
