import gsap from 'gsap';
import { prefersReducedMotion } from './utils.js';

/**
 * Page transitions: an ink veil sweeps up before navigation and peels away
 * on arrival, so moving between pages feels continuous.
 */
export function initTransitions() {
  const veil = document.querySelector('[data-veil]');

  const leave = (href) => {
    if (!veil || prefersReducedMotion()) {
      window.location.href = href;
      return;
    }
    gsap.to(veil, {
      y: 0,
      duration: 0.7,
      ease: 'power3.inOut',
      startAt: { y: '101%' },
      onComplete: () => (window.location.href = href),
    });
  };

  const enter = () => {
    if (!veil || prefersReducedMotion()) return;
    gsap.fromTo(
      veil,
      { y: 0 },
      { y: '-101%', duration: 0.9, ease: 'power3.inOut', delay: 0.1 }
    );
  };

  // restore state when a page is served from the bfcache
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && veil) gsap.set(veil, { y: '101%' });
  });

  return { leave, enter };
}
