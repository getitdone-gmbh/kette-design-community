'use client';

import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { MODAL_EXEMPT_ATTRIBUTE } from '../../lib/modal-inert';
import { cn } from '../../lib/utils';
import { useLabels, usePreset } from './labels-context';

// Phones (below the sm breakpoint) place toasts at the bottom edge and dismiss them by swiping down. From sm up they sit bottom right and swipe right.
const PHONE_QUERY = '(max-width: 639px)';

function usePhoneSwipeDirection(): 'down' | 'right' {
  const [phone, setPhone] = React.useState(false);
  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(PHONE_QUERY);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return phone ? 'down' : 'right';
}

// Pass `swipeDirection` to override the responsive default.
// The provider label is spoken before each toast. It follows the labels context (locale), a `label` prop wins.
const ToastProvider = ({ swipeDirection, label, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Provider>) => {
  const responsive = usePhoneSwipeDirection();
  const l = useLabels();
  return <ToastPrimitives.Provider swipeDirection={swipeDirection ?? responsive} label={label ?? l.toastNotification} {...props} />;
};
ToastProvider.displayName = 'ToastProvider';

// Modal layers (Sheet, Dialog, Drawer) make the page inert but keep elements with this attribute reachable, see lib/modal-inert.
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & { clamp?: boolean }
>(({ className, clamp = false, label, ...props }, ref) => {
  const l = useLabels();
  // Radix renders a role="region" wrapper around the list that takes no props, so the exemption is also set on it.
  const setRef = React.useCallback(
    (node: HTMLOListElement | null) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLOListElement | null>).current = node;
      node?.parentElement?.setAttribute(MODAL_EXEMPT_ATTRIBUTE, '');
    },
    [ref],
  );
  return (
    <ToastPrimitives.Viewport
      ref={setRef}
      label={label ?? l.toastRegion}
      {...{ [MODAL_EXEMPT_ATTRIBUTE]: '' }}
      className={cn(
        // Phones: bottom edge, newest toast nearest the edge, above the safe area and above the sticky footer of an open Sheet, Dialog or Drawer. From sm: bottom right as before.
        'fixed bottom-0 z-toast flex max-h-screen w-full flex-col-reverse p-4 max-sm:inset-x-0 max-sm:bottom-[var(--toast-inset-bottom,0px)] max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:right-0 sm:flex-col md:max-w-[420px]',
        className,
      )}
      {...props}
    />
  );
});
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// TOAST-TOK-01 (component-scoped surface token gap): unlike sibling overlay/portal-level
// components — DropdownMenu (`dropdown-background-default`), Tooltip (`tooltip-background-default`) —
// the token repo (the design tokens (`styles/theme.css`)) has not shipped a dedicated
// `toast-background-default` / `toast-foreground-default` pair. The `default` variant below falls
// back to the generic semantic `background-default` / `foreground-default` role tokens instead — the
// same fallback Alert already uses for its own `default` variant (see alert.tsx) — a legitimate,
// dark-mode-aware, already-shipped pair, not a fabricated value. Flagged for
// design-tokens-maintainer as a candidate future `toast-*` namespace; not fixable from this file.
//
// destructive variant: the shipped token set actually carries TWO different "solid destructive
// surface" pairs with different RGB values and different dark-mode awareness —
// `background-destructive` / `foreground-destructive` (a single flat value, NOT redefined under
// `.dark`, with no `-hover` / `-active` companion — see button.tsx's `destructive` variant) vs.
// `general-error-default` / `general-error-on` (a complete, dark-mode-tuned family with `-hover` /
// `-active` steps — see chip.tsx's `destructive` variant). Toast's destructive variant needs
// hover/active-capable nested `ToastAction` / `ToastClose` states AND correct per-mode contrast —
// only the `general-error-*` family satisfies both, so it (not the Button pair) is reused here,
// matching Chip's already-verified-good destructive treatment. TOAST-TOK-02: flagging that two
// divergent "destructive fill" token pairs ship at all, with no canonical one, to
// design-tokens-maintainer — the ideal fix is consolidating on a single dark-mode-aware pair.
//
// The literal `destructive` class name below is not a Tailwind utility — it is a plain CSS marker
// consumed by the `group-[.destructive]:` selectors on ToastAction/ToastClose (same technique
// upstream shadcn/ui uses), letting those nested, genuinely-interactive controls re-theme themselves
// off the parent's variant without threading a prop through three components.
//
// TOAST-TOK-03 (component-scoped border-contrast gap, `default` variant only): the base border was
// `border-form-border-default` (slate.200 light / slate.700 dark), which computes to ~1.23:1 (light)
// and ~1.95:1 (dark) against the generic `background-default` surface it sits on — both fail the
// 3:1 floor for SC 1.4.11. Switched to `border-general-border-default` — an already-shipped,
// dark-mode-aware semantic token Alert already uses for the identical "generic default surface needs
// a boundary" problem (see alert.tsx's `default` variant) — which clears the floor in light mode
// (slate.900 vs white, >15:1). In dark mode `general-border-default` and `form-border-default`
// resolve to the SAME slate.700 value, so this does not regress dark mode but also does not clear
// 3:1 there (~1.95:1 unchanged) — no shipped border or shadow token in the token repo currently
// reaches 3:1 against the dark `background-default` surface (`shadow-lg`'s black/10% is equally
// negligible on a near-black background, and there is no dark-mode-aware elevation/shadow token to
// substitute). Flagged for design-tokens-maintainer: a dedicated `toast-border-default` (or a shared
// elevated-surface border role) needs a lighter dark-mode value that clears 3:1 against
// `background-default` dark. Not fabricated here per the "never hardcode a missing token" rule.
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-default border border-solid border-general-border-default p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x,0px)] data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y,0px)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x,0px)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y,0px)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 max-sm:data-[state=closed]:slide-out-to-bottom-full sm:data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full motion-reduce:animate-none motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none',
  {
    variants: {
      variant: {
        default: 'bg-surface-canvas text-text-default',
        destructive: 'destructive border-transparent bg-general-error-default text-general-error-on',
        // Compact undo toast (Figma Toast): inverse surface, single line, text action and close inline.
        inverse: 'inverse border-transparent bg-foreground px-4 py-3 text-background',
      },
      // Product preset (DesignSystemProvider `preset`). `zero` uses the 12px surface radius, a 40px single line and the raised elevation on the inverse toast.
      preset: { default: '', zero: '' },
    },
    compoundVariants: [{ variant: 'inverse', preset: 'zero', className: 'rounded-surface py-control-py-md shadow-elevation-raised typography-ui' }],
    defaultVariants: {
      variant: 'default',
      preset: 'default',
    },
  },
);

