'use client';

import * as React from 'react';

import { reportToastInset } from '@/lib/toast-inset';

// A sticky or fixed header or footer inside a scrolling overlay covers the focused element when the browser scrolls it to the edge (reverse Tab to the first field, WCAG 2.4.11 Focus Not Obscured).
// The bar reports its height as --sticky-inset-top or --sticky-inset-bottom on the overlay content (the element with data-inset-scope). Scroll containers read it as scroll-padding, so a focused element always stops clear of the bar.
export const INSET_SCOPE_ATTRIBUTE = 'data-inset-scope';

// Utility classes for the scroll containers of an overlay: the content panel and its scrolling body.
export const scrollInsetClasses = 'scroll-pt-[var(--sticky-inset-top,0px)] scroll-pb-[var(--sticky-inset-bottom,0px)]';

type Edge = 'top' | 'bottom';

// A footer this close to the bottom edge of the viewport (panel padding, safe area) counts as docked there.
const EDGE_TOLERANCE = 48;

const property = (edge: Edge) => `--sticky-inset-${edge}`;

interface StickyInsetOptions {
  // The bar sits at the bottom edge of a layer that is anchored to the viewport bottom (a Drawer), so it covers the phone toast even though it is not sticky.
  docked?: boolean;
  // `auto` measures where the bar is: when it sits at the bottom edge of the viewport (a Sheet footer, sticky or not, with or without panel padding below it) the phone toast rides above its top edge. It follows scrolling, resizing and the slide-in animation.
  place?: 'auto';
}

export function useStickyInset<T extends HTMLElement>(edge: Edge, forwardedRef?: React.ForwardedRef<T>, { docked = false, place }: StickyInsetOptions = {}) {
  const [element, setElement] = React.useState<T | null>(null);
  const setRef = React.useCallback(
    (node: T | null) => {
      setElement(node);
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<T | null>).current = node;
    },
    [forwardedRef],
  );
  React.useEffect(() => {
    if (!element) return undefined;
    const scope = element.closest<HTMLElement>(`[${INSET_SCOPE_ATTRIBUTE}]`);
    if (!scope) return undefined;
    const name = property(edge);
    const report = () => {
      const position = window.getComputedStyle(element).position;
      // Only a bar that stays in view while the content scrolls can cover a focused element.
      const covers = position === 'sticky' || position === 'fixed';
      scope.style.setProperty(name, covers ? `${element.offsetHeight}px` : '0px');
      // A bottom bar also lifts the phone toast above itself.
      if (edge === 'bottom') {
        const rect = element.getBoundingClientRect();
        const atEdge = place === 'auto' && rect.height > 0 && rect.top < window.innerHeight && rect.bottom >= window.innerHeight - EDGE_TOLERANCE;
        reportToastInset(element, atEdge ? Math.ceil(window.innerHeight - rect.top) : covers || docked ? element.offsetHeight : 0);
      }
    };
    report();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(report);
    observer?.observe(element);
    window.addEventListener('resize', report);
    // A panel that slides in has its final position only when the animation ends; content that scrolls moves a footer that is not sticky.
    const auto = place === 'auto';
    if (auto) {
      scope.addEventListener('animationend', report);
      window.addEventListener('scroll', report, true);
    }
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', report);
      if (auto) {
        scope.removeEventListener('animationend', report);
        window.removeEventListener('scroll', report, true);
      }
      scope.style.removeProperty(name);
      if (edge === 'bottom') reportToastInset(element, 0);
    };
  }, [element, edge, docked, place]);
  return setRef;
}
