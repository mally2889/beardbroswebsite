import gsap from 'gsap';
import { isTouch, prefersReducedMotion } from './utils.js';

/** Buttons that lean toward the cursor and snap back with elastic ease. */
export function initMagnetic(scope = document) {
  if (isTouch() || prefersReducedMotion()) return;

  scope.querySelectorAll('[data-magnetic]').forEach((el) => {
    if (el.dataset.magneticBound) return;
    el.dataset.magneticBound = '1';

    const strength = parseFloat(el.dataset.magneticStrength || '0.35');

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
    });

    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    });
  });
}
