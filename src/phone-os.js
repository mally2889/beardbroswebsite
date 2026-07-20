import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import './styles/phone-os.css';
import { services } from './data/services.js';
import { projects } from './data/projects.js';
import { APPS, SYSTEM_ORDER, DOCK_ORDER, PHONE, svg, fetchWeather } from './os/apps.js';

/**
 * Beard Bros OS — prototype shell.
 *
 * Page one is the system apps (the work lives inside them); page two is the
 * service catalogue. Opening anything is a Flip morph out of the icon you
 * tapped. Getting home is deliberately over-served — home bar, back chevron,
 * Escape — because a portfolio that traps you is worse than one that never
 * animated at all.
 */

gsap.registerPlugin(Flip);

let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Home-screen labels are short by necessity — a 78px tile gets two words. */
const SHORT_LABEL = {
  'performance-marketing': 'Performance',
  branding: 'Branding',
  'web-development': 'Web',
  'social-media-marketing': 'Social',
  'influencer-marketing': 'Influencer',
  'video-production': 'Video',
  'content-creation': 'Content',
  seo: 'SEO',
};

const GLYPH = {
  'performance-marketing': '<path d="M4 20V13M10 20V8M16 20v-4M22 20V4"/>',
  branding: '<path d="M12 3l7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7z"/>',
  'web-development':
    '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="M9 9.5L6 12l3 2.5M15 9.5l3 2.5-3 2.5"/>',
  'social-media-marketing':
    '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.4 10.8l7.2-3.5M8.4 13.2l7.2 3.5"/>',
  'influencer-marketing': '<circle cx="12" cy="8" r="3.3"/><path d="M5 20c0-3.7 3.1-5.6 7-5.6s7 1.9 7 5.6"/>',
  'video-production': '<rect x="2" y="5.5" width="13.5" height="13" rx="2.5"/><path d="M15.5 10l6-3v10l-6-3z"/>',
  'content-creation': '<path d="M4 6.5h16M4 12h16M4 17.5h9"/>',
  seo: '<circle cx="11" cy="11" r="6.6"/><path d="M15.9 15.9L21 21M8.4 11.8l2.1 2.1 3.6-4.1"/>',
};

/** Safari drives its own scrolling and toolbar, so it gets an unpadded body. */
const FLUSH = new Set(['safari']);

/** Light-to-deep gradient off one hue, the way an iOS icon is built. */
const tint = (hue) =>
  `--tint-a:color-mix(in srgb, ${hue} 80%, #fff);--tint-b:color-mix(in srgb, ${hue} 82%, #000)`;

const $ = (s) => document.querySelector(s);

const pages = $('[data-pages]');
const gridSystem = $('[data-grid-system]');
const today = $('[data-today]');
const dock = $('[data-dock]');
const dots = $('[data-dots]');
const app = $('[data-app]');
const appMark = $('[data-app-mark]');
const appTitle = $('[data-app-title]');
const appBody = $('[data-app-body]');
const homeHit = $('[data-close]');
const backBtn = $('[data-close-2]');
const homeLine = document.querySelector('.homebar__line');

let openFrom = null;
/*
 * Not a plain busy flag — a tap that lands mid-animation (open still
 * settling, close still shrinking) needs to be honoured once that animation
 * finishes, not silently dropped. `phase` tracks what's in flight; `queued`
 * holds the one intent that arrived while it was.
 */
let phase = 'idle';
let queued = null;

function runQueued() {
  if (!queued) return;
  const q = queued;
  queued = null;
  if (q.type === 'open') open(q.view, q.tile);
  else close();
}
let page = 0;
/** Returned by an app's mount(); tears down timers when the app closes. */
let unmount = null;

/* --------------------------------------------------------------- build -- */

/* `art` is full-bleed icon SVG; it paints its own field, so the tile drops the
   hue gradient and keeps only the glass rim. */
