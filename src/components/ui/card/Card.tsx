'use client';

import { clsx } from 'clsx';
import { forwardRef, KeyboardEvent, MouseEvent } from 'react';
import { CardProps } from './card.interface';
import { useLabels, usePreset } from '../labels-context';

// NOTE (MAT-CARD-01): this `CardDefault` (single `children`/`image` prop API, product-tile shaped)
// and the composable `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`
// slot API in `../card.tsx` are two intentionally distinct primitives — not accidental duplicates.
// They are kept in sync on the things that must never diverge for two same-named-in-spirit
// surfaces: shape token (`rounded-card`, not `rounded-default`) and the full disabled/invalid/
// selected state set (see below). They intentionally keep separate anatomy (single free-form
// `children` slot + optional `image` here vs. composed header/title/description/content/footer
// slots there) and separate elevation defaults: this Card's `shadow` prop is not a bare elevation
// toggle — it switches to an entirely different centered/featured layout (`shadow` + `!border-none`
// + centered text + different padding scale), so unconditionally defaulting it to `shadow-sm` (to
// match the composable Card's fixed default) would silently change the rendered layout of every
// existing `shadow`-less consumer. That specific default-elevation alignment is left as a
// NEEDS_DECISION for design/product rather than folded into this state-parity fix.
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      transparent = false,
      children,
      image,
      isFluid = false,
      noBorder = false,
      shadow = false,
      style,
      onClick,
      selected,
      disabled,
      invalid,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    // Interactivity is derived from the presence of a real `onClick` handler (mirrors the
    // composable Card in `card.tsx`) rather than a separate boolean prop, so a static-content
    // Card (Default/NoBorder/Transparent/ProductCard, …) never becomes an empty, unlabeled Tab
    // stop with a suppressed focus outline — it only gains role="button", a Tab stop, keyboard
    // activation, and a visible focus ring once the consumer actually wires up `onClick`. Disabled
    // always wins over an `onClick` (mirrors the composable Card's `interactive` computation).
    const l = useLabels();
    const zero = usePreset() === 'zero';
    const interactive = Boolean(onClick) && !disabled;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!interactive || event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as unknown as MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        className={clsx(
          'card',
          'w-full',
          'h-full',
          'flex',
          'flex-col',
          'flex-nowrap',
          'items-stretch',
          // MAT-CARD-02: dedicated `rounded-card` token (borderRadius/card, 8px), not the generic
          // `rounded-default` (borderRadius/default, 6px) — matches the composable Card in
          // `card.tsx`, which correctly uses `rounded-card` for the same semantic component.
          'rounded-surface',
          // Transparent cards sit on any surface, so they inherit its text colour.
          transparent ? 'text-inherit' : 'text-foreground',
          '[&>img]:rounded-tl-surface',
          '[&>img]:rounded-tr-surface',
          '[&_p:last-child]:mb-0',
          { 'max-sm:p-0': noBorder || transparent },
          // Zero: one fixed 20px card padding instead of the responsive 16/24/32 scale.
          { 'p-5': zero && !image && !transparent },
          { 'p-md md:p-lg lg:p-xl': !zero && !image && !transparent },
          { 'shadow-elevation-surface border-border-default data-[selected=true]:border-border-brand data-[selected=true]:bg-background data-[selected=true]:ring-[3px] data-[selected=true]:ring-background-brand-subtle': zero && !transparent && !noBorder },
          { 'items-center gap-3 !border-none p-3 md:p-6 lg:p-10 text-center shadow': shadow },
          // CARD-A11Y-01 TOKEN GAP: `border-form-border-default` against `bg-background` computes
          // to ~1.23:1 in light mode (needs ≥3:1 for a UI-component boundary, WCAG 1.4.11) — the
          // resting Card border is effectively edge-less on a white page. Token-value defect (needs
          // a darker `form-border-default` or a dedicated `card-border-default` token from
          // design-tokens-maintainer), not a usage defect — this file already consumes the intended
          // semantic border token rather than hardcoding a color.
          { 'border border-solid border-border': !zero && !transparent && !noBorder },
          { 'border border-solid': zero && !transparent && !noBorder },
          // CARD-TOK-01 / CARD-A11Y-02 TOKEN GAP: plain `bg-background` (and the `card-*`/`primary`/
          // `ring-default`/`error` tokens used below) are declared once at `:root` with no `.dark`
          // override in kette-tokens `dist/theme.css` — this Card renders the identical
          // light-mode surface in dark mode. Same root cause already tracked on the composable Card
          // (see card.tsx); needs dark-mode-tuned values from design-tokens-maintainer, nothing to
          // change here once they ship.
          { 'bg-background': !transparent },
          // MAT-CARD-03 fix: the clsx object key IS the class name gated on the value's truthiness —
          // `{ isFluid: '@container' }` had this backwards (the key was the prop name, a permanently
          // truthy string, so it always emitted the literal class "isFluid" and never "@container").
          { '@container': isFluid },
          {
            'cursor-pointer hover:bg-background-neutral-default focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default focus-visible:border-ring active:bg-background-neutral-default active:brightness-95 aria-[invalid=true]:focus-visible:ring-error':
              interactive,
          },
          // Disabled — Card renders a <div>, not a native form control, so (mirrors the composable
          // Card/Chip/AlertClose) the dimmed/inert look is driven by `aria-disabled`/`data-disabled`
          // rather than the (inapplicable) `disabled:` pseudo-class. Independent of `interactive`: a
          // purely informational Card can still be shown as "unavailable" (MAT-CARD-04).
          // Disabled dimming uses the `opacity-disabled` utility of the tokens (--opacity-disabled).
          'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
          'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-disabled',
          // Invalid — e.g. a form-section Card reporting a validation error. Mirrors the composable
          // Card's `aria-[invalid=true]:border-error` so the boundary-only (no background refill)
          // treatment stays one convention across form-adjacent containers (MAT-CARD-04).
          { 'aria-[invalid=true]:border-error': !zero && !transparent && !noBorder },
          // Zero: the destructive border role instead of the raw error red.
          { 'aria-[invalid=true]:border-destructive': zero && !transparent && !noBorder },
          // Selected — a persistent "this is the chosen one" identity for a card among alternatives
          // (e.g. a plan/tile picker), independent of `interactive`. Mirrors the composable Card's
          // `data-[selected=true]:border-primary` / `bg-background-accent` (MAT-CARD-04).
          { 'data-[selected=true]:border-primary': !zero && !transparent && !noBorder },
          { 'data-[selected=true]:bg-background-accent': !zero },
          className,
        )}
        style={style}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive && selected != null ? Boolean(selected) : undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        data-testid="card"
        {...props}
        ref={ref}
      >
        {image}
        {image ? (
          <div
            className={clsx(
              'flex',
              'h-full',
              'flex-col',
              'flex-nowrap',
              'items-start',
              { 'p-md': !transparent },
              { 'md:p-lg': !transparent },
              { 'lg:p-xl': !transparent },
            )}
          >
            {children}
          </div>
        ) : (
          children
        )}
        {selected && !interactive && <span className="sr-only">{l.selectedSuffix}</span>}
        {invalid && <span className="sr-only">{l.invalidSuffix}</span>}
      </div>
    );
  },
);
