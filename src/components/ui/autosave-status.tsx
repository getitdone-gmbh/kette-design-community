'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, CircleDot, CloudOff, Loader2 } from 'lucide-react';
import * as React from 'react';

import { focusRing } from './../../lib/recipes';
import { cn } from './../../lib/utils';
import { useLabels, usePreset } from './labels-context';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const autosaveStatusVariants = cva('inline-flex min-w-0 max-w-full items-center gap-1 typography-ui-sm', {
  variants: {
    state: {
      saved: 'text-text-subtle-on-muted',
      saving: 'text-text-subtle-on-muted',
      dirty: 'text-text-subtle-on-muted',
      error: 'text-text-destructive',
      offline: 'text-text-subtle-on-muted',
    },
  },
  defaultVariants: { state: 'saved' },
});

export type AutosaveState = NonNullable<VariantProps<typeof autosaveStatusVariants>['state']>;

const iconClass: Record<AutosaveState, string> = {
  saved: 'text-icon-success',
  saving: 'text-icon-subtle motion-safe:animate-spin',
  dirty: 'text-icon-warning',
  error: 'text-icon-destructive',
  offline: 'text-icon-subtle',
};

const icons: Record<AutosaveState, typeof CheckCircle2> = {
  saved: CheckCircle2,
  saving: Loader2,
  dirty: CircleDot,
  error: AlertCircle,
  offline: CloudOff,
};

export interface AutosaveStatusProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof autosaveStatusVariants> {
  /** Replaces the default English label of the current state. */
  label?: React.ReactNode;
  /** Retry action for the error and offline states. In the icon-only chip it sits in the popover, otherwise as a small button after the label. */
  onRetry?: () => void;
  /** Label of the retry button, default "Try again". */
  retryLabel?: string;
}

// Polite live region so assistive tech announces state changes without stealing focus. Error and offline are announced only by the alert (assertive), because the user has to act: the status stays a polite live region the whole time (its `aria-live` never changes, so the change back to Saved is a plain text change in an existing region), but in these two states its visible label is hidden from assistive technology, so the message is not announced twice.
// Width: the chip shows its label while its top bar (a size container named `topbar`, see TopBar; outside a top bar the label always shows) is at least the `md` container screen (448px) wide. Below that only the icon is drawn, and the chip becomes a button (44px hit area under a coarse pointer) that opens a popover with the status text and, for error and offline with `onRetry`, a retry button. The label stays in the live region as the accessible name.
const AutosaveStatus = React.forwardRef<HTMLSpanElement, AutosaveStatusProps>(
  ({ className, state = 'saved', label, onRetry, retryLabel, ...props }, ref) => {
    const l = useLabels();
    const current: AutosaveState = state ?? 'saved';
    const Icon = icons[current];
    // Zero: 16px icon and the control gap.
    const zero = usePreset() === 'zero';
    const text = label ?? l.autosaveStates[current];
    const tooltip = typeof label === 'string' ? label : label === undefined ? l.autosaveStates[current] : undefined;
    const needsAction = current === 'error' || current === 'offline';
    const retry = needsAction && onRetry ? { onRetry, label: retryLabel ?? l.tryAgain } : null;
    return (
      <>
        <span
          ref={ref}
          role="status"
          aria-live="polite"
          data-state={current}
          title={tooltip}
          className={cn('relative', autosaveStatusVariants({ state: current }), zero && 'gap-gap-control', className)}
          {...props}
        >
          <Icon className={cn('shrink-0', zero ? 'h-icon-md w-icon-md' : 'h-icon-xs w-icon-xs', iconClass[current])} aria-hidden />
          {/* The label shrinks with an ellipsis where there is room for some of it. `data-status-label` lets a narrow top bar hide it visually and keep it as the accessible name, so no fragment such as "U..." is ever drawn. */}
          <span data-status-label="" aria-hidden={needsAction || undefined} className="min-w-0 truncate [@container_topbar_(max-width:447px)]:sr-only" title={tooltip}>
            {text}
          </span>
          {retry ? (
            <Button type="button" variant="link" size="link-sm" data-status-retry="" onClick={retry.onRetry} className="h-auto shrink-0 px-1 [@container_topbar_(max-width:447px)]:hidden">
              {retry.label}
            </Button>
          ) : null}
          {/* Icon-only: the chip is a button that opens the status text. Hidden (and out of the tab order) while the label is drawn. */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-status-trigger=""
                aria-label={typeof text === 'string' ? text : l.autosaveStates[current]}
                className={cn(
                  'absolute left-1/2 top-1/2 hidden h-full min-h-full w-full min-w-full -translate-x-1/2 -translate-y-1/2 rounded-item [@container_topbar_(max-width:447px)]:block [@media(pointer:coarse)]:h-[var(--size-touch-target-lg)] [@media(pointer:coarse)]:w-[var(--size-touch-target-lg)]',
                  ...focusRing,
                )}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-auto max-w-xs flex-col items-start gap-2 p-3">
              <p data-status-text="" className="typography-ui m-0 flex items-center gap-2 text-text-default">
                <Icon className={cn('shrink-0', zero ? 'h-icon-md w-icon-md' : 'h-icon-xs w-icon-xs', iconClass[current])} aria-hidden />
                <span>{text}</span>
              </p>
              {retry ? (
                <Button type="button" variant="outline" size="md" data-status-retry="" onClick={retry.onRetry}>
                  {retry.label}
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
        </span>
        {/* Error and offline need action, so they are also announced assertively. A node of its own, created when the state turns, because a live region only announces what changes inside it. */}
        {needsAction ? (
          <span role="alert" data-status-alert="" className="sr-only">
            {text}
          </span>
        ) : null}
      </>
    );
  },
);
AutosaveStatus.displayName = 'AutosaveStatus';

export { AutosaveStatus, autosaveStatusVariants };
