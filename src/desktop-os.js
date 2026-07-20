import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import './styles/desktop-os.css';
import { APPS, PHONE } from './os/apps.js';
import { finder } from './os/finder.js';
import { terminal } from './os/terminal.js';

/**
 * Beard Bros OS — desktop shell.
 *
 * The macOS-shaped twin of phone-os.js: a menu bar, a Dock, and a window
 * manager instead of a single full-screen app panel. Where an app's content
 * already exists in os/apps.js (render()/mount(root) — shell-agnostic by
 * design), this shell reuses it in a window frame instead of rebuilding it;
 * Finder and Terminal are desktop-only, so they're new.
 */

gsap.registerPlugin(Flip);

let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s) => document.querySelector(s);

const dock = $('[data-dt-dock]');
const windowsLayer = $('[data-dt-windows]');

/* Flush apps run their own scroll region / padding, same convention as the
   phone shell (Safari's toolbar, Feed's edge-to-edge grid). */
const FLUSH = new Set(['finder', 'terminal', 'feed']);

const tint = (hue) =>
  `--tint-a:color-mix(in srgb, ${hue} 80%, #fff);--tint-b:color-mix(in srgb, ${hue} 82%, #000)`;

const DOCK_APPS = [
  [PHONE.id, PHONE],
  ['finder', finder],
  ['terminal', terminal],
  null,
  ['safari', APPS.safari],
  ['notes', APPS.notes],
  ['mail', APPS.mail],
  ['calendar', APPS.calendar],
  ['music', APPS.music],
  ['feed', APPS.feed],
];

/* --------------------------------------------------------------- dock -- */

dock.innerHTML = DOCK_APPS.map((entry) => {
  if (!entry) return '<span class="dt-dock__sep" aria-hidden="true"></span>';
  const [id, a] = entry;
  return `
    <button class="dt-dock__item" type="button" role="listitem" data-id="${id}"
            aria-label="${a.label}">
      <span class="dt-dock__tile" data-tile style="${tint(a.hue)}">${a.art}</span>
    </button>`;
}).join('');

/* A soft cursor-proximity magnify — the Dock's signature move. */
{
  const items = [...dock.querySelectorAll('.dt-dock__item')];
  dock.addEventListener('pointermove', (e) => {
    if (reduced) return;
    items.forEach((el) => {
      const box = el.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const dist = Math.abs(e.clientX - cx);
      const scale = 1 + Math.max(0, 1 - dist / 110) * 0.55;
      gsap.to(el, { scale, y: (scale - 1) * -18, duration: 0.18, ease: 'power2.out' });
    });
  });
  dock.addEventListener('pointerleave', () => {
    items.forEach((el) => gsap.to(el, { scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }));
  });
}

/* ---------------------------------------------------------- window mgmt -- */

const APP_BY_ID = new Map(DOCK_APPS.filter(Boolean));

let zTop = 10;
let activeId = null;
const openWindows = new Map();
/* Cascades each new window a little further than the last. */
let cascade = 0;

function dockIconFor(id) {
  return dock.querySelector(`[data-id="${id}"] [data-tile]`);
}

function setActive(id) {
  activeId = id;
  openWindows.forEach((w, wid) => w.el.classList.toggle('is-active', wid === id));
}

function focusWindow(id) {
  const w = openWindows.get(id);
  if (!w) return;
  zTop += 1;
  w.el.style.zIndex = String(zTop);
  setActive(id);
}

function markDockOpen() {
  [...dock.querySelectorAll('.dt-dock__item')].forEach((el) => {
    el.toggleAttribute('data-open', openWindows.has(el.dataset.id));
  });
}

function buildWindow(id, appDef) {
  const w = document.createElement('section');
  w.className = 'dt-window';
  w.setAttribute('aria-label', appDef.title ?? appDef.label);
  w.style.setProperty('--tint-a', `color-mix(in srgb, ${appDef.hue} 80%, #fff)`);
  w.innerHTML = `
    <header class="dt-window__bar" data-bar>
      <span class="dt-window__lights">
        <button type="button" class="is-close" data-close aria-label="Close"></button>
        <button type="button" class="is-min" data-min aria-label="Minimize"></button>
        <button type="button" class="is-max" data-max aria-label="Maximize"></button>
      </span>
      <span class="dt-window__mark" style="${tint(appDef.hue)}">${appDef.art}</span>
      <span class="dt-window__title">${appDef.title ?? appDef.label}</span>
    </header>
    <div class="dt-window__body${FLUSH.has(id) ? ' dt-window__body--flush' : ''}" data-body></div>`;
  return w;
}

