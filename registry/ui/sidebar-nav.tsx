'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowLeft, ChevronDown, Search, X } from 'lucide-react';
import * as React from 'react';

import { useEscapeKey } from '@/lib/use-escape-key';
import { cn } from '@/lib/utils';
import { SidebarKbd, SidebarNavItem, SidebarSection, SidebarTree, type SidebarNavItemProps } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useLabels, usePreset } from '@/components/ui/labels-context';

// Additive sidebar building blocks (Figma "Sidebar navigation"): data-driven app trees, the settings mode
// (back row, search), the Dual-tier / Slim tiers, the featured card, the account row and the mobile menu.
// The existing Sidebar, SidebarSection, SidebarTree and SidebarNavItem keep their API.

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-background';

/* -------------------------------------------------------------------------------------------------
 * Data-driven navigation tree
 * -----------------------------------------------------------------------------------------------*/

export interface SidebarNavNode
  extends Pick<SidebarNavItemProps, 'icon' | 'secondary' | 'count' | 'trailing' | 'active' | 'disabled' | 'dot' | 'statusDot' | 'locked'> {
  id: string;
  label: React.ReactNode;
  /** Makes the row a link. A node without href but with children toggles its group instead. */
  href?: string;
  /** Accessible name for the group toggle when `label` is not a string. */
  toggleLabel?: string;
  /** Opens the group initially. Groups with an active descendant open automatically. */
  defaultOpen?: boolean;
  children?: SidebarNavNode[];
}

export interface SidebarNavTreeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  nodes: SidebarNavNode[];
  /** Passed to every SidebarNavItem. Default `nav`. */
  variant?: SidebarNavItemProps['variant'];
  /** Controlled open group ids. */
  openIds?: string[];
  /** Initial open group ids when uncontrolled. Merged with `defaultOpen` and active descendants. */
  defaultOpenIds?: string[];
  onOpenIdsChange?: (ids: string[]) => void;
  /** Custom link element (e.g. a router Link). Receives the node and the props to spread on the anchor. */
  renderLink?: (node: SidebarNavNode, props: SidebarNavItemProps) => React.ReactElement;
}

const hasActive = (node: SidebarNavNode): boolean =>
  Boolean(node.active) || (node.children?.some(hasActive) ?? false);

const collectInitialOpen = (nodes: SidebarNavNode[], acc: string[] = []): string[] => {
  nodes.forEach((node) => {
    if (node.children?.length) {
      if (node.defaultOpen || node.children.some(hasActive)) acc.push(node.id);
      collectInitialOpen(node.children, acc);
    }
  });
  return acc;
};

