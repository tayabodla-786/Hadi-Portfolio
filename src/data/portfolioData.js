export const heroData = {
  subtitle: "BEHIND THE SCENE, BEYOND THE SCREEN",
  title: "Tayyab Imran",
  tagline: "Full-Stack Developer building thoughtful, reliable web experiences from idea to production.",
  description: "I turn ideas into responsive, scalable products with clean interfaces and dependable backend systems.",
  resumeLink: "/Resume/MyResume.txt"
};

export const servicesData = [
  {
    id: "service-1",
    icon: "lucide:workflow",
    color: "#AF52DE",
    title: "Full-Stack Web Development",
    description: "Building complete web products with polished interfaces, clear APIs, secure authentication, and maintainable code.",
    items: [
      {
        title: "Responsive Interfaces",
        description: "(React, Tailwind CSS, reusable components, accessible layouts, smooth interactions)"
      },
      {
        title: "REST APIs",
        description: "(Node.js, Express.js, authentication, validation, error handling, clean service boundaries)"
      },
      {
        title: "Database Integration",
        description: "(MongoDB, PostgreSQL, data modeling, queries, and practical performance decisions)"
      }
    ]
  },
  {
    id: "service-2",
    icon: "lucide:server-cog",
    color: "#0A84FF",
    title: "Product Engineering",
    description: "Taking a product from rough idea to a useful, deployed experience with an eye for both detail and delivery.",
    items: [
      {
        title: "MERN Applications",
        description: "(MongoDB, Express.js, React, Node.js, React Router)"
      },
      {
        title: "Admin Dashboards",
        description: "(Data tables, forms, role-aware screens, booking and content management workflows)"
      },
      {
        title: "Deployment",
        description: "(Vercel, responsive production builds, environment configuration, and iterative improvement)"
      }
    ]
  },
  {
    id: "service-3",
    icon: "lucide:shield-check",
    color: "#FF375F",
    title: "Secure Experiences",
    description: "Adding the practical security foundations that keep user accounts, forms, and application data protected as a product grows.",
    items: [
      {
        title: "User Authentication",
        description: "(Login flows, protected routes, password handling, sessions, and clear feedback)"
      },
      {
        title: "Protected Workflows",
        description: "(Role-aware dashboards, ownership checks, validation, and safe form handling)"
      },
      {
        title: "Reliable APIs",
        description: "(Consistent responses, error states, input validation, and maintainable endpoints)"
      }
    ]
  },
  {
    id: "service-4",
    icon: "lucide:database",
    color: "#2FD9C4",
    title: "Data & Performance",
    description: "Connecting products to well-structured data and keeping everyday interactions quick, readable, and dependable.",
    items: [
      {
        title: "MongoDB & SQL",
        description: "(Practical schemas, CRUD workflows, relationships, and clean data access)"
      },
      {
        title: "Efficient Queries",
        description: "(Useful indexes, focused queries, loading states, and responsive interfaces)"
      },
      {
        title: "Media & Content",
        description: "(Image handling, content workflows, reusable data-driven UI)"
      }
    ]
  },
  {
    id: "service-5",
    icon: "lucide:layout-panel-left",
    color: "#FF9F0A",
    title: "Frontend & Delivery",
    description: "Shipping the interface and the infrastructure underneath it as one system: responsive, deployed, and reproducible.",
    items: [
      {
        title: "Frontend Systems",
        description: "(React.js, Tailwind CSS, reusable components, GSAP, and accessible interaction)"
      },
      {
        title: "Deployment",
        description: "(Vercel, environment configuration, production builds, and responsive QA)"
      },
      {
        title: "Team-Ready Code",
        description: "(Git, clear naming, reusable patterns, and a codebase that is easy to extend)"
      }
    ]
  }
];

export const aboutData = {
  subtitle: "Code with purpose, Built to last",
  title: "About",
  intro: "I care about the details that make a product feel considered: clear structure, useful interactions, and code that remains easy to change as the idea grows.",
  highlights: [
    "Building full-stack applications with the MERN stack",
    "Creating responsive interfaces that feel clear and intentional",
    "Connecting practical APIs, authentication, and database workflows",
    "Learning continuously through real products and challenging builds"
  ]
};

