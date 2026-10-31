'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { Slot } from '@radix-ui/react-slot';
import { Check, ChevronDown, Command, Lock, PanelLeft, Plus, Search } from 'lucide-react';
import * as React from 'react';

import { cn } from './../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { useLabels, usePreset } from './labels-context';

// Inset-style app sidebar (Attio pattern, workload.zero `zero` theme): the sidebar sits on the
// canvas color, the page content is a rounded panel (`SidebarInset`) with a 1px border.
//
// Colors come exclusively from the `sidebar-*` and `product-*` token families shipped in
// the design tokens (`styles/theme.css`, zero theme and every other theme):
//   bg-sidebar-background, text-sidebar-foreground, bg-sidebar-accent,
//   text-sidebar-accent-foreground, border-sidebar-border, ring-sidebar-ring,
//   bg-product-<name>-default, text-product-<name>-on.
// Never hardcode hex/palette values here. Sizes follow the V9 reference design
// (workload.zero dashboard prototype, variant v9); house rule: no `.5`
// Tailwind steps, use arbitrary px values instead.

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

// `hide` removes the sidebar when collapsed (default). `rail` keeps a 56px icon-only rail.
type SidebarCollapsedMode = 'hide' | 'rail';

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  sidebarId: string;
  collapsedMode: SidebarCollapsedMode;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within <SidebarLayout> or <SidebarProvider>.');
  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------------------------*/

interface SidebarProviderProps {
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Initial collapsed state when uncontrolled. */
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** What collapsing does: `hide` (default) removes the sidebar, `rail` keeps an icon-only 56px rail. */
  collapsedMode?: SidebarCollapsedMode;
  children?: React.ReactNode;
}

// Collapse state for Sidebar, SidebarTrigger and useSidebar without any wrapper element. Use it when the app owns the page layout
// (SidebarLayout adds a min-h-screen flex wrapper around the same provider).
function SidebarProvider({ collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, collapsedMode = 'hide', children }: SidebarProviderProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed);
  const collapsed = collapsedProp ?? uncontrolled;
  const sidebarId = React.useId();

  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (collapsedProp === undefined) setUncontrolled(next);
      onCollapsedChange?.(next);
    },
    [collapsedProp, onCollapsedChange],
  );

  const value = React.useMemo(
    () => ({ collapsed, setCollapsed, toggle: () => setCollapsed(!collapsed), sidebarId, collapsedMode }),
    [collapsed, setCollapsed, sidebarId, collapsedMode],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

const SidebarLayoutFrame = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar();
  return (
    <div
      ref={ref}
      data-state={collapsed ? 'collapsed' : 'expanded'}
      className={cn('flex min-h-screen w-full bg-sidebar-background text-sidebar-foreground', className)}
      {...props}
    />
  );
});
SidebarLayoutFrame.displayName = 'SidebarLayoutFrame';

interface SidebarLayoutProps extends React.HTMLAttributes<HTMLDivElement>, Omit<SidebarProviderProps, 'children'> {}

const SidebarLayout = React.forwardRef<HTMLDivElement, SidebarLayoutProps>(
  ({ className, collapsed, defaultCollapsed, onCollapsedChange, collapsedMode, children, ...props }, ref) => (
    <SidebarProvider collapsed={collapsed} defaultCollapsed={defaultCollapsed} onCollapsedChange={onCollapsedChange} collapsedMode={collapsedMode}>
      <SidebarLayoutFrame ref={ref} className={className} {...props}>
        {children}
      </SidebarLayoutFrame>
    </SidebarProvider>
  ),
);
SidebarLayout.displayName = 'SidebarLayout';

// `sticky` (default) pins to the viewport at full height inside SidebarLayout. `fixed` docks to the left edge below the TopBar
// (top-topbar to the bottom). `static` leaves position and height to the parent.
type SidebarPosition = 'sticky' | 'fixed' | 'static';

