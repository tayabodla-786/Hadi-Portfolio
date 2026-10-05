import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

const Footer = () => {
  return (
    <footer className="relative w-full border-t border-white/10 py-10 px-6 sm:px-12 lg:px-20 bg-[#050609]/60 backdrop-blur-md text-white/60 hud-font text-xs uppercase tracking-[0.2em]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-white">
          <span className="font-semibold">Tayyab</span>
          <svg
            width="14"
            height="15"
            viewBox="0 0 18 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.8223 15.8947C4.8223 17.1447 3.80903 18.1579 2.5591 18.1579C1.30917 18.1579 0.295898 17.1447 0.295898 15.8947C0.295898 14.6448 1.30917 13.6315 2.5591 13.6315C3.03072 13.6315 3.46865 13.7758 3.83116 14.0226L7.68335 10.1705C7.82839 10.4184 8.03556 10.6255 8.28349 10.7706L4.43128 14.6227C4.67806 14.9852 4.8223 15.4231 4.8223 15.8947ZM9.96573 10.771L13.8185 14.6238C13.5717 14.9863 13.4274 15.4243 13.4274 15.8959C13.4274 17.1458 14.4407 18.1591 15.6906 18.1591C16.9406 18.1591 17.9538 17.1458 17.9538 15.8959C17.9538 14.6459 16.9406 13.6327 15.6906 13.6327C15.219 13.6327 14.7811 13.7769 14.4186 14.0237L10.5662 10.1712C10.421 10.419 10.2137 10.6261 9.96573 10.771ZM10.5667 8.48745L14.4188 4.63535C14.7814 4.88215 15.2193 5.02641 15.6909 5.02641C16.9408 5.02641 17.9541 4.01313 17.9541 2.7632C17.9541 1.51327 16.9408 0.5 15.6909 0.5C14.441 0.5 13.4277 1.51327 13.4277 2.7632C13.4277 3.23481 13.5719 3.67272 13.8187 4.03522L9.96657 7.88729C10.2145 8.03234 10.4216 8.23951 10.5667 8.48745ZM8.28271 7.88768L4.43125 4.03614C4.67805 3.67362 4.8223 3.23569 4.8223 2.76408C4.8223 1.51414 3.80903 0.500873 2.5591 0.500873C1.30917 0.500873 0.295898 1.51414 0.295898 2.76408C0.295898 4.01401 1.30917 5.02728 2.5591 5.02728C3.0307 5.02728 3.46861 4.88303 3.83112 4.63625L7.68289 8.4881C7.8278 8.24009 8.03486 8.03283 8.28271 7.88768Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-light text-white/80">Imran</span>
        </div>

        <p className="text-center text-white/40 text-[11px]">
          &copy; {new Date().getFullYear()} Tayyab Imran. Rendered in real time with WebGL.
        </p>

        <ScrollLink
          to="hero"
          smooth={true}
          duration={800}
          className="hover:text-[#3ee8ff] transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Back to Top</span>
          <span>&uarr;</span>
        </ScrollLink>
      </div>
    </footer>
  );
};

export default Footer;