import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { servicesData } from '../data/portfolioData.js';
import { setAccent } from './experience/experienceState.js';
import ScrambleText from './ui/ScrambleText.jsx';
import TiltCard from './ui/TiltCard.jsx';

const Services = () => {
  const [active, setActive] = useState(0);

  const focus = (index) => {
    setActive(index);
    setAccent(servicesData[index].color);
  };

  return (
    <section
      id="services"
      className="relative min-h-screen py-28 px-6 sm:px-12 lg:px-20 text-white select-none hud-font"
      onPointerLeave={() => setAccent(null)}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 space-y-10">
          <header data-reveal className="space-y-3">
            <p className="ux-step text-[#3ee8ff]"><em>/02 Services</em></p>
            <ScrambleText as="h2" text="WHAT I BUILD" className="glitch-soft text-4xl sm:text-6xl font-bold tracking-tight" />
            <p className="text-sm text-white/55 max-w-md font-sans">
              Hover a capability to tune the planet. Every orbit is a discipline I ship end-to-end.
            </p>
          </header>

          <div className="space-y-3 [perspective:1200px]">
            {servicesData.map((service, index) => {
              const isActive = active === index;
              return (
                <TiltCard
                  key={service.id}
                  data-reveal
                  max={6}
                  className={`hud-panel cursor-default ${isActive ? 'hud-panel--active' : ''}`}
                  style={{ '--accent': service.color }}
                  onPointerEnter={() => focus(index)}
                  onFocus={() => focus(index)}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-4">
                    <span className="hud-icon" style={{ color: service.color }}>
                      <Icon icon={service.icon} className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] text-white/40">ORBIT 0{index + 1}</p>
                      <h3 className="text-lg sm:text-xl font-semibold tracking-wide">{service.title}</h3>
                    </div>
                    <Icon
                      icon="lucide:plus"
                      className={`size-4 text-white/50 transition-transform duration-500 ${isActive ? 'rotate-45' : ''}`}
                    />
                  </div>

                  <div className={`hud-panel__body ${isActive ? 'hud-panel__body--open' : ''}`}>
                    <div>
                      <p className="text-sm text-white/65 leading-relaxed font-sans pt-4">{service.description}</p>
                      <div className="grid sm:grid-cols-3 gap-3 pt-4">
                        {service.items.map((item) => (
                          <div key={item.title} className="hud-chip">
                            <p className="text-xs font-semibold text-white/90">{item.title}</p>
                            <p className="text-[11px] text-white/45 leading-snug font-sans pt-1">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