const sidebarPositionClasses: Record<SidebarPosition, string> = {
  sticky: 'sticky top-0 h-screen',
  fixed: 'fixed bottom-0 left-0 top-topbar z-chrome',
  static: 'relative',
};

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** How the sidebar is positioned. Default `sticky` is unchanged. */
  position?: SidebarPosition;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, position = 'sticky', 'aria-label': ariaLabelProp, ...props }, ref) => {
    const l = useLabels();
    const ariaLabel = ariaLabelProp ?? l.sidebarMainMenu;
    // Works inside SidebarLayout (collapse state) and standalone (always expanded).
    const fallbackId = React.useId();
    const context = React.useContext(SidebarContext);
    const collapsed = context?.collapsed ?? false;
    const sidebarId = context?.sidebarId ?? fallbackId;
    const collapsedMode = context?.collapsedMode ?? 'hide';
    const rail = collapsed && collapsedMode === 'rail';
    const zero = usePreset() === 'zero';
    return (
      <nav
        data-slot="sidebar"
        ref={ref}
        id={sidebarId}
        aria-label={ariaLabel}
        data-state={collapsed ? 'collapsed' : 'expanded'}
        data-rail={rail || undefined}
        hidden={collapsed && !rail}
        className={cn(
          'group/sb flex w-[248px] shrink-0 flex-col gap-micro overflow-y-auto overflow-x-hidden',
          // Theme expression (kette-tokens 5.26.0): sidebar image and edge bevel, none by default
          'bg-[image:var(--image-sidebar)] shadow-[shadow:var(--bevel-sidebar)]',
          zero ? 'p-2 pb-3' : 'py-[10px] pl-[10px] pr-[8px]',
          'data-[rail]:w-sidebar-collapsed data-[rail]:overflow-x-hidden data-[rail]:px-[10px]',
          sidebarPositionClasses[position],
          className,
        )}
        {...props}
      />
    );
  },
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col', className)} {...props} />,
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col gap-micro', className)} {...props} />
  ),
);
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-auto flex flex-col gap-micro pt-3', className)} {...props} />
  ),
);
SidebarFooter.displayName = 'SidebarFooter';

/** The rounded content panel next to the sidebar. */
const SidebarInset = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    const { collapsed, collapsedMode } = useSidebar();
    return (
      <main
        ref={ref}
        className={cn(
          'my-2 mr-2 flex min-w-0 flex-1 flex-col rounded-[12px] border border-solid border-sidebar-border bg-background text-text-default shadow-sm',
          collapsed && collapsedMode === 'hide' && 'ml-2',
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarInset.displayName = 'SidebarInset';

/* -------------------------------------------------------------------------------------------------
 * Shared focus style
 * -----------------------------------------------------------------------------------------------*/

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-background';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, children, ...props }, ref) => {
    const l = useLabels();
    const { collapsed, toggle, sidebarId } = useSidebar();
    return (
      <button
        ref={ref}
        type="button"
        aria-label={collapsed ? l.sidebarExpand : l.sidebarCollapse}
        aria-expanded={!collapsed}
        aria-controls={sidebarId}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) toggle();
        }}
        className={cn(
          'inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          focusRing,
          className,
        )}
        {...props}
      >
        {children ?? <PanelLeft className="h-4 w-4" aria-hidden />}
      </button>
    );
  },
);
SidebarTrigger.displayName = 'SidebarTrigger';

/* -------------------------------------------------------------------------------------------------
 * Workspace switcher
 * -----------------------------------------------------------------------------------------------*/

interface SidebarWorkspaceSwitcherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Short logo text (e.g. "GD") or an element (image). */
  logo: React.ReactNode;
  name: string;
  /** Show the collapse trigger next to the switcher. Default true. */
  showTrigger?: boolean;
  /** Opt-in: renders the trigger as a menu button listing these workspaces. Without it the trigger is a plain button. */
  workspaces?: SidebarWorkspace[];
  activeWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
  /** Personal entry below the workspace list. */
  personal?: { name: string; avatar?: React.ReactNode; onSelect?: () => void };
  /** Adds the Create workspace entry. */
  onCreateWorkspace?: () => void;
  workspacesLabel?: string;
  createLabel?: string;
}

interface SidebarWorkspace {
  id: string;
  name: string;
  logo?: React.ReactNode;
}

