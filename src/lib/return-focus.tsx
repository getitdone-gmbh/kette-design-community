'use client';
import * as React from 'react';

// Focus return fallback for Radix dialog content. Radix returns focus to the Trigger only. With no Trigger (controlled `open`, a plain Button that sets state) focus would land on the body.
// The opener is remembered when the content mounts and focused again on close, unless a Trigger already took focus or the consumer prevented the default in `onCloseAutoFocus`.
// An opener inside a menu (DropdownMenu item, context menu item) unmounts with the menu. Then focus returns to the trigger of that menu (WCAG 2.4.3).

type RememberOpener = (element: HTMLElement | null, menuTrigger?: HTMLElement | null) => void;

const isMenuItem = (element: Element) => /^menuitem/.test(element.getAttribute('role') ?? '');

// A menu item that opens an overlay unmounts with its menu. The menu that held the item is labelled by its trigger (Radix sets `aria-labelledby` to the trigger id on the menu content, also on sub menus, whose label is the sub trigger). The chain is followed to the outermost trigger, the button that the user opened the menu with.
export const findMenuTrigger = (element: HTMLElement | null): HTMLElement | null => {
  let current: HTMLElement | null = element;
  let trigger: HTMLElement | null = null;
  for (let depth = 0; current && depth < 5; depth += 1) {
    const menu: Element | null = current.closest('[role="menu"]');
    const id = menu?.getAttribute('aria-labelledby');
    const labelledBy: HTMLElement | null = id ? document.getElementById(id) : null;
    if (!labelledBy) break;
    trigger = labelledBy;
    current = labelledBy;
  }
  return trigger;
};

// Rendered as a child of the dialog content, so its first render runs before Radix moves focus into the dialog.
export const OpenerCapture = ({ onCapture }: { onCapture: RememberOpener }) => {
  const [captured] = React.useState<{ opener: HTMLElement | null; menuTrigger: HTMLElement | null }>(() => {
    if (typeof document === 'undefined') return { opener: null, menuTrigger: null };
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body ? active : null;
    return { opener, menuTrigger: opener ? findMenuTrigger(opener) : null };
  });
  React.useEffect(() => {
    onCapture(captured.opener, captured.menuTrigger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

// An opener that was re-rendered with a new key while the overlay was open is a new element: the remembered one is detached. The new element is found again by id, else by tag, accessible name and text.
// The region an opener lives in (landmark, form, dialog, section), or its parent. Remember it while the opener is still connected and pass it to `findReplacement`, so a button with the same name elsewhere on the page is never mistaken for the opener.
const REGION_SELECTOR = 'footer, header, nav, aside, main, form, section, dialog, [role="contentinfo"], [role="banner"], [role="navigation"], [role="region"], [role="dialog"], [role="toolbar"]';
export const regionOf = (element: HTMLElement | null): HTMLElement | null => element?.closest<HTMLElement>(REGION_SELECTOR) ?? element?.parentElement ?? null;

// Without a scope the first match on the page wins (dialogs, sheets). With a scope that is still in the page only its descendants are searched. With a scope that is gone too, only an unambiguous match (exactly one candidate on the page) counts.
export const findReplacement = (old: HTMLElement | null, scope?: HTMLElement | null): HTMLElement | null => {
  if (!old) return null;
  if (old.isConnected) return old;
  if (old.id) {
    const byId = document.getElementById(old.id);
    if (byId) return byId;
  }
  // A menu item is never matched by its text: the same label can exist in another menu.
  if (isMenuItem(old)) return null;
  const label = old.getAttribute('aria-label');
  const text = old.textContent?.trim() ?? '';
  if (!label && !text) return null;
  const root: ParentNode = scope?.isConnected ? scope : document;
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(old.tagName.toLowerCase()));
  const matches = candidates.filter((candidate) => candidate.getAttribute('aria-label') === label && (candidate.textContent?.trim() ?? '') === text);
  if (scope && !scope.isConnected) return matches.length === 1 ? (matches[0] ?? null) : null;
  return matches[0] ?? null;
};

export const useReturnFocusFallback = (consumerHandler?: (event: Event) => void) => {
  const opener = React.useRef<HTMLElement | null>(null);
  const menuTrigger = React.useRef<HTMLElement | null>(null);
  const remember = React.useCallback<RememberOpener>((element, trigger = null) => {
    opener.current = element;
    menuTrigger.current = trigger;
  }, []);
  const onCloseAutoFocus = React.useCallback(
    (event: Event) => {
      consumerHandler?.(event);
      if (event.defaultPrevented) return;
      // The opener first. When it is gone because it lived in a menu that closed, focus goes back to the trigger of that menu.
      const target = findReplacement(opener.current) ?? findReplacement(menuTrigger.current);
      // Radix runs its own trigger focus right after this handler, so the fallback waits for it.
      queueMicrotask(() => {
        const active = document.activeElement;
        const lost = !active || active === document.body || !active.isConnected;
        if (lost && target) target.focus();
      });
    },
    [consumerHandler],
  );
  return { remember, onCloseAutoFocus };
};

// Focus lost to the body (the focused control was removed or hidden) and no opener to go back to: move focus to the start of the page content, never scroll.
// The target is <main> (or role="main"), else the first h1, else the body itself. A target that is not focusable gets tabindex -1 for as long as it holds focus,
// so the next Tab continues from the top of the content and a screen reader announces where focus is.
export const focusPageStart = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  const target = document.querySelector<HTMLElement>('main, [role="main"]') ?? document.querySelector<HTMLElement>('h1') ?? document.body;
  if (!target) return null;
  const addedTabindex = !target.hasAttribute('tabindex');
  const previousOutline = target.style.outline;
  if (addedTabindex) target.setAttribute('tabindex', '-1');
  // A container is not a control: no focus ring around the whole region.
  target.style.outline = 'none';
  target.focus({ preventScroll: true });
  const cleanup = () => {
    if (addedTabindex) target.removeAttribute('tabindex');
    target.style.outline = previousOutline;
    if (!target.getAttribute('style')) target.removeAttribute('style');
  };
  if (document.activeElement === target) target.addEventListener('blur', cleanup, { once: true });
  else cleanup();
  return document.activeElement === target ? target : null;
};
