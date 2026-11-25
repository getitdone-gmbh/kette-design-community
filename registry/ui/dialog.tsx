'use client';

import { OpenerCapture, useReturnFocusFallback } from '@/lib/return-focus';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { MODAL_OVERLAY_ATTRIBUTE, useAfterModalClose, useModalInertRef } from '@/lib/modal-inert';
import { EscapeGuardContext, guardNestedEscape, useGuardedOpen } from '@/lib/nested-layer';
import { INSET_SCOPE_ATTRIBUTE, scrollInsetClasses, useStickyInset } from '@/lib/sticky-inset';
import { displayVoice } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { AutosaveScopeReset } from '@/components/ui/autosave-scope';
import { useLabels, usePreset } from '@/components/ui/labels-context';

// Remembers the modal flag so DialogContent can make the page behind inert only for modal dialogs.
const DialogModalContext = React.createContext(true);

const Dialog = ({ open, defaultOpen, onOpenChange, modal = true, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) => {
  const state = useGuardedOpen({ open, defaultOpen, onOpenChange });
  return (
    <DialogModalContext.Provider value={modal}>
      <EscapeGuardContext.Provider value={state.guard}>
        <DialogPrimitive.Root open={state.open} onOpenChange={state.onOpenChange} modal={modal} {...props} />
      </EscapeGuardContext.Provider>
    </DialogModalContext.Provider>
  );
};
Dialog.displayName = 'Dialog';

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// Native fields plus the ARIA form controls that Radix renders as buttons (radio, checkbox, switch) and other value widgets.
const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="searchbox"]',
  '[role="spinbutton"]',
  '[role="slider"]',
  'button[role="radio"]:not([disabled])',
  'button[role="checkbox"]:not([disabled])',
  'button[role="switch"]:not([disabled])',
].join(', ');
const FOCUSABLE_SELECTOR = `${FIELD_SELECTOR}, a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"]):not([data-slot="dialog-body"])`;

const isUsable = (el: HTMLElement) => el.getAttribute('aria-disabled') !== 'true' && !el.closest('[hidden], [aria-hidden="true"], [inert]');

// Radio groups have a single tab stop: the checked item, else the first. Skip the others so focus lands where Tab would.
const isRadioTabStop = (el: HTMLElement, root: ParentNode) => {
  if (el instanceof HTMLInputElement && el.type === 'radio') {
    if (el.checked || !el.name) return true;
    const group = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter((radio) => radio.name === el.name && radio.form === el.form);
    return !group.some((radio) => radio.checked);
  }
  if (el.getAttribute('role') === 'radio') {
    // Radix keeps every item at tabindex -1 until focus has entered the group, so fall back to the first item.
    const group = el.closest('[role="radiogroup"]') ?? root;
    const items = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]')).filter((item) => !item.hasAttribute('disabled') && isUsable(item));
    const stop = items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items.find((item) => item.getAttribute('tabindex') !== '-1') ?? items[0];
    return el === stop;
  }
  return true;
};

// First form control in DOM order inside `scope`. It wins over tabs, links and buttons, even when those come earlier.
const firstControl = (scope: HTMLElement) =>
  Array.from(scope.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).find((el) => isUsable(el) && isRadioTabStop(el, scope)) ?? null;