const SidebarWorkspaceSwitcher = React.forwardRef<HTMLButtonElement, SidebarWorkspaceSwitcherProps>(
  (
    {
      className,
      logo,
      name,
      showTrigger = true,
      workspaces,
      activeWorkspaceId,
      onWorkspaceChange,
      personal,
      onCreateWorkspace,
      workspacesLabel: workspacesLabelProp,
      createLabel: createLabelProp,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const workspacesLabel = workspacesLabelProp ?? l.workspaces;
    const createLabel = createLabelProp ?? l.createWorkspace;
    const trigger = (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-[8px] p-[6px] text-left transition-colors hover:bg-sidebar-accent',
          focusRing,
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className="grid h-[24px] w-[24px] shrink-0 place-items-center overflow-hidden rounded-logo-tile-24 bg-sidebar-accent-foreground text-logo-tile-24 font-bold text-sidebar-background"
        >
          {logo}
        </span>
        <span className="typography-ui-lg-semibold truncate text-sidebar-accent-foreground group-data-[rail]/sb:sr-only">
          {name}
        </span>
        <ChevronDown
          className="h-[14px] w-[14px] shrink-0 text-sidebar-muted-foreground group-data-[rail]/sb:hidden"
          aria-hidden
        />
      </button>
    );
    return (
      <div className="flex items-center gap-1 group-data-[rail]/sb:flex-col">
        {workspaces ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel>{workspacesLabel}</DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  aria-current={workspace.id === activeWorkspaceId ? 'true' : undefined}
                  onSelect={() => onWorkspaceChange?.(workspace.id)}
                  className={cn(workspace.id === activeWorkspaceId && 'bg-muted')}
                >
                  {workspace.logo && (
                    <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-logo-tile-20 bg-background-brand-bold-default text-logo-tile-20 font-bold leading-none text-text-on-brand">
                      {workspace.logo}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {workspace.id === activeWorkspaceId && <Check className="h-icon-sm w-icon-sm shrink-0" aria-hidden />}
                </DropdownMenuItem>
              ))}
              {personal && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => personal.onSelect?.()}>
                    {personal.avatar}
                    <span className="min-w-0 flex-1 truncate">{personal.name}</span>
                  </DropdownMenuItem>
                </>
              )}
              {onCreateWorkspace && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onCreateWorkspace}>
                    <Plus className="h-icon-sm w-icon-sm shrink-0" aria-hidden />
                    {createLabel}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          trigger
        )}
        {showTrigger && <SidebarTrigger />}
      </div>
    );
  },
);
SidebarWorkspaceSwitcher.displayName = 'SidebarWorkspaceSwitcher';

/* -------------------------------------------------------------------------------------------------
 * Quick actions + search
 * -----------------------------------------------------------------------------------------------*/

const SidebarKbd = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <kbd
    className={cn(
      'ml-auto rounded-[4px] border border-solid border-sidebar-border bg-sidebar-background px-1 font-sans text-micro leading-[16px] text-sidebar-muted-foreground',
      className,
    )}
    {...props}
  />
);

interface SidebarQuickActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  shortcut?: string;
  searchLabel?: string;
  searchShortcut?: string;
  onQuickActions?: () => void;
  onSearch?: () => void;
}

const quickButton =
  'flex h-[30px] items-center gap-2 rounded-[8px] border border-solid border-sidebar-border bg-background px-2 text-ui text-sidebar-accent-foreground shadow-sm transition-colors hover:bg-sidebar-accent';

