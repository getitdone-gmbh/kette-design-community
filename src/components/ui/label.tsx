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

const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ preset: zero ? 'zero' : 'default' }), className)} {...props} />;
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
