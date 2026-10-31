'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { usePreset } from '@/components/ui/labels-context';

const toggleGroupVariants = cva(
  'inline-flex items-center justify-center rounded-control transition-[color,background-color,border-color,box-shadow] duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default disabled:pointer-events-none disabled:opacity-disabled data-[state=on]:bg-muted data-[state=on]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-solid border-input bg-background shadow-xs hover:border-border-bold hover:bg-background data-[state=on]:bg-muted',
        // Segmented control: items sit in a `bg-muted` track (see the Root), the on item is a raised chip.
        segmented:
          'rounded-item bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:hover:bg-background data-[state=on]:shadow-xs',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-8 px-2',
        md: 'h-10 px-3',
        lg: 'h-10 px-3',
      },
      // Product preset (DesignSystemProvider `preset`): `zero` binds the heights to the control tokens and the label to the button roles, and the segmented item to the Tabs segment size.
      preset: { default: 'text-sm font-medium', zero: '' },
    },
    compoundVariants: [
      { preset: 'zero', size: 'default', className: 'h-control-md typography-button-md' },
      { preset: 'zero', size: 'sm', className: 'h-control-sm typography-button-sm' },
      { preset: 'zero', size: 'md', className: 'h-control-md typography-button-md' },
      { preset: 'zero', size: 'lg', className: 'h-control-lg typography-button-md' },
      { preset: 'zero', variant: 'segmented', className: 'h-control-xs rounded-item px-control-px-sm typography-tab' },
      // Outside zero the default-size segmented item is 32px, so the track (3px padding) is 38px like the segmented Tabs.
      { preset: 'default', variant: 'segmented', size: 'default', className: 'h-8' },
      // Sized segmented group outside zero: the track sets the height (Button sm 32, md 40), the items fill it.
      { preset: 'default', variant: 'segmented', size: ['sm', 'md', 'lg'], className: 'h-full' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      preset: 'default',
    },
  },
);

type ToggleGroupContextValue = Omit<VariantProps<typeof toggleGroupVariants>, 'preset'> & { fullWidth?: boolean };

// Group-level defaults for `variant`/`size` (shadcn pattern). Items read these and may override them.
const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    Omit<VariantProps<typeof toggleGroupVariants>, 'preset'> & {
      /** Segmented only. Stretches the track to the full width of its parent and shares the width between the items. Default is the content width (`fit-content`), also inside a `flex-col` parent. */
      fullWidth?: boolean;
    }
>(({ className, variant, size, fullWidth = false, children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  // Standard controlled/uncontrolled dual-mode: forward value/defaultValue/onValueChange
  // straight through to Radix, which already implements this correctly via
  // useControllableState. Do NOT shadow `value` with local state here - doing so
  // permanently uncontrols the component and discards any consumer-supplied value.
  return (
    // The Root is a layout container, not a toggle button: `toggleGroupVariants` (height, padding,
    // hover/on states) styles the ITEMS only. The Root forwards `className` and shares
    // `variant`/`size` with its items via context. No base classes are added, so unstyled
    // groups render exactly as before.
    <ToggleGroupPrimitive.Root
      {...props}
      className={cn(variant === 'segmented' && 'inline-flex items-center gap-0 rounded-control bg-muted', variant === 'segmented' && (fullWidth ? 'w-full' : 'w-fit'), variant === 'segmented' && (zero ? 'p-micro' : 'p-[3px]'),
        // Sized track outside zero: total height equals the Button height (sm 32, md and lg 40). Without size the 38px legacy track stays.
        variant === 'segmented' && !zero && size && size !== 'default' && (size === 'sm' ? 'h-control-sm' : 'h-control-md'),
        className,
      )}
      ref={ref}
    >
      <ToggleGroupContext.Provider value={{ variant, size, fullWidth }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleGroupVariants> & {
      /**
       * Marks the item as reachable-but-blocked: it stays in the roving-tabindex/
       * arrow-key sequence and remains focusable, but activation (click or
       * keyboard) is suppressed. Unlike native `disabled`, this does NOT remove
       * the item from the tab order or the accessibility tree.
       */
      unreachable?: boolean;
    }
>(({ className, variant, size, children, unreachable, onClick, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  const zero = usePreset() === 'zero';
  return (
    <ToggleGroupPrimitive.Item
      {...props}
      {...(unreachable ? { 'aria-disabled': true, 'data-unreachable': true } : {})}
      onClick={(event) => {
        if (unreachable) {
          event.preventDefault();
        }
        onClick?.(event);
      }}
      className={cn(
        toggleGroupVariants({ variant: variant ?? context.variant, size: size ?? context.size, preset: zero ? 'zero' : 'default', className }),
        context.fullWidth && (variant ?? context.variant) === 'segmented' && 'flex-1',
        'data-[unreachable=true]:pointer-events-none data-[unreachable=true]:opacity-disabled',
      )}
      ref={ref}
    >
      <span>{children}</span>
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants };
