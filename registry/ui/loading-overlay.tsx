'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { MODAL_OVERLAY_ATTRIBUTE, useModalInertRef } from '@/lib/modal-inert';
import { cn } from '@/lib/utils';
import { useLabels } from '@/components/ui/labels-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export interface LoadingOverlayProps {
  open: boolean;
  // Visible and announced text. Defaults to the provider "Loading" text.
  label?: string;
  description?: string;
  // Scope the overlay to an element (must be relative) instead of the window.
  container?: HTMLElement | null;
  className?: string;
}

// Full-screen blocking overlay for long operations. Focus is trapped on the status text and Escape or an outside click does not dismiss it.
const LoadingOverlay = ({ open, label: labelProp, description, container, className }: LoadingOverlayProps) => {
  const l = useLabels();
  const label = labelProp ?? l.loading;
  const scoped = Boolean(container);
  const inertRef = useModalInertRef<HTMLDivElement>(true);
  return (
    <DialogPrimitive.Root open={open} modal>
      <DialogPrimitive.Portal container={container ?? undefined}>
        <DialogPrimitive.Overlay
          {...{ [MODAL_OVERLAY_ATTRIBUTE]: '' }}
          className={cn('inset-0 z-dialog bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none', scoped ? 'absolute' : 'fixed')}
        />
        <DialogPrimitive.Content
          ref={inertRef}
          aria-busy="true"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            'left-1/2 top-1/2 z-dialog flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-surface bg-popover px-8 py-6 text-center text-popover-foreground shadow-elevation-raised outline-none',
            scoped ? 'absolute' : 'fixed',
            className,
          )}
        >
          <LoadingSpinner aria-hidden="true" role="presentation" aria-live="off" />
          <DialogPrimitive.Title className="typography-ui-semibold m-0">{label}</DialogPrimitive.Title>
          <DialogPrimitive.Description className={cn('typography-ui m-0 text-text-subtle', !description && 'sr-only')}>
            {description ?? label}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
LoadingOverlay.displayName = 'LoadingOverlay';

export { LoadingOverlay };
