import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link as ScrollLink } from 'react-scroll';
import { heroData } from '../data/portfolioData.js';
import ScrambleText from './ui/ScrambleText.jsx';

const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Starts as the preloader lifts and the particle name assembles
      gsap.fromTo(
        '[data-hero-in]',
        { opacity: 0, y: 30, rotateX: -35 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 2.1 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative w-full min-h-screen flex flex-col justify-between pt-28 pb-10 px-6 sm:px-12 lg:px-20 select-none hud-font [perspective:900px]"
    >
      {/* The name itself is drawn by the particle field behind this section */}
      <h1 className="sr-only">Tayyab Imran — Full-Stack Developer</h1>

      <div className="flex items-start justify-between text-[10px] sm:text-xs tracking-[0.3em] text-white/50 uppercase">
        <p data-hero-in>
          <span className="text-[#3ee8ff]">●</span> Signal acquired
          <br />
          <span className="text-white/30">31.52°N / 74.35°E</span>
        </p>
        <p data-hero-in className="text-right">
          Full-stack developer
          <br />
          <span className="text-white/30">Portfolio v.26</span>
        </p>
      </div>

      <div className="pointer-events-none flex-1" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-7 space-y-4">
          <p data-hero-in className="ux-step text-white/50"><em>/01 Introduction</em></p>
          <ScrambleText
            as="h2"
            data-hero-in
            text="FULL-STACK PRODUCTS WITH MOTION, CLARITY & PURPOSE."
            duration={1400}
            className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.02] tracking-tight max-w-3xl"
          />
          <p data-hero-in className="text-sm text-white/60 leading-relaxed max-w-md font-sans">
            {heroData.description}
          </p>
        </div>

        <div className="md:col-span-5 flex flex-col items-start md:items-end gap-6">
          <div data-hero-in className="flex flex-wrap items-center gap-3">
            <a href={heroData.resumeLink} download="Tayyab_Imran_Resume.txt" className="btn-neon btn-neon--solid">
              Download CV
            </a>
            <ScrollLink to="work" smooth offset={0} duration={900} className="btn-neon cursor-pointer">
              Enter the archive &rarr;
            </ScrollLink>
          </div>
          <p data-hero-in className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
            Move to disturb · click to shock
          </p>
        </div>
      </div>

      <div data-hero-in className="scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
};

export default Hero;
