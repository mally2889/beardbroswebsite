/**
 * Portfolio projects from beardbros.in/portfolio.
 *
 * Data lives in projects-full.json (CMS-editable via /admin, under the
 * "projects" key) — this file just unwraps it under the name the rest of
 * the app already imports.
 */
import data from './projects-full.json';

export const projectsData = data.projects;
