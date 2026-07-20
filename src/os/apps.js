import { services } from '../data/services.js';
import { projectsData } from '../data/projects-full.js';
import { caseStudies } from '../data/case-studies.js';
import { journal } from '../data/journal.js';
import '../styles/phone-os-apps.css';

/**
 * The six system apps.
 *
 * Each one borrows the *grammar* of its iOS counterpart — a browser with tabs,
 * a notes list, a compose sheet — but uses Beard Bros marks and content rather
 * than Apple's artwork. Every app exports `render()` for markup and an
 * optional `mount()` for interior state, so the shell stays a dumb container.
 */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const svg = (path, w = 1.9) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

/**
 * Icon art.
 *
 * Full-bleed SVG on a 100×100 field, so each app paints its own background and
 * mark the way a real system icon does — solid shapes, app-specific colour,
 * no thin outline glyphs. These follow the same silhouette *families* as their
 * iOS counterparts (a compass, a notepad, an envelope) but are drawn from
 * scratch: none of Apple's artwork is reproduced.
 */
const field = (id, from, to) => `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="100" height="100" fill="url(#${id})"/>`;

const art = (inner) =>
  `<svg class="icon-art" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;

/** Compass: a glass ring, tick marks, and a two-tone needle. */
const ART_SAFARI = art(`
  ${field('g-sf', '#2c2c2e', '#1c1c1e')}
  <circle cx="50" cy="50" r="37" fill="#007aff"/>
  ${Array.from({ length: 60 }, (_, i) => {
    const a = (i * 6 * Math.PI) / 180;
    const big = i % 5 === 0;
    const r1 = 33;
    const r2 = big ? 28 : 30.5;
    return `<line x1="${50 + r1 * Math.cos(a)}" y1="${50 + r1 * Math.sin(a)}"
                  x2="${50 + r2 * Math.cos(a)}" y2="${50 + r2 * Math.sin(a)}"
                  stroke="#fff" stroke-width="${big ? 1.4 : 0.8}" opacity="${big ? 0.9 : 0.5}"/>`;
  }).join('')}
  <path d="M50 50 L69 31 L58 58 Z" fill="#ff3b30"/>
  <path d="M50 50 L31 69 L42 42 Z" fill="#fff"/>
  <circle cx="50" cy="50" r="2.4" fill="#fff"/>`);

/** Notepad: a darker header band over ruled white paper. */
const ART_NOTES = art(`
  ${field('g-nt', '#2c2c2e', '#1c1c1e')}
  <rect x="12" y="18" width="76" height="66" rx="10" fill="#2c2c2e"/>
  <path d="M12 28a10 10 0 0 1 10-10h56a10 10 0 0 1 10 10v6H12z" fill="#ffd60a"/>
  <g stroke="#48484a" stroke-width="3.2" stroke-linecap="round">
    <line x1="24" y1="52" x2="76" y2="52"/>
    <line x1="24" y1="64" x2="76" y2="64"/>
    <line x1="24" y1="76" x2="54" y2="76"/>
  </g>`);

/** Envelope: solid body with a folded flap. */
const ART_MAIL = art(`
  ${field('g-ml', '#2c2c2e', '#1c1c1e')}
  <rect x="15" y="29" width="70" height="43" rx="7" fill="#fff"/>
  <path d="M15 36.5 L50 59 L85 36.5 L85 33a4 4 0 0 0-4-4H19a4 4 0 0 0-4 4z" fill="#cfe9ff"/>
  <path d="M17 33.5 L50 55 L83 33.5" fill="none" stroke="#8ec3f2" stroke-width="2.6"
        stroke-linecap="round" stroke-linejoin="round"/>`);

/** Calendar: today's real weekday and date, the way the live icon behaves. */
const ART_CALENDAR = () => {
  const now = new Date();
  return art(`
    <rect width="100" height="100" fill="#fdfdfd"/>
    <rect x="1" y="1" width="98" height="98" fill="none" stroke="#e6e6ea" stroke-width="1.5"/>
    <rect x="0" y="0" width="100" height="27" fill="#fa3d33"/>
    <text x="50" y="19" text-anchor="middle" fill="#fff"
          font-family="Satoshi, system-ui, sans-serif" font-size="12" font-weight="700"
          letter-spacing="1.3">${now.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}</text>
    <text x="50" y="78" text-anchor="middle" fill="#1c1c1e"
          font-family="'Clash Display', system-ui, sans-serif" font-size="50"
          font-weight="500">${now.getDate()}</text>`);
};

/** Gear: teeth punched around a solid disc. */
const ART_SETTINGS = art(`
  ${field('g-st', '#2c2c2e', '#1c1c1e')}
  <g fill="#d1d1d6">
    ${Array.from({ length: 8 }, (_, i) => `<rect x="45" y="14" width="10" height="18" rx="3"
        transform="rotate(${i * 45} 50 50)"/>`).join('')}
    <circle cx="50" cy="50" r="26"/>
  </g>
  <circle cx="50" cy="50" r="11" fill="#1c1c1e"/>`);

/** Note on a warm gradient field. */
const ART_MUSIC = art(`
  ${field('g-mu', '#2c2c2e', '#1c1c1e')}
  <path d="M42 70.5V36.5l26-6.5v30" fill="none" stroke="#fc3158" stroke-width="6"
        stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="35.5" cy="70" rx="9.5" ry="8" fill="#fc3158"/>
  <ellipse cx="61.5" cy="63" rx="9.5" ry="8" fill="#fc3158"/>`);

/** Journal: an abstract pastel field behind a folded page. */
const ART_JOURNAL = art(`
  ${field('g-jr', '#2c2c2e', '#1c1c1e')}
  <path d="M28 24h44a4 4 0 0 1 4 4v44l-12-8-12 8-12-8-12 8V28a4 4 0 0 1 4-4z" fill="url(#g-jr-page)"/>
  <defs><linearGradient id="g-jr-page" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffd9c2"/><stop offset="55%" stop-color="#f2a8d0"/><stop offset="100%" stop-color="#8f7ae8"/>
  </linearGradient></defs>`);

/**
 * Clock: a live analogue face.
 *
 * The hands are CSS animations with a negative delay equal to the elapsed
 * time in each cycle — so they start already at the right angle and keep
 * running without a timer. No JS tick, no drift, survives tab-throttling.
 */
const ART_CLOCK = () => {
  const n = new Date();
  const s0 = n.getSeconds() + n.getMilliseconds() / 1000;
  const m0 = n.getMinutes() * 60 + s0;
  const h0 = (n.getHours() % 12) * 3600 + m0;
  return art(`
    <rect width="100" height="100" fill="#1c1c1e"/>
    <circle cx="50" cy="50" r="44" fill="#3a3a3c"/>
    <circle cx="50" cy="50" r="40" fill="#fbfbfd"/>
    ${Array.from({ length: 60 }, (_, i) => {
      const a2 = (i * 6 * Math.PI) / 180;
      const big = i % 5 === 0;
      const r1 = big ? 31 : 34.5;
      return `<line x1="${50 + r1 * Math.sin(a2)}" y1="${50 - r1 * Math.cos(a2)}"
                    x2="${50 + 37 * Math.sin(a2)}" y2="${50 - 37 * Math.cos(a2)}"
                    stroke="${big ? '#1c1c1e' : '#c7c7cc'}" stroke-width="${big ? 2.6 : 1.2}"/>`;
    }).join('')}
    <g class="ck-hand" style="--dur:43200s;--at:-${h0}s">
      <rect x="48.4" y="26" width="3.2" height="26" rx="1.6" fill="#1c1c1e"/>
    </g>
    <g class="ck-hand" style="--dur:3600s;--at:-${m0}s">
      <rect x="48.9" y="15" width="2.2" height="37" rx="1.1" fill="#1c1c1e"/>
    </g>
    <g class="ck-hand" style="--dur:60s;--at:-${s0}s">
      <rect x="49.5" y="13" width="1" height="42" rx="0.5" fill="#f0a92e"/>
      <circle cx="50" cy="50" r="3" fill="#f0a92e"/>
    </g>
    <circle cx="50" cy="50" r="1.5" fill="#fbfbfd"/>`);
};

/** Weather: sun behind cloud on a sky field. */
const ART_WEATHER = art(`
  ${field('g-wx', '#2c2c2e', '#1c1c1e')}
  <circle cx="62" cy="38" r="16" fill="#ffd60a"/>
  <path d="M30 72a15 15 0 0 1 2-29.6 20 20 0 0 1 38 4.9A13 13 0 0 1 67 72z" fill="#8e8e93" opacity=".9"/>`);

/** Voice Memos: a radial waveform bursting from a centre dot on a dark field. */
const ART_MEMOS = art(`
  ${field('g-mm', '#2c2c2e', '#1c1c1e')}
  <g stroke-linecap="round" stroke-width="7">
    <line x1="50" y1="32" x2="50" y2="68" stroke="#fc3158"/>
    <line x1="37" y1="39" x2="37" y2="61" stroke="#fff"/>
    <line x1="63" y1="39" x2="63" y2="61" stroke="#fff"/>
    <line x1="24" y1="44" x2="24" y2="56" stroke="#fff" opacity=".65"/>
    <line x1="76" y1="44" x2="76" y2="56" stroke="#fff" opacity=".65"/>
  </g>`);

/** Files: a blue folder on a pale field. */
const ART_FILES = art(`
  ${field('g-fl', '#2c2c2e', '#1c1c1e')}
  <defs><linearGradient id="g-fl2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5fc0f5"/><stop offset="1" stop-color="#0a7ee8"/>
  </linearGradient></defs>
  <path d="M14 34h27l7 8h38a4 4 0 0 1 4 4v6H14z" fill="#0a84ff" opacity=".4"/>
  <path d="M14 42h76v28a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5z" fill="url(#g-fl2)"/>`);

/** Instagram: a camera on a black field — the grammar of a photo-sharing app. */
const ART_FEED = art(`
  ${field('g-fd', '#2c2c2e', '#1c1c1e')}
  <defs><linearGradient id="g-fd-lens" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#e0355a"/><stop offset="1" stop-color="#a83fd6"/>
  </linearGradient></defs>
  <path d="M22 38a6 6 0 0 1 6-6h7l4.5-6h21l4.5 6h7a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z" fill="#fff"/>
  <circle cx="50" cy="55" r="15" fill="url(#g-fd-lens)"/>
  <circle cx="50" cy="55" r="15" fill="none" stroke="#fff" stroke-width="2"/>
  <circle cx="68" cy="38" r="2.6" fill="url(#g-fd-lens)"/>`);

/** Phone: a receiver outline on a black field — not an app, a tel: shortcut. */
const ART_PHONE = art(`
  ${field('g-ph', '#2c2c2e', '#1c1c1e')}
  <g transform="translate(20,20) scale(2.5)" fill="#30d158">
    <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
  </g>`);

/**
 * Phone isn't a real app — no render()/mount(), just an icon and a number.
 * Both shells special-case this id and open a tel: link instead of a panel.
 */
export const PHONE = { id: 'phone', label: 'Phone', hue: '#30d158', art: ART_PHONE, tel: '+919819620485' };

/** A project's generative visual, standing in for photography. */
const visual = (p, i = 0) => {
  const angles = [155, 35, 95];
  return `linear-gradient(${angles[i % 3]}deg, ${p.palette.accent} 0%, ${p.palette.a} 55%, ${p.palette.b} 100%)`;
};

/* ------------------------------------------------------------- safari --- */

const safari = {
  label: 'Safari',
  hue: '#3d7de0',
  art: ART_SAFARI,
  title: 'Work',

  render() {
    return `
      <div class="sf" data-sf>
        <div class="sf__bar">
          <span class="sf__lock">${svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 018 0V11"/>', 2)}</span>
          <span class="sf__url" data-sf-url>beardbros.in/portfolio</span>
        </div>
        <div class="sf__view" data-sf-view>${bookmarks()}</div>
        <div class="sf__toolbar">
          <button type="button" data-sf-back aria-label="Back" disabled>
            ${svg('<path d="M15 5l-7 7 7 7"/>', 2)}
          </button>
          <button type="button" data-sf-home aria-label="Bookmarks">
            ${svg('<path d="M6 4h12v17l-6-4.5L6 21z"/>', 1.9)}
          </button>
        </div>
      </div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-sf-view]');
    const url = root.querySelector('[data-sf-url]');
    const back = root.querySelector('[data-sf-back]');

    const home = () => {
      view.innerHTML = bookmarks();
      view.scrollTop = 0;
      url.textContent = 'beardbros.in/portfolio';
      back.disabled = true;
    };

    view.addEventListener('click', (e) => {
      const row = e.target.closest('[data-proj]');
      if (!row) return;
      const pr = projectsData.find((x) => x.slug === row.dataset.proj);
      if (!pr) return;
      view.innerHTML = projectPage(pr);
      view.scrollTop = 0;
      url.textContent = `beardbros.in/portfolio/${pr.slug}`;
      back.disabled = false;
    });

    back.addEventListener('click', home);
    root.querySelector('[data-sf-home]').addEventListener('click', home);
  },
};

