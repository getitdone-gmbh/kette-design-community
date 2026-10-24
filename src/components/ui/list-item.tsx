'use client';

import { Slot } from '@radix-ui/react-slot';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { focusRing, transitionBase } from '../../lib/recipes';
import { cn } from '../../lib/utils';

// Figma: ListItem 10231:319727 (Lead=Icon|Avatar|Checkbox|None, Trailing=Chevron|Count|Switch|Status|None, states Default|Hover|Active|Focused|Selected|Disabled).
export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'onClick'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  // Icon, avatar or checkbox before the text.
  lead?: React.ReactNode;
  // Count, status chip or switch at the end. Do not combine an interactive trailing control with onClick.
  trailing?: React.ReactNode;
  // Shows a trailing chevron (navigation rows).
  chevron?: boolean;
  // Container-responsive row: the trailing controls sit under the title (full width, wrapping) until the nearest container is at least the `@area-2xs` container screen (420px) wide, then they move to the end of the row. The width is measured on the nearest ancestor with the `@container` class, for example `<Card container>`, not on the viewport. Without such an ancestor the controls stay under the title.
  responsive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  // Makes the row a real button.
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  // Link mode: renders the row as an anchor. Pass `target` and `rel` as usual.
  href?: string;
  target?: string;
  rel?: string;
  // Link mode with your own link component (router Link): the single child is the link element and receives the row styles and content.
  asChild?: boolean;
}

const ListItem = React.forwardRef<HTMLElement, ListItemProps>(
  ({ className, title, subtitle, lead, trailing, chevron = false, responsive = false, selected = false, disabled = false, onClick, href, asChild = false, children, ...props }, ref) => {
    const isLink = Boolean(href) || asChild;
    const interactive = (Boolean(onClick) || isLink) && !disabled;
    const classes = cn(
      'flex min-h-row w-full items-center gap-3 rounded-item px-3 py-1 text-left',
      responsive && 'flex-wrap gap-y-2 py-2 @area-2xs:flex-nowrap @area-2xs:gap-y-0 @area-2xs:py-1',
      ...transitionBase,
      interactive && ['group cursor-pointer', ...focusRing, 'hover:bg-muted', 'active:bg-muted-strong'],
      selected && 'bg-muted',
      disabled && 'pointer-events-none opacity-disabled',
      className,
    );
    const content = (
      <>
        {lead ? <span className="flex shrink-0 items-center text-icon-default">{lead}</span> : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="typography-ui-medium truncate text-text-default">{title}</span>
          {subtitle ? <span className={cn('typography-ui truncate', selected ? 'text-text-subtle-on-muted' : interactive ? 'text-text-subtle group-hover:text-text-subtle-on-muted' : 'text-text-subtle')}>{subtitle}</span> : null}
        </span>
        {trailing ? <span className={cn('typography-ui flex shrink-0 items-center', responsive && 'w-full flex-wrap gap-2 @area-2xs:w-auto @area-2xs:flex-nowrap @area-2xs:justify-end', selected ? 'text-text-subtle-on-muted' : interactive ? 'text-text-subtle group-hover:text-text-subtle-on-muted' : 'text-text-subtle')}>{trailing}</span> : null}
        {chevron ? <ChevronRight className="h-icon-sm w-icon-sm shrink-0 text-icon-subtle" aria-hidden="true" /> : null}
      </>
    );
    if (asChild && React.isValidElement(children)) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={classes}
          aria-disabled={disabled || undefined}
          aria-current={selected ? 'true' : undefined}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {React.cloneElement(children as React.ReactElement<{ children?: React.ReactNode }>, undefined, content)}
        </Slot>
      );
    }
    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          href={disabled ? undefined : href}
          aria-disabled={disabled || undefined}
          aria-current={selected ? 'true' : undefined}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }
    if (onClick) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          disabled={disabled}
          aria-current={selected ? 'true' : undefined}
          onClick={onClick}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {content}
        </button>
      );
    }
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        aria-disabled={disabled || undefined}
        data-selected={selected || undefined}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {content}
      </div>
    );
  },
);
ListItem.displayName = 'ListItem';

export { ListItem };
