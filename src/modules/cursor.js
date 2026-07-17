import gsap from 'gsap';
import { isTouch, prefersReducedMotion } from './utils.js';

/**
 * Custom cursor: amber dot tracks the pointer 1:1, the ring eases behind it.
 * Elements with [data-cursor-hover] grow the ring; [data-cursor-text="View"]
 * turns it into a labeled disc.
 */
export function initCursor() {
  if (isTouch() || prefersReducedMotion()) return;

  const ring = document.querySelector('[data-cursor]');
  const dot = document.querySelector('[data-cursor-dot]');
  const label = document.querySelector('[data-cursor-label]');
  if (!ring || !dot) return;

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };

  const setRing = gsap.quickSetter(ring, 'css');
  const setDot = gsap.quickSetter(dot, 'css');

  window.addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    setDot({ x: e.clientX, y: e.clientY });
  });

  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.16;
    pos.y += (target.y - pos.y) * 0.16;
    setRing({ x: pos.x, y: pos.y });
  });

  const bind = () => {
    document.querySelectorAll('a, button, [data-cursor-hover]').forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = '1';
      el.addEventListener('pointerenter', () => {
        const text = el.dataset.cursorText;
        if (text) {
          label.textContent = text;
          ring.classList.add('is-label');
        } else {
          ring.classList.add('is-hover');
        }
      });
      el.addEventListener('pointerleave', () => {
        ring.classList.remove('is-hover', 'is-label');
      });
    });
  };

  bind();
  // rebind after JS-injected content lands
  return bind;
}
