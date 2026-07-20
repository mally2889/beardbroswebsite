import './styles/main.css';
import { initScroll } from './modules/scroll.js';
import { runPreloader } from './modules/preloader.js';
import { initCursor } from './modules/cursor.js';
import { initNav } from './modules/nav.js';
import { initMagnetic } from './modules/magnetic.js';
import { initServices } from './modules/services.js';
import { initWorkGallery } from './modules/work-gallery.js';
import { initTransitions } from './modules/transitions.js';
import {
  heroIntro,
  initManifesto,
  initStats,
  initQuotes,
  initMarquees,
  initReveals,
  initContactForm,
  setFooterYear,
} from './modules/sections.js';

const lenis = initScroll();
const transitions = initTransitions();

// Three.js loads as an async chunk while the preloader runs
const glReady = import('./modules/hero-gl.js')
  .then((m) => m.initHeroGL())
  .catch(() => null);

initNav(lenis, transitions);
initServices();
initWorkGallery((href) => transitions.leave(href));
initManifesto();
initStats();
initQuotes();
initMarquees(lenis);
initReveals();
initContactForm();
initMagnetic();
setFooterYear();

const rebindCursor = initCursor();
rebindCursor?.();

runPreloader().then(() => glReady.then((gl) => heroIntro(gl)));
