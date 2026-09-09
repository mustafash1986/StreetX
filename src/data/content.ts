export const ACCENTS = [
  { name: "Acid", value: "#d4ff3f", ink: "#0c0f00" },
  { name: "Violet", value: "#7c5cff", ink: "#ffffff" },
  { name: "Coral", value: "#ff6b4a", ink: "#140404" },
  { name: "Cyan", value: "#38e1ff", ink: "#001318" },
  { name: "Pink", value: "#ff5ca8", ink: "#17000f" },
];

export type Project = {
  id: string;
  title: string;
  client: string;
  category: "Branding" | "Web" | "Product" | "Motion";
  year: string;
  image: string;
  tagline: string;
  description: string;
  stats: { label: string; value: string }[];
  tags: string[];
  accent: string;
};

export const PROJECTS: Project[] = [
  {
    id: "lumen",
    title: "Lumen Finance",
    client: "Lumen Labs",
    category: "Product",
    year: "2025",
    image:
      "https://images.pexels.com/photos/29738255/pexels-photo-29738255.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "A fintech platform that feels like a game, converts like a machine.",
    description:
      "End-to-end product design and build for a Series B fintech. We rebuilt onboarding, designed a real-time portfolio engine and shipped a marketing site that lifted organic signups 3x. Motion system + design tokens power 40+ screens.",
    stats: [
      { label: "Conversion lift", value: "+212%" },
      { label: "Onboarding time", value: "-64%" },
      { label: "App rating", value: "4.9★" },
    ],
    tags: ["Product Design", "Design System", "Next.js", "Motion"],
    accent: "#d4ff3f",
  },
  {
    id: "aura",
    title: "Aura Athletics",
    client: "Aura Inc.",
    category: "Web",
    year: "2024",
    image:
      "https://images.pexels.com/photos/29355999/pexels-photo-29355999.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Headless commerce with editorial soul.",
    description:
      "Flagship e-commerce experience for a performance apparel brand. 3D product viewer, editorial storytelling and sub-second page loads. Built on headless Shopify with edge rendering across 12 regions.",
    stats: [
      { label: "Revenue / visitor", value: "+88%" },
      { label: "LCP", value: "0.9s" },
      { label: "AOV lift", value: "+34%" },
    ],
    tags: ["E-commerce", "3D Viewer", "Headless", "CRO"],
    accent: "#ff6b4a",
  },
  {
    id: "nebula",
    title: "Nebula AI",
    client: "Nebula",
    category: "Branding",
    year: "2025",
    image:
      "https://images.pexels.com/photos/28551568/pexels-photo-28551568.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Brand + site for the copilots of code.",
    description:
      "Identity, voice and launch site for an AI dev-tools startup — from wordmark to WebGL hero to docs. The rebrand carried them through a $40M Series A with TechCrunch calling the site 'the best dev-tool launch of the year'.",
    stats: [
      { label: "Waitlist growth", value: "120k" },
      { label: "Series A", value: "$40M" },
      { label: "Press features", value: "60+" },
    ],
    tags: ["Identity", "WebGL", "Content", "Launch"],
    accent: "#7c5cff",
  },
  {
    id: "solstice",
    title: "Solstice Hotels",
    client: "Solstice Group",
    category: "Web",
    year: "2024",
    image:
      "https://images.pexels.com/photos/29474094/pexels-photo-29474094.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Booking flow people actually enjoy.",
    description:
      "Direct-booking platform across 24 boutique hotels. Availability-first search, cinematic property stories and Apple-Pay checkout. Direct bookings overtook OTAs within 90 days of launch.",
    stats: [
      { label: "Direct bookings", value: "+156%" },
      { label: "Bounce rate", value: "-41%" },
      { label: "Properties", value: "24" },
    ],
    tags: ["Booking UX", "CMS", "Photography", "Payments"],
    accent: "#38e1ff",
  },
  {
    id: "pulse",
    title: "Pulse Festival",
    client: "Pulse Live",
    category: "Motion",
    year: "2025",
    image:
      "https://images.pexels.com/photos/33797645/pexels-photo-33797645.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "An immersive WebGL universe for 80k ravers.",
    description:
      "Festival site as playable art: generative visuals react to the lineup you hover, tickets drop with countdown physics, and the aftermovie is rendered live from attendee clips. Sold out in 6 hours.",
    stats: [
      { label: "Tickets", value: "80k" },
      { label: "Sellout time", value: "6hrs" },
      { label: "SOTD", value: "Awwwards" },
    ],
    tags: ["WebGL", "Generative", "Ticketing", "3D"],
    accent: "#ff5ca8",
  },
  {
    id: "terra",
    title: "Terra Organics",
    client: "Terra Co.",
    category: "Branding",
    year: "2023",
    image:
      "https://images.pexels.com/photos/34939149/pexels-photo-34939149.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "DTC rebrand rooted in craft, built to scale.",
    description:
      "Full rebrand and packaging system for an organic staples brand — strategy, naming, identity, packaging for 32 SKUs and a subscription site. Retail placement in 1,400 stores followed.",
    stats: [
      { label: "Retail doors", value: "1,400" },
      { label: "Repeat rate", value: "62%" },
      { label: "SKUs", value: "32" },
    ],
    tags: ["Strategy", "Packaging", "Retail", "Subscription"],
    accent: "#d4ff3f",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "PRISM didn't just redesign our product — they rewired how we think about growth. Onboarding completion doubled in a month. It felt like adding a whole senior team overnight.",
    name: "Maya Chen",
    role: "CPO, Lumen Finance",
    initials: "MC",
    color: "#d4ff3f",
  },
  {
    quote:
      "The site paid for itself in a weekend. Our drop sold out, press went feral, and our dev team finally has a system they love instead of fear.",
    name: "Dario Fontaine",
    role: "Founder, Pulse Live",
    initials: "DF",
    color: "#ff5ca8",
  },
  {
    quote:
      "Ruthlessly sharp on strategy, obsessive on craft. They challenged our roadmap in week one — and were right. Series A deck borrowed half their narrative.",
    name: "Jonas Weber",
    role: "CEO, Nebula AI",
    initials: "JW",
    color: "#7c5cff",
  },
  {
    quote:
      "Direct bookings overtook Expedia in 90 days. The booking flow is so smooth guests email us about it. Who emails about a booking flow?",
    name: "Amara Okafor",
    role: "CMO, Solstice Group",
    initials: "AO",
    color: "#38e1ff",
  },
];

