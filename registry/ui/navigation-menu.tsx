'use client';

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import { ComponentPropsWithoutRef, ElementRef, forwardRef, MutableRefObject, ReactNode, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { menuItemFocusVisible } from '@/lib/recipes';
import { cn } from '@/lib/utils';

interface NavigationMenuProps extends ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> {
  // Minimum distance in px between the open panel and the viewport edges. The panel is shifted sideways to keep it inside.
  collisionPadding?: number;
}

const NavigationMenu = forwardRef<ElementRef<typeof NavigationMenuPrimitive.Root>, NavigationMenuProps>(
  ({ className, children, collisionPadding, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn('relative z-sticky flex max-w-max flex-1 items-center justify-center', className)}
      {...props}
    >
      {children}
      <NavigationMenuViewport collisionPadding={collisionPadding} />
    </NavigationMenuPrimitive.Root>
  ),
);
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.List>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-control-md w-max items-center justify-center rounded-control bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default disabled:pointer-events-none disabled:opacity-disabled data-[active]:bg-muted data-[state=open]:bg-muted',
);

interface NavigationMenuTriggerProps extends ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger> {
  // Leading icon before the label. In a top bar end slot with `data-topbar-action` it is all that stays below sm (the label is the tooltip).
  icon?: ReactNode;
}

const NavigationMenuTrigger = forwardRef<ElementRef<typeof NavigationMenuPrimitive.Trigger>, NavigationMenuTriggerProps>(({ className, children, type = 'button', icon, title, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    type={type}
    // In a top bar end slot (`data-topbar-action`) the label is hidden below sm: its text is the tooltip.
    title={title ?? ((props as Record<string, unknown>)['data-topbar-action'] !== undefined && typeof children === 'string' ? children : undefined)}
    className={cn(navigationMenuTriggerStyle(), 'group', className)}
    {...props}
  >
    {icon && (
      <span aria-hidden="true" className="mr-2 inline-flex h-icon-md w-icon-md shrink-0 items-center justify-center group-data-[topbar-action]:max-sm:mr-0">
        {icon}
      </span>
    )}
    {children}{' '}
    <ChevronDown
      data-chevron=""
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ',
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

interface NavigationMenuViewportProps extends ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport> {
  collisionPadding?: number;
}

const DEFAULT_COLLISION_PADDING = 16;
// Gap in px between the root and the panel (the mt-[6px] of the viewport). The indicator arrow fills it.
const PANEL_OFFSET = 6;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// The panel renders in a portal on the dropdown layer, so the page chrome stacking context (header, topbar) can no longer clip or under-cover it (a cookie banner, z-banner, stays below). The portal anchor is `fixed` and placed from the root rect: below the root, shifted sideways to stay inside the viewport, and capped to the height that is left below the root. Radix keeps the content in the viewport element, so its focus and keyboard handling is unchanged.
const NavigationMenuViewport = forwardRef<ElementRef<typeof NavigationMenuPrimitive.Viewport>, NavigationMenuViewportProps>(
  ({ className, collisionPadding = DEFAULT_COLLISION_PADDING, ...props }, ref) => {
    // State instead of refs: the panel only exists while a menu is open, so the effects must re-run when it mounts.
    const [origin, setOrigin] = useState<HTMLSpanElement | null>(null);
    const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
    const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const root = origin?.parentElement ?? null;
    // Stable callback ref: an inline function would detach and attach on every render and loop through the state setter.
    const setViewportRef = useCallback(
      (node: HTMLDivElement | null) => {
        setViewport(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    const place = useCallback(() => {
      if (!anchor || !root) return;
      const rootRect = root.getBoundingClientRect();
      const availableWidth = document.documentElement.clientWidth;
      const availableHeight = document.documentElement.clientHeight;
      const width = viewport?.offsetWidth ?? 0;
      let shift = 0;
      if (width > 0) {
        // Radix anchors the panel at the left edge of the root. Shift it left when it would run past the right viewport edge, and right when it would run past the left edge.
        const overflow = rootRect.left + width - (availableWidth - collisionPadding);
        if (overflow > 0) shift = -overflow;
        if (rootRect.left + shift < collisionPadding) shift = collisionPadding - rootRect.left;
      }
      anchor.style.left = `${rootRect.left + shift}px`;
      anchor.style.top = `${rootRect.bottom}px`;
      anchor.style.setProperty('--navigation-menu-available-height', `${Math.max(availableHeight - rootRect.bottom - PANEL_OFFSET - collisionPadding, 0)}px`);
    }, [anchor, root, viewport, collisionPadding]);

    // Runs on first open (the viewport element appears), on content size changes (observer), on window resize and on scroll of any ancestor.
    useIsomorphicLayoutEffect(() => {
      place();
      if (!anchor || !root) return undefined;
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
      observer?.observe(root);
      if (viewport) observer?.observe(viewport);
      return () => {
        window.removeEventListener('resize', place);
        window.removeEventListener('scroll', place, true);
        observer?.disconnect();
      };
    }, [place, anchor, root, viewport]);

    const panel = (
      <div ref={setAnchor} data-slot="navigation-menu-viewport-anchor" className={cn('fixed z-dropdown flex justify-center')}>
        <NavigationMenuPrimitive.Viewport
          className={cn(
            'origin-top-center relative mt-[6px] h-[var(--radix-navigation-menu-viewport-height)] max-h-[var(--navigation-menu-available-height)] w-full max-w-[calc(100vw-theme(spacing.8))] overflow-y-auto overflow-x-hidden overscroll-contain rounded-popover border border-solid border-hairline bg-popover text-popover-foreground shadow-popover duration-150 [scroll-padding-block:theme(spacing.2)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-[0.98] md:w-[var(--radix-navigation-menu-viewport-width)]',
            className,
          )}
          ref={setViewportRef}
          {...props}
        />
      </div>
    );
    return (
      <>
        <span ref={setOrigin} hidden aria-hidden="true" data-slot="navigation-menu-viewport-origin" />
        {mounted && createPortal(panel, document.body)}
      </>
    );
  },
);
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      'top-full z-raised flex h-[6px] items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in',
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

const MenuListItem = forwardRef<ElementRef<'a'>, ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block',
              'select-none',
              'space-y-1',
              'rounded-item',
              'p-3',
              'leading-4',
              'no-underline',
              'outline-none',
              'transition-colors',
              'hover:bg-muted',
              'focus:bg-muted',
              ...menuItemFocusVisible,
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-4 text-text-subtle">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  },
);
MenuListItem.displayName = 'MenuListItem';

export {
  MenuListItem,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  type NavigationMenuTriggerProps,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
