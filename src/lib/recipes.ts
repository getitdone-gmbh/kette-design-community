// Shared Tailwind recipes consumed by several primitives so the interaction model stays identical everywhere. Tokens only: every class is a token-preset utility.

// Shared keyboard focus ring (tokens 4.28): 2px ring in the `ring-default` role, offset 2px from the control by the page background.
export const focusRing = [
  'focus-visible:outline-none',
  'focus-visible:ring-focus',
  'focus-visible:ring-offset-focus',
  'focus-visible:ring-offset-background',
  'focus-visible:ring-ring-default',
  // Theme focus glow (kette-tokens 5.26.0 glow-focus) drawn below the solid ring, 0 0 #0000 in themes without one
  'focus-visible:[--tw-ring-shadow:var(--tw-ring-inset)_0_0_0_calc(var(--size-focus-ring-width)+var(--tw-ring-offset-width))_var(--tw-ring-color),var(--glow-focus)]',
] as const;

// Shared focus ring for controls on an inverse surface (dark band in light mode, light band in dark mode): the ring takes the inverse text role and the gap takes the inverse background, so both follow the band in either theme.
export const focusRingInverse = [
  'focus-visible:outline-none',
  'focus-visible:ring-focus',
  'focus-visible:ring-offset-focus',
  'focus-visible:ring-offset-background-inverse',
  'focus-visible:ring-text-inverse',
] as const;

// Text-field family (input, select, textarea, editors): the shared ring plus the `ring` border colour on the field edge.
export const focusRingField = [...focusRing, 'focus-visible:border-ring'] as const;

// Same look as focusRingField but driven by a Radix `data-[state=open]` attribute (pointer-opened triggers).
export const openRing = [
  'data-[state=open]:ring-focus',
  'data-[state=open]:ring-offset-focus',
  'data-[state=open]:ring-offset-background',
  'data-[state=open]:ring-ring-default',
  'data-[state=open]:border-ring',
] as const;

// Invalid state driven by `aria-invalid` (arbitrary-variant form: `aria-invalid` is not in the aria allow-list). The focus ring turns destructive.
export const invalidRing = [
  'aria-[invalid=true]:border-destructive',
  'aria-[invalid=true]:ring-destructive/20',
  'aria-[invalid=true]:focus-visible:border-destructive',
  'aria-[invalid=true]:focus-visible:ring-destructive',
  'aria-[invalid=true]:data-[state=open]:ring-destructive',
  'aria-[invalid=true]:data-[state=open]:border-destructive',
] as const;

/** Fast-in, fast-out interaction transition (150ms rest, 75ms on hover/press for a snappy response). */
export const transitionBase = [
  'transition-[color,background-color,border-color,box-shadow]',
  'duration-150',
  'hover:duration-75',
  'active:duration-75',
] as const;

/** Popover-like floating surface: menus, select lists, popovers, hover cards, nav viewport. */
export const overlaySurface = [
  'bg-popover',
  'text-popover-foreground',
  'rounded-popover',
  'border',
  'border-solid',
  'border-hairline',
  'shadow-popover',
] as const;

/** Overlay open/close motion: fade + subtle zoom from 98%, 150ms, instant under reduced motion. */
export const overlayMotion = [
  'data-[state=open]:animate-in',
  'data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0',
  'data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95',
  'data-[state=open]:zoom-in-[0.98]',
  'duration-150',
  'motion-reduce:animate-none',
  'motion-reduce:transition-none',
] as const;

// Keyboard focus on a menu row: an own inset 2px outline (3:1 against the grey highlight, WCAG 2.4.11). It replaces any app-wide :focus-visible outline instead of stacking on it, because it sets the same outline properties with a higher specificity.
export const menuItemFocusVisible = [
  'focus-visible:outline',
  'focus-visible:outline-2',
  'focus-visible:-outline-offset-2',
  'focus-visible:outline-ring-default',
] as const;

// Keyboard focus on a scroll container whose children paint over it (table cells, grid cells): an inset 2px outline. An outline is painted above the descendants and is not clipped by the container's own overflow, unlike an inset ring (box-shadow), which sits under the cells' backgrounds.
export const scrollRegionFocusVisible = [
  'focus-visible:outline',
  'focus-visible:outline-2',
  'focus-visible:-outline-offset-2',
  'focus-visible:outline-ring-default',
] as const;