const SidebarNavTree = React.forwardRef<HTMLDivElement, SidebarNavTreeProps>(
  (
    { className, nodes, variant = 'nav', openIds, defaultOpenIds, onOpenIdsChange, renderLink, ...props },
    ref,
  ) => {
    const l = useLabels();
    const [uncontrolled, setUncontrolled] = React.useState<string[]>(() => [
      ...(defaultOpenIds ?? []),
      ...collectInitialOpen(nodes),
    ]);
    const open = openIds ?? uncontrolled;
    const setOpen = (id: string, next: boolean) => {
      const ids = next ? [...open, id] : open.filter((value) => value !== id);
      if (openIds === undefined) setUncontrolled(ids);
      onOpenIdsChange?.(ids);
    };

    const renderNodes = (list: SidebarNavNode[], depth = 0): React.ReactNode =>
      list.map((node) => {
        const itemProps: SidebarNavItemProps = {
          variant,
          icon: node.icon,
          label: node.label,
          secondary: node.secondary,
          count: node.count,
          trailing: node.trailing,
          active: node.active,
          disabled: node.disabled,
          dot: node.dot,
          statusDot: node.statusDot,
          locked: node.locked,
          href: node.href ?? '#',
        };
        const link = renderLink ? renderLink(node, itemProps) : <SidebarNavItem {...itemProps} />;
        if (!node.children?.length) return <React.Fragment key={node.id}>{link}</React.Fragment>;

        const isOpen = open.includes(node.id);
        const toggleName = node.toggleLabel ?? (typeof node.label === 'string' ? node.label : l.group);
        return (
          <CollapsiblePrimitive.Root
            key={node.id}
            open={isOpen}
            onOpenChange={(next) => setOpen(node.id, next)}
            className="flex flex-col gap-[2px]"
          >
            <div className="relative flex items-center">
              {node.href ? (
                <>
                  <div className="min-w-0 flex-1 [&>a]:pr-8">{link}</div>
                  <CollapsiblePrimitive.Trigger
                    aria-label={toggleName}
                    className={cn(
                      'absolute right-1 inline-flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent group-data-[rail]/sb:hidden',
                      focusRing,
                    )}
                  >
                    <ChevronDown
                      className={cn('h-[14px] w-[14px] transition-transform', !isOpen && '-rotate-90')}
                      aria-hidden
                    />
                  </CollapsiblePrimitive.Trigger>
                </>
              ) : (
                <SidebarNavItem asChild label={node.label} variant={variant} className="w-full" active={node.active} disabled={node.disabled}>
                  <CollapsiblePrimitive.Trigger>
                    {node.icon && (
                      <span
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4"
                        aria-hidden
                      >
                        {node.icon}
                      </span>
                    )}
                    <span className="truncate text-left group-data-[rail]/sb:sr-only">{node.label}</span>
                    <ChevronDown
                      className={cn(
                        'ml-auto h-[14px] w-[14px] shrink-0 text-sidebar-muted-foreground transition-transform group-data-[rail]/sb:hidden',
                        !isOpen && '-rotate-90',
                      )}
                      aria-hidden
                    />
                  </CollapsiblePrimitive.Trigger>
                </SidebarNavItem>
              )}
            </div>
            <CollapsiblePrimitive.Content>
              <SidebarTree level={depth > 0 ? 1 : 0}>{renderNodes(node.children, depth + 1)}</SidebarTree>
            </CollapsiblePrimitive.Content>
          </CollapsiblePrimitive.Root>
        );
      });

    return (
      <div ref={ref} className={cn('flex flex-col gap-[2px]', className)} {...props}>
        {renderNodes(nodes)}
      </div>
    );
  },
);
SidebarNavTree.displayName = 'SidebarNavTree';

/* -------------------------------------------------------------------------------------------------
 * Grouped sections (settings mode: Finance, Development and APIs, Admin)
 * -----------------------------------------------------------------------------------------------*/

export interface SidebarNavGroup {
  id: string;
  /** Group heading, e.g. `Integrations · Finance`. */
  label: React.ReactNode;
  nodes: SidebarNavNode[];
  /** Renders the heading as a collapsible section toggle. Default false (static heading). */
  collapsible?: boolean;
  /** Initial state for a collapsible group. Default true. */
  defaultOpen?: boolean;
}

export interface SidebarNavGroupsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    Pick<SidebarNavTreeProps, 'variant' | 'renderLink'> {
  groups: SidebarNavGroup[];
}

// Data-driven grouped sections: a heading per group followed by its navigation tree.
const SidebarNavGroups = React.forwardRef<HTMLDivElement, SidebarNavGroupsProps>(
  ({ className, groups, variant, renderLink, ...props }, ref) => {
    const baseId = React.useId();
    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        {groups.map((group) => {
          const tree = <SidebarNavTree nodes={group.nodes} variant={variant} renderLink={renderLink} />;
          if (group.collapsible) {
            return (
              <SidebarSection key={group.id} label={group.label} defaultOpen={group.defaultOpen ?? true}>
                {tree}
              </SidebarSection>
            );
          }
          const headingId = `${baseId}-${group.id}`;
          return (
            <div key={group.id} role="group" aria-labelledby={headingId} className="mt-[14px] flex flex-col gap-[2px]">
              <div
                id={headingId}
                className="typography-ui-sm px-[6px] text-sidebar-muted-foreground group-data-[rail]/sb:hidden"
              >
                {group.label}
              </div>
              {tree}
            </div>
          );
        })}
      </div>
    );
  },
);
SidebarNavGroups.displayName = 'SidebarNavGroups';

/* -------------------------------------------------------------------------------------------------
 * Settings mode: back row and search
 * -----------------------------------------------------------------------------------------------*/

export interface SidebarBackRowProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visible title, e.g. `Settings`. */
  label?: string;
  /** Shortcut hint on the right. Default `Esc`. */
  shortcut?: string;
  /** Also leaves on the Escape key while mounted. Needs `onClick`. */
  closeOnEscape?: boolean;
  /** Screen reader prefix before the title, default `Back from `. Wins over the provider text. */
  backFromLabel?: string;
}

