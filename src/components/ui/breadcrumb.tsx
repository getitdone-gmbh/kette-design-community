'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { ChevronRight, Ellipsis } from 'lucide-react';
import * as React from 'react';

import { focusRing } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { useLabels, usePreset } from './labels-context';

// Figma Breadcrumbs (1122:153) + _Breadcrumb button base (43:3221).
// Type Text | Text with line | Button primary | Button gray | Button gray with border | Path, Divider Chevron | Slash.
type BreadcrumbType = 'text' | 'text-with-line' | 'button-primary' | 'button-gray' | 'button-gray-border' | 'path';
type BreadcrumbDivider = 'chevron' | 'slash';

interface BreadcrumbContextValue {
  type: BreadcrumbType;
  divider: BreadcrumbDivider;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue>({ type: 'text', divider: 'chevron' });

const listVariants = cva('flex flex-wrap items-center', {
  variants: {
    type: {
      text: 'gap-3',
      'text-with-line': 'gap-3 border-y border-solid border-border-default py-2 pl-2',
      'button-primary': 'gap-2',
      'button-gray': 'gap-2',
      'button-gray-border': 'gap-2 rounded-control bg-muted p-1',
      path: 'gap-gap-control',
    },
  },
  defaultVariants: { type: 'text' },
});

const itemVariants = cva(
  [
    'inline-flex h-control-sm items-center justify-center whitespace-nowrap rounded-item typography-text-small transition-colors',
    'aria-[current=page]:text-text-default',
    'aria-disabled:pointer-events-none aria-disabled:text-text-disabled',
    ...focusRing,
  ],
  {
    variants: {
      type: {
        text: 'rounded-none text-text-subtle hover:text-text-default',
        'text-with-line': 'rounded-none text-text-subtle hover:text-text-default',
        'button-primary': 'px-2 py-1 text-text-subtle hover:bg-background-brand-subtle aria-[current=page]:bg-background-brand-subtle',
        // Gray segments sit on the muted fill, which needs the on-muted role to hold 4.5:1.
        'button-gray': 'px-2 py-1 text-text-subtle-on-muted hover:bg-muted aria-[current=page]:bg-muted',
        'button-gray-border': 'px-2 py-1 text-text-subtle-on-muted hover:bg-background aria-[current=page]:bg-background aria-[current=page]:shadow-elevation-surface',
        path: 'rounded-none text-text-subtle hover:text-text-default',
      },
    },
    defaultVariants: { type: 'text' },
  },
);

export interface BreadcrumbsProps extends React.ComponentPropsWithoutRef<'nav'> {
  type?: BreadcrumbType;
  divider?: BreadcrumbDivider;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, type = 'text', divider = 'chevron', children, 'aria-label': ariaLabelProp, ...props }, ref) => {
    const l = useLabels();
    const ariaLabel = ariaLabelProp ?? l.breadcrumb;
    return (
    <BreadcrumbContext.Provider value={{ type, divider }}>
      <nav ref={ref} aria-label={ariaLabel} className={className} {...props}>
        <ol className={listVariants({ type })}>{children}</ol>
      </nav>
    </BreadcrumbContext.Provider>
  );
  },
);
Breadcrumbs.displayName = 'Breadcrumbs';

const BreadcrumbSeparator = ({ className }: { className?: string }) => {
  const { divider, type } = React.useContext(BreadcrumbContext);
  const zero = usePreset() === 'zero';
  const pathSize = zero ? 'h-icon-xs w-icon-xs' : 'h-icon-2xs w-icon-2xs';
  const size = type === 'path' ? pathSize : divider === 'slash' ? 'h-icon-md w-icon-md' : 'h-icon-sm w-icon-sm';
  return (
    <span aria-hidden="true" data-separator="" className={cn('inline-flex shrink-0 text-icon-subtle', size, className)}>
      {divider === 'slash' ? (
        <svg viewBox="0 0 20 20" fill="none" className="h-full w-full">
          <path d="m7 16 6-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <ChevronRight className="h-full w-full" />
      )}
    </span>
  );
};

// One path segment plus the divider that follows it (hidden on the last item).
const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, children, ...props }, ref) => {
    const { type } = React.useContext(BreadcrumbContext);
    return (
      <li
        ref={ref}
        className={cn('group/crumb inline-flex min-w-0 items-center', type === 'path' ? 'gap-gap-control' : type === 'text' || type === 'text-with-line' ? 'gap-3' : 'gap-2', className)}
        {...props}
      >
        {children}
        <span className="inline-flex group-last/crumb:hidden">
          <BreadcrumbSeparator />
        </span>
      </li>
    );
  },
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  asChild?: boolean;
  // Marks the current page: not a link, `aria-current="page"`.
  current?: boolean;
  // Unreachable level: dimmed and not focusable.
  disabled?: boolean;
  // Leading icon such as a home glyph.
  icon?: React.ReactNode;
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, current = false, disabled = false, icon, children, ...props }, ref) => {
    const { type } = React.useContext(BreadcrumbContext);
    const classes = cn(itemVariants({ type }), icon && !children && 'px-1', className);
    const content = (
      <>
        {icon && (
          <span aria-hidden="true" className="inline-flex h-icon-md w-icon-md shrink-0 items-center justify-center">
            {icon}
          </span>
        )}
        {children}
      </>
    );
    if (current || disabled) {
      // Current page and disabled levels are plain text, not links.
      return (
        <span
          ref={ref as unknown as React.Ref<HTMLSpanElement>}
          aria-current={current ? 'page' : undefined}
          aria-disabled={disabled || undefined}
          title={props.title}
          className={classes}
        >
          {content}
        </span>
      );
    }
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp ref={ref} className={classes} {...props}>
        {asChild && React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ children?: React.ReactNode }>, undefined, (
              <>
                {icon && (
                  <span aria-hidden="true" className="inline-flex h-icon-md w-icon-md shrink-0 items-center justify-center">
                    {icon}
                  </span>
                )}
                {(children as React.ReactElement<{ children?: React.ReactNode }>).props.children}
              </>
            ))
          : content}
      </Comp>
    );
  },
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

// Collapsed middle levels ("...").
const BreadcrumbEllipsis = ({ className, label: labelProp }: { className?: string; label?: string }) => {
  const l = useLabels();
  const label = labelProp ?? l.moreLevels;
  const { type } = React.useContext(BreadcrumbContext);
  return (
    <span role="presentation" className={cn(itemVariants({ type }), 'hover:text-text-subtle', className)}>
      <Ellipsis aria-hidden="true" className="h-icon-md w-icon-md" />
      <span className="sr-only">{label}</span>
    </span>
  );
};

export { BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, Breadcrumbs, type BreadcrumbDivider, type BreadcrumbType };
