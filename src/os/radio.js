/**
 * Beard Bros OS radio — real rock stations via Radio Browser
 * (api.radio-browser.info), a free, open, community-run directory of public
 * internet radio streams. No API key, explicit CORS support, built
 * specifically for third-party player apps like this one.
 *
 * This deliberately doesn't rebrand a real station as if it were an
 * in-house Beard Bros broadcast — that would misattribute someone else's
 * copyrighted broadcast (their music, their station idents, their DJs)
 * under a different name. Instead the UI always shows the real station's
 * own name and artwork; "shuffle" here means switching to a different real
 * station from the list, since you can't skip a track inside a live
 * broadcast the way you can a playlist.
 *
 * Module-level, not inside any app's mount() — playback survives whichever
 * window (or widget) last touched it closing, same reasoning as the old
 * Music app's shared Audio element.
 */

const API_SERVERS = ['de1.api.radio-browser.info', 'nl1.api.radio-browser.info', 'at1.api.radio-browser.info'];

export const radioAudio = new Audio();
radioAudio.preload = 'none';

let stations = [];
let order = [];
let orderPos = -1;
let ready = false;
let loading = null;
let retries = 0;

function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Tries each regional mirror in turn — the directory is a federation of
    community-run servers, any one of which can be briefly unreachable. */
async function loadStations() {
  if (loading) return loading;
  loading = (async () => {
    for (const server of API_SERVERS) {
      try {
        const res = await fetch(
          `https://${server}/json/stations/bytag/rock?limit=60&hidebroken=true&order=votes&reverse=true`,
        );
        if (!res.ok) continue;
        const data = await res.json();
        // https only — an http:// stream on this https site gets silently
        // dropped as mixed content, which just looks like a dead station.
        const good = data.filter((s) => s.url_resolved?.startsWith('https://'));
        if (good.length) {
          stations = good.slice(0, 20);
          order = shuffledIndices(stations.length);
          ready = true;
          return true;
        }
      } catch {
        /* try the next mirror */
      }
    }
    return false;
  })();
  return loading;
}

async function playCurrent() {
  if (orderPos < 0 || orderPos >= order.length) return;
  radioAudio.src = stations[order[orderPos]].url_resolved;
  try {
    await radioAudio.play();
    retries = 0;
  } catch {
    /* blocked until a user gesture reaches armFirstGestureAutoplay() */
  }
}

/** Switches to another real station — the closest honest equivalent to
    "random songs" a live broadcast can offer. */
export async function radioNext() {
  if (!ready) {
    const ok = await loadStations();
    if (!ok) return;
  }
  orderPos = (orderPos + 1) % order.length;
  await playCurrent();
}

export async function radioToggle() {
  if (!ready) {
    const ok = await loadStations();
    if (!ok) return;
  }
  if (orderPos < 0) {
    orderPos = 0;
    await playCurrent();
    return;
  }
  if (radioAudio.paused) radioAudio.play().catch(() => {});
  else radioAudio.pause();
}

export function setRadioVolume(v) {
  radioAudio.volume = Math.max(0, Math.min(1, v));
}

export function toggleRadioMute() {
  radioAudio.muted = !radioAudio.muted;
  return radioAudio.muted;
}

/** Loads a station's logo off-DOM before swapping it in, so a broken
    favicon URL never flashes a broken-image glyph — callers get null back
    and render their own fallback art instead. */
