import './styles/main.css';
import { initScroll } from './modules/scroll.js';
import { initCursor } from './modules/cursor.js';
import { initNav } from './modules/nav.js';
import { initMagnetic } from './modules/magnetic.js';
import { initTransitions } from './modules/transitions.js';
import { initBentoTilt } from './modules/bento.js';
import {
  initStats,
  initReveals,
  initRevealBlocks,
  initScrambleEyebrow,
  setFooterYear,
} from './modules/sections.js';

const lenis = initScroll();
const transitions = initTransitions();

initNav(lenis, transitions);
initMagnetic();
initCursor();
setFooterYear();
initStats();
initReveals();
initRevealBlocks();
initBentoTilt();
initScrambleEyebrow();

transitions.enter();

// smaller, warm-tinted shader field behind the page hero (reuses the
// homepage's shader factory instead of duplicating GLSL)
import('./modules/hero-gl.js').then(({ createShaderField }) => {
  createShaderField(document.querySelector('[data-shader-field]'), {
    copper: '#c97b3c',
    amber: '#e8b04b',
    mouseReactive: false,
  })?.reveal(1.6);
});