const bookmarks = () => {
  const groups = [...new Set(projectsData.map((p) => p.discipline))];
  return `
    <p class="sf__count">Bookmarks · ${projectsData.length} projects</p>
    ${groups
      .map(
        (g) => `
      <p class="bm__group">${esc(g)}</p>
      <ul class="bm__list">
        ${projectsData
          .filter((p) => p.discipline === g)
          .map(
            (p) => `
          <li>
            <button type="button" data-proj="${p.slug}">
              <img class="bm__fav" src="${p.images[0]}" alt="" loading="lazy" decoding="async" />
              <span class="bm__meta">
                <b>${esc(p.client)}</b>
                <em>${esc(p.summary)}</em>
              </span>
              <span class="bm__n">${p.images.length}</span>
            </button>
          </li>`,
          )
          .join('')}
      </ul>`,
      )
      .join('')}`;
};

const projectPage = (p) => `
  <article class="pj">
    <img class="pj__hero" src="${p.images[0]}" alt="${esc(p.client)} creative"
         loading="eager" decoding="async" />
    <header class="pj__head">
      <h3>${esc(p.client)}</h3>
      <p class="pj__disc">${esc(p.discipline)}</p>
      <p class="pj__sum">${esc(p.summary)}</p>
    </header>
    ${p.body ? p.body.map((t) => `<p class="app__p">${esc(t)}</p>`).join('') : ''}
    <p class="pj__src">
      <a href="${p.source}" target="_blank" rel="noopener">View on beardbros.in</a>
    </p>
  </article>`;

