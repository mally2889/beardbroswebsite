import './styles/main.css';
import { initScroll } from './modules/scroll.js';
import { initCursor } from './modules/cursor.js';
import { initNav } from './modules/nav.js';
import { initMagnetic } from './modules/magnetic.js';
import { initTransitions } from './modules/transitions.js';
import { bindAccordion } from './modules/utils.js';
import { services } from './data/services.js';
import { faqs } from './data/faq.js';
import { initReveals, initRevealBlocks, initScrambleEyebrow, setFooterYear } from './modules/sections.js';

const lenis = initScroll();
const transitions = initTransitions();

/* ---------- render service detail blocks ---------- */
const detail = document.querySelector('[data-services-detail]');
detail.innerHTML = services
  .map(
    (s, i) => `
    <article class="service-detail" id="${s.slug}" data-reveal-block>
      <div class="service-detail-head">
        <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
        <h2>${s.name}</h2>
      </div>
      <div class="service-detail-body">
        <div class="service-detail-copy">
          ${s.long.map((p) => `<p>${p}</p>`).join('')}
        </div>
        <ul class="deliverables-list">
          ${s.deliverables.map((d) => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    </article>`
  )
  .join('');

/* ---------- render FAQ accordion (reuses the homepage service-row markup) ---------- */
const faqList = document.querySelector('[data-faq-list]');
faqList.innerHTML = faqs
  .map(
    (f, i) => `
    <li class="service-row">
      <button class="service-row-btn" aria-expanded="false">
        <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="service-name faq-q">${f.q}</span>
        <span class="service-plus" aria-hidden="true">+</span>
      </button>
      <div class="service-body"><div class="service-body-inner"><p>${f.a}</p></div></div>
    </li>`
  )
  .join('');
bindAccordion([...faqList.querySelectorAll('.service-row')]);

/* ---------- behaviour ---------- */
initNav(lenis, transitions);
initMagnetic();
initCursor();
setFooterYear();
initReveals();
initRevealBlocks();
initScrambleEyebrow();

transitions.enter();

import('./modules/hero-gl.js').then(({ createShaderField }) => {
  createShaderField(document.querySelector('[data-shader-field]'), {
    copper: '#7ec8e8',
    amber: '#e8b04b',
    mouseReactive: false,
  })?.reveal(1.6);
});