// Initial focus for a dialog: the scrolling body never takes it. Priority: first form control in the body, then in the rest of the panel, then the first other focusable, then the panel.
// Without a body this only applies when `firstField` is set, otherwise Radix keeps its default (first tabbable).
const focusInitial = (event: Event, firstField: boolean) => {
  const content = event.target as HTMLElement | null;
  const body = content?.querySelector<HTMLElement>('[data-slot="dialog-body"]') ?? null;
  if (!content || (!body && !firstField)) return;
  const control = (body ? firstControl(body) : null) ?? firstControl(content);
  if (!body && !control) return;
  event.preventDefault();
  const target = control ?? Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).find((el) => el !== body) ?? content;
  // preventScroll: a panel that scrolls as a whole (short windows) must open at the top, not scrolled to a footer button
  target.focus({ preventScroll: true });
  // A form control that opens partly under a sticky footer is brought into view (A11Y-K2-02). Buttons are not: the panel must open at the top, not scrolled to a footer action.
  if (control) target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
};

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      {...{ [MODAL_OVERLAY_ATTRIBUTE]: '' }}
      className={cn(
        'fixed inset-0 z-dialog duration-base motion-reduce:animate-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        zero ? 'bg-overlay-scrim' : 'bg-overlay',
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Panel widths from the sheet size tokens: sm 440, md 520, lg 640, xl 900. Omit `size` for the original max-w-lg panel.
const dialogSizeWidth = {
  sm: 'max-w-sheet-sm',
  md: 'max-w-sheet-md',
  lg: 'max-w-sheet-lg',
  xl: 'max-w-sheet-xl',
} as const;

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: keyof typeof dialogSizeWidth;
  // Long content: the panel stops scrolling as a whole. Put the content in DialogBody (scrolls) and keep DialogHeader and DialogFooter outside it (they stay in view).
  scrollable?: boolean;
  // Hides the corner close button, for confirm dialogs whose footer already closes them.
  hideClose?: boolean;
  // Accessible name of the close button. Wins over the provider text.
  closeLabel?: string;
  // Extra classes for the corner close button, for example a `top-*` that centres it on a search row.
  closeClassName?: string;
  // `first-field` moves initial focus to the first form control (input, select, textarea, radio, checkbox, switch) in DOM order, before tabs, links and buttons, also in dialogs without DialogBody. Default `auto` keeps the Radix default for those dialogs. A `scrollable` DialogBody always uses this priority.
  initialFocus?: 'auto' | 'first-field';
  // `alertdialog` is for a dialog that interrupts to ask for an answer (confirm, discard, delete). It sets role="alertdialog", keeps focus trapped, starts focus on the element marked `data-autofocus` (put it on the safe action, usually Cancel) and is not closed by a click outside, so the user has to answer or press Escape. Default `dialog`.
  role?: 'dialog' | 'alertdialog';
  // Runs once the dialog is completely gone: exit animation done, page no longer inert, scroll lock released and focus returned to the opener.
  onAfterClose?: () => void;
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, size: sizeProp, scrollable = false, hideClose = false, closeLabel, closeClassName, initialFocus = 'auto', role = 'dialog', onAfterClose, onOpenAutoFocus, onEscapeKeyDown, onCloseAutoFocus, onInteractOutside, onKeyDown, ...props }, ref) => {
  const returnFocus = useReturnFocusFallback(onCloseAutoFocus);
  const l = useLabels({ close: closeLabel });
  const zero = usePreset() === 'zero';
  const escapeGuard = React.useContext(EscapeGuardContext);
  // A modal dialog makes everything outside its portal inert while it is open, see lib/modal-inert.
  const inertRef = useModalInertRef<HTMLDivElement>(React.useContext(DialogModalContext));
  const afterClose = useAfterModalClose<HTMLDivElement>(onAfterClose);
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      inertRef(node);
      afterClose.capture(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [inertRef, afterClose, ref],
  );
  // Zero: confirm width (440) unless a size is given.
  const size = sizeProp ?? (zero ? 'sm' : undefined);
  return (
  <DialogPortal>
    {/* A press on the scrim of an alert dialog must not move focus out of it. */}
    <DialogOverlay onMouseDown={role === 'alertdialog' ? (event) => event.preventDefault() : undefined} />
    <DialogPrimitive.Content
      data-slot="dialog-content"
      data-dialog-scrollable={scrollable ? '' : undefined}
      ref={setRefs}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        if (event.defaultPrevented) return;
        // An alert dialog starts on its safe action: the element marked data-autofocus.
        const safe = role === 'alertdialog' ? (event.target as HTMLElement | null)?.querySelector<HTMLElement>('[data-autofocus]') : null;
        if (safe) {
          event.preventDefault();
          safe.focus();
          return;
        }
        focusInitial(event, initialFocus === 'first-field');
      }}
      onInteractOutside={(event) => {
        onInteractOutside?.(event);
        // The user has to answer an alert dialog: a click outside does not close it.
        if (role === 'alertdialog') event.preventDefault();
      }}
      role={role}
      onCloseAutoFocus={(event) => {
        returnFocus.onCloseAutoFocus(event);
        afterClose.run();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // Radix FocusScope wraps Tab from the last to the first control with preventScroll, so a first field that scrolled out of the panel or its body stays out of view (KETTE-94 UX note). A normal Tab already scrolls the browser, so this is a no-op there. scroll-padding keeps the field clear of a sticky header or footer.
        if (event.key === 'Tab' && !event.defaultPrevented) {
          const panel = event.currentTarget;
          requestAnimationFrame(() => {
            const focused = document.activeElement;
            if (focused instanceof HTMLElement && panel.contains(focused) && typeof focused.scrollIntoView === 'function') focused.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          });
        }
      }}
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event);
        // Escape inside a select list, menu or popover closes that layer only.
        guardNestedEscape(escapeGuard, event);
      }}
      {...{ [INSET_SCOPE_ATTRIBUTE]: '' }}
      className={cn(
        'max-h-screen',
        scrollInsetClasses,
        // Short windows (up to 480px high): the panel scrolls as a whole, the body keeps its content height instead of shrinking to a few pixels between header and footer
        scrollable ? 'overflow-hidden short:overflow-y-auto' : 'overflow-y-auto',
        'fixed',
        'left-[50%]',
        'top-[50%]',
        'z-dialog',
        scrollable ? 'flex flex-col' : 'grid',
        'w-full',
        !size && 'max-w-lg',
        'translate-x-[-50%]',
        'translate-y-[-50%]',
        zero ? 'gap-3' : 'gap-4',
        'border border-solid',
        zero ? 'border-border-default' : 'border-hairline',
        'bg-background',
        'p-6',
        // Theme expression (kette-tokens 5.26.0): surface image and frame over the dialog's own shadow; the defaults change nothing
        zero ? '[--dialog-elevation:var(--elevation-raised,0_0_transparent)]' : '[--dialog-elevation:theme(boxShadow.dialog)]',
        'shadow-[shadow:var(--bevel-dialog),var(--dialog-elevation)]',
        'bg-[image:var(--image-dialog)]',
        // Theme motion (UX-031-06): the duration follows the token, no animation under prefers-reduced-motion
        'duration-base',
        'motion-reduce:animate-none',
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0',
        'data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95',
        'data-[state=open]:zoom-in-[0.98]',
        'data-[state=closed]:slide-out-to-left-1/2',
        'data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2',
        'data-[state=open]:slide-in-from-top-[48%]',
        'sm:rounded-dialog',
        size && dialogSizeWidth[size],
        className,
      )}
      {...props}
    >
      <OpenerCapture onCapture={returnFocus.remember} />
      <AutosaveScopeReset>{children}</AutosaveScopeReset>
      {hideClose ? null : (
        <DialogPrimitive.Close data-slot="dialog-close" className={cn('absolute right-3 top-3 z-sticky inline-flex items-center justify-center rounded-control text-icon-subtle transition-colors hover:bg-muted hover:text-icon-default active:bg-muted-strong focus:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default disabled:pointer-events-none data-[state=open]:bg-secondary',
          // z-sticky is above the z-raised of a sticky header, so the cross stays visible and clickable under it
          // Same fixed 40px square as the Sheet close, independent of theme and preset.
          'h-10 w-10',
          // Short windows scroll a `scrollable` panel as a whole, so an absolute cross would scroll away while the sticky header stays (KETTE-94 QA-KB-04). There it sticks like the header: it is moved to the first flex row with `order` (the DOM and tab order stay unchanged), pulled over the panel padding to the same corner (-mt-3, -mr-3) and keeps 40x40 (shrink-0, a flex item would shrink and its negative margins would pull the body under the header) and takes no room in the flow (sticky offset -top-3 because the sticky view starts at the content edge, like the header's -top-6; negative bottom margin of its height minus the row gap).
          scrollable && cn('short:sticky short:-top-3 short:shrink-0 short:right-auto short:order-first short:self-end short:-mt-3 short:-mr-3', zero ? 'short:-mb-10' : 'short:-mb-11'),
          closeClassName,
        )}>
          <X className="h-icon-md w-icon-md" aria-hidden="true" />
          <span className="sr-only">{l.close}</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
  );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `horizontal` puts a DialogFeaturedIcon beside the text column. Default `vertical` is unchanged. */
  orientation?: 'vertical' | 'horizontal';
}