const SidebarQuickActions = React.forwardRef<HTMLDivElement, SidebarQuickActionsProps>(
  (
    {
      className,
      label: labelProp,
      shortcut = '⌘K',
      searchLabel: searchLabelProp,
      searchShortcut = '/',
      onQuickActions,
      onSearch,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const label = labelProp ?? l.quickActions;
    const searchLabel = searchLabelProp ?? l.sidebarSearch;
    const zero = usePreset() === 'zero';
    return (
    <div
      ref={ref}
      className={cn('my-2 grid grid-cols-[1fr_auto] group-data-[rail]/sb:grid-cols-1', zero ? 'gap-2' : 'gap-[6px]', className)}
      {...props}
    >
      <button type="button" onClick={onQuickActions} className={cn(quickButton, focusRing)} aria-keyshortcuts="Meta+K">
        <Command className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate group-data-[rail]/sb:sr-only">{label}</span>
        <SidebarKbd aria-hidden className="group-data-[rail]/sb:hidden">
          {shortcut}
        </SidebarKbd>
      </button>
      <button
        type="button"
        onClick={onSearch}
        aria-label={searchLabel}
        aria-keyshortcuts={searchShortcut}
        className={cn(quickButton, focusRing)}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <SidebarKbd aria-hidden className="group-data-[rail]/sb:hidden">
          {searchShortcut}
        </SidebarKbd>
      </button>
    </div>
  );
  },
);
SidebarQuickActions.displayName = 'SidebarQuickActions';

/* -------------------------------------------------------------------------------------------------
 * Nav item
 * -----------------------------------------------------------------------------------------------*/

interface SidebarNavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  /** Muted text right after the label (e.g. a long project name). */
  secondary?: React.ReactNode;
  /** Number shown on the right, e.g. open items. */
  count?: number;
  /** Text shown on the right instead of a count, e.g. "aktivieren". */
  trailing?: React.ReactNode;
  active?: boolean;
  /** `location` marks an in-page anchor section instead of the current page. Implies active. */
  current?: 'page' | 'location';
  /** Render the child element (e.g. a Next.js Link) instead of an <a>. */
  asChild?: boolean;
  /** `nav` uses the nav-item / nav-item-current type roles and nav-item padding and gap tokens; `default` is unchanged. */
  variant?: 'default' | 'nav';
  /** Dims the item and removes it from the tab order. Rendered as `aria-disabled`. */
  disabled?: boolean;
  /** Small status dot on the right (e.g. unread activity). Pair with a visually hidden label if it carries meaning. */
  dot?: boolean;
  /** Integration status dot on the right (6px status-dot size): `on` = connected (success), `off` = not connected (subtle). Announced as text for screen readers. */
  statusDot?: 'on' | 'off';
  /** Lock icon on the right for a locked or read-only entry. Announced as text for screen readers. */
  locked?: boolean;
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  (
    {
      className,
      icon,
      label,
      secondary,
      count,
      trailing,
      active: activeProp = false,
      current,
      asChild = false,
      variant = 'default',
      disabled = false,
      dot = false,
      statusDot,
      locked = false,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const active = activeProp || current !== undefined;
    const nav = variant === 'nav';
    const zero = usePreset() === 'zero';
    // Only the first right-aligned extra pushes itself to the end.
    const pushRight = count === undefined && trailing === undefined && !dot;
    const Comp = asChild ? Slot : 'a';
    const content = (
      <>
        {icon && (
          <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4" aria-hidden>
            {icon}
          </span>
        )}
        <span className={cn('truncate', secondary && 'shrink-0', 'group-data-[rail]/sb:sr-only')}>{label}</span>
        {secondary && (
          <span className="min-w-0 truncate font-normal text-sidebar-muted-foreground group-data-[rail]/sb:hidden">
            {secondary}
          </span>
        )}
        {count !== undefined && (
          <span
            className={cn(
              'ml-auto tabular-nums text-sidebar-muted-foreground group-data-[rail]/sb:hidden',
              nav ? 'typography-ui-sm' : 'text-[12px] font-normal',
            )}
          >
            {count}
          </span>
        )}
        {trailing !== undefined && count === undefined && (
          <span className="ml-auto text-[12px] font-normal text-sidebar-muted-foreground group-data-[rail]/sb:hidden">
            {trailing}
          </span>
        )}
        {dot && (
          <span
            aria-hidden
            className="ml-auto h-2 w-2 shrink-0 rounded-full bg-background-brand-bold-default group-data-[rail]/sb:hidden"
          />
        )}
        {locked && (
          <span
            data-locked=""
            className={cn('flex shrink-0 text-icon-subtle group-data-[rail]/sb:hidden', pushRight && 'ml-auto')}
          >
            <Lock aria-hidden className="h-icon-2xs w-icon-2xs" />
            <span className="sr-only">{l.locked}</span>
          </span>
        )}
        {/* Token gap: size-status-dot (6px) has a CSS variable in 4.17.0 but no Tailwind h-/w- utility in tailwind.theme.cjs, so the variable is referenced directly. */}
        {statusDot && (
          <span
            data-status-dot={statusDot}
            className={cn('flex shrink-0 group-data-[rail]/sb:hidden', pushRight && !locked && 'ml-auto', locked && 'ml-2')}
          >
            <span
              aria-hidden
              className={cn(
                'h-[var(--size-status-dot)] w-[var(--size-status-dot)] rounded-full',
                statusDot === 'on' ? 'bg-status-success-dot' : 'bg-text-subtlest',
              )}
            />
            <span className="sr-only">{statusDot === 'on' ? l.statusActive : l.statusInactive}</span>
          </span>
        )}
      </>
    );
    return (
      <Comp
        ref={ref}
        aria-current={current ?? (active ? 'page' : undefined)}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : props.tabIndex}
        onClick={
          disabled
            ? (event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
              }
            : onClick
        }
        data-active={active || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          'flex h-[30px] items-center text-sidebar-foreground no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'data-[active]:bg-sidebar-accent data-[active]:text-sidebar-accent-foreground',
          // Theme expression (kette-tokens 5.26.0): list hover image and selection indicator (edge, ring), nothing by default
          '[&:not([data-active])]:hover:bg-[image:var(--image-sidebar-item-hover)] data-[active]:shadow-[shadow:inset_var(--indicator-selection-edge)_0_0_var(--indicator-selection-edge-color),inset_0_0_0_var(--indicator-selection-ring)_var(--indicator-selection-ring-color)]',
          'data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled',
          'group-data-[rail]/sb:justify-center group-data-[rail]/sb:px-0',
          zero ? 'rounded-item' : 'rounded-[7px]',
          nav
            ? 'typography-nav-item gap-[var(--size-nav-item-gap)] px-[var(--size-nav-item-padding-x)] data-[active]:typography-nav-item-current'
            : 'gap-2 px-2 text-[14px] data-[active]:font-medium',
          focusRing,
          className,
        )}
        {...props}
      >
        {asChild ? children : content}
      </Comp>
    );
  },
);
SidebarNavItem.displayName = 'SidebarNavItem';

