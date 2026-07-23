/**
 * Client testimonials, in their own words — shown as quotes in Safari.
 *
 * Data lives in testimonials.json (CMS-editable via /admin, under the
 * "testimonials" key) — this file just unwraps it under the name the rest
 * of the app already imports.
 */
import data from './testimonials.json';

export const testimonials = data.testimonials;