/* -------------------------------------------------------------- notes --- */

const notes = {
  label: 'Notes',
  hue: '#e8b04b',
  art: ART_NOTES,
  title: 'Case Studies',

  render() {
    return `<div class="nt" data-nt><div class="nt__view" data-nt-view>${csList()}</div></div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-nt-view]');
    view.addEventListener('click', (e) => {
      const row = e.target.closest('[data-note]');
      if (row) {
        view.innerHTML = csDetail(caseStudies.find((x) => x.slug === row.dataset.note));
        view.scrollTop = 0;
        return;
      }
      if (e.target.closest('[data-note-back]')) {
        view.innerHTML = csList();
        view.scrollTop = 0;
      }
    });
  },
};

const csList = () => `
  <p class="nt__header">${caseStudies.length} case studies</p>
  <ul class="nt__list">
    ${caseStudies
      .map(
        (c) => `
      <li>
        <button type="button" data-note="${c.slug}">
          <span class="nt__title">${esc(c.client)}</span>
          <span class="nt__meta">${esc(c.sector)} · ${esc(c.year)}</span>
          <span class="nt__preview">${esc(c.dek)}</span>
        </button>
      </li>`,
      )
      .join('')}
  </ul>`;

const csDetail = (c) => `
  <button class="nt__back" type="button" data-note-back>
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} Case Studies
  </button>
  <article class="nt__note" style="--accent:${c.accent}">
    <h3>${esc(c.client)}</h3>
    <p class="nt__stamp">${esc(c.sector)} · ${esc(c.year)} · ${esc(c.read)} read</p>
    <p class="nt__lede">${esc(c.dek)}</p>
    <div class="cs__metrics">
      ${c.metrics.map((m) => `<div><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></div>`).join('')}
    </div>
    ${c.sections
      .map(
        (sec) =>
          `<h4 class="cs__h">${esc(sec.heading)}</h4>` +
          sec.paras.map((t) => `<p>${esc(t)}</p>`).join(''),
      )
      .join('')}
  </article>`;

/* --------------------------------------------------------------- mail --- */

const mail = {
  label: 'Mail',
  hue: '#3f8fe0',
  art: ART_MAIL,
  glyph: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  title: 'New Message',

  render() {
    return `
      <form class="ml" data-ml novalidate>
        <div class="ml__row"><label for="ml-to">To:</label>
          <output id="ml-to">hello@beardbros.in</output></div>
        <div class="ml__row"><label for="ml-from">From:</label>
          <input id="ml-from" name="email" type="email" required placeholder="you@company.com" autocomplete="email" /></div>
        <div class="ml__row"><label for="ml-sub">Subject:</label>
          <input id="ml-sub" name="subject" required placeholder="Project enquiry" /></div>
        <textarea id="ml-body" name="message" required
          placeholder="Tell us what you're building, what's not working, and what a win looks like."></textarea>
        <p class="ml__error" data-ml-error hidden></p>
        <button class="ml__send" type="submit">Send</button>
      </form>
      <div class="ml__sent" data-ml-sent hidden>
        <span class="ml__tick">${svg('<path d="M4 12.5l5.5 5.5L20 7"/>', 2.4)}</span>
        <p>Message sent</p>
        <small>Prototype — nothing actually left the device.</small>
      </div>`;
  },

  mount(root) {
    const form = root.querySelector('[data-ml]');
    const sent = root.querySelector('[data-ml-sent]');
    const err = root.querySelector('[data-ml-error]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const missing = [...form.querySelectorAll('[required]')].filter((f) => !f.value.trim());

      if (missing.length) {
        err.textContent = 'Add your email, a subject and a message.';
        err.hidden = false;
        missing[0].focus();
        return;
      }

      err.hidden = true;
      form.hidden = true;
      sent.hidden = false;
    });
  },
};

/* ----------------------------------------------------------- calendar --- */

const SLOTS = ['09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:30'];

const calendar = {
  label: 'Calendar',
  hue: '#e0603d',
  art: ART_CALENDAR(),
  glyph:
    '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  title: 'Book a call',

  render() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const cells = [];
    for (let i = 0; i < (first + 6) % 7; i++) cells.push('<span></span>');

    for (let d = 1; d <= days; d++) {
      const dow = new Date(year, month, d).getDay();
      const open = dow !== 0 && dow !== 6 && d >= today;
      cells.push(
        `<button type="button" data-day="${d}" ${open ? '' : 'disabled'}
                 class="${d === today ? 'is-today' : ''}">${d}</button>`,
      );
    }

    return `
      <div class="cal" data-cal>
        <p class="cal__month">${now.toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
        <div class="cal__dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
        <div class="cal__grid" data-cal-grid>${cells.join('')}</div>
        <div class="cal__slots" data-cal-slots>
          <p class="cal__hint">Pick a weekday to see open slots.</p>
        </div>
      </div>`;
  },

  mount(root) {
    const grid = root.querySelector('[data-cal-grid]');
    const panel = root.querySelector('[data-cal-slots]');
    let day = null;

    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-day]');
      if (!b || b.disabled) return;

      grid.querySelectorAll('[data-day]').forEach((x) => x.removeAttribute('aria-pressed'));
      b.setAttribute('aria-pressed', 'true');
      day = b.dataset.day;

      panel.innerHTML = `
        <p class="cal__heading">30 min intro call · ${day} ${new Date().toLocaleDateString([], { month: 'short' })}</p>
        <div class="cal__times">
          ${SLOTS.map((t) => `<button type="button" data-slot="${t}">${t}</button>`).join('')}
        </div>
        <p class="cal__tz">Times shown in IST</p>`;
    });

    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slot]');
      if (!b) return;

      panel.innerHTML = `
        <div class="cal__confirm">
          <span>${svg('<path d="M4 12.5l5.5 5.5L20 7"/>', 2.4)}</span>
          <p>Booked — ${day} ${new Date().toLocaleDateString([], { month: 'short' })}, ${b.dataset.slot} IST</p>
          <small>Prototype — wire this to Cal.com or Calendly.</small>
        </div>`;
    });
  },
};

/* ----------------------------------------------------------- settings --- */

const currentTheme = () =>
  document.querySelector('[data-screen]')?.getAttribute('data-theme') ?? 'dark';

const settings = {
  label: 'Settings',
  hue: '#8a8a8f',
  art: ART_SETTINGS,
  glyph:
    '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
  title: 'Settings',

  render() {
    const row = (k, v) => `<li><span>${k}</span><em>${v}</em></li>`;
    const toggle = (id, k, on) => `
      <li>
        <span>${k}</span>
        <button class="st__switch" type="button" role="switch" data-toggle="${id}"
                aria-checked="${on}" aria-label="${k}"><i></i></button>
      </li>`;

    return `
      <div class="st" data-st>
        <p class="st__group">Agency</p>
        <ul class="st__list">
          ${row('Status', '<b class="st__ok">Taking work</b>')}
          ${row('Response time', 'Under 24h')}
          ${row('Markets', 'India · United States')}
          ${row('Since', '2019')}
        </ul>

        <p class="st__group">Engagement</p>
        <ul class="st__list">
          ${row('Model', 'Retainer or project')}
          ${row('Minimum', '3 months')}
          ${row('Media managed', '₹5Cr+')}
          ${row('Peak ROAS', '1700%')}
        </ul>

        <p class="st__group">Display</p>
        <ul class="st__list">
          ${toggle('appearance', 'Light appearance', currentTheme() === 'light')}
          ${toggle('motion', 'Reduce motion', false)}
          ${toggle('grain', 'Wallpaper grain', true)}
        </ul>
        <p class="st__note">These three actually work — try them, then go back to the home screen.</p>

        <p class="st__group">About</p>
        <ul class="st__list">
          ${row('System', 'Beard Bros OS 1.0')}
          ${row('Built with', 'Vite · GSAP Flip')}
        </ul>
      </div>`;
  },

  mount(root) {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-toggle]');
      if (!b) return;

      const on = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', String(on));
      document.dispatchEvent(
        new CustomEvent('os:setting', { detail: { key: b.dataset.toggle, on } }),
      );
    });
  },
};

/* ---------------------------------------------------------------- music -- */

/** Real tracks — audio lives in /public/audio/music. */
const TRACKS = [
  { title: 'Coffee Shop', artist: 'Alex Morgan', src: '/audio/music/alex-morgan-chillhop-jazz-coffee-shop-552792.mp3' },
  { title: 'Lofi Background', artist: 'Apalon Beats', src: '/audio/music/apalonbeats-lofi-background-music-560408.mp3' },
  { title: 'Chill', artist: 'Jonas Blakewood', src: '/audio/music/jonasblakewood-chill-chill-music-519877.mp3' },
  { title: 'Chill', artist: 'Mirostar', src: '/audio/music/mirostar-chill-chill-music-531503.mp3' },
  { title: 'Lounge', artist: 'Prettyjohn', src: '/audio/music/prettyjohn1-lounge-music-494158.mp3' },
];

const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/* Module-level, not inside mount() — playback survives the app closing.
   Press play, browse elsewhere, it keeps going until paused. */
const musicAudio = new Audio();
let musicIdx = null;

const music = {
  label: 'Music',
  hue: '#f0436a',
  art: ART_MUSIC,
  title: 'Studio Loop',

  render() {
    return `
      <div class="mu" data-mu>
        <div class="mu__album">
          <span class="mu__cover" aria-hidden="true"><i></i><i></i><i></i></span>
          <div>
            <p class="mu__title">Studio Loop</p>
            <p class="mu__sub">Lo-fi · ${TRACKS.length} tracks · What we build to</p>
          </div>
        </div>

        <ol class="mu__list" data-mu-list>
          ${TRACKS.map(
            (t, i) => `
            <li>
              <button type="button" data-track="${i}">
                <span class="mu__n">${i + 1}</span>
                <span class="mu__meta"><b>${esc(t.title)}</b><em>${esc(t.artist)}</em></span>
                <span class="mu__len" data-len="${i}">--:--</span>
              </button>
            </li>`,
          ).join('')}
        </ol>

        <div class="mu__bar" data-mu-bar hidden>
          <button class="mu__play" type="button" data-mu-play aria-label="Pause">
            ${svg('<rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/>', 0)}
          </button>
          <div class="mu__now">
            <p data-mu-now></p>
            <div class="mu__track"><i data-mu-fill></i></div>
          </div>
          <span class="mu__time" data-mu-time>0:00</span>
        </div>
      </div>`;
  },

  mount(root) {
    const bar = root.querySelector('[data-mu-bar]');
    const now = root.querySelector('[data-mu-now]');
    const fill = root.querySelector('[data-mu-fill]');
    const time = root.querySelector('[data-mu-time]');
    const playBtn = root.querySelector('[data-mu-play]');

    // Probe each track just for its length, so the list shows real durations
    // before anything is played.
    const probes = TRACKS.map((t, i) => {
      const p = new Audio();
      p.preload = 'metadata';
      p.addEventListener('loadedmetadata', () => {
        root.querySelector(`[data-len="${i}"]`).textContent = mmss(p.duration);
      });
      p.src = t.src;
      return p;
    });

    const paint = () => {
      const d = musicAudio.duration || 0;
      fill.style.width = d ? `${(musicAudio.currentTime / d) * 100}%` : '0%';
      time.textContent = mmss(musicAudio.currentTime);
    };

    const setPlaying = (on) => playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');

    const pause = () => {
      musicAudio.pause();
      setPlaying(false);
    };

    const resume = () => {
      musicAudio.play();
      setPlaying(true);
    };

    function select(i) {
      musicIdx = i;
      const t = TRACKS[i];
      musicAudio.src = t.src;
      now.textContent = `${t.title} — ${t.artist}`;
      bar.hidden = false;
      root.querySelectorAll('[data-track]').forEach((b, n) =>
        b.toggleAttribute('aria-current', n === i),
      );
      fill.style.width = '0%';
      time.textContent = '0:00';
      resume();
    }

    // Reopening the app while a track is already going — reflect it
    // immediately instead of coming up blank.
    if (musicIdx !== null) {
      const t = TRACKS[musicIdx];
      now.textContent = `${t.title} — ${t.artist}`;
      bar.hidden = false;
      root.querySelectorAll('[data-track]').forEach((b, n) =>
        b.toggleAttribute('aria-current', n === musicIdx),
      );
      setPlaying(!musicAudio.paused);
      paint();
    }

    root.querySelector('[data-mu-list]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-track]');
      if (b) select(Number(b.dataset.track));
    });

    playBtn.addEventListener('click', () => (musicAudio.paused ? resume() : pause()));

    const onEnded = () => select((musicIdx + 1) % TRACKS.length);
    musicAudio.addEventListener('timeupdate', paint);
    musicAudio.addEventListener('ended', onEnded);

    return () => {
      musicAudio.removeEventListener('timeupdate', paint);
      musicAudio.removeEventListener('ended', onEnded);
      probes.forEach((p) => {
        p.src = '';
      });
    };
  },
};

/* -------------------------------------------------------------- journal -- */

const journalApp = {
  label: 'Journal',
  hue: '#7a68e0',
  art: ART_JOURNAL,
  title: 'Journal',

  render() {
    return `<div class="jr" data-jr><div class="jr__view" data-jr-view>${postList()}</div></div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-jr-view]');
    view.addEventListener('click', (e) => {
      const row = e.target.closest('[data-post]');
      if (row) {
        view.innerHTML = postDetail(journal.find((x) => x.slug === row.dataset.post));
        view.scrollTop = 0;
        return;
      }
      if (e.target.closest('[data-post-back]')) {
        view.innerHTML = postList();
        view.scrollTop = 0;
      }
    });
  },
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

