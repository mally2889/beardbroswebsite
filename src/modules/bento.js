import gsap from 'gsap';
import { isTouch, prefersReducedMotion } from './utils.js';

/**
 * Pointer-tracked 3D tilt for `.bento-card` elements: sets --rx/--ry custom
 * properties consumed by the CSS transform, so the tilt itself lives in
 * main.css and this stays a pure input->property mapper. Fine pointers only.
 */
export function initBentoTilt(scope = document) {
  const cards = [...scope.querySelectorAll('.bento-card')];
  if (!cards.length || isTouch() || prefersReducedMotion()) return;

  cards.forEach((card) => {
    const setRx = gsap.quickTo(card, '--rx', { duration: 0.5, ease: 'power3.out' });
    const setRy = gsap.quickTo(card, '--ry', { duration: 0.5, ease: 'power3.out' });

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setRy(px * 14);
      setRx(py * -14);
    });
    card.addEventListener('pointerleave', () => {
      setRx(0);
      setRy(0);
    });
  });
}
