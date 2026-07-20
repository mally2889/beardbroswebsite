import { services } from '../data/services.js';
import { projectsData } from '../data/projects-full.js';
import { caseStudies } from '../data/case-studies.js';
import { journal } from '../data/journal.js';
import { svg, art, field, esc } from './apps.js';

/**
 * Finder — a file browser over the same content the phone shell's Safari,
 * Notes and Journal apps already show, just re-shaped as folders and files.
 * Detail views reuse the phone shell's own CSS classes (.pj, .cs__, .jr__)
 * rather than inventing a second visual language for the same content.
 */

const ART_FINDER = art(`
  ${field('g-fd2', '#6dc3fb', '#1f7fe0')}
  <path d="M20 34h24l6 7h30v10H20z" fill="#eaf6ff"/>
  <path d="M20 41h60v26a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5z" fill="#fff"/>
  <circle cx="63" cy="63" r="11" fill="none" stroke="#1f7fe0" stroke-width="4"/>
  <line x1="71" y1="71" x2="79" y2="79" stroke="#1f7fe0" stroke-width="4" stroke-linecap="round"/>`);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

const fileIcon = (hue) => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 2h8l5 5v15H6z" fill="#fff" opacity=".92"/>
    <path d="M14 2l5 5h-5z" fill="${hue}"/>
    <g stroke="${hue}" stroke-width="1.3" stroke-linecap="round">
      <line x1="9" y1="12" x2="16" y2="12"/><line x1="9" y1="15" x2="16" y2="15"/>
      <line x1="9" y1="18" x2="13" y2="18"/>
    </g>
  </svg>`;

const SECTIONS = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    hue: '#5fc0f5',
    items: projectsData.map((p) => ({ id: p.slug, name: p.client, kind: 'project', data: p })),
  },
  {
    id: 'services',
    label: 'Services',
    hue: '#e8b04b',
    items: services.map((s) => ({ id: s.slug, name: s.name, kind: 'service', data: s })),
  },
  {
    id: 'case-studies',
    label: 'Case Studies',
    hue: '#e0603d',
    items: caseStudies.map((c) => ({ id: c.slug, name: c.client, kind: 'case', data: c })),
  },
  {
    id: 'journal',
    label: 'Journal',
    hue: '#7a68e0',
    items: journal.map((j) => ({ id: j.slug, name: j.title, kind: 'journal', data: j })),
  },
];

const backRow = () => `
  <button class="nt__back" type="button" data-fd-back>
    ${svg('<path d="M15 5l-7 7 7 7"/>', 2)} Back
  </button>`;

const projectDetail = (p) => `
  ${backRow()}
  <article class="pj">
    <img class="pj__hero" src="${p.images[0]}" alt="${esc(p.client)} creative" loading="eager" decoding="async" />
    <header class="pj__head">
      <h3>${esc(p.client)}</h3>
      <p class="pj__disc">${esc(p.discipline)}</p>
      <p class="pj__sum">${esc(p.summary)}</p>
    </header>
    ${p.body ? p.body.map((t) => `<p class="app__p">${esc(t)}</p>`).join('') : ''}
    <p class="pj__src"><a href="${p.source}" target="_blank" rel="noopener">View on beardbros.in</a></p>
  </article>`;

const serviceDetail = (s) => `
  ${backRow()}
  <article class="pj">
    <header class="pj__head">
      <h3>${esc(s.name)}</h3>
      <p class="pj__disc">Service</p>
      <p class="pj__sum">${esc(s.blurb)}</p>
    </header>
    ${(s.long ?? []).map((t) => `<p class="app__p">${esc(t)}</p>`).join('')}
    <p class="app__heading">What you get</p>
    <ul class="app__list">${(s.deliverables ?? []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
  </article>`;

const caseDetail = (c) => `
  ${backRow()}
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
          `<h4 class="cs__h">${esc(sec.heading)}</h4>` + sec.paras.map((t) => `<p>${esc(t)}</p>`).join(''),
      )
      .join('')}
  </article>`;

const journalDetail = (j) => `
  ${backRow()}
  <article class="jr__post">
    <span class="jr__tag">${esc(j.tag)}</span>
    <h3>${esc(j.title)}</h3>
    <p class="jr__dek jr__dek--lead">${esc(j.dek)}</p>
    <p class="nt__stamp">${fmtDate(j.date)} · ${esc(j.read)} read</p>
    ${j.body.map((t) => `<p>${esc(t)}</p>`).join('')}
  </article>`;

const DETAIL = { project: projectDetail, service: serviceDetail, case: caseDetail, journal: journalDetail };

const sidebar = () => `
  <p class="fd__group">Favorites</p>
  <ul class="fd__side">
    ${SECTIONS.map(
      (s, i) => `
      <li>
        <button type="button" data-section="${s.id}" ${i === 0 ? "aria-current='true'" : ''}>
          ${esc(s.label)}<span>${s.items.length}</span>
        </button>
      </li>`,
    ).join('')}
  </ul>`;

const grid = (section) => `
  <p class="fd__crumb">Beard Bros / ${esc(section.label)}</p>
  <div class="fd__grid" role="list">
    ${section.items
      .map(
        (item) => `
      <button type="button" class="fd__file" data-item="${item.id}" data-section="${section.id}">
        <span class="fd__file-ico">${fileIcon(section.hue)}</span>
        <span class="fd__file-name">${esc(item.name)}</span>
      </button>`,
      )
      .join('')}
  </div>`;

export const finder = {
  label: 'Finder',
  hue: '#1f7fe0',
  art: ART_FINDER,
  title: 'Finder',

  render() {
    return `
      <div class="fd" data-fd>
        <aside class="fd__sidebar">${sidebar()}</aside>
        <div class="fd__main" data-fd-main>${grid(SECTIONS[0])}</div>
      </div>`;
  },

  mount(root) {
    const main = root.querySelector('[data-fd-main]');
    let currentSection = SECTIONS[0];

    const showGrid = (section) => {
      currentSection = section;
      main.innerHTML = grid(section);
      main.scrollTop = 0;
    };

    const showDetail = (section, id) => {
      const item = section.items.find((x) => x.id === id);
      if (!item) return;
      main.innerHTML = DETAIL[item.kind](item.data);
      main.scrollTop = 0;
    };

    root.querySelector('.fd__sidebar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-section]');
      if (!b) return;
      root.querySelectorAll('.fd__sidebar [data-section]').forEach((x) => x.removeAttribute('aria-current'));
      b.setAttribute('aria-current', 'true');
      showGrid(SECTIONS.find((s) => s.id === b.dataset.section));
    });

    main.addEventListener('click', (e) => {
      if (e.target.closest('[data-fd-back]')) {
        showGrid(currentSection);
        return;
      }
      const file = e.target.closest('[data-item]');
      if (file) showDetail(SECTIONS.find((s) => s.id === file.dataset.section), file.dataset.item);
    });
  },
};
