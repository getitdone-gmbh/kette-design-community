'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { OpenerCapture, useReturnFocusFallback } from '../../lib/return-focus';
import { MODAL_OVERLAY_ATTRIBUTE, useModalInertRef } from '../../lib/modal-inert';
import { INSET_SCOPE_ATTRIBUTE, scrollInsetClasses, useStickyInset } from '../../lib/sticky-inset';
import { cn } from '../../lib/utils';
import { usePreset } from './labels-context';

// Remembers the modal flag so DrawerContent can make the page behind inert only for modal drawers.
const DrawerModalContext = React.createContext(true);

const Drawer = ({ shouldScaleBackground = true, modal = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerModalContext.Provider value={modal}>
    <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} modal={modal} {...props} />
  </DrawerModalContext.Provider>
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} {...{ [MODAL_OVERLAY_ATTRIBUTE]: '' }} className={cn('fixed inset-0 z-sheet bg-overlay', className)} {...props} />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, onCloseAutoFocus, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const returnFocus = useReturnFocusFallback(onCloseAutoFocus);
  // A modal drawer makes everything outside its portal inert while it is open, see lib/modal-inert.
  const inertRef = useModalInertRef<HTMLDivElement>(React.useContext(DrawerModalContext));
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      inertRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [inertRef, ref],
  );
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={setRefs}
        {...{ [INSET_SCOPE_ATTRIBUTE]: '' }}
        className={cn(
          scrollInsetClasses,
          'fixed inset-x-0 bottom-0 z-sheet mt-24 flex h-auto flex-col rounded-t-dialog border border-solid bg-background',
          // Zero: default border role and the raised elevation, ui type role for the body.
          zero ? 'typography-ui border-border-default shadow-elevation-raised' : 'border-hairline shadow-dialog',
          className,
        )}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
        {...props}
      >
        <OpenerCapture onCapture={returnFocus.remember} />
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={useStickyInset<HTMLDivElement>('top', ref)} className={cn('grid gap-[6px] p-4 text-center sm:text-left', className)} {...props} />
));
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={useStickyInset<HTMLDivElement>('bottom', ref, { docked: true })} className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
));
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DrawerPrimitive.Title
      ref={ref}
      className={cn(zero ? 'typography-ui-semibold' : 'text-base font-semibold leading-none tracking-[-0.01em]', className)}
      {...props}
    />
  );
});
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DrawerPrimitive.Description
      ref={ref}
      className={cn(zero ? 'typography-ui-relaxed text-text-subtle' : 'text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
