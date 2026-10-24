'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import type { HeadingTag } from '@/components/ui/heading-tag';
import { useLabels, usePreset } from '@/components/ui/labels-context';

// Every severity variant is built exclusively from the `general-{severity}-*` tokens (already
// shipped, dark-mode-aware via the `.dark` CSS-var scope — see theme.css) — never a raw Tailwind
// palette class. The soft "container" background is the SAME token family consumed through
// Tailwind's CSS-var opacity syntax (`/10`) rather than a new token, matching the MD3
// alert/container role (soft tint + saturated on-container text) without inventing a value.
//
// KNOWN TOKEN GAP (ALERT-TOK-01): the token repo's JSON source (`figma-tokens/default_theme.json`
// + `default_theme_dark.json`) already defines dedicated `general.{info,success,warning,error}
// .container` / `.on-container` pairs, which would be the more semantically exact tokens for this
// role — but they were never carried into the built CSS vars / Tailwind theme (`dist/theme.css`
// has no `--colors-general-*-container` entries at all). Until `kette-tokens` regenerates
// its CSS-var build to include them, this file intentionally falls back to the opacity-modified
// `-default` token above rather than hardcoding a value or fabricating a token name.
//
// KNOWN TOKEN GAP (ALERT-TOK-02): there is no dedicated light-tint ramp for `info` at all
// (`--semantic-error-50..900` and `--semantic-warning-50..900` exist; `--semantic-success-50..900`
// exists; no `--semantic-info-*` ramp is shipped) — another reason the ramp-based tints were not
// used here (would have left `info` inconsistent with the other three severities).
//
// KNOWN TOKEN GAP (ALERT-TOK-03): where the `--semantic-{error,success,warning}-*` ramps DO exist,
// they are declared once at `:root` and never redefined under `.dark` — the same very-light tint
// would render in dark mode. This is a second, independent reason those ramps were not used here.
//
// KNOWN TOKEN GAP (ALERT-TOK-05, tracks ALERT-A11Y-06 / ALERT-A11Y-05 — same root cause already
// flagged on Chip as CHIP-MAT-01 / CHIP-A11Y-05, see chip.tsx): the `default`/`decent` variants'
// boundary is carried entirely by `border-general-border-default` (there is no `/10` tint or any
// other secondary fill-color cue distinguishing these two variants' backgrounds from the page in
// dark mode — `background-default`/`background-subtle`/`background-muted` differ from each other by
// only 1.13-1.38:1 there). In dark mode `--colors-general-border-default` (rgb(51 65 85)) is
// byte-identical to `--semantic-border-default` and computes to only ~1.95:1 against
// `--semantic-background-default` (rgb(2 6 23)) — under the WCAG 1.4.11 non-text 3:1 minimum (light
// mode is fine at ~17.85:1, same token pair). Unlike the four severity variants below, the
// `general-border-*` family ships ONLY a `-default` shade in `dist/theme.css` — no `-hover`/
// `-active`/`-strong` step exists to borrow the way ALERT-TOK-04 borrows `general-{severity}-hover`
// — so there is no already-shipped token this file can re-point to without fabricating a value.
// Needs a dedicated, more-separated `general-border-default` (or a new `general-border-strong`)
// dark-mode value from design-tokens-maintainer, tuned to clear 3:1 against
// `semantic-background-default`; re-verify via the pinned regression assertions in alert.test.tsx
// (`describe('WCAG 1.4.11 non-text contrast (ALERT-A11Y-06)')`) once it ships, and update those
// assertions to require >=3:1 to close this gap.
//
// KNOWN TOKEN GAP (ALERT-TOK-04, closes ALERT-A11Y-03 / ALERT-A11Y-04): the `-default` shade alone
// does not clear WCAG 1.4.3 (text) or 1.4.11 (non-text) contrast against the `/10` tint + page
// background in light mode for 3 of 4 severities (measured: text 3.15-4.14:1 against the tinted
// container; border/40 1.6-2.1:1 against the page). `-active` is bitwise identical to `-default`
// in the current build (no headroom), but `-hover` IS a distinct, more-saturated step in both
// themes, so text/icon use `-hover` (verified ≥4.58:1 in light, ≥4.86:1 in dark against the tinted
// container) and the border uses `-hover` at 70% opacity (verified ≥3.11:1 in light, ≥3.95:1 in
// dark against the page). This is an interim reuse of an interaction-scoped token as a static
// on-container/border color, not a new value — the correct long-term fix is the dedicated
// `-on-container` / `-container` pair from ALERT-TOK-01, flagged to design-tokens-maintainer.
// Inline links (Button variant="link") inside a severity alert take the alert text colour: the link blue measured 4.57:1 on the warning tint and 4.05:1 on the destructive tint. The underline stays as the cue that the text is a link (not colour alone, WCAG 1.4.1), hover and pressed keep the colour and only thicken the underline.
const ALERT_LINK = [
  '[&_[data-slot=button][data-variant=link]]:text-inherit',
  '[&_[data-slot=button][data-variant=link]:is(:hover,:active)]:text-inherit',
  '[&_[data-slot=button][data-variant=link]]:underline',
  '[&_[data-slot=button][data-variant=link]]:underline-offset-4',
  '[&_[data-slot=button][data-variant=link]:hover]:decoration-2',
];

