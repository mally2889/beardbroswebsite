import { services } from '../data/services.js';
import { projectsData } from '../data/projects-full.js';
import { art, field } from './apps.js';

/**
 * Terminal — a real (tiny) command interpreter, not a screenshot of one.
 * The commands surface the same content Finder browses, just typed instead
 * of clicked — an easter egg for anyone curious enough to try it.
 */

const ART_TERMINAL = art(`
  ${field('g-tm', '#3a3a3c', '#141414')}
  <path d="M28 40l16 12-16 12" fill="none" stroke="#6ee07a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="50" y1="64" x2="72" y2="64" stroke="#6ee07a" stroke-width="6" stroke-linecap="round"/>`);

const PROMPT = 'guest@beardbros';

const FILES = {
  'about.txt':
    'Two brothers, one system. Paid media, brand, web, social and content that share a strategy and a single set of numbers. Mumbai, working across India and the US, since 2015.',
  'contact.txt': 'hello@beardbros.in — under 24h response.',
};

const HELP = [
  'Commands:',
  '  help            this list',
  '  whoami          who you are, apparently',
  '  ls              list files',
  '  cat <file>      print a file',
  '  services        what we do',
  '  work            recent projects',
  '  contact         how to reach us',
  '  clear           clear the screen',
].join('\n');

function run(cmd, term) {
  const [name, ...args] = cmd.trim().split(/\s+/);
  switch (name) {
    case '':
      return '';
    case 'help':
      return HELP;
    case 'whoami':
      return 'guest — probably a client, possibly just curious. Either way, hi.';
    case 'ls':
      return Object.keys(FILES).join('  ');
    case 'cat':
      return FILES[args[0]] ?? `cat: ${args[0] ?? ''}: No such file`;
    case 'services':
      return services.map((s) => `${s.name} — ${s.blurb}`).join('\n');
    case 'work':
      return projectsData
        .slice(0, 8)
        .map((p) => `${p.client} — ${p.summary}`)
        .join('\n');
    case 'contact':
      return FILES['contact.txt'];
    case 'clear':
      term.clear();
      return null;
    default:
      return `command not found: ${name} — try 'help'`;
  }
}

export const terminal = {
  label: 'Terminal',
  hue: '#3a3a3c',
  art: ART_TERMINAL,
  title: 'terminal — bash',

  render() {
    return `
      <div class="tm" data-tm>
        <div class="tm__scroll" data-tm-scroll>
          <p class="tm__line">Beard Bros OS [Version 1.0]</p>
          <p class="tm__line">Type 'help' to see what's here.</p>
        </div>
        <div class="tm__row">
          <span class="tm__prompt">${PROMPT}%</span>
          <input class="tm__input" data-tm-input type="text" autocomplete="off" spellcheck="false" aria-label="Terminal input" />
        </div>
      </div>`;
  },

  mount(root) {
    const scroll = root.querySelector('[data-tm-scroll]');
    const input = root.querySelector('[data-tm-input]');

    const print = (text, cls = '') => {
      const p = document.createElement('p');
      p.className = `tm__line ${cls}`.trim();
      p.textContent = text;
      scroll.appendChild(p);
      scroll.scrollTop = scroll.scrollHeight;
    };

    const api = { clear: () => (scroll.innerHTML = '') };

    const focusInput = () => input.focus();
    root.addEventListener('click', focusInput);
    focusInput();

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const cmd = input.value;
      print(`${PROMPT}% ${cmd}`, 'tm__line--echo');
      input.value = '';
      const out = run(cmd, api);
      if (out) print(out);
    });

    return () => root.removeEventListener('click', focusInput);
  },
};