// Short windows (up to 480px high) scroll a `scrollable` panel as a whole: header and footer stay in view on the surface fill, so the title and the actions are visible on open
// The bars pull out over the 24px panel padding (negative margin and offset) and pad themselves with it again: they sit flush with the panel edges, no content shows past them, and the measured height is the exact scroll padding
const shortStickyBar = 'short:[[data-dialog-scrollable]_&]:sticky short:[[data-dialog-scrollable]_&]:z-raised short:[[data-dialog-scrollable]_&]:bg-background';

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(({ className, orientation = 'vertical', ...props }, ref) => (
  <div
    data-slot="dialog-header"
    ref={useStickyInset<HTMLDivElement>('top', ref)}
    className={cn(
      'flex text-left',
      shortStickyBar,
      'short:[[data-dialog-scrollable]_&]:-top-6 short:[[data-dialog-scrollable]_&]:-mt-6 short:[[data-dialog-scrollable]_&]:pt-6',
      // Theme header band (kette-tokens 5.26.0 image-dialog-header, bevel-dialog-header), none by default
      'bg-[image:var(--image-dialog-header)] shadow-[shadow:var(--bevel-dialog-header)]',
      orientation === 'horizontal' ? 'flex-row items-start gap-4 pr-8' : 'flex-col space-y-[6px]',
      className,
    )}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

// Footer of a dialog: the destructive or confirming action on the right, Cancel as `outline` to its left. In a sheet footer Cancel is `ghost` (see SheetFooter).
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={useStickyInset<HTMLDivElement>('bottom', ref)} className={cn('flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end', shortStickyBar, 'short:[[data-dialog-scrollable]_&]:-bottom-6 short:[[data-dialog-scrollable]_&]:-mb-6 short:[[data-dialog-scrollable]_&]:pb-6', className)} {...props} />
));
DialogFooter.displayName = 'DialogFooter';