const SIZE = { w: 620, h: 460 };

function placeWindow(w) {
  const bounds = windowsLayer.getBoundingClientRect();
  const w0 = Math.min(SIZE.w, bounds.width - 60);
  const h0 = Math.min(SIZE.h, bounds.height - 60);
  const offset = (cascade % 6) * 26;
  cascade += 1;
  w.style.width = `${w0}px`;
  w.style.height = `${h0}px`;
  w.style.left = `${Math.max(20, (bounds.width - w0) / 2 - 80 + offset)}px`;
  w.style.top = `${Math.max(16, (bounds.height - h0) / 2 - 60 + offset)}px`;
}

function openApp(id) {
  const existing = openWindows.get(id);
  if (existing) {
    if (existing.minimized) restoreWindow(id);
    else focusWindow(id);
    return;
  }

  const appDef = APP_BY_ID.get(id);
  if (!appDef) return;

  const icon = dockIconFor(id);
  const w = buildWindow(id, appDef);
  windowsLayer.appendChild(w);
  placeWindow(w);

  const body = w.querySelector('[data-body]');
  body.innerHTML = appDef.render();
  const unmount = appDef.mount?.(body) ?? null;

  openWindows.set(id, { el: w, appDef, unmount, minimized: false });
  markDockOpen();
  zTop += 1;
  w.style.zIndex = String(zTop);
  setActive(id);
  wireWindow(id, w);

  if (reduced || !icon) {
    gsap.fromTo(w, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.2 });
    return;
  }

  Flip.fit(w, icon, { scale: true });
  const state = Flip.getState(w);
  gsap.set(w, { clearProps: 'transform,width,height,top,left' });
  placeWindow(w);
  Flip.from(state, { duration: 0.5, ease: 'power3.out', scale: true });
}

function closeWindow(id) {
  const w = openWindows.get(id);
  if (!w) return;
  const icon = dockIconFor(id);
  const finish = () => {
    w.unmount?.();
    w.el.remove();
    openWindows.delete(id);
    markDockOpen();
    if (activeId === id) {
      const next = [...openWindows.keys()].pop();
      if (next) focusWindow(next);
    }
  };

  if (reduced || !icon) {
    gsap.to(w.el, { autoAlpha: 0, duration: 0.15, onComplete: finish });
    return;
  }
  Flip.fit(w.el, icon, { scale: true, duration: 0.38, ease: 'power3.inOut', onComplete: finish });
}

function minimizeWindow(id) {
  const w = openWindows.get(id);
  const icon = dockIconFor(id);
  if (!w || !icon) return;
  w.minimized = true;
  Flip.fit(w.el, icon, {
    scale: true,
    duration: 0.4,
    ease: 'power3.inOut',
    onComplete: () => {
      w.el.style.visibility = 'hidden';
    },
  });
}

function restoreWindow(id) {
  const w = openWindows.get(id);
  if (!w) return;
  w.minimized = false;
  w.el.style.visibility = 'visible';
  const state = Flip.getState(w.el);
  gsap.set(w.el, { clearProps: 'transform,width,height,top,left' });
  placeWindow(w.el);
  Flip.from(state, { duration: 0.45, ease: 'power3.out', scale: true });
  focusWindow(id);
}

function wireWindow(id, w) {
  w.addEventListener('pointerdown', () => focusWindow(id));
  w.querySelector('[data-close]').addEventListener('click', () => closeWindow(id));
  w.querySelector('[data-min]').addEventListener('click', () => minimizeWindow(id));
  w.querySelector('[data-max]').addEventListener('click', () => w.classList.toggle('is-maxed'));

  const bar = w.querySelector('[data-bar]');
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || w.classList.contains('is-maxed')) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = w.offsetLeft;
    oy = w.offsetTop;
  });
  windowsLayer.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    w.style.left = `${ox + (e.clientX - sx)}px`;
    w.style.top = `${Math.max(0, oy + (e.clientY - sy))}px`;
  });
  windowsLayer.addEventListener('pointerup', () => {
    dragging = false;
  });
}

dock.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  if (btn.dataset.id === PHONE.id) {
    window.location.href = `tel:${PHONE.tel}`;
    return;
  }
  openApp(btn.dataset.id);
});

/* Finder opens on load, like a fresh desktop session. */
openApp('finder');

/* --------------------------------------------------------------- clock -- */

const clock = $('[data-dt-clock]');
const tick = () =>
  (clock.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }));
tick();
setInterval(tick, 15_000);
