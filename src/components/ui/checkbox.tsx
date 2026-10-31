'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';
import { usePreset } from './labels-context';

const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    // `sm` uses the compact checkbox size token (Figma Size=sm); default keeps the 20px box. In the zero preset the default is `sm`.
    size?: 'default' | 'sm';
  }
>(({ className, size: sizeProp, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const size = sizeProp ?? (zero ? 'sm' : 'default');
  return (
  <CheckboxPrimitive.Root
    data-slot="checkbox"
    ref={ref}
    className={cn(
      'peer',
      size === 'sm' ? 'h-checkbox-sm w-checkbox-sm' : 'h-5 w-5',
      'shrink-0',
      'rounded-tight',
      'border',
      'border-solid',
      // Control boundary role, at least 3:1 on the page (WCAG 1.4.11). `border-input` stays the decorative field border.
      'border-checkbox-border-default',
      'bg-background',
      'transition-[color,background-color,border-color,box-shadow]',
      'duration-150',
      'hover:border-checkbox-border-hover',
      'focus-visible:outline-none',
      'focus-visible:ring-focus',
      'focus-visible:ring-offset-focus',
      'focus-visible:ring-offset-background',
      'focus-visible:ring-ring-default',
      'focus-visible:border-ring',
      'focus-visible:[--tw-ring-shadow:var(--tw-ring-inset)_0_0_0_calc(var(--size-focus-ring-width)+var(--tw-ring-offset-width))_var(--tw-ring-color),var(--glow-focus)]',
      // Theme expression (kette-tokens 5.26.0): bevel at rest and checked, none by default
      'shadow-[shadow:var(--bevel-checkbox)]',
      'data-[state=checked]:shadow-[shadow:var(--bevel-checkbox-checked)]',
      'data-[state=indeterminate]:shadow-[shadow:var(--bevel-checkbox-checked)]',
      'disabled:cursor-not-allowed',
      'disabled:opacity-disabled',
      'data-[state=checked]:border-border-control-checked',
      'data-[state=checked]:bg-background-brand-bold-default',
      'data-[state=checked]:text-text-on-brand',
      'data-[state=indeterminate]:border-border-control-checked',
      'data-[state=indeterminate]:bg-background-brand-bold-default',
      'data-[state=indeterminate]:text-text-on-brand',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex', 'items-center', 'justify-center', 'text-current')}
    >
      <Check aria-hidden className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4', '[stroke-width:var(--size-icon-stroke-check,3)]')} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