/* -------------------------------------------------------------------------------------------------
 * Section (collapsible group) + tree
 * -----------------------------------------------------------------------------------------------*/

interface SidebarSectionProps extends Omit<React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>, 'title'> {
  label: React.ReactNode;
  /** Optional action rendered next to the label, e.g. an "add" icon button. */
  action?: React.ReactNode;
}

const SidebarSection = React.forwardRef<React.ElementRef<typeof CollapsiblePrimitive.Root>, SidebarSectionProps>(
  ({ className, label, action, defaultOpen = true, children, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    return (
    <CollapsiblePrimitive.Root
      ref={ref}
      defaultOpen={defaultOpen}
      className={cn('group/section flex flex-col gap-micro', zero ? 'mt-3' : 'mt-[14px]', className)}
      {...props}
    >
      <div className={cn('flex items-center group-data-[rail]/sb:hidden', zero ? 'min-h-target px-2' : 'px-[6px]')}>
        <CollapsiblePrimitive.Trigger
          className={cn(
            'typography-ui-sm flex min-h-target items-center gap-1 pr-1 text-sidebar-muted-foreground transition-colors hover:text-sidebar-accent-foreground',
            zero ? 'rounded-item' : 'rounded-[5px]',
            focusRing,
          )}
        >
          <ChevronDown
            className="h-[14px] w-[14px] transition-transform group-data-[state=closed]/section:-rotate-90"
            aria-hidden
          />
          {label}
        </CollapsiblePrimitive.Trigger>
        {action && <span className="ml-auto flex">{action}</span>}
      </div>
      <CollapsiblePrimitive.Content className="flex flex-col gap-micro">{children}</CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
    );
  },
);
SidebarSection.displayName = 'SidebarSection';

/** Small icon button for a section action (e.g. "+"). Needs an aria-label. */
const SidebarSectionAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:h-[14px] [&>svg]:w-[14px]',
        focusRing,
        className,
      )}
      {...props}
    />
  ),
);
SidebarSectionAction.displayName = 'SidebarSectionAction';

