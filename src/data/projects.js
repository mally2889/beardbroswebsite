/**
 * Case study data shared between the homepage gallery and work.html.
 * Palettes drive each project's generative visual (see .cs-visual styles).
 */
export const projects = [
  {
    slug: 'beardo',
    name: 'Beardo',
    category: 'Grooming · D2C',
    year: '2019 — Ongoing',
    services: ['Web Development', 'Ecommerce', 'Social Media', 'Influencer Marketing'],
    metric: { value: '#1', label: 'in bearded-men brand recall' },
    tagline: 'Making beards a movement, not a trend.',
    palette: { a: '#1a2f23', b: '#0c1410', accent: '#d4a94e', ink: '#f2ead8' },
    monogram: 'Be',
    challenge:
      'Beardo had a cult product but a fragmented digital presence. Grooming for bearded men was still a niche conversation — the brand needed to own it outright before bigger players moved in.',
    approach:
      'We rebuilt the digital foundation end to end: a faster ecommerce experience, a social voice with real edge, and an influencer engine that put Beardo in every conversation about beards in India. Web, content, community and commerce — moving as one system.',
    impact:
      'Beardo became synonymous with bearded-men grooming in India. The digital transformation spanned web development, ecommerce, social media and influencer marketing — and turned a product into an identity.',
    quote: {
      text: 'Beard Bros transformed our digital presence, spearheading web development, ecommerce, social media, and influencer marketing.',
      author: 'Ashutosh Valani',
      role: 'Co-founder, Beardo',
    },
  },
  {
    slug: 'naturevibe',
    name: 'Naturevibe Botanicals',
    category: 'Wellness · USA',
    year: 'Performance',
    services: ['Performance Marketing', 'Marketplace Strategy', 'Data & Analytics'],
    metric: { value: 'USA', label: 'market growth, driven by data' },
    tagline: 'A Mumbai-built brand, scaled across America.',
    palette: { a: '#14301f', b: '#0a1a10', accent: '#8fd18a', ink: '#eef5e9' },
    monogram: 'Nv',
    challenge:
      'Competing in the US wellness market means outspending giants or out-thinking them. Naturevibe needed sales velocity in a market thousands of miles from home.',
    approach:
      'A ruthlessly data-driven performance strategy: granular audience testing, marketplace optimisation and creative iteration on a weekly cadence. Every dollar accountable, every decision measured.',
    impact:
      'Sustained sales growth across the US market — and a partnership that expanded into every corner of brand growth.',
    quote: {
      text: 'They are our ultimate partner for all things related to brand growth.',
      author: 'Rishabh Chokhani',
      role: 'Founder, Naturevibe Botanicals',
    },
  },
  {
    slug: 'kids-nutrition',
    name: 'D2C Kids Nutrition',
    category: 'Food & Beverage · D2C',
    year: 'Performance',
    services: ['Performance Marketing', 'Creative Strategy', 'CRO'],
    metric: { value: '1700%', label: 'consistent return on ad spend' },
    tagline: 'Parents are the hardest audience on the internet. We won them.',
    palette: { a: '#3a2410', b: '#1c1008', accent: '#f0a83c', ink: '#faf0e0' },
    monogram: 'Kn',
    challenge:
      'Selling kids’ nutrition D2C means convincing the most sceptical buyers online — parents — while ad costs climb every quarter.',
    approach:
      'Creative built on genuine parental anxieties and aspirations, matched with surgical audience segmentation and a landing experience tuned relentlessly for trust.',
    impact:
      'A consistent 1700% ROAS — not a spike, a system. Growth that compounds instead of burning out.',
    quote: null,
  },
  {
    slug: 'gourmet-foods',
    name: 'Gourmet Food Brand',
    category: 'Food & Beverage · Premium',
    year: '6 Months',
    services: ['Performance Marketing', 'SEO', 'Content'],
    metric: { value: '400%', label: 'ROAS in six months' },
    tagline: 'Premium taste, performance discipline.',
    palette: { a: '#3a1420', b: '#1a0a10', accent: '#e0899a', ink: '#f8ecef' },
    monogram: 'Gf',
    challenge:
      'A premium gourmet brand with exceptional product and invisible demand. Discovery was the bottleneck — nobody searches for what they don’t know exists.',
    approach:
      'A dual engine: paid performance to manufacture demand now, and an SEO and content programme to own it permanently.',
    impact:
      '400% ROAS within six months and a 372% increase in search impressions — paid growth that leaves organic equity behind.',
    quote: null,
  },
  {
    slug: 'hiphop-skincare',
    name: 'Hip Hop Skincare',
    category: 'Beauty · Campaign',
    year: 'Campaign',
    services: ['Campaign Strategy', 'Social Media', 'Performance'],
    metric: { value: 'Glow', label: '“Get Glow Sale” brand revival' },
    tagline: 'A sleeping brand, shaken awake.',
    palette: { a: '#2a1440', b: '#140a20', accent: '#b98ef0', ink: '#f2ecfa' },
    monogram: 'Hh',
    challenge:
      'The brand had gone quiet. Awareness was fading, and the category doesn’t wait for anyone.',
    approach:
      'The “Get Glow Sale” — a campaign engineered as an event, not a discount. Urgency, personality and a reason to talk about the brand again.',
    impact:
      'A revival moment that re-lit the brand’s audience and re-established its voice in the category.',
    quote: null,
  },
  {
    slug: 'celfiedesign',
    name: 'CelfieDesign',
    category: 'Interior Design · B2C',
    year: '3 Months',
    services: ['Branding', 'Positioning', 'Digital Marketing'],
    metric: { value: '3 mo', label: 'from cluttered to credible challenger' },
    tagline: 'Standing out in a market where everyone looks the same.',
    palette: { a: '#12283a', b: '#0a141e', accent: '#7ec8e8', ink: '#eaf4fa' },
    monogram: 'Cd',
    challenge:
      'Interior design is a sea of sameness — identical portfolios, identical promises. CelfieDesign was drowning in the clutter.',
    approach:
      'Sharp repositioning and a brand voice with actual conviction, amplified across every digital touchpoint simultaneously.',
    impact:
      'In three months, CelfieDesign moved from cluttered competition to credible challenger.',
    quote: {
      text: 'Beard Bros is more than just a digital marketing agency; they are true growth partners.',
      author: 'Rahul Satia',
      role: 'Founder, CelfieDesign',
    },
  },
  {
    slug: 'modular-construction',
    name: 'Modular Construction',
    category: 'Construction · B2B',
    year: 'Campaign',
    services: ['Campaign Strategy', 'Content', 'Lead Generation'],
    metric: { value: 'B2B', label: '“Building Blocks of Success”' },
    tagline: 'Making an unglamorous category impossible to skip.',
    palette: { a: '#33301a', b: '#18170c', accent: '#d8cc6a', ink: '#f6f4e6' },
    monogram: 'Mc',
    challenge:
      'B2B construction marketing defaults to brochures and buzzwords. Attention is scarce and trust is everything.',
    approach:
      '“Building Blocks of Success” — a campaign that translated engineering capability into a story decision-makers actually remembered.',
    impact:
      'A distinctive market position in a category that rarely produces memorable brands.',
    quote: null,
  },
  {
    slug: 'merch-store',
    name: 'Merchandising Store',
    category: 'Ecommerce · Retail',
    year: 'Lockdown',
    services: ['Performance Marketing', 'Ecommerce', 'CRO'],
    metric: { value: '6X', label: 'sales growth during lockdown' },
    tagline: 'When the world closed, we opened the throttle.',
    palette: { a: '#3a1212', b: '#1c0a0a', accent: '#f07a6a', ink: '#faecea' },
    monogram: 'Ms',
    challenge:
      'Lockdown froze retail overnight. Most merch brands went dormant and hoped. Hope is not a strategy.',
    approach:
      'We treated the disruption as a demand shift, not a demand collapse — rebuilding the funnel for a captive, online-only audience.',
    impact: 'A 6X increase in sales during lockdown, while the category stood still.',
    quote: null,
  },
];

export const getProject = (slug) => projects.find((p) => p.slug === slug) || projects[0];

export const nextProject = (slug) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
