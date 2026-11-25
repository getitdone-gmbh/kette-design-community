'use client';

import { OpenerCapture, useReturnFocusFallback } from '@/lib/return-focus';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, ChevronLeft, X } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { MODAL_OVERLAY_ATTRIBUTE, useAfterModalClose, useModalInertRef } from '@/lib/modal-inert';
import {
  focusFirst,
  focusLast,
  hasFocusable,
  hidesPageTabbable,
  isCoveredBy,
  isTrailingGuard,
  lastPageTabbableBefore,
  nextTabIsInside,
  pageTabTarget,
  skipOnce,
  tabbables,
} from '@/lib/first-focusable';
import { openedByActivation, openedByPointer } from '@/lib/opened-by-activation';
import { EscapeGuardContext, escapeBelongsToNestedLayer, guardNestedEscape, useGuardedOpen } from '@/lib/nested-layer';
import { INSET_SCOPE_ATTRIBUTE, scrollInsetClasses, useStickyInset } from '@/lib/sticky-inset';
import { displayVoice } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import type { HeadingTag } from '@/components/ui/heading-tag';
import { AutosaveScopeContext, type AutosaveScope, type HandedStatus } from '@/components/ui/autosave-scope';
import { AutosaveStatus } from '@/components/ui/autosave-status';
import { Button } from '@/components/ui/button';
import { CodeSnippet, type CodeSnippetProps } from '@/components/ui/code-snippet';
import { useLabels, usePreset } from '@/components/ui/labels-context';
import { Link, type LinkProps } from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';

// Remembers the modal flag so SheetContent can apply docked (non-modal) focus and Escape rules.
const SheetModalContext = React.createContext(true);

// Lets SheetNavLink close its sheet and queue work for the moment the sheet is completely gone (see SheetContent `onAfterClose`).
interface SheetNavValue {
  close: () => void;
  afterClose: React.MutableRefObject<Array<() => void>>;
}
const SheetNavContext = React.createContext<SheetNavValue | null>(null);

