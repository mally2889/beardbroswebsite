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
