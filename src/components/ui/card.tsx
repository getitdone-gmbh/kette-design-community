'use client';

import { cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from './../../lib/utils';
import type { HeadingTag } from './heading-tag';
import { useLabels, usePreset } from './labels-context';

// True below a Card. Children that pad themselves (Accordion) read it to align with the card padding instead of adding their own inset.
export const InsideCardContext = React.createContext(false);

export type CardDensity = 'default' | 'compact';

// Set by Card. CardHeader, CardContent and CardFooter read it so one prop tightens the whole card.
const CardDensityContext = React.createContext<CardDensity>('default');


// Every resting-state color here is the dedicated `card/*` token family (Design Tokens library,
// already bound in Figma as `colors/card/background/default`, `colors/card/foreground/default`,
// `colors/card/foreground/muted`, `borderRadius/card`) — never a raw hex/palette value. Interactive/
// selected/invalid states reuse the SAME system-wide tokens Button/Chip/Alert/Select already use
// (`background-muted`, `ring-ring-default`, `primary`, `background-accent`, `error`) rather than
// inventing new ones, so Card's state language stays one system with its siblings.
//
// KNOWN TOKEN GAP (CARD-TOK-01 / CARD-A11Y-02): `--colors-card-background-default`, `--colors-card-
// foreground-default`, and `--colors-card-foreground-muted` (kette-tokens `dist/theme.css`)
// are declared once at `:root` and never redefined under `.dark` — Card renders the identical
// light-mode surface/text colors in dark mode. This is the same root cause already flagged on
// `general-border-default` (see ALERT-TOK-03 in alert.tsx, the token-gap note in chip.tsx): the
// token repo hasn't shipped a dark-mode value for this family yet. Needs dark-mode-tuned values
// from design-tokens-maintainer; nothing to change here once they ship — this file never hardcodes
// around it.
//
// KNOWN TOKEN GAP (CARD-A11Y-01): `border-form-border-default` against `bg-card-background-default`
// computes to ~1.23:1 in light mode (needs ≥3:1 for a UI-component boundary, WCAG 1.4.11) — the
// resting Card border is effectively edge-less on a white page. This is a token-value defect
// (`form-border-default` is too light, or a dedicated `card-border-default` token is needed), not a
// usage defect — Card already consumes the intended semantic border token rather than hardcoding a
// color. Needs a darker value (or new token) from design-tokens-maintainer.
const cardVariants = cva(
  [
    'rounded-surface border border-solid border-border bg-card text-card-foreground shadow-xs transition-colors',
    // Disabled — Card renders a <div>, not a native form control, so (mirrors Chip/AlertClose)
    // the dimmed/inert look is driven by `aria-disabled`/`data-disabled` rather than the
    // (inapplicable) `disabled:` pseudo-class. Independent of `interactive`: a purely informational
    // Card can still be shown as "unavailable".
    // Disabled dimming uses the `opacity-disabled` utility of the tokens (--opacity-disabled).
    'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-disabled',
    // Invalid — e.g. a form-section Card reporting a validation error. Mirrors
    // `SelectTrigger`'s `aria-[invalid=true]:border-error` (select.tsx) so the boundary-only
    // (no background refill) treatment stays one convention across form-adjacent containers.
    'aria-[invalid=true]:border-error',
    // Selected — a persistent "this is the chosen one" identity for a card among alternatives
    // (e.g. a plan/tile picker), independent of `interactive`. Mirrors Checkbox's
    // `data-[state=checked]:border-primary` for the boundary and reuses `background-accent`
    // (already the selected/highlighted surface tone in Select's option list) for the fill.
    'data-[selected=true]:border-primary data-[selected=true]:bg-background-accent [&_.text-text-subtle]:data-[selected=true]:text-text-subtle-on-muted [&_.text-card-foreground-muted]:data-[selected=true]:text-text-subtle-on-muted',
    // Today — the current day among day cards (calendar, agenda). Brand border and subtle brand fill.
    'data-[today=true]:border-border-brand data-[today=true]:bg-background-brand-subtle',
  ],
  {
    variants: {
      // Only set when the consumer passes `onClick` (see the `interactive` computation in `Card`
      // below) — a static content container never grows hover/focus/press affordances it can't
      // back with real behavior.
      interactive: {
        true: [
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default focus-visible:border-ring',
          'aria-[invalid=true]:focus-visible:ring-error',
        ],
        false: '',
      },
      // `default` keeps the established look. `surface` is the Figma Card (Variant=Surface): hover raises the border and shadow instead of tinting the fill.
      variant: {
        default: '',
        surface: '',
      },
    },
    compoundVariants: [
      {
        interactive: true,
        variant: 'default',
        className: 'hover:bg-background-neutral-default active:bg-background-neutral-default active:brightness-95',
      },
      {
        interactive: true,
        variant: 'surface',
        className: 'hover:border-border-bold hover:shadow-sm active:border-border-bold active:shadow-sm',
      },
    ],
    defaultVariants: {
      interactive: false,
      variant: 'default',
    },
  },
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Link mode: renders the card as an anchor with the interactive hover and focus look. No role="button" (a real link).
  href?: string;
  target?: string;
  rel?: string;
  // Link mode with your own link component (router Link): the single child is the link element and receives the card styles.
  asChild?: boolean;
  // Visual preset. Default keeps the established tinted hover; surface raises border and shadow on hover.
  variant?: 'default' | 'surface';
  // Inner padding. `compact` is 20px (space-5) on header, content and footer instead of 24px. The zero preset is already 20px, so it renders the same there.
  density?: CardDensity;
  // Makes the card a size container (`@container`), so children can switch layout by the card width instead of the viewport (for example `ListItem responsive`). Off by default: a size container no longer sizes itself from its content width.
  container?: boolean;
  /**
   * Marks this card as the chosen option among a set of alternatives (e.g. a plan/tile picker).
   * Independent of `onClick`/`interactive` — a purely informational Card can still indicate
   * "this is the current one." Sets `data-selected` always, and `aria-pressed` only while
   * `interactive` (a plain `<div>` has no ARIA widget role to carry `aria-selected`/`aria-pressed`
   * otherwise — mirrors Chip's identical reasoning, see chip.tsx). On a non-interactive selected
   * Card, an sr-only " (selected)" suffix carries the state to assistive tech instead.
   */
  selected?: boolean;
  /**
   * Marks the card of the current day. Sets `aria-current="date"` and `data-today`, and (while not interactive) an sr-only " (today)" suffix, so it is not announced as "selected". Independent of `selected`.
   */
  today?: boolean;
  /**
   * Dims the card and blocks pointer interaction/keyboard activation. Mirrors Chip's
   * `aria-disabled`/`data-disabled` approach rather than the HTML `disabled` attribute, since Card
   * is not a native form control.
   */
  disabled?: boolean;
  /**
   * Forces the `error` border/focus-ring treatment and sets `aria-invalid` — e.g. a form-section
   * Card reporting a validation error. An sr-only " (invalid)" suffix mirrors Chip's convention so
   * the state isn't color-only.
   */
  invalid?: boolean;
  /**
   * CARD-A11Y-04: for an interactive Card (`onClick` set) whose children are rich nested content
   * (heading + description + image, etc.), `role="button"`'s accessible name otherwise defaults to
   * the concatenation of ALL descendant text/alt — e.g. "Category I am a h3 Description button"
   * instead of a concise "Title". Pass `aria-label` (already part of `React.HTMLAttributes`, so no
   * new prop is introduced — this JSDoc documents the pattern) with a short, meaningful label, or
   * wire `aria-labelledby` to the `id` of the `CardTitle`, so
   * `screen.getByRole('button', { name: '<title>' })` resolves. See the `InteractiveWithAccessibleName`
   * story.
   */
  'aria-label'?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, density = 'default', container = false, selected, today, disabled, invalid, onClick, onKeyDown, href, asChild = false, children, ...props }, ref) => {
    // Interactivity is derived from the presence of a real handler (mirrors Chip) rather than a
    // separate boolean prop, so there is exactly one way to opt a Card into being a keyboard-
    // operable "clickable card" and it can never be turned on without something to activate.
    const l = useLabels();
    const zero = usePreset() === 'zero';
    const isLink = Boolean(href) || asChild;
    const interactive = (Boolean(onClick) || isLink) && !disabled;
    // A link keeps its native role, tab stop and Enter activation; only a div-as-button needs them added.
    const asButton = interactive && !isLink;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      // Enter and Space from nested buttons, links or inputs belong to them, not to the card.
      if (!asButton || event.defaultPrevented || event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    // A keyboard press on a nested control makes the browser fire a click that bubbles here: ignore it (detail 0 marks a keyboard or programmatic click).
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (asButton && event.detail === 0 && event.target !== event.currentTarget) return;
      onClick?.(event);
    };

    const Comp: React.ElementType = asChild ? Slot : href ? 'a' : 'div';
    const suffixes = (
      <>
        {selected && !interactive && <span className="sr-only">{l.selectedSuffix}</span>}
        {today && !interactive && <span className="sr-only">{l.todaySuffix}</span>}
        {invalid && <span className="sr-only">{l.invalidSuffix}</span>}
      </>
    );

    return (
      <InsideCardContext.Provider value={true}>
      <CardDensityContext.Provider value={density}>
      <Comp
        ref={ref}
        role={asButton ? 'button' : undefined}
        tabIndex={asButton ? 0 : undefined}
        href={href && !disabled ? href : undefined}
        aria-pressed={asButton && selected != null ? Boolean(selected) : undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        aria-current={today ? 'date' : isLink && selected ? 'true' : undefined}
        data-today={today || undefined}
        data-density={density === 'compact' ? 'compact' : undefined}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={handleKeyDown}
        className={cn(cardVariants({ interactive, variant }), zero && 'shadow-elevation-surface border-border-default data-[selected=true]:border-border-brand data-[selected=true]:bg-background data-[selected=true]:ring-[3px] data-[selected=true]:ring-background-brand-subtle', isLink && 'block no-underline text-inherit', container && '@container', className)}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {suffixes}
          </>
        )}
      </Comp>
      </CardDensityContext.Provider>
      </InsideCardContext.Provider>
    );
  },
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  // Controls (menu button, badge, buttons) aligned to the end of the header.
  actions?: React.ReactNode;
  // Avatar, icon tile or logo before the title block.
  leading?: React.ReactNode;
  // 4px brand line along the top edge.
  accent?: boolean;
  // Hairline under the header.
  divider?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, leading, accent, divider, children, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    const compact = React.useContext(CardDensityContext) === 'compact';
    const pad = zero ? 'px-5 pt-4 pb-3' : compact ? 'p-5' : 'p-6';
    const decorations = cn(
      accent && 'rounded-t-surface border-t-4 border-solid border-border-brand',
      divider && cn('border-b border-solid border-border', zero ? 'pb-3' : compact ? 'pb-5' : 'pb-6'),
    );
    if (!actions && !leading) {
      return (
        <div ref={ref} className={cn('flex flex-col space-y-[6px]', pad, decorations, className)} {...props}>
          {children}
        </div>
      );
    }
    return (
      <div ref={ref} className={cn('flex items-start gap-3', pad, decorations, className)} {...props}>
        {leading ? <div className="shrink-0">{leading}</div> : null}
        {/* The actions share the first grid row with the title. A negative block margin of 8px lets actions up to title height plus 16px (a 40px control next to a 24px title) sit centered on the title without changing the row; taller actions (a button with a hint line) grow the row and the title centers with them. Nothing is clipped. */}
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-[6px] [&>:first-child:not([data-slot=card-actions])]:self-center [&>:not([data-slot=card-actions])]:col-start-1">
          {children}
          {actions ? <div data-slot="card-actions" className="col-start-2 row-start-1 -my-2 flex items-center justify-self-end gap-2 self-center">{actions}</div> : null}
        </div>
      </div>
    );
  },
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  // Heading element, so the card fits the document outline. Default h3.
  titleAs?: HeadingTag;
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, titleAs: Title = 'h3', ...props }, ref) => {
    const zero = usePreset() === 'zero';
    return (
      // The rule can't see through the `{...props}` spread; every consumer passes visible title text
      // as children (see stories/tests) — same pre-existing false positive already suppressed on
      // AlertTitle (alert.tsx).
      // eslint-disable-next-line jsx-a11y/heading-has-content
      <Title ref={ref} className={cn(zero ? 'typography-ui-lg-semibold tracking-[-0.01em]' : 'font-semibold leading-none tracking-[-0.01em]', 'text-card-foreground', className)} {...props} />
    );
  },
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    // `text-card-foreground-muted` is the dedicated token (Figma `colors/card/foreground/muted`,
    // already shipped as `--colors-card-foreground-muted`) — swapped in for the previous
    // `text-muted-foreground`, which this design system never defines as a utility (same
    // undefined-class issue already fixed on Table's empty-state caption, see table.tsx) and so
    // silently rendered with no color at all.
    <p ref={ref} className={cn('text-sm text-card-foreground-muted [[data-selected=true]_&]:text-text-default [[data-today=true]_&]:text-text-default', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    const compact = React.useContext(CardDensityContext) === 'compact';
    return <div ref={ref} className={cn(zero ? 'px-5 pb-5 pt-0' : compact ? 'p-5 pt-0' : 'p-6 pt-0', '[&>p]:last-of-type:mb-0', className)} {...props} />;
  },
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  // Action row style: hairline above, padded to the card edge ("View report" link or buttons).
  divider?: boolean;
  align?: 'start' | 'end' | 'between';
}

