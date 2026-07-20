/**
 * Service catalogue shared between the homepage accordion (services.js) and
 * the dedicated /services/ page. `blurb` is the one-line teaser used on the
 * homepage; `long` and `deliverables` are the deeper copy for the full page.
 */
export const services = [
  {
    slug: 'performance-marketing',
    name: 'Performance Marketing',
    blurb:
      'Paid media engineered for compounding returns, not vanity metrics. Every rupee accountable, every campaign a lesson the next one inherits.',
    long: [
      "Performance marketing is where most agencies talk in impressions and hope you don't ask about revenue. We don't. Every campaign we run — Meta, Google, YouTube, marketplace ads — is built around one question: what does this cost us to acquire a customer worth keeping, and how fast can that number get better.",
      "We've managed ₹5 crore+ in media spend for D2C, FMCG and challenger brands across India and the US, which means the testing frameworks, creative-fatigue signals and audience-exhaustion patterns we work from are earned, not theoretical. A 1700% ROAS on a kids' nutrition brand and a 400% ROAS in six months for a gourmet food label weren't one-off spikes — they're what the system produces when it's tuned right.",
    ],
    deliverables: [
      'Full-funnel paid media strategy across Meta, Google & marketplaces',
      'Creative testing frameworks tied to real ROAS, not click-through vanity',
      'Weekly optimisation cadence with transparent spend reporting',
      'Landing page & CRO recommendations that compound your ad spend',
    ],
    hue: '#e8b04b',
  },
  {
    slug: 'branding',
    name: 'Branding',
    blurb:
      'Identities with a point of view — strategy, voice and visual systems built to be recognised at a glance and remembered for years.',
    long: [
      "Most branding briefs in India ask for 'something premium.' We ask a harder question first: what does this brand believe that its competitors don't say out loud? Branding, done properly, is a position — not a palette. We build the position first, then the identity system that makes it unmistakable across print, digital, packaging and outdoor.",
      "As specialists in D2C brand-building, we've taken category challengers from 'cluttered and generic' to credible in months, not years — CelfieDesign moved from a sea of identical interior-design portfolios to a distinct market position in three. That's the outcome branding should be judged on: recall, not just aesthetics.",
    ],
    deliverables: [
      'Brand strategy, positioning & messaging architecture',
      'Visual identity systems — logo, typography, colour, packaging-ready',
      'Brand guidelines built for consistency across every touchpoint',
      'Naming, tone-of-voice and tagline development',
    ],
    hue: '#c97b3c',
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    blurb:
      'Fast, expressive digital experiences that turn curiosity into revenue. Built for performance, designed to be felt.',
    long: [
      "A website is the only piece of marketing you fully own. We design and build modern, fast websites and ecommerce experiences for brands who are done choosing between 'looks good' and 'loads fast' — Core Web Vitals, conversion-focused UX and distinctive design are not trade-offs here, they're the brief.",
      "Whether it's a Shopify storefront built to convert or a bespoke marketing site meant to make a category-defining first impression, we build with the same discipline we bring to performance media: measured, tested, and accountable for the number that matters — sales.",
    ],
    deliverables: [
      'Custom website & ecommerce design and development',
      'Shopify / headless commerce builds tuned for conversion',
      'Performance optimisation — Core Web Vitals, load speed, mobile UX',
      'Ongoing CRO, A/B testing and iteration post-launch',
    ],
    hue: '#7ec8e8',
  },
  {
    slug: 'social-media-marketing',
    name: 'Social Media Marketing',
    blurb:
      "Feeds people actually follow. Communities that do your selling for you, one post at a time.",
    long: [
      "Social media marketing that works in 2026 isn't a content calendar of pretty tiles — it's a brand voice sharp enough that strangers screenshot it, and a community strategy that turns followers into repeat buyers. We build both: the visual system that stops the scroll, and the storytelling that earns the follow.",
      "We've run the social presence behind category-defining D2C brands — including helping make Beardo synonymous with bearded-men grooming in India — across Instagram, YouTube and emerging platforms, always tied back to a growth number, not just an engagement rate.",
    ],
    deliverables: [
      'Platform-specific content strategy & editorial calendars',
      'Community management with a real brand voice',
      'Organic + paid social working as one system, not two budgets',
      'Monthly performance reporting tied to growth, not just reach',
    ],
    hue: '#e0899a',
  },
  {
    slug: 'influencer-marketing',
    name: 'Influencer Marketing',
    blurb:
      'The right voices in the right rooms, with outcomes you can measure. Influence as a channel, not a gamble.',
    long: [
      "Influencer marketing is where most brands overpay for reach and underpay attention to fit. We run it as a performance channel: the right creators, briefed to sound like themselves, measured against the same accountability bar as paid media — not vanity follower counts.",
      "It's how Beardo built category ownership and how Naturevibe Botanicals scaled sales velocity in the US market thousands of miles from home — influencer strategy embedded inside a broader growth plan, not run in isolation.",
    ],
    deliverables: [
      'Creator discovery, vetting & negotiation across micro to macro tiers',
      'Campaign briefs that protect creator authenticity and brand fit',
      'Usage rights & whitelisting for paid amplification',
      'Attribution and ROI reporting on every partnership',
    ],
    hue: '#b98ef0',
  },
  {
    slug: 'video-production',
    name: 'Video Production',
    blurb:
      'Cinematic storytelling from first script to final grade. Films that carry your brand further than any ad unit.',
    long: [
      "Nothing tells a brand story faster than video — and nothing is punished harder for being generic. We produce brand films, product launches, social-first content and campaign hero videos with the same strategic rigour behind everything else we build: a story worth watching, shot and graded to look like it belongs on a bigger budget than it had.",
      "Video isn't a deliverable we bolt onto a retainer — it's engineered to feed the rest of the system, cut for paid media, social distribution and organic reach from the same shoot.",
    ],
    deliverables: [
      'Brand films, product launches & campaign hero videos',
      'Social-first short-form content built for Reels & YouTube Shorts',
      'Scripting, direction, shooting and colour grading in-house',
      'Multi-format edits cut for paid, organic and web use',
    ],
    hue: '#f07a6a',
  },
  {
    slug: 'content-creation',
    name: 'Content Creation',
    blurb:
      'Editorial engines that keep your brand impossible to scroll past — always on, always sharp.',
    long: [
      "Content marketing in 2026 rewards brands that sound like a point of view, not a press release. We build editorial engines — written, visual and video — engineered to build your brand across search engines and social feeds using current content marketing techniques, not tactics from a 2019 playbook.",
      "This is also where SEO and brand voice meet: content built to answer the exact questions your future customers are typing into Google, written well enough that they stay.",
    ],
    deliverables: [
      'Content strategy mapped to search intent & funnel stage',
      'Blog, landing page & product copywriting built to rank and convert',
      'Visual content systems for social, web and paid',
      'Editorial calendars that keep output consistent, not sporadic',
    ],
    hue: '#8fd18a',
  },
  {
    slug: 'seo',
    name: 'Search Engine Optimization',
    blurb:
      'Own the questions your customers are already asking. Organic growth that compounds while you sleep.',
    long: [
      "SEO is the only channel where today's work keeps paying out next year. We build organic strategy around technical health, content built for search intent, and authority — the same discipline we bring to paid media, aimed at a channel with no daily media bill. A gourmet food brand's SEO and content programme, for one client, delivered a 372% increase in search impressions alongside their paid growth.",
      "For D2C and challenger brands especially, SEO is how you stop renting attention and start owning it — permanently, and at a fraction of the long-run cost of paid acquisition.",
    ],
    deliverables: [
      'Technical SEO audits — site health, Core Web Vitals, indexation',
      'Keyword strategy mapped to real purchase and research intent',
      'On-page optimisation & content built to rank, not just publish',
      'Ongoing authority building — links, structured data, local SEO',
    ],
    hue: '#d8cc6a',
  },
];

export const getService = (slug) => services.find((s) => s.slug === slug) || services[0];