export const projectsData = [
  {
    id: 1,
    name: "EDU-CARE-LMS",
    tagline: "Learning Management System",
    description: "A learning platform with course browsing, authentication, payments, and responsive interfaces built for a smooth student experience.",
    href: "https://lms-frontend-nine-kappa.vercel.app",
    image: "/img3.png",
    frameworks: [
      { id: 1, name: "React" },
      { id: 2, name: "Node.js" },
      { id: 3, name: "MongoDB" },
      { id: 4, name: "Stripe" }
    ]
  },
  {
    id: 2,
    name: "Rent a Car",
    tagline: "Booking & Management Platform",
    description: "A full-stack car rental application with user authentication, vehicle listings, booking flows, and an administrative dashboard.",
    href: "https://rent-a-car-frontend-private.vercel.app",
    image: "/img2.png",
    frameworks: [
      { id: 1, name: "React" },
      { id: 2, name: "Express.js" },
      { id: 3, name: "MongoDB" },
      { id: 4, name: "Tailwind" }
    ]
  },
  {
    id: 3,
    name: "Repairing-CMS",
    tagline: "Repair Service Management",
    description: "A service management platform with authentication, repair listings, online booking, and an admin dashboard for managing operations.",
    href: "https://repairing-app-cms-4oyk.vercel.app/",
    image: "/img4.png",
    frameworks: [
      { id: 1, name: "React" },
      { id: 2, name: "Node.js" },
      { id: 3, name: "MongoDB" },
      { id: 4, name: "Express.js" }
    ]
  },
  {
    id: 4,
    name: "SMS System",
    tagline: "School Management System",
    description: "A school management platform for organizing students, teachers, classes, and day-to-day administration in one focused dashboard.",
    href: "https://upbeat-joy-production-9550.up.railway.app/",
     image: null,
    frameworks: [
      { id: 1, name: "React" },
      { id: 2, name: "Node.js" },
      { id: 3, name: "MongoDB" },
      { id: 4, name: "Dashboard" }
    ]
  },
  {
    id: 5,
    name: "Portfolio Studio",
    tagline: "Personal Portfolio Experience",
    description: "A responsive portfolio experience focused on visual storytelling, clear navigation, and carefully paced motion.",
    href: "https://github.com/tayabodla-786",
    image: null,
    frameworks: [
      { id: 1, name: "React" },
      { id: 2, name: "GSAP" },
      { id: 3, name: "Three.js" },
      { id: 4, name: "Vite" }
    ]
  },
  {
    id: 6,
    name: "More in progress",
    tagline: "Always learning, always building",
    description: "New experiments and client-ready products are on the way. The best work usually starts as a small, curious idea.",
    href: "https://github.com/tayabodla-786",
    image: null,
    frameworks: [
      { id: 1, name: "MERN" },
      { id: 2, name: "GitHub" },
      { id: 3, name: "Learning" },
      { id: 4, name: "Open Source" }
    ]
  },
  {
    id: 7,
    name: "Coming next",
    tagline: "A new product in the works",
    description: "A place for the next polished build, shaped by the lessons from every project before it.",
    href: "https://github.com/tayabodla-786",
    image: null,
    frameworks: [
      { id: 1, name: "React" },
      { id: 2, name: "Tailwind" },
      { id: 3, name: "Vite" },
      { id: 4, name: "UX" }
    ]
  }
];

export const socialLinks = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/tayyabimran" },
  { name: "GitHub", href: "https://github.com/tayabodla-786" },
  { name: "Resume", href: "/Resume/MyResume.txt" }
];

export const contactInfo = {
  subtitle: "Let's Connect",
  title: "Contact",
  text: "Got a question or project idea?\nI'd love to hear from you and discuss further!",
  email: "tayabodla786@gmail.com",
  phone: "+92 307 0436858"
};

export const marqueeWords1 = ["Innovation", "Precision", "Trust", "Collaboration", "Excellence"];
export const marqueeWords2 = ["Contact", "Contact", "Contact", "Contact", "Contact"];