const Sheet = ({ modal = true, open, defaultOpen, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>) => {
  const state = useGuardedOpen({ open, defaultOpen, onOpenChange });
  const afterClose = React.useRef<Array<() => void>>([]);
  // The handler changes with every render of a parent that passes an inline `onOpenChange`. The context value must not follow it: SheetContent clears queued jumps when the value changes, which would drop the jump of a link that closes the sheet.
  const setOpenRef = React.useRef(state.onOpenChange);
  setOpenRef.current = state.onOpenChange;
  const nav = React.useMemo<SheetNavValue>(() => ({ close: () => setOpenRef.current(false), afterClose }), []);
  return (
    <SheetModalContext.Provider value={modal}>
      <SheetNavContext.Provider value={nav}>
        <EscapeGuardContext.Provider value={state.guard}>
          <SheetPrimitive.Root modal={modal} open={state.open} onOpenChange={state.onOpenChange} {...props} />
        </EscapeGuardContext.Provider>
      </SheetNavContext.Provider>
    </SheetModalContext.Provider>
  );
};
Sheet.displayName = 'Sheet';

// A sheet that leaves while open and another of the same kind that arrives in the same commit is a switch of the content (a row remounted it by key): the new one takes the place without a second entrance
interface LeftSheet {
  at: number;
  node: HTMLElement | null;
  kind: string;
}
let leftSheet: LeftSheet | null = null;
const SWITCH_WINDOW_MS = 50;
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function useSwitchedIn(contentRef: React.MutableRefObject<HTMLDivElement | null>, kind: string) {
  const [switched, setSwitched] = React.useState(false);
  useIsoLayoutEffect(() => {
    const node = contentRef.current;
    const left = leftSheet;
    // The same node coming back is the StrictMode double mount, not a switch; another side, mode or placement is a different sheet (the dock element itself may be new, a remounted SheetPanel rebuilds it)
    if (left && now() - left.at < SWITCH_WINDOW_MS && left.node !== node && left.kind === kind) setSwitched(true);
    return () => {
      const current = contentRef.current ?? node;
      if (current?.getAttribute('data-state') === 'open') leftSheet = { at: now(), node: current, kind };
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return switched;
}

// Only the entrance is skipped: the exit still plays when the switched sheet closes
const noEntrance = 'data-[state=open]:data-[sheet-switched]:animate-none';

const SheetTrigger = SheetPrimitive.Trigger;

// Close requests from inside the sheet (close button, SheetClose, swipe, Escape, outside click) pass through here: an open step or stage and the discard guard decide first.
interface SheetStepsValue {
  // The sheet panel, the confirm step portals into it so it covers the whole panel.
  node: HTMLDivElement | null;
  // True while the discard guard would stop a close (discardGuard and state dirty).
  guarded: () => boolean;
  // Closes the sheet, or shows the discard step while guarded.
  requestClose: () => void;
  // Escape handlers of open steps and stages, the last registered runs first. A handler returns true when it used the key.
  escape: React.MutableRefObject<Array<() => boolean>>;
}
const SheetStepsContext = React.createContext<SheetStepsValue | null>(null);

// Registers an Escape handler with the sheet while `active`.
function useSheetEscape(active: boolean, handler: () => boolean) {
  const steps = React.useContext(SheetStepsContext);
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;
  React.useEffect(() => {
    if (!active || !steps) return undefined;
    const run = () => handlerRef.current();
    steps.escape.current.push(run);
    return () => {
      steps.escape.current = steps.escape.current.filter((h) => h !== run);
    };
  }, [active, steps]);
}

// Radix Close that respects the discard guard: with unsaved changes it shows the discard step instead of closing.
const SheetClose = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Close>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>>(
  ({ onClick, ...props }, ref) => {
    const steps = React.useContext(SheetStepsContext);
    return (
      <SheetPrimitive.Close
        ref={ref}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || !steps?.guarded()) return;
          event.preventDefault();
          steps.requestClose();
        }}
        {...props}
      />
    );
  },
);
SheetClose.displayName = 'SheetClose';

const SheetPortal = SheetPrimitive.Portal;

// Under prefers-reduced-motion the scrim and the panel appear and go without slide, fade or duration. The data-state forms match the specificity of the animate-in and animate-out rules.
const sheetReducedMotion =
  'motion-reduce:animate-none motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none motion-reduce:transition-none motion-reduce:duration-0';

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <SheetPrimitive.Overlay
      {...{ [MODAL_OVERLAY_ATTRIBUTE]: '' }}
      className={cn(
        'fixed inset-0 z-sheet data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        sheetReducedMotion,
        zero ? 'bg-overlay-scrim' : 'bg-overlay',
        noEntrance,
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetBase =
  'fixed z-sheet gap-4 border-hairline bg-background p-6 [--sheet-elevation:theme(boxShadow.dialog)] shadow-[shadow:var(--bevel-sheet),var(--sheet-elevation)] bg-[image:var(--image-sheet)] transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500';

const sheetVariants = cva(
  sheetBase,
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-solid data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t border-solid data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full border-r border-solid data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right:
          'inset-y-0 right-0 h-full border-l border-solid data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
      // Internal: true when an explicit `size` replaces the responsive default width.
      sized: { true: '', false: '' },
    },
    compoundVariants: [
      { side: 'left', sized: false, className: 'w-3/4 sm:max-w-3xl' },
      { side: 'right', sized: false, className: 'w-3/4 sm:max-w-3xl' },
    ],
    defaultVariants: {
      side: 'right',
      sized: false,
    },
  },
);

type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
// `modal` (default) keeps the scrim and blocks the page. `push` docks a persistent pane without a scrim
// (pair with `modal={false}` on Sheet). `overlay` floats a rounded full-height panel over the page with a scrim.
// `card` floats a rounded panel that hugs its content up to the sheet card max height (Figma Sheet overlay card).
// `centered` places that same card in the middle of the viewport above the scrim (Figma Sheet centered overlay).
type SheetMode = 'modal' | 'push' | 'overlay' | 'card' | 'centered';
// `default` renders the content as given. `loading`, `error` and `dirty` drive SheetBody and SheetFooter.
type SheetState = 'default' | 'loading' | 'error' | 'dirty';
// Docks a fixed sheet to the work area. `topbar` and `topbar-lg` start below the top bar. `topbar-sidebar` and `topbar-sidebar-collapsed`
// also keep a left sheet clear of the expanded or collapsed sidebar. `none` (default) is the window edge.
type SheetInset = 'none' | 'topbar' | 'topbar-lg' | 'topbar-sidebar' | 'topbar-sidebar-collapsed';

const sheetInsetClass: Record<Exclude<SheetInset, 'none'>, string> = {
  topbar: 'top-topbar h-auto bottom-0',
  'topbar-lg': 'top-topbar-lg h-auto bottom-0',
  'topbar-sidebar': 'top-topbar h-auto bottom-0',
  'topbar-sidebar-collapsed': 'top-topbar h-auto bottom-0',
};

// Written out in full, so Tailwind finds every class in the source and in dist.
const sheetMobileFullscreen =
  'max-sm:inset-0 max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0';

const SheetStateContext = React.createContext<SheetState>('default');

const sheetSizeWidth: Record<SheetSize, string> = {
  sm: 'w-sheet-sm max-w-full',
  md: 'w-sheet-md max-w-full',
  lg: 'w-sheet-lg max-w-full',
  xl: 'w-sheet-xl max-w-full',
  full: 'w-full max-w-full',
};

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    Pick<VariantProps<typeof sheetVariants>, 'side'> {
  /** Fixed panel width from the sheet size tokens (440, 520, 640, 900) or `full` (whole width). Never wider than the viewport. Omit for the original responsive width. */
  size?: SheetSize;
  /** Presentation mode, see SheetMode. Default `modal` is unchanged. */
  mode?: SheetMode;
  /** Number of sheets stacked above this one. Each level shifts the panel left by the stack offset and mutes its surface. */
  stackDepth?: number;
  /** Set to false for a zero-padding flex column (header, body and footer manage their own padding). */
  padded?: boolean;
  /** Loading, error and dirty states, read by SheetBody and SheetFooter. */
  state?: SheetState;
  // Where the save status may appear. `footer` draws it once, in the zero `SheetFooter` (left side): an `AutosaveStatus` placed elsewhere in the sheet, for example in `SheetMeta`, hands its state, label and retry to the footer and draws nothing. Without a zero footer the status stays where it is placed. Dialogs and popovers opened from the sheet are not affected. Default `any` draws every status where it is placed.
  statusPlacement?: 'any' | 'footer';
  // Accessible name of the close button and the loading skeleton. Win over the provider text.
  closeLabel?: string;
  /** Docks the sheet to the work area instead of the window edge, see SheetInset. Default `none` is unchanged. */
  inset?: SheetInset;
  /** Portals the sheet (and its scrim) into this element instead of the body and positions it `absolute`. The element must be `relative`. */
  container?: HTMLElement | null;
  /** Moves focus into the sheet when it opens. Defaults to true for modal sheets. A docked sheet (`Sheet` has `modal={false}`, for example `mode="push"`) takes focus when a click opened it and keeps the page focus when it opened without one (a selection or a route changed it). Focus lands on the first visible focusable element of the content, links included; the close button is only the target when nothing else can take focus. A sheet that is read, not operated, should keep focus at its start: pass `focusOnOpen={false}`, which focuses the first `SheetBody` (no ring when a pointer click opened the sheet, the ring shows when the keyboard opened it; a body without controls stays a tab stop) so Page Down, Space, the arrow keys and End scroll it at once, or the sheet container (the dialog itself, tabIndex -1) when there is no SheetBody, instead of the first control. Or focus the title in `onOpenAutoFocus`. */
  focusOnOpen?: boolean;
  /** Below the `sm` screen (640px) the sheet fills the whole viewport: no inset, no radius, no border, full width and height (Figma Slide out menu, Mobile=Full screen). From `sm` up it keeps its mode and size. Works with every mode and side. */
  mobileFullscreen?: boolean;
  /** Runs once the sheet is completely gone: exit animation done, page no longer inert, scroll lock released and focus returned to the opener. Put "focus this field after closing" code here. */
  onAfterClose?: () => void;
  // Grabber at the top edge of a bottom sheet (phone). Dragging it down closes the sheet like the close button; the close button stays the keyboard and screen reader way.
  handle?: boolean;
  // Protects unsaved input: while `state` is `dirty`, Escape, a click on the scrim, the close button, SheetClose and the swipe show "Discard changes?" as a step in the same sheet instead of closing.
  discardGuard?: boolean;
  // Texts of the discard step. Win over the provider text.
  discardTitle?: string;
  discardDescription?: string;
}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  (
    {
      side = 'right',
      className,
      children,
      size,
      mode: modeProp,
      stackDepth = 0,
      padded: paddedProp,
      state = 'default',
      statusPlacement = 'any',
      style,
      onInteractOutside,
      onOpenAutoFocus,
      onEscapeKeyDown,
      onCloseAutoFocus,
      onKeyDown,
      closeLabel,
      inset = 'none',
      container,
      focusOnOpen,
      mobileFullscreen = false,
      onAfterClose,
      handle = false,
      discardGuard = false,
      discardTitle,
      discardDescription,
      ...props
    },
    ref,
  ) => {
    const returnFocus = useReturnFocusFallback(onCloseAutoFocus);
    // The element that had focus before the sheet opened: a docked sheet hands Tab back to the page from there.
    const openerRef = React.useRef<HTMLElement | null>(null);
    const { remember } = returnFocus;
    const rememberOpener = React.useCallback(
      (element: HTMLElement | null, menuTrigger?: HTMLElement | null) => {
        openerRef.current = element;
        remember(element, menuTrigger);
      },
      [remember],
    );
    const l = useLabels({ close: closeLabel });
    const zero = usePreset() === 'zero';
    // Zero: the default sheet is the rounded 8px inset overlay panel (md width, sections own their padding).
    const mode = modeProp ?? (zero ? 'overlay' : 'modal');
    const padded = paddedProp ?? !zero;
    const nonModal = !React.useContext(SheetModalContext);
    const escapeGuard = React.useContext(EscapeGuardContext);
    // Save status handed over to the footer (statusPlacement="footer").
    const [footerShown, setFooterShown] = React.useState(false);
    const [handed, hand] = React.useState<HandedStatus | null>(null);
    const statusScope = React.useMemo<AutosaveScope | null>(
      () => (statusPlacement === 'footer' ? { footerOnly: true, footerShown, setFooterShown, handed, hand } : null),
      [statusPlacement, footerShown, handed],
    );
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    // A modal sheet makes everything outside its portal inert while it is open, see lib/modal-inert.
    const inertRef = useModalInertRef<HTMLDivElement>(!nonModal);
    const nav = React.useContext(SheetNavContext);
    const [discardOpen, setDiscardOpen] = React.useState(false);
    const guardedNow = discardGuard && state === 'dirty';
    const guardedRef = React.useRef(guardedNow);
    guardedRef.current = guardedNow;
    const escapeHandlers = React.useRef<Array<() => boolean>>([]);
    const [panelNode, setPanelNode] = React.useState<HTMLDivElement | null>(null);
    const steps = React.useMemo<SheetStepsValue>(
      () => ({
        node: panelNode,
        guarded: () => guardedRef.current,
        requestClose: () => {
          if (guardedRef.current) setDiscardOpen(true);
          else nav?.close();
        },
        escape: escapeHandlers,
      }),
      [panelNode, nav],
    );
    const swipe = useSheetSwipe(contentRef, steps.requestClose);
    // A queued jump from an earlier close that was vetoed must not run at the next close.
    React.useEffect(() => {
      if (nav) nav.afterClose.current.length = 0;
    }, [nav]);
    const afterClose = useAfterModalClose<HTMLDivElement>(() => {
      onAfterClose?.();
      // Work queued by SheetNavLink runs once the scrim and the scroll lock are gone.
      const queued = nav?.afterClose.current.splice(0) ?? [];
      queued.forEach((run) => run());
    });
    const [contentNode, setContentNode] = React.useState<HTMLDivElement | null>(null);
    const [covers, setCovers] = useCoversPage(nonModal ? contentNode : null);
    useDockedTabOrder(contentRef, openerRef, nonModal);
    const setRefs = (node: HTMLDivElement | null) => {
      contentRef.current = node;
      setContentNode(node);
      setPanelNode(node);
      inertRef(node);
      afterClose.capture(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };
    const scoped = Boolean(container);
    const switched = useSwitchedIn(contentRef, `${side}:${mode}:${scoped ? 'docked' : 'window'}`);
    const card = mode === 'card' || mode === 'centered';
    const centered = mode === 'centered';
    // Card modes default to the 520 card width when no size is given.
    const widthSize: SheetSize | undefined = size ?? (card || (zero && modeProp === undefined) ? 'md' : undefined);
    const sized = widthSize !== undefined && (card || side === 'left' || side === 'right');
    const floating = mode === 'overlay' && (side === 'left' || side === 'right');
    const cardDocked = mode === 'card';
    // The close button is rendered before the content (first tab stop, as at the top). It is absolute and on z-chrome, so sticky headers up to z-sticky do not cover it.
    return (
      <SheetPortal container={container ?? undefined}>
        {mode !== 'push' && <SheetOverlay className={scoped ? 'absolute' : undefined} data-sheet-switched={switched || undefined} />}
        <SheetPrimitive.Content
          data-slot="sheet-content"
          ref={setRefs}
          onOpenAutoFocus={(event) => {
            onOpenAutoFocus?.(event);
            if (event.defaultPrevented) return;
            if (!(focusOnOpen ?? (!nonModal || openedByActivation()))) {
              event.preventDefault();
              // An explicit `focusOnOpen={false}` on a modal sheet still moves focus into the sheet, so focus never stays on the inert page body. A docked sheet keeps the page focus.
              // The start is the first SheetBody, the element that scrolls: Page Down, Space, the arrows and End scroll it right away. Without a body it is the container.
              if (focusOnOpen === false && !nonModal) {
                const body = contentRef.current?.querySelector<HTMLElement>('[data-slot="sheet-body"]');
                if (body) {
                  // A body with controls is reached through them, so it only takes this programmatic focus. A body of text stays a tab stop, so Tab can bring the keyboard back to scroll it.
                  if (!body.hasAttribute('tabindex')) body.tabIndex = hasFocusable(body) ? -1 : 0;
                  // No ring for the focus the sheet sets itself after a pointer click; the mark goes with the first blur, a later keyboard focus shows the ring. Opened by keyboard (or programmatically) the ring shows, since focus landed on a tab stop the user has to see.
                  if (openedByPointer()) {
                    body.setAttribute('data-sheet-autofocus', '');
                    body.addEventListener('blur', () => body.removeAttribute('data-sheet-autofocus'), { once: true });
                  }
                }
                (body ?? contentRef.current)?.focus({ preventScroll: true });
              }
              return;
            }
            // Radix skips links for the first focus and the close button is now first in the tab order. Focus the first focusable element of the content instead, links included.
            const root = contentRef.current;
            if (!root || root.contains(document.activeElement)) return;
            if (focusFirst(root, root.querySelector('[data-slot="sheet-close"]'))) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            returnFocus.onCloseAutoFocus(event);
            afterClose.run();
          }}
          onEscapeKeyDown={(event) => {
            onEscapeKeyDown?.(event);
            // Escape inside a select list, menu or popover closes that layer only.
            guardNestedEscape(escapeGuard, event);
            // A docked sheet shares the page with other widgets: Escape only closes it while focus is inside.
            if (nonModal && !contentRef.current?.contains(document.activeElement)) event.preventDefault();
            if (event.defaultPrevented || escapeBelongsToNestedLayer(event)) return;
            // An open confirm step cancels, a pushed stage goes one stage back, then the discard guard asks before the sheet closes.
            const handlers = escapeHandlers.current;
            for (let i = handlers.length - 1; i >= 0; i -= 1) {
              if (handlers[i]()) {
                event.preventDefault();
                return;
              }
            }
            if (guardedRef.current) {
              event.preventDefault();
              setDiscardOpen(true);
            }
          }}
          tabIndex={-1}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
            // A docked sheet is part of the page, not a trap: Tab on its last element and Shift+Tab on its first go on to the page. Focus moves before the Radix focus scope sees the key, so it does not loop.
            // Over the page (UX-PKG5-01) the target would be hidden: focus stays in the sheet (Radix loop) and the sheet is modal. Measured now, the layout may have changed since the last check.
            if (nonModal && event.target !== event.currentTarget) {
              const inside = tabbables(event.currentTarget);
              const edge = event.shiftKey ? inside[0] : inside[inside.length - 1];
              const atEdge = event.target === edge;
              const overPage = atEdge && coversPage(event.currentTarget);
              if (atEdge && overPage !== covers) setCovers(overPage);
              if (atEdge && !overPage) {
                const target = pageTabTarget(event.currentTarget, openerRef.current, !event.shiftKey);
                if (target && !isCoveredBy(target, event.currentTarget)) {
                  event.preventDefault();
                  target.focus();
                  return;
                }
              }
            }
            // Focus on the container itself (focusOnOpen={false}): Shift+Tab goes to the last control instead of being pulled back by the focus trap.
            if (!event.shiftKey || event.target !== event.currentTarget) return;
            if (focusLast(event.currentTarget)) event.preventDefault();
          }}
          aria-busy={state === 'loading' || undefined}
          data-sheet-mode={mode}
          {...{ [INSET_SCOPE_ATTRIBUTE]: '' }}
          data-sheet-state={state}
          data-sheet-inset={inset !== 'none' ? inset : undefined}
          data-sheet-scoped={scoped || undefined}
          data-sheet-mobile={mobileFullscreen ? 'fullscreen' : undefined}
          data-sheet-switched={switched || undefined}
          style={stackDepth > 0 ? ({ '--sheet-depth': stackDepth, ...style } as React.CSSProperties) : style}
          onInteractOutside={(event) => {
            if (mode === 'push') event.preventDefault();
            onInteractOutside?.(event);
            // Unsaved input: a click on the scrim asks first, focus moving out never closes.
            if (event.defaultPrevented || !guardedRef.current) return;
            event.preventDefault();
            if (event.type === 'dismissableLayer.pointerDownOutside') setDiscardOpen(true);
          }}
          className={cn(
            // The container only takes programmatic focus (tabIndex -1), it is no control: no ring of its own.
            'outline-none',
            card ? sheetBase : sheetVariants({ side, sized }),
            noEntrance,
            sized && widthSize && sheetSizeWidth[widthSize],
            scrollInsetClasses,
            !padded && 'flex flex-col gap-0 p-0',
            floating && 'inset-y-2 h-auto rounded-surface border border-solid',
            zero && (floating || card || mode === 'push') && 'border-border-default [--sheet-elevation:var(--elevation-raised,0_0_transparent)]',
            // A floating panel keeps its 8px inset on both sides, so a wide size never crosses the viewport edge.
            (floating || cardDocked) && 'max-w-[calc(100%-1rem)]',
            floating && side === 'right' && 'right-2',
            floating && side === 'left' && 'left-2',
            card && 'h-auto max-h-[min(var(--size-sheet-card),calc(100vh-var(--size-inset)*2))] overflow-y-auto rounded-surface border border-solid',
            cardDocked && 'top-2',
            cardDocked &&
              side !== 'left' &&
              'right-2 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            cardDocked &&
              side === 'left' &&
              'left-2 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            centered &&
              'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            inset !== 'none' && !scoped && sheetInsetClass[inset],
            inset === 'topbar-sidebar' && !scoped && side === 'left' && 'left-[var(--size-sidebar)]',
            inset === 'topbar-sidebar-collapsed' && !scoped && side === 'left' && 'left-[var(--size-sidebar-collapsed)]',
            scoped && 'absolute',
            zero && 'typography-ui',
            stackDepth > 0 && 'right-[calc(var(--size-sheet-stack-offset)*var(--sheet-depth))] bg-muted',
            // The max-sm rules come after the plain ones in the CSS, so they replace inset, size, radius and the centred translate on a phone.
            mobileFullscreen && sheetMobileFullscreen,
            sheetReducedMotion,
            className,
          )}
          {...props}
          // While the sheet lies over the page it is modal, also when the consumer marks its push sheet aria-modal="false" (zero-pages SheetPanel).
          aria-modal={nonModal && covers ? true : props['aria-modal']}
        >
          <OpenerCapture onCapture={rememberOpener} />
          {handle && (
            // Decorative grabber, 20px strip at the top edge; the swipe is a shortcut, the close button stays the accessible way.
            <div
              data-slot="sheet-handle"
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-raised flex h-5 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
              {...swipe}
            >
              <span className="h-1 w-9 rounded-full bg-border-control" />
            </div>
          )}
          {/* 40px on a desktop, 44px below md and on every bottom sheet (touch target, ZERO-901). */}
          <SheetPrimitive.Close
            data-slot="sheet-close"
            onClick={(event) => {
              if (!guardedRef.current) return;
              event.preventDefault();
              setDiscardOpen(true);
            }}
            className={cn(
              'absolute right-3 top-3 z-chrome inline-flex items-center justify-center rounded-control text-icon-subtle transition-colors hover:bg-muted hover:text-icon-default active:bg-muted-strong focus:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default disabled:pointer-events-none data-[state=open]:bg-secondary',
              side === 'bottom' ? 'h-10 w-10 min-h-target-lg min-w-target-lg' : 'h-10 w-10 max-md:min-h-target-lg max-md:min-w-target-lg',
              // The confirm step covers the panel: its two answers are the only way on.
              '[[data-sheet-confirm]>&]:hidden',
            )}
          >
            <X className="h-icon-md w-icon-md" aria-hidden="true" />
            <span className="sr-only">{l.close}</span>
          </SheetPrimitive.Close>
          <SheetStepsContext.Provider value={steps}>
            <SheetStateContext.Provider value={state}>
              <AutosaveScopeContext.Provider value={statusScope}>{children}</AutosaveScopeContext.Provider>
            </SheetStateContext.Provider>
            {discardGuard && (
              <SheetConfirm
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                title={discardTitle ?? l.sheetDiscardTitle}
                description={discardDescription ?? l.sheetDiscardDescription}
                confirmLabel={l.sheetDiscard}
                cancelLabel={l.sheetKeepEditing}
                tone="destructive"
                onConfirm={() => {
                  setDiscardOpen(false);
                  nav?.close();
                }}
              />
            )}
          </SheetStepsContext.Provider>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

// A docked sheet that lies over the page instead of beside it (a phone, high zoom, a page that is not pushed) hides page controls: it then keeps Tab inside like a modal sheet and is announced as modal (UX-PKG5-01). Decided at the page Tab stops, not at the sheet width.
function coversPage(node: HTMLElement): boolean {
  const viewport = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth);
  if (node.offsetWidth > 0 && node.offsetWidth >= viewport - 1) return true;
  return hidesPageTabbable(node);
}

function useCoversPage(node: HTMLElement | null): [boolean, (covers: boolean) => void] {
  const [covers, setCovers] = React.useState(false);
  React.useEffect(() => {
    if (!node) {
      setCovers(false);
      return;
    }
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCovers(coversPage(node)));
    };
    // Only the sheet's own slide-in counts: hover and state transitions of its content bubble up here and never move the sheet
    const own = (event: Event) => {
      if (event.target === node) update();
    };
    update();
    window.addEventListener('resize', update);
    // The slide-in transform and a pushed page change the overlap without resizing the sheet.
    node.addEventListener('animationend', own);
    node.addEventListener('transitionend', own);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(node);
    observer?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      node.removeEventListener('animationend', own);
      node.removeEventListener('transitionend', own);
      observer?.disconnect();
    };
  }, [node]);
  return [covers, setCovers];
}

