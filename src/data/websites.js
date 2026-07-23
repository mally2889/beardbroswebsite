/**
 * Live client websites, embedded in Safari via iframe. CMS-editable via
 * /admin, under the "websites" key — this file just unwraps it under the
 * name the rest of the app already imports.
 */
import data from './websites.json';

export const websites = data.websites;
