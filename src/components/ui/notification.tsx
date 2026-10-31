'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { focusRing } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { useLabels } from './labels-context';

// Figma: Notification 1135:618 (Alerts & notifications). Passive, dismissible message card with optional icon tile, avatar, media, progress and actions.
const notificationVariants = cva('relative flex w-full gap-3 rounded-surface p-4 shadow-elevation-raised', {
  variants: {
    variant: {
      default: 'border border-solid border-border bg-card text-text-default',
      // Dark snackbar for short confirmations ("Task deleted, Undo").
      inverse: 'items-center bg-background-inverse text-text-inverse',
    },
    layout: {
      // Leading visual beside the text.
      desktop: 'flex-row',
      // Leading visual above the text, actions full width.
      mobile: 'flex-col',
    },
  },
  defaultVariants: { variant: 'default', layout: 'desktop' },
});

// Lets NotificationAction pick readable colours on the inverse surface without a prop.
const NotificationToneContext = React.createContext<'default' | 'inverse'>('default');

const iconToneClass = {
  neutral: 'bg-muted text-icon-default',
  brand: 'bg-background-brand-subtle text-icon-brand',
  success: 'bg-background-success-subtle text-icon-success',
  warning: 'bg-background-warning-subtle text-icon-warning',
  destructive: 'bg-background-destructive-subtle text-icon-destructive',
  info: 'bg-background-info-subtle text-icon-info',
} as const;

export interface NotificationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof notificationVariants> {
  title: React.ReactNode;
  description?: React.ReactNode;
  // Glyph for the round icon tile (see iconTone).
  icon?: React.ReactNode;
  iconTone?: keyof typeof iconToneClass;
  // Avatar slot, shown instead of the icon tile.
  avatar?: React.ReactNode;
  // Image or preview below the text.
  media?: React.ReactNode;
  // Upload progress 0..100. Renders a labelled progress bar.
  progress?: number;
  progressLabel?: React.ReactNode;
  // Text-style actions (Dismiss, Undo, View changes).
  actions?: React.ReactNode;
  // Renders a close button and calls this when pressed.
  onDismiss?: () => void;
  dismissLabel?: string;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      variant = 'default',
      layout = 'desktop',
      title,
      description,
      icon,
      iconTone = 'neutral',
      avatar,
      media,
      progress,
      progressLabel,
      actions,
      onDismiss,
      dismissLabel: dismissLabelProp,
      role = 'status',
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const dismissLabel = dismissLabelProp ?? l.dismiss;
    const lead = avatar ? (
      <div className="shrink-0">{avatar}</div>
    ) : icon ? (
      <span
        className={cn(
          'flex h-avatar-md w-avatar-md shrink-0 items-center justify-center rounded-full',
          iconToneClass[iconTone],
        )}
      >
        {icon}
      </span>
    ) : null;
    const inverse = variant === 'inverse';
    return (
      <NotificationToneContext.Provider value={inverse ? 'inverse' : 'default'}>
        <div ref={ref} role={role} className={cn(notificationVariants({ variant, layout }), className)} {...props}>
          {lead}
          <div className={cn('flex min-w-0 flex-1 gap-3', inverse ? 'flex-wrap items-center' : 'flex-col', inverse && onDismiss && 'pr-8')}>
            {/* DR-WBDASH-042: room for the close button only when there is one. On the inverse surface the whole row (title and actions) keeps it, the actions wrap below a title that does not fit beside them instead of squeezing it to 0px */}
            <div className={cn('flex min-w-0 flex-col gap-1', !inverse && onDismiss && 'pr-8')}>
              <p className={cn('typography-ui-medium', inverse ? 'text-text-inverse' : 'text-text-default')}>{title}</p>
              {description ? (
                <p className={cn('typography-ui', inverse ? 'text-text-inverse-subtle' : 'text-text-subtle')}>{description}</p>
              ) : null}
            </div>
            {media}
            {progress !== undefined ? (
              <div className="flex flex-col gap-1">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label={typeof title === 'string' ? title : undefined}
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-background-brand-bold-default"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                {progressLabel ? (
                  <span className={cn('typography-ui self-end', inverse ? 'text-text-inverse-subtle' : 'text-text-subtle')}>
                    {progressLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            {actions ? (
              <div
                className={cn(
                  'flex min-w-0 flex-wrap items-center gap-3',
                  layout === 'mobile' && !inverse && 'flex-col items-stretch [&>*]:w-full',
                )}
              >
                {actions}
              </div>
            ) : null}
          </div>
          {onDismiss ? (
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={onDismiss}
              className={cn(
                'absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-item transition-colors',
                inverse
                  ? 'text-text-inverse hover:bg-background-inverted'
                  : 'text-icon-subtle hover:bg-muted hover:text-text-default',
                ...focusRing,
              )}
            >
              <X className="h-icon-sm w-icon-sm" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </NotificationToneContext.Provider>
    );
  },
);
Notification.displayName = 'Notification';

// Text-style action for a Notification (Dismiss, Undo, Changelog).
export interface NotificationActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Defaults to the tone of the surrounding Notification.
  tone?: 'default' | 'inverse';
}

const NotificationAction = React.forwardRef<HTMLButtonElement, NotificationActionProps>(
  ({ className, type = 'button', tone, ...props }, ref) => {
    const inherited = React.useContext(NotificationToneContext);
    const inverse = (tone ?? inherited) === 'inverse';
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'typography-ui-medium inline-flex h-6 items-center rounded-item transition-colors',
          inverse
            ? 'text-text-inverse hover:underline'
            : 'text-text-subtle hover:text-text-default last:text-text-default',
          ...focusRing,
          className,
        )}
        {...props}
      />
    );
  },
);
NotificationAction.displayName = 'NotificationAction';

export { Notification, NotificationAction, notificationVariants };