// Focus guards and other layers, which the page Tab rule of a covering sheet leaves alone.
const OTHER_LAYER = '[data-radix-focus-guard], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]';

// Tab order of a docked sheet beside the visible page (UX-PKG5-03, A11Y-PKG5-01): the sheet follows its opener (opener, sheet, next page element), the last page element leaves the document instead of running into the sheet at the end of body, Shift+Tab mirrors it. No trap, no loop.
function useDockedTabOrder(contentRef: React.RefObject<HTMLElement | null>, openerRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;
    const docked = () => {
      const root = contentRef.current;
      const opener = openerRef.current;
      if (!root?.isConnected || !opener?.isConnected || root.contains(opener) || coversPage(root)) return null;
      return { root, opener };
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      // A sheet over the page hides the page controls: Tab from the page goes into the sheet, like a modal sheet (UX-PKG5-01). Focus in another layer (a second sheet, a popover) is left alone.
      const root = contentRef.current;
      if (root?.isConnected && target instanceof HTMLElement && !root.contains(target) && !target.closest(OTHER_LAYER) && coversPage(root)) {
        const inside = tabbables(root);
        if (inside.length === 0) return;
        event.preventDefault();
        (event.shiftKey ? inside[inside.length - 1] : inside[0]).focus();
        return;
      }
      const state = docked();
      if (!state || !(target instanceof HTMLElement) || state.root.contains(target)) return;
      const inside = tabbables(state.root);
      if (inside.length === 0) return;
      if (event.shiftKey) {
        if (target !== pageTabTarget(state.root, state.opener, true)) return;
        event.preventDefault();
        inside[inside.length - 1].focus();
      } else if (target === state.opener) {
        event.preventDefault();
        inside[0].focus();
      } else if (nextTabIsInside(state.root, target)) {
        skipOnce(state.root);
      }
    };
    // Shift+Tab from the browser bar enters at the end of body (a focus guard after the sheet): hand it to the last page element.
    const onFocusIn = (event: FocusEvent) => {
      const state = docked();
      if (!state || event.relatedTarget || !(event.target instanceof Element) || !isTrailingGuard(state.root, event.target)) return;
      lastPageTabbableBefore(state.root)?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [contentRef, openerRef, enabled]);
}

