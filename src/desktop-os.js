import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import './styles/desktop-os.css';
import {
  APPS,
  PHONE,
  svg,
  fetchWeather,
  radioAudio,
  radioToggle,
  radioNext,
  nowPlayingStation,
  loadStationArt,
  ART_RADIO,
  enhanceIconArt,
  CALENDLY_URL,
} from './os/apps.js';
import { armFirstGestureAutoplay, armVideoDucking } from './os/radio.js';
import { armIdleSleep } from './os/idle.js';
import { finder } from './os/finder.js';
import { terminal } from './os/terminal.js';
import { projectsData } from './data/projects-full.js';
import { caseStudies } from './data/case-studies.js';
import { journal } from './data/journal.js';
import { testimonials } from './data/testimonials.js';

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

const desktop = $('[data-desktop]');
const dock = $('[data-dt-dock]');
const windowsLayer = $('[data-dt-windows]');

/* Flush apps run their own internal scroll region (Finder's sidebar+main
   split, Terminal's fixed prompt row) — everything else, including Feed,
   uses the window body's own padded scroll the way the phone shell's
   app__body does (Feed was wrongly flush here: overflow:hidden on the body
   left nothing to scroll the grid inside it). */
const FLUSH = new Set(['finder', 'terminal']);

/* --------------------------------------------------------------- theme -- */

function setDesktopTheme(mode) {
  desktop.setAttribute('data-theme', mode);
  try {
    localStorage.setItem('dt-theme', mode);
  } catch {
    /* private mode — the theme just won't persist */
  }
}

{
  let stored = null;
  try {
    stored = localStorage.getItem('dt-theme');
  } catch {
    /* ignore */
  }
  setDesktopTheme(stored ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
}

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
  ['radio', APPS.radio],
  ['feed', APPS.feed],
  null,
  ['settings', APPS.settings],
];

/* --------------------------------------------------------------- dock -- */

dock.innerHTML = DOCK_APPS.map((entry) => {
  if (!entry) return '<span class="dt-dock__sep" aria-hidden="true"></span>';
  const [id, a] = entry;
  return `
    <button class="dt-dock__item" type="button" role="listitem" data-id="${id}"
            aria-label="${a.label}">
      <span class="dt-dock__tile" data-tile data-icon-id="${id}" style="${tint(a.hue)}">${a.art}</span>
    </button>`;
}).join('');
enhanceIconArt(dock);

/*
 * A soft cursor-proximity magnify — the Dock's signature move. Scale alone
 * only grows the *visual* box; the flex layout underneath doesn't know
 * about the transform, so neighbours end up overlapping. Growing
 * margin-left/right in step with the scale pushes them apart in the same
 * tween, the way the real Dock reserves room for whatever it's magnifying.
 */
{
  const items = [...dock.querySelectorAll('.dt-dock__item')];
  const DOCK_ITEM = 52;
  const MAX_SCALE = 1.6;
  const RANGE = 130;
  dock.addEventListener('pointermove', (e) => {
    if (reduced) return;
    items.forEach((el) => {
      const box = el.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const dist = Math.abs(e.clientX - cx);
      const t = Math.max(0, 1 - dist / RANGE);
      const eased = t * t * (3 - 2 * t); // smoothstep — gentler falloff than linear
      const scale = 1 + eased * (MAX_SCALE - 1);
      const push = ((scale - 1) * DOCK_ITEM) / 2;
      gsap.to(el, {
        scale,
        y: (scale - 1) * -20,
        marginLeft: push,
        marginRight: push,
        duration: 0.18,
        ease: 'power2.out',
      });
    });
  });
  dock.addEventListener('pointerleave', () => {
    items.forEach((el) =>
      gsap.to(el, { scale: 1, y: 0, marginLeft: 0, marginRight: 0, duration: 0.35, ease: 'power3.out' }),
    );
  });
}

/* ---------------------------------------------------------- window mgmt -- */

/* Every app is openable (from the menu bar, a widget, etc.) even if it has
   no Dock icon — only the Dock icons themselves are limited to DOCK_APPS. */
const APP_BY_ID = new Map([...Object.entries(APPS), ...DOCK_APPS.filter(Boolean)]);

/*
 * Windows are keyed by a unique instance id, not by app id — a Dock click
 * still just focuses whatever's already open (real macOS doesn't spawn a
 * second Finder from the Dock either), but File ▸ New Finder/Terminal
 * Window can hold several windows of the same app open side by side.
 */
let zTop = 10;
let activeWin = null;
let winSeq = 0;
const openWindows = new Map(); // winId -> { el, appId, appDef, unmount, minimized }
/* Cascades each new window a little further than the last. */
let cascade = 0;

function windowsFor(appId) {
  return [...openWindows.entries()]
    .filter(([, w]) => w.appId === appId)
    .sort((a, b) => Number(b[1].el.style.zIndex || 0) - Number(a[1].el.style.zIndex || 0));
}

function dockIconFor(appId) {
  return dock.querySelector(`[data-id="${appId}"] [data-tile]`);
}

function setActive(winId) {
  activeWin = winId;
  openWindows.forEach((w, wid) => w.el.classList.toggle('is-active', wid === winId));
}

function focusWindow(winId) {
  const w = openWindows.get(winId);
  if (!w) return;
  zTop += 1;
  w.el.style.zIndex = String(zTop);
  setActive(winId);
}

function markDockOpen() {
  const openAppIds = new Set([...openWindows.values()].map((w) => w.appId));
  [...dock.querySelectorAll('.dt-dock__item')].forEach((el) => {
    el.toggleAttribute('data-open', openAppIds.has(el.dataset.id));
  });
}

