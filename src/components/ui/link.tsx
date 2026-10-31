'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { focusRing } from '../../lib/recipes';
import { cn } from '../../lib/utils';

// Figma Link (7747:83048): Size sm|md|lg|xl|2xl, Color Brand|Neutral|Destructive, Icon Default|Dot leading,
// State Default|Hover|Active|Focused|Disabled. All sizes use the link-sm type role in Figma; 2xl widens the gap and icons.
const linkVariants = cva(
  [
    'inline-flex items-center justify-center rounded-item underline-offset-4 transition-colors',
    'active:underline',
    // A disabled link keeps pointer events so a tooltip can explain it. The click guard in the component blocks the action.
    'aria-disabled:cursor-not-allowed aria-disabled:text-text-disabled aria-disabled:hover:text-text-disabled aria-disabled:active:text-text-disabled aria-disabled:hover:no-underline aria-disabled:active:no-underline',
    ...focusRing,
  ],
  {
    variants: {
      color: {
        brand: 'text-link-default hover:text-link-hover active:text-link-active',
        neutral: 'text-text-subtle hover:text-text-default active:text-text-default',
        destructive: 'text-text-destructive hover:text-general-error-hover active:text-general-error-active',
        // For inverted and dark surfaces (pairs with bg-background-inverse).
        inverse: 'text-text-inverse hover:underline',
        // Takes the colour of the surrounding text, for example inside an Alert. Underlined so it is not colour only.
        inherit: 'text-inherit underline hover:no-underline',
      },
      // link sets the link-sm type role. inherit takes font family, size, weight and line height from the surrounding text (inline links in body copy, headings, buttons).
      typography: {
        link: 'typography-link-sm',
        // 16px link role (typography-link-md), for body copy at 16px.
        'link-md': 'typography-link-md',
        inherit: '[font:inherit]',
      },
      // Underline control. Unset keeps the colour default (brand and neutral: underline on press, inherit: underlined until hover).
      underline: {
        always: 'underline hover:underline active:underline',
        hover: 'no-underline hover:underline active:underline',
        none: 'no-underline hover:no-underline active:no-underline',
      },
      // Font weight. Unset keeps the weight of the typography role (link role) or the surrounding text (inherit).
      weight: {
        regular: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
      },
      // Letter spacing. Unset keeps the typography role. normal resets it, inherit takes it from the surrounding text.
      tracking: {
        normal: 'tracking-normal',
        inherit: '[letter-spacing:inherit]',
      },
      // Line height. Unset keeps the one of the typography role (20px for the link roles). inherit takes it from the surrounding text, so a 16px link fits a 24px body row.
      leading: {
        inherit: '[line-height:inherit]',
      },
      size: {
        sm: 'gap-2',
        md: 'gap-2',
        lg: 'gap-2',
        xl: 'gap-2',
        '2xl': 'gap-3',
      },
    },
    defaultVariants: { color: 'brand', size: 'md', typography: 'link' },
  },
);

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>,
    VariantProps<typeof linkVariants> {
  // Renders the single child (e.g. a router link) with the link styling instead of an `<a>`.
  asChild?: boolean;
  // Leading icon (Figma Icon=Default, Icon leading). Ignored when `dotLeading` is set.
  icon?: React.ReactNode;
  // Trailing icon (Figma Icon trailing).
  iconTrailing?: React.ReactNode;
  // Leading status dot instead of an icon (Figma Icon=Dot leading).
  dotLeading?: boolean;
  // Dims the link and removes it from the tab order (Figma State=Disabled).
  disabled?: boolean;
  // Called instead of `onClick` while the link is disabled or has `aria-disabled`. Explain why here. Nothing else happens. A link with only `aria-disabled` stays in the tab order, so the explanation is reachable by keyboard.
  onGatedClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    { className, color, size, typography, underline, weight, tracking, leading, asChild = false, icon, iconTrailing, dotLeading = false, disabled = false, children, onClick, onGatedClick, href, ...props },
    ref,
  ) => {
    const iconClass = cn('inline-flex shrink-0 items-center justify-center', size === '2xl' ? 'h-icon-lg w-icon-lg' : 'h-icon-md w-icon-md');
    const withSlots = (content: React.ReactNode) => (
      <>
        {dotLeading ? (
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-current" />
        ) : (
          icon && (
            <span aria-hidden="true" className={iconClass}>
              {icon}
            </span>
          )
        )}
        {content}
        {iconTrailing && (
          <span aria-hidden="true" className={iconClass}>
            {iconTrailing}
          </span>
        )}
      </>
    );
    // With asChild the slots go inside the single child element, so the child stays the one focusable link.
    const child = asChild && React.isValidElement(children) ? (children as React.ReactElement<{ children?: React.ReactNode }>) : null;
    const Comp = asChild ? Slot : 'a';
    // disabled leaves the tab order and drops the href. aria-disabled alone is gated: it stays focusable so a keyboard user reaches the explanation.
    const gated = !disabled && (props['aria-disabled'] === true || props['aria-disabled'] === 'true');
    const blocked = disabled || gated;
    return (
      <Comp
        ref={ref}
        href={disabled ? undefined : href}
        aria-disabled={blocked || undefined}
        tabIndex={disabled ? -1 : props.tabIndex}
        onClick={
          blocked
            ? (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                e.stopPropagation();
                onGatedClick?.(e);
              }
            : onClick
        }
        className={cn(linkVariants({ color, size, typography, underline, weight, tracking, leading }), className)}
        {...props}
      >
        {child ? React.cloneElement(child, undefined, withSlots(child.props.children)) : withSlots(children)}
      </Comp>
    );
  },
);
Link.displayName = 'Link';

export { Link, linkVariants };
