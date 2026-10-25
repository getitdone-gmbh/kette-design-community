'use client';

import * as React from 'react';

// On phones the toast sits at the bottom edge. A sticky footer of an open Sheet, Dialog or Drawer, a cookie banner or any app-fixed bottom bar reports its inset here, so the toast stays above its actions.
// The toast viewport reads it as --toast-inset-bottom on the document element (phones only). With several open layers the tallest footer wins.
export const TOAST_INSET_PROPERTY = '--toast-inset-bottom';

const footers = new Map<object | string, number>();

const publish = () => {
  if (typeof document === 'undefined') return;
  const height = Math.max(0, ...footers.values());
  if (height > 0) document.documentElement.style.setProperty(TOAST_INSET_PROPERTY, `${height}px`);
  else document.documentElement.style.removeProperty(TOAST_INSET_PROPERTY);
};

// Public API for app-fixed bottom bars (cookie banner, fixed footer, bottom toolbar). `id` is any stable key of the bar (a string or the element), `px` is the distance from the bottom edge of the viewport to the top edge of the bar. A value of 0 releases the entry, so always release on unmount. Several bars: the tallest wins.
export function reportToastInset(id: object | string, px: number) {
  const height = Math.ceil(px);
  if (height > 0) footers.set(id, height);
  else footers.delete(id);
  publish();
}

// A bar this close to the viewport bottom (margin, safe area) counts as docked there.
const EDGE_TOLERANCE = 48;

export interface UseToastInsetOptions {
  // Turn the report off, for example while the bar is hidden.
  enabled?: boolean;
}

// Reports the bottom inset of an app-fixed bar to the toast. Attach the ref to a bar that is `position: fixed` (or sticky) at the bottom edge: while it is, the phone toast rides above its top edge, so it never covers the bar's buttons. A bar that is not fixed or not at the bottom reports nothing, so the hook is safe on responsive bars (for example fixed only from lg).
// The hook follows the element, not the first render: a bar that renders null first (session still loading, no decision open yet) is picked up when it appears, a bar that is removed or hidden releases its inset, and a bar that is swapped for another element moves the report. It re-measures on resize, orientation and visibility changes, on scrolling (a sticky bar that reaches the bottom edge only after scrolling reports then, and releases the inset when it scrolls away) and when content is added or removed (once per frame). The inset is always released on unmount.
export function useToastInset(ref: React.RefObject<HTMLElement | null>, { enabled = true }: UseToastInsetOptions = {}) {
  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    let element: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let attributeObserver: MutationObserver | null = null;
    const report = () => {
      if (!element) return;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const visible = element.isConnected && style.display !== 'none' && style.visibility !== 'hidden';
      const docked = visible && (style.position === 'fixed' || style.position === 'sticky') && rect.height > 0 && rect.top < window.innerHeight && rect.bottom >= window.innerHeight - EDGE_TOLERANCE;
      reportToastInset(element, docked ? window.innerHeight - rect.top : 0);
    };
    const detach = () => {
      if (!element) return;
      resizeObserver?.disconnect();
      attributeObserver?.disconnect();
      reportToastInset(element, 0);
      element = null;
    };
    const attach = (next: HTMLElement) => {
      element = next;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(report);
        resizeObserver.observe(next);
      }
      // A bar that is hidden or shown by a class, style or hidden attribute changes its box, but not always its size observation (for example visibility).
      attributeObserver = new MutationObserver(report);
      attributeObserver.observe(next, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
      report();
    };
    // Cheap identity check, no layout read unless the element changed.
    const sync = () => {
      const current = ref.current;
      if (current === element && (!element || element.isConnected)) return;
      detach();
      if (current?.isConnected) attach(current);
    };
    sync();
    // Elements appear and disappear without the host re-rendering (a child renders the bar), so watch the tree for insertions and removals.
    // The same insertions and removals can grow the content above a sticky bar and move it to or from the bottom edge without any resize, so the report is refreshed too, at most once per frame.
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        report();
      });
    };
    const treeObserver = new MutationObserver(() => {
      sync();
      schedule();
    });
    treeObserver.observe(document.documentElement, { childList: true, subtree: true });
    const remeasure = () => {
      sync();
      report();
    };
    // A sticky bar reaches the bottom edge, or leaves it, by scrolling: no resize happens. Scroll events of any container are caught in the capture phase and measured once per frame.
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', remeasure);
    document.addEventListener('visibilitychange', remeasure);
    return () => {
      treeObserver.disconnect();
      document.removeEventListener('scroll', schedule, { capture: true });
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('orientationchange', remeasure);
      document.removeEventListener('visibilitychange', remeasure);
      detach();
    };
  }, [ref, enabled]);
}
