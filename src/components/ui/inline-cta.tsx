'use client';

import * as React from 'react';

import { displayVoice } from '../../lib/recipes';
import { cn } from '../../lib/utils';

// Figma: Inline CTA 1255:131915. A card with a message, optional media/body slot and actions; actions stack full-width on mobile.
export interface InlineCtaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  // Heading element for the title.
  titleAs?: 'h2' | 'h3' | 'h4';
  // Image or illustration before the text (desktop) or above it (mobile).
  media?: React.ReactNode;
  // Free body: plan summary, checklist, file row, email field.
  children?: React.ReactNode;
  // Buttons. A lone secondary plus a primary is the common pair.
  actions?: React.ReactNode;
}

const InlineCta = React.forwardRef<HTMLDivElement, InlineCtaProps>(
  ({ className, title, description, titleAs: Title = 'h3', media, children, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-surface border border-solid border-border bg-card shadow-elevation-surface sm:flex-row',
        className,
      )}
      {...props}
    >
      {media ? <div className="shrink-0 sm:w-inner-column">{media}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <Title className={cn('typography-ui-lg-semibold text-text-default', displayVoice)}>{title}</Title>
          {description ? <p className="typography-ui text-text-subtle">{description}</p> : null}
        </div>
        {children}
        {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center [&>*]:max-sm:w-full">{actions}</div> : null}
      </div>
    </div>
  ),
);
InlineCta.displayName = 'InlineCta';

export { InlineCta };
