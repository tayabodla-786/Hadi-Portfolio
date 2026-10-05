import React, { useLayoutEffect, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FaJs,           // JavaScript
  FaReact,        // React
  FaNodeJs        // Node.js
} from 'react-icons/fa';
import { 
  SiMongodb,      // MongoDB
  SiNextdotjs,    // Next.js
  SiExpress       // Express.js
} from 'react-icons/si';

gsap.registerPlugin(ScrollTrigger);

const skills = [
  {
    name: 'JavaScript',
    icon: <FaJs />,
    color: 'text-yellow-400',
    border: 'hover:border-yellow-400'
  },
  {
    name: 'React',
    icon: <FaReact />,
    color: 'text-cyan-400',
    border: 'hover:border-cyan-400'
  },
  {
    name: 'MongoDB',
    icon: <SiMongodb />,
    color: 'text-green-500',
    border: 'hover:border-green-500'
  },
  {
    name: 'Next.js',
    icon: <SiNextdotjs />,
    color: 'text-white',
    border: 'hover:border-white'
  },
  {
    name: 'Node.js',
    icon: <FaNodeJs />,
    color: 'text-green-600',
    border: 'hover:border-green-600'
  },
  {
    name: 'Express.js',
    icon: <SiExpress />,
    color: 'text-gray-300',
    border: 'hover:border-gray-300'
  },
];

const Skills = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const cards = cardsRef.current;
    if (header) gsap.set(header, { y: 30, opacity: 0 });
    if (cards?.children?.length) gsap.set(cards.children, { y: 40, opacity: 0 });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;
    if (!section || !header || !cards) return;

    const ctx = gsap.context(() => {
      gsap.to(header, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' },
      });
      gsap.to(cards.children, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none none' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="py-20 px-4 bg-slate-800/20">
      <div className="max-w-7xl mx-auto">

        <div ref={headerRef} className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-2 text-teal-400 mb-4">
            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Skills</h2>
          </div>
        </div>

        <div ref={cardsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {skills.map((skill, index) => (
            <div
              key={index}
              className={`bg-slate-900/50 p-8 rounded-xl border border-slate-800 transition-all duration-300 group flex flex-col items-center gap-4 cursor-default ${skill.border} hover:-translate-y-2`}
            >
              <div className={`text-4xl md:text-5xl ${skill.color} filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                {skill.icon}
              </div>
              <span className="text-slate-400 font-medium text-sm md:text-base group-hover:text-white transition-colors">
                {skill.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Skills;