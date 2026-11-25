'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEdge } from '@/components/ui/edge';
import { stateClasses } from '@/components/ui/empty-state';
import { useLabels } from '@/components/ui/labels-context';

// Skeleton bar for loading layouts of data components (semantic/overlay/skeleton/default).
const SkeletonBar = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-hidden="true"
    className={cn('block h-3 w-full animate-pulse rounded-item bg-overlay-skeleton-default motion-reduce:animate-none', className)}
    {...props}
  />
));
SkeletonBar.displayName = 'SkeletonBar';

export interface DataStatePanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  kind: 'empty' | 'error';
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  // Primary action for the empty state (e.g. "Log time").
  action?: ReactNode;
  // Error state: renders a "Try again" button.
  onRetry?: () => void;
  // Deprecated: use retryText.
  retryLabel?: string;
  retryText?: string;
  // Dashed outline (empty, default on) or destructive outline (error, default off) around the panel. Set false for an empty state inside a table row, grid cell or an already framed box.
  outlined?: boolean;
}

// Shared empty and error body for data components (calendar grids, boards, lists, cards). The empty kind is the same body as EmptyState (stateClasses, ADR-0001).
const DataStatePanel = forwardRef<HTMLDivElement, DataStatePanelProps>(
  ({ className, kind, title, description, icon, action, onRetry, retryLabel: retryLabelProp, retryText, outlined, ...props }, ref) => {
    const l = useLabels();
    const retryLabel = retryText ?? retryLabelProp ?? l.tryAgain;
    const isError = kind === 'error';
    const framed = outlined ?? !isError;
    const edge = useEdge();
    return (
      <div
        ref={ref}
        role={isError ? 'alert' : 'status'}
        data-state={kind}
        className={cn(stateClasses.root, framed && (isError ? 'rounded-card border border-solid border-border-destructive' : cn(stateClasses.frame, edge)), className)}
        {...props}
      >
        <span aria-hidden="true" className={cn(stateClasses.icon, isError && 'text-icon-destructive')}>
          {icon ?? (isError ? <AlertCircle className="h-icon-md w-icon-md" /> : null)}
        </span>
        <p className={cn(stateClasses.title, isError && 'text-text-destructive')}>{title}</p>
        {description ? <p className={stateClasses.text}>{description}</p> : null}
        {isError && onRetry ? (
          <Button type="button" variant="outline" size="control-sm" onClick={onRetry}>
            <RefreshCw aria-hidden="true" className="h-icon-sm w-icon-sm" />
            {retryLabel}
          </Button>
        ) : null}
        {!isError ? action : null}
      </div>
    );
  },
);
DataStatePanel.displayName = 'DataStatePanel';

export { DataStatePanel, SkeletonBar };
