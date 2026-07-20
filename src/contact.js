import './styles/main.css';
import { initScroll } from './modules/scroll.js';
import { initCursor } from './modules/cursor.js';
import { initNav } from './modules/nav.js';
import { initMagnetic } from './modules/magnetic.js';
import { initTransitions } from './modules/transitions.js';
import {
  initReveals,
  initRevealBlocks,
  initScrambleEyebrow,
  initContactForm,
  setFooterYear,
} from './modules/sections.js';

const lenis = initScroll();
const transitions = initTransitions();

initNav(lenis, transitions);
initMagnetic();
initCursor();
setFooterYear();
initContactForm();
initReveals();
initRevealBlocks();
initScrambleEyebrow('[data-scramble-eyebrow]');

transitions.enter();
