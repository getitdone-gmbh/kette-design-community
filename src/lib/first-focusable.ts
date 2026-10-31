// Focuses the first element inside `root` that a keyboard user can focus, in DOM order. Links count. `skip` is left out (for example the close button of a sheet). Returns false when nothing could take focus, so the caller keeps the default.
const FOCUSABLE =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]';

// A hidden element (display none, visibility hidden) cannot take focus, so it must not be picked.
function isRendered(el: HTMLElement, root: HTMLElement): boolean {
  if (getComputedStyle(el).visibility === 'hidden') return false;
  for (let node: HTMLElement | null = el; node && node !== root.parentElement; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

// Focuses the last focusable element inside `root`. Used when Shift+Tab leaves a container that only holds programmatic focus.
export function focusLast(root: HTMLElement): boolean {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).reverse();
  for (const el of candidates) {
    if (el.tabIndex < 0 || (el as HTMLButtonElement).disabled) continue;
    if (el.closest('[hidden], [inert], fieldset:disabled') || !isRendered(el, root)) continue;
    el.focus({ preventScroll: true });
    if (document.activeElement === el) return true;
  }
  return false;
}

export function focusFirst(root: HTMLElement, skip?: Element | null): boolean {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
  for (const el of candidates) {
    if (el === skip || skip?.contains(el)) continue;
    if (el.tabIndex < 0 || (el as HTMLButtonElement).disabled) continue;
    if (el.closest('[hidden], [inert], fieldset:disabled') || !isRendered(el, root)) continue;
    el.focus({ preventScroll: true });
    if (document.activeElement === el) return true;
  }
  return false;
}
