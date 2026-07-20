export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

/**
 * Wraps each word of an element in a masked span pair for staggered reveals.
 * Returns the inner spans (the animatable targets). Nested elements (em, a)
 * are treated as single words to preserve styling.
 */
export function splitWords(el) {
  const nodes = [...el.childNodes];
  el.textContent = '';
  const inners = [];

  const append = (word, sourceEl) => {
    const line = document.createElement('span');
    line.className = 'split-line';
    line.style.display = 'inline-block';
    const inner = document.createElement('span');
    inner.className = 'split-inner';
    if (sourceEl) {
      const clone = sourceEl.cloneNode(true);
      clone.textContent = word;
      inner.appendChild(clone);
    } else {
      inner.textContent = word;
    }
    line.appendChild(inner);
    el.appendChild(line);
    el.appendChild(document.createTextNode(' '));
    inners.push(inner);
  };

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => append(w));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.textContent
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => append(w, node));
    }
  });

  return inners;
}

export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Single-open accordion behaviour shared by the homepage services list and
 * any other `.service-row` / `.service-row-btn` group (e.g. the /services/
 * FAQ list) — one row expands, the rest close.
 */
export function bindAccordion(rows) {
  rows.forEach((row) => {
    const btn = row.querySelector('.service-row-btn');
    btn.addEventListener('click', () => {
      const wasOpen = row.classList.contains('is-open');
      rows.forEach((r) => {
        r.classList.remove('is-open');
        r.querySelector('.service-row-btn').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        row.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Cycles an element's text through random glyphs before settling back into
 * its real content, left to right. Used for tasteful award-site flourishes
 * (menu link hover, hero eyebrows) — never touches layout-critical text
 * permanently, and is a no-op under reduced motion.
 */
export function scrambleText(el, opts = {}) {
  const duration = opts.duration ?? 0.6;
  const charset = opts.charset || SCRAMBLE_CHARS;
  const original = opts.text ?? el.textContent;

  if (prefersReducedMotion()) {
    el.textContent = original;
    return { replay() {}, cancel() {} };
  }

  let raf;
  const run = () => {
    cancelAnimationFrame(raf);
    const start = performance.now();
    const len = original.length;
    const step = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const revealCount = Math.floor(p * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        if (i < revealCount || original[i] === ' ') out += original[i];
        else out += charset[(Math.random() * charset.length) | 0];
      }
      el.textContent = out;
      if (p < 1) raf = requestAnimationFrame(step);
      else el.textContent = original;
    };
    raf = requestAnimationFrame(step);
  };

  run();
  return { replay: run, cancel: () => cancelAnimationFrame(raf) };
}
