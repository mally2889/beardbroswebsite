import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projects } from '../data/projects.js';
import { prefersReducedMotion, isTouch } from './utils.js';

/**
 * Selected Work: a pinned horizontal gallery on desktop (vertical scroll
 * drives horizontal travel), a natural swipe row on touch devices.
 */
export function initWorkGallery(onNavigate) {
  const section = document.querySelector('[data-work]');
  const track = document.querySelector('[data-work-track]');
  if (!track) return;

  /* --- build cards --- */
  projects.forEach((p) => {
    const a = document.createElement('a');
    a.className = 'work-card';
    a.href = `/work.html?p=${p.slug}`;
    a.dataset.cursorText = 'View';
    a.dataset.transition = '';
    a.style.setProperty('--pa', p.palette.a);
    a.style.setProperty('--pb', p.palette.b);
    a.style.setProperty('--pacc', p.palette.accent);
    a.innerHTML = `
      <div class="work-card-visual">
        <span class="work-card-monogram" aria-hidden="true">${p.monogram}</span>
        <span class="work-card-metric"><strong>${p.metric.value}</strong>${p.metric.label}</span>
      </div>
      <div class="work-card-info">
        <span class="work-card-name">${p.name}</span>
        <span class="work-card-cat">${p.category}</span>
      </div>
    `;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate?.(a.href);
    });
    track.appendChild(a);
  });

  // closing CTA card
  const end = document.createElement('div');
  end.className = 'work-card-end';
  end.innerHTML = `<a class="btn" href="#contact" data-magnetic>Your brand here <span class="btn-arrow" aria-hidden="true">→</span></a>`;
  track.appendChild(end);

  /* --- horizontal scroll (desktop, motion allowed) --- */
  if (isTouch() || prefersReducedMotion()) {
    // natural swipe: let the track overflow horizontally
    const wrap = document.querySelector('[data-work-wrap]');
    wrap.style.overflowX = 'auto';
    wrap.style.scrollSnapType = 'x mandatory';
    [...track.children].forEach((c) => (c.style.scrollSnapAlign = 'center'));
    return;
  }

  const getDistance = () => track.scrollWidth - document.documentElement.clientWidth;

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${getDistance()}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // subtle parallax on each monogram as the track travels
  track.querySelectorAll('.work-card-monogram').forEach((m) => {
    gsap.fromTo(
      m,
      { xPercent: -8 },
      {
        xPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: m,
          containerAnimation: tween,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      }
    );
  });
}