export const FAQS = [
  {
    q: "How fast can we start?",
    a: "Discovery calls happen within 48 hours. Sprint slots open every 2 weeks — we only run 3 concurrent builds to keep senior talent on your project. Typical kickoff is 7–14 days after signing.",
  },
  {
    q: "Do you work with early-stage startups?",
    a: "Yes — roughly 40% of our work is Seed to Series A. For pre-seed teams we offer a fixed-price Brand Sprint (2 weeks, identity + landing page + pitch deck) designed to help you raise.",
  },
  {
    q: "What does a typical engagement cost?",
    a: "Sprints start at $4.8k. Most product + site builds land between $28k–$85k. Retainers for ongoing design engineering start at $7.5k/mo. Every proposal is fixed-scope with weekly demos — no surprise invoices, ever.",
  },
  {
    q: "Who will actually work on our project?",
    a: "No handoffs to juniors. Your pod is 1 strategy lead, 1 senior designer, 1 creative engineer and a motion specialist — the same people you meet on the intro call. Founders review every milestone.",
  },
  {
    q: "Can you take over our existing codebase?",
    a: "Absolutely. We audit your stack in week one (Next.js, React, Shopify, Webflow, Sanity — we've shipped on all of them) and either extend it or propose a clean migration path with zero downtime.",
  },
  {
    q: "Do you offer support after launch?",
    a: "Every build includes 30 days of concierge support. After that, most clients move to a care plan: monitoring, CRO experiments, content updates and quarterly design reviews.",
  },
];