const postList = () => `
  <p class="jr__header">Writing<span>${journal.length} posts</span></p>
  <ul class="jr__list">
    ${journal
      .map(
        (p) => `
      <li>
        <button type="button" data-post="${p.slug}">
          <span class="jr__tag">${esc(p.tag)}</span>
          <span class="jr__title">${esc(p.title)}</span>
          <span class="jr__dek">${esc(p.dek)}</span>
          <span class="jr__meta">${fmtDate(p.date)} · ${esc(p.read)} read</span>
        </button>
      </li>`,
      )
      .join('')}
  </ul>`;

const postDetail = (p) => `
  <button class="nt__back" type="button" data-post-back>
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} Journal
  </button>
  <article class="jr__post">
    <span class="jr__tag">${esc(p.tag)}</span>
    <h3>${esc(p.title)}</h3>
    <p class="jr__dek jr__dek--lead">${esc(p.dek)}</p>
    <p class="nt__stamp">${fmtDate(p.date)} · ${esc(p.read)} read</p>
    ${p.body.map((t) => `<p>${esc(t)}</p>`).join('')}
  </article>`;

/* ---------------------------------------------------------------- clock -- */

const ZONES = [
  { city: 'Mumbai', tz: 'Asia/Kolkata', note: 'Studio' },
  { city: 'New York', tz: 'America/New_York', note: 'US clients' },
  { city: 'London', tz: 'Europe/London', note: '' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles', note: '' },
];

const clock = {
  label: 'Clock',
  hue: '#3a3a42',
  art: ART_CLOCK(),
  title: 'World Clock',

  render() {
    return `
      <div class="ck">
        <p class="ck__big" data-ck-big>--:--:--</p>
        <p class="ck__zone">Mumbai · India Standard Time</p>
        <ul class="ck__list">
          ${ZONES.map(
            (z) => `
            <li data-tz="${z.tz}">
              <span class="ck__city">${esc(z.city)}${z.note ? `<em>${esc(z.note)}</em>` : ''}</span>
              <span class="ck__t" data-ck-t>--:--</span>
            </li>`,
          ).join('')}
        </ul>
      </div>`;
  },

  mount(root) {
    const big = root.querySelector('[data-ck-big]');
    const rows = [...root.querySelectorAll('[data-tz]')];

    const paint = () => {
      const now = new Date();
      big.textContent = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' });
      rows.forEach((r) => {
        r.querySelector('[data-ck-t]').textContent = now.toLocaleTimeString([], {
          timeZone: r.dataset.tz,
          hour: '2-digit',
          minute: '2-digit',
        });
      });
    };

    paint();
    const t = setInterval(paint, 1000);
    return () => clearInterval(t);
  },
};

/* -------------------------------------------------------------- weather -- */

/** WMO weather codes, condensed to the buckets that matter. */
const WMO = {
  0: ['Clear', '☀'], 1: ['Mainly clear', '🌤'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁'],
  45: ['Fog', '🌫'], 48: ['Rime fog', '🌫'], 51: ['Light drizzle', '🌦'], 53: ['Drizzle', '🌦'],
  55: ['Heavy drizzle', '🌦'], 61: ['Light rain', '🌧'], 63: ['Rain', '🌧'], 65: ['Heavy rain', '🌧'],
  71: ['Light snow', '🌨'], 73: ['Snow', '🌨'], 75: ['Heavy snow', '🌨'], 80: ['Showers', '🌦'],
  81: ['Showers', '🌧'], 82: ['Violent showers', '⛈'], 95: ['Thunderstorm', '⛈'],
  96: ['Thunderstorm', '⛈'], 99: ['Thunderstorm', '⛈'],
};

const CITIES = [
  { city: 'Mumbai', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
  { city: 'Hyderabad', lat: 17.385, lon: 78.4867, tz: 'Asia/Kolkata' },
  { city: 'New Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  { city: 'Bengaluru', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
];

/** Live from Open-Meteo — free, no API key, no attribution requirement. */
export async function fetchWeather(c) {
  const u =
    `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(c.tz)}&forecast_days=1`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`weather ${r.status}`);
  return r.json();
}

const weather = {
  label: 'Weather',
  hue: '#3d8fe0',
  art: ART_WEATHER,
  title: 'Weather',

  render() {
    return `
      <div class="wx" data-wx>
        <div class="wx__hero" data-wx-hero><p class="wx__loading">Fetching live conditions…</p></div>
        <ul class="wx__list" data-wx-list>
          ${CITIES.map(
            (c) => `<li data-city="${esc(c.city)}"><span>${esc(c.city)}</span><em data-wx-t>—</em></li>`,
          ).join('')}
        </ul>
        <p class="wx__src">Live from Open-Meteo</p>
      </div>`;
  },

  mount(root) {
    let dead = false;
    const hero = root.querySelector('[data-wx-hero]');

    (async () => {
      try {
        const results = await Promise.all(CITIES.map((c) => fetchWeather(c).catch(() => null)));
        if (dead) return;

        const main = results[0];
        if (main) {
          const [desc, ico] = WMO[main.current.weather_code] ?? ['—', '·'];
          hero.innerHTML = `
            <p class="wx__city">Mumbai</p>
            <p class="wx__temp">${Math.round(main.current.temperature_2m)}<span>°C</span></p>
            <p class="wx__desc">${ico} ${esc(desc)}</p>
            <p class="wx__meta">
              Feels ${Math.round(main.current.apparent_temperature)}° ·
              H:${Math.round(main.daily.temperature_2m_max[0])}° L:${Math.round(main.daily.temperature_2m_min[0])}° ·
              ${main.current.relative_humidity_2m}% humidity ·
              ${Math.round(main.current.wind_speed_10m)} km/h
            </p>`;
        } else {
          hero.innerHTML = `<p class="wx__loading">Couldn’t reach the weather service.</p>`;
        }

        results.forEach((r, i) => {
          if (!r) return;
          const el = root.querySelector(`[data-city="${CITIES[i].city}"] [data-wx-t]`);
          const [, ico] = WMO[r.current.weather_code] ?? ['', '·'];
          if (el) el.textContent = `${ico} ${Math.round(r.current.temperature_2m)}°`;
        });
      } catch {
        if (!dead) hero.innerHTML = `<p class="wx__loading">Couldn’t reach the weather service.</p>`;
      }
    })();

    return () => {
      dead = true;
    };
  },
};

/* ---------------------------------------------------------------- files -- */

const ABOUT_FILE = {
  id: 'about',
  name: 'About Beard Bros',
  kind: 'Document',
  size: '6 KB',
  body: [
    'We are two brothers running an end-to-end digital marketing agency out of Mumbai, working across India and the United States.',
    'Malcolm spent his early career at Digitas LBi. Melroy came from RKswamy BBDO and Ogilvy, where he was a creative director. Between us that is over two decades of agency work — enough to know which parts of the model are worth keeping and which parts exist to bill hours.',
    'A hundred-plus clients later, the thing we believe hardest is that channels should not be sold separately. Most agencies hand you a social retainer, a performance retainer and a web project, run by three teams who meet at a status call. That produces campaigns which contradict the site they point at, and brand work nobody in the media team ever reads.',
    'So we run one system. Paid media, brand, web, social and content share a strategy and a single set of numbers. When we built Beardo from three products on Amazon into a brand Marico eventually acquired, we held the voice, the storefront and the spend at once. That is the only reason it stayed coherent for three years.',
    'We have managed ₹5 crore+ in media spend, mostly for D2C, FMCG and challenger brands. Some of it produced numbers we are happy to put on a wall. Some of it taught us what does not work in a category — less fun to write up, more useful to have.',
    'If you want impressions, there are cheaper agencies. If you want revenue you can trace back to a decision, that is the work we do.',
  ],
};

const FILES = [
  ABOUT_FILE,
  ...services.map((sv) => ({
    id: sv.slug,
    name: sv.name,
    kind: 'Service',
    size: `${sv.deliverables.length} items`,
    hue: sv.hue,
    body: [sv.blurb, ...sv.long, '§What you get', ...sv.deliverables.map((d) => '— ' + d)],
  })),
];

const files = {
  label: 'Files',
  hue: '#3d9fe0',
  art: ART_FILES,
  title: 'Browse',

  render() {
    return `<div class="fs" data-fs><div class="fs__view" data-fs-view>${fileList()}</div></div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-fs-view]');
    view.addEventListener('click', (e) => {
      const row = e.target.closest('[data-file]');
      if (row) {
        view.innerHTML = fileDetail(FILES.find((f) => f.id === row.dataset.file));
        view.scrollTop = 0;
        return;
      }
      if (e.target.closest('[data-file-back]')) {
        view.innerHTML = fileList();
        view.scrollTop = 0;
      }
    });
  },
};

const docIcon = (hue) => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 2h8l5 5v15H6z" fill="#fff" opacity=".92"/>
    <path d="M14 2l5 5h-5z" fill="${hue ?? '#9ac4e8'}"/>
    <g stroke="${hue ?? '#9ac4e8'}" stroke-width="1.3" stroke-linecap="round">
      <line x1="9" y1="12" x2="16" y2="12"/><line x1="9" y1="15" x2="16" y2="15"/>
      <line x1="9" y1="18" x2="13" y2="18"/>
    </g>
  </svg>`;

const fileList = () => `
  <p class="fs__crumb">Beard Bros · ${FILES.length} items</p>
  <ul class="fs__list">
    ${FILES.map(
      (f) => `
      <li>
        <button type="button" data-file="${f.id}">
          <span class="fs__ico">${docIcon(f.hue)}</span>
          <span class="fs__meta"><b>${esc(f.name)}</b><em>${esc(f.kind)} · ${esc(f.size)}</em></span>
          ${svg('<path d="M9 5l7 7-7 7"/>', 2)}
        </button>
      </li>`,
    ).join('')}
  </ul>`;

const fileDetail = (f) => `
  <button class="nt__back" type="button" data-file-back>
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} Browse
  </button>
  <article class="fs__doc"${f.hue ? ` style="--accent:${f.hue}"` : ''}>
    <h3>${esc(f.name)}</h3>
    <p class="nt__stamp">${esc(f.kind)} · ${esc(f.size)}</p>
    ${f.body
      .map((t) =>
        t.startsWith('§')
          ? `<h4 class="cs__h">${esc(t.slice(1))}</h4>`
          : t.startsWith('— ')
            ? `<p class="nt__item">${esc(t.slice(2))}</p>`
            : `<p>${esc(t)}</p>`,
      )
      .join('')}
  </article>`;

/* ---------------------------------------------------------------- memos -- */

/** Real client recordings — audio lives in /public/audio/memos. */
const MEMOS = [
  { id: 'beardo', author: 'Ashutosh Valani', role: 'Co-founder, Beardo', src: '/audio/memos/ashutosh-valani-beardo.mp3' },
  {
    id: 'naturevibe',
    author: 'Rishabh Chokhani',
    role: 'Founder, Naturevibe Botanicals',
    src: '/audio/memos/rishabh-chokhani-naturevibe-botanicals.mp3',
  },
  {
    id: 'celfiedesign',
    author: 'Rahul Satia',
    role: 'Founder, CelfieDesign',
    src: '/audio/memos/rahul-satia-celfie-design.mp3',
  },
  { id: 'nutrizoe', author: 'Richa Pendeke', role: 'Nutrizoe', src: '/audio/memos/richa-pendeke-nutrizoe.mp3' },
  { id: 'prodigitaly', author: 'Subhasis Rath', role: 'Prodigitaly', src: '/audio/memos/subhasis-rath-prodigitaly.mp3' },
];

const PLAY_ICON = svg('<path d="M8 5l11 7-11 7z" fill="currentColor"/>', 0);
const PAUSE_ICON = svg(
  '<rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/>',
  0,
);

const memos = {
  label: 'Voice Memos',
  hue: '#f0436a',
  art: ART_MEMOS,
  title: 'Client Voices',

  render() {
    return `
      <div class="vm" data-vm>
        <p class="vm__note">Client testimonials, recorded in their own voice.</p>
        <ul class="vm__list">
          ${MEMOS.map(
            (m, i) => `
            <li data-memo="${m.id}">
              <button type="button" class="vm__row" data-play="${i}">
                <span class="vm__pp" aria-hidden="true" data-pp>${PLAY_ICON}</span>
                <span class="vm__meta">
                  <b>${esc(m.author)}</b>
                  <em>${esc(m.role)}</em>
                </span>
                <span class="vm__badge" data-time>--:--</span>
              </button>
              <div class="vm__wave" data-wave>
                ${Array.from({ length: 34 }, (_, k) => `<i style="--h:${20 + ((k * 37) % 62)}%"></i>`).join('')}
              </div>
            </li>`,
          ).join('')}
        </ul>
      </div>`;
  },

  mount(root) {
    const audio = new Audio();
    audio.preload = 'none';

    const rows = [...root.querySelectorAll('[data-memo]')];
    let active = null;

    const mmssLocal = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

    const paintTime = () => {
      if (active === null) return;
      const li = rows[active];
      const t = li.querySelector('[data-time]');
      t.textContent = mmssLocal(audio.currentTime);
    };

    const setPlaying = (i, on) => {
      const li = rows[i];
      li.toggleAttribute('data-speaking', on);
      li.querySelector('[data-pp]').innerHTML = on ? PAUSE_ICON : PLAY_ICON;
    };

    const stop = () => {
      if (active === null) return;
      audio.pause();
      setPlaying(active, false);
      rows[active].querySelector('[data-time]').textContent = '--:--';
      active = null;
    };

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-play]');
      if (!btn) return;
      const i = Number(btn.dataset.play);

      if (active === i) {
        stop();
        return;
      }

      if (active !== null) setPlaying(active, false);
      active = i;
      audio.src = MEMOS[i].src;
      audio.currentTime = 0;
      audio.play().catch(() => stop());
      setPlaying(i, true);
    });

    audio.addEventListener('timeupdate', paintTime);
    audio.addEventListener('ended', stop);

    return () => {
      audio.pause();
      audio.src = '';
    };
  },
};

/* ---------------------------------------------------------------- feed -- */

/**
 * Every shipped project becomes a grid post; the twelve with an extended
 * write-up double as both the stories rail and the profile's highlight reel —
 * the same signal Safari already uses to decide which projects get a full
 * page.
 */
const HIGHLIGHTS = projectsData.filter((p) => p.body);

/** Deterministic per-slug pseudo-stats, so numbers don't reshuffle on repaint. */
const hashSeed = (slug, salt) => {
  let h = salt;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};
const hashLikes = (slug) => 80 + (hashSeed(slug, 1) % 340);
const hashComments = (slug) => 4 + (hashSeed(slug, 2) % 45);
const hashAgo = (slug) => {
  const d = 1 + (hashSeed(slug, 3) % 52);
  if (d < 7) return `${d} DAY${d > 1 ? 'S' : ''} AGO`;
  if (d < 30) {
    const w = Math.round(d / 7);
    return `${w} WEEK${w > 1 ? 'S' : ''} AGO`;
  }
  const m = Math.round(d / 30);
  return `${m} MONTH${m > 1 ? 'S' : ''} AGO`;
};

const HEART = '<path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.7 2.3 4 6 4c2.2 0 3.7 1.2 4.6 2.5C11.5 5.2 13 4 15.2 4c3.7 0 5.6 3.7 4 7.2-2.5 4.7-10 9.3-10 9.3z"';
const ICON_HEART = svg(`${HEART} fill="currentColor" stroke="none"/>`, 0);
const ICON_HEART_OUTLINE = svg(`${HEART}/>`, 1.9);
const ICON_COMMENT = svg('<path d="M21 12a8.5 8.5 0 0 1-8.9 8.5c-1.1 0-2.1-.2-3.1-.6L3 21l1.3-5.7A8.4 8.4 0 0 1 3.5 12 8.5 8.5 0 1 1 21 12z"/>', 1.8);
const ICON_SHARE = svg('<path d="M22 3L2.5 10.4c-.9.3-.9 1.6.1 1.8L11 14l1.8 8.4c.2 1 1.5 1.1 1.8.1L22 3z"/><path d="M11 14l6.5-7.5"/>', 1.8);
const ICON_BOOKMARK = svg('<path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4-6.5 4V4.5a1 1 0 0 1 1-1z"/>', 1.8);
const ICON_MENU = svg('<circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/>', 0);
const ICON_CAMERA_ADD = svg('<rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="M12 8v8M8 12h8"/>', 1.8);

const feedTile = (p) => `
  <button type="button" class="ig__tile" data-post="${p.slug}" aria-label="${esc(p.client)}">
    <img src="${p.images[0]}" alt="" loading="lazy" decoding="async" />
  </button>`;

const storyBubble = (p) => `
  <button type="button" class="ig__story" data-post="${p.slug}">
    <span class="ig__story-ring"><img src="${p.images[0]}" alt="" loading="lazy" decoding="async" /></span>
    <span class="ig__story-label">${esc(p.client)}</span>
  </button>`;

const feedGrid = () => `
  <div class="ig__stories" role="list">${HIGHLIGHTS.map(storyBubble).join('')}</div>
  <div class="ig__grid" role="list">${projectsData.map(feedTile).join('')}</div>`;

const backRow = (to) => `
  <button class="nt__back" type="button" data-ig-back="${to}">
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} ${to === 'profile' ? 'Profile' : 'Feed'}
  </button>`;

const profileView = () => `
  ${backRow('grid')}
  <div class="ig__profile">
    <div class="ig__profile-head">
      <span class="ig__avatar ig__avatar--lg">BB</span>
      <dl class="ig__stats">
        <div><dt>${projectsData.length}</dt><dd>Posts</dd></div>
        <div><dt>100+</dt><dd>Clients</dd></div>
        <div><dt>2015</dt><dd>Since</dd></div>
      </dl>
    </div>
    <p class="ig__name">Beard Bros</p>
    <p class="ig__bio">Paid media, brand, web, social and content — one system, one set of numbers. Mumbai · India & US.</p>
    <p class="ig__highlights-label">Highlights</p>
    <div class="ig__grid" role="list">${HIGHLIGHTS.map(feedTile).join('')}</div>
  </div>`;

const postView = (p, back) => `
  ${backRow(back)}
  <article class="ig__post">
    <div class="ig__post-topbar">
      <button type="button" class="ig__post-head" data-ig-avatar>
        <span class="ig__avatar">BB</span>
        <span class="ig__post-meta"><b>beardbros</b><em>${esc(p.discipline)}</em></span>
      </button>
      <span class="ig__post-menu" aria-hidden="true">${ICON_MENU}</span>
    </div>
    <div class="ig__post-media">
      <img class="ig__post-img" data-ig-dbl src="${p.images[0]}" alt="${esc(p.client)} creative" loading="eager" decoding="async" />
      <span class="ig__heart-burst" data-ig-burst aria-hidden="true">${ICON_HEART}</span>
    </div>
    <div class="ig__actions">
      <button type="button" class="ig__like" data-ig-like="${p.slug}" aria-pressed="false" aria-label="Like">
        ${ICON_HEART_OUTLINE}
      </button>
      <span class="ig__action-icon" aria-hidden="true">${ICON_COMMENT}</span>
      <span class="ig__action-icon" aria-hidden="true">${ICON_SHARE}</span>
      <span class="ig__action-icon ig__action-icon--end" aria-hidden="true">${ICON_BOOKMARK}</span>
    </div>
    <p class="ig__likes">Liked by <b>beardbros</b> and <span data-ig-count>${hashLikes(p.slug)}</span> others</p>
    <p class="ig__caption"><b>beardbros</b> ${esc(p.summary)}</p>
    ${p.body ? p.body.map((t) => `<p class="app__p">${esc(t)}</p>`).join('') : ''}
    <p class="ig__comments-link">View all ${hashComments(p.slug)} comments</p>
    <p class="ig__timestamp">${hashAgo(p.slug)}</p>
    <p class="pj__src"><a href="${p.source}" target="_blank" rel="noopener">View on beardbros.in</a></p>
  </article>`;

const feed = {
  label: 'Instagram',
  hue: '#c22e86',
  art: ART_FEED,
  title: 'Instagram',

  render() {
    return `
      <div class="ig" data-ig>
        <div class="ig__bar">
          <span class="ig__brand">beardbros</span>
          <div class="ig__bar-right">
            <span class="ig__bar-icons" aria-hidden="true">${ICON_CAMERA_ADD}${ICON_HEART_OUTLINE}${ICON_SHARE}</span>
            <button type="button" class="ig__bar-avatar" data-ig-avatar aria-label="Profile">BB</button>
          </div>
        </div>
        <div data-ig-view>${feedGrid()}</div>
      </div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-ig-view]');
    const liked = new Set();
    let origin = 'grid';

    const paint = (html) => {
      view.innerHTML = html;
      root.scrollTop = 0;
    };

    const showGrid = () => {
      origin = 'grid';
      paint(feedGrid());
    };

    const showProfile = () => {
      origin = 'profile';
      paint(profileView());
    };

    const showPost = (slug) => {
      const p = projectsData.find((x) => x.slug === slug);
      if (p) paint(postView(p, origin));
    };

    const setLiked = (likeBtn, on) => {
      const slug = likeBtn.dataset.igLike;
      liked[on ? 'add' : 'delete'](slug);
      likeBtn.setAttribute('aria-pressed', String(on));
      likeBtn.innerHTML = on ? ICON_HEART : ICON_HEART_OUTLINE;
      likeBtn.closest('.ig__post').querySelector('[data-ig-count]').textContent =
        String(hashLikes(slug) + (on ? 1 : 0));
    };

    root.addEventListener('click', (e) => {
      const like = e.target.closest('[data-ig-like]');
      if (like) {
        setLiked(like, !liked.has(like.dataset.igLike));
        return;
      }

      if (e.target.closest('[data-ig-avatar]')) {
        showProfile();
        return;
      }

      const tile = e.target.closest('[data-post]');
      if (tile) {
        showPost(tile.dataset.post);
        return;
      }

      const back = e.target.closest('[data-ig-back]');
      if (back) {
        back.dataset.igBack === 'profile' ? showProfile() : showGrid();
      }
    });

    root.addEventListener('dblclick', (e) => {
      const img = e.target.closest('[data-ig-dbl]');
      if (!img) return;
      const article = img.closest('.ig__post');
      const likeBtn = article.querySelector('.ig__like');
      if (likeBtn.getAttribute('aria-pressed') !== 'true') setLiked(likeBtn, true);

      const burst = article.querySelector('[data-ig-burst]');
      burst.classList.remove('is-active');
      void burst.offsetWidth;
      burst.classList.add('is-active');
    });
  },
};

export const APPS = { safari, notes, files, journal: journalApp, mail, memos, calendar, music, clock, weather, settings, feed };
export const SYSTEM_ORDER = ['safari', 'notes', 'feed', 'files', 'journal', 'mail', 'memos', 'calendar', 'music', 'clock', 'weather', 'settings'];
export const DOCK_ORDER = ['safari', 'mail', 'settings'];
export { svg, art, field, esc };
