import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SectionHeader = ({ subTitle, title, text, textColor = "text-black", withScrollTrigger = true }) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const words = title.includes(" ") ? title.split(" ") : [title];

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const animation = gsap.fromTo(
      content,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'circ.out',
        immediateRender: false,
        scrollTrigger: withScrollTrigger
          ? {
              trigger: containerRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          : undefined
      }
    );

    return () => animation.kill();
  }, [withScrollTrigger]);

  return (
    <div ref={containerRef} className="mb-12">
      <div style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}>
        <div ref={contentRef} className="flex flex-col justify-center gap-6 sm:gap-10 pt-10">
          <p className={`text-xs sm:text-sm font-light tracking-[0.5rem] uppercase px-4 sm:px-10 ${textColor}`}>
            {subTitle}
          </p>
          <div className="px-4 sm:px-10">
            <h5 className={`flex flex-col gap-4 uppercase banner-text-responsive md:block ${textColor}`}>
              {words.map((word, i) => (
                <span key={i}>{word} </span>
              ))}
            </h5>
          </div>
        </div>
      </div>
      {text && (
        <div className="section-header-copy px-4 sm:px-10 mt-6 ml-auto max-w-3xl text-left md:text-right">
          <p className="text-base sm:text-lg lg:text-xl font-light leading-relaxed text-[#6e6e73]">
            {text}
          </p>
        </div>
      )}
      <div className="relative px-4 sm:px-10 mt-8 mb-12">
        <div className="absolute inset-x-0 border-t border-black/10" />
      </div>
    </div>
  );
};

export default SectionHeader;
