'use client';

import * as React from 'react';

// A popup layer inside a dialog or sheet (select list, menu, popover, combobox list) owns the first Escape.
// The Radix Select trigger keeps focus while its list is open and reports it as aria-expanded.
const NESTED_LAYER = '[data-radix-popper-content-wrapper],[role="listbox"],[role="menu"],button[role="combobox"][aria-expanded="true"]';

// Marks a list that stays visible while its dialog or sheet is open. It never owns Escape.
export const PERSISTENT_LIST = 'data-persistent-list';

// Set by the overlay content while one Escape press is handled, read by the overlay root before it closes.
export type EscapeGuard = React.MutableRefObject<boolean>;

export const EscapeGuardContext = React.createContext<EscapeGuard | null>(null);

export function escapeBelongsToNestedLayer(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest(NESTED_LAYER) !== null) return true;
  // SingleSelect and MultiSelect keep focus in their search field while the list is open; the list only holds items then.
  // A list that is always shown (the content of a select sheet) is no popup layer: Escape closes the sheet.
  const command = target.closest('.command');
  return command != null && !command.hasAttribute(PERSISTENT_LIST) && command.querySelector('[cmdk-item]') != null;
}

// Safety net. With aligned Radix versions every layer shares one dismissable-layer stack and only the innermost layer sees Escape, so the guard stays idle for Radix layers. It still covers a consumer that pins an older copy (separate stacks) and nested popups that are not Radix layers: the content marks such a press and the root skips the close. Radix marks the event as handled once the overlay has seen it, which would stop the nested layer from closing, so the flag is reported as unset for the layers that follow.
export function guardNestedEscape(guard: EscapeGuard | null, event: KeyboardEvent) {
  if (!guard || !escapeBelongsToNestedLayer(event)) return;
  Object.defineProperty(event, 'defaultPrevented', { configurable: true, get: () => false });
  guard.current = true;
  queueMicrotask(() => {
    guard.current = false;
  });
}

// Open state that can veto a close while the guard is set. It works controlled and uncontrolled.
export function useGuardedOpen({
  open,
  defaultOpen,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const guard = React.useRef(false);
  const [inner, setInner] = React.useState(defaultOpen ?? false);
  const controlled = open !== undefined;
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && guard.current) return;
      if (!controlled) setInner(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  return { guard, open: controlled ? open : inner, onOpenChange: handleOpenChange };
}
