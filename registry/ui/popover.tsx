'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { overlayMotion, overlaySurface, overlaySurfaceZero } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { AutosaveScopeReset } from '@/components/ui/autosave-scope';
import { usePreset } from '@/components/ui/labels-context';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

// Positions the content against an element other than the trigger, e.g. the whole row or a button that opens the popover through other means.
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-dropdown outline-none',
          // Zero: 320 wide, 12px padding and the ui type role, so the body never inherits the page line height.
          zero ? 'w-80 p-3 typography-ui' : 'w-72 p-4',
          overlaySurface,
          zero && overlaySurfaceZero,
          overlayMotion,
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        <AutosaveScopeReset>{props.children}</AutosaveScopeReset>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
