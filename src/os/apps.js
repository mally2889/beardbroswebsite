import { services } from '../data/services.js';
import iconOverrides from '../data/icon-overrides.json';
import { FORM_ENDPOINT } from '../data/contact.js';
import { projectsData } from '../data/projects-full.js';
import { caseStudies } from '../data/case-studies.js';
import { journal } from '../data/journal.js';
import { reelsByProject } from '../data/reels.js';
import { mediaByProject } from '../data/portfolio-media.js';
import { testimonials } from '../data/testimonials.js';
import { agencyNotes } from '../data/agency-notes.js';
import { websites } from '../data/websites.js';
import {
  radioAudio,
  radioToggle,
  radioNext,
  setRadioVolume,
  nowPlayingStation,
  loadStationArt,
} from './radio.js';
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

/*
 * `preload="metadata"` only promises duration/dimensions, not a painted
 * frame — plenty of browsers (Safari especially) leave a bare <video> fully
 * black until it's actually played. Every clip in the OS (feed, "from the
 * shoot" grid, Safari's project slider) gets a real poster instead: seek a
 * hair into the file to force that frame to decode, then snapshot it onto
 * a canvas. Idempotent and safe to call more than once per element.
 */
const capturePoster = (video) => {
  if (video.dataset.posterWired) return;
  video.dataset.posterWired = '1';
  const grab = () => {
    try {
      const c = document.createElement('canvas');
      c.width = video.videoWidth || 640;
      c.height = video.videoHeight || 640;
      c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
      video.poster = c.toDataURL('image/jpeg', 0.72);
    } catch {
      /* frame not decoded yet, or a canvas taint — leave it posterless */
    }
  };
  /* Even at readyState HAVE_ENOUGH_DATA, a video that's never been played
     or seeked hasn't necessarily decoded/presented any frame yet — a lot of
     clips open on a black fade-in, so grabbing frame 0 as-is often just
     captures genuine black. Explicitly seeking forces that specific frame
     to decode before the canvas reads it. */
  const seekAndGrab = () => {
    video.addEventListener('seeked', grab, { once: true });
    try {
      video.currentTime = Math.min(0.3, (video.duration || 0.6) / 2);
    } catch {
      video.removeEventListener('seeked', grab);
      grab();
    }
  };
  if (video.readyState >= 1) seekAndGrab();
  else video.addEventListener('loadedmetadata', seekAndGrab, { once: true });
};

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

/**
 * Icon overrides — the "App Icons" screen in /admin (backed by
 * icon-overrides.json) lets an editor upload a replacement image per app;
 * that takes priority. Failing that, dropping a same-name PNG straight into
 * /public/icons/ (e.g. icons/safari.png) still works as a code-free manual
 * fallback — see public/icons/README.md. Either way it replaces the
 * built-in artwork on both the desktop Dock and the phone Home Screen/Dock,
 * no code change needed. Every icon slot renders its normal SVG first (so
 * nothing ever looks broken), then this swaps in a custom image if one's
 * configured or found. `root` is any container just painted with one or
 * more `[data-icon-id]` tiles (a whole Dock, a whole page of Home Screen
 * icons, etc.).
 */
