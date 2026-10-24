'use client';

import * as React from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

// A child counts as shown when it generates a box. `display: contents` has no box of its own, so its children decide.
function isShown(el: Element): boolean {
  const display = window.getComputedStyle(el).display;
  if (display === 'none') return false;
  if (display === 'contents') return Array.from(el.children).some(isShown);
  return true;
}

// True while a wrapper has no child that is shown. Children hidden with `hidden`, `max-sm:hidden` or an inline style leave an empty wrapper
// whose parent `gap` would still add a blank row. The state is re-read when children or their classes change and when the viewport resizes
// (responsive hiding). Put `data-[empty=true]:hidden` on the wrapper with the returned `ref` and `data-empty`.
export function useEmptyWrapper<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [empty, setEmpty] = React.useState(false);
  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    let frame = 0;
    const read = () => {
      frame = 0;
      setEmpty(!Array.from(node.children).some(isShown));
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read);
    };
    read();
    const observer = new MutationObserver(schedule);
    observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);
  return { ref, empty };
}
