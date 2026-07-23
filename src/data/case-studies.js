/**
 * Case studies, rewritten as long reads — read in Safari's Reading List.
 *
 * Data lives in case-studies.json (CMS-editable via /admin, under the
 * "caseStudies" key) — this file just unwraps it under the name the rest
 * of the app already imports.
 */
import data from './case-studies.json';

export const caseStudies = data.caseStudies;