const iconMarkup = (label, inner, hue, attrs, isArt) => `
  <button class="app-icon" type="button" role="listitem" ${attrs} style="${tint(hue)}">
    <span class="app-icon__tile${isArt ? ' app-icon__tile--art' : ''}" data-tile>${inner}</span>
    <span class="app-icon__label">${label}</span>
  </button>`;

const appIcon = (id) => {
  const a = APPS[id];
  return iconMarkup(a.label, a.art, a.hue, `data-kind="system" data-id="${id}"`, true);
};

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/*
 * A 4-column grid with the widget on top only has room for two full rows —
 * anything past that spills onto its own "More" page, the way a real
 * springboard pages overflowing icons rather than clipping or scrolling them.
 */
const ICONS_PER_PAGE = 8;
const [firstPageIcons, ...overflowPages] = chunk(SYSTEM_ORDER, ICONS_PER_PAGE);

gridSystem.innerHTML = firstPageIcons.map(appIcon).join('');

let insertAfter = pages.querySelector('[aria-label="Home"]');
overflowPages.forEach((ids, i) => {
  insertAfter.insertAdjacentHTML(
    'afterend',
    `<section class="page" aria-label="More ${i + 1}">
       <p class="springboard__label">More</p>
       <div class="grid" role="list">${ids.map(appIcon).join('')}</div>
     </section>`,
  );
  insertAfter = insertAfter.nextElementSibling;
});

const PAGE_COUNT = 2 + overflowPages.length;
pages.style.setProperty('--page-count', PAGE_COUNT);

today.innerHTML = `
  <div class="tw" data-tw-weather>
    <p class="tw__label">Mumbai</p>
    <p class="tw__big" data-tw-temp>—</p>
    <p class="tw__sub" data-tw-desc>Fetching live conditions…</p>
  </div>
  <div class="tw" data-tw-clock>
    <p class="tw__label">Studio time</p>
    <p class="tw__big" data-tw-time>--:--</p>
    <p class="tw__sub">India Standard Time</p>
  </div>`;