export function loadStationArt(faviconUrl) {
  return new Promise((resolve) => {
    if (!faviconUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('load', () => resolve(img), { once: true });
    img.addEventListener('error', () => resolve(null), { once: true });
    img.src = faviconUrl;
  });
}

/** Read-only snapshot for anything that wants to reflect playback state —
    the desktop widget, the Radio app window, Control Center — without
    duplicating the streaming logic. */
export function nowPlayingStation() {
  if (orderPos < 0 || !stations.length) return null;
  const s = stations[order[orderPos]];
  return { name: s.name, favicon: s.favicon || '', tags: s.tags || '', paused: radioAudio.paused };
}

/* A dead stream (station offline, geo-blocked, whatever) fires 'error' —
   move on rather than sitting on silence. Capped so a genuinely broken
   connection doesn't spin through the whole list in a tight loop. */
radioAudio.addEventListener('error', () => {
  if (orderPos < 0) return;
  retries += 1;
  if (retries < 5) radioNext();
});

/*
 * Browsers block audio autoplay without a user gesture — so "plays by
 * default" is wired to the *first* interaction anywhere in the OS (a
 * click, a tap, a keypress), not the page load itself. Call once per
 * shell; it's a no-op on later calls.
 */
let armed = false;
export function armFirstGestureAutoplay() {
  if (armed) return;
  armed = true;
  const start = () => {
    document.removeEventListener('pointerdown', start);
    document.removeEventListener('keydown', start);
    if (orderPos < 0) radioNext();
  };
  document.addEventListener('pointerdown', start, { once: true });
  document.addEventListener('keydown', start, { once: true });
}

/*
 * A phone doesn't let a background station keep playing over a video you
 * just tapped, or once you've switched away to another app entirely — it
 * ducks out and gets out of the way. Two independent reasons can each want
 * the radio paused at once (a video playing *and* the tab being hidden), so
 * both are tracked in a set rather than a single flag — the radio only
 * resumes once every reason has cleared, and only if it was actually us
 * that paused it (never overrides a listener who paused it themselves).
 *
 * Video detection is delegated on `document` in the capture phase (native
 * 'play'/'pause'/'ended' don't bubble, but capture still reaches every
 * descendant on the way down), so this covers any app's video — Instagram's
 * feed, Safari's project slider — without each one wiring it up itself.
 * Tab/app-switch detection uses both the Page Visibility API (covers
 * switching tabs or minimizing) and window blur/focus (covers alt-tabbing
 * to another native app while this tab stays visible) — either can fire
 * alone depending on OS and browser.
 */
let duckingArmed = false;
export function armVideoDucking() {
  if (duckingArmed) return;
  duckingArmed = true;

  const duckReasons = new Set();
  let duckedByUs = false;

  const duck = (reason) => {
    duckReasons.add(reason);
    if (!radioAudio.paused) {
      duckedByUs = true;
      radioAudio.pause();
    }
  };
  const release = (reason) => {
    duckReasons.delete(reason);
    if (duckReasons.size === 0 && duckedByUs) {
      duckedByUs = false;
      radioAudio.play().catch(() => {});
    }
  };

  /* A video only actually clashes with the radio once it's both playing
     AND unmuted — either half can flip on its own (the feed's autoplaying
     previews start muted then get unmuted via their own mute button, with
     no new 'play' event; a paused clip can have its mute toggled while
     stopped), so "loud" is recomputed from live state on every relevant
     event rather than inferred from 'play' alone. Tracked in a set so two
     clips going loud at once, or one ending while another is still loud,
     doesn't release the duck early. */
  const loudVideos = new Set();
  const sync = (el) => {
    if (el?.tagName !== 'VIDEO') return;
    const isLoudNow = !el.paused && !el.ended && !el.muted;
    const wasLoud = loudVideos.has(el);
    if (isLoudNow && !wasLoud) {
      loudVideos.add(el);
      if (loudVideos.size === 1) duck('video');
    } else if (!isLoudNow && wasLoud) {
      loudVideos.delete(el);
      if (loudVideos.size === 0) release('video');
    }
  };
  ['play', 'pause', 'ended', 'volumechange'].forEach((type) =>
    document.addEventListener(type, (e) => sync(e.target), true),
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) duck('hidden');
    else release('hidden');
  });
  window.addEventListener('blur', () => duck('hidden'));
  window.addEventListener('focus', () => release('hidden'));
}
