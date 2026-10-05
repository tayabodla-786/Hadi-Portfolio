import React from 'react';
import { Icon } from '@iconify/react';
import { contactInfo, socialLinks } from '../data/portfolioData.js';
import ScrambleText from './ui/ScrambleText.jsx';
import TiltCard from './ui/TiltCard.jsx';

const echoes = ['STILL HERE?!', 'SERIOUS?', 'STRONG.'];

const Contact = () => {
  return (
    <section id="contact" className="relative min-h-screen py-28 px-6 sm:px-12 lg:px-20 text-white hud-font">
      <div className="max-w-7xl mx-auto space-y-16">
        <header data-reveal className="space-y-2 text-center">
          <p className="ux-step text-[#ff3fa4]"><em>/05 Contact</em></p>
          {echoes.map((line, i) => (
            <p
              key={line}
              className="text-3xl sm:text-6xl lg:text-7xl font-bold tracking-tight transition-colors duration-300 hover:text-white/70"
              style={{ color: `rgba(255,255,255,${0.08 + i * 0.1})` }}
            >
              {line}
            </p>
          ))}
          <ScrambleText
            as="h2"
            text="LET'S TALK"
            duration={1100}
            className="glitch-soft block text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-[#ff3fa4] drop-shadow-[0_0_40px_rgba(255,63,164,0.45)]"
          />
          <p className="text-sm text-white/55 font-sans max-w-md mx-auto pt-4 whitespace-pre-line">{contactInfo.text}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 [perspective:1200px]">
          <TiltCard data-reveal className="hud-panel md:col-span-7 space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.3em] text-white/40">// DIRECT CHANNEL</p>
              <a
                href={`mailto:${contactInfo.email}`}
                className="block text-xl sm:text-3xl lg:text-4xl font-semibold break-all hover:text-[#3ee8ff] transition-colors"
              >
                {contactInfo.email}
              </a>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.3em] text-white/40">// VOICE LINE</p>
              <a href={`tel:${contactInfo.phone}`} className="block text-lg sm:text-2xl text-white/80 hover:text-white transition-colors">
                {contactInfo.phone}
              </a>
            </div>
            <a href={`mailto:${contactInfo.email}`} className="btn-neon btn-neon--solid inline-flex">
              Start a project &rarr;
            </a>
          </TiltCard>

          <div className="md:col-span-5 grid gap-4">
            {socialLinks.map((link) => (
              <TiltCard key={link.name} data-reveal className="hud-panel !p-0">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-5 text-sm font-semibold tracking-[0.2em] uppercase group"
                >
                  <span>{link.name}</span>
                  <Icon
                    icon="lucide:arrow-up-right"
                    className="size-5 text-white/40 group-hover:text-[#3ee8ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                  />
                </a>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
