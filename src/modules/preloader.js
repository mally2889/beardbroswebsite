import gsap from 'gsap';
import { prefersReducedMotion } from './utils.js';

/**
 * Counting preloader: letters rise in, counter runs 0→100 alongside real
 * font/asset readiness, then the whole screen lifts like a curtain.
 * Resolves when the reveal is far enough along to start the hero intro.
 */
export function runPreloader() {
  const el = document.querySelector('.preloader');
  const word = document.querySelector('[data-preloader-word]');
  const count = document.querySelector('[data-preloader-count]');
  const bar = document.querySelector('[data-preloader-bar]');

  if (!el) return Promise.resolve();
  if (prefersReducedMotion()) {
    el.remove();
    return Promise.resolve();
  }

  // split the wordmark into letters
  const letters = word.textContent.split('').map((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    return s;
  });
  word.textContent = '';
  letters.forEach((s) => word.appendChild(s));

  document.documentElement.style.overflow = 'hidden';

  return new Promise((resolve) => {
    const progress = { v: 0 };
    const tl = gsap.timeline();

    tl.to(letters, {
      y: 0,
      duration: 0.9,
      ease: 'power4.out',
      stagger: 0.035,
      startAt: { y: '110%' },
    })
      .to(
        progress,
        {
          v: 100,
          duration: 1.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            count.textContent = String(Math.round(progress.v)).padStart(2, '0');
            bar.style.transform = `scaleX(${progress.v / 100})`;
          },
        },
        '<0.2'
      )
      .to(letters, {
        y: '-110%',
        duration: 0.7,
        ease: 'power3.in',
        stagger: 0.02,
      })
      .to(count, { opacity: 0, duration: 0.3 }, '<')
      .to(el, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        onStart: () => {
          document.documentElement.style.overflow = '';
          resolve();
        },
        onComplete: () => el.remove(),
      });

    // ensure fonts are actually in before we claim 100%
    document.fonts?.ready.then(() => tl.play());
  });
}
