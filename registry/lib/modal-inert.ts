'use client';

import * as React from 'react';

// While a modal Sheet, Dialog or Drawer is open, everything outside its portal must leave the accessibility tree and the tab order (WCAG 4.1.2).
// Radix hides the background with aria-hidden, but it keeps the whole ancestor chain of every aria-live element on the page. A single live region
// (autosave status, toast, status text) anywhere inside the app shell keeps the shell and <main> exposed. This helper has no such exception:
// only the modal layer itself and explicitly exempt elements (`data-modal-exempt`, set by the library ToastViewport) stay reachable.
export const MODAL_OVERLAY_ATTRIBUTE = 'data-modal-overlay';
export const MODAL_EXEMPT_ATTRIBUTE = 'data-modal-exempt';

// Radix focus guards sit at the body edges and catch Tab and Shift+Tab leaving the layer; if they were inert, focus would leave the page once.
const FOCUS_GUARD_SELECTOR = '[data-radix-focus-guard]';
const EXEMPT_SELECTOR = `[${MODAL_EXEMPT_ATTRIBUTE}], [data-radix-toast-announce-root], [data-radix-toast-viewport], ${FOCUS_GUARD_SELECTOR}`;
// Set by aria-hidden (used by Radix hideOthers) on every element it hides.
const RADIX_HIDDEN_MARKER = 'data-aria-hidden';
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT']);

interface Suppressed {
  count: number;
  inert: boolean;
  ariaHidden: boolean;
}

const suppressed = new WeakMap<Element, Suppressed>();

const supportsInert = () => typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

interface SuppressOptions {
  // Elements matching this selector stay reachable at any time while the layer is open, also when they mount later.
  exemptSelector?: string;
}

// Marks every element outside `keep` (and outside the ancestors of `keep`) as inert, with aria-hidden where the browser has no inert. Returns the undo.
function applySuppression(keep: Element[], root: HTMLElement): () => void {
  const kept = new Set<Element>();
  const mark = (el: Element | null) => {
    if (!el || kept.has(el)) return;
    kept.add(el);
    mark(el.parentElement);
  };
  keep.forEach(mark);
  const needsFallback = !supportsInert();
  const touched: Element[] = [];
  const walk = (parent: Element) => {
    Array.from(parent.children).forEach((node) => {
      if (SKIPPED_TAGS.has(node.tagName)) return;
      if (kept.has(node)) {
        // The kept node is the layer itself when it is a target, otherwise an ancestor of one.
        if (!keep.includes(node)) walk(node);
        return;
      }
      const entry = suppressed.get(node) ?? { count: 0, inert: false, ariaHidden: false };
      if (entry.count === 0) {
        if (!node.hasAttribute('inert')) {
          node.setAttribute('inert', '');
          entry.inert = true;
        }
        if (needsFallback && node.getAttribute('aria-hidden') !== 'true') {
          node.setAttribute('aria-hidden', 'true');
          entry.ariaHidden = true;
        }
      }
      entry.count += 1;
      suppressed.set(node, entry);
      touched.push(node);
    });
  };
  walk(root);
  return () => {
    touched.forEach((node) => {
      const entry = suppressed.get(node);
      if (!entry) return;
      entry.count -= 1;
      if (entry.count > 0) return;
      if (entry.inert) node.removeAttribute('inert');
      if (entry.ariaHidden) node.removeAttribute('aria-hidden');
      suppressed.delete(node);
    });
  };
}

// Radix hideOthers hides the exempt region and its ancestors (a toast region is not aria-live); the page is inert, so the chain can be exposed again.
function exposeExempt(exempt: Element[], root: HTMLElement) {
  exempt.forEach((el) => {
    for (let node: Element | null = el; node && node !== root; node = node.parentElement) {
      if (node.getAttribute('aria-hidden') === 'true' && node.hasAttribute(RADIX_HIDDEN_MARKER)) node.removeAttribute('aria-hidden');
    }
  });
}

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The modal focus trap and its outside-focus dismissal listen on the document, so focus events for exempt elements are stopped at the root element.
// Focus that lands on an exempt element without anything to operate (an emptied toast list) goes back to where it was in the modal.
function guardExemptFocus(keep: Element[], exemptRoots: () => Element[]): { release: () => void; settle: () => void } {
  const host = document.documentElement;
  // Focus guards are kept reachable but belong to the Radix focus scope, so its own handling of focus on them is left alone.
  const exemptOf = (target: EventTarget | null) =>
    target instanceof Element ? exemptRoots().find((el) => !el.matches(FOCUS_GUARD_SELECTOR) && el.contains(target)) : undefined;
  let lastInside: Element | null = null;
  let fromExempt = false;
  const onTrack = (event: FocusEvent) => {
    if (event.target instanceof Element && keep.some((layer) => layer.contains(event.target as Element))) lastInside = event.target;
  };
  const returnFocus = () => {
    const back = lastInside && lastInside.isConnected ? lastInside : keep.map((layer) => layer.querySelector(TABBABLE)).find(Boolean);
    if (back instanceof HTMLElement) back.focus({ preventScroll: true });
  };
  // Called after the exempt layer changed (a toast was removed): focus left on an emptied exempt element, or lost to the body, returns to the modal.
  const settle = () => {
    const active = document.activeElement;
    const exempt = exemptOf(active);
    if ((exempt && !exempt.querySelector(TABBABLE)) || (!exempt && fromExempt && (!active || active === document.body))) returnFocus();
  };
  const onFocusIn = (event: FocusEvent) => {
    const exempt = exemptOf(event.target);
    fromExempt = Boolean(exempt);
    if (!exempt) return;
    event.stopPropagation();
    if (!exempt.querySelector(TABBABLE)) returnFocus();
  };
  const onFocusOut = (event: FocusEvent) => {
    if (exemptOf(event.relatedTarget)) event.stopPropagation();
    // Focus that leaves an exempt element for nowhere (shift+tab off the toast list) must not end on the body while the modal is open.
    if (exemptOf(event.target) && !event.relatedTarget) {
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!active || active === document.body) returnFocus();
      });
    }
  };
  document.addEventListener('focusin', onTrack, true);
  host.addEventListener('focusin', onFocusIn);
  host.addEventListener('focusout', onFocusOut);
  return {
    settle,
    release: () => {
      document.removeEventListener('focusin', onTrack, true);
      host.removeEventListener('focusin', onFocusIn);
      host.removeEventListener('focusout', onFocusOut);
    },
  };
}