export function enhanceIconArt(root) {
  root.querySelectorAll('[data-icon-id]').forEach((el) => {
    const id = el.dataset.iconId;
    const custom = iconOverrides[id];
    if (custom) {
      el.innerHTML = `<img class="icon-art-custom" src="${custom}" alt="" />`;
      return;
    }
    const probe = new Image();
    probe.onload = () => {
      el.innerHTML = `<img class="icon-art-custom" src="/icons/${id}.png" alt="" />`;
    };
    probe.src = `/icons/${id}.png`;
  });
}

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
          <input class="sf__url" data-sf-url type="text" value="beardbros.in/portfolio"
                 spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Address" />
          <button type="button" class="sf__go" data-sf-go aria-label="Go">${svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 2)}</button>
        </div>
        <div class="sf__bookmarks" data-sf-bookmarks>
          <button type="button" data-sf-bm="reading">Reading List</button>
          <button type="button" data-sf-bm="suggestions">Suggestions</button>
          <button type="button" data-sf-bm="websites">Websites</button>
          <button type="button" data-sf-bm-proj="beardo">Beardo</button>
          <button type="button" data-sf-bm-proj="naturevibe-india">Naturevibe</button>
          <button type="button" data-sf-bm-reading="kids-nutrition">Early Foods</button>
        </div>
        <div class="sf__view" data-sf-view>${sfHome()}</div>
        <div class="sf__toolbar">
          <button type="button" data-sf-back aria-label="Back" disabled>
            ${svg('<path d="M15 5l-7 7 7 7"/>', 2)}
          </button>
          <button type="button" data-sf-home aria-label="Home">
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
      view.innerHTML = sfHome();
      view.scrollTop = 0;
      url.value = 'beardbros.in/portfolio';
      back.disabled = true;
    };

    const openProject = (pr) => {
      view.innerHTML = projectPage(pr);
      view.scrollTop = 0;
      url.value = `beardbros.in/portfolio/${pr.slug}`;
      back.disabled = false;
      wireSlider(view);
    };

    const openReading = (cs) => {
      view.innerHTML = csDetail(cs);
      view.scrollTop = 0;
      url.value = `beardbros.in/reading/${cs.slug}`;
      back.disabled = false;
    };

    const openWebsite = (w) => {
      view.innerHTML = websitePage(w);
      view.scrollTop = 0;
      url.value = w.url.replace(/^https?:\/\//, '');
      back.disabled = false;
    };

    /*
     * A real, typeable address bar — but sandboxed to the site's own fake
     * URL space rather than actually fetching the internet. Most real
     * sites refuse to be framed at all (X-Frame-Options/CSP), so a genuine
     * iframe-based browser would mostly show broken/blank pages for any
     * real domain typed in — worse for the illusion than not having it.
     * Matching a project/case-study by slug or client name and otherwise
     * showing Safari's own "can't open the page" state keeps the address
     * bar meaningfully interactive without ever pretending to browse
     * somewhere it can't actually reach.
     */
    const normalizeQuery = (raw) =>
      raw
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^beardbros\.in\/?/, '')
        .replace(/^\/+|\/+$/g, '');

    const resolveAndGo = (raw) => {
      const q = normalizeQuery(raw);
      if (!q || q === 'portfolio' || q === 'home') {
        home();
        return;
      }

      const afterPortfolio = q.replace(/^portfolio\//, '');
      const afterReading = q.replace(/^reading\//, '');

      const csExact = caseStudies.find((c) => c.slug === afterReading || c.slug === q);
      if (csExact) {
        openReading(csExact);
        return;
      }

      const prExact = projectsData.find((p) => p.slug === afterPortfolio || p.slug === q);
      if (prExact) {
        openProject(prExact);
        return;
      }

      const siteMatch = websites.find(
        (w) => siteHost(w.url).toLowerCase() === raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
      );
      if (siteMatch) {
        openWebsite(siteMatch);
        return;
      }

      const needle = q.replace(/-/g, ' ');
      const siteFuzzy = websites.find((w) => w.name.toLowerCase().includes(needle) || needle.includes(w.name.toLowerCase()));
      if (siteFuzzy) {
        openWebsite(siteFuzzy);
        return;
      }
      const prFuzzy = projectsData.find(
        (p) => p.client.toLowerCase().includes(needle) || needle.includes(p.client.toLowerCase()),
      );
      if (prFuzzy) {
        openProject(prFuzzy);
        return;
      }

      const csFuzzy = caseStudies.find((c) => c.client.toLowerCase().includes(needle));
      if (csFuzzy) {
        openReading(csFuzzy);
        return;
      }

      view.innerHTML = `
        <div class="sf__notfound">
          <p class="sf__notfound-title">Safari can’t open the page</p>
          <p class="sf__notfound-sub">“${esc(raw)}” isn’t a page on beardbros.in.</p>
          <button type="button" class="sf__notfound-home" data-sf-home-link>Go to bookmarks</button>
        </div>`;
      view.scrollTop = 0;
      url.value = `beardbros.in/${q}`;
      back.disabled = false;
    };

    view.addEventListener('click', (e) => {
      const mute = e.target.closest('[data-pj-mute]');
      if (mute) {
        const vid = mute.closest('.pj__slide')?.querySelector('video');
        if (vid) {
          vid.muted = !vid.muted;
          mute.setAttribute('aria-pressed', String(vid.muted));
          mute.innerHTML = vid.muted ? ICON_SPEAKER_MUTED : ICON_SPEAKER_ON;
        }
        return;
      }

      const prev = e.target.closest('[data-pj-prev]');
      const next = e.target.closest('[data-pj-next]');
      if (prev || next) {
        const track = view.querySelector('[data-pj-track]');
        track?.scrollBy({ left: (prev ? -1 : 1) * track.clientWidth, behavior: 'smooth' });
        return;
      }

      if (e.target.closest('[data-reading-back]') || e.target.closest('[data-sf-home-link]')) {
        home();
        return;
      }

      const reading = e.target.closest('[data-reading]');
      if (reading) {
        const cs = caseStudies.find((x) => x.slug === reading.dataset.reading);
        if (cs) openReading(cs);
        return;
      }

      const site = e.target.closest('[data-site]');
      if (site) {
        const w = websites.find((x) => x.url === site.dataset.site);
        if (w) openWebsite(w);
        return;
      }

      const row = e.target.closest('[data-proj]');
      if (!row) return;
      const pr = projectsData.find((x) => x.slug === row.dataset.proj);
      if (pr) openProject(pr);
    });

    root.querySelector('[data-sf-bookmarks]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.sfBm === 'reading') {
        home();
        return;
      }
      if (b.dataset.sfBm === 'suggestions') {
        home();
        view.querySelector('.sg__grid')?.scrollIntoView({ block: 'start' });
        return;
      }
      if (b.dataset.sfBm === 'websites') {
        home();
        view.querySelector('.ws__grid')?.scrollIntoView({ block: 'start' });
        return;
      }
      if (b.dataset.sfBmProj) {
        const pr = projectsData.find((x) => x.slug === b.dataset.sfBmProj);
        if (pr) openProject(pr);
        return;
      }
      if (b.dataset.sfBmReading) {
        const cs = caseStudies.find((x) => x.slug === b.dataset.sfBmReading);
        if (cs) openReading(cs);
      }
    });

    url.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      resolveAndGo(url.value);
      url.blur();
    });
    root.querySelector('[data-sf-go]').addEventListener('click', () => resolveAndGo(url.value));
    url.addEventListener('focus', () => url.select());

    back.addEventListener('click', home);
    root.querySelector('[data-sf-home]').addEventListener('click', home);
  },
};

/** Reading List — real Safari's own reading list, filled with case studies
    instead of saved articles. */
const readingListSection = () => `
  <p class="sf__section-label">Reading List</p>
  <ul class="rl__list">
    ${caseStudies
      .map(
        (c) => `
      <li>
        <button type="button" class="rl__row" data-reading="${c.slug}">
          <span class="rl__meta">
            <b class="rl__title">${esc(c.client)}</b>
            <em class="rl__sub">${esc(c.sector)} · ${esc(c.year)}</em>
          </span>
          <span class="rl__dek">${esc(c.dek)}</span>
          <span class="rl__read">${esc(c.read)} read</span>
        </button>
      </li>`,
      )
      .join('')}
  </ul>`;

/** Client quotes — Voice Memos retired, the words themselves stand out here
    instead, between the Reading List and the portfolio. */
