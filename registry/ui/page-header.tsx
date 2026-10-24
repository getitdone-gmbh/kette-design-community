'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { useEmptyWrapper } from '@/lib/use-collapse-empty';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLabels } from '@/components/ui/labels-context';

// Figma: Page header 1239:122640 (Style=zero|zero tabs|Record company|person|project|invoice, Divider, Attributes).
const pageHeaderTitleVariants = cva('min-w-0 text-text-default', {
  variants: {
    variant: {
      default: 'typography-h3',
      // Product page title (zero: 24/29 600).
      zero: 'typography-page-title',
      // Record head: a named object (company, person, project, invoice) with a lead tile and badges.
      record: 'typography-page-title',
      // Profile styles: large title next to a avatar, optionally under a cover banner.
      avatar: 'typography-h3',
      banner: 'typography-h3',
      'banner-avatar': 'typography-h3',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'>,
    VariantProps<typeof pageHeaderTitleVariants> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  // Heading level element for the title.
  titleAs?: 'h1' | 'h2' | 'h3';
  // Breadcrumb navigation rendered above the title row.
  breadcrumbs?: React.ReactNode;
  // Avatar, logo tile or object icon before the title.
  leading?: React.ReactNode;
  // Badges or chips inline after the title.
  badges?: React.ReactNode;
  // Row of scope chips under the subtitle (for example an organisation or a product scope). Chips can carry a leading icon.
  scopeChips?: React.ReactNode;
  // Buttons, bottom-aligned on desktop and full-width stacked on mobile.
  actions?: React.ReactNode;
  // Mobile More menu: `DropdownMenuItem` rows (also groups, separators and checkbox items). Below the sm breakpoint `actions` are hidden and a non-shrinking icon button (Button icon-sm, outline) opens this menu with 44px touch rows. From sm up the menu is hidden and `actions` show as before. Without `overflow` nothing changes.
  overflow?: React.ReactNode;
  // The one action that must stay reachable on a phone (for example "New invoice"). It renders in every viewport next to the title block, never moves into the `overflow` menu and never changes position after hydration, because only CSS switches the layout. `actions` can still collapse into `overflow` below sm.
  primaryAction?: React.ReactNode;
  // Accessible name of the More button. Defaults to the provider text ("More actions").
  overflowLabel?: string;
  // Tab list rendered under the title row.
  tabs?: React.ReactNode;
  // Attributes column to the right of the header (record layouts).
  attributes?: React.ReactNode;
  // Hairline under the header. Off for the zero style by default.
  divider?: boolean;
  // Cover image or gradient for the banner styles. Rendered full width, 240px high.
  cover?: React.ReactNode;
  // Centers the content (banner and banner-avatar styles).
  centered?: boolean;
}

// Mobile More trigger. `flex-none shrink-0` keeps it a square next to a long title, and it sits outside the actions wrapper so the stacked-actions rule (`flex-1` children) never stretches it.
const PageHeaderOverflow = ({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) => (
  <div data-slot="overflow" className={cn('flex flex-none shrink-0 items-center sm:hidden', className)}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" aria-label={label} className="flex-none shrink-0">
          <MoreHorizontal aria-hidden="true" className="h-icon-sm w-icon-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" density="touch">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

// Div that leaves the layout while none of its children is shown (hidden by class, attribute or style), so the gap of its parent does not leave a blank row.
const EmptyAwareDiv = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { ref, empty } = useEmptyWrapper<HTMLDivElement>();
  return <div ref={ref} data-empty={empty || undefined} className={className} {...props} />;
};

// Actions of the header. From sm up `primaryAction` sits beside the actions in one group that does not wrap: the actions wrap among themselves, the primary action stays at the end of the group and never drops alone onto its own row. Below sm the group dissolves and the primary action moves behind the tabs slot (title, tabs, primary action).
const HeaderActions = ({ gap, overflowing, actions, primaryAction }: { gap: string; overflowing: boolean; actions?: React.ReactNode; primaryAction?: React.ReactNode }) => {
  if (!primaryAction) {
    return (
      <EmptyAwareDiv className={cn('flex flex-wrap items-center', gap, 'max-sm:[&>*]:flex-1 data-[empty=true]:hidden', overflowing && 'max-sm:hidden')}>{actions}</EmptyAwareDiv>
    );
  }
  const primary = (
    <EmptyAwareDiv data-slot="primary-action" className="flex shrink-0 items-center max-sm:order-last max-sm:[&>*]:flex-1 data-[empty=true]:hidden">
      {primaryAction}
    </EmptyAwareDiv>
  );
  if (!actions) return primary;
  return (
    <EmptyAwareDiv data-slot="header-actions" className={cn('flex items-center max-sm:contents sm:flex-nowrap sm:data-[empty=true]:hidden', gap)}>
      <EmptyAwareDiv data-slot="actions" className={cn('flex min-w-0 flex-wrap items-center', gap, 'max-sm:[&>*]:flex-1 data-[empty=true]:hidden', overflowing && 'max-sm:hidden')}>
        {actions}
      </EmptyAwareDiv>
      {primary}
    </EmptyAwareDiv>
  );
};

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    { className, variant = 'default', title, subtitle, titleAs: Title = 'h1', breadcrumbs, leading, badges, scopeChips, actions, primaryAction, overflow, overflowLabel, tabs, attributes, divider, cover, centered = false, ...props },
    ref,
  ) => {
    const l = useLabels({ moreActions: overflowLabel });
    const moreTrigger = (className: string) => (overflow ? <PageHeaderOverflow label={l.moreActions} className={className}>{overflow}</PageHeaderOverflow> : null);
    // `actions` collapse into the More menu below sm when `overflow` is set. `primaryAction` is always visible. From sm up it stays beside the actions in one group, so it never drops alone onto its own row.
    // Below sm the group dissolves (`contents`) and the primary action moves behind the tabs slot (title, scope controls, then the main action, as in the prototype). Only CSS changes the order.
    const actionsBlock = (gap: string) => {
      if (!actions && !primaryAction) return null;
      return (
        <HeaderActions gap={gap} overflowing={Boolean(overflow)} actions={actions} primaryAction={primaryAction} />
      );
    };
    const isBanner = variant === 'banner' || variant === 'banner-avatar';
    const showDivider = divider ?? variant === 'default';
    if (isBanner) {
      const overlap = variant === 'banner-avatar' && cover;
      return (
        <header ref={ref} className={cn('flex w-full flex-col', className)} {...props}>
          {cover ? <div className="relative h-page-header-cover w-full overflow-hidden">{cover}</div> : null}
          <div className={cn('flex w-full flex-col gap-6 px-4 md:px-8', overlap ? '-mt-10' : 'pt-6', centered && 'items-center text-center')}>
            <div className={cn('flex w-full gap-6', centered ? 'flex-col items-center' : 'flex-col md:flex-row md:items-start')}>
              {leading ? (
                <div className="h-avatar-profile w-avatar-profile shrink-0 overflow-hidden rounded-full border-4 border-solid border-surface-canvas shadow-elevation-raised [&>*]:h-full [&>*]:w-full">
                  {leading}
                </div>
              ) : null}
              <div className={cn('flex min-w-0 flex-1 flex-col gap-5', leading && !centered && 'md:pt-16', centered && 'items-center')}>
                {breadcrumbs ? <div>{breadcrumbs}</div> : null}
                <div className={cn('flex w-full flex-col gap-4 max-sm:contents', centered ? 'items-center' : 'md:flex-row md:items-start')}>
                  <div className={cn('flex min-w-0 flex-1 flex-col gap-1', centered && 'items-center')}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Title className={pageHeaderTitleVariants({ variant })}>{title}</Title>
                      {badges}
                    </div>
                    {subtitle ? <p className="typography-small text-text-subtle">{subtitle}</p> : null}
                    {scopeChips ? <div data-scope-chips="" className="flex flex-wrap items-center gap-2 pt-3">{scopeChips}</div> : null}
                  </div>
                  {moreTrigger('self-end')}
                  {actionsBlock('gap-3')}
                </div>
                {tabs}
              </div>
            </div>
            {divider ? <hr className="m-0 h-px w-full border-0 bg-border" /> : null}
          </div>
        </header>
      );
    }
    return (
      <header
        ref={ref}
        className={cn('flex w-full flex-col lg:flex-row', variant === 'zero' ? 'gap-4' : 'gap-6', showDivider && 'border-b border-solid border-border pb-4', className)}
        {...props}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {breadcrumbs ? <div>{breadcrumbs}</div> : null}
          <div className="flex flex-col gap-4 max-sm:contents sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {leading ? <div className="shrink-0">{leading}</div> : null}
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Title className={pageHeaderTitleVariants({ variant })}>{title}</Title>
                  {badges}
                </div>
                {subtitle ? <p className="typography-ui text-text-subtle">{subtitle}</p> : null}
                {scopeChips ? <div data-scope-chips="" className="flex flex-wrap items-center gap-2 pt-3">{scopeChips}</div> : null}
              </div>
              {moreTrigger('ml-auto')}
            </div>
            {actionsBlock('gap-2')}
          </div>
          {tabs}
        </div>
        {attributes ? <div className="w-full shrink-0 lg:w-aside">{attributes}</div> : null}
      </header>
    );
  },
);
PageHeader.displayName = 'PageHeader';

export { PageHeader, pageHeaderTitleVariants };