// The same ring as an always-on class list, for an overlay element that is shown while a sibling scroll container has keyboard focus (the overlay sits above sticky headers).
export const scrollRegionRing = ['outline', 'outline-2', '-outline-offset-2', 'outline-ring-default'] as const;

/** Menu / select / command row. Regular weight (owner decision), highlight uses `bg-muted`; no inset rings. */
export const menuItem = [
  'relative',
  'flex',
  'cursor-default',
  'select-none',
  'items-center',
  'gap-[10px]',
  'rounded-item',
  'px-2',
  'py-[6px]',
  'text-sm',
  'font-normal',
  'outline-none',
  'transition-colors',
  'focus:bg-muted',
  'data-[highlighted]:bg-muted',
  ...menuItemFocusVisible,
  'data-[disabled]:pointer-events-none',
  'data-[disabled]:opacity-disabled',
] as const;

/** Destructive menu row variant (`variant="destructive"` on menu items). */
export const menuItemDestructive = [
  'text-destructive',
  'focus:bg-destructive/10',
  'focus:text-destructive',
  'data-[highlighted]:bg-destructive/10',
] as const;

// Zero preset field state: the 3px halo (`ring-halo`) at 15 percent (`--opacity-ring-halo`) on focus, open and invalid. Replaces focusRingField and openRing, it does not stack on them.
export const fieldHaloZero = [
  'focus-visible:outline-none',
  'focus-visible:ring-halo',
  'focus-visible:ring-ring/ring-halo',
  'focus-visible:border-ring',
  'data-[state=open]:ring-halo',
  'data-[state=open]:ring-ring/ring-halo',
  'data-[state=open]:border-ring',
  'aria-[invalid=true]:ring-halo',
  'aria-[invalid=true]:ring-destructive/ring-halo',
  'aria-[invalid=true]:focus-visible:ring-destructive/ring-halo',
  'aria-[invalid=true]:data-[state=open]:ring-destructive/ring-halo',
] as const;

/** Zero preset overrides for {@link overlaySurface}: default border role and the raised elevation. Append after `overlaySurface`. */
export const overlaySurfaceZero = ['border-border-default', 'shadow-elevation-raised'] as const;

/** Zero preset menu row: 32px (control-md) high, 13/400 ui role, 8px radius, 12px gap. Use instead of {@link menuItem}. */
export const menuItemZero = [
  'relative',
  'flex',
  'cursor-default',
  'select-none',
  'items-center',
  'gap-3',
  'rounded-control',
  'px-2',
  'min-h-[var(--size-control-md)]',
  'py-0',
  'typography-ui',
  'font-regular',
  'outline-none',
  'transition-colors',
  'focus:bg-muted',
  'data-[highlighted]:bg-muted',
  ...menuItemFocusVisible,
  'data-[disabled]:pointer-events-none',
  'data-[disabled]:opacity-disabled',
] as const;

// Zero preset surface of the composite fields (SingleSelect, MultiSelect, DatePicker trigger): control height, control padding, the default border role and the focus halo. Use instead of the legacy border classes, do not stack.
export const compositeFieldZero = [
  'min-h-[var(--size-control-md)]',
  'pl-control-px-sm',
  'border-input',
  'hover:border-border-bold',
  'focus-within:border-ring',
  'focus-within:ring-halo',
  'focus-within:ring-ring/ring-halo',
  'aria-[invalid=true]:border-destructive',
  'aria-[invalid=true]:ring-halo',
  'aria-[invalid=true]:ring-destructive/ring-halo',
] as const;

// Legacy surface of the composite fields, kept for the default preset.
export const compositeFieldDefault = [
  'border-form-border-default',
  'hover:border-input-background-hover',
  'aria-[invalid=true]:border-error',
  'pl-2',
] as const;

// Display voice of the theme (kette-tokens 5.26.0 font-display, case-display, tracking-display, text-shadow-display) for dialog, sheet and card titles; h1 to h3 get it in tailwind.css.
// Neutral values: the primary font, no case, 0em added tracking, no text shadow. Case and text shadow use zero specificity, so a consumer class still wins.
export const displayVoice = [
  '![font-family:var(--font-display),sans-serif]',
  '[--tracking-extra:var(--tracking-display)]',
  '[:where(&)]:[text-transform:var(--case-display)]',
  '[:where(&)]:[text-shadow:var(--text-shadow-display)]',
] as const;

