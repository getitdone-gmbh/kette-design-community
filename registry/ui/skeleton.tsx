'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useLabels, usePreset } from '@/components/ui/labels-context';

type SkeletonVariant = 'block' | 'row' | 'row-single' | 'text' | 'avatar';
// Radius tiers of the token preset a block tile may take, plus `full` for a pill in the shape of a chip.
type SkeletonRadius = 'default' | 'tight' | 'item' | 'control' | 'surface' | 'card' | 'full';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  // `block` (default) is the single placeholder tile. The composed variants follow the Figma Skeleton set:
  // `row-single` is one table row (height `row`), `row` is `rows` of them (default 2), `text` is a title bar plus
  // three lines, `avatar` is a 32px circle plus two lines. Composed variants announce themselves as a status.
  variant?: SkeletonVariant;
  // Row count for `variant="row"`.
  rows?: number;
  // Accessible loading text for the composed variants.
  label?: string;
  // Radius of the block tile: a token tier or `full` (pill, e.g. the placeholder of a chip). Default `default`, `tight` in the zero preset. A `rounded-*` in className wins over it.
  radius?: SkeletonRadius;
}

const radiusClass: Record<SkeletonRadius, string> = {
  default: 'rounded-default',
  tight: 'rounded-tight',
  item: 'rounded-item',
  control: 'rounded-control',
  surface: 'rounded-surface',
  card: 'rounded-card',
  full: 'rounded-full',
};

// Block tile: same fill as the composed Figma Skeleton bars, no border (a frame made it look heavy).
// `motion-reduce:animate-none` stops the endless pulse for reduced-motion users.
const skeletonVariants =
  'animate-pulse rounded-default bg-overlay-skeleton-default motion-reduce:animate-none';

const barBase = 'block animate-pulse motion-reduce:animate-none';
const barDefault = cn(barBase, 'bg-overlay-skeleton-default');
const barSubtle = cn(barBase, 'bg-overlay-skeleton-subtle');

// One table row: dot, then bars of descending width, last bar in the subtle tone. The bars may shrink (min-w-0), so the row never makes its table wider than the card.
const SkeletonRowBars = () => (
  <div className="flex h-row w-full min-w-0 shrink-0 items-center overflow-hidden gap-4 border-b border-solid border-border-subtle px-3">
    <span className={cn(barDefault, 'h-5 w-5 shrink-0 rounded-full')} />
    <span className={cn(barDefault, 'h-3 w-44 min-w-0 shrink rounded-item')} />
    <span className={cn(barDefault, 'h-3 w-28 min-w-0 shrink rounded-item')} />
    <span className={cn(barDefault, 'h-3 w-24 min-w-0 shrink rounded-item')} />
    <span className={cn(barDefault, 'h-3 w-20 min-w-0 shrink rounded-item')} />
    <span className={cn(barSubtle, 'h-3 w-12 min-w-0 shrink rounded-item')} />
  </div>
);

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
  const { className, variant = 'block', rows = 2, label: labelProp, radius, ...rest } = props;
  const l = useLabels();
  const zero = usePreset() === 'zero';
  const label = labelProp ?? l.loading;

  if (variant === 'block') {
    return <div ref={ref} className={cn(skeletonVariants, zero && 'rounded-tight bg-muted', radius && radiusClass[radius], className)} {...rest} />;
  }

  const sr = <span className="sr-only">{label}</span>;

  if (variant === 'row' || variant === 'row-single') {
    const count = variant === 'row-single' ? 1 : Math.max(1, rows);
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        data-variant={variant}
        className={cn('flex w-full flex-col items-start bg-background', className)}
        {...rest}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonRowBars key={i} />
        ))}
        {sr}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        data-variant={variant}
        className={cn('flex w-80 max-w-full flex-col items-start gap-2', className)}
        {...rest}
      >
        <span className={cn(barDefault, 'h-4 w-44 rounded-item')} />
        <span className={cn(barSubtle, 'h-2 w-full rounded-item')} />
        <span className={cn(barSubtle, 'h-2 w-11/12 rounded-item')} />
        <span className={cn(barSubtle, 'h-2 w-2/3 rounded-item')} />
        {sr}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-variant={variant}
      className={cn('flex items-center gap-3', className)}
      {...rest}
    >
      <span className={cn(barDefault, 'h-8 w-8 shrink-0 rounded-full')} />
      <span className="flex flex-col items-start gap-2">
        <span className={cn(barDefault, 'h-3 w-36 rounded-item')} />
        <span className={cn(barSubtle, 'h-2 w-24 rounded-item')} />
      </span>
      {sr}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton, type SkeletonProps, type SkeletonRadius, type SkeletonVariant };