/* The Today widgets run whether or not their apps are open. */
{
  const tTime = $('[data-tw-time]');
  const paint = () =>
    (tTime.textContent = new Date().toLocaleTimeString([], {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
    }));
  paint();
  setInterval(paint, 10_000);

  fetchWeather({ lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' })
    .then((d) => {
      $('[data-tw-temp]').textContent = `${Math.round(d.current.temperature_2m)}°`;
      $('[data-tw-desc]').textContent =
        `H:${Math.round(d.daily.temperature_2m_max[0])}°  L:${Math.round(d.daily.temperature_2m_min[0])}°`;
    })
    .catch(() => {
      $('[data-tw-desc]').textContent = 'Weather unavailable';
    });
}

dock.innerHTML = [PHONE.id, ...DOCK_ORDER]
  .map((id) => {
    const a = id === PHONE.id ? PHONE : APPS[id];
    return `
      <button class="dock__item" type="button" role="listitem" data-kind="${id === PHONE.id ? 'tel' : 'system'}" data-id="${id}"
              style="${tint(a.hue)}" aria-label="${a.label}">
        <span class="dock__tile dock__tile--art" data-tile>${a.art}</span>
      </button>`;
  })
  .join('');

const PAGE_LABELS = ['Home', ...overflowPages.map((_, i) => `More ${i + 1}`), 'Today'];

dots.innerHTML = PAGE_LABELS
  .map(
    (name, i) =>
      `<button type="button" role="tab" data-page="${i}" aria-label="${name}"
               aria-selected="${i === 0}"></button>`,
  )
  .join('');

$('[data-semantic-services]').innerHTML = services
  .map((s) => `<li><a href="/services/#${s.slug}">${s.name}</a>: ${s.blurb}</li>`)
  .join('');

$('[data-semantic-work]').innerHTML = projects
  .map((p) => `<li><a href="/work.html#${p.slug}">${p.name}</a> — ${p.category}: ${p.tagline}</li>`)
  .join('');

/* --------------------------------------------------------------- clock -- */

const clock = $('[data-clock]');
const tick = () =>
  (clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
tick();
setInterval(tick, 15_000);

/* -------------------------------------------------------------- paging -- */

const pageStep = 100 / PAGE_COUNT;

function goTo(next, animate = true) {
  page = Math.max(0, Math.min(PAGE_COUNT - 1, next));
  gsap.to(pages, {
    xPercent: -pageStep * page,
    duration: animate && !reduced ? 0.45 : 0,
    ease: 'power3.out',
  });
  [...dots.children].forEach((d, i) => d.setAttribute('aria-selected', String(i === page)));
}

dots.addEventListener('click', (e) => {
  const b = e.target.closest('[data-page]');
  if (b) goTo(Number(b.dataset.page));
});

/* Horizontal drag between home screens — the gesture is what sells it. */
{
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let decided = false;
  const springboard = $('[data-springboard]');

  springboard.addEventListener('pointerdown', (e) => {
    if (!app.hidden) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    decided = false;
  });

  springboard.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Let vertical intent through; only claim unambiguous horizontal drags.
    if (!decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      decided = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragging = false;
        return;
      }
    }

    const w = springboard.offsetWidth;
    const atStart = page === 0 && dx > 0;
    const atEnd = page === PAGE_COUNT - 1 && dx < 0;
    const resisted = atStart || atEnd ? dx * 0.28 : dx;
    gsap.set(pages, { xPercent: -pageStep * page + (resisted / w) * pageStep });
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = (e.clientX ?? startX) - startX;
    if (Math.abs(dx) > 55) goTo(page + (dx < 0 ? 1 : -1));
    else goTo(page);
  };

  springboard.addEventListener('pointerup', release);
  springboard.addEventListener('pointercancel', release);
}

/* ------------------------------------------------------ press feedback -- */

const press = (el) => {
  const down = () => !reduced && gsap.to(el, { scale: 0.9, duration: 0.18, ease: 'power2.out' });
  const up = () => !reduced && gsap.to(el, { scale: 1, duration: 0.5, ease: 'back.out(2.6)' });
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
};

document.querySelectorAll('[data-tile]').forEach(press);

/* ----------------------------------------------------------------- app -- */

function serviceView(s) {
  return {
    title: s.name,
    mark: svg(GLYPH[s.slug], 2.5),
    style: `${tint(s.hue)};--accent:${s.hue}`,
    html: `
      <p class="app__blurb">${s.blurb}</p>
      ${s.long.map((p) => `<p class="app__p">${p}</p>`).join('')}
      <p class="app__heading">What you get</p>
      <ul class="app__list">${s.deliverables.map((d) => `<li>${d}</li>`).join('')}</ul>`,
  };
}

function systemView(id) {
  const a = APPS[id];
  return {
    title: a.title,
    mark: a.art,
    markIsArt: true,
    style: `${tint(a.hue)};--accent:${a.hue}`,
    html: a.render(),
    flush: FLUSH.has(id),
    mount: a.mount,
  };
}

function open(view, tile) {
  if (phase !== 'idle') {
    queued = { type: 'open', view, tile };
    return;
  }
  phase = 'opening';

  app.setAttribute('style', view.style);
  appMark.innerHTML = view.mark;
  appMark.classList.toggle('app__mark--art', Boolean(view.markIsArt));
  appTitle.textContent = view.title;
  appBody.classList.toggle('app__body--flush', Boolean(view.flush));
  appBody.innerHTML = view.html;
  appBody.scrollTop = 0;
  unmount = view.mount?.(appBody) ?? null;

  openFrom = tile;
  app.hidden = false;
  homeHit.hidden = false;

  const settle = () => {
    phase = 'idle';
    appTitle.focus();
    runQueued();
  };

  if (reduced) {
    gsap.fromTo(app, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, onComplete: settle });
    return;
  }

  // Snap the panel onto the icon, record it, then release it to full size.
  Flip.fit(app, tile, { scale: true });
  const state = Flip.getState(app);
  gsap.set(app, { clearProps: 'transform,width,height,top,left' });

  Flip.from(state, { duration: 0.58, ease: 'power3.inOut', scale: true, onComplete: settle });

  gsap.fromTo(
    [app.querySelector('.app__chrome'), appBody],
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.14, ease: 'power2.out' },
  );

  gsap.to(homeLine, { scaleX: 1.12, duration: 0.4, ease: 'power2.out' });
}

