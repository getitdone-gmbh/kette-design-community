'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import * as React from 'react';

import { fieldHaloZero, focusRingField, invalidRing, menuItem, menuItemZero, openRing, overlayMotion, overlaySurface, overlaySurfaceZero, transitionBase } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import type { InputSize } from '@/components/ui/input';
import { usePreset } from '@/components/ui/labels-context';

// Trigger heights share the Input scale: `xs` is the compact `--size-control-xs` height (28, 24 in zero), `sm`, `md` and `lg` follow the control tokens.
const TRIGGER_SIZE: Record<InputSize, string> = {
  xs: 'h-control-xs px-control-px-sm py-0',
  sm: 'h-control-sm px-control-px-sm py-0',
  md: 'h-control-md px-control-px-sm py-0',
  lg: 'h-control-lg px-control-px-sm py-0',
};

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

// Option density of the open list, set by SelectContent and read by the options.
const SelectDensityContext = React.createContext<'default' | 'touch'>('default');

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    clamp?: boolean;
    // Dense 32px trigger for inline rows. Default keeps the 40px trigger.
    compact?: boolean;
    // Trigger height, see Input `size`. Overrides `compact`. In the zero preset the default is `md`.
    size?: InputSize;
    // Chevron becomes a spinner and the trigger reports aria-busy.
    loading?: boolean;
    // `readonly` shows the value on the muted read-only surface and keeps the list closed.
    appearance?: 'default' | 'readonly';
    // Leading icon, Avatar or colour dot shown before the value (Figma Type icon / avatar / dot leading).
    leading?: React.ReactNode;
    // Success border (Figma Color=Success). Invalid still wins via aria-invalid.
    success?: boolean;
  }
>(({ className, children, clamp = false, compact = false, size, loading = false, appearance = 'default', leading, success = false, onPointerDown, onKeyDown, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const effectiveSize = size ?? (zero ? (compact ? 'sm' : 'md') : undefined);
  // The small sizes (xs, sm) take the type size of the small controls (`text-ui`, 13px, the label size of Button sm) instead of the 16px field text. The trigger is a button, not a text input, so iOS Safari does not zoom on focus and needs no 16px floor.
  const smallType = effectiveSize === 'xs' || effectiveSize === 'sm';
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      aria-busy={loading || undefined}
      aria-readonly={appearance === 'readonly' || undefined}
      onPointerDown={(event) => {
        if (appearance === 'readonly') {
          event.preventDefault();
          return;
        }
        onPointerDown?.(event);
      }}
      onKeyDown={(event) => {
        if (appearance === 'readonly' && (event.key === 'Enter' || event.key === ' ' || event.key.startsWith('Arrow'))) {
          event.preventDefault();
          return;
        }
        onKeyDown?.(event);
      }}
      className={cn(
        'flex',
        'w-full',
        'items-center',
        'justify-between',
        'gap-2',
        'rounded-control',
        'border',
        'border-solid',
        'border-input',
        'bg-background',
        'px-4',
        // Same vertical rhythm as Input (py-2 + typography-input-text/leading-normal), so a Select
        // and an Input in one form row are the same height.
        'py-2',
        'text-select-foreground-default',
        // Default and larger: the field text (16px, 13px in zero), at least 16px below sm like Input and the other fields of a form row.
        !smallType && 'typography-input-text',
        !smallType && 'max-sm:text-[max(16px,var(--typo-input-text-size,1rem))]',
        smallType && 'text-ui font-normal',
        'leading-normal',
        transitionBase,
        // Hover: darker border + soft field shadow (no background tint).
        'hover:border-border-bold',
        'hover:shadow-field-hover',
        !zero && focusRingField,
        // Open state mirrors the focus look, independent of :focus-visible (pointer open).
        !zero && openRing,
        // Invalid state: driven by `aria-invalid` (set by <FormControl>); arbitrary-variant form
        // because `aria-invalid` is not in Tailwind's built-in aria allow-list.
        invalidRing,
        '[&>span]:line-clamp-1',
        'data-[placeholder]:text-text-subtle',
        'disabled:cursor-not-allowed',
        'disabled:opacity-disabled',
        { 'text-clamp': clamp },
        { 'leading-clamp': clamp },
        zero && fieldHaloZero,
        compact && !effectiveSize && 'h-8 px-3 py-1',
        effectiveSize && TRIGGER_SIZE[effectiveSize],
        appearance === 'readonly' && 'cursor-default bg-muted hover:border-input hover:shadow-none',
        success && 'border-border-success',
        className,
      )}
      {...props}
    >
      {leading ? (
        <span aria-hidden="true" data-select-leading="" className="!flex h-icon-xs w-icon-xs shrink-0 items-center justify-center !overflow-visible text-icon-subtle">
          {leading}
        </span>
      ) : null}
      {children}
      {loading ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />
      ) : (
        <SelectPrimitive.Icon asChild>
          <ChevronDown className={cn('shrink-0 text-muted-foreground', zero ? 'h-icon-xs w-icon-xs' : 'h-4 w-4')} />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    clamp?: boolean;
    // `touch` makes the options 44px high (touch-target-lg) below the sm breakpoint. Default keeps the dense options.
    density?: 'default' | 'touch';
  }
>(({ className, children, position = 'popper', clamp = false, density = 'default', ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative',
          'z-dropdown',
          'min-w-[8rem]',
          'overflow-hidden',
          overlaySurface,
          zero && overlaySurfaceZero,
          'typography-input-text',
          overlayMotion,
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' && 'data-[side=bottom]:translate-y-1',
          'data-[side=left]:-translate-x-1',
          'data-[side=right]:translate-x-1',
          'data-[side=top]:-translate-y-1',
          { 'text-sm': !clamp },
          { 'leading-lg': !clamp },
          { 'text-clamp': clamp },
          { 'leading-clamp': clamp },
          className,
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'h-[var(--radix-select-trigger-height)]',
            'w-full',
            'min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          <SelectDensityContext.Provider value={density}>{children}</SelectDensityContext.Provider>
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & { clamp?: boolean }
>(({ className, clamp = false, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-[6px]',
      'px-2',
      'text-muted-foreground',
      'typography-input-text',
      { 'text-xs': !clamp },
      { 'leading-lg': !clamp },
      { 'text-clamp-small': clamp },
      { 'leading-clamp-small': clamp },
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { clamp?: boolean }
>(({ className, children, clamp = false, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const density = React.useContext(SelectDensityContext);
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        zero ? menuItemZero : menuItem,
        'w-full',
        'pr-2',
        density === 'touch' && 'max-sm:min-h-[var(--size-touch-target-lg)]',
        { 'text-clamp': clamp },
        { 'leading-clamp': clamp },
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>
      <span className={cn('flex', 'h-4', 'w-4', 'shrink-0', 'items-center', 'justify-center')}>
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1', 'my-1', 'h-px', 'bg-border-subtle', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue };
