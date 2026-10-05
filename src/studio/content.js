export const NAME = 'Hadi Shareef';
export const ROLE = 'Full-Stack Developer';
export const EMAIL = 'hadifc557@gmail.com';

// Hero headline; segments let a single word carry its own styling
export const TITLE = [
  { text: 'Code with purpose, built to ' },
  { text: 'last', className: 'is-light' },
  { text: '.', className: 'is-accent' },
];

// Two indented groups of lines, revealed word by word
export const STATEMENT = [
  [
    ['A', 'full-stack', 'developer'],
    ['turning', 'ideas', 'into', 'products'],
  ],
  [
    ['Behind', 'the', 'scene,'],
    ['beyond', 'the', 'screen.'],
  ],
];
export const STATEMENT_ACCENT = new Set(['beyond']);

export const SERVICES = ['Web Applications', 'REST APIs', 'Dashboards', 'Authentication', 'Databases', 'Deployment'];

export const FLANK_LEFT = ['Building', 'Reliable'];
export const FLANK_RIGHT = ['Full-Stack', 'Products'];

export const DISCIPLINES = ['Design', 'Develop', 'Deploy', 'Scale'];

// Pin on the contact globe; swap in your city's coordinates to be more precise
export const LOCATION = { label: 'Pakistan', lat: 30.3753, lon: 69.3451 };

// Client sites shown in the work gallery. `status: 'soon'` marks a site that is built but not yet public.
export const PROJECTS = [
  {
    id: 'maklin',
    name: 'Maklin Christman',
    tagline: 'Nationwide Real Estate Agent Matching',
    description:
      'A real estate platform that matches buyers, sellers and investors with top local agents across the United States, with property listings, search filters and an inquiry flow.',
    href: 'https://maklinchristman.com/',
    image: '/projects/maklin-christman.jpg',
    tags: ['Next.js', 'React', 'Property Search', 'Responsive'],
  },
  {
    id: 'maklin-admin',
    name: 'Maklin Admin',
    tagline: 'Property Management Panel',
    description:
      'The secure back office for Maklin Christman: a session-based secret unlocks tools to manage the property listings shown on the public site.',
    href: 'https://admin.maklinchristman.com/',
    image: '/projects/maklin-admin.jpg',
    tags: ['Next.js', 'React', 'Admin Panel', 'Secure Access'],
  },
  {
    id: '2dw',
    name: '2 Designing Women',
    tagline: 'Interior Design & Remodeling Studio',
    description:
      'A new website for a Marlborough, MA interior design and remodeling showroom in business since 1977. Built and launching soon.',
    href: 'https://2designingwomen.com/',
    image: '/projects/2-designing-women.jpg',
    tags: ['Next.js', 'React', 'Brand Website', 'Showroom'],
    status: 'soon',
  },
  {
    id: 'dental',
    name: 'Dental Studio',
    tagline: 'Dental Clinic Website',
    description:
      'A clinic website for The Dental Studio in Bahawalpur, with services, doctors, news, contact details and appointment booking.',
    href: 'https://dentalstudio.hubtech.pk/#/',
    image: '/projects/dental-studio.jpg',
    tags: ['WordPress', 'Elementor', 'PHP', 'Appointments'],
  },
];

export const PROJECT_COUNT = PROJECTS.length;
export const COUNT_CAPTION = 'Client projects built';

export const CONTACT_LINES = [
  { line: EMAIL, href: `mailto:${EMAIL}` },
  { line: `Based in ${LOCATION.label}`, href: null },
  { line: 'Remote, worldwide', href: null },
];
