/**
 * Journal — original editorial, written for Beard Bros' verticals.
 *
 * Data lives in journal.json (CMS-editable via /admin, under the "journal"
 * key) — this file just unwraps it under the name the rest of the app
 * already imports.
 */
import data from './journal.json';

export const journal = data.journal;
