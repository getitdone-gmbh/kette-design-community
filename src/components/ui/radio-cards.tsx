'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { usePreset } from './labels-context';

// Figma Sheet block Type=Radio cards grid: options as cards in a 2 column wrap grid (one column below sm), optional 4th option.
export type RadioCardGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
  // `2` is the Figma grid, `1` stacks the cards (Figma Type=Radio cards).
  columns?: 1 | 2;
};

const RadioCardGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, RadioCardGroupProps>(
  ({ className, columns = 2, ...props }, ref) => (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-columns={columns}
      className={cn('grid grid-cols-1 gap-3', columns === 2 && 'sm:grid-cols-2', className)}
      {...props}
    />
  ),
);
RadioCardGroup.displayName = 'RadioCardGroup';

export interface RadioCardProps extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, 'children' | 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  // Decorative leading icon or icon tile.
  icon?: React.ReactNode;
}

// The checked card is marked by the brand border and the brand tint, never by a ring, so the keyboard focus ring (outside, 3:1) stays visible on a checked card.
// The whole card is the radio (role radio, arrow keys move between cards via the group).
// Title and description wrap inside the card on their own (white-space normal, long words break), also where the app sets nowrap on buttons.
const RadioCard = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioCardProps>(
  ({ className, title, description, icon, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    const uid = React.useId();
    const titleId = `${uid}-title`;
    const descriptionId = description ? `${uid}-description` : undefined;
    // The radio is named by the title and described by the description, so a screen reader reads "Title, radio button, 1 of 3" and then the description. A consumer name (`aria-label`, `aria-labelledby`) wins.
    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
    return (
    <RadioGroupPrimitive.Item
      ref={ref}
      aria-labelledby={named ? undefined : titleId}
      aria-describedby={descriptionId}
      className={cn(
        'group flex min-w-0 items-start gap-3 whitespace-normal rounded-surface border border-solid border-border-default bg-background p-4 text-left transition-[color,background-color,border-color,box-shadow] duration-150',
        'hover:border-border-bold hover:bg-background-neutral-subtle',
        zero
          ? 'data-[state=checked]:border-border-brand data-[state=checked]:bg-background-brand-subtle'
          : 'data-[state=checked]:border-primary data-[state=checked]:bg-background-brand-subtle',
        'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default',
        'disabled:cursor-not-allowed disabled:opacity-disabled',
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex shrink-0 items-center justify-center text-icon-subtle [&>svg]:h-icon-md [&>svg]:w-icon-md',
            zero ? 'h-icon-tile w-icon-tile rounded-item bg-muted' : 'h-icon-md w-icon-md',
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span id={titleId} className="typography-ui-medium min-w-0 text-text-default [overflow-wrap:anywhere]">{title}</span>
        {description ? <span id={descriptionId} className={cn('typography-ui min-w-0 text-text-subtle [overflow-wrap:anywhere]', 'group-data-[state=checked]:text-general-brand-on-container')}>{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-solid border-checkbox-border-default bg-background group-data-[state=checked]:border-border-control-checked"
      >
        <span className="hidden h-2 w-2 rounded-full bg-primary group-data-[state=checked]:block" />
      </span>
    </RadioGroupPrimitive.Item>
    );
  },
);
RadioCard.displayName = 'RadioCard';

export { RadioCard, RadioCardGroup };