function close() {
  if (phase === 'idle' && app.hidden) return;
  if (phase !== 'idle') {
    queued = { type: 'close' };
    return;
  }
  phase = 'closing';
  homeHit.hidden = true;
  gsap.to(homeLine, { scaleX: 1, duration: 0.35, ease: 'power2.out' });

  const finish = () => {
    app.hidden = true;
    gsap.set([app, app.querySelector('.app__chrome'), appBody], {
      clearProps: 'transform,width,height,top,left,opacity,visibility',
    });
    unmount?.();
    unmount = null;
    appBody.innerHTML = '';
    openFrom?.closest('.app-icon, .dock__item')?.focus();
    phase = 'idle';
    runQueued();
  };

  if (reduced || !openFrom) {
    gsap.to(app, { autoAlpha: 0, duration: 0.2, onComplete: finish });
    return;
  }

  gsap.to([app.querySelector('.app__chrome'), appBody], { autoAlpha: 0, duration: 0.18 });
  Flip.fit(app, openFrom, { scale: true, duration: 0.46, ease: 'power3.inOut', onComplete: finish });
}

/* -------------------------------------------------------------- wiring -- */

const launch = (btn) => {
  if (btn.dataset.kind === 'tel') {
    window.location.href = `tel:${PHONE.tel}`;
    return;
  }
  const tile = btn.querySelector('[data-tile]');
  if (btn.dataset.kind === 'system') {
    open(systemView(btn.dataset.id), tile);
  } else {
    const s = services.find((x) => x.slug === btn.dataset.id);
    if (s) open(serviceView(s), tile);
  }
};

pages.addEventListener('click', (e) => {
  const btn = e.target.closest('.app-icon');
  if (btn) launch(btn);
});

dock.addEventListener('click', (e) => {
  const btn = e.target.closest('.dock__item');
  if (btn) launch(btn);
});

homeHit.addEventListener('click', close);
backBtn.addEventListener('click', close);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (ccOpen) setCC(false);
    else close();
  }
  if (app.hidden && e.key === 'ArrowRight') goTo(page + 1);
  if (app.hidden && e.key === 'ArrowLeft') goTo(page - 1);
});

/* Swipe up from the home bar to close, the way the real gesture works. */
{
  let y0 = null;
  const bar = document.querySelector('.homebar');
  bar.addEventListener('pointerdown', (e) => (y0 = app.hidden ? null : e.clientY));
  bar.addEventListener('pointerup', (e) => {
    if (y0 !== null && y0 - e.clientY > 24) close();
    y0 = null;
  });
}

/* Settings toggles reach back out and change the OS. */
document.addEventListener('os:setting', (e) => {
  const { key, on } = e.detail;
  if (key === 'motion') reduced = on;
  if (key === 'grain') document.querySelector('.wallpaper').classList.toggle('is-plain', !on);
  if (key === 'appearance') setTheme(on ? 'light' : 'dark');
  paintCCToggles?.();
});

/* --------------------------------------------------------------- theme -- */

const screen = $('[data-screen]');

function setTheme(mode) {
  screen.setAttribute('data-theme', mode);
  try {
    localStorage.setItem('os-theme', mode);
  } catch {
    /* private mode — the theme just won't persist */
  }
}