const quoteStrip = () => `
  <p class="sf__section-label">What clients say</p>
  <div class="qt__strip">
    ${testimonials
      .map(
        (t) => `
      <blockquote class="qt__card" style="--accent:${t.accent}">
        <p class="qt__text">“${esc(t.quote)}”</p>
        <footer class="qt__by"><b>${esc(t.author)}</b><span>${esc(t.role)}</span></footer>
      </blockquote>`,
      )
      .join('')}
  </div>`;

/** Suggestions — Safari's own start-page "suggested links" grammar, big
    tiles instead of a flat bookmarks list. */
const suggestionsSection = () => `
  <p class="sf__section-label">Suggestions · ${projectsData.length} projects</p>
  <div class="sg__grid">
    ${projectsData
      .map(
        (p) => `
      <button type="button" class="sg__card" data-proj="${p.slug}">
        <img class="sg__img" src="${p.images[0]}" alt="" loading="lazy" decoding="async" />
        <span class="sg__meta">
          <b class="sg__title">${esc(p.client)}</b>
          <em class="sg__excerpt">${esc(p.summary)}</em>
        </span>
      </button>`,
      )
      .join('')}
  </div>`;

/** Websites — live client sites, opened in Safari via iframe instead of a
    static screenshot, so they're actually browsable inside the OS. */
const siteHost = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const websitesSection = () => `
  <p class="sf__section-label">Websites</p>
  <div class="ws__grid">
    ${websites
      .map(
        (w) => `
      <button type="button" class="ws__card" data-site="${esc(w.url)}">
        <span class="ws__glyph">${esc(w.name.slice(0, 1))}</span>
        <span class="ws__meta">
          <b class="ws__title">${esc(w.name)}</b>
          <em class="ws__host">${esc(siteHost(w.url))}</em>
        </span>
      </button>`,
      )
      .join('')}
  </div>`;

const sfHome = () => `${readingListSection()}${quoteStrip()}${websitesSection()}${suggestionsSection()}`;

/** A live client site, framed inline. Not every third-party site allows
    itself to be embedded (X-Frame-Options/CSP), so the "open directly"
    fallback link is always shown alongside the frame rather than only on
    failure — there's no reliable way to detect a blocked frame from outside
    its own origin. */
const websitePage = (w) => `
  <div class="ws__page">
    <div class="ws__page-bar">
      <b>${esc(w.name)}</b>
      <a href="${esc(w.url)}" target="_blank" rel="noopener">Open directly ↗</a>
    </div>
    <div class="ws__frame-wrap">
      <iframe class="ws__frame" src="${esc(w.url)}" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="${esc(w.name)}"></iframe>
    </div>
  </div>`;

/*
 * A project with real local media (portfolio-media.js) gets a swipeable
 * slider instead of one static hero — same idea as the Feed app's native
 * tiles: real creative, shown in the site's own chrome rather than
 * Instagram's. Single-slide projects just render the plain hero image,
 * same as before, since a slider with one frame is only extra chrome.
 */
const pjSlide = (s, i) =>
  s.kind === 'video'
    ? `<div class="pj__slide">
         <video data-autoplay src="${esc(s.src)}" muted loop playsinline preload="metadata"></video>
         <button type="button" class="pj__slide-mute" data-pj-mute aria-pressed="true" aria-label="Unmute">${ICON_SPEAKER_MUTED}</button>
       </div>`
    : `<div class="pj__slide"><img src="${esc(s.src)}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" /></div>`;

const pjMedia = (p) => {
  const media = mediaByProject[p.slug];
  const slides =
    media && (media.images.length || media.videos.length)
      ? [...media.images.map((src) => ({ kind: 'image', src })), ...media.videos.map((src) => ({ kind: 'video', src }))]
      : [{ kind: 'image', src: p.images[0] }];

  if (slides.length === 1) {
    return `<img class="pj__hero" src="${slides[0].src}" alt="${esc(p.client)} creative" loading="eager" decoding="async" />`;
  }

  return `
    <div class="pj__slider" data-pj-slider>
      <div class="pj__slider-track" data-pj-track>${slides.map(pjSlide).join('')}</div>
      <button type="button" class="pj__slider-nav pj__slider-nav--prev" data-pj-prev aria-label="Previous">
        ${svg('<path d="M15 5l-7 7 7 7"/>', 2.4)}
      </button>
      <button type="button" class="pj__slider-nav pj__slider-nav--next" data-pj-next aria-label="Next">
        ${svg('<path d="M9 5l7 7-7 7"/>', 2.4)}
      </button>
      <div class="pj__slider-dots" data-pj-dots>
        ${slides.map((_, i) => `<span class="${i === 0 ? 'is-active' : ''}"></span>`).join('')}
      </div>
      <span class="pj__slider-count" data-pj-count>1 / ${slides.length}</span>
    </div>`;
};

/** Keeps the dot rail and the "N / total" badge in sync with manual scroll,
    not just the prev/next buttons — a swipe should update them too. */
function wireSlider(root) {
  const track = root.querySelector('[data-pj-track]');
  if (!track) return;
  const vids = [...track.querySelectorAll('video')];
  vids.forEach(capturePoster);
  const dots = [...root.querySelectorAll('[data-pj-dots] span')];
  const count = root.querySelector('[data-pj-count]');
  const total = track.children.length;
  let settleTimer = null;

  track.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const i = Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth)));
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
      if (count) count.textContent = `${i + 1} / ${total}`;
    }, 80);
  });

  /* Same idea as the Instagram feed: a slide's video only plays while it's
     the one actually scrolled into view, so swiping past it doesn't leave
     a paused-but-invisible clip and skipping straight to a later slide
     doesn't leave an earlier one still playing underneath. */
  if (vids.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.play().catch(() => {});
          else en.target.pause();
        });
      },
      { root: track, threshold: 0.6 },
    );
    vids.forEach((v) => io.observe(v));
  }
}

