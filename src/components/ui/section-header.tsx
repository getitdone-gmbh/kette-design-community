'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { displayVoice } from '../../lib/recipes';
import { cn } from '../../lib/utils';

// Figma: Section header 1214:38 (exported as PanelSectionHeader because SectionHeader is the marketing sections export) (Type Buttons | Button group | Search, Tabs, Breakpoint, Actions, Divider, Supporting text, Dropdown icon).
// Header of a panel, card or inner column: title, supporting text, actions at the right, tabs row below, optional hairline.
const panelSectionHeaderTitleVariants = cva('m-0 min-w-0 text-text-default', {
  variants: {
    size: {
      // Figma default: label/highlight 14/24 semibold.
      sm: 'typography-label-highlight',
      md: 'typography-ui-lg-semibold',
    },
  },
  defaultVariants: { size: 'sm' },
});

// The title is a heading, so it takes the display voice of the theme (kette-tokens 5.26.0 font-display, WOW-TITLES-01): wow draws it in Cinzel, every other theme keeps the body font, the size stays the Figma text role.
export interface PanelSectionHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'>, VariantProps<typeof panelSectionHeaderTitleVariants> {
  title: React.ReactNode;
  description?: React.ReactNode;
  // Heading element for the title.
  titleAs?: 'h2' | 'h3' | 'h4';
  // Buttons, button group, search or a menu trigger at the right. Stacks below the title on mobile.
  actions?: React.ReactNode;
  // Tab list row below the title row, for example the library Tabs list.
  tabs?: React.ReactNode;
  // Hairline under the header.
  divider?: boolean;
}

const PanelSectionHeader = React.forwardRef<HTMLElement, PanelSectionHeaderProps>(
  ({ className, size = 'sm', title, description, titleAs: Title = 'h2', actions, tabs, divider = false, ...props }, ref) => (
    <header ref={ref} data-size={size} className={cn('flex w-full flex-col gap-5', className)} {...props}>
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 self-stretch">
          <Title className={cn(panelSectionHeaderTitleVariants({ size }), displayVoice)}>{title}</Title>
          {description ? <p className="typography-text-small m-0 text-text-subtle">{description}</p> : null}
        </div>
        {actions ? <div data-slot="actions" className="flex shrink-0 flex-wrap items-center gap-3 max-sm:[&>*]:flex-1">{actions}</div> : null}
      </div>
      {tabs ? <div data-slot="tabs" className="w-full">{tabs}</div> : null}
      {divider ? <hr className="m-0 h-px w-full border-0 bg-border" /> : null}
    </header>
  ),
);
PanelSectionHeader.displayName = 'PanelSectionHeader';

export { PanelSectionHeader, panelSectionHeaderTitleVariants };
