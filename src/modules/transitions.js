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

  // Auto-intercept plain same-origin links so every page gets the veil
  // transition without each one having to wire its own click handler.
  // Links that already manage their own transition (menu links, work
  // cards, the case-study "next" link) call e.preventDefault() first, so
  // this delegated fallback backs off via e.defaultPrevented.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor
    e.preventDefault();
    leave(a.href);
  });

  // restore state when a page is served from the bfcache
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && veil) gsap.set(veil, { y: '101%' });
  });

  return { leave, enter };
}
