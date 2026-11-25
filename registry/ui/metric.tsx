'use client';

import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { focusRing, transitionBase } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { usePreset } from '@/components/ui/labels-context';

// Figma: Metric item 1560:266217 (Variant=Strip|Compact|Compact chart|Simple|Icon 01|Icon 02|Chart) and KpiStrip 10151:371413.
const metricItemVariants = cva(['relative min-w-0 text-left', ...transitionBase], {
  variants: {
    variant: {
      // Flat cell inside a KpiStrip: no surface, optional left divider.
      strip: 'flex min-w-0 flex-1 flex-col justify-center gap-micro px-4 py-1',
      // Self-contained one-line tile.
      compact: 'flex h-kpi-strip items-center gap-2 rounded-surface border border-solid border-border bg-card pl-4 pr-3 py-2 shadow-elevation-surface',
      // Stacked card with optional leading icon and trailing chart slot.
      card: 'flex flex-col gap-2 rounded-surface border border-solid border-border bg-card shadow-elevation-surface',
    },
    // Card padding: `compact` tightens p-6 to p-4 (footer action bleed follows).
    density: {
      default: '',
      compact: '',
    },
    interactive: {
      true: ['cursor-pointer', ...focusRing, 'hover:bg-muted', 'active:bg-muted-strong'],
      false: '',
    },
    selected: {
      true: 'border-border-brand bg-background-brand-subtle',
      false: '',
    },
    disabled: {
      true: 'pointer-events-none opacity-disabled',
      false: '',
    },
    // Anchor tile: no browser link styling, the tile keeps its own text roles.
    link: {
      true: 'no-underline text-inherit',
      false: '',
    },
  },
  compoundVariants: [
    // The strip clips overflow, so its focus ring sits inside the tile (same recipe as ButtonGroup).
    { variant: 'strip', interactive: true, className: 'focus-visible:ring-inset focus-visible:ring-offset-0' },
    { variant: 'strip', selected: true, className: 'border-b-2 border-solid' },
    { variant: 'card', density: 'default', className: 'p-6' },
    { variant: 'card', density: 'compact', className: 'p-4' },
  ],
  defaultVariants: { variant: 'strip', density: 'default', interactive: false, selected: false, disabled: false, link: false },
});

const deltaToneClass = {
  neutral: 'text-text-subtle',
  success: 'text-text-success',
  destructive: 'text-text-destructive',
  warning: 'text-text-warning',
} as const;

const deltaChipClass = {
  neutral: 'bg-muted text-text-muted',
  success: 'bg-background-success-subtle text-general-success-on-container',
  destructive: 'bg-background-destructive-subtle text-text-destructive-on-subtle',
  warning: 'bg-background-warning-subtle text-general-warning-on-container',
} as const;

export type MetricDeltaTone = keyof typeof deltaToneClass;

export interface MetricItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>,
    // Partial keeps both optional whatever cva version the consumer resolves (cva 0.7.1 types defaulted variants as required).
    Partial<Pick<VariantProps<typeof metricItemVariants>, 'variant' | 'density'>> {
  label: React.ReactNode;
  // Room after the label for a HelpIcon or a similar small addon. It sits outside the truncated label text, so it is never cut off. Use it on static tiles: a button or link tile must not hold another control.
  labelAddon?: React.ReactNode;
  // Wraps a long label over lines instead of cutting it with an ellipsis.
  labelWrap?: boolean;
  value: React.ReactNode;
  // Change vs. a previous period, e.g. "+3 vs last week".
  delta?: React.ReactNode;
  deltaTone?: MetricDeltaTone;
  // Left separator line (strip variant). KpiStrip hides it on the first item automatically.
  divider?: boolean;
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  // Makes the item a real button (filter-by-metric pattern). With `href` or `asChild` it is a click listener on the link.
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  // Makes the item a real link (`<a href>`): middle click, new tab and the context menu work. Label, value, delta and caption form the link name. Wins over `onClick` as the element, so it is never a button.
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  // The single child is the link element (Next.js `Link`, router link). The tile classes, state and content are merged into it. Replaces the extra-content `children`, which is not rendered then.
  asChild?: boolean;
  // Leading icon. Card: icon tile above the label. Strip and compact: small decorative icon before the label.
  icon?: React.ReactNode;
  // Supporting line under the value, e.g. "Target 160 h" (all variants).
  caption?: React.ReactNode;
  // Trailing chart or sparkline slot (compact, card).
  chart?: React.ReactNode;
  // Action row at the bottom edge of the card variant ("View report" link or button).
  footerAction?: React.ReactNode;
}

