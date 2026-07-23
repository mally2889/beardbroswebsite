/**
 * Idle-triggered sleep screen — shared between both shells. A real device
 * doesn't stay lit forever; after a stretch of no input it shows a lock-
 * screen-style clock instead of just sitting there mid-interaction, which
 * is the detail that sells "this is a UI, not a webpage" the most.
 *
 * The first tap/click/key after sleeping only wakes it — it's consumed,
 * never passed through to whatever's underneath, so waking up never also
 * fires a click on a dock icon or a widget.
 */
export function armIdleSleep({ overlayEl, timeEl, dateEl, timeoutMs = 60_000 }) {
  let lastActivity = Date.now();
  const bump = () => {
    lastActivity = Date.now();
  };
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach((evt) =>
    document.addEventListener(evt, bump, { passive: true }),
  );

  const paintClock = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  };

  let asleep = false;

  const wake = () => {
    asleep = false;
    overlayEl.classList.remove('is-open');
    lastActivity = Date.now();
  };

  const sleep = () => {
    if (asleep) return;
    asleep = true;
    paintClock();
    overlayEl.classList.add('is-open');
  };

  overlayEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    wake();
  });

  setInterval(() => {
    if (asleep) {
      paintClock();
      return;
    }
    if (Date.now() - lastActivity > timeoutMs) sleep();
  }, 1000);

  return { wake, sleep };
}
