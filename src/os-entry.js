/**
 * Loads exactly one shell — the class was already set synchronously in
 * phone-os.html's inline <head> script, before this module even starts
 * fetching, so there's no re-check here to drift out of sync with.
 */
if (document.documentElement.classList.contains('os-desktop')) {
  import('./desktop-os.js');
} else {
  import('./phone-os.js');
}
