'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { usePreset } from '@/components/ui/labels-context';

// `default` is the established 44x24 switch. `sm` follows the theme-aware `switch-*-sm` size tokens
// (the 2px transparent border keeps the thumb inset, so travel = track - thumb - 2 * border).
const switchSizes = {
  default: {
    root: 'h-switch-track-h-md w-switch-track-w-md',
    thumb: 'h-5 w-5 data-[state=checked]:translate-x-5',
  },
  sm: {
    root: 'h-switch-track-h-sm w-switch-track-w-sm',
    thumb:
      'h-switch-thumb-sm w-switch-thumb-sm data-[state=checked]:translate-x-[calc(theme(spacing.switch-track-w-sm)-theme(spacing.switch-thumb-sm)-theme(spacing.micro)*2)]',
  },
} as const;

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  /** `default` keeps the 44x24 switch; `sm` uses the themeable small switch sizes (the default in the zero preset). */
  size?: keyof typeof switchSizes;
  // Shows the value but blocks changes (Figma Readonly). Stays focusable and keeps `aria-checked`.
  readOnly?: boolean;
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size: sizeProp, readOnly = false, onClick, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    const size = sizeProp ?? (zero ? 'sm' : 'default');
    return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-solid border-transparent data-[state=checked]:border-border-control-checked transition-[color,background-color,border-color,box-shadow] duration-fast motion-reduce:transition-none data-[state=unchecked]:hover:bg-switch-background-unchecked-hover data-[state=checked]:hover:bg-background-brand-bold-hover aria-[invalid=true]:border-destructive data-[readonly=true]:data-[state=checked]:hover:bg-background-brand-bold-default data-[readonly=true]:data-[state=unchecked]:hover:bg-switch-background-unchecked focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default focus-visible:[--tw-ring-shadow:var(--tw-ring-inset)_0_0_0_calc(var(--size-focus-ring-width)+var(--tw-ring-offset-width))_var(--tw-ring-color),var(--glow-focus)] disabled:cursor-not-allowed disabled:opacity-disabled data-[state=checked]:bg-background-brand-bold-default data-[state=unchecked]:bg-switch-background-unchecked',
        // Theme expression (kette-tokens 5.26.0): bevel at rest and checked, none by default
        'shadow-[shadow:var(--bevel-switch)] data-[state=checked]:shadow-[shadow:var(--bevel-switch-checked)]',
        switchSizes[size].root,
        'data-[readonly=true]:cursor-default data-[readonly=true]:opacity-70',
        className,
      )}
      {...props}
      aria-readonly={readOnly || undefined}
      data-readonly={readOnly || undefined}
      onClick={(event) => {
        if (readOnly) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-background shadow-xs ring-0 transition-transform duration-fast motion-reduce:transition-none data-[state=unchecked]:translate-x-0',
          switchSizes[size].thumb,
        )}
      />
    </SwitchPrimitives.Root>
    );
  },
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
