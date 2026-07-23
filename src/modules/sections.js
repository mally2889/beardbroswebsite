import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitWords, prefersReducedMotion, scrambleText } from './utils.js';

/* ---------- hero intro (runs after preloader) ---------- */
export function heroIntro(gl) {
  const title = document.querySelector('[data-hero-title]');
  const eyebrow = document.querySelector('[data-hero-eyebrow]');
  const sub = document.querySelector('[data-hero-sub]');
  const nav = document.querySelector('[data-nav]');

  if (prefersReducedMotion()) {
    gl?.reveal(0.01);
    return;
  }

  const words = splitWords(title);
  gsap.set(words, { yPercent: 115 });
  gsap.set([eyebrow, sub], { opacity: 0, y: 24 });
  gsap.set(nav, { y: -24, opacity: 0 });

  gl?.reveal(2.4);

  gsap
    .timeline({ delay: 0.1 })
    .to(words, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.09 })
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.9')
    .to(sub, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
    .to(nav, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.5');

  // gentle parallax: hero content drifts up as you leave
  gsap.to('.hero-content', {
    yPercent: -18,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ---------- manifesto: pinned, words ignite as you scroll ---------- */
export function initManifesto() {
  const text = document.querySelector('[data-manifesto-text]');
  if (!text) return;

  // wrap words, preserving <em> highlights
  const frag = document.createDocumentFragment();
  [...text.childNodes].forEach((node) => {
    const isEm = node.nodeType === 1 && node.tagName === 'EM';
    const wordsSrc = node.textContent.split(/\s+/).filter(Boolean);
    wordsSrc.forEach((w) => {
      const s = document.createElement('span');
      s.className = 'w' + (isEm ? ' hl' : '');
      s.textContent = w;
      frag.appendChild(s);
      frag.appendChild(document.createTextNode(' '));
    });
  });
  text.textContent = '';
  text.appendChild(frag);

  const words = [...text.querySelectorAll('.w')];

  if (prefersReducedMotion()) {
    words.forEach((w) => {
      w.style.color = 'var(--bone)';
      if (w.classList.contains('hl')) w.classList.add('is-on');
    });
    return;
  }

  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.manifesto-inner',
        start: 'top 65%',
        end: 'bottom 40%',
        scrub: 0.6,
      },
    })
    .to(words, {
      color: 'var(--bone)',
      stagger: 0.1,
      duration: 0.4,
      onUpdate() {
        // ignite highlighted words once they've been "read"
        words.forEach((w) => {
          if (w.classList.contains('hl')) {
            const lit = gsap.getProperty(w, 'color') !== 'rgba(236, 229, 216, 0.28)';
            w.classList.toggle('is-on', lit);
          }
        });
      },
    });
}

/* ---------- stats count-up ---------- */
export function initStats() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotion()) {
      el.textContent = prefix + target + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => (el.textContent = prefix + Math.round(obj.v) + suffix),
    });
  });
}

/* ---------- testimonial carousel ---------- */
export function initQuotes() {
  const track = document.querySelector('[data-quotes-track]');
  if (!track) return;
  const slides = track.children.length;
  const progress = document.querySelector('[data-quote-progress]');
  let index = 0;
  let timer;

  const go = (i) => {
    index = (i + slides) % slides;
    gsap.to(track, {
      xPercent: -100 * index,
      duration: prefersReducedMotion() ? 0 : 1,
      ease: 'power4.inOut',
    });
    progress.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides).padStart(2, '0')}`;
    restart();
  };

  const restart = () => {
    clearInterval(timer);
    if (!prefersReducedMotion()) timer = setInterval(() => go(index + 1), 7000);
  };

  document.querySelector('[data-quote-prev]')?.addEventListener('click', () => go(index - 1));
  document.querySelector('[data-quote-next]')?.addEventListener('click', () => go(index + 1));
  restart();
}

/* ---------- client marquees, velocity-reactive ---------- */
const CLIENTS = [
  'Beardo', 'Nutrizoe', 'Naturevibe', 'CelfieDesign', 'DaadhiMooch', 'Prolicious',
  'Mama Nourish', 'Epic Media Labs', 'Unicorn Finance', 'Only Solitaires',
  'The Big Barbeque', 'Frinza', 'Embark Perfumes', 'Sugarwatchers', 'Adora Naturals', 'Mermaid Swap',
];

export function initMarquees(lenis) {
  const marquees = [...document.querySelectorAll('[data-marquee]')];
  if (!marquees.length) return;

  marquees.forEach((m, mi) => {
    const dir = parseInt(m.dataset.marqueeDir || '1', 10);
    // offset the second row's items so the rows differ
    const names = mi % 2 ? [...CLIENTS.slice(8), ...CLIENTS.slice(0, 8)] : CLIENTS;

    for (let copy = 0; copy < 2; copy++) {
      const inner = document.createElement('div');
      inner.className = 'marquee-inner';
      inner.setAttribute('aria-hidden', copy ? 'true' : 'false');
      names.forEach((n) => {
        const item = document.createElement('span');
        item.className = 'marquee-item';
        item.textContent = n;
        inner.appendChild(item);
        const sep = document.createElement('span');
        sep.className = 'marquee-sep';
        inner.appendChild(sep);
      });
      m.appendChild(inner);
    }

    if (prefersReducedMotion()) return;

    let x = 0;
    const speed = dir * (0.5 + mi * 0.15);
    const half = () => m.scrollWidth / 2;

    gsap.ticker.add(() => {
      const vel = lenis ? Math.abs(lenis.velocity) * 0.05 : 0;
      x -= speed * (1 + Math.min(vel, 4));
      const h = half();
      if (x <= -h) x += h;
      if (x > 0) x -= h;
      m.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
}

/* ---------- generic reveals: section heads, contact title ---------- */
export function initReveals() {
  if (prefersReducedMotion()) return;

  document.querySelectorAll('.section-head').forEach((el) => {
    gsap.from(el.children, {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  const contactTitle = document.querySelector('[data-contact-title]');
  if (contactTitle) {
    const words = splitWords(contactTitle);
    gsap.set(words, { yPercent: 115 });
    gsap.to(words, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.08,
      scrollTrigger: { trigger: contactTitle, start: 'top 80%' },
    });
  }

  gsap.from('.footer-wordmark', {
    yPercent: 40,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 90%' },
  });

  const pageTitle = document.querySelector('[data-page-title]');
  if (pageTitle) {
    const words = splitWords(pageTitle);
    gsap.set(words, { yPercent: 115 });
    gsap.to(words, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.08,
      scrollTrigger: { trigger: pageTitle, start: 'top 90%' },
    });
  }
}

/* ---------- generic block reveal (about/services/contact/work-detail) ---------- */
export function initRevealBlocks(selector = '[data-reveal-block]') {
  if (prefersReducedMotion()) return;
  document.querySelectorAll(selector).forEach((block) => {
    gsap.from(block.children, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: block, start: 'top 78%' },
    });
  });
}

/* ---------- eyebrow scramble-in (secondary-page heroes) ---------- */
export function initScrambleEyebrow(selector = '[data-scramble-eyebrow]') {
  const eyebrow = document.querySelector(selector);
  if (!eyebrow || prefersReducedMotion()) return;
  const label = eyebrow.lastChild;
  if (!label) return;
  const text = label.textContent.trim();
  const span = document.createElement('span');
  span.textContent = text;
  label.replaceWith(span);
  setTimeout(() => scrambleText(span, { duration: 0.7 }), 300);
}

/* ---------- footer year ---------- */
export function setFooterYear() {
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- contact form ---------- */
// FormSubmit delivers enquiries to this address — no account needed. The first
// submission triggers a one-time activation email to mally@beardbros.in;
// activate it there or every submission before that point will fail silently.
// After activating you can swap in the random-alias endpoint FormSubmit gives
// you to keep the address out of the bundle.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/mally@beardbros.in';

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const note = form.querySelector('[data-form-note]');

  form.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('input', () => {
      input.closest('.field').classList.toggle('is-filled', input.value.trim() !== '');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    note.textContent = 'Sending…';

    const data = new FormData(form);
    data.append('_subject', 'New enquiry — beardbros.in');

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      note.textContent = 'Thank you — your enquiry is on its way. We reply within one working day.';
      form.reset();
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-filled'));
    } catch {
      note.textContent = 'Something went wrong — please try again, or reach us on Instagram.';
    } finally {
      button.disabled = false;
    }
  });
}
