// Tells whether the overlay that is opening right now was opened by a user activation (a click, or Enter and Space on a control, which browsers turn into a click).
// A docked sheet opened programmatically (a selection changes, a route loads) must keep the page focus. One opened by a click takes focus, because the user asked for it.
// A single capture listener on the document stores the time of the last click. It is installed when this module loads in a browser.
const WINDOW_MS = 1000;
let lastActivation = Number.NEGATIVE_INFINITY;
// UI Events `detail` of that click: 0 for a keyboard activation (Enter, Space), 1 or more for a pointer click.
let lastDetail = 0;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'click',
    (event) => {
      // Only a click on the page itself counts, not a synthetic click without a target.
      if (event.target instanceof Element) {
        lastActivation = performance.now();
        lastDetail = event.detail;
      }
    },
    true,
  );
}

export const openedByActivation = (): boolean => performance.now() - lastActivation <= WINDOW_MS;

// True when the overlay opening right now was opened by a pointer click (not by Enter or Space, and not programmatically).
export const openedByPointer = (): boolean => openedByActivation() && lastDetail > 0;

// Test hook: forgets the last activation.
export const resetOpenedByActivation = () => {
  lastActivation = Number.NEGATIVE_INFINITY;
  lastDetail = 0;
};