/** A project's own YouTube video, embedded the same inline way Safari's
    Websites section frames a live site — full-width, native player chrome. */
const pjYoutube = (id) => `
  <div class="ws__frame-wrap pj__yt">
    <iframe class="ws__frame" src="https://www.youtube.com/embed/${esc(id)}"
            loading="lazy" title="Project video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
  </div>`;

const projectPage = (p) => `
  <article class="pj">
    ${pjMedia(p)}
    <header class="pj__head">
      <h3>${esc(p.client)}</h3>
      <p class="pj__disc">${esc(p.discipline)}</p>
      <p class="pj__sum">${esc(p.summary)}</p>
    </header>
    ${p.body ? p.body.map((t) => `<p class="app__p">${esc(t)}</p>`).join('') : ''}
    ${p.youtube ? pjYoutube(p.youtube) : ''}
    <p class="pj__src">
      <a href="${p.source}" target="_blank" rel="noopener">View on beardbros.in</a>
    </p>
  </article>`;

/* -------------------------------------------------------------- notes --- */

const notes = {
  label: 'Notes',
  hue: '#e8b04b',
  art: ART_NOTES,
  title: 'Notes',

  render() {
    return `<div class="nt" data-nt><div class="nt__view" data-nt-view>${notesList()}</div></div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-nt-view]');
    view.addEventListener('click', (e) => {
      const row = e.target.closest('[data-note]');
      if (row) {
        view.innerHTML = noteDetail(agencyNotes.find((x) => x.slug === row.dataset.note));
        view.scrollTop = 0;
        return;
      }
      if (e.target.closest('[data-note-back]')) {
        view.innerHTML = notesList();
        view.scrollTop = 0;
      }
    });
  },
};

const notesList = () => `
  <p class="nt__header">${agencyNotes.length} notes</p>
  <ul class="nt__list">
    ${agencyNotes
      .map(
        (n) => `
      <li>
        <button type="button" data-note="${n.slug}">
          <span class="nt__title">${esc(n.title)}</span>
          <span class="nt__meta">${esc(n.stamp)}</span>
          <span class="nt__preview">${esc(n.body[0])}</span>
        </button>
      </li>`,
      )
      .join('')}
  </ul>`;

const noteDetail = (n) => `
  <button class="nt__back" type="button" data-note-back>
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} Notes
  </button>
  <article class="nt__note">
    <h3>${esc(n.title)}</h3>
    <p class="nt__stamp">${esc(n.stamp)}</p>
    ${n.body
      .map((t) => (t.startsWith('— ') ? `<p class="nt__item">${esc(t.slice(2))}</p>` : `<p>${esc(t)}</p>`))
      .join('')}
  </article>`;

/*
 * The long-read case-study view — moved here (still exported for Safari's
 * Reading List, since case studies live there now, not in this app).
 */
const csDetail = (c) => `
  <button class="nt__back" type="button" data-reading-back>
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} Reading List
  </button>
  <article class="nt__note cs__read" style="--accent:${c.accent}">
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
        <small>We reply within one working day.</small>
      </div>`;
  },

  mount(root) {
    const form = root.querySelector('[data-ml]');
    const sent = root.querySelector('[data-ml-sent]');
    const err = root.querySelector('[data-ml-error]');
    const send = form.querySelector('.ml__send');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const missing = [...form.querySelectorAll('[required]')].filter((f) => !f.value.trim());

      if (missing.length) {
        err.textContent = 'Add your email, a subject and a message.';
        err.hidden = false;
        missing[0].focus();
        return;
      }

      err.hidden = true;
      send.disabled = true;
      send.textContent = 'Sending…';

      const data = new FormData(form);
      data.append('_subject', 'New enquiry — beardbros.in (Mail app)');

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.hidden = true;
        sent.hidden = false;
      } catch {
        err.textContent = 'Something went wrong — please try again, or use the Contact page.';
        err.hidden = false;
      } finally {
        send.disabled = false;
        send.textContent = 'Send';
      }
    });
  },
};

/* ----------------------------------------------------------- calendar --- */

/** Real booking link, shared with the desktop widget's "Book a 30 min call"
    CTA — one source of truth rather than the URL living in two places. */
export const CALENDLY_URL = 'https://calendly.com/mally-beardbros/discovery-call';

const calendar = {
  label: 'Calendar',
  hue: '#e0603d',
  art: ART_CALENDAR(),
  glyph:
    '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  title: 'Book a call',

  /* Calendly's own inline embed is designed to be framed (unlike most
     third-party sites), so a real booking actually happens here rather
     than the old fake day/slot picker — dates, times and confirmation are
     all Calendly's live availability, not a demo. */
  render() {
    return `
      <div class="cal" data-cal>
        <div class="ws__frame-wrap cal__frame-wrap">
          <iframe class="ws__frame" src="${CALENDLY_URL}?hide_event_type_details=1&hide_gdpr_banner=1"
                  loading="lazy" title="Book a call on Calendly"></iframe>
        </div>
        <p class="cal__fallback">
          Not loading? <a href="${CALENDLY_URL}" target="_blank" rel="noopener">Open in Calendly ↗</a>
        </p>
      </div>`;
  },
};

/* ----------------------------------------------------------- settings --- */

/* Both device frames' markup live in the same index.html regardless of
   which shell is active (only the JS module differs), so a combined
   selector would always match whichever one happens to come first in
   document order — not necessarily the live one. Has to check which shell
   actually booted. */
const currentTheme = () => {
  const isDesktop = document.documentElement.classList.contains('os-desktop');
  const el = document.querySelector(isDesktop ? '[data-desktop]' : '[data-screen]');
  return el?.getAttribute('data-theme') ?? 'dark';
};

const stRow = (k, v) => `<li><span>${k}</span><em>${v}</em></li>`;
const stToggle = (id, k, on) => `
  <li>
    <span>${k}</span>
    <button class="st__switch" type="button" role="switch" data-toggle="${id}"
            aria-checked="${on}" aria-label="${k}"><i></i></button>
  </li>`;

/** Same four groups either way — desktop just puts them behind a sidebar
    (macOS System Settings' own grammar) instead of one long scroll. The
    Display group's toggle set differs slightly: wallpaper grain is a
    phone-only wallpaper effect, so desktop only offers the two toggles it
    can actually back (appearance, motion). */
const SETTINGS_SECTIONS = () => {
  const isDesktop = document.documentElement.classList.contains('os-desktop');
  return [
    {
      id: 'agency',
      label: 'Agency',
      rowsHtml: [
        stRow('Status', '<b class="st__ok">Taking work</b>'),
        stRow('Response time', 'Under 24h'),
        stRow('Markets', 'India · United States'),
        stRow('Since', '2019'),
      ].join(''),
    },
    {
      id: 'engagement',
      label: 'Engagement',
      rowsHtml: [
        stRow('Model', 'Retainer or project'),
        stRow('Minimum', '3 months'),
        stRow('Media managed', '₹5Cr+'),
        stRow('Peak ROAS', '1700%'),
      ].join(''),
    },
    {
      id: 'display',
      label: 'Display',
      rowsHtml: [
        stToggle('appearance', 'Light appearance', currentTheme() === 'light'),
        stToggle('motion', 'Reduce motion', false),
        ...(isDesktop ? [] : [stToggle('grain', 'Wallpaper grain', true)]),
      ].join(''),
      note: 'These actually work — try them, then go back to the home screen.',
    },
    {
      id: 'about',
      label: 'About',
      rowsHtml: [stRow('System', 'Beard Bros OS 1.0'), stRow('Built with', 'Vite · GSAP Flip')].join(''),
    },
  ];
};

const settingsGroup = (s) => `
  <p class="st__group">${esc(s.label)}</p>
  <ul class="st__list">${s.rowsHtml}</ul>
  ${s.note ? `<p class="st__note">${esc(s.note)}</p>` : ''}`;

const settings = {
  label: 'Settings',
  hue: '#8a8a8f',
  art: ART_SETTINGS,
  glyph:
    '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
  title: 'Settings',

  render() {
    const sections = SETTINGS_SECTIONS();

    if (document.documentElement.classList.contains('os-desktop')) {
      return `
        <div class="st2" data-st>
          <aside class="st2__sidebar">
            <ul class="st2__nav">
              ${sections
                .map(
                  (s, i) => `
                <li>
                  <button type="button" data-st-section="${s.id}" ${i === 0 ? "aria-current='true'" : ''}>
                    ${esc(s.label)}
                  </button>
                </li>`,
                )
                .join('')}
            </ul>
          </aside>
          <div class="st2__detail" data-st-detail>${settingsGroup(sections[0])}</div>
        </div>`;
    }

    return `<div class="st" data-st>${sections.map(settingsGroup).join('')}</div>`;
  },

  mount(root) {
    const sections = SETTINGS_SECTIONS();
    const detail = root.querySelector('[data-st-detail]');

    if (detail) {
      root.querySelector('.st2__sidebar').addEventListener('click', (e) => {
        const b = e.target.closest('[data-st-section]');
        if (!b) return;
        root.querySelectorAll('.st2__sidebar [data-st-section]').forEach((x) => x.removeAttribute('aria-current'));
        b.setAttribute('aria-current', 'true');
        detail.innerHTML = settingsGroup(sections.find((s) => s.id === b.dataset.stSection));
      });
    }

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

/* ---------------------------------------------------------------- radio -- */

const PLAY_ICON = svg('<path d="M8 5l11 7-11 7z" fill="currentColor"/>', 0);
const PAUSE_ICON = svg(
  '<rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/>',
  0,
);
const ICON_SKIP_NEXT = svg(
  '<path d="M18 5v14" stroke-linecap="round"/><path d="M6 6.5v11l10-5.5z" fill="currentColor" stroke="none"/>',
  1.8,
);

const ART_RADIO = art(`
  ${field('g-rd', '#2c2c2e', '#1c1c1e')}
  <path d="M30 42 L36 22 M70 42 L64 22" stroke="#d1d1d6" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <circle cx="36" cy="20" r="3.2" fill="#d1d1d6"/>
  <circle cx="64" cy="20" r="3.2" fill="#d1d1d6"/>
  <rect x="16" y="40" width="68" height="38" rx="7" fill="#fc3158"/>
  <circle cx="34" cy="59" r="10" fill="#1c1c1e"/>
  <circle cx="34" cy="59" r="4" fill="#fff" opacity=".85"/>
  <rect x="52" y="51" width="24" height="4.5" rx="2.2" fill="#1c1c1e" opacity=".85"/>
  <rect x="52" y="60" width="17" height="4.5" rx="2.2" fill="#1c1c1e" opacity=".85"/>
