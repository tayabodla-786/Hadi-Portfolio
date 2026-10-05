import React, { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from '../../components/Navbar.jsx';
import Hero from '../../components/Hero.jsx';
import Services from '../../components/Services.jsx';
import About from '../../components/About.jsx';
import Work3D from '../../components/Work3D.jsx';
import Projects from '../../components/Projects.jsx';
import MarqueeQuote from '../../components/MarqueeQuote.jsx';
import Contact from '../../components/Contact.jsx';
import Footer from '../../components/Footer.jsx';
import Experience from '../../components/experience/Experience.jsx';
import { triggerBurst } from '../../components/experience/experienceState.js';
import Preloader from '../../components/ui/Preloader.jsx';
import Cursor from '../../components/ui/Cursor.jsx';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2
    });
    // Shared so sections like Work3D can drive programmatic scrolls
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // Content swings up out of depth as it scrolls into view
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.set('[data-reveal]', { opacity: 0 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, y: 60, rotateX: -28, transformOrigin: '50% 100%' },
            { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' }
          ),
      });
    });
    return () => ctx.revert();
  }, []);

  // Clicking empty space sends a shockwave through the particle field
  useEffect(() => {
    const onDown = (e) => {
      if (e.target.closest('a, button, input, textarea, [role="button"], #work')) return;
      triggerBurst();
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  return (
    <div className="relative w-full min-h-screen text-white selection:bg-[#ff3fa4] selection:text-white">
      <Preloader />
      <Experience />
      <Cursor />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Services />
        <About />
        <Work3D />
        <Projects />
        <MarqueeQuote />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