const MetricItem = React.forwardRef<HTMLElement, MetricItemProps>(
  (
    {
      className,
      variant = 'strip',
      density = 'default',
      label,
      labelAddon,
      labelWrap = false,
      value,
      delta,
      deltaTone = 'neutral',
      divider = true,
      selected = false,
      loading = false,
      disabled = false,
      onClick,
      href,
      target,
      rel,
      asChild = false,
      icon,
      caption,
      chart,
      footerAction,
      children,
      ...props
    },
    ref,
  ) => {
    const isStrip = variant === 'strip';
    const isLink = (Boolean(href) || asChild) && !disabled && !loading;
    const interactive = (Boolean(onClick) || isLink) && !disabled && !loading;
    const classes = cn(metricItemVariants({ variant, density, interactive, selected, disabled, link: isLink }), className);

    const labelClass = cn('block', labelWrap ? 'break-words' : 'truncate', isStrip || variant === 'compact' ? 'typography-kpi-label' : 'typography-label', selected ? 'text-text-brand-on-subtle' : 'text-text-subtle');
    // With an addon the label truncates on its own and the addon keeps its size next to it.
    const addon = labelAddon ? <span className="inline-flex shrink-0 items-center">{labelAddon}</span> : null;
    const labelRow = addon ? (
      <span className="flex min-w-0 items-center gap-1">
        <span className={cn(labelClass, 'min-w-0')}>{label}</span>
        {addon}
      </span>
    ) : (
      <span className={labelClass}>{label}</span>
    );
    const valueClass = isStrip || variant === 'compact' ? 'typography-kpi-value' : 'typography-kpi-value-lg';
    // Skeleton bars keep the loaded line geometry: with the same type role, and the real text as transparent filler when the consumer passes it while loading, they wrap and measure exactly like the loaded item. Without text they fall back to a fixed width.
    const bar = 'rounded-item bg-overlay-skeleton-default text-transparent motion-reduce:animate-none select-none';
    const filler = (content: React.ReactNode, width: string) => (content ? <span className={cn(bar, 'break-words md:truncate')}>{content}</span> : <span className={cn(bar, 'inline-block align-top', width)}>&nbsp;</span>);

    const body = loading ? (
      <>
        {icon && variant === 'card' ? <span className="mb-2 flex h-avatar-lg w-avatar-lg items-center justify-center rounded-full bg-background-brand-subtle text-icon-brand">{icon}</span> : null}
        {labelRow}
        <span className="flex items-baseline gap-2 max-md:flex-wrap" aria-hidden="true">
          <span className={valueClass}>{filler(value, 'w-16')}</span>
          <span className="typography-kpi-label break-words md:truncate">{filler(delta, 'w-12')}</span>
        </span>
        {caption ? <span className="typography-kpi-label block break-words md:truncate" aria-hidden="true">{filler(caption, 'w-24')}</span> : null}
      </>
    ) : (
      <>
        {icon && variant === 'card' ? <span className="mb-2 flex h-avatar-lg w-avatar-lg items-center justify-center rounded-full bg-background-brand-subtle text-icon-brand">{icon}</span> : null}
        {icon && variant !== 'card' ? (
          <span className="flex min-w-0 items-center gap-1">
            <span aria-hidden="true" className="inline-flex shrink-0 text-icon-subtle [&>svg]:h-icon-md [&>svg]:w-icon-md">
              {icon}
            </span>
            <span className={cn('block min-w-0 truncate typography-kpi-label', selected ? 'text-text-brand-on-subtle' : 'text-text-subtle')}>{label}</span>
            {addon}
          </span>
        ) : (
          labelRow
        )}
        <span className="flex items-baseline gap-2 max-md:flex-wrap">
          <span className={cn('text-text-default', valueClass)}>{value}</span>
          {delta ? (
            <span
              className={cn(
                'typography-kpi-label break-words md:truncate',
                variant === 'card' ? cn('rounded-full px-2', deltaChipClass[deltaTone]) : deltaToneClass[deltaTone],
              )}
            >
              {delta}
            </span>
          ) : null}
        </span>
        {caption ? <span className={cn('typography-kpi-label block break-words md:truncate', selected ? 'text-general-brand-on-container' : 'text-text-subtle')}>{caption}</span> : null}
        {asChild ? null : children}
      </>
    );

    const inner = (
      <>
        {isStrip && divider ? <span aria-hidden="true" data-kpi-divider="" className="absolute inset-y-0 left-0 w-px bg-border" /> : null}
        {variant === 'card' ? body : <span className="flex min-w-0 flex-1 flex-col gap-micro">{body}</span>}
        {!loading && chart ? <span className="shrink-0">{chart}</span> : null}
        {variant === 'card' && !loading && !interactive && footerAction ? (
          <span className={cn('mt-4 flex items-center justify-end border-t border-solid border-border py-4', density === 'compact' ? '-mx-4 -mb-4 px-4' : '-mx-6 -mb-6 px-6')}>{footerAction}</span>
        ) : null}
      </>
    );

    if (isLink) {
      const linkProps = {
        ref: ref as React.Ref<HTMLAnchorElement>,
        className: classes,
        'aria-current': selected ? ('true' as const) : undefined,
        'data-selected': selected || undefined,
        onClick: onClick as unknown as React.MouseEventHandler<HTMLAnchorElement> | undefined,
        ...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>),
      };
      if (asChild) {
        return (
          <Slot {...linkProps}>
            <Slottable>{children}</Slottable>
            {inner}
          </Slot>
        );
      }
      return (
        <a href={href} target={target} rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)} {...linkProps}>
          {inner}
        </a>
      );
    }
    if (interactive) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          aria-pressed={selected}
          onClick={onClick}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {inner}
        </button>
      );
    }
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={disabled || undefined}
        data-selected={selected || undefined}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {inner}
      </div>
    );
  },
);
MetricItem.displayName = 'MetricItem';