// Swipe down on the grabber of a bottom sheet. The panel follows the finger; let go past a quarter of its height (at most 120px) and it closes through requestClose (the discard guard asks first), otherwise it springs back.
function useSheetSwipe(panelRef: React.RefObject<HTMLElement | null>, requestClose: () => void) {
  const drag = React.useRef<{ id: number; start: number; dy: number } | null>(null);
  const reset = (panel: HTMLElement | null, animate: boolean) => {
    if (!panel) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panel.style.transition = animate && !reduce ? 'transform 200ms ease-out' : '';
    panel.style.transform = '';
  };
  return {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      drag.current = { id: event.pointerId, start: event.clientY, dy: 0 };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      const panel = panelRef.current;
      if (!state || state.id !== event.pointerId || !panel) return;
      state.dy = Math.max(0, event.clientY - state.start);
      panel.style.transition = 'none';
      panel.style.transform = `translateY(${state.dy}px)`;
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      drag.current = null;
      const panel = panelRef.current;
      if (!state || state.id !== event.pointerId) return;
      const limit = Math.min(120, (panel?.offsetHeight ?? 0) / 4);
      reset(panel, true);
      if (state.dy > limit) requestClose();
    },
    onPointerCancel: () => {
      drag.current = null;
      reset(panelRef.current, true);
    },
  };
}

