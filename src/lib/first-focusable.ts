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

// True when `root` holds an element a keyboard user can reach with Tab.
export function hasFocusable(root: HTMLElement): boolean {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).some(
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest('[hidden], [inert], fieldset:disabled') && isRendered(el, root),
  );
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

// Elements inside `root` a keyboard user reaches with Tab (tabIndex 0 or more), in DOM order.
export function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest('[hidden], [inert], fieldset:disabled') && isRendered(el, root),
  );
}

// The page element Tab (forward) or Shift+Tab (backward) reaches when it leaves `container`, counted from `anchor` (the element that had focus before the container opened). Backward lands on the anchor itself. Without an anchor the count starts at the start or end of the document. Null when there is no such element.
export function pageTabTarget(container: HTMLElement, anchor: HTMLElement | null, forward: boolean): HTMLElement | null {
  const page = pageTabbables(container);
  const from = anchor && anchor.isConnected && !container.contains(anchor) ? anchor : null;
  if (!from) return (forward ? page[0] : page[page.length - 1]) ?? null;
  const following = (el: HTMLElement) => Boolean(from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  if (forward) return page.find((el) => el !== from && following(el)) ?? null;
  if (page.includes(from)) return from;
  return [...page].reverse().find((el) => !following(el) && el !== from) ?? null;
}

const FOCUS_GUARD = '[data-radix-focus-guard]';
const follows = (from: Node, el: Node) => Boolean(from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);

// Tab stops of the page outside `container`, without the invisible Radix focus guards at the body edges.
export function pageTabbables(container: HTMLElement): HTMLElement[] {
  return tabbables(document.body).filter((el) => !container.contains(el) && !el.matches(FOCUS_GUARD));
}

// True when a forward Tab from `from` would land inside `container` because it is the next stop in DOM order.
export function nextTabIsInside(container: HTMLElement, from: HTMLElement): boolean {
  const all = tabbables(document.body).filter((el) => !el.matches(FOCUS_GUARD));
  const next = all[all.indexOf(from) + 1];
  return Boolean(next && container.contains(next));
}

// Makes `container` and the focus guards after it inert until the current key press is handled, so the browser's own Tab steps over them (to the browser bar at the end of the page).
export function skipOnce(container: HTMLElement): void {
  const guards = Array.from(document.querySelectorAll<HTMLElement>(FOCUS_GUARD)).filter((el) => follows(container, el));
  const skipped = [container, ...guards].filter((el) => !el.hasAttribute('inert'));
  skipped.forEach((el) => el.setAttribute('inert', ''));
  window.setTimeout(() => skipped.forEach((el) => el.removeAttribute('inert')), 0);
}

// True when `el` is a Radix focus guard after `container` (the end of the page).
export function isTrailingGuard(container: HTMLElement, el: Element): boolean {
  return el.matches(FOCUS_GUARD) && follows(container, el);
}

// The last page Tab stop before `container` in DOM order, or null.
export function lastPageTabbableBefore(container: HTMLElement): HTMLElement | null {
  return pageTabbables(container).filter((el) => follows(el, container)).pop() ?? null;
}

// True when `el` would sit under `cover` once focused: its centre lies inside the cover rect, or the topmost element at that point belongs to `container`. The vertical centre is clamped to the viewport, because focus scrolls an element into view.
// `reach` (from paintedRect) skips the hit test for points the container cannot paint: elementFromPoint lays out the whole page, thousands of calls froze big boards for seconds.
export function isCoveredBy(el: Element, container: HTMLElement, cover: DOMRect = layoutRect(container), reach?: Box): boolean {
  if (cover.width <= 0 || cover.height <= 0) return false;
  const box = el.getBoundingClientRect();
  if (box.width <= 0 && box.height <= 0) return false;
  const x = box.left + box.width / 2;
  const y = Math.min(Math.max(box.top + box.height / 2, 0), Math.max(window.innerHeight - 1, 0));
  if (x >= cover.left && x <= cover.right && y >= cover.top && y <= cover.bottom) return true;
  if (reach && (x < reach.left || x > reach.right || y < reach.top || y > reach.bottom)) return false;
  if (typeof document.elementFromPoint !== 'function' || x < 0 || x >= window.innerWidth) return false;
  const top = document.elementFromPoint(x, y);
  return Boolean(top && top !== el && !el.contains(top) && container.contains(top));
}

// True when `container` hides at least one Tab stop of the page (a sheet over the page instead of beside it). Cheap checks first, the visibility check only for covered candidates.
export function hidesPageTabbable(container: HTMLElement): boolean {
  const cover = layoutRect(container);
  if (cover.width <= 0 || cover.height <= 0) return false;
  const reach = paintedRect(container, cover);
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>(FOCUSABLE))) {
    if (container.contains(el) || el.matches(FOCUS_GUARD) || el.tabIndex < 0 || (el as HTMLButtonElement).disabled) continue;
    if (!isCoveredBy(el, container, cover, reach)) continue;
    if (el.closest('[hidden], [inert], fieldset:disabled') || !isRendered(el, document.body)) continue;
    return true;
  }
  return false;
}

// Edges of an area in viewport coordinates
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Area `container` can paint on: its cover rect joined with the boxes of descendants that reach out of it (a popover, a shadow), measured once per check instead of a hit test per page element.
export function paintedRect(container: HTMLElement, cover: DOMRect = layoutRect(container)): Box {
  let left = cover.left;
  let top = cover.top;
  let right = cover.right;
  let bottom = cover.bottom;
  for (const child of Array.from(container.querySelectorAll('*'))) {
    const box = child.getBoundingClientRect();
    if (box.width <= 0 && box.height <= 0) continue;
    left = Math.min(left, box.left);
    top = Math.min(top, box.top);
    right = Math.max(right, box.right);
    bottom = Math.max(bottom, box.bottom);
  }
  return { left, top, right, bottom };
}

// Box of a fixed element without its own transform (the slide-in animation), so the overlap is known while the sheet still moves in. Other elements use their bounding box.
export function layoutRect(el: HTMLElement): DOMRect {
  if (el.offsetWidth > 0 && el.offsetParent === null && getComputedStyle(el).position === 'fixed') {
    return new DOMRect(el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight);
  }
  return el.getBoundingClientRect();
}