// Makes everything outside `keep` inert while a modal layer is open; elements matching `exemptSelector` (toast layers) stay reachable, also when mounted later.
export function suppressOutside(keep: Element[], root: HTMLElement = document.body, options: SuppressOptions = {}): () => void {
  const { exemptSelector } = options;
  if (!exemptSelector) return applySuppression(keep, root);
  const findExempt = () => Array.from(root.querySelectorAll(exemptSelector)).filter((el) => !keep.some((layer) => layer.contains(el)));
  let exempt = findExempt();
  let undo = applySuppression([...keep, ...exempt], root);
  exposeExempt(exempt, root);
  const guard = guardExemptFocus(keep, () => exempt);
  const observer = new MutationObserver(() => {
    const next = findExempt();
    if (next.length !== exempt.length || next.some((el) => !exempt.includes(el))) {
      undo();
      exempt = next;
      undo = applySuppression([...keep, ...exempt], root);
    }
    exposeExempt(exempt, root);
    guard.settle();
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: [MODAL_EXEMPT_ATTRIBUTE, 'aria-hidden'] });
  return () => {
    observer.disconnect();
    guard.release();
    undo();
  };
}

// Keeps the modal layer reachable: the content and its scrim. Exempt global live layers (toasts) are added by suppressOutside.
function layerTargets(content: HTMLElement): Element[] {
  const overlays = Array.from(content.parentElement?.children ?? []).filter((el) => el.hasAttribute(MODAL_OVERLAY_ATTRIBUTE));
  return [content, ...overlays];
}

// Ref callback for the content element of a modal layer. Applies while the content is mounted and `enabled`, undoes on unmount or when disabled.
// The page is freed as soon as the layer starts closing (`data-state="closed"`), not when its exit animation ends: the scroll lock leaves
// with the scrim, which is earlier than the content, so waiting for the content left the page inert after it could scroll again.
// Nested layers stack through the shared counter. The callback is stable, so it is safe inside a composed ref.
export function useModalInertRef<T extends HTMLElement>(enabled: boolean) {
  const [node, setNode] = React.useState<T | null>(null);
  React.useEffect(() => {
    if (!node || !enabled) return undefined;
    let release: (() => void) | null = null;
    const sync = () => {
      const closing = node.getAttribute('data-state') === 'closed';
      if (closing && release) {
        release();
        release = null;
      } else if (!closing && !release) {
        release = suppressOutside(layerTargets(node), document.body, { exemptSelector: EXEMPT_SELECTOR });
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { attributes: true, attributeFilter: ['data-state'] });
    return () => {
      observer.disconnect();
      release?.();
    };
  }, [node, enabled]);
  return setNode;
}

// Runs `callback` once the layer is completely gone: content unmounted, scrim unmounted (the scroll lock leaves with it), inert removed, focus returned.
// Call `run` from `onCloseAutoFocus`: Radix focuses the opener right after that handler, so the callback waits one task and for the scrim to leave the DOM.
export function useAfterModalClose<T extends HTMLElement>(onAfterClose?: () => void) {
  const latest = React.useRef(onAfterClose);
  latest.current = onAfterClose;
  const scrims = React.useRef<Element[]>([]);
  const capture = React.useCallback((node: T | null) => {
    if (node) scrims.current = layerTargets(node).filter((el) => el !== node);
  }, []);
  const run = React.useCallback(() => {
    if (!latest.current) return;
    const started = Date.now();
    const settle = () => {
      const waiting = scrims.current.some((el) => el.isConnected) && Date.now() - started < 1000;
      if (waiting) requestAnimationFrame(settle);
      else latest.current?.();
    };
    setTimeout(settle, 0);
  }, []);
  return React.useMemo(() => ({ capture, run }), [capture, run]);
}