let stored = null;
try {
  stored = localStorage.getItem('os-theme');
} catch {
  /* ignore */
}
setTheme(stored ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
export { setTheme };

/* --------------------------------------------------------------- control center -- */

/*
 * The mirror of the homebar's swipe-up-to-close: drag down from the status
 * bar to reveal a quick-toggle sheet, drag up (or tap outside, or Escape)
 * to dismiss it. Scoped to the home screen — once an app is open it covers
 * the status bar anyway, same as real iOS hides the bar under an app.
 */

const cc = $('[data-cc]');
const ccSheet = $('[data-cc-sheet]');
const ccToggles = $('[data-cc-toggles]');
const ccBright = $('[data-cc-brightness]');
const ccBrightVal = $('[data-cc-bright-val]');
let ccOpen = false;

const CC_TOGGLES = [
  {
    key: 'appearance',
    label: 'Appearance',
    icon: svg('<circle cx="12" cy="12" r="4.5"/><path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 1.9),
  },
  {
    key: 'motion',
    label: 'Motion',
    icon: svg('<circle cx="12" cy="12" r="8.5"/><path d="M7 15a6 6 0 0 1 10-4.5M12 12l4-2.3"/>', 1.9),
  },
  {
    key: 'grain',
    label: 'Grain',
    icon: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', 1.7),
  },
];

function paintCCToggles() {
  const states = {
    appearance: screen.getAttribute('data-theme') === 'light',
    motion: reduced,
    grain: !document.querySelector('.wallpaper').classList.contains('is-plain'),
  };
  ccToggles.innerHTML = CC_TOGGLES.map(
    (t) => `
      <button type="button" class="cc__toggle" data-cc-toggle="${t.key}" aria-pressed="${states[t.key]}">
        <span class="cc__toggle-icon">${t.icon}</span>
        <span class="cc__toggle-label">${t.label}</span>
      </button>`,
  ).join('');
}

paintCCToggles();

/* Plain pixel offset, not yPercent — the sheet's on-screen home is 0, and
   "hidden" is just far enough above its own (fixed) height to clear the
   screen, computed fresh each call rather than cached as a percentage. */
const ccHiddenY = () => -(ccSheet.offsetHeight + 40);

function setCC(open) {
  ccOpen = open;
  cc.setAttribute('aria-hidden', String(!open));
  if (open) cc.classList.add('is-open');
  gsap.to(ccSheet, {
    y: open ? 0 : ccHiddenY(),
    duration: reduced ? 0 : open ? 0.5 : 0.4,
    ease: open ? 'power3.out' : 'power3.inOut',
    onComplete: () => {
      if (!open) cc.classList.remove('is-open');
    },
  });
}

ccToggles.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cc-toggle]');
  if (!b) return;
  const key = b.dataset.ccToggle;
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on));
  document.dispatchEvent(new CustomEvent('os:setting', { detail: { key, on } }));
});

ccBright.addEventListener('input', () => {
  screen.style.filter = `brightness(${ccBright.value}%)`;
  ccBrightVal.textContent = `${ccBright.value}%`;
});

cc.addEventListener('click', (e) => {
  if (e.target === cc) setCC(false);
});

{
  let startY = 0;
  let dragging = false;
  let mode = null; // 'open' | 'close'

  document.querySelector('.statusbar').addEventListener('pointerdown', (e) => {
    if (!app.hidden || ccOpen) return;
    e.preventDefault();
    startY = e.clientY;
    dragging = true;
    mode = 'open';
    cc.classList.add('is-open');
  });

  ccSheet.addEventListener('pointerdown', (e) => {
    if (!ccOpen) return;
    e.preventDefault();
    startY = e.clientY;
    dragging = true;
    mode = 'close';
  });

  screen.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    e.preventDefault();
    const dy = e.clientY - startY;
    const hiddenY = ccHiddenY();
    if (mode === 'open') {
      const p = Math.max(0, Math.min(1, dy / 160));
      gsap.set(ccSheet, { y: hiddenY * (1 - p) });
    } else {
      const p = Math.max(0, Math.min(1, -dy / 160));
      gsap.set(ccSheet, { y: hiddenY * p });
    }
  });

  screen.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dy = e.clientY - startY;
    if (mode === 'open') setCC(dy > 45);
    else setCC(!(-dy > 45));
    mode = null;
  });
}
