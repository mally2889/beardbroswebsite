import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isTouch, prefersReducedMotion, bindAccordion } from './utils.js';
import { services as SERVICES } from '../data/services.js';

export function initServices() {
  const list = document.querySelector('[data-services-list]');
  const preview = document.querySelector('[data-service-preview]');
  if (!list) return;

  /* --- build rows --- */
  SERVICES.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'service-row';
    li.innerHTML = `
      <button class="service-row-btn" aria-expanded="false">
        <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="service-name">${s.name}</span>
        <span class="service-plus" aria-hidden="true">+</span>
      </button>
      <div class="service-body"><div class="service-body-inner"><p>${s.blurb}</p></div></div>
    `;
    list.appendChild(li);

    const item = document.createElement('div');
    item.className = 'service-preview-item';
    item.style.background = `radial-gradient(120% 130% at 30% 20%, ${s.hue}55, transparent 65%), radial-gradient(110% 110% at 80% 90%, ${s.hue}22, transparent 60%), #14110d`;
    item.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span>`;
    preview?.appendChild(item);
  });

  const rows = [...list.querySelectorAll('.service-row')];

  /* --- accordion --- */
  bindAccordion(rows);

  /* --- staggered entrance --- */
  if (!prefersReducedMotion()) {
    gsap.from(rows, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: list, start: 'top 80%' },
    });
  }

  /* --- floating hover preview (fine pointers only) --- */
  if (!preview || isTouch() || prefersReducedMotion()) return;

  const items = [...preview.querySelectorAll('.service-preview-item')];
  const setX = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
  const setY = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
  let shown = false;

  list.addEventListener('pointermove', (e) => {
    setX(e.clientX + 28);
    setY(e.clientY - preview.offsetHeight / 2);
  });
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => {
      items.forEach((it, j) => it.classList.toggle('is-active', i === j));
      if (!shown) {
        shown = true;
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
      }
    });
  });
  list.addEventListener('pointerleave', () => {
    shown = false;
    gsap.to(preview, { opacity: 0, scale: 0.85, duration: 0.4, ease: 'power3.in' });
  });
}