interface SheetConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The question, e.g. "Delete stage?".
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel: string;
  // Defaults to the provider text for Cancel.
  cancelLabel?: string;
  // `destructive` paints the confirm button red and puts the first focus on Cancel.
  tone?: 'default' | 'destructive';
  onConfirm: () => void;
  // Work in progress: only the confirm button is busy and blocked, Cancel stays available.
  pending?: boolean;
}

// Confirmation as a step in the same sheet (phone rule: one modal layer, no dialog over a sheet). It covers the whole panel with the question and two answers; Escape and Cancel go back to the sheet, focus returns to where it was.
const SheetConfirm = ({ open, onOpenChange, title, description, confirmLabel, cancelLabel, tone = 'default', onConfirm, pending = false }: SheetConfirmProps) => {
  const steps = React.useContext(SheetStepsContext);
  const l = useLabels({ cancel: cancelLabel });
  const zero = usePreset() === 'zero';
  const titleId = React.useId();
  const descriptionId = React.useId();
  const layerRef = React.useRef<HTMLDivElement | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmRef = React.useRef<HTMLButtonElement | null>(null);
  const node = steps?.node ?? null;
  useSheetEscape(open, () => {
    onOpenChange(false);
    return true;
  });
  useIsoLayoutEffect(() => {
    if (!open || !node) return undefined;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Everything else in the panel is inert while the step is open: Tab stays on the two answers.
    const made: HTMLElement[] = [];
    Array.from(node.children).forEach((child) => {
      if (!(child instanceof HTMLElement) || child === layerRef.current || child.inert) return;
      child.inert = true;
      made.push(child);
    });
    node.setAttribute('data-sheet-confirm', '');
    (tone === 'destructive' ? cancelRef.current : confirmRef.current ?? cancelRef.current)?.focus({ preventScroll: true });
    return () => {
      made.forEach((child) => {
        child.inert = false;
      });
      node.removeAttribute('data-sheet-confirm');
      if (before?.isConnected && !before.closest('[inert]')) before.focus({ preventScroll: true });
      else node.focus({ preventScroll: true });
    };
  }, [open, node]);
  if (!open || !node) return null;
  return createPortal(
    <div
      ref={layerRef}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-slot="sheet-confirm"
      className={cn(
        'absolute inset-0 z-chrome flex flex-col rounded-[inherit] bg-background',
        'animate-in fade-in-0 slide-in-from-right-8 duration-200 motion-reduce:animate-none',
      )}
    >
      <div className="flex items-center border-0 border-b border-solid border-hairline py-4 pl-5 pr-5">
        <h2 id={titleId} className={cn('m-0 min-w-0', zero ? 'typography-sheet-title' : 'text-base font-semibold', 'text-foreground')}>
          {title}
        </h2>
      </div>
      {description && (
        <p id={descriptionId} className={cn('m-0 px-5 py-4', zero ? 'typography-ui-relaxed' : 'text-sm', 'text-text-subtle')}>
          {description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-end gap-2 border-0 border-t border-solid border-hairline px-5 py-3">
        <Button ref={cancelRef} type="button" variant="ghost" className="max-md:min-h-target-lg" onClick={() => onOpenChange(false)}>
          {l.cancel}
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          variant={tone === 'destructive' ? 'destructive' : 'primary'}
          className="max-md:min-h-target-lg"
          loading={pending}
          disabled={pending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>,
    node,
  );
};
SheetConfirm.displayName = 'SheetConfirm';

interface SheetStagesValue {
  stack: string[];
  direction: 'forward' | 'back';
  labels: React.MutableRefObject<Record<string, string>>;
  push: (id: string) => void;
  back: () => void;
  reset: () => void;
}
const SheetStagesContext = React.createContext<SheetStagesValue | null>(null);

interface SheetStagesProps {
  // Id of the first stage, the sheet itself. Defaults to the id of the first SheetStage child.
  root?: string;
  // Reports the stage in front and the stack after every push and back.
  onStageChange?: (stage: string, stack: string[]) => void;
  children: React.ReactNode;
}

// Push navigation inside one sheet (phone rule: a sub task such as picking a status slides in within the same sheet, no sheet over a sheet). Escape and the back button go one stage back before the sheet closes.
const SheetStages = ({ root: rootProp, onStageChange, children }: SheetStagesProps) => {
  const firstId = React.useMemo(() => {
    let found: string | undefined;
    React.Children.forEach(children, (child) => {
      if (!found && React.isValidElement<{ id?: string }>(child) && typeof child.props.id === 'string') found = child.props.id;
    });
    return found;
  }, [children]);
  const root = rootProp ?? firstId ?? 'root';
  const [stack, setStack] = React.useState<string[]>([root]);
  const [direction, setDirection] = React.useState<'forward' | 'back'>('forward');
  const labels = React.useRef<Record<string, string>>({});
  const changeRef = React.useRef(onStageChange);
  changeRef.current = onStageChange;
  const update = React.useCallback((next: string[], dir: 'forward' | 'back') => {
    setDirection(dir);
    setStack(next);
    changeRef.current?.(next[next.length - 1], next);
  }, []);
  const value = React.useMemo<SheetStagesValue>(
    () => ({
      stack,
      direction,
      labels,
      push: (id) => {
        if (stack[stack.length - 1] !== id) update([...stack.filter((s) => s !== id), id], 'forward');
      },
      back: () => {
        if (stack.length > 1) update(stack.slice(0, -1), 'back');
      },
      reset: () => {
        if (stack.length > 1) update([stack[0]], 'back');
      },
    }),
    [stack, direction, update],
  );
  useSheetEscape(stack.length > 1, () => {
    value.back();
    return true;
  });
  return <SheetStagesContext.Provider value={value}>{children}</SheetStagesContext.Provider>;
};
SheetStages.displayName = 'SheetStages';

// Stage in front, depth (0 on the root), push, back and reset of the nearest SheetStages.
function useSheetStages() {
  const ctx = React.useContext(SheetStagesContext);
  if (!ctx) throw new Error('useSheetStages must be used inside SheetStages');
  return { stage: ctx.stack[ctx.stack.length - 1], depth: ctx.stack.length - 1, push: ctx.push, back: ctx.back, reset: ctx.reset };
}

interface SheetStageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'id'> {
  id: string;
  // Title in the stage header (pushed stages). The root stage brings its own SheetHeader.
  title?: React.ReactNode;
  // Plain text of the title for the back button name ("Back to Task"). Defaults to `title` when that is a string.
  label?: string;
  // Right side of the stage header, before the close button, e.g. an AutosaveStatus.
  headerEnd?: React.ReactNode;
}

// One stage of SheetStages. The root stage shows its children as they are; a pushed stage gets a 52px header with a 44px back button and its title. Stages under the front one stay mounted but hidden and inert, so their input survives a push.
const SheetStage = React.forwardRef<HTMLDivElement, SheetStageProps>(({ id, title, label, headerEnd, className, children, ...props }, ref) => {
  const ctx = React.useContext(SheetStagesContext);
  const l = useLabels();
  const zero = usePreset() === 'zero';
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);
  const plain = label ?? (typeof title === 'string' ? title : undefined);
  if (ctx && plain) ctx.labels.current[id] = plain;
  const index = ctx ? ctx.stack.indexOf(id) : 0;
  const front = ctx ? index === ctx.stack.length - 1 : true;
  const isRoot = ctx ? ctx.stack[0] === id : true;
  const parent = ctx && index > 0 ? ctx.stack[index - 1] : undefined;
  const parentLabel = parent ? ctx?.labels.current[parent] : undefined;
  const wasFront = React.useRef(front);
  useIsoLayoutEffect(() => {
    const entering = front && !wasFront.current;
    const leaving = !front && wasFront.current;
    wasFront.current = front;
    // Leaving by a push: remember the control that pushed, so back can return focus to it.
    if (leaving && ctx?.direction === 'forward') openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!entering) return;
    if (ctx?.direction === 'forward' && !isRoot) headingRef.current?.focus({ preventScroll: true });
    if (ctx?.direction === 'back') {
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else headingRef.current?.focus({ preventScroll: true });
    }
  }, [front]);
  if (index === -1) return null;
  const headingId = `${id}-stage-title`;
  return (
    <div
      ref={ref}
      data-slot="sheet-stage"
      data-stage={id}
      data-stage-front={front || undefined}
      role={isRoot ? undefined : 'group'}
      aria-labelledby={isRoot ? undefined : headingId}
      hidden={!front}
      {...(!front ? { inert: '' } : {})}
      className={cn(
        front && isRoot && 'contents',
        front && !isRoot && 'flex min-h-0 flex-1 flex-col',
        front && ctx && ctx.stack.length > 1 && 'animate-in fade-in-0 duration-200 motion-reduce:animate-none',
        front && ctx?.direction === 'forward' && !isRoot && 'slide-in-from-right-8',
        front && ctx?.direction === 'back' && 'slide-in-from-left-8',
        className,
      )}
      {...props}
    >
      {!isRoot && (
        <div data-slot="sheet-stage-header" className="flex shrink-0 items-center gap-1 border-0 border-b border-solid border-hairline py-1 pl-2 pr-16">
          <Button type="button" variant="ghost" size="icon" className="min-h-target-lg min-w-target-lg shrink-0" aria-label={parentLabel ? l.backTo(parentLabel) : l.back} onClick={() => ctx?.back()}>
            <ChevronLeft className="h-icon-md w-icon-md" aria-hidden="true" />
          </Button>
          <h2 ref={headingRef} id={headingId} tabIndex={-1} className={cn('m-0 min-w-0 flex-1 truncate outline-none', zero ? 'typography-sheet-title' : 'text-base font-semibold', 'text-foreground')}>
            {title}
          </h2>
          {headerEnd}
        </div>
      )}
      {children}
    </div>
  );
});
SheetStage.displayName = 'SheetStage';

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `zero` is the compact record header: bottom hairline, own padding (use with `padded={false}`). */
  variant?: 'default' | 'zero';
}

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(({ className, variant: variantProp, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const variant = variantProp ?? (zero ? 'zero' : 'default');
  const stickyRef = useStickyInset<HTMLDivElement>('top', ref);
  return (
    <div
      data-slot="sheet-header"
      ref={stickyRef}
      className={cn(
        'flex flex-col text-left',
        // Theme header band (kette-tokens 5.26.0 image-sheet-header, bevel-sheet-header), none by default
        'bg-[image:var(--image-sheet-header)] shadow-[shadow:var(--bevel-sheet-header)]',
        // The close button sits at the top right (12px from the edge, 40px wide): the header keeps its content clear of it, so a long title wraps before it.
        variant === 'zero' ? 'gap-2 border-0 border-b border-solid border-hairline py-4 pl-5 pr-16' : 'space-y-2 pr-10',
        className,
      )}
      {...props}
    />
  );
});
SheetHeader.displayName = 'SheetHeader';

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  // Footer of a form sheet, one row: the one destructive action far left, then Cancel, Back and exactly one primary button. Cancel is `ghost` in a sheet (it is `outline` in a dialog, see DialogFooter and ConfirmDialog). The footer shows no save status of its own for list entries; autosave and draft hints belong to the sheet header.
  /** `zero` is the 56px action footer with a top hairline: status on the left, actions on the right. */
  variant?: 'default' | 'zero';
  // Retry of the default status, for the error and offline states. A status handed over by `statusPlacement="footer"` brings its own.
  onRetry?: () => void;
  retryLabel?: string;
  /** Zero footer only. Left side status, defaults to the autosave status derived from the sheet state (also for `undefined` and `null`). `false` switches the status off: nothing is drawn on the left and the sheet keeps any status placed elsewhere. */
  status?: React.ReactNode;
  /** Zero footer only. Secondary action on the left (for example "Download error list"), shown instead of the status. */
  leftAction?: React.ReactNode;
}

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(({ className, variant: variantProp, status, leftAction, onRetry, retryLabel, children, ...props }, ref) => {
  const state = React.useContext(SheetStateContext);
  const scope = React.useContext(AutosaveScopeContext);
  const setFooterShown = scope?.setFooterShown;
  const stickyRef = useStickyInset<HTMLDivElement>('bottom', ref, { place: 'auto' });
  const zero = usePreset() === 'zero';
  const variant = variantProp ?? (zero ? 'zero' : 'default');
  // Only the zero footer draws the status; while it is mounted the sheet may hide every other status.
  const statusOff = status === false;
  const shows = variant === 'zero' && !leftAction && !status && !statusOff;
  React.useLayoutEffect(() => {
    if (!setFooterShown || !shows) return undefined;
    setFooterShown(true);
    return () => setFooterShown(false);
  }, [setFooterShown, shows]);
  if (variant === 'zero') {
    return (
      <div
        ref={stickyRef}
        className={cn(
          'flex min-h-sheet-footer items-center gap-2 border-0 border-t border-solid border-hairline px-5 py-3',
          className,
        )}
        {...props}
      >
        <AutosaveScopeContext.Provider value={null}>
          {leftAction ??
            (statusOff
              ? null
              : status ?? (
                  <AutosaveStatus
                    state={scope?.handed?.state ?? (state === 'dirty' ? 'dirty' : state === 'error' ? 'error' : 'saved')}
                    label={scope?.handed?.label}
                    onRetry={onRetry ?? scope?.handed?.onRetry}
                    retryLabel={retryLabel ?? scope?.handed?.retryLabel}
                  />
                ))}
        </AutosaveScopeContext.Provider>
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    );
  }
  return (
    <div ref={stickyRef} className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props}>
      {children}
    </div>
  );
});
SheetFooter.displayName = 'SheetFooter';