function buildWindow(appId, appDef) {
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
    <div class="dt-window__body${FLUSH.has(appId) ? ' dt-window__body--flush' : ''}" data-body></div>
    <span class="dt-window__resize" data-resize="n"></span>
    <span class="dt-window__resize" data-resize="s"></span>
    <span class="dt-window__resize" data-resize="e"></span>
    <span class="dt-window__resize" data-resize="w"></span>
    <span class="dt-window__resize dt-window__resize--corner" data-resize="ne"></span>
    <span class="dt-window__resize dt-window__resize--corner" data-resize="nw"></span>
    <span class="dt-window__resize dt-window__resize--corner" data-resize="se"></span>
    <span class="dt-window__resize dt-window__resize--corner" data-resize="sw"></span>`;
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

/** Returns the winId that ends up focused — a fresh one, or whichever existing
    instance was brought forward. */
function openApp(appId, { forceNew = false } = {}) {
  const existing = forceNew ? null : windowsFor(appId)[0];
  if (existing) {
    const [winId, w] = existing;
    if (w.minimized) restoreWindow(winId);
    else focusWindow(winId);
    return winId;
  }

  const appDef = APP_BY_ID.get(appId);
  if (!appDef) return null;

  const icon = dockIconFor(appId);
  const w = buildWindow(appId, appDef);
  windowsLayer.appendChild(w);
  placeWindow(w);

  const body = w.querySelector('[data-body]');
  body.innerHTML = appDef.render();
  const unmount = appDef.mount?.(body) ?? null;

  const winId = `${appId}-${++winSeq}`;
  openWindows.set(winId, { el: w, appId, appDef, unmount, minimized: false });
  markDockOpen();
  zTop += 1;
  w.style.zIndex = String(zTop);
  setActive(winId);
  wireWindow(winId, w);

  if (reduced || !icon) {
    gsap.fromTo(w, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.2 });
    return winId;
  }

  Flip.fit(w, icon, { scale: true });
  const state = Flip.getState(w);
  gsap.set(w, { clearProps: 'transform,width,height,top,left' });
  placeWindow(w);
  Flip.from(state, { duration: 0.5, ease: 'power3.out', scale: true });
  return winId;
}

function closeWindow(winId) {
  const w = openWindows.get(winId);
  if (!w) return;
  const icon = dockIconFor(w.appId);
  const finish = () => {
    w.unmount?.();
    w.el.remove();
    openWindows.delete(winId);
    markDockOpen();
    if (activeWin === winId) {
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

function minimizeWindow(winId) {
  const w = openWindows.get(winId);
  const icon = w && dockIconFor(w.appId);
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

function restoreWindow(winId) {
  const w = openWindows.get(winId);
  if (!w) return;
  w.minimized = false;
  w.el.style.visibility = 'visible';
  const state = Flip.getState(w.el);
  gsap.set(w.el, { clearProps: 'transform,width,height,top,left' });
  placeWindow(w.el);
  Flip.from(state, { duration: 0.45, ease: 'power3.out', scale: true });
  focusWindow(winId);
}

const MIN_WIN_W = 320;
const MIN_WIN_H = 220;

function wireWindow(winId, w) {
  w.addEventListener('pointerdown', () => focusWindow(winId));
  w.querySelector('[data-close]').addEventListener('click', () => closeWindow(winId));
  w.querySelector('[data-min]').addEventListener('click', () => minimizeWindow(winId));
  w.querySelector('[data-max]').addEventListener('click', () => w.classList.toggle('is-maxed'));

  const bar = w.querySelector('[data-bar]');

  /* windowsLayer is pointer-events:none (so empty desktop space doesn't
     block widgets/wallpaper underneath it) — which also means it stops
     getting pointermove once the cursor outruns the window mid-drag, e.g.
     dragging a corner handle outward past the window's own edge into that
     empty space. Capturing the pointer on the bar/handle itself routes
     every subsequent event straight there regardless of what is or isn't
     under the cursor. */
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || w.classList.contains('is-maxed')) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = w.offsetLeft;
    const oy = w.offsetTop;
    bar.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      w.style.left = `${ox + (ev.clientX - sx)}px`;
      w.style.top = `${Math.max(0, oy + (ev.clientY - sy))}px`;
    };
    const onUp = () => {
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
  });

  w.querySelectorAll('[data-resize]').forEach((handle) => {
    handle.addEventListener('pointerdown', (e) => {
      if (w.classList.contains('is-maxed')) return;
      e.stopPropagation();
      focusWindow(winId);

      const dir = handle.dataset.resize;
      const sx = e.clientX;
      const sy = e.clientY;
      const ox = w.offsetLeft;
      const oy = w.offsetTop;
      const ow = w.offsetWidth;
      const oh = w.offsetHeight;
      handle.setPointerCapture(e.pointerId);

      const onMove = (ev) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        if (dir.includes('e')) w.style.width = `${Math.max(MIN_WIN_W, ow + dx)}px`;
        if (dir.includes('s')) w.style.height = `${Math.max(MIN_WIN_H, oh + dy)}px`;
        if (dir.includes('w')) {
          const nw = Math.max(MIN_WIN_W, ow - dx);
          w.style.width = `${nw}px`;
          w.style.left = `${ox + (ow - nw)}px`;
        }
        if (dir.includes('n')) {
          const nh = Math.max(MIN_WIN_H, oh - dy);
          w.style.height = `${nh}px`;
          w.style.top = `${Math.max(0, oy + (oh - nh))}px`;
        }
      };
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
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

/* A brief boot sequence instead of dropping straight onto a windowed
   desktop — and unlike before, nothing auto-opens once it clears; the
   desktop starts empty, the way turning on a real Mac actually goes. */
(function runBoot() {
  const bootEl = $('[data-dt-boot]');
  const fill = $('[data-dt-boot-fill]');
  if (!bootEl) return;

  if (reduced) {
    bootEl.remove();
    return;
  }

  gsap.to(fill, {
    width: '100%',
    duration: 1.5,
    ease: 'power2.inOut',
    onComplete: () => {
      gsap.to(bootEl, {
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.2,
        onComplete: () => bootEl.remove(),
      });
    },
  });
})();

/* --------------------------------------------------------------- clock -- */

const clock = $('[data-dt-clock]');
const dateEl = $('[data-dt-date]');
const tick = () => {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};
tick();
setInterval(tick, 15_000);

/* ------------------------------------------------------------- toast -- */

/** A brief, self-dismissing confirmation — for actions with no window to show them in. */
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'dt-toast';
  el.textContent = msg;
  desktop.appendChild(el);
  gsap.fromTo(el, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: reduced ? 0 : 0.25 });
  gsap.to(el, {
    autoAlpha: 0,
    delay: 1.3,
    duration: reduced ? 0 : 0.35,
    onComplete: () => el.remove(),
  });
}

function copyText(text, msg) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast(msg))
    .catch(() => toast('Copy failed'));
}

/* Files → About Beard Bros is the closest thing to an "About" panel we have. */
function openAbout() {
  const winId = openApp('files');
  const root = openWindows.get(winId)?.el;
  root?.querySelector('[data-file-back]')?.click();
  root?.querySelector('[data-file="about"]')?.click();
}

function restartFinder() {
  const current = windowsFor('finder')[0];
  if (current) {
    closeWindow(current[0]);
    setTimeout(() => openApp('finder'), 420);
  } else {
    openApp('finder');
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

/* ------------------------------------------------------- movable layer -- */

/*
 * Shared drag behaviour for widgets and desktop icons: press, drag past a
 * small threshold, and the element detaches from the grid/flex flow that
 * placed it into free position:absolute — same "which layer owns the
 * pointermove" pattern wireWindow uses for dragging a window by its title
 * bar. The landing spot is remembered in localStorage so a reload doesn't
 * reset the desktop. A pointerdown that never clears the threshold is a
 * click, not a drag — the caller checks `justDragged` to tell them apart.
 */

const LAYOUT_KEY = 'dt-layout';
let layout;
try {
  layout = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? '{}');
} catch {
  layout = {};
}

function saveLayout() {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    /* private mode — the layout just won't persist */
  }
}

function placeAbsolute(el, x, y) {
  el.style.position = 'absolute';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.margin = '0';
  /* Once freed from the grid/flex flow it should paint above whatever's
     still flowing normally, not fall behind neighbours that come later
     in DOM order. */
  el.style.zIndex = '2';
}

function makeMovable(el, container, key) {
  const stored = layout[key];
  if (stored) {
    placeAbsolute(el, stored.x, stored.y);
    if (stored.w) el.style.width = `${stored.w}px`;
    if (stored.h) el.style.height = `${stored.h}px`;
  }

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const rect = el.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    const ox = rect.left - parentRect.left;
    const oy = rect.top - parentRect.top;
    let moved = false;
    let dx = 0;
    let dy = 0;

    /* The container is pointer-events:none so empty desktop space doesn't
       swallow clicks meant for whatever's behind it — but that also means
       it stops receiving pointermove once the cursor outruns the element
       being dragged. Capturing the pointer on the element itself routes
       every subsequent event straight to it regardless of what's
       (not) under the cursor, which container-level listening can't. */
    el.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      dx = ev.clientX - sx;
      dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 4) {
        moved = true;
        el.classList.add('is-dragging');
        if (el.style.position !== 'absolute') placeAbsolute(el, ox, oy);
      }
      /* The actual drag motion is a `transform`, not `left`/`top` — a
         compositor-only property the browser can update every frame
         without re-running layout. Setting left/top directly on every
         pointermove (as this used to do) forces a synchronous layout
         recalculation per event, which is what made dragging feel laggy
         rather than smooth. left/top only get their real, final values
         once, in onUp below. */
      if (moved) el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.classList.remove('is-dragging');
      if (moved) {
        el.style.transform = '';
        placeAbsolute(el, ox + dx, oy + dy);
        layout[key] = { ...(layout[key] ?? {}), x: ox + dx, y: oy + dy };
        saveLayout();
        el.dataset.justDragged = '1';
      }
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  });
}

/* A single SE-corner handle, same pointer-capture reasoning as the window
   resize handles — dragging a widget larger than its default grid size
   detaches it into free positioning first (same as moving it does), so its
   new width/height aren't fighting the grid track it used to live in. */
function makeResizable(el, container, key, minW = 170, minH = 90) {
  const handle = document.createElement('span');
  handle.className = 'dtw__resize';
  handle.setAttribute('aria-hidden', 'true');
  el.appendChild(handle);

  handle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (el.style.position !== 'absolute') {
      const rect = el.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      placeAbsolute(el, rect.left - parentRect.left, rect.top - parentRect.top);
    }

    const sx = e.clientX;
    const sy = e.clientY;
    const ow = el.offsetWidth;
    const oh = el.offsetHeight;
    handle.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');

    /* Resizing genuinely changes layout (unlike a move, it can't be faked
       with a compositor-only transform), so the fix here is coalescing —
       at most one width/height write per animation frame, however fast
       pointermove actually fires, instead of forcing a fresh layout pass
       on every single event. */
    let pendingW = ow;
    let pendingH = oh;
    let rafId = null;

    const applyPending = () => {
      rafId = null;
      el.style.width = `${pendingW}px`;
      el.style.height = `${pendingH}px`;
    };

    const onMove = (ev) => {
      pendingW = Math.max(minW, ow + (ev.clientX - sx));
      pendingH = Math.max(minH, oh + (ev.clientY - sy));
      if (rafId === null) rafId = requestAnimationFrame(applyPending);
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
      applyPending();
      el.classList.remove('is-dragging');
      layout[key] = {
        ...(layout[key] ?? {}),
        x: parseFloat(el.style.left),
        y: parseFloat(el.style.top),
        w: el.offsetWidth,
        h: el.offsetHeight,
      };
      saveLayout();
      el.dataset.justDragged = '1';
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

/* ---------------------------------------------------------- widgets -- */

const PLAY_ICON = svg('<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>', 0);
const PAUSE_ICON = svg(
  '<rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/>',
  0,
);
const ICON_SKIP_NEXT = svg(
  '<path d="M18 5v14" stroke-linecap="round"/><path d="M6 6.5v11l10-5.5z" fill="currentColor" stroke="none"/>',
  1.8,
);

const widgetsEl = $('[data-dt-widgets]');
let widgetsVisible = true;

function setWidgetsVisible(on) {
  widgetsVisible = on;
  widgetsEl.classList.toggle('is-hidden', !on);
}

const fmtJournalDate = (d) =>
  new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
const latestPost = journal[0];

widgetsEl.innerHTML = `
  <article class="dtw dtw--wide dtw--about" data-dtw="about" data-wid="w-about">
    <p class="dtw__label">About Beard Bros</p>
    <p class="dtw__lede">Two brothers, one system — paid media, brand, web, social and content sharing a single strategy.</p>
    <dl class="dtw__stats">
      <div><dt>Since</dt><dd>2015</dd></div>
      <div><dt>Clients</dt><dd>100+</dd></div>
      <div><dt>Media</dt><dd>₹5Cr+</dd></div>
    </dl>
  </article>
  <article class="dtw dtw--clocks" data-dtw="clock" data-wid="w-clocks">
    <p class="dtw__label">The Studio Runs on Two Clocks</p>
    <div class="dtw__clocks">
      <div class="dtw__clock"><span class="dtw__dot" style="--dot:#e8b04b"></span>Mumbai<b data-dtw-clock="Asia/Kolkata">--:--</b></div>
      <div class="dtw__clock"><span class="dtw__dot" style="--dot:#7a68e0"></span>New York<b data-dtw-clock="America/New_York">--:--</b></div>
    </div>
  </article>
  <article class="dtw dtw--cal" data-dtw="calendar" data-wid="w-cal">
    <p class="dtw__label" data-dtw-cal-month>—</p>
    <div class="dtw__cal-dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
    <div class="dtw__cal-grid" data-dtw-cal-grid></div>
    <a class="dtw__cal-cta" href="${CALENDLY_URL}" target="_blank" rel="noopener" data-dtw-calendly>Book a 30 min call</a>
  </article>
  <article class="dtw dtw--stat" data-dtw="finder" data-wid="w-portfolio">
    <p class="dtw__label">Portfolio</p>
    <p class="dtw__stat-num">${projectsData.length}</p>
    <p class="dtw__stat-sub">Projects in Finder</p>
  </article>
  <article class="dtw dtw--stat" data-dtw="safari" data-wid="w-cases">
    <p class="dtw__label">Case Studies</p>
    <p class="dtw__stat-num">${caseStudies.length}</p>
    <p class="dtw__stat-sub">Documented wins</p>
  </article>
  <article class="dtw dtw--wide dtw--journal" data-dtw="journal" data-wid="w-journal">
    <p class="dtw__label">Journal · Latest</p>
    <p class="dtw__journal-title">${latestPost.title}</p>
    <p class="dtw__journal-meta">${fmtJournalDate(latestPost.date)} · ${latestPost.read} read</p>
  </article>
  <article class="dtw dtw--wide dtw--wx" data-dtw="weather" data-wid="w-wx">
    <p class="dtw__label">Mumbai</p>
    <p class="dtw__wx-temp" data-dtw-wx-temp>—</p>
    <p class="dtw__wx-desc" data-dtw-wx-desc>Fetching live conditions…</p>
  </article>
  <article class="dtw dtw--wide dtw--radio" data-dtw="radio" data-wid="w-radio">
    <p class="dtw__label">On Air</p>
    <div class="dtw__music-row">
      <span class="dtw__music-art" data-dtw-radio-art>${ART_RADIO}</span>
      <div class="dtw__music-meta">
        <p class="dtw__music-title" data-dtw-radio-station>Tuning in…</p>
        <p class="dtw__music-artist" data-dtw-radio-tags>Finding a station</p>
      </div>
      <div class="dtw__music-controls">
        <button type="button" class="dtw__music-btn dtw__music-btn--play" data-dtw-radio-play aria-label="Play">${PLAY_ICON}</button>
        <button type="button" class="dtw__music-btn" data-dtw-radio-next aria-label="Next station">${ICON_SKIP_NEXT}</button>
      </div>
    </div>
  </article>`;

const WIDGET_LABELS = {
  'w-about': 'About Beard Bros',
  'w-clocks': 'Studio Clocks',
  'w-cal': 'Calendar',
  'w-portfolio': 'Portfolio',
  'w-cases': 'Case Studies',
  'w-journal': 'Journal',
  'w-wx': 'Weather',
  'w-radio': 'On Air (Radio)',
  'w-quote': 'Client Quote',
  'w-case-highlight': 'Case Study Highlight',
  'w-ig': 'On Instagram',
};

/* Genuinely new widget types — never on the desktop by default, only
   reachable through the "Add a widget" drawer below. Each reuses an
   existing card size (.dtw--stat, .dtw--wide) rather than inventing new
   dimensions, and opens the app its content actually lives in, same as
   every default widget already does. */
const AVAILABLE_WIDGETS = {
  'w-quote': {
    label: WIDGET_LABELS['w-quote'],
    build: () => {
      const t = testimonials[Math.floor(Math.random() * testimonials.length)];
      return `
        <article class="dtw dtw--wide dtw--quote" data-dtw="safari" data-wid="w-quote">
          <p class="dtw__label">What Clients Say</p>
          <p class="dtw__quote-text">“${t.quote}”</p>
          <p class="dtw__quote-by"><b>${t.author}</b> · ${t.role}</p>
        </article>`;
    },
  },
  'w-case-highlight': {
    label: WIDGET_LABELS['w-case-highlight'],
    build: () => {
      const c = caseStudies[Math.floor(Math.random() * caseStudies.length)];
      const m = c.metrics[0];
      return `
        <article class="dtw dtw--stat" data-dtw="safari" data-wid="w-case-highlight">
          <p class="dtw__label">${c.client}</p>
          <p class="dtw__stat-num">${m.value}</p>
          <p class="dtw__stat-sub">${m.label}</p>
        </article>`;
    },
  },
  'w-ig': {
    label: WIDGET_LABELS['w-ig'],
    build: () => {
      const p = projectsData[Math.floor(Math.random() * projectsData.length)];
      return `
        <article class="dtw dtw--wide dtw--ig" data-dtw="feed" data-wid="w-ig">
          <p class="dtw__label">On Instagram</p>
          <div class="dtw__ig-row">
            <img class="dtw__ig-img" src="${p.images[0]}" alt="" loading="lazy" decoding="async" />
            <div class="dtw__ig-meta">
              <p class="dtw__ig-title">${p.client}</p>
              <p class="dtw__ig-sub">${p.summary}</p>
            </div>
          </div>
        </article>`;
    },
  },
};

/* One remove (×) button per card, added programmatically rather than
   repeated in all eight templates above — sits hidden until Control
   Center's "Edit Widgets" toggle puts the desktop into edit mode. Wired for
   drag/resize right here, once — widgets added later through the "Add a
   widget" drawer wire themselves the same way inside materializeWidget(),
   so nothing downstream re-wires (and re-adds a second resize handle to)
   any card twice. */
[...widgetsEl.querySelectorAll('.dtw')].forEach((el) => {
  el.insertAdjacentHTML(
    'afterbegin',
    `<button type="button" class="dtw__remove" data-dtw-remove aria-label="Remove widget">${svg('<path d="M6 6l12 12M18 6L6 18"/>', 2.2)}</button>`,
  );
  makeMovable(el, widgetsEl, el.dataset.wid);
  makeResizable(el, widgetsEl, el.dataset.wid);
});

let editWidgetsMode = false;
let hiddenWidgets = new Set();
try {
  hiddenWidgets = new Set(JSON.parse(localStorage.getItem('dt-widgets-hidden') ?? '[]'));
} catch {
  hiddenWidgets = new Set();
}

let addedWidgets = new Set();
try {
  addedWidgets = new Set(JSON.parse(localStorage.getItem('dt-widgets-added') ?? '[]'));
} catch {
  addedWidgets = new Set();
}

function saveHiddenWidgets() {
  try {
    localStorage.setItem('dt-widgets-hidden', JSON.stringify([...hiddenWidgets]));
  } catch {
    /* private mode — the choice just won't persist */
  }
}

function saveAddedWidgets() {
  try {
    localStorage.setItem('dt-widgets-added', JSON.stringify([...addedWidgets]));
  } catch {
    /* private mode — the choice just won't persist */
  }
}

function applyHiddenWidgets() {
  [...widgetsEl.querySelectorAll('.dtw')].forEach((el) => {
    el.classList.toggle('is-widget-hidden', hiddenWidgets.has(el.dataset.wid));
  });
}

/* Builds a widget the user picked from the "Add a widget" drawer — a card
   the default layout never shipped with. Wired through the exact same
   remove button / drag / resize machinery as the original eight, so once
   it's on the desktop it behaves identically to them. */
function materializeWidget(wid) {
  const entry = AVAILABLE_WIDGETS[wid];
  if (!entry || widgetsEl.querySelector(`[data-wid="${wid}"]`)) return;
  widgetsEl.insertAdjacentHTML('beforeend', entry.build());
  const el = widgetsEl.querySelector(`[data-wid="${wid}"]`);
  el.insertAdjacentHTML(
    'afterbegin',
    `<button type="button" class="dtw__remove" data-dtw-remove aria-label="Remove widget">${svg('<path d="M6 6l12 12M18 6L6 18"/>', 2.2)}</button>`,
  );
  makeMovable(el, widgetsEl, wid);
  makeResizable(el, widgetsEl, wid);
}

[...addedWidgets].forEach(materializeWidget);
applyHiddenWidgets();

function renderWidgetPicker() {
  const picker = $('[data-dt-cc-widgets-picker]');
  const availableToAdd = Object.keys(AVAILABLE_WIDGETS).filter((wid) => !addedWidgets.has(wid));

  if (!editWidgetsMode || (!hiddenWidgets.size && !availableToAdd.length)) {
    picker.hidden = true;
    picker.innerHTML = '';
    return;
  }

  picker.hidden = false;
  picker.innerHTML = `
    ${
      hiddenWidgets.size
        ? `
      <p class="dt-cc__widgets-label">Hidden — tap to add back</p>
      <div class="dt-cc__widgets-chips">
        ${[...hiddenWidgets]
          .map((wid) => `<button type="button" class="dt-cc__widgets-chip" data-dtw-restore="${wid}">${WIDGET_LABELS[wid] ?? wid}</button>`)
          .join('')}
      </div>`
        : ''
    }
    ${
      availableToAdd.length
        ? `
      <p class="dt-cc__widgets-label">Add a widget</p>
      <div class="dt-cc__widgets-chips">
        ${availableToAdd
          .map(
            (wid) =>
              `<button type="button" class="dt-cc__widgets-chip dt-cc__widgets-chip--add" data-dtw-add="${wid}">+ ${WIDGET_LABELS[wid]}</button>`,
          )
          .join('')}
      </div>`
        : ''
    }`;
}

function setEditWidgetsMode(on) {
  editWidgetsMode = on;
  widgetsEl.classList.toggle('is-editing', on);
  renderWidgetPicker();
}

$('[data-dt-cc-widgets-picker]').addEventListener('click', (e) => {
  const restoreChip = e.target.closest('[data-dtw-restore]');
  if (restoreChip) {
    hiddenWidgets.delete(restoreChip.dataset.dtwRestore);
    saveHiddenWidgets();
    applyHiddenWidgets();
    renderWidgetPicker();
    return;
  }

  const addChip = e.target.closest('[data-dtw-add]');
  if (addChip) {
    const wid = addChip.dataset.dtwAdd;
    materializeWidget(wid);
    addedWidgets.add(wid);
    saveAddedWidgets();
    applyHiddenWidgets();
    renderWidgetPicker();
  }
});

widgetsEl.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('[data-dtw-remove]');
  if (removeBtn) {
    const card = removeBtn.closest('.dtw');
    hiddenWidgets.add(card.dataset.wid);
    saveHiddenWidgets();
    applyHiddenWidgets();
    renderWidgetPicker();
    return;
  }

  if (e.target.closest('[data-dtw-radio-next]')) {
    radioNext();
    return;
  }
  if (e.target.closest('[data-dtw-radio-play]')) {
    radioToggle();
    return;
  }
  if (e.target.closest('[data-dtw-calendly]')) return; // real link — let it navigate, don't also open Calendar

  const w = e.target.closest('[data-dtw]');
  if (!w) return;
  if (w.dataset.justDragged) {
    delete w.dataset.justDragged;
    return;
  }
  if (editWidgetsMode) return;
  if (w.dataset.dtw === 'about') openAbout();
  else openApp(w.dataset.dtw);
});

/* Mirrors the Radio app's own UI sync: read the shared audio element's
   native events, so the widget stays correct whether playback started
   here, in the Radio app window, or Control Center. */
(function paintRadioWidget() {
  const artEl = widgetsEl.querySelector('[data-dtw-radio-art]');
  const stationEl = widgetsEl.querySelector('[data-dtw-radio-station]');
  const tagsEl = widgetsEl.querySelector('[data-dtw-radio-tags]');
  const playBtn = widgetsEl.querySelector('[data-dtw-radio-play]');

  const paint = () => {
    const info = nowPlayingStation();
    if (!info) {
      stationEl.textContent = 'Tuning in…';
      tagsEl.textContent = 'Finding a station';
      return;
    }
    stationEl.textContent = info.name;
    tagsEl.textContent = info.tags || 'Rock';
    playBtn.innerHTML = info.paused ? PLAY_ICON : PAUSE_ICON;
    playBtn.setAttribute('aria-label', info.paused ? 'Play' : 'Pause');
    loadStationArt(info.favicon).then((img) => {
      if (img) {
        artEl.innerHTML = '';
        artEl.appendChild(img);
      } else {
        artEl.innerHTML = ART_RADIO;
      }
    });
  };

  paint();
  radioAudio.addEventListener('play', paint);
  radioAudio.addEventListener('pause', paint);
  radioAudio.addEventListener('loadedmetadata', paint);
})();

armFirstGestureAutoplay();
armVideoDucking();

(function paintCalendarWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  widgetsEl.querySelector('[data-dtw-cal-month]').textContent = now.toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  const cells = [];
  for (let i = 0; i < (first + 6) % 7; i++) cells.push('<span></span>');
  for (let d = 1; d <= days; d++) cells.push(`<span class="${d === today ? 'is-today' : ''}">${d}</span>`);
  widgetsEl.querySelector('[data-dtw-cal-grid]').innerHTML = cells.join('');
})();

(function paintStudioClocks() {
  const els = [...widgetsEl.querySelectorAll('[data-dtw-clock]')];
  const paint = () => {
    const now = new Date();
    els.forEach((el) => {
      el.textContent = now.toLocaleTimeString([], {
        timeZone: el.dataset.dtwClock,
        hour: '2-digit',
        minute: '2-digit',
      });
    });
  };
  paint();
  setInterval(paint, 15_000);
})();

fetchWeather({ lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' })
  .then((d) => {
    widgetsEl.querySelector('[data-dtw-wx-temp]').textContent = `${Math.round(d.current.temperature_2m)}°`;
    widgetsEl.querySelector('[data-dtw-wx-desc]').textContent =
      `H:${Math.round(d.daily.temperature_2m_max[0])}°  L:${Math.round(d.daily.temperature_2m_min[0])}°`;
  })
  .catch(() => {
    widgetsEl.querySelector('[data-dtw-wx-desc]').textContent = 'Weather unavailable';
  });

/* ------------------------------------------------------ desktop icons -- */

const iconsRailEl = $('[data-dt-icons-rail]');

const FOLDER_ICON = `
  <svg viewBox="0 0 48 40" aria-hidden="true">
    <path d="M2 8a4 4 0 0 1 4-4h10l4 5h22a4 4 0 0 1 4 4v2H2z" fill="#5fc0f5"/>
    <path d="M2 12h44v20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#0a84ff"/>
  </svg>`;

const DOC_ICON = `
  <svg viewBox="0 0 40 48" aria-hidden="true">
    <path d="M4 2h21l11 11v33H4z" fill="#fff" opacity=".95"/>
    <path d="M25 2l11 11H25z" fill="#cbb8f5"/>
    <g stroke="#8f7ae8" stroke-width="2.2" stroke-linecap="round">
      <line x1="10" y1="24" x2="30" y2="24"/><line x1="10" y1="30" x2="30" y2="30"/><line x1="10" y1="36" x2="22" y2="36"/>
    </g>
  </svg>`;

const DESKTOP_ICONS = [
  { id: 'files', label: 'Files', art: FOLDER_ICON },
  { id: 'journal', label: 'Journal', art: DOC_ICON },
];

iconsRailEl.innerHTML = DESKTOP_ICONS.map(
  (d) => `
    <button type="button" class="dt-dicon" data-dtw="${d.id}" data-wid="i-${d.id}">
      <span class="dt-dicon__art" data-icon-id="${d.id}">${d.art}</span>
      <span class="dt-dicon__label">${d.label}</span>
    </button>`,
).join('');
enhanceIconArt(iconsRailEl);

[...iconsRailEl.querySelectorAll('.dt-dicon')].forEach((el) => makeMovable(el, iconsRailEl, el.dataset.wid));

/* Single click selects (like a real desktop icon); double-click opens.
   A drag ending on a click is harmless here — worst case it toggles the
   selection highlight, so this skips the justDragged guard the widgets use. */
iconsRailEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-dtw]');
  if (!b) return;
  iconsRailEl.querySelectorAll('.dt-dicon').forEach((x) => x.classList.toggle('is-selected', x === b));
});

iconsRailEl.addEventListener('dblclick', (e) => {
  const b = e.target.closest('[data-dtw]');
  if (b) openApp(b.dataset.dtw);
});

document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.dt-dicon')) {
    iconsRailEl.querySelectorAll('.dt-dicon.is-selected').forEach((x) => x.classList.remove('is-selected'));
  }
});

/* -------------------------------------------------------------- menus -- */

/*
 * A real macOS-style menu bar: Beard Bros (the app/brand menu), then File,
 * Edit, View, Window. Each entry is rebuilt from its items() function right
 * before it opens, so state that changes underneath it — which window is
 * active, whether widgets are showing — is always current rather than
 * baked in once at load.
 */

function windowMenuItems() {
  const entries = [...openWindows.entries()];
  if (!entries.length) return [{ label: 'No Open Windows', cmd: 'noop', disabled: true }];
  /* Two Finder windows read as "Finder" and "Finder (2)", same as macOS. */
  const seen = new Map();
  return entries.map(([winId, w]) => {
    const n = (seen.get(w.appId) ?? 0) + 1;
    seen.set(w.appId, n);
    const base = w.appDef.title ?? w.appDef.label;
    return {
      label: n > 1 ? `${base} (${n})` : base,
      cmd: 'focus-window',
      arg: winId,
      checked: winId === activeWin,
    };
  });
}

const MENUS = [
  {
    id: 'brand',
    label: 'Beard Bros',
    brand: true,
    items: () => [
      { label: 'About Beard Bros', cmd: 'about' },
      'sep',
      { label: 'System Settings…', cmd: 'open-cc' },
      'sep',
      { label: 'Restart Finder', cmd: 'restart-finder' },
      { label: 'Log Out Visitor', cmd: 'logout' },
    ],
  },
  {
    id: 'file',
    label: 'File',
    items: () => [
      { label: 'New Finder Window', cmd: 'new-finder', kbd: '⌘N' },
      { label: 'New Terminal Window', cmd: 'new-terminal' },
      'sep',
      { label: 'Close Window', cmd: 'close-window', kbd: '⌘W', disabled: !activeWin },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: () => [
      { label: 'Copy Email Address', cmd: 'copy-email' },
      { label: 'Copy Phone Number', cmd: 'copy-phone' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: () => [
      { label: 'Show Desktop Widgets', cmd: 'toggle-widgets', checked: widgetsVisible },
      {
        label: document.fullscreenElement ? 'Exit Full Screen' : 'Enter Full Screen',
        cmd: 'toggle-fullscreen',
      },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    items: () => [
      ...windowMenuItems(),
      'sep',
      { label: 'Minimize', cmd: 'minimize-active', disabled: !activeWin },
      { label: 'Zoom', cmd: 'zoom-active', disabled: !activeWin },
      { label: 'Bring All to Front', cmd: 'bring-all-front', disabled: !openWindows.size },
    ],
  },
];

function runCommand(cmd, arg) {
  switch (cmd) {
    case 'about':
      openAbout();
      break;
    case 'open-cc':
      setCC(true);
      break;
    case 'restart-finder':
      restartFinder();
      break;
    case 'logout':
      setLoggedOut(true);
      break;
    case 'new-finder':
      openApp('finder', { forceNew: true });
      break;
    case 'new-terminal':
      openApp('terminal', { forceNew: true });
      break;
    case 'close-window':
      if (activeWin) closeWindow(activeWin);
      break;
    case 'copy-email':
      copyText('hello@beardbros.in', 'Email address copied');
      break;
    case 'copy-phone':
      copyText(PHONE.tel, 'Phone number copied');
      break;
    case 'toggle-widgets':
      setWidgetsVisible(!widgetsVisible);
      break;
    case 'toggle-fullscreen':
      toggleFullscreen();
      break;
    case 'focus-window':
      if (arg) {
        const w = openWindows.get(arg);
        if (w?.minimized) restoreWindow(arg);
        else if (w) focusWindow(arg);
      }
      break;
    case 'minimize-active':
      if (activeWin) minimizeWindow(activeWin);
      break;
    case 'zoom-active':
      if (activeWin) openWindows.get(activeWin)?.el.classList.toggle('is-maxed');
      break;
    case 'bring-all-front':
      [...openWindows.keys()].forEach(focusWindow);
      break;
    case 'cycle-wallpaper':
      cycleWallpaper();
      break;
    case 'reset-layout':
      resetDesktopLayout();
      break;
    case 'dock-open':
      if (arg) openApp(arg);
      break;
    case 'dock-show-all':
      if (arg) windowsFor(arg).forEach(([winId]) => focusWindow(winId));
      break;
    case 'dock-quit':
      if (arg) windowsFor(arg).forEach(([winId]) => closeWindow(winId));
      break;
    default:
      break;
  }
}

function renderMenuPanel(menu) {
  return menu
    .items()
    .map((it) => {
      if (it === 'sep') return '<span class="dt-menu__sep"></span>';
      return `
        <button type="button" class="dt-menu__item" role="menuitem" data-cmd="${it.cmd}"
                data-arg="${it.arg ?? ''}" ${it.disabled ? 'disabled' : ''}>
          <span class="dt-menu__check">${it.checked ? '✓' : ''}</span>
          <span class="dt-menu__label">${it.label}</span>
          ${it.kbd ? `<span class="dt-menu__kbd">${it.kbd}</span>` : ''}
        </button>`;
    })
    .join('');
}

const menusEl = $('[data-dt-menus]');

menusEl.innerHTML = MENUS.map(
  (m) => `
    <div class="dt-menu" data-menu-id="${m.id}">
      <button type="button" class="dt-menu__trigger${m.brand ? ' dt-menu__trigger--brand' : ''}"
              data-menu-trigger aria-haspopup="menu" aria-expanded="false">${
                m.brand
                  ? `<img class="dt-menu__brand-mark" src="/beard-bros-logo.webp" alt="" aria-hidden="true" />${m.label}`
                  : m.label
              }</button>
      <div class="dt-menu__panel" data-menu-panel role="menu"></div>
    </div>`,
).join('');

/*
 * Easter egg: five quick taps on the Beard Bros mark in the menu bar rains a
 * handful of the real agency logo down the screen — doesn't interfere with
 * its normal job of opening the brand menu on a single click, just layers
 * a bonus effect on top for anyone curious enough to mash it.
 */
function launchBeardConfetti() {
  toast('🧔 Two brothers, one system.');
  if (reduced) return;
  for (let i = 0; i < 14; i++) {
    const img = document.createElement('img');
    img.src = '/beard-bros-logo.webp';
    img.className = 'dt-confetti';
    img.alt = '';
    const size = 22 + Math.random() * 26;
    img.style.width = `${size}px`;
    img.style.left = `${Math.random() * window.innerWidth}px`;
    desktop.appendChild(img);
    gsap.fromTo(
      img,
      { y: -60, rotate: 0, autoAlpha: 0 },
      {
        y: window.innerHeight + 80,
        rotate: (Math.random() - 0.5) * 360,
        autoAlpha: 1,
        duration: 2.2 + Math.random() * 1.2,
        delay: Math.random() * 0.4,
        ease: 'power1.in',
        onComplete: () => img.remove(),
      },
    );
  }
}

{
  let brandTaps = 0;
  let brandTapTimer = null;
  menusEl.querySelector('[data-menu-id="brand"] [data-menu-trigger]')?.addEventListener('click', () => {
    brandTaps += 1;
    clearTimeout(brandTapTimer);
    brandTapTimer = setTimeout(() => {
      brandTaps = 0;
    }, 1500);
    if (brandTaps >= 5) {
      brandTaps = 0;
      launchBeardConfetti();
    }
  });
}

let openMenuId = null;

/* Closes the File/Edit/View/Window dropdowns only — Control Center has its
   own open state so a menu command (e.g. "System Settings…") can open it
   without this same post-click cleanup immediately closing it again. */
function closeMenus() {
  openMenuId = null;
  menusEl.querySelectorAll('.dt-menu').forEach((el) => {
    el.classList.remove('is-open');
    el.querySelector('[data-menu-trigger]').setAttribute('aria-expanded', 'false');
  });
}

function closeAll() {
  closeMenus();
  setCC(false);
  closeCtxMenu();
}

/* ------------------------------------------------------ context menu -- */

/*
 * Right-click, macOS-style: a context menu on empty desktop space, and a
 * separate one for a Dock icon (Open / Show All Windows / Quit). Both
 * reuse renderMenuPanel()/runCommand() — same items shape as the menu bar,
 * just positioned at the cursor instead of under a trigger.
 */
const ctxMenuEl = document.createElement('div');
ctxMenuEl.className = 'dt-ctx-menu';
ctxMenuEl.setAttribute('role', 'menu');
desktop.appendChild(ctxMenuEl);

function closeCtxMenu() {
  ctxMenuEl.classList.remove('is-open');
}

function openCtxMenu(items, x, y) {
  closeMenus();
  setCC(false);
  ctxMenuEl.innerHTML = renderMenuPanel({ items: () => items });
  ctxMenuEl.classList.add('is-open');

  const bounds = desktop.getBoundingClientRect();
  const w = ctxMenuEl.offsetWidth;
  const h = ctxMenuEl.offsetHeight;
  ctxMenuEl.style.left = `${Math.min(x, bounds.width - w - 8)}px`;
  ctxMenuEl.style.top = `${Math.min(y, bounds.height - h - 8)}px`;
}

ctxMenuEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cmd]');
  if (!btn || btn.disabled) return;
  runCommand(btn.dataset.cmd, btn.dataset.arg);
  closeCtxMenu();
});

function desktopMenuItems() {
  return [
    { label: 'New Finder Window', cmd: 'new-finder' },
    { label: 'New Terminal Window', cmd: 'new-terminal' },
    'sep',
    { label: 'Change Desktop Background', cmd: 'cycle-wallpaper' },
    { label: 'Show Desktop Widgets', cmd: 'toggle-widgets', checked: widgetsVisible },
    'sep',
    { label: 'Reset Icon & Widget Layout', cmd: 'reset-layout' },
    'sep',
    { label: 'Get Info', cmd: 'about' },
  ];
}

function dockItemMenuItems(appId) {
  const appDef = APP_BY_ID.get(appId);
  const label = appDef?.label ?? appId;
  const running = windowsFor(appId);
  const items = [{ label: 'Open', cmd: 'dock-open', arg: appId }];
  if (running.length) {
    items.push('sep');
    if (running.length > 1) items.push({ label: 'Show All Windows', cmd: 'dock-show-all', arg: appId });
    items.push({ label: `Quit ${label}`, cmd: 'dock-quit', arg: appId });
  }
  return items;
}

/* Suppress the raw browser menu everywhere in the shell — it breaks the
   illusion of a native OS — and only show ours where it actually makes
   sense: empty desktop space, and a Dock icon. */
desktop.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (e.target.closest('.dt-dock')) return; // handled below, with its own item set
  if (e.target.closest('.dt-window, .dtw, .dt-dicon, .dt-menubar, .dt-cc, .dt-toast, .dt-ctx-menu')) return;
  openCtxMenu(desktopMenuItems(), e.clientX, e.clientY);
});

dock.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const item = e.target.closest('.dt-dock__item');
  if (!item || item.dataset.id === PHONE.id) return;
  openCtxMenu(dockItemMenuItems(item.dataset.id), e.clientX, e.clientY);
});

/* ------------------------------------------------------- wallpaper -- */

const WALLPAPER_COUNT = 4;
const wallpaperEl = $('.dt-wallpaper');
let wallpaperIdx = 0;
try {
  wallpaperIdx = Number(localStorage.getItem('dt-wallpaper')) || 0;
} catch {
  wallpaperIdx = 0;
}
wallpaperEl.setAttribute('data-preset', String(wallpaperIdx));

function cycleWallpaper() {
  wallpaperIdx = (wallpaperIdx + 1) % WALLPAPER_COUNT;
  wallpaperEl.setAttribute('data-preset', String(wallpaperIdx));
  try {
    localStorage.setItem('dt-wallpaper', String(wallpaperIdx));
  } catch {
    /* private mode — the choice just won't persist */
  }
  toast('Desktop background changed');
}

/* --------------------------------------------------------- reset layout -- */

function resetDesktopLayout() {
  layout = {};
  saveLayout();
  [...widgetsEl.querySelectorAll('.dtw'), ...iconsRailEl.querySelectorAll('.dt-dicon')].forEach((el) => {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.zIndex = '';
    el.style.margin = '';
  });
  toast('Layout reset');
}

function openMenu(menu, el) {
  closeAll();
  el.querySelector('[data-menu-panel]').innerHTML = renderMenuPanel(menu);
  el.classList.add('is-open');
  el.querySelector('[data-menu-trigger]').setAttribute('aria-expanded', 'true');
  openMenuId = menu.id;
}

[...menusEl.querySelectorAll('.dt-menu')].forEach((el, i) => {
  const menu = MENUS[i];
  const trigger = el.querySelector('[data-menu-trigger]');
  trigger.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (el.classList.contains('is-open')) closeMenus();
    else openMenu(menu, el);
  });
  // Sliding across an already-open menu bar switches menus on hover, like the real thing.
  trigger.addEventListener('pointerenter', () => {
    if (openMenuId && openMenuId !== menu.id) openMenu(menu, el);
  });
});

menusEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cmd]');
  if (!btn || btn.disabled) return;
  runCommand(btn.dataset.cmd, btn.dataset.arg);
  closeMenus();
});

document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.dt-menu, .dt-icon, .dt-cc, .dt-ctx-menu')) closeAll();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAll();
});

/* ------------------------------------------------------ status icons -- */

const WIFI_ON = svg(
  '<path d="M3 8.5a15 15 0 0118 0M6.2 12a10.5 10.5 0 0111.6 0M9.5 15.4a5.8 5.8 0 015 0"/>' +
    '<circle cx="12" cy="18.3" r="1.15" fill="currentColor" stroke="none"/>',
  1.9,
);
const WIFI_OFF = svg(
  '<path d="M3 8.5a15 15 0 0118 0M6.2 12a10.5 10.5 0 0111.6 0M9.5 15.4a5.8 5.8 0 015 0" opacity=".35"/>' +
    '<circle cx="12" cy="18.3" r="1.15" fill="currentColor" stroke="none" opacity=".35"/>' +
    '<path d="M3 3l18 18"/>',
  1.9,
);
const CC_ICON = svg(
  '<rect x="3" y="4" width="18" height="6" rx="3"/><circle cx="8" cy="7" r="1.6" fill="currentColor" stroke="none"/>' +
    '<rect x="3" y="14" width="18" height="6" rx="3"/><circle cx="16" cy="17" r="1.6" fill="currentColor" stroke="none"/>',
  1.6,
);
const batterySvg = (pct) => `
  <svg viewBox="0 0 26 14" aria-hidden="true">
    <rect x="1" y="1.5" width="20" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <rect x="22" y="5" width="2.4" height="4" rx="1" fill="currentColor"/>
    <rect x="3" y="3.5" width="${15 * (pct / 100)}" height="7" rx="1.2" fill="currentColor"/>
  </svg>`;

const iconsEl = $('[data-dt-icons]');
const BATTERY_PCT = 87;

iconsEl.innerHTML = `
  <button type="button" class="dt-icon" data-dt-wifi aria-label="Wi-Fi" title="Wi-Fi: Beard Bros Studio">${WIFI_ON}</button>
  <button type="button" class="dt-icon" data-dt-cc-btn aria-label="Control Center" title="Control Center"
          aria-haspopup="true" aria-expanded="false">${CC_ICON}</button>
  <button type="button" class="dt-icon dt-icon--battery" data-dt-battery aria-label="Battery" title="Battery">
    ${batterySvg(BATTERY_PCT)}<span class="dt-icon__pct" data-dt-battery-pct>${BATTERY_PCT}%</span>
  </button>`;

let wifiOn = true;
const wifiBtn = iconsEl.querySelector('[data-dt-wifi]');
wifiBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  wifiOn = !wifiOn;
  wifiBtn.classList.toggle('is-off', !wifiOn);
  wifiBtn.innerHTML = wifiOn ? WIFI_ON : WIFI_OFF;
  wifiBtn.title = wifiOn ? 'Wi-Fi: Beard Bros Studio' : 'Wi-Fi: Off';
  toast(wifiOn ? 'Wi-Fi On — Beard Bros Studio' : 'Wi-Fi Off');
});

iconsEl.querySelector('[data-dt-battery]').addEventListener('click', (e) => {
  e.stopPropagation();
  toast(`Battery — ${BATTERY_PCT}% · Power Adapter Connected`);
});

/* --------------------------------------------------------- control center -- */

const cc = $('[data-dt-cc]');
const ccToggles = $('[data-dt-cc-toggles]');
const ccBrightness = $('[data-dt-cc-brightness]');
const ccBrightVal = $('[data-dt-cc-bright-val]');
const ccBtn = iconsEl.querySelector('[data-dt-cc-btn]');
let ccOpen = false;

const CC_TOGGLES = [
  {
    key: 'motion',
    label: 'Reduce Motion',
    icon: svg('<circle cx="12" cy="12" r="8.5"/><path d="M7 15a6 6 0 0 1 10-4.5M12 12l4-2.3"/>', 1.9),
  },
  {
    key: 'widgets',
    label: 'Widgets',
    icon: svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>', 1.7),
  },
  {
    key: 'appearance',
    label: 'Appearance',
    icon: svg(
      '<circle cx="12" cy="12" r="4.5"/><path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      1.9,
    ),
  },
  {
    key: 'sound',
    label: 'Sound',
    icon: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 010 6"/><path d="M19 6.5a8 8 0 010 11" opacity=".55"/>', 1.8),
  },
  {
    key: 'edit-widgets',
    label: 'Edit Widgets',
    icon: svg('<path d="M4 20l1-4 12-12 3 3-12 12z"/><path d="M12 6.5l3 3"/>', 1.7),
  },
];

function paintCC() {
  const states = {
    motion: reduced,
    widgets: widgetsVisible,
    appearance: desktop.getAttribute('data-theme') === 'light',
    sound: !radioAudio.muted,
    'edit-widgets': editWidgetsMode,
  };
  ccToggles.innerHTML = CC_TOGGLES.map(
    (t) => `
      <button type="button" class="dt-cc__toggle" data-dt-cc-toggle="${t.key}" aria-pressed="${states[t.key]}">
        <span class="dt-cc__toggle-icon">${t.icon}</span>
        <span class="dt-cc__toggle-label">${t.label}</span>
      </button>`,
  ).join('');
  paintCCRadio();
}
paintCC();

/*
 * A richer tile than the plain on/off toggles — station art, name, tags,
 * play/pause, next, and a volume slider standing in for "seek": a live
 * broadcast has no timeline to scrub, so volume is the control that
 * actually does something, the same trade real Control Centers make for
 * a live radio source.
 */
function paintCCRadio() {
  const ccRadio = $('[data-dt-cc-radio]');
  if (!ccRadio.dataset.wired) {
    ccRadio.innerHTML = `
      <div class="dt-cc__radio-row">
        <span class="dt-cc__radio-art" data-dt-cc-radio-art></span>
        <div class="dt-cc__radio-meta">
          <p class="dt-cc__radio-station" data-dt-cc-radio-station>Tuning in…</p>
          <p class="dt-cc__radio-tags" data-dt-cc-radio-tags>Finding a station</p>
        </div>
        <div class="dt-cc__radio-controls">
          <button type="button" class="dt-cc__radio-btn dt-cc__radio-btn--play" data-dt-cc-radio-play aria-label="Play"></button>
          <button type="button" class="dt-cc__radio-btn" data-dt-cc-radio-next aria-label="Next station"></button>
        </div>
      </div>
      <input type="range" class="dt-cc__range" data-dt-cc-radio-volume min="0" max="100" value="80" aria-label="Radio volume" />`;
    ccRadio.dataset.wired = '1';

    ccRadio.querySelector('[data-dt-cc-radio-play]').addEventListener('click', (e) => {
      e.stopPropagation();
      radioToggle().then(paintCCRadio);
    });
    ccRadio.querySelector('[data-dt-cc-radio-next]').addEventListener('click', (e) => {
      e.stopPropagation();
      radioNext().then(paintCCRadio);
    });
    ccRadio.querySelector('[data-dt-cc-radio-volume]').value = String(Math.round(radioAudio.volume * 100));
    ccRadio.querySelector('[data-dt-cc-radio-volume]').addEventListener('input', (e) => {
      radioAudio.volume = Number(e.target.value) / 100;
    });
    radioAudio.addEventListener('play', paintCCRadio);
    radioAudio.addEventListener('pause', paintCCRadio);
    radioAudio.addEventListener('loadedmetadata', paintCCRadio);
  }

  const info = nowPlayingStation();
  const artEl = ccRadio.querySelector('[data-dt-cc-radio-art]');
  const stationEl = ccRadio.querySelector('[data-dt-cc-radio-station]');
  const tagsEl = ccRadio.querySelector('[data-dt-cc-radio-tags]');
  const playBtn = ccRadio.querySelector('[data-dt-cc-radio-play]');
  if (!info) {
    stationEl.textContent = 'Tuning in…';
    tagsEl.textContent = 'Finding a station';
    artEl.innerHTML = ART_RADIO;
    playBtn.innerHTML = PLAY_ICON;
    return;
  }
  stationEl.textContent = info.name;
  tagsEl.textContent = info.tags || 'Rock';
  playBtn.innerHTML = info.paused ? PLAY_ICON : PAUSE_ICON;
  playBtn.setAttribute('aria-label', info.paused ? 'Play' : 'Pause');
  loadStationArt(info.favicon).then((img) => {
    if (img) {
      artEl.innerHTML = '';
      artEl.appendChild(img);
    } else {
      artEl.innerHTML = ART_RADIO;
    }
  });
}

function setCC(open) {
  ccOpen = open;
  cc.classList.toggle('is-open', open);
  cc.setAttribute('aria-hidden', String(!open));
  ccBtn.classList.toggle('is-open', open);
  ccBtn.setAttribute('aria-expanded', String(open));
  if (open) paintCC();
}

ccBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (ccOpen) setCC(false);
  else {
    closeMenus();
    setCC(true);
  }
});

ccToggles.addEventListener('click', (e) => {
  const b = e.target.closest('[data-dt-cc-toggle]');
  if (!b) return;
  const key = b.dataset.dtCcToggle;
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on));
  if (key === 'motion') reduced = on;
  if (key === 'widgets') setWidgetsVisible(on);
  if (key === 'appearance') setDesktopTheme(on ? 'light' : 'dark');
  if (key === 'sound') radioAudio.muted = !on;
  if (key === 'edit-widgets') setEditWidgetsMode(on);
});

/* The Settings app's toggles reach back out the same way phone's do —
   dispatched as a shell-agnostic event rather than importing desktop-os.js
   internals into apps.js. 'grain' has no desktop equivalent (wallpaper
   grain is phone-only) so it's simply not offered there — see apps.js. */
document.addEventListener('os:setting', (e) => {
  const { key, on } = e.detail;
  if (key === 'motion') reduced = on;
  if (key === 'appearance') setDesktopTheme(on ? 'light' : 'dark');
  paintCC();
});

ccBrightness.addEventListener('input', () => {
  desktop.style.filter = `brightness(${ccBrightness.value}%)`;
  ccBrightVal.textContent = `${ccBrightness.value}%`;
});

cc.addEventListener('pointerdown', (e) => e.stopPropagation());

/* --------------------------------------------------------------- sleep -- */

armIdleSleep({
  overlayEl: $('[data-dt-sleep]'),
  timeEl: $('[data-dt-sleep-time]'),
  dateEl: $('[data-dt-sleep-date]'),
  timeoutMs: 60_000,
});

/* ------------------------------------------------------------ log out -- */

/* Pure front-end illusion — no real session exists to end, this just adds
   to the "real device" feel the sleep screen and boot sequence already go
   for. Deliberately not persisted across reloads: a fresh page load is
   always logged in, same as the boot sequence always runs fresh. */
const loggedOutOverlay = $('[data-dt-loggedout]');

function setLoggedOut(on) {
  loggedOutOverlay.classList.toggle('is-open', on);
  loggedOutOverlay.setAttribute('aria-hidden', String(!on));
}

loggedOutOverlay.querySelector('[data-dt-login]').addEventListener('click', () => setLoggedOut(false));