`);

const ICON_VOLUME = svg(
  '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 010 6"/><path d="M19 6.5a8 8 0 010 11" opacity=".55"/>',
  1.8,
);

const radio = {
  label: 'Radio',
  hue: '#fc3158',
  art: ART_RADIO,
  title: 'On Air',

  render() {
    return `
      <div class="rd" data-rd>
        <span class="rd__art" data-rd-art aria-hidden="true">${ART_RADIO}</span>
        <p class="rd__station" data-rd-station>Tuning in…</p>
        <p class="rd__tags" data-rd-tags>Finding a station</p>
        <div class="rd__transport">
          <button type="button" class="rd__btn rd__btn--play" data-rd-play aria-label="Play">${PLAY_ICON}</button>
          <button type="button" class="rd__btn" data-rd-next aria-label="Next station">${ICON_SKIP_NEXT}</button>
        </div>
        <div class="rd__volume">
          ${ICON_VOLUME}
          <input type="range" min="0" max="100" value="80" data-rd-volume aria-label="Volume" />
        </div>
        <p class="rd__note">Live internet radio — real independent rock stations, shuffled one to the next. A live broadcast can't be skipped mid-song the way a playlist can, so "next" tunes in somewhere new instead.</p>
      </div>`;
  },

  mount(root) {
    const artEl = root.querySelector('[data-rd-art]');
    const stationEl = root.querySelector('[data-rd-station]');
    const tagsEl = root.querySelector('[data-rd-tags]');
    const playBtn = root.querySelector('[data-rd-play]');
    const volume = root.querySelector('[data-rd-volume]');

    const syncUI = () => {
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

    // Reopening the app with a station already going — reflect it
    // immediately instead of coming up blank.
    syncUI();
    volume.value = String(Math.round(radioAudio.volume * 100));

    playBtn.addEventListener('click', () => radioToggle().then(syncUI));
    root.querySelector('[data-rd-next]').addEventListener('click', () => radioNext().then(syncUI));
    volume.addEventListener('input', () => setRadioVolume(volume.value / 100));

    radioAudio.addEventListener('play', syncUI);
    radioAudio.addEventListener('pause', syncUI);
    radioAudio.addEventListener('loadedmetadata', syncUI);

    return () => {
      radioAudio.removeEventListener('play', syncUI);
      radioAudio.removeEventListener('pause', syncUI);
      radioAudio.removeEventListener('loadedmetadata', syncUI);
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

/* ---------------------------------------------------------------- feed -- */

/**
 * Instagram stays a curated, on-brand feed rather than a mirror of the full
 * portfolio — everything else lives in Safari instead. This is the explicit
 * allowlist of projects that appear in the Instagram app (grid, stories rail,
 * profile highlights); every other project is still fully browsable from
 * Safari's Suggestions grid.
 */
const INSTAGRAM_SLUGS = [
  'mama-nourish',
  'total-snacc',
  'the-gaming-truck',
  'hip-hop-skincare',
  'chenab-gourmet',
  'sutlej-textiles-and-industries-limited',
  'nesterra-home-decor',
  'big-bazaar-food',
  'beardo',
  'society-tea',
  'prolicious',
  'volkano',
  'nutrizoe',
  'f5-smart-tech',
  'naturevibe-india',
  'sozo-izakaya',
];
const INSTAGRAM_PROJECTS = INSTAGRAM_SLUGS.map((slug) => projectsData.find((p) => p.slug === slug)).filter(Boolean);
const HIGHLIGHTS = INSTAGRAM_PROJECTS;

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
const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9z"/>';
const ICON_SPEAKER_MUTED = svg(`${SPEAKER}<path d="M16 9l5 6M21 9l-5 6"/>`, 1.8);
const ICON_SPEAKER_ON = svg(`${SPEAKER}<path d="M16.5 9a4 4 0 010 6"/><path d="M19 6.5a8 8 0 010 11" opacity=".55"/>`, 1.8);

const feedTile = (p) => `
  <button type="button" class="ig__tile" data-post="${p.slug}" aria-label="${esc(p.client)}">
    <img src="${p.images[0]}" alt="" loading="lazy" decoding="async" />
  </button>`;

/*
 * Real Instagram posts, embedded via Instagram's own widget rather than
 * self-hosted video — the script is loaded once and told to re-scan
 * whenever fresh blockquotes land in the DOM (it only auto-scans on its
 * own initial load).
 */
let igEmbedScript = null;
const loadIgEmbedScript = () => {
  if (window.instgrm) return Promise.resolve();
  if (igEmbedScript) return igEmbedScript;
  igEmbedScript = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.onload = resolve;
    document.body.appendChild(s);
  });
  return igEmbedScript;
};

const processIgEmbeds = () => {
  loadIgEmbedScript().then(() => window.instgrm?.Embeds?.process());
};

const embedBlock = (r) => `
  <blockquote class="instagram-media" data-instgrm-permalink="${esc(r.url)}" data-instgrm-version="14"></blockquote>`;

const storyBubble = (p) => `
  <button type="button" class="ig__story" data-post="${p.slug}">
    <span class="ig__story-ring"><img src="${p.images[0]}" alt="" loading="lazy" decoding="async" /></span>
    <span class="ig__story-label">${esc(p.client)}</span>
  </button>`;

const backRow = (to, label) => `
  <button class="nt__back" type="button" data-ig-back="${to}">
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} ${label}
  </button>`;

const profileView = () => `
  ${backRow('grid', 'Feed')}
  <div class="ig__profile">
    <div class="ig__profile-head">
      <span class="ig__avatar ig__avatar--lg">BB</span>
      <dl class="ig__stats">
        <div><dt>${INSTAGRAM_PROJECTS.length}</dt><dd>Posts</dd></div>
        <div><dt>100+</dt><dd>Clients</dd></div>
        <div><dt>2015</dt><dd>Since</dd></div>
      </dl>
    </div>
    <p class="ig__name">Beard Bros</p>
    <p class="ig__bio">Paid media, brand, web, social and content — one system, one set of numbers. Mumbai · India & US.</p>
    <p class="ig__highlights-label">Highlights</p>
    <div class="ig__grid" role="list">${HIGHLIGHTS.map(feedTile).join('')}</div>
  </div>`;

/*
 * Instagram's oEmbed widget can't be restyled — it's an iframe with its own
 * fixed chrome. Where the actual creative has been saved locally (see
 * portfolio-media.js), that renders as plain tiles instead: same grid the
 * rest of the app already uses, no Instagram-branded card breaking the
 * illusion. The live embed is only a fallback for projects with a real
 * permalink but no local copy yet.
 */
const nativeTile = (kind, src) =>
  kind === 'video'
    ? `<div class="ig__native-tile"><video src="${esc(src)}" controls preload="metadata" playsinline></video></div>`
    : `<div class="ig__native-tile"><img src="${esc(src)}" alt="" loading="lazy" decoding="async" /></div>`;

const projectReels = (slug) => {
  const media = mediaByProject[slug];
  if (media && (media.images.length || media.videos.length)) {
    return `
      <p class="ig__highlights-label">From the shoot</p>
      <div class="ig__native-grid" role="list">
        ${media.images.map((s) => nativeTile('image', s)).join('')}
        ${media.videos.map((s) => nativeTile('video', s)).join('')}
      </div>`;
  }

  const clips = reelsByProject[slug];
  if (clips?.length) {
    return `
      <p class="ig__highlights-label">On Instagram</p>
      <div class="ig__embeds" data-ig-embeds>${clips.map(embedBlock).join('')}</div>`;
  }

  return '';
};

/*
 * Tapping a highlight bubble opens *that project's* own shoot as a vertical
 * stream — sized to whatever the media's own aspect ratio is (no forced
 * square crop the way a grid tile gets one), video included, the way
 * Instagram's own home timeline scrolls. The default feed underneath stays
 * the familiar grid; this is scoped, not global.
 */
const projectPosts = (p) => {
  const media = mediaByProject[p.slug];
  if (!media) return [];
  return [
    ...media.images.map((src, i) => ({ p, kind: 'image', src, key: `${p.slug}-img${i}` })),
    ...media.videos.map((src, i) => ({ p, kind: 'video', src, key: `${p.slug}-vid${i}` })),
  ];
};

const hFeedMedia = (kind, src) =>
  kind === 'video'
    ? `<div class="ig__post-media ig__post-media--natural">
         <video class="ig__hpost-vid" data-autoplay data-ig-dbl src="${esc(src)}" muted loop playsinline preload="metadata"></video>
         <button type="button" class="ig__hpost-mute" data-hpost-mute aria-pressed="true" aria-label="Unmute">${ICON_SPEAKER_MUTED}</button>
         <span class="ig__heart-burst" data-ig-burst aria-hidden="true">${ICON_HEART}</span>
       </div>`
    : `<div class="ig__post-media ig__post-media--natural">
         <img class="ig__hpost-img" data-ig-dbl src="${esc(src)}" alt="" loading="lazy" decoding="async" />
         <span class="ig__heart-burst" data-ig-burst aria-hidden="true">${ICON_HEART}</span>
       </div>`;

const homePostCard = ({ p, kind, src, key }) => `
  <article class="ig__post" data-hpost="${p.slug}">
    <div class="ig__post-topbar">
      <button type="button" class="ig__post-head" data-ig-avatar>
        <span class="ig__avatar">BB</span>
        <span class="ig__post-meta"><b>beardbros</b><em>${esc(p.discipline)}</em></span>
      </button>
      <span class="ig__post-menu" aria-hidden="true">${ICON_MENU}</span>
    </div>
    ${hFeedMedia(kind, src)}
    <div class="ig__actions">
      <button type="button" class="ig__like" data-ig-like="${key}" aria-pressed="false" aria-label="Like">
        ${ICON_HEART_OUTLINE}
      </button>
      <span class="ig__action-icon" aria-hidden="true">${ICON_COMMENT}</span>
      <span class="ig__action-icon" aria-hidden="true">${ICON_SHARE}</span>
      <span class="ig__action-icon ig__action-icon--end" aria-hidden="true">${ICON_BOOKMARK}</span>
    </div>
    <p class="ig__likes">Liked by <b>beardbros</b> and <span data-ig-count>${hashLikes(key)}</span> others</p>
    <button type="button" class="ig__comments-link" data-hpost-open="${p.slug}">View all ${hashComments(key)} comments</button>
    <p class="ig__timestamp">${hashAgo(key)}</p>
  </article>`;

const projectFeedView = (p) => `
  ${backRow('grid', 'Feed')}
  <p class="ig__highlights-label">${esc(p.client)}</p>
  <div class="ig__home" data-ig-home>${projectPosts(p).map(homePostCard).join('')}</div>`;

/*
 * The default view — every project's own upload(s), one full post below the
 * other, the way a real Instagram home feed scrolls rather than a grid of
 * thumbnails. A project with local media (portfolio-media.js) unrolls into
 * one post per asset, video included; everything else falls back to its
 * single hero image.
 */
const buildFeedPosts = () => {
  const posts = [];
  INSTAGRAM_PROJECTS.forEach((p) => {
    const media = mediaByProject[p.slug];
    if (media && (media.images.length || media.videos.length)) posts.push(...projectPosts(p));
    else posts.push({ p, kind: 'image', src: p.images[0], key: `${p.slug}-hero` });
  });
  return posts;
};

const FEED_POSTS = buildFeedPosts();

const homeFeed = () => `
  <div class="ig__stories" role="list">${HIGHLIGHTS.map(storyBubble).join('')}</div>
  <div class="ig__home" data-ig-home>${FEED_POSTS.map(homePostCard).join('')}</div>`;

const postView = (p, to, label) => `
  ${backRow(to, label)}
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
    ${p.body ? p.body.map((t) => `<p class="app__p">${esc(t)}</p>`).join('') : ''}
    <p class="ig__comments-link">View all ${hashComments(p.slug)} comments</p>
    <p class="ig__timestamp">${hashAgo(p.slug)}</p>
    <p class="pj__src"><a href="${p.source}" target="_blank" rel="noopener">View on beardbros.in</a></p>
    ${projectReels(p.slug)}
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
        <div data-ig-view>${homeFeed()}</div>
      </div>`;
  },

  mount(root) {
    const view = root.querySelector('[data-ig-view]');
    const liked = new Set();
    /* Where "back" goes: 'grid' (default), 'profile', or 'project' (a
       highlight's own scoped feed, tracked via originSlug since more than
       one project can be the "current" one across a session). */
    let origin = 'grid';
    let originSlug = null;

    /* Videos only autoplay once scrolled into view — same idea as a real
       feed, and it means a hundred-odd posts don't all fight for decode
       bandwidth at once. The same observer also lazily grabs every video's
       poster frame the first time it scrolls into view (rather than all at
       once on paint — the unrolled home feed alone can hold 60-odd clips)
       and, for the "from the shoot" grid videos a viewer pressed play on
       manually, pauses them once they scroll back out. Rebuilt after every
       repaint since paint() replaces the DOM the previous observer was
       watching.
       Threshold is fraction of the *video's own* area, not the viewport's —
       a portrait clip taller than the window can never clear something like
       0.6, so this stays low enough that "mostly on screen" is enough to
       start it, the same bar a real feed uses. */
    let io = null;
    const wireAutoplay = () => {
      io?.disconnect();
      const vids = [...view.querySelectorAll('video')];
      if (!vids.length) return;
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            const v = en.target;
            const auto = v.dataset.autoplay !== undefined;
            if (en.isIntersecting) {
              capturePoster(v);
              if (auto) v.play().catch(() => {});
            } else if (auto || !v.paused) {
              v.pause();
            }
          });
        },
        { root, threshold: 0.2 },
      );
      vids.forEach((v) => io.observe(v));
    };

    const paint = (html) => {
      view.innerHTML = html;
      root.scrollTop = 0;
      wireAutoplay();
    };

    const showHome = () => {
      origin = 'grid';
      paint(homeFeed());
    };

    const showProfile = () => {
      origin = 'profile';
      paint(profileView());
    };

    const showProjectFeed = (slug) => {
      const p = projectsData.find((x) => x.slug === slug);
      if (!p) return;
      origin = 'project';
      originSlug = slug;
      paint(projectFeedView(p));
    };

    const backTarget = () => {
      if (origin === 'profile') return ['profile', 'Profile'];
      if (origin === 'project') {
        const proj = projectsData.find((x) => x.slug === originSlug);
        return [`project:${originSlug}`, proj ? proj.client : 'Feed'];
      }
      return ['grid', 'Feed'];
    };

    const showPost = (slug) => {
      const p = projectsData.find((x) => x.slug === slug);
      if (!p) return;
      const [to, label] = backTarget();
      paint(postView(p, to, label));
      const media = mediaByProject[slug];
      const usedLocalMedia = media && (media.images.length || media.videos.length);
      if (!usedLocalMedia && reelsByProject[slug]?.length) processIgEmbeds();
    };

    const setLiked = (likeBtn, on) => {
      const key = likeBtn.dataset.igLike;
      liked[on ? 'add' : 'delete'](key);
      likeBtn.setAttribute('aria-pressed', String(on));
      likeBtn.innerHTML = on ? ICON_HEART : ICON_HEART_OUTLINE;
      likeBtn.closest('.ig__post').querySelector('[data-ig-count]').textContent =
        String(hashLikes(key) + (on ? 1 : 0));
    };

    root.addEventListener('click', (e) => {
      const mute = e.target.closest('[data-hpost-mute]');
      if (mute) {
        const vid = mute.closest('.ig__post-media')?.querySelector('video');
        if (vid) {
          vid.muted = !vid.muted;
          mute.setAttribute('aria-pressed', String(vid.muted));
          mute.innerHTML = vid.muted ? ICON_SPEAKER_MUTED : ICON_SPEAKER_ON;
        }
        return;
      }

      const like = e.target.closest('[data-ig-like]');
      if (like) {
        setLiked(like, !liked.has(like.dataset.igLike));
        return;
      }

      if (e.target.closest('[data-ig-avatar]')) {
        showProfile();
        return;
      }

      const open = e.target.closest('[data-hpost-open]');
      if (open) {
        showPost(open.dataset.hpostOpen);
        return;
      }

      /* A highlight bubble opens that project's own shoot as a scoped
         feed when there's local media for it; otherwise it's the same
         case-study post any other tile opens. Checked before the generic
         [data-post] tile handler below, since a story bubble matches that
         selector too. */
      const story = e.target.closest('.ig__story');
      if (story) {
        const slug = story.dataset.post;
        const media = mediaByProject[slug];
        if (media && (media.images.length || media.videos.length)) showProjectFeed(slug);
        else showPost(slug);
        return;
      }

      const tile = e.target.closest('[data-post]');
      if (tile) {
        showPost(tile.dataset.post);
        return;
      }

      const back = e.target.closest('[data-ig-back]');
      if (back) {
        const to = back.dataset.igBack;
        if (to === 'profile') showProfile();
        else if (to.startsWith('project:')) showProjectFeed(to.slice('project:'.length));
        else showHome();
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

    /* render() already painted the initial home feed's markup directly, so
       without this the observer set up above only ever gets attached by a
       later paint() call — meaning nothing in the feed loads a poster frame
       or autoplays until the user navigates away and back once. */
    wireAutoplay();

    return () => io?.disconnect();
  },
};

export const APPS = { safari, notes, files, journal: journalApp, mail, calendar, radio, clock, weather, settings, feed };
export const SYSTEM_ORDER = ['safari', 'notes', 'feed', 'files', 'journal', 'mail', 'calendar', 'radio', 'clock', 'weather', 'settings'];
export const DOCK_ORDER = ['safari', 'mail', 'settings'];
export { svg, art, field, esc, ART_RADIO, PLAY_ICON, PAUSE_ICON, ICON_SKIP_NEXT };
export { radioAudio, radioToggle, radioNext, setRadioVolume, nowPlayingStation, loadStationArt } from './radio.js';
