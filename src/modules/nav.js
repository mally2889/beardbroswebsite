import gsap from 'gsap';
import { prefersReducedMotion } from './utils.js';

/**
 * Floating pill nav with intelligent hide/show, plus the fullscreen menu
 * that blooms open from the toggle with a circular clip-path.
 */
export function initNav(lenis) {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const words = menu.querySelectorAll('.menu-word');
  const foot = menu.querySelector('[data-menu-foot]');
  const reduced = prefersReducedMotion();

  /* --- hide on scroll down, show on scroll up --- */
  let lastY = 0;
  const onScroll = (y) => {
    if (document.body.classList.contains('menu-open')) return;
    if (y > lastY && y > 140) nav.classList.add('is-hidden');
    else nav.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  /* --- open / close timeline --- */
  let open = false;

  const origin = () => {
    const r = toggle.getBoundingClientRect();
    return `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
  };

  const tlOpen = () => {
    const tl = gsap.timeline();
    menu.style.visibility = 'visible';
    menu.setAttribute('aria-hidden', 'false');
    tl.fromTo(
      menu,
      { clipPath: `circle(0% at ${origin()})` },
      { clipPath: `circle(150% at ${origin()})`, duration: reduced ? 0 : 0.9, ease: 'power3.inOut' }
    )
      .to(words, { y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.07 }, '-=0.35')
      .to(foot, { opacity: 1, duration: 0.5 }, '-=0.4');
    return tl;
  };

  const tlClose = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        menu.style.visibility = 'hidden';
        menu.setAttribute('aria-hidden', 'true');
        gsap.set(words, { y: '115%' });
        gsap.set(foot, { opacity: 0 });
      },
    });
    tl.to(menu, {
      clipPath: `circle(0% at ${origin()})`,
      duration: reduced ? 0 : 0.7,
      ease: 'power3.inOut',
    });
    return tl;
  };

  const setOpen = (v) => {
    if (v === open) return;
    open = v;
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      lenis?.stop();
      tlOpen();
    } else {
      lenis?.start();
      tlClose();
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));

  // menu links: close first, then let the lenis anchor handler take over
  menu.querySelectorAll('[data-menu-link]').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  gsap.set(words, { y: '115%' });
}
