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

// Reports the bottom inset of an app-fixed bar to the toast. Attach the ref to a bar that is `position: fixed` (or sticky) at the bottom edge: while it is, the phone toast rides above its top edge, so it never covers the bar's buttons. A bar that is not fixed or not at the bottom reports nothing, so the hook is safe on responsive bars (for example fixed only from lg). The inset is released on unmount.
export function useToastInset(ref: React.RefObject<HTMLElement | null>, { enabled = true }: UseToastInsetOptions = {}) {
  React.useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;
    const report = () => {
      const position = window.getComputedStyle(element).position;
      const rect = element.getBoundingClientRect();
      const docked = (position === 'fixed' || position === 'sticky') && rect.height > 0 && rect.top < window.innerHeight && rect.bottom >= window.innerHeight - EDGE_TOLERANCE;
      reportToastInset(element, docked ? window.innerHeight - rect.top : 0);
    };
    report();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(report);
    observer?.observe(element);
    window.addEventListener('resize', report);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', report);
      reportToastInset(element, 0);
    };
  }, [ref, enabled]);
}