const SidebarBackRow = React.forwardRef<HTMLButtonElement, SidebarBackRowProps>(
  ({ className, label: labelProp, shortcut = 'Esc', closeOnEscape = false, backFromLabel, onClick, ...props }, ref) => {
    const l = useLabels({ backFrom: backFromLabel });
    const label = labelProp ?? l.settings;
    const zero = usePreset() === 'zero';
    useEscapeKey(
      onClick ? () => onClick(undefined as unknown as React.MouseEvent<HTMLButtonElement>) : undefined,
      closeOnEscape,
    );
    return (
      <button
        ref={ref}
        type="button"
        aria-keyshortcuts="Escape"
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-2 text-left text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent',
          zero ? 'typography-nav-item-current h-8 rounded-item' : 'h-nav-item rounded-[8px] text-[14px] font-medium',
          focusRing,
          className,
        )}
        {...props}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only">{l.backFrom}</span>
        <span className="truncate">{label}</span>
        <SidebarKbd aria-hidden>{shortcut}</SidebarKbd>
      </button>
    );
  },
);
SidebarBackRow.displayName = 'SidebarBackRow';

export interface SidebarSearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Accessible name. Defaults to the placeholder. */
  label?: string;
}

const SidebarSearchField = React.forwardRef<HTMLInputElement, SidebarSearchFieldProps>(
  ({ className, label, placeholder: placeholderProp, ...props }, ref) => {
    const l = useLabels();
    const placeholder = placeholderProp ?? l.find;
    const zero = usePreset() === 'zero';
    return (
    <div
      role="search"
      className={cn(
        'flex h-nav-item items-center gap-2 border border-solid bg-background px-2 text-sidebar-muted-foreground focus-within:ring-2 focus-within:ring-sidebar-ring',
        zero ? 'rounded-control border-input' : 'rounded-[8px] border-sidebar-border shadow-sm',
      )}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <input
        ref={ref}
        type="search"
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        className={cn(
          'min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-ui text-sidebar-accent-foreground outline-none placeholder:text-sidebar-muted-foreground',
          className,
        )}
        {...props}
      />
    </div>
  );
  },
);
SidebarSearchField.displayName = 'SidebarSearchField';

/* -------------------------------------------------------------------------------------------------
 * Tiers (Dual-tier, Slim) and rail buttons
 * -----------------------------------------------------------------------------------------------*/

const sidebarTierVariants = cva(
  'flex h-full shrink-0 flex-col overflow-x-hidden border-0 border-r border-solid border-sidebar-border bg-sidebar-background text-sidebar-foreground',
  {
    variants: {
      width: {
        // icon-only rail of the zero sidebar
        collapsed: 'w-sidebar-collapsed',
        // 80, Slim icon column (Figma 82 incl. border)
        rail: 'w-sidebar-rail',
        // 248, regular sidebar width
        panel: 'w-sidebar',
        // 280, Dual-tier primary column and Slim sub navigation
        wide: 'w-aside-compact',
      },
    },
    defaultVariants: { width: 'panel' },
  },
);

export interface SidebarTierProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sidebarTierVariants> {}

const SidebarTier = React.forwardRef<HTMLElement, SidebarTierProps>(({ className, width, ...props }, ref) => (
  <nav ref={ref} className={cn(sidebarTierVariants({ width }), className)} {...props} />
));
SidebarTier.displayName = 'SidebarTier';

export interface SidebarRailButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement> & React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon: React.ReactNode;
  /** Required accessible name and tooltip text. */
  label: string;
  active?: boolean;
}

// Icon-only navigation button for the Slim rail. Renders an anchor when `href` is set, a button otherwise.
const SidebarRailButton = React.forwardRef<HTMLAnchorElement & HTMLButtonElement, SidebarRailButtonProps>(
  ({ className, icon, label, active = false, href, ...props }, ref) => {
    const classes = cn(
      'inline-flex aspect-square h-sidebar-rail-button shrink-0 items-center justify-center rounded-item text-sidebar-muted-foreground no-underline transition-colors',
      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      'data-[active]:bg-sidebar-accent data-[active]:text-sidebar-accent-foreground',
      // Theme selection indicator and list hover (kette-tokens 5.26.0), nothing by default
      '[&:not([data-active])]:hover:bg-[image:var(--image-sidebar-item-hover)] data-[active]:shadow-[shadow:inset_var(--indicator-selection-edge)_0_0_var(--indicator-selection-edge-color),inset_0_0_0_var(--indicator-selection-ring)_var(--indicator-selection-ring-color)]',
      '[&>svg]:h-icon-lg [&>svg]:w-icon-lg',
      focusRing,
      className,
    );
    const shared = { 'aria-label': label, title: label, 'data-active': active || undefined, className: classes };
    return href !== undefined ? (
      <a ref={ref} href={href} aria-current={active ? 'page' : undefined} {...shared} {...props}>
        {icon}
      </a>
    ) : (
      <button ref={ref} type="button" aria-pressed={active} {...shared} {...props}>
        {icon}
      </button>
    );
  },
);
SidebarRailButton.displayName = 'SidebarRailButton';