interface SheetTitleProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> {
  /** `zero` uses the sheet title type role. */
  variant?: 'default' | 'zero';
}

const SheetTitle = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Title>, SheetTitleProps>(
  ({ className, variant: variantProp, ...props }, ref) => {
    const zero = usePreset() === 'zero';
  const variant = variantProp ?? (zero ? 'zero' : 'default');
    return (
      <SheetPrimitive.Title
        data-slot="sheet-title"
        ref={ref}
        className={cn(
          variant === 'zero' ? 'typography-sheet-title text-foreground' : 'text-base font-semibold tracking-[-0.01em] text-foreground',
          displayVoice,
          className,
        )}
        {...props}
      />
    );
  },
);
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <SheetPrimitive.Description
      ref={ref}
      className={cn(zero ? 'typography-ui-relaxed text-text-subtle' : 'text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// Top row of the zero header: path on the left, room on the right for the close button and the Esc hint.
const SheetPath = ({
  className,
  showEscHint = true,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showEscHint?: boolean }) => (
  <div className={cn('typography-ui-sm flex items-center gap-2 pr-8 text-text-subtle-on-muted', className)} {...props}>
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {showEscHint && (
      <kbd className="typography-text-extra-small rounded-item bg-muted px-1 font-sans text-text-muted" aria-hidden>
        Esc
      </kbd>
    )}
  </div>
);
SheetPath.displayName = 'SheetPath';

// Meta row under the title: autosave status plus facts such as counts. Separators are drawn between children.
const SheetMeta = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('typography-ui flex flex-wrap items-center gap-2 text-text-subtle-on-muted', className)} {...props} />
);
SheetMeta.displayName = 'SheetMeta';

