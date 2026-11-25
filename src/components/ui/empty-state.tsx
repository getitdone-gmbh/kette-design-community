'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, Inbox, Lock, Search } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { useEdge } from './edge';

// One empty body for EmptyState and DataStatePanel (ADR-0001): dashed frame with card corners, bare icon, short title, smaller text. The root takes the free height of a flex column (flex-1) and centres the content.
export const stateClasses = {
  root: 'flex w-full flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center',
  frame: 'rounded-card border border-dashed',
  icon: 'flex h-icon-md w-icon-md items-center justify-center text-icon-subtle',
  title: 'typography-ui-medium text-foreground',
  text: 'typography-text-extra-small max-w-reading text-muted-foreground',
} as const;

// Figma: Empty state 1182:317. Every variant shares the body of stateClasses; the variant picks the default glyph and the live region role.
const emptyStateVariants = cva(stateClasses.root, {
  variants: {
    // center is the default. start aligns icon, text and actions to the start edge, for page level states beside left aligned content.
    align: {
      center: 'items-center text-center',
      start: 'items-start text-left',
    },
    variant: {
      default: '',
      'first-use': '',
      'no-results': '',
      error: '',
      'no-access': '',
    },
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      // Page level (404, access denied, first run of a whole page): the title takes the page title type role.
      page: '',
    },
  },
  defaultVariants: { variant: 'default', size: 'sm', align: 'center' },
});

const DEFAULT_ICONS = {
  default: Search,
  'first-use': Inbox,
  'no-results': Search,
  error: AlertCircle,
  'no-access': Lock,
} as const;

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof emptyStateVariants> {
  title: React.ReactNode;
  // Element of the title. Defaults to a paragraph; use a heading level for pages like 404 or access denied (size="page" sets the page title type role).
  // `display` sets the title in the display-sm role (32px, the closest token step to a 36px title). Default keeps the role of the size.
  titleSize?: 'default' | 'display';
  titleAs?: 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  // Text or nodes. Plain text renders as one paragraph. Pass your own paragraphs as a node (rendered in a block), or use `children` for several.
  description?: React.ReactNode;
  // Short line above the title, for example "404" or an error code.
  kicker?: React.ReactNode;
  // Further content below the description, for example additional paragraphs.
  children?: React.ReactNode;
  // Overrides the variant's default glyph. Pass null to render no icon.
  icon?: React.ReactNode;
  // Replaces the icon with a larger illustration (see Illustration).
  illustration?: React.ReactNode;
  // `primary` colours the icon in the brand icon colour.
  tone?: 'primary' | 'gray';
  // Action buttons. Stacked and centered for the four state variants, in a row for default.
  actions?: React.ReactNode;
  // Dashed frame around the body (default). Set false inside a table row, grid cell or an already framed box, so a state has one frame.
  outlined?: boolean;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, variant = 'default', size = 'sm', tone = 'gray', title, titleAs = 'p', titleSize = 'default', description, kicker, icon, illustration, actions, role, align = 'center', outlined = true, children, ...props }, ref) => {
    const edge = useEdge();
    const start = align === 'start';
    const isState = variant !== 'default';
    const compact = size === 'xs' || size === 'sm';
    const Fallback = DEFAULT_ICONS[variant ?? 'default'];
    const glyph = icon === undefined ? <Fallback className="h-icon-md w-icon-md" aria-hidden="true" /> : icon;
    const resolvedRole = role ?? (variant === 'error' ? 'alert' : 'status');

    const symbol = illustration ? (
      illustration
    ) : glyph === null ? null : (
      <span aria-hidden="true" className={cn(stateClasses.icon, tone === 'primary' && 'text-icon-brand')}>
        {glyph}
      </span>
    );

    const Title = titleAs;
    const titleClass = titleSize === 'display' ? 'typography-display-sm text-foreground' : size === 'page' ? 'typography-page-title text-foreground' : compact ? stateClasses.title : 'typography-ui-lg-semibold text-foreground';
    const textClass = compact ? stateClasses.text : 'typography-ui max-w-reading text-text-subtle';

    return (
      <div ref={ref} role={resolvedRole} className={cn(emptyStateVariants({ variant, size, align }), outlined && cn(stateClasses.frame, edge), className)} {...props}>
        {symbol}
        <div className={cn('flex w-full flex-col gap-1', start ? 'items-start' : 'items-center')}>
          {kicker ? (
            <p data-slot="kicker" className="typography-ui-semibold m-0 text-text-subtle">
              {kicker}
            </p>
          ) : null}
          <Title data-slot="title" className={cn('m-0', titleClass)}>
            {title}
          </Title>
          {description ? (
            typeof description === 'string' || typeof description === 'number' ? (
              <p data-slot="description" className={cn('m-0', textClass)}>{description}</p>
            ) : (
              <div data-slot="description" className={cn('flex flex-col gap-2 [&>p]:m-0', textClass)}>{description}</div>
            )
          ) : null}
          {children ? <div data-slot="content" className={cn('flex flex-col gap-2 [&>p]:m-0', textClass)}>{children}</div> : null}
        </div>
        {actions ? <div className={cn('flex', isState ? cn('flex-col gap-2', start ? 'items-start' : 'items-center') : cn('flex-wrap gap-3', start ? 'items-start justify-start' : 'items-center justify-center'))}>{actions}</div> : null}
      </div>
    );
  },
);
EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateVariants };
