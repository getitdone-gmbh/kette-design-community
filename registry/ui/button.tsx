'use client';

import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cloneElement, forwardRef, isValidElement } from 'react';

import { Loader2 } from 'lucide-react';

import { focusRing, transitionBase } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { useLabels, usePreset } from '@/components/ui/labels-context';
import { StatusDot, type StatusDotTone } from '@/components/ui/status-dot';

const buttonVariants = cva('', {
  variants: {
    // State model (all variants): rest, hover, active (pressed), `data-[state=open]` (= hover look,
    // for menu/popover triggers), focus-visible (shared focus ring recipe) and disabled (set in the
    // base classes). Filled variants carry a 1px border in their own fill color and no shadow.
    variant: {
      default: [
        'border-button-background-default',
        'text-button-foreground-default',
        'bg-button-background-default',
        'hover:text-button-foreground-hover',
        'hover:bg-button-background-hover',
        'hover:border-button-background-hover',
        'data-[state=open]:text-button-foreground-hover',
        'data-[state=open]:bg-button-background-hover',
        'data-[state=open]:border-button-background-hover',
        'active:bg-button-background-hover',
        // Disabled keeps the neutral disabled border role, never the brand fill colour or a hover stroke.
        'disabled:border-border-disabled',
      ],
      // Brand-filled button (Figma "Variant=Filled, Color=Brand", node 3287:427299), bound to the
      // themeable `semantic/primary` role. Fill AND border use the primary token; hover darkens
      // both, active goes one step further (`background-brand-bold-active`).
      primary: [
        'border-button-background-primary-default',
        'text-button-foreground-primary-default',
        'bg-button-background-primary-default',
        'hover:bg-button-background-primary-hover',
        'hover:border-button-background-primary-hover',
        'data-[state=open]:bg-button-background-primary-hover',
        'data-[state=open]:border-button-background-primary-hover',
        'active:bg-background-brand-bold-active',
        'active:border-background-brand-bold-active',
        'disabled:border-border-disabled',
      ],
      // general-error family: the only destructive fill with a dark-mode-tuned `-on` text and
      // hover step, so text stays >= 4.5:1 in every theme and mode (rest, hover, open, active).
      destructive: [
        'border-general-error-default',
        'text-general-error-on',
        'bg-general-error-default',
        'hover:bg-general-error-hover',
        'hover:border-general-error-hover',
        'data-[state=open]:bg-general-error-hover',
        'data-[state=open]:border-general-error-hover',
        'active:bg-general-error-hover',
        'active:border-general-error-hover',
      ],
      // Outline: neutral `input` stroke, page background, `shadow-xs`. Hover darkens the BORDER
      // (no background tint); pressed fills `bg-muted`.
      outline: [
        'border-input',
        'bg-background',
        'text-foreground',
        'shadow-xs',
        'hover:border-border-bold',
        'data-[state=open]:border-border-bold',
        'active:bg-muted',
        // Disabled keeps the neutral disabled border role, never a hover or open stroke.
        'disabled:border-border-disabled',
      ],
      // Outline with destructive intent: error-coloured text and stroke on the page background, error tint with on-container text on hover/press (AA in light and dark).
      'outline-destructive': [
        'border-general-error-default',
        'bg-background',
        'text-general-error-default',
        'shadow-xs',
        'hover:bg-general-error-container',
        'hover:text-general-error-on-container',
        'data-[state=open]:bg-general-error-container',
        'data-[state=open]:text-general-error-on-container',
        'active:bg-general-error-container',
        'active:text-general-error-on-container',
      ],
      // Secondary: soft neutral fill, distinct from ghost (ghost is transparent at rest).
      secondary: [
        'border-transparent',
        'bg-muted',
        'text-foreground',
        'hover:bg-muted-strong',
        'data-[state=open]:bg-muted-strong',
        'active:bg-muted-strong',
        // The border stays transparent when disabled (no brand or focus-like stroke).
        'disabled:border-transparent',
      ],
      ghost: [
        'border-transparent',
        'bg-transparent',
        'text-foreground',
        'hover:bg-muted',
        'data-[state=open]:bg-muted',
        'active:bg-muted-strong',
      ],
      link: ['border-transparent', 'underline-offset-4'],
    },
    size: {
      // Control heights, paddings and icon sizes bind to the `--size-control-*` and `--size-icon-*` tokens, so one markup is comfortable in every theme and compact in `zero`.
      // Heights are the control tokens: sm 32 (28 in zero), md and default 40 (32 in zero), lg 42 (36 in zero), xl 48, 2xl 56 (zero 48).
      // Label type: sm 13/500 (12 via the `button-sm` token variables in zero), md and default `typography-button-md`, lg, xl and 2xl their own `typography-button-*` role.
      sm: ['leading-normal', 'h-control-sm', 'px-button-px-sm', 'gap-button-gap-sm'],
      default: ['typography-button-md', 'leading-normal', 'h-control-md', 'px-control-px-md', 'gap-2'],
      md: ['typography-button-md', 'leading-normal', 'h-control-md', 'px-control-px-md', 'gap-2'],
      lg: ['typography-button-lg', 'leading-normal', 'h-control-lg', 'px-control-px-lg', 'gap-2'],
      xl: ['typography-button-xl', 'leading-normal', 'h-control-xl', 'px-control-px-xl', 'gap-2'],
      '2xl': ['typography-button-2xl', 'leading-normal', 'h-control-2xl', 'px-control-px-2xl', 'gap-3'],
      clamp: ['text-clamp', 'leading-clamp', 'h-10', 'px-8'],
      'clamp-sm': ['text-clamp-small', 'leading-clamp-small', 'h-8', 'px-6'],
      link: ['text-base', 'leading-base', 'px-8'],
      'link-sm': ['text-sm', 'leading-sm', 'px-6'],
      // Icon-only squares share the height of the text size with the same name, so a row that mixes text and icon buttons lines up.
      // Heights bind to the control tokens: icon-xs 28 (24 in zero), icon-sm 32 (28), icon 40 (32), icon-lg 42 (36), icon-xl 48 (40), icon-2xl 56 (zero 48).
      // icon-xs is the dense list size (row actions, tags, comments): the hit area is the token (24 at least, WCAG 2.5.8) and the glyph is the `icon-xs` token (14).
      'icon-xs': ['typography-button-sm', 'h-control-xs', 'w-control-xs', '[&>svg]:h-icon-xs', '[&>svg]:w-icon-xs'],
      'icon-sm': ['typography-button-sm', 'h-control-sm', 'w-control-sm'],
      icon: ['typography-button-md', 'h-control-md', 'w-control-md'],
      'icon-lg': ['typography-button-lg', 'h-control-lg', 'w-control-lg'],
      'icon-xl': ['typography-button-xl', 'h-control-xl', 'w-control-xl'],
      'icon-2xl': ['typography-button-2xl', 'h-control-2xl', 'w-control-2xl'],
      // Density-aware sizes: height comes from the `--size-control-*` token vars, so the same markup is
      // comfortable (32/40/42) in every theme and compact (28/32/36) in themes that ship compact density
      // (e.g. `zero`). Opt in per control (or per table) instead of changing the default sizes.
      // Alias of `sm` (kept for existing consumers): the same density-aware height, padding and gap tokens.
      'control-sm': ['leading-normal', 'h-control-sm', 'px-button-px-sm', 'gap-button-gap-sm'],
      'control-md': ['leading-normal', 'h-control-md', 'px-3', 'gap-2'],
      'control-lg': ['typography-button-md', 'leading-normal', 'h-control-lg', 'px-4', 'gap-2'],
      // Inline text link inside running copy (use with variant="link"). Type is inherited from the surrounding text through zero-specificity `:where()` rules, so any `text-*` or `font-*` class a consumer passes wins. The box is exactly the text line (no border, no min-height, no negative margin), so it adds no line height and no 1px shift. The 24px target (WCAG 2.5.8) is a centered pseudo-element that is at most 8px taller than the line, so it does not cover neighbouring lines or controls.
      inline: [
        'relative',
        'border-0',
        'gap-1',
        '[:where(&)]:[font-family:inherit]',
        '[:where(&)]:[font-size:inherit]',
        '[:where(&)]:[font-weight:inherit]',
        '[:where(&)]:[line-height:inherit]',
        "after:content-['']",
        'after:absolute',
        'after:left-1/2',
        'after:top-1/2',
        'after:-translate-x-1/2',
        'after:-translate-y-1/2',
        'after:[width:max(100%,theme(spacing.6))]',
        'after:[height:min(theme(spacing.6),calc(1lh_+_theme(spacing.2)))]',
      ],
      'no-size': [],
    },
    // Product preset (see DesignSystemProvider `preset`). `zero` tightens the label type, the gap and the icon-only squares to the workload.zero scale.
    preset: {
      default: [],
      zero: [],
    },
  },
  compoundVariants: [
    // Link appearance of the inline size: link colour roles, underline (not colour alone), no weight change on hover so the text never reflows.
    { variant: 'link', size: 'inline', className: ['text-link-default', 'hover:text-link-hover', 'active:text-link-active', 'underline', 'underline-offset-4', 'hover:decoration-2'] },
    // The other link sizes keep the semibold hover.
    { variant: 'link', size: ['default', 'md', 'sm', 'lg', 'xl', '2xl', 'clamp', 'clamp-sm', 'link', 'link-sm', 'control-sm', 'control-md', 'control-lg', 'no-size', 'icon-xs', 'icon-sm', 'icon', 'icon-lg', 'icon-xl', 'icon-2xl'], className: 'hover:font-semibold' },
    // Label type of the small sizes: 13/500 by default; in zero the `button-sm` token variables (12px). The variables are read directly because the `typography-button-sm` role class is overridden by an `inherit` rule in the tokens preset, which made the label take the surrounding font size.
    { preset: 'default', size: ['sm', 'control-sm', 'control-md'], className: ['text-ui', 'font-medium', 'leading-normal'] },
    { preset: 'zero', size: ['sm', 'control-sm'], className: ['text-[length:var(--typo-button-sm-size)]', 'font-[number:var(--typo-button-sm-weight)]', 'leading-[var(--typo-button-sm-lh)]', 'tracking-[var(--typo-button-sm-ls)]'] },
    { preset: 'zero', size: 'control-md', className: ['text-ui', 'font-medium', 'leading-normal', 'gap-gap-control'] },
    { preset: 'zero', size: ['default', 'md', 'lg', 'xl', 'control-lg'], className: 'gap-gap-control' },
    { preset: 'zero', variant: ['default', 'primary', 'destructive'], className: 'shadow-elevation-surface' },
    // Outline in zero: hover tints the surface and the border keeps the default role (also in dark).
    {
      preset: 'zero',
      variant: 'outline',
      className: ['border-border-default', 'hover:bg-muted', 'hover:border-border-default', 'data-[state=open]:bg-muted', 'data-[state=open]:border-border-default'],
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'default',
    preset: 'default',
  },
});

/** Variants whose background is a solid, shadowed fill (Figma "Variant=Filled"). */
const FILLED_VARIANTS = new Set(['default', 'primary', 'destructive']);

// Leading icon slot: the `--size-icon-md` token (20 in most themes, 16 in zero) through `xl`, 24px at `2xl`.
// Count pill fill on filled buttons: a 5 percent tint of the on-fill text colour with a 30 percent inset outline, so it stays readable (see button-count-contrast.test.ts) instead of the muted grey fill.
const FILLED_COUNT: Record<string, string> = {
  default: 'bg-button-foreground-default/5 ring-button-foreground-default/30',
  primary: 'bg-button-foreground-primary-default/5 ring-button-foreground-primary-default/30',
  destructive: 'bg-general-error-on/5 ring-general-error-on/30',
};

// Round count pill outside zero: 20px high, at least 20px wide (min-width via theme(), because consumer Tailwind 3.3 has no min-w-5 utility), centred, so one digit is a circle and longer text grows into a pill.
const COUNT_PILL = ['inline-flex', 'h-5', '[min-width:theme(spacing.5)]', 'items-center', 'justify-center', 'rounded-full', 'px-1', 'tabular-nums', 'text-xs'];

const iconSlotClass = (size: ButtonProps['size']) => (size === '2xl' ? ['h-6', 'w-6'] : size === 'icon-xs' ? ['h-icon-xs', 'w-icon-xs'] : ['h-icon-md', 'w-icon-md']);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, 'preset'> {
  asChild?: boolean;
  /** Custom leading icon (Figma "Icon=Default"). Ignored when `dotLeading` is set. */
  icon?: React.ReactNode;
  /**
   * Renders a small leading status dot instead of a custom icon (Figma "Icon=Dot leading").
   * Mutually exclusive with `icon` — `dotLeading` wins if both are supplied.
   */
  dotLeading?: boolean;
  underline?: boolean;
  // Link variant only: keeps the horizontal padding of the size, so a link button in a toolbar or button group has the same hit area as its neighbours. Without it the link has no padding and reads as inline text.
  padded?: boolean;
  // Busy state: shows a spinner in the icon slot, keeps the label, blocks activation and sets `aria-busy`.
  loading?: boolean;
  // Accessible busy text read by screen readers while `loading`. Wins over the provider label.
  loadingLabel?: string;
  // Small count pill after the label (for example a filter button with 3 active filters).
  count?: number | string;
  // Where the count sits when the children end with an icon. `end` (default) puts it last, `before-icon` puts it right after the label and before a trailing icon.
  countPlacement?: 'end' | 'before-icon';
  // Small status dot in the bottom right corner, mainly for icon-only buttons (sync, connection). Pair it with `statusLabel`, colour alone is not enough.
  status?: StatusDotTone;
  // Text for assistive tech. It is appended to `aria-label` when set, otherwise added as hidden text.
  statusLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, dotLeading = false, underline = false, padded = false, loading = false, loadingLabel, count, countPlacement = 'end', status, statusLabel, children, disabled, onClick, 'aria-label': ariaLabel, ...props }, ref) => {
    const l = useLabels({ loading: loadingLabel });
    const zero = usePreset() === 'zero';
    // Without an explicit variant the zero preset renders the secondary (outline) button, filled brand stays opt-in.
    const resolvedVariant = variant ?? (zero ? 'outline' : 'default');
    const Comp = asChild ? Slot : 'button';
    // With `asChild`, Slottable marks the child element; icon and dot render inside it.
    const isFilled = FILLED_VARIANTS.has(resolvedVariant);

    // Figma's "_Dot" anatomy is a fixed status indicator, not a color-axis follower:
    // on solid/Filled backgrounds it renders as the on-color (matches the label via
    // `currentColor`); on every other variant it renders as the fixed success token.
    const dot = dotLeading ? (
      <span
        aria-hidden="true"
        className={cn('inline-block', 'shrink-0', 'h-[10px]', 'w-[10px]', 'rounded-full', {
          'bg-current': isFilled,
          'bg-button-background-success-default': !isFilled,
        })}
      />
    ) : null;

    // Match the icon's own className (like the passed-in icon's markup does for size
    // overrides elsewhere) rather than clipping it inside a fixed-size wrapper, so
    // consumers can still override sizing per-instance.
    const spinner = loading ? (
      <Loader2 aria-hidden="true" data-button-spinner="" className={cn('order-first shrink-0', 'animate-spin', iconSlotClass(size))} />
    ) : null;

    const leadingIcon =
      !loading && !dotLeading && icon
        ? isValidElement<{ className?: string }>(icon)
          ? cloneElement(icon, { className: cn('order-first shrink-0', iconSlotClass(size), icon.props.className) })
          : icon
        : null;

    return (
      <Comp
        className={cn(
          'inline-flex',
          // A label never wraps inside a button. A group of buttons wraps (or collapses) instead. The link variant is running text (an author name in a teaser) and may wrap.
          { 'whitespace-nowrap': resolvedVariant !== 'link' },
          { relative: Boolean(status) },
          'items-center',
          'justify-center',
          'rounded-control',
          'border',
          'border-solid',
          transitionBase,
          focusRing,
          // Count before a trailing icon: icons that are not the leading one move behind the DOM-last count.
          countPlacement === 'before-icon' && '[&>svg:not(.order-first)]:order-last',
          // A disabled button that still holds focus (clicked, then disabled) must not keep the focus ring: it reads as an enabled, focused control.
          'disabled:focus-visible:ring-0',
          'disabled:focus-visible:ring-offset-0',
          'disabled:pointer-events-none',
          'disabled:opacity-disabled',
          'disabled:data-[loading=true]:opacity-100',
          { 'underline-offset-4': underline },
          { 'hover:underline': underline },
          { 'hover:decoration-2': underline },
          { underline: underline && resolvedVariant === 'link' },
          buttonVariants({ variant: resolvedVariant, size, preset: zero ? 'zero' : 'default', className: [resolvedVariant === 'link' && !padded && 'p-0', className] }),
        )}
        ref={ref}
        data-slot="button"
        data-variant={resolvedVariant}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        data-status={status}
        aria-label={ariaLabel && status && statusLabel ? `${ariaLabel}, ${statusLabel}` : ariaLabel}
        onClick={loading ? undefined : onClick}
        {...props}
      >
        {loading ? null : dot}
        {spinner}
        {leadingIcon}
        <Slottable>{children}</Slottable>
        {count != null && (
          <span
            data-button-count=""
            className={cn(
              isFilled
                ? zero
                  ? ['tabular-nums', 'text-inherit', 'typography-kpi-label-strong', 'rounded-full px-1 ring-1 ring-inset', FILLED_COUNT[resolvedVariant]]
                  : [...COUNT_PILL, 'text-inherit', 'ring-1 ring-inset', FILLED_COUNT[resolvedVariant]]
                : zero
                ? ['typography-kpi-label-strong', 'text-text-subtle', 'tabular-nums']
                : [...COUNT_PILL, 'bg-muted', 'text-text-muted'],
            )}
          >
            {count}
          </span>
        )}
        {loading ? <span className="sr-only">{l.loading}</span> : null}
        {status ? <StatusDot tone={status} size="md" className="absolute bottom-0 right-0 ring-2 ring-background" /> : null}
        {status && statusLabel && !ariaLabel ? <span className="sr-only">{statusLabel}</span> : null}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