interface SheetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Overrides the state taken from SheetContent. */
  state?: SheetState;
  /** Error state: message under the error icon. */
  errorMessage?: React.ReactNode;
  /** Error state: renders the Try again button. */
  onRetry?: () => void;
  // Deprecated: use retryText.
  retryLabel?: string;
  // Visible texts of the error state and the loading name. Win over the provider text.
  retryText?: string;
  errorText?: React.ReactNode;
  loadingLabel?: string;
}

// Scrollable body. Renders the children, skeleton rows while loading, or an error block with retry.
const SheetBody = React.forwardRef<HTMLDivElement, SheetBodyProps>(
  (
    { className, state: stateProp, errorMessage: errorMessageProp, errorText, onRetry, retryLabel: retryLabelProp, retryText, loadingLabel, children, ...props },
    ref,
  ) => {
    const l = useLabels({ loading: loadingLabel });
    const errorMessage = errorText ?? errorMessageProp ?? l.sheetLoadError;
    const retryLabel = retryText ?? retryLabelProp ?? l.tryAgain;
    const contextState = React.useContext(SheetStateContext);
    const state = stateProp ?? contextState;
    return (
      <div
        ref={ref}
        data-slot="sheet-body"
        data-state={state}
        aria-busy={state === 'loading' || undefined}
        // `focusOnOpen={false}` focuses the body so the keyboard scrolls it: no ring for that focus (data-sheet-autofocus), the inset ring for a later Tab onto a body of text.
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-inset focus-visible:ring-ring-default [&[data-sheet-autofocus]:focus-visible]:ring-0',
          scrollInsetClasses,
          className,
        )}
        {...props}
      >
        {state === 'loading' ? (
          <div role="status" aria-label={l.loading} className="flex flex-col gap-4 p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : state === 'error' ? (
          <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center">
            <AlertCircle className="h-icon-lg w-icon-lg text-icon-destructive" aria-hidden />
            <p className="typography-ui-semibold m-0 text-text-default">{errorMessage}</p>
            {onRetry && (
              <Button type="button" variant="outline" size="control-sm" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    );
  },
);
SheetBody.displayName = 'SheetBody';

interface SheetSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  // Heading element of the title, so the sheet fits the document outline. Default h3.
  titleAs?: HeadingTag;
  description?: React.ReactNode;
}

// Content slot section: label, helper text and a field area. Sections are separated by a hairline.
const SheetSection = React.forwardRef<HTMLElement, SheetSectionProps>(
  ({ className, title, titleAs: Title = 'h3', description, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('flex flex-col gap-2 border-0 border-b border-solid border-hairline px-5 py-4 last:border-b-0', className)}
      {...props}
    >
      {title && <Title className="typography-ui-medium m-0 text-text-default">{title}</Title>}
      {description && <p className="typography-ui m-0 text-text-subtle-on-muted">{description}</p>}
      {children}
    </section>
  ),
);
SheetSection.displayName = 'SheetSection';

const sheetBannerVariants = cva('flex items-start gap-2 border-0 border-solid px-5 py-3 typography-ui text-text-default', {
  variants: {
    tone: {
      default: 'bg-muted',
      neutral: 'bg-muted',
      primary: 'bg-background-brand-subtle',
      info: 'bg-background-info-subtle',
      success: 'bg-background-success-subtle',
      warning: 'bg-background-warning-subtle',
      error: 'bg-background-destructive-subtle',
    },
    position: {
      top: 'border-b border-hairline',
      bottom: 'border-t border-hairline',
    },
  },
  defaultVariants: { tone: 'default', position: 'top' },
});

const sheetBannerIconTone: Record<NonNullable<VariantProps<typeof sheetBannerVariants>['tone']>, string> = {
  default: 'text-icon-default',
  neutral: 'text-icon-default',
  primary: 'text-icon-default',
  info: 'text-icon-default',
  success: 'text-icon-default',
  warning: 'text-icon-default',
  error: 'text-icon-destructive',
};

interface SheetBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof sheetBannerVariants> {
  // Optional leading icon, decorative.
  icon?: React.ReactNode;
}

// Banner strip inside a sheet (Figma Slide out menu Banner). Place it first in the content for `top` and last for `bottom`.
const SheetBanner = React.forwardRef<HTMLDivElement, SheetBannerProps>(
  ({ className, tone, position, icon, role, children, ...props }, ref) => {
    const resolvedTone = tone ?? 'default';
    return (
      <div
        ref={ref}
        role={role ?? (resolvedTone === 'error' || resolvedTone === 'warning' ? 'alert' : 'status')}
        data-tone={resolvedTone}
        data-position={position ?? 'top'}
        className={cn(sheetBannerVariants({ tone, position }), className)}
        {...props}
      >
        {icon && (
          <span aria-hidden className={cn('flex shrink-0 [&>svg]:h-icon-md [&>svg]:w-icon-md', sheetBannerIconTone[resolvedTone])}>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  },
);
SheetBanner.displayName = 'SheetBanner';

type SheetCodeBlockProps = Omit<CodeSnippetProps, 'variant'>;

// Code block row of the sheet (Figma Sheet block Code block): label on the left, copy action on the right.
const SheetCodeBlock = React.forwardRef<HTMLDivElement, SheetCodeBlockProps>(
  ({ className, label, lineNumbers = false, ...props }, ref) => {
    const l = useLabels();
    return (
      <CodeSnippet
        ref={ref}
        variant="block"
        label={label ?? l.code}
        lineNumbers={lineNumbers}
        className={cn('mx-5 my-4 w-auto', className)}
        {...props}
      />
    );
  },
);
SheetCodeBlock.displayName = 'SheetCodeBlock';

// The element a `#hash` href points to, or null. A malformed percent sequence falls back to the raw id.
function hashTarget(href: string): HTMLElement | null {
  let id = href.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep the raw id
  }
  return id ? document.getElementById(id) : null;
}

// Scrolls to the section and moves focus to it, so keyboard and screen reader users arrive where the page moved. The hash joins the history like a normal anchor click.
function jumpTo(target: HTMLElement, href: string) {
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A section is not focusable by itself: it gets tabindex -1 for as long as it holds focus.
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }
  // Push first: the browser stores the scroll position of the page we leave when the entry is added, so Back must find it unmoved (a cookie card that scrolls on focus would otherwise save the wrong position). A jump to the hash that is already current adds no history entry, like a native anchor.
  if (window.location.hash !== href) window.history.pushState(null, '', href);
  watchPopstate();
  // Focus, then scroll last: a focus listener on the page (such as the cookie banner keeping focus clear of its edge) may scroll, and the jump must have the final word so `scroll-mt-*` and `scroll-padding` decide where the section lands.
  target.focus({ preventScroll: true });
  target.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

let popstateWatched = false;

// After Back or Forward to a jump entry the browser restores the scroll position but leaves focus on the body: the section gets focus again, like after the jump itself.
function watchPopstate() {
  if (popstateWatched || typeof window === 'undefined') return;
  popstateWatched = true;
  window.addEventListener('popstate', () => {
    const target = window.location.hash ? hashTarget(window.location.hash) : null;
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
  });
}

interface SheetNavLinkProps extends LinkProps {
  // Replaces the default scroll and focus. Runs once the sheet is completely gone (scrim removed, scroll lock released, focus back on the opener). `target` is the element for a `#hash` href, or null.
  onNavigate?: (info: { href: string; target: HTMLElement | null }) => void;
  // `link` (default) is the brand link, underlined. `nav` is a navigation entry: it takes the foreground text token (not the browser or brand link colour), regular weight, shows the underline on hover and keeps it for the current page (`aria-current`), so a nav list needs no colour or underline overrides.
  variant?: 'link' | 'nav';
  // Also closes the sheet for a plain click this link does not handle itself (a route, another page, a click that your `onClick` already handled with `preventDefault`). Modified clicks and links with a `target` keep the sheet open. Default false.
  closeOnNavigate?: boolean;
}

// Link inside a sheet that closes the sheet and then goes to a section of the page: it closes, waits until the scroll lock is released, scrolls and focuses the section. Give the section `scroll-mt-*` when a fixed header covers the top of the page. Without `onNavigate` it handles `#hash` hrefs whose element exists. Other hrefs, a missing element, modified clicks (new tab) and links with a `target` stay normal links and keep the sheet open (unless `closeOnNavigate`).
const SheetNavLink = React.forwardRef<HTMLAnchorElement, SheetNavLinkProps>(({ href, onClick, onNavigate, target: linkTarget, className, underline, color, weight, variant = 'link', closeOnNavigate = false, ...props }, ref) => {
  const nav = React.useContext(SheetNavContext);
  const navVariant = variant === 'nav';
  return (
    <Link
      ref={ref}
      href={href}
      target={linkTarget}
      color={navVariant ? 'inherit' : color}
      underline={underline ?? (navVariant ? 'hover' : 'always')}
      weight={weight ?? (navVariant ? 'regular' : undefined)}
      className={cn('h-control-md justify-start', navVariant && 'text-foreground aria-[current]:underline', className)}
      onClick={(event) => {
        onClick?.(event);
        if (!href) return;
        const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!linkTarget || linkTarget === '_self');
        if (event.defaultPrevented) {
          // Your own handler took over (a router push): the sheet still has to go when asked to.
          if (closeOnNavigate && plain) nav?.close();
          return;
        }
        const isHash = href.startsWith('#');
        if (!plain || !(onNavigate || (isHash && hashTarget(href)))) {
          if (closeOnNavigate && plain) nav?.close();
          return;
        }
        event.preventDefault();
        // The target is looked up again when the sheet is gone: it may render later than the click.
        const go = () => {
          const target = isHash ? hashTarget(href) : null;
          if (onNavigate) onNavigate({ href, target });
          else if (target) jumpTo(target, href);
        };
        if (!nav) {
          go();
          return;
        }
        const queue = nav.afterClose.current;
        queue.push(go);
        nav.close();
        // A parent that vetoes the close keeps the sheet open: the jump must not run at some later close.
        const link = event.currentTarget;
        setTimeout(() => {
          if (link.isConnected && link.closest('[data-state="open"]')) {
            const index = queue.indexOf(go);
            if (index >= 0) queue.splice(index, 1);
          }
        }, 0);
      }}
      {...props}
    />
  );
});
SheetNavLink.displayName = 'SheetNavLink';

export {
  SheetBanner,
  SheetCodeBlock,
  type SheetBannerProps,
  type SheetCodeBlockProps,
  SheetBody,
  SheetMeta,
  SheetNavLink,
  type SheetNavLinkProps,
  SheetPath,
  SheetSection,
  type SheetBodyProps,
  type SheetContentProps,
  type SheetFooterProps,
  type SheetInset,
  type SheetHeaderProps,
  type SheetMode,
  type SheetSectionProps,
  type SheetSize,
  type SheetState,
  type SheetTitleProps,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  SheetConfirm,
  type SheetConfirmProps,
  SheetStages,
  type SheetStagesProps,
  SheetStage,
  type SheetStageProps,
  useSheetStages,
};
