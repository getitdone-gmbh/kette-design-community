'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';
import { usePreset } from './labels-context';

const labelVariants = cva('leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-disabled', {
  variants: {
    // Zero uses the 13/500 ui-medium role, the other themes keep the themeable input-label role.
    preset: { default: 'typography-input-label', zero: 'typography-ui-medium' },
  },
  defaultVariants: { preset: 'default' },
});

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  // Adds the required marker (a destructive asterisk, hidden from assistive tech; not with asChild). Put `required` on the control itself so it is announced.
  required?: boolean;
}

const Label = forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(({ className, required = false, children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const marked = required && !props.asChild;
  return (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ preset: zero ? 'zero' : 'default' }), className)} {...props}>
      {marked ? (
        <>
          {children}
          <span aria-hidden="true" data-required-marker="" className="ml-1 text-destructive">
            *
          </span>
        </>
      ) : (
        children
      )}
    </LabelPrimitive.Root>
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