// KPI strip: one bordered bar holding several strip metric items separated by dividers. The layout follows the width of the strip itself (a size container), not the viewport: below the `area-sm` container screen (560px) the items wrap into two columns, from there they share one row.
export interface KpiStripProps extends React.HTMLAttributes<HTMLDivElement> {
  // Fill of the strip. `card` (default) is the card surface. `raised` is for a strip on a `background-subtle` section: in dark the card fill can be darker than that section (zero theme), so `raised` uses the `surface-strip-raised` role (card in light, muted in dark) and never sinks below its surroundings.
  surface?: 'card' | 'raised';
  // `auto` (default): two columns below a 560px wide strip, one row from there. `2`: two columns at every width, for a sheet or a narrow side column.
  columns?: 'auto' | 2;
}

// Two columns: each item takes half the row, rows after the first get a top rule, the item that starts a row has no left divider and a last odd item takes the full row.
const twoColumns = [
  '[&>*]:basis-1/2',
  '[&>*]:py-3',
  '[&>:nth-child(n+3)]:border-t',
  '[&>:nth-child(n+3)]:border-solid',
  '[&>:nth-child(n+3)]:border-border',
  '[&>:nth-child(odd)_[data-kpi-divider]]:hidden',
  '[&>:last-child:nth-child(odd)]:basis-full',
];
// `auto` applies the two columns only while the strip is narrower than the `area-sm` container screen (560px); from there the items share one row (their own flex-1) and every divider but the first shows. Written out in full, so Tailwind finds every class in the source and in dist.
const twoColumnsWhenNarrow = [
  '[@container_kpi-strip_(max-width:559px)]:[&>*]:basis-1/2',
  '[@container_kpi-strip_(max-width:559px)]:[&>*]:py-3',
  '[@container_kpi-strip_(max-width:559px)]:[&>:nth-child(n+3)]:border-t',
  '[@container_kpi-strip_(max-width:559px)]:[&>:nth-child(n+3)]:border-solid',
  '[@container_kpi-strip_(max-width:559px)]:[&>:nth-child(n+3)]:border-border',
  '[@container_kpi-strip_(max-width:559px)]:[&>:nth-child(odd)_[data-kpi-divider]]:hidden',
  '[@container_kpi-strip_(max-width:559px)]:[&>:last-child:nth-child(odd)]:basis-full',
];

const KpiStrip = React.forwardRef<HTMLDivElement, KpiStripProps>(({ className, surface = 'card', columns = 'auto', ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <div
      ref={ref}
      role="group"
      data-columns={columns}
      className={cn(
        '@container/kpi-strip flex w-full flex-wrap items-stretch overflow-hidden rounded-surface border border-solid border-border',
        surface === 'raised' ? 'bg-surface-strip-raised' : 'bg-card',
        zero && 'min-h-[var(--size-kpi-strip)]',
        '[&>*]:min-w-0 [&>:first-child_[data-kpi-divider]]:hidden',
        columns === 2 ? twoColumns : twoColumnsWhenNarrow,
        className,
      )}
      {...props}
    />
  );
});
KpiStrip.displayName = 'KpiStrip';

export { KpiStrip, MetricItem, metricItemVariants };
