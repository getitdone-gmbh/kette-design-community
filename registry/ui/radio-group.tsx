'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';

import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    // `md` is the 20px radio (Figma Size=md); default keeps the 16px radio.
    size?: 'default' | 'md';
    // `filled` paints the checked radio solid with a light dot (Figma checked-filled); default keeps ring + dot.
    appearance?: 'default' | 'filled';
  }
>(({ className, children, size = 'default', appearance = 'default', ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square',
        size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
        'rounded-full',
        'border',
        'border-solid',
        'border-checkbox-border-default',
        'bg-background',
        'text-background-brand-bold-default',
        'transition-[color,background-color,border-color,box-shadow]',
        'duration-150',
        'hover:border-checkbox-border-hover',
        'data-[state=checked]:border-border-control-checked',
        appearance === 'filled' && 'data-[state=checked]:bg-background-brand-bold-default',
        'focus-visible:outline-none',
        'focus-visible:ring-focus',
        'focus-visible:ring-offset-focus',
        'focus-visible:ring-offset-background',
        'focus-visible:ring-ring-default',
        'focus-visible:border-ring',
        'disabled:cursor-not-allowed',
        'disabled:opacity-disabled',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className={cn('flex', 'items-center', 'justify-center')}>
        <span
          aria-hidden="true"
          className={cn(size === 'md' ? 'h-3 w-3' : 'h-2 w-2', 'rounded-full', appearance === 'filled' ? 'bg-text-on-brand' : 'bg-background-brand-bold-default')}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
