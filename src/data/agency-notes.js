/**
 * The Notes app's content — agency information written as a small stack of
 * notes rather than a marketing page.
 *
 * Data lives in agency-notes.json (CMS-editable via /admin, under the
 * "agencyNotes" key) — this file just unwraps it under the name the rest
 * of the app already imports.
 */
import data from './agency-notes.json';

export const agencyNotes = data.agencyNotes;
