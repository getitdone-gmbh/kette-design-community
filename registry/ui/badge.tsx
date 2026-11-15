'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePreset } from '@/components/ui/labels-context';

const badgeVariants = cva(
  // Theme expression (kette-tokens 5.26.0): plaque bevel (ghost and link badges unframed) and the data voice (font, figures) with zero specificity, so consumer classes still win; the defaults change nothing
  'inline-flex h-badge max-w-full items-center whitespace-nowrap rounded-item border border-solid border-border px-gap-control text-xs leading-normal font-medium shadow-[shadow:var(--bevel-badge)] [:where(&)]:[font-family:var(--font-data)] [:where(&)]:[font-variant-numeric:var(--numeric-data)]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-general-error-default text-general-error-on',
        outline: 'border-input bg-transparent text-foreground',
        ghost:
          '[--bevel-badge:0_0_transparent] border-transparent bg-badge-background-ghost-default text-badge-foreground-ghost-default',
        subtle:
          'border-transparent bg-badge-background-subtle-default text-badge-foreground-subtle-default',
        link: '[--bevel-badge:0_0_transparent] border-transparent bg-badge-background-link-default text-badge-foreground-link-default',
        // Tinted status tones (container fill, on-container text) for read-only status labels.
        success: 'border-transparent bg-general-success-container text-general-success-on-container',
        warning: 'border-transparent bg-general-warning-container text-general-warning-on-container',
        info: 'border-transparent bg-general-info-container text-general-info-on-container',
        // Credit status tone (data-status-credit subtle fill, on text), matches StatusDot credit.
        credit: 'border-transparent bg-data-status-credit-subtle text-data-status-credit-on',
        // workload.zero product colours (Figma Chip Color=product-*): subtle fill, product text, optional border via `bordered`.
        'product-backoffice': 'border-transparent bg-product-backoffice-subtle',
        'product-workstream': 'border-transparent bg-product-workstream-subtle',
        'product-vacancy': 'border-transparent bg-product-vacancy-subtle',
        'product-jobsearch': 'border-transparent bg-product-jobsearch-subtle',
        'product-coldcall': 'border-transparent bg-product-coldcall-subtle',
        'product-meeting': 'border-transparent bg-product-meeting-subtle',
        // Neutral product accent (slate in light, inverted in dark): readable on its subtle fill in both modes.
        'product-accent': 'border-transparent bg-product-accent-subtle',
      },
      // Tinted form of the solid destructive badge: error container fill with on-container text (status label in a table cell or card).
      tinted: {
        true: '',
      },
      // Product preset (DesignSystemProvider `preset`). `zero` gives the plain badge the outline look and 8px padding, and the info tone the info-subtle tint (the status token, so themes that grey the status tints stay consistent).
      preset: {
        default: '',
        zero: '',
      },
      // Adds the product border colour to the product-* variants (Figma Outline=True). No effect on other variants.
      bordered: {
        true: '',
      },
      // Product variants only: neutral foreground text (>= 4.5:1, the default) instead of the product colour, which falls
      // below AA on its subtle fill (backoffice teal ~3.5:1, accent 2.0:1 in dark). The product tint stays in fill and border.
      // `readable={false}` opts back into the product colour for decorative use where the text is not the only carrier.
      readable: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'destructive', tinted: true, className: 'bg-background-destructive-subtle text-text-destructive-on-subtle' },
      { preset: 'zero', className: 'px-2' },
      { preset: 'zero', variant: 'default', className: 'border-border-default bg-background text-foreground' },
      { preset: 'zero', variant: 'info', className: 'bg-background-info-subtle text-text-info-on-subtle' },
      { variant: 'product-backoffice', bordered: true, className: 'border-product-backoffice-border' },
      { variant: 'product-backoffice', readable: false, className: 'text-product-backoffice-default' },
      { variant: 'product-backoffice', readable: true, className: 'text-foreground' },
      { variant: 'product-workstream', bordered: true, className: 'border-product-workstream-border' },
      { variant: 'product-workstream', readable: false, className: 'text-product-workstream-default' },
      { variant: 'product-workstream', readable: true, className: 'text-foreground' },
      { variant: 'product-vacancy', bordered: true, className: 'border-product-vacancy-border' },
      { variant: 'product-vacancy', readable: false, className: 'text-product-vacancy-default' },
      { variant: 'product-vacancy', readable: true, className: 'text-foreground' },
      { variant: 'product-jobsearch', bordered: true, className: 'border-product-jobsearch-border' },
      { variant: 'product-jobsearch', readable: false, className: 'text-product-jobsearch-default' },
      { variant: 'product-jobsearch', readable: true, className: 'text-foreground' },
      { variant: 'product-coldcall', bordered: true, className: 'border-product-coldcall-border' },
      { variant: 'product-accent', bordered: true, className: 'border-product-accent-border' },
      { variant: 'product-coldcall', readable: false, className: 'text-product-coldcall-default' },
      { variant: 'product-coldcall', readable: true, className: 'text-foreground' },
      { variant: 'product-meeting', bordered: true, className: 'border-product-meeting-border' },
      { variant: 'product-meeting', readable: false, className: 'text-product-meeting-default' },
      { variant: 'product-meeting', readable: true, className: 'text-foreground' },
      { variant: 'product-accent', readable: true, className: 'text-foreground' },
      { variant: 'product-accent', readable: false, className: 'text-product-accent-default' },
    ],
    defaultVariants: {
      variant: 'default',
      readable: true,
      preset: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, Omit<VariantProps<typeof badgeVariants>, 'preset'> {
  // Optional leading icon. Decorative (aria-hidden), sized with the icon tokens. The text carries the meaning.
  icon?: React.ReactNode;
  // Where the icon sits (Figma Lead glyph). `end` puts it after the text, at the right edge of the badge. Default `start`.
  iconPosition?: 'start' | 'end';
  // Classes for the icon slot, e.g. `text-icon-success` to colour the icon apart from the text. The icon draws in the text colour (currentColor) without it.
  iconClassName?: string;
  // Small neutral status dot before the text (decorative). Shown instead of `icon` when both are set.
  dot?: boolean;
}

function Badge({ className, variant, bordered, readable, tinted, icon, iconPosition = 'start', iconClassName, dot, children, title, ...props }: BadgeProps) {
  const zero = usePreset() === 'zero';
  const hasAdornment = Boolean(icon || dot);
  const isText = typeof children === 'string' || typeof children === 'number';
  // Text sits in its own label slot: the badge keeps the 0.25.0 box (inline-flex, fixed height, normal baseline) and only the label truncates, and only when max-w-full is reached. The 4px padding and the matching negative margin keep descenders out of the overflow clip without changing the layout.
  const text = isText ? String(children) : undefined;
  const iconSlot = icon ? (
    <span aria-hidden="true" data-slot="icon" className={cn('inline-flex shrink-0 [&>svg]:h-icon-xs [&>svg]:w-icon-xs', iconClassName)}>
      {icon}
    </span>
  ) : null;
  // The dot always leads; the icon trails only when asked and when no dot replaces it.
  const trailing = !dot && iconPosition === 'end';
  return (
    <div
      data-slot="badge"
      data-variant={variant ?? 'default'}
      data-icon-position={icon && !dot ? iconPosition : undefined}
      className={cn(
        badgeVariants({ variant, bordered, readable, tinted, preset: zero ? 'zero' : 'default' }),
        hasAdornment && 'gap-1',
        className,
      )}
      title={title ?? text}
      {...props}
    >
      {dot ? (
        <span aria-hidden="true" data-slot="dot" className="h-2 w-2 shrink-0 rounded-full bg-icon-subtle" />
      ) : trailing ? null : (
        iconSlot
      )}
      {isText ? (
        <span data-slot="label" className="-my-1 min-w-0 truncate py-1">
          {children}
        </span>
      ) : (
        children
      )}
      {trailing ? iconSlot : null}
    </div>
  );
}

export { Badge, badgeVariants };