// Scrolling middle part of a `scrollable` DialogContent. The overflow clips at the padding box, so the body pads itself by 4px and pulls back with a negative margin: layout stays put and focus rings of its controls are not cut off. It never takes initial focus (DialogContent focuses the first field). It is a tab stop only while it holds nothing focusable, so keyboard users can still scroll plain content.
const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [hasFocusableChild, setHasFocusableChild] = React.useState(false);
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [forwardedRef],
  );

  React.useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return undefined;
    const update = () => setHasFocusableChild(node.querySelector(FOCUSABLE_SELECTOR) !== null);
    update();
    const observer = new MutationObserver(update);
    observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'tabindex', 'href'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={setRef}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={hasFocusableChild ? undefined : 0}
      data-slot="dialog-body"
      className={cn('-m-1 min-h-0 flex-1 overflow-y-auto p-1 short:flex-none short:overflow-visible', scrollInsetClasses, 'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default', className)}
      {...props}
    />
  );
});
DialogBody.displayName = 'DialogBody';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      ref={ref}
      className={cn(zero ? 'typography-label-highlight' : 'text-base font-semibold leading-none tracking-[-0.01em]', displayVoice, className)}
      {...props}
    />
  );
});
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(zero ? 'typography-ui text-text-subtle' : 'typography-p-ui text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const dialogIconTones = {
  neutral: 'bg-muted text-icon-default',
  brand: 'bg-general-brand-container text-general-brand-on-container',
  success: 'bg-general-success-container text-general-success-on-container',
  warning: 'bg-general-warning-container text-general-warning-on-container',
  destructive: 'bg-general-destructive-container text-general-destructive-on-container',
  info: 'bg-general-info-container text-general-info-on-container',
} as const;

interface DialogFeaturedIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof dialogIconTones;
}

// Round tinted icon tile for the modal header (Figma "_Modal header" featured icon). Decorative.
const DialogFeaturedIcon = ({ className, tone = 'neutral', ...props }: DialogFeaturedIconProps) => (
  <span
    aria-hidden
    className={cn(
      'grid h-control-xl w-control-xl shrink-0 place-items-center rounded-full [&>svg]:h-icon-lg [&>svg]:w-icon-lg',
      dialogIconTones[tone],
      className,
    )}
    {...props}
  />
);
DialogFeaturedIcon.displayName = 'DialogFeaturedIcon';

export {
  type DialogContentProps,
  type DialogFeaturedIconProps,
  type DialogHeaderProps,
  DialogFeaturedIcon,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