/* -------------------------------------------------------------------------------------------------
 * Featured card + account row
 * -----------------------------------------------------------------------------------------------*/

export interface SidebarFeaturedCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Leading visual: progress ring, bar or image. */
  media?: React.ReactNode;
  /** Primary action, e.g. an upgrade link. */
  action?: React.ReactNode;
  /** Renders the close button and the Dismiss action when provided. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

const SidebarFeaturedCard = React.forwardRef<HTMLElement, SidebarFeaturedCardProps>(
  ({ className, title, description, media, action, onDismiss, dismissLabel: dismissLabelProp, ...props }, ref) => {
    const l = useLabels();
    const dismissLabel = dismissLabelProp ?? l.dismiss;
    const titleId = React.useId();
    return (
      <section
        ref={ref}
        aria-labelledby={titleId}
        className={cn('relative flex flex-col gap-4 rounded-control bg-muted px-4 py-5 text-text-default', className)}
        {...props}
      >
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className={cn(
              'absolute right-2 top-2 inline-flex h-control-sm w-control-sm items-center justify-center rounded-control text-icon-subtle hover:bg-muted-strong',
              focusRing,
            )}
          >
            <X className="h-icon-sm w-icon-sm" aria-hidden />
          </button>
        )}
        {media}
        <div className="flex flex-col gap-1">
          <p id={titleId} className="typography-label-highlight m-0">
            {title}
          </p>
          {description && <p className="typography-ui m-0 text-text-subtle-on-muted">{description}</p>}
        </div>
        {(onDismiss || action) && (
          <div className="flex items-center gap-3">
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className={cn('typography-label-highlight rounded-item text-text-subtle-on-muted hover:text-text-default', focusRing)}
              >
                {dismissLabel}
              </button>
            )}
            {action}
          </div>
        )}
      </section>
    );
  },
);
SidebarFeaturedCard.displayName = 'SidebarFeaturedCard';

export interface SidebarAccountProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar: React.ReactNode;
  name: React.ReactNode;
  secondary?: React.ReactNode;
  /** Trailing action, e.g. a log out icon button with an aria-label. */
  action?: React.ReactNode;
}

const SidebarAccount = React.forwardRef<HTMLDivElement, SidebarAccountProps>(
  ({ className, avatar, name, secondary, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 border-0 border-t border-solid border-sidebar-border px-2 pt-4',
        className,
      )}
      {...props}
    >
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="typography-label-highlight truncate text-sidebar-accent-foreground">{name}</span>
        {secondary && <span className="typography-ui truncate text-sidebar-muted-foreground">{secondary}</span>}
      </div>
      {action}
    </div>
  ),
);
SidebarAccount.displayName = 'SidebarAccount';

/* -------------------------------------------------------------------------------------------------
 * Mobile menu
 * -----------------------------------------------------------------------------------------------*/

export interface SidebarMobileMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the dialog. Default `Menu`. */
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Full-height navigation drawer for small screens, built on Sheet (focus trap, Esc, scrim close).
const SidebarMobileMenu = ({ open, onOpenChange, title: titleProp, children, className }: SidebarMobileMenuProps) => {
  const l = useLabels();
  const title = titleProp ?? l.menu;
  return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="left"
      padded={false}
      className={cn('w-5/6 bg-sidebar-background text-sidebar-foreground', className)}
    >
      <SheetTitle className="sr-only">{title}</SheetTitle>
      <SheetDescription className="sr-only">{l.navigation}</SheetDescription>
      <nav aria-label={title} className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto p-4">
        {children}
      </nav>
    </SheetContent>
  </Sheet>
  );
};

export {
  SidebarAccount,
  SidebarBackRow,
  SidebarFeaturedCard,
  SidebarMobileMenu,
  SidebarNavGroups,
  SidebarNavTree,
  SidebarRailButton,
  SidebarSearchField,
  SidebarTier,
  sidebarTierVariants,
};