const alertVariants = cva(['relative w-full border border-solid', '[&>svg]:absolute'], {
  variants: {
    variant: {
      default: 'border-general-border-default bg-surface-canvas text-text-default [&>svg]:text-text-default',
      decent: 'border-general-border-default bg-background-neutral-subtle text-text-default [&>svg]:text-text-default',
      info: [
        'border-general-info-hover/70 bg-general-info-default/10',
        'text-general-info-hover [&>svg]:text-general-info-hover',
        ...ALERT_LINK,
      ],
      success: [
        'border-general-success-hover/70 bg-general-success-default/10',
        'text-general-success-hover [&>svg]:text-general-success-hover',
        ...ALERT_LINK,
      ],
      warning: [
        'border-general-warning-hover/70 bg-general-warning-default/10',
        'text-general-warning-hover [&>svg]:text-general-warning-hover',
        ...ALERT_LINK,
      ],
      destructive: [
        'border-general-error-hover/70 bg-general-error-default/10',
        // On-subtle text role: 5.0:1 or better on the tint in every theme and mode (the hover role fell to 3.9:1 in windows-95).
        'text-text-destructive-on-subtle [&>svg]:text-text-destructive-on-subtle',
        ...ALERT_LINK,
      ],
    },
    // `default` is the established layout. `compact` is a single-line note: no border, severity tint
    // fill, surface radius, `ui` type role, and an `icon-md` glyph sized from the control tokens.
    size: {
      default: [
        'rounded-card p-4 text-sm leading-3',
        '[&>svg~*:not([data-slot=alert-close])]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:left-4 [&>svg]:top-[1.2rem] [&>svg]:h-4 [&>svg]:w-4',
      ],
      compact: [
        'rounded-surface border-transparent px-control-px-lg py-control-py-md typography-ui text-text-default',
        '[&>svg]:left-control-px-lg [&>svg]:top-control-py-md [&>svg]:h-icon-md [&>svg]:w-icon-md [&>svg]:text-icon-default',
        '[&>svg~*:not([data-slot=alert-close])]:pl-[calc(theme(spacing.icon-md)+theme(spacing.gap-control))]',
      ],
    },
    // Where an AlertActions row sits. `below` (default) stacks it under the text. `end` puts it on the right, vertically centred, once the alert itself is at least 36rem wide (container query on a wrapper, not the viewport, so an alert in a narrow column or next to a sidebar still stacks). Compose AlertActions as a direct child of Alert.
    actionsPlacement: {
      below: '',
      end: [
        '@xl:grid @xl:grid-cols-[minmax(0,1fr)_auto] @xl:gap-x-4',
        // The icon is absolutely positioned: keep it out of the column rule so it stays anchored to the padding box at every breakpoint.
        '@xl:[&>*:not(svg)]:col-start-1',
        '@xl:[&>[data-slot=alert-actions]]:col-start-2 @xl:[&>[data-slot=alert-actions]]:row-span-3 @xl:[&>[data-slot=alert-actions]]:row-start-1',
        '@xl:[&>[data-slot=alert-actions]]:mt-0 @xl:[&>[data-slot=alert-actions]]:self-center @xl:[&>[data-slot=alert-actions]]:pl-0',
      ],
    },
    // Product preset (DesignSystemProvider `preset`). `zero` uses 12/16 padding and the brand tint for the info tone in the compact (soft note) size.
    preset: { default: '', zero: '' },
  },
  compoundVariants: [
    { preset: 'zero', size: 'compact', className: 'px-4 py-3 [&>svg]:left-4 [&>svg]:top-3 [&>svg~*:not([data-slot=alert-close])]:pl-[calc(theme(spacing.icon-md)+theme(spacing.gap-control))]' },
    { preset: 'zero', size: 'compact', variant: 'info', className: 'bg-background-brand-subtle' },
    { variant: 'default', size: 'compact', className: 'bg-muted' },
    { variant: 'decent', size: 'compact', className: 'bg-muted' },
    { variant: 'info', size: 'compact', className: 'bg-background-info-subtle' },
    { variant: 'success', size: 'compact', className: 'bg-background-success-subtle' },
    { variant: 'warning', size: 'compact', className: 'bg-background-warning-subtle' },
    { variant: 'destructive', size: 'compact', className: 'bg-background-destructive-subtle' },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'default',
    actionsPlacement: 'below',
    preset: 'default',
  },
});