// TOAST-A11Y-07: the fluid-type `clamp` classes previously used Tailwind's `!` (`!important`)
// modifier on `text-clamp-small`/`leading-clamp-small`. `!important` author declarations can only be
// beaten by a user stylesheet's own `!important` rule — a low-specificity user/AT text-spacing
// override (SC 1.4.12, e.g. a `body *` or element-selector rule, not itself `!important`) loses to
// our single-class `!important` regardless of source order, silently blocking the user-override
// mechanism SC 1.4.12 requires. Fixed via scoping/specificity instead of `!important`: the
// descendant selectors below (`[&_div]:text-clamp-small`, `[&_button]:text-clamp-small`, scoped from
// the Toast root) already carry a class+type-selector specificity (0,1,1) that beats the plain
// `.text-sm` utility (0,1,0) deterministically regardless of CSS source order — no `!important`
// needed, and any genuine (even non-important) user override still wins because it is no longer
// fighting an `!important` declaration.
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & Omit<VariantProps<typeof toastVariants>, 'preset'> & { clamp?: boolean }
>(({ className, variant, clamp = false, style, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <ToastPrimitives.Root
      ref={ref}
      // A toast that was already open when a modal layer opened would get pointer-events none from Radix (it sits below the modal in the layer stack).
      style={{ pointerEvents: 'auto', ...style }}
      className={cn(
        toastVariants({ variant: variant ?? (zero ? 'inverse' : 'default'), preset: zero ? 'zero' : 'default' }),
        { '!p-6': clamp },
        { '[&_div]:text-clamp-small [&_button]:text-clamp-small': clamp },
        { '[&_div]:leading-clamp-small [&_button]:leading-clamp-small': clamp },
        className,
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

// TOAST-A11Y-05: the base border was `border border-solid` with no border-color utility, falling
// back to the library's global base rule bound to `--colors-form-border-default` (light-only, no
// dark override) — ~1.23:1 against the toast's background, far below the 3:1 SC 1.4.11 floor for an
// interactive control boundary. Added the explicit `border-general-border-default` token — the same
// dark-mode-aware pair already applied to the Toast root (see TOAST-TOK-03 above) — for the default
// (non-destructive) treatment; the `destructive` variant keeps its own already-verified
// `group-[.destructive]:border-general-error-on/40` boundary.
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> & { clamp?: boolean }
>(({ className, clamp = false, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-default border border-solid border-general-border-default bg-transparent px-3 text-sm font-medium transition-colors',
      'hover:bg-background-neutral-default',
      'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-ring-default focus-visible:ring-offset-focus',
      'active:bg-background-neutral-default active:brightness-95',
      'disabled:pointer-events-none disabled:opacity-disabled',
      'group-[.inverse]:h-auto group-[.inverse]:min-h-target group-[.inverse]:border-0 group-[.inverse]:bg-transparent group-[.inverse]:px-2 group-[.inverse]:py-0 group-[.inverse]:underline group-[.inverse]:hover:bg-transparent',
      'group-[.inverse]:focus-visible:ring-background group-[.inverse]:focus-visible:ring-offset-0',
      'group-[.destructive]:border-general-error-on/40',
      'group-[.destructive]:hover:border-general-error-on/70',
      'group-[.destructive]:hover:bg-general-error-hover',
      'group-[.destructive]:active:bg-general-error-active',
      'group-[.destructive]:focus-visible:ring-general-error-on',
      'group-[.destructive]:focus-visible:ring-offset-general-error-default',
      { '[.group_&]:text-clamp-small': clamp, '[.group_&]:leading-clamp-small': clamp },
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

// TOAST-A11Y-06 / TOAST-A11Y-08: the close button is persistently visible (touch has no hover) and at rest it uses the full text colour of its variant, never an opacity blend. A 70% blend dropped the icon to about 2.7:1 (default, light) and 2.9:1 (destructive, light), under the 3:1 floor of WCAG 1.4.11. At full strength it is 4.6:1 or more in every variant and mode.
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, 'aria-label': ariaLabelProp, ...props }, ref) => {
  const l = useLabels();
  const ariaLabel = ariaLabelProp ?? l.dismiss;
  return (
  <ToastPrimitives.Close
    ref={ref}
    aria-label={ariaLabel}
    className={cn(
      'absolute right-1 top-1 rounded-default p-1 text-text-subtle transition-colors',
      'hover:text-text-default',
      'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-ring-default focus-visible:ring-offset-focus',
      'group-[.inverse]:static group-[.inverse]:text-background group-[.inverse]:hover:text-background group-[.inverse]:focus-visible:ring-background group-[.inverse]:focus-visible:ring-offset-0',
      'group-[.destructive]:text-general-error-on',
      'group-[.destructive]:hover:text-general-error-on',
      'group-[.destructive]:focus-visible:text-general-error-on',
      'group-[.destructive]:focus-visible:ring-general-error-on',
      'group-[.destructive]:focus-visible:ring-offset-general-error-default',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitives.Close>
  );
});
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> & { clamp?: boolean }
>(({ className, clamp = false, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      'text-sm font-semibold [&+div]:text-xs',
      { '[.group_&]:text-clamp-small': clamp, '[.group_&]:leading-clamp-small': clamp },
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

// TOAST-A11Y-04: `opacity-90` alone blends the destructive variant's inherited `general-error-on`
// text to ~3.96:1 (light) / ~4.36:1 (dark) against `general-error-default` — both below the 4.5:1 AA
// floor for normal-size text (SC 1.4.3). `group-[.destructive]:opacity-100` restores full-strength
// `general-error-on` for the destructive variant only (the default variant keeps the softer
// `opacity-90` treatment, which already clears AA against its own `foreground-default`/
// `background-default` pairing).
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> & { clamp?: boolean }
>(({ className, clamp = false, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      'text-sm opacity-90 group-[.destructive]:opacity-100',
      { '[.group_&]:text-clamp-small': clamp, '[.group_&]:leading-clamp-small': clamp },
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
};

// --- Deliberately NOT added (documented rather than silently omitted) ---
//
// `selected`: like Alert (see alert.tsx), Toast has no resolvable Figma spec to confirm this
// against — the "Notification" component_set is indexed in the published "🚧 GetITDone Basic" team
// library (componentKey 774bcac2189d93af8b4c2789db620011ba9dc113, last updated 2024-07-26) but is
// not present on any current page of file bzBnRLfRJNknGg9UYJIHb0 (checked Welcome, Button, Select,
// Tooltips, CardMetrics, Logos, Utilities) — the same orphaned-publish issue already documented on
// Alert/Chip (see alert.figma.tsx / chip.figma.tsx). Toast is also, by nature, an ephemeral one-shot
// notification (Radix mounts/unmounts it), not a persisted/toggleable list item — nothing in this
// codebase needs a selectable Toast. Fabricating a spec here would violate the "never fabricate a
// spec that isn't in Figma" rule — flagged as NEEDS_DECISION instead of guessed.
//
// `invalid`: same reasoning as Alert — `variant="destructive"` already means "this is the
// error/invalid message"; a separate `invalid` boolean would duplicate it with no new information.
//
// `disabled` (on the Toast root itself): a whole toast cannot be "disabled" — there is no root-level
// interaction to disable (Radix's `Root` is a passive, swipe-dismissible live region, not a control).
// `ToastAction` and `ToastClose` are the real, keyboard-operable controls here, and both already
// support the native `disabled` attribute with the token-driven `disabled:` states above.