interface SidebarTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nesting level. `1` indents a tree inside another tree by 15px more. Default 0 is unchanged. */
  level?: 0 | 1;
}

/** Indented children with a 1px guide line on the left. */
const SidebarTree = React.forwardRef<HTMLDivElement, SidebarTreeProps>(
  ({ className, level = 0, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    return (
    <div
      ref={ref}
      role="group"
      data-level={level || undefined}
      className={cn(
        'flex flex-col border-0 border-l border-solid border-sidebar-border pl-2 group-data-[rail]/sb:hidden',
        zero ? 'ml-4 gap-micro' : 'ml-[15px] gap-px',
        level === 1 && (zero ? 'ml-8' : 'ml-[30px]'),
        className,
      )}
      {...props}
    />
    );
  },
);
SidebarTree.displayName = 'SidebarTree';

/* -------------------------------------------------------------------------------------------------
 * Object icon (product) + swatch (project)
 * -----------------------------------------------------------------------------------------------*/

type SidebarProduct = 'workstream' | 'backoffice' | 'coldcall' | 'vacancy' | 'jobsearch';

// Full class strings so Tailwind's content scan picks every product token up.
const productClasses: Record<SidebarProduct, string> = {
  workstream: 'bg-product-workstream-default text-product-workstream-on',
  backoffice: 'bg-product-backoffice-default text-product-backoffice-on',
  coldcall: 'bg-product-coldcall-default text-product-coldcall-on',
  vacancy: 'bg-product-vacancy-default text-product-vacancy-on',
  jobsearch: 'bg-product-jobsearch-default text-product-jobsearch-on',
};

interface SidebarObjectIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Product color. Omit and pass className for other objects (e.g. Contacts). */
  product?: SidebarProduct;
  /** Uses the page's product context (`<html data-product="…">`). */
  contextual?: boolean;
}

const SidebarObjectIcon = React.forwardRef<HTMLSpanElement, SidebarObjectIconProps>(
  ({ className, product, contextual = false, ...props }, ref) => {
    const zero = usePreset() === 'zero';
    return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        'grid h-[18px] w-[18px] shrink-0 place-items-center [&>svg]:h-3 [&>svg]:w-3 [&>svg]:stroke-[2.25]',
        zero ? 'rounded-tight' : 'rounded-[5px]',
        product && productClasses[product],
        contextual && 'bg-product-accent-default text-product-accent-on',
        className,
      )}
      {...props}
    />
    );
  },
);
SidebarObjectIcon.displayName = 'SidebarObjectIcon';

interface SidebarSwatchProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `sm` is the 8px square with hairline radius used inline in the top bar. Default 10px. */
  size?: 'default' | 'sm';
  /**
   * User-defined project color (data, not design). Passed as a CSS color value at runtime,
   * e.g. from the project record; the component itself defines no color.
   */
  color: string;
}

/** 10px colored square for user-colored records such as projects. */
const SidebarSwatch = ({ className, color, size = 'default', style, ...props }: SidebarSwatchProps) => (
  <span
    aria-hidden
    className={cn(
      'block shrink-0',
      size === 'sm' ? 'h-2 w-2 rounded-hairline' : 'mx-1 h-swatch-sm w-swatch-sm rounded-[3px]',
      className,
    )}
    style={{ backgroundColor: color, ...style }}
    {...props}
  />
);

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarKbd,
  SidebarLayout,
  SidebarProvider,
  SidebarNavItem,
  SidebarObjectIcon,
  SidebarQuickActions,
  SidebarSection,
  SidebarSectionAction,
  SidebarSwatch,
  SidebarTree,
  SidebarTrigger,
  SidebarWorkspaceSwitcher,
  useSidebar,
  type SidebarCollapsedMode,
  type SidebarLayoutProps,
  type SidebarProviderProps,
  type SidebarPosition,
  type SidebarProps,
  type SidebarTreeProps,
  type SidebarWorkspace,
  type SidebarNavItemProps,
  type SidebarObjectIconProps,
  type SidebarProduct,
  type SidebarQuickActionsProps,
  type SidebarSectionProps,
  type SidebarSwatchProps,
  type SidebarWorkspaceSwitcherProps,
};