const footerAlign = { start: 'justify-start', end: 'justify-end', between: 'justify-between' } as const;

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, divider, align, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const compact = React.useContext(CardDensityContext) === 'compact';
  return (
  <div
    ref={ref}
    className={cn(
      'flex items-center',
      zero ? 'px-5 pb-5' : compact ? 'p-5' : 'p-6',
      'pt-0',
      divider && 'gap-4 border-t border-solid border-border pt-4',
      align && footerAlign[align],
      className,
    )}
    {...props}
  />
  );
});
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };


// --- Deliberately NOT added (documented rather than silently omitted) ---
//
// A Figma Code Connect mapping (`card.figma.tsx`): unlike Chip/Alert (which each have a genuine,
// name-matching `component_set` indexed in the published "🚧 GetITDone Basic" library, just
// orphaned from the live canvas — see chip.figma.tsx / alert.figma.tsx), this generic composable
// Card (Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter) has no matching Figma
// component at all, live or orphaned. `search_design_system` only turns up unrelated marketing
// composites ("Blog post card", "_Pricing tier card", "Credit card mockup", …) with entirely
// different anatomy/props — mapping this Card to one of those would misrepresent the design system,
// so no `.figma.tsx` was fabricated. The only genuine, live Figma spec found for this component is
// the token layer consumed above (`colors/card/background/default`, `colors/card/foreground/
// default`, `colors/card/foreground/muted`, `borderRadius/card`).
