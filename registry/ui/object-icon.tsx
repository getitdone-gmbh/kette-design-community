'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { usePreset } from '@/components/ui/labels-context';

// Full class strings so Tailwind's content scan finds every product token.
// Extends SidebarObjectIcon (18px, six products) with the `record` object type and three sizes.
const objectIconVariants = cva('grid shrink-0 place-items-center rounded-tight', {
  variants: {
    app: {
      workstream: 'bg-product-workstream-default text-product-workstream-on',
      backoffice: 'bg-product-backoffice-default text-product-backoffice-on',
      coldcall: 'bg-product-coldcall-default text-product-coldcall-on',
      vacancy: 'bg-product-vacancy-default text-product-vacancy-on',
      jobsearch: 'bg-product-jobsearch-default text-product-jobsearch-on',
      meeting: 'bg-product-meeting-default text-product-meeting-on',
      record: 'bg-product-record-default text-product-record-on',
      // Follows the page product context (data-product on the root element).
      contextual: 'bg-product-accent-default text-product-accent-on',
    },
    // Semantic tones for status and kind tiles that are not a product. Overrides `app` when set.
    tone: {
      neutral: 'bg-background-neutral-default text-text-default',
      info: 'bg-general-info-container text-general-info-on-container',
      success: 'bg-general-success-container text-general-success-on-container',
      warning: 'bg-general-warning-container text-general-warning-on-container',
      destructive: 'bg-general-error-container text-general-error-on-container',
    },
    // Product preset (DesignSystemProvider `preset`): the small tile follows the object icon token (18 in zero).
    preset: { default: '', zero: '' },
    size: {
      sm: 'typography-avatar-xs h-icon-md w-icon-md [&>svg]:h-icon-2xs [&>svg]:w-icon-2xs',
      md: 'typography-avatar-xs h-avatar-xs w-avatar-xs [&>svg]:h-icon-sm [&>svg]:w-icon-sm',
      lg: 'typography-ui-semibold h-avatar-sm w-avatar-sm [&>svg]:h-icon-md [&>svg]:w-icon-md',
    },
  },
  compoundVariants: [{ preset: 'zero', size: 'sm', className: 'h-object-icon w-object-icon' }],
  defaultVariants: { app: 'record', size: 'sm', preset: 'default' },
});

export interface ObjectIconProps extends HTMLAttributes<HTMLSpanElement>, Omit<VariantProps<typeof objectIconVariants>, 'preset'> {
  // Provide a label when the icon carries meaning on its own. Decorative by default.
  label?: string;
}

// Colored tile for a product or record type. Children are the glyph (an icon element).
const ObjectIcon = forwardRef<HTMLSpanElement, ObjectIconProps>(({ className, app, tone, size, label, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
  <span
    ref={ref}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    data-app={tone ? undefined : (app ?? 'record')}
    data-tone={tone ?? undefined}
    // A tone replaces the product fill: null switches the app variant and its default off.
    className={cn(objectIconVariants({ app: tone ? null : app, tone, size, preset: zero ? 'zero' : 'default' }), className)}
    {...props}
  />
  );
});
ObjectIcon.displayName = 'ObjectIcon';

export { ObjectIcon, objectIconVariants };
