import './styles/main.css';
import gsap from 'gsap';
import { initScroll, ScrollTrigger } from './modules/scroll.js';
import { initCursor } from './modules/cursor.js';
import { initNav } from './modules/nav.js';
import { initMagnetic } from './modules/magnetic.js';
import { initTransitions } from './modules/transitions.js';
import { getProject, nextProject } from './data/projects.js';
import { splitWords, prefersReducedMotion } from './modules/utils.js';

const slug = new URLSearchParams(location.search).get('p') || 'beardo';
const p = getProject(slug);
const next = nextProject(p.slug);

document.title = `${p.name} — Case Study — Beard Bros`;

/* ---------- render ---------- */
const root = document.querySelector('[data-cs-root]');
root.innerHTML = `
  <section class="cs-hero" style="--pa:${p.palette.a};--pb:${p.palette.b};--pacc:${p.palette.accent};--pink:${p.palette.ink}">
    <span class="cs-hero-monogram" aria-hidden="true" data-cs-monogram>${p.monogram}</span>
    <div class="cs-hero-meta" data-cs-meta>
      <span>${p.category}</span>
      <span>${p.year}</span>
    </div>
    <h1 class="h-display cs-hero-title" data-cs-title>${p.name}</h1>
    <p class="cs-hero-tagline" data-cs-tagline>${p.tagline}</p>
  </section>

  <div class="cs-meta-band" data-cs-band>
    <div class="cs-meta-item"><h3>Client</h3><p>${p.name}</p></div>
    <div class="cs-meta-item"><h3>Sector</h3><p>${p.category}</p></div>
    <div class="cs-meta-item"><h3>Scope</h3><p>${p.services.join(' · ')}</p></div>
  </div>

  <section class="cs-story" data-cs-block>
    <h2>The<br>Challenge <em>where we started</em></h2>
    <p>${p.challenge}</p>
  </section>

  <section class="cs-story" data-cs-block>
    <h2>The<br>Approach <em>what we built</em></h2>
    <p>${p.approach}</p>
  </section>

  <section class="cs-metric-hero" style="--pacc:${p.palette.accent}" data-cs-block>
    <div class="value" data-cs-value>${p.metric.value}</div>
    <div class="label">${p.metric.label}</div>
  </section>

  <section class="cs-story" data-cs-block>
    <h2>The<br>Impact <em>where it landed</em></h2>
    <p>${p.impact}</p>
  </section>

  ${
    p.quote
      ? `<section class="cs-quote" data-cs-block>
          <blockquote>
            <span class="quote-mark" aria-hidden="true">“</span>
            <p class="quote-text">${p.quote.text}</p>
            <footer class="quote-who"><strong>${p.quote.author}</strong><span>${p.quote.role}</span></footer>
          </blockquote>
        </section>`
      : ''
  }

  <a class="cs-next" href="/work.html?p=${next.slug}" data-next-link data-cursor-text="Next">
    <div class="cs-next-kicker">Next case</div>
    <div class="cs-next-name">${next.name}</div>
  </a>
`;

/* ---------- behaviour ---------- */
const lenis = initScroll();
const transitions = initTransitions();
initNav(lenis);
initMagnetic();
initCursor();

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

// veiled navigation for next-case and footer CTA
document.querySelectorAll('[data-next-link], [data-cta-link]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    transitions.leave(a.href);
  });
});

transitions.enter();

/* ---------- choreography ---------- */
if (!prefersReducedMotion()) {
  const title = document.querySelector('[data-cs-title]');
  const words = splitWords(title);

  gsap
    .timeline({ delay: 0.35 })
    .from(words, { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.08 })
    .from('[data-cs-meta]', { opacity: 0, y: 20, duration: 0.7, ease: 'power3.out' }, '-=0.7')
    .from('[data-cs-tagline]', { opacity: 0, y: 20, duration: 0.7, ease: 'power3.out' }, '-=0.5')
    .from('[data-cs-monogram]', { opacity: 0, scale: 0.85, duration: 1.4, ease: 'power3.out' }, 0.4);

  // monogram parallax on scroll
  gsap.to('[data-cs-monogram]', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: { trigger: '.cs-hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  document.querySelectorAll('[data-cs-block]').forEach((block) => {
    gsap.from(block.children, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: block, start: 'top 78%' },
    });
  });

  gsap.from('[data-cs-band] > *', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '[data-cs-band]', start: 'top 90%' },
  });
}