// ALERT-A11Y-05: role/aria-live is derived from severity per the WAI-ARIA Alert authoring
// pattern — assertive `role="alert"` is reserved for time-sensitive, interrupting messages
// (warning/destructive); non-urgent variants use the polite `role="status"` so they don't forcibly
// interrupt a screen-reader user's current reading. Explicit `role`/`aria-live` props passed by a
// consumer still win (see the spread order in `Alert` below).
const alertRoleByVariant: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, 'alert' | 'status'> = {
  default: 'status',
  decent: 'status',
  info: 'status',
  success: 'status',
  warning: 'alert',
  destructive: 'alert',
};

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & Omit<VariantProps<typeof alertVariants>, 'preset'>
>(({ className, variant, size, actionsPlacement, role, 'aria-live': ariaLive, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const resolvedVariant = variant ?? 'default';
  const resolvedRole = role ?? alertRoleByVariant[resolvedVariant];
  const resolvedAriaLive = ariaLive ?? (resolvedRole === 'alert' ? 'assertive' : 'polite');
  const alert = (
    <div
      ref={ref}
      role={resolvedRole}
      aria-live={resolvedAriaLive}
      data-actions-placement={actionsPlacement ?? undefined}
      className={cn(alertVariants({ variant, size: size ?? (zero ? 'compact' : 'default'), actionsPlacement, preset: zero ? 'zero' : 'default' }), className)}
      {...props}
    />
  );
  // A container query styles descendants only, so the alert gets a measuring frame when the actions move to the end.
  return actionsPlacement === 'end' ? (
    <div data-slot="alert-frame" className="w-full min-w-0 @container">
      {alert}
    </div>
  ) : (
    alert
  );
});
Alert.displayName = 'Alert';

export interface AlertTitleProps extends React.HTMLAttributes<HTMLElement> {
  // Optional heading element (h1-h6). Without it the title is a plain paragraph, so alerts do not add heading-order skips to the page.
  titleAs?: HeadingTag;
}

const AlertTitle = React.forwardRef<HTMLElement, AlertTitleProps>(({ className, titleAs, ...props }, ref) => {
  const Title = (titleAs ?? 'p') as React.ElementType;
  return (
    // The rule can't see through the `{...props}` spread; every consumer passes visible title text as children (see stories/tests).
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <Title ref={ref} className={cn('font-semibold leading-none', className)} {...props} />
  );
});
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    // Zero reads the description as the ui type role (13/20), the default theme keeps text-sm.
    const zero = usePreset() === 'zero';
    return <div ref={ref} className={cn(zero ? 'typography-ui' : 'text-sm', '[&_p]:leading-base mt-1', className)} {...props} />;
  },
);
AlertDescription.displayName = 'AlertDescription';

// Row of action buttons or links under the title and description. Composed manually like AlertTitle,
// so it sits in the text column next to the icon (the `[&>svg~*]` indent of the Alert applies).
const AlertActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="alert-actions" className={cn('mt-3 flex flex-wrap items-center gap-2', className)} {...props} />
));
AlertActions.displayName = 'AlertActions';

// Optional dismiss affordance. Alert itself stays a passive live region (`role="alert"` or
// `role="status"`, see `alertRoleByVariant` above) — it must never carry a focus ring or tabIndex
// of its own (there is nothing to "activate" on the container; only a real nested control, like
// this one, is keyboard-operable) — so hover /
// focus-visible / active / disabled all live here, on a genuine `<button>`, rather than being
// simulated on the container the way Chip has to (Chip's root is a `<div>`; this is a real button,
// so the native `:hover` / `:focus-visible` / `:active` / `:disabled` pseudo-classes apply with no
// aria-disabled workaround needed). Composed manually by the consumer, exactly like AlertTitle/
// AlertDescription, so Alert's own props stay untouched — when composing it, add e.g.
// `className="pr-8"` to <Alert> to reserve room so title/description text doesn't run under it.
const AlertClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = 'button', 'aria-label': ariaLabelProp, ...props }, ref) => {
    const l = useLabels();
    const ariaLabel = ariaLabelProp ?? l.dismiss;
    return (
    <button
      ref={ref}
      type={type}
      data-slot="alert-close"
      aria-label={ariaLabel}
      className={cn(
        'absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-default text-text-subtle transition-colors',
        'hover:bg-background-neutral-default hover:text-text-default',
        'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-ring-default focus-visible:ring-offset-focus',
        'active:bg-background-neutral-default active:brightness-95',
        'disabled:pointer-events-none disabled:opacity-disabled',
        className,
      )}
      {...props}
    >
      <X className="h-icon-md w-icon-md" aria-hidden="true" />
    </button>
  );
  },
);
AlertClose.displayName = 'AlertClose';

export { Alert, AlertActions, AlertClose, AlertDescription, AlertTitle };

// --- Deliberately NOT added (documented rather than silently omitted) ---
//
// `selected`: Alert has no resolvable Figma spec to confirm this against (see alert.figma.tsx —
// the "Alert" component_set is indexed in the published "🚧 GetITDone Basic" library but is not
// present on any current page of this file; same orphaned-publish issue already documented on
// Chip). MD3's Alert/banner role has no native "selected" state (that is a Chip/List-item/Card
// concept), and nothing in this codebase currently needs a selectable Alert. Fabricating one here
// would violate the "never fabricate a spec that isn't in Figma" rule — flagged as NEEDS_DECISION
// instead of guessed.
//
// `invalid`: unlike Chip (which has an independent `variant` axis that can be forced to the
// error treatment regardless of what it was), Alert's severity variant IS its only axis, and
// `variant="destructive"` already means "this is the invalid/error message" (see the `Error`
// story). A separate `invalid` boolean would just duplicate `variant="destructive"` with no new
// information — the kind of redundant, ambiguous API this maintainer role is meant to avoid.
