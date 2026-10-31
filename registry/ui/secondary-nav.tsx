'use client';

import { forwardRef, useEffect, useRef, useState, type AnchorHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';

import { focusRing, transitionBase } from '@/lib/recipes';
import { rowScrollTarget } from '@/lib/row-scroll';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useLabels, usePreset } from '@/components/ui/labels-context';

export interface SecondaryNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  // Count shown as text at the right, e.g. open items.
  count?: number;
  // Second badge after the count, e.g. a small Chip with a status (`Draft`, `Error`). Pass visible text, because colour alone is not enough. Hidden in the collapsed rail like the count.
  badge?: ReactNode;
  // Renders a link instead of a button.
  href?: string;
  disabled?: boolean;
}

export interface SecondaryNavSection {
  id: string;
  // Section header. Omit for an unlabelled group.
  label?: string;
  items: SecondaryNavItem[];
}

// Props to spread on the link element returned by `renderLink` (for example a Next.js Link).
export type SecondaryNavLinkProps = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'onClick' | 'title' | 'children'> & {
  href: string;
  'aria-current'?: 'page';
  'aria-disabled'?: true;
};

// vertical: column (default). horizontal: scrollable single row. responsive: row until the nearest container (an ancestor with the `@container` class) is at the `@area` container screen (860px) wide, then the column.
export type SecondaryNavOrientation = 'vertical' | 'horizontal' | 'responsive';

export interface SecondaryNavProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  'aria-label': string;
  sections: SecondaryNavSection[];
  // Selected item id, controlled.
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  // sm uses the nav item height, md the small control height.
  size?: 'sm' | 'md';
  // Slot below the list, pinned to the bottom (e.g. StorageMeter).
  footer?: ReactNode;
  // Custom link element for items with `href`, so client routing keeps working: renderLink={(item, props) => <Link {...props} />}.
  renderLink?: (item: SecondaryNavItem, props: SecondaryNavLinkProps) => ReactElement;
  // Icon-only rail. Labels stay available to screen readers and as a title, counts and section headers are hidden. Give every item an icon.
  collapsed?: boolean;
  // Layout. `responsive` measures the nearest ancestor with the `@container` class (the page area, not the viewport), as the zero prototype does. In the row, the footer is hidden and `collapsed` is ignored.
  orientation?: SecondaryNavOrientation;
}

const itemSize = { sm: 'h-nav-item', md: 'h-control-sm' } as const;

// Pick a class string by orientation. The strings stay literal so Tailwind sees every class.
const pick = (orientation: SecondaryNavOrientation, vertical: string, horizontal: string, responsive: string) =>
  orientation === 'vertical' ? vertical : orientation === 'horizontal' ? horizontal : responsive;

// Scroller of the horizontal row: one line, padding inside the scroller so the focus ring (2px ring + 2px offset) is never clipped, scroll padding the width of the edge fade so a focused item never sits under it, hidden scrollbar (the fade and the cut-off item show more content).
const rowScroller =
  'relative flex flex-row items-center gap-1 overflow-x-auto px-4 py-2 scroll-px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  // Fade only at an edge that has more content. The width is the space-8 token (32px, as in the zero prototype). Switched off for reduced transparency and more contrast.
  '[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)] ' +
  'data-[fade-start]:[--fade-start:var(--space-8)] data-[fade-end]:[--fade-end:var(--space-8)] ' +
  'contrast-more:[mask-image:none] [@media(prefers-reduced-transparency:reduce)]:[mask-image:none]';

// Row items keep the 30px visual height. Under a coarse pointer (touch) a 44px hit area (touch-target-lg token, WCAG 2.5.5) is added by a centred pseudo element that only grows up and down, so neighbours never overlap. From the `@area` screen the responsive nav is a column again and the hit area is the item itself.
const rowHitArea =
  'relative [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:inset-x-0 [@media(pointer:coarse)]:after:top-1/2 [@media(pointer:coarse)]:after:h-[var(--size-touch-target-lg)] [@media(pointer:coarse)]:after:-translate-y-1/2';
const rowHitAreaResponsive = cn(rowHitArea, '@area:after:hidden');

const listItems = (root: HTMLElement | null) =>
  root ? Array.from(root.querySelectorAll<HTMLElement>('a[href], button')).filter((el) => !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true') : [];

// Left edge of an item inside the scroller, measured with bounding boxes (rounded like `offsetLeft`), not `offsetLeft` itself, which depends on the nearest positioned ancestor.
const leftIn = (el: HTMLElement, item: HTMLElement) => Math.round(item.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - el.clientLeft);

// The first and last entry of the row scroll fully to the start and the end, so the edge fade on that side goes.
const edgeOf = (el: HTMLElement, item: HTMLElement): 'start' | 'end' | undefined => {
  const all = Array.from(el.querySelectorAll<HTMLElement>('a[href], button'));
  return item === all[0] ? 'start' : item === all[all.length - 1] ? 'end' : undefined;
};

// The element that scrolls the column: the nearest ancestor of the item that scrolls vertically, up to the layout (or the page, which is never moved). Usually the nav itself (`overflow-y-auto` on it) or a wrapper the app gives a height.
const columnScroller = (item: HTMLElement): HTMLElement | null => {
  for (let el = item.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const overflowY = getComputedStyle(el).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return el;
    if (el.getAttribute('data-slot') === 'secondary-nav-layout') break;
  }
  return null;
};

// Scroll an item of the column into its scroller (the first and last entry fully to the start and the end). `centre` puts it in the middle (on load), otherwise the smallest move that shows it whole (arrow keys). Only the scroller moves, never the page.
const revealInColumn = (item: HTMLElement, mode: 'minimal' | 'centre', animate = false, edge?: 'start' | 'end') => {
  const el = columnScroller(item);
  if (!el) return;
  const box = el.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  const top = Math.round(rect.top - box.top + el.scrollTop - el.clientTop);
  const bottom = top + item.offsetHeight;
  let target = el.scrollTop;
  // The first and last entry go fully to the start and the end of the column, so a section label above the first one is shown too.
  if (edge) target = edge === 'start' ? 0 : el.scrollHeight;
  else if (mode === 'centre') {
    if (top >= el.scrollTop && bottom <= el.scrollTop + el.clientHeight) return;
    target = top + item.offsetHeight / 2 - el.clientHeight / 2;
  } else if (top < el.scrollTop) target = top;
  else if (bottom > el.scrollTop + el.clientHeight) target = bottom - el.clientHeight;
  target = Math.min(el.scrollHeight - el.clientHeight, Math.max(0, Math.round(target)));
  if (target === el.scrollTop) return;
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && !reduced && typeof el.scrollTo === 'function') el.scrollTo({ top: target, behavior: 'smooth' });
  else el.scrollTop = target;
};

// Navigation inside a page (settings, file spaces). A nav landmark with aria-current, not a tablist. Vertical column by default, a scrollable single row with `horizontal`, and `responsive` switches from the row to the column when the nearest container is 860px wide or more.
const SecondaryNav = forwardRef<HTMLElement, SecondaryNavProps>(
  ({ className, sections, value, defaultValue, onValueChange, size = 'sm', footer, renderLink, collapsed: collapsedProp = false, orientation = 'vertical', onKeyDown, ...props }, ref) => {
    const [inner, setInner] = useState(defaultValue);
    // Zero: 8px item padding and gap, 2px list gap, subtle icons, 11px group label.
    const zero = usePreset() === 'zero';
    const current = value ?? inner;
    const o = orientation;
    // The icon rail only exists in the vertical column.
    const collapsed = collapsedProp && o === 'vertical';
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [fade, setFade] = useState({ start: false, end: false });
    const select = (id: string) => {
      if (value === undefined) setInner(id);
      onValueChange?.(id);
    };

    // Edge fades only while the row overflows and only on the side that has more content.
    useEffect(() => {
      const el = scrollerRef.current;
      if (!el || o === 'vertical') return undefined;
      const measure = () => {
        const overflow = el.scrollWidth - el.clientWidth > 1;
        const start = overflow && el.scrollLeft > 1;
        const end = overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        setFade((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
      };
      measure();
      el.addEventListener('scroll', measure, { passive: true });
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
      observer?.observe(el);
      return () => {
        el.removeEventListener('scroll', measure);
        observer?.disconnect();
      };
    }, [o, sections]);

    // Scroll the row so an item is fully visible and clear of the edge fade. Only the scroller moves, never the page.
    const reveal = (item: HTMLElement) => {
      const el = scrollerRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;
      const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
      const target = rowScrollTarget(el, { left: leftIn(el, item), width: item.offsetWidth, edge: edgeOf(el, item) }, pad, false);
      if (target !== el.scrollLeft) el.scrollLeft = target;
    };

    // Centre the current item in the row. Only the scroller moves, never the page (no scrollIntoView, which would scroll every ancestor). On mount it jumps, so the page loads with the section in place. When the current item changes later it glides, unless the user prefers reduced motion. An item near an end cannot be centred and stops at the end.
    const centre = (item: HTMLElement, animate: boolean) => {
      const el = scrollerRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;
      const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
      const target = rowScrollTarget(el, { left: leftIn(el, item), width: item.offsetWidth, edge: edgeOf(el, item) }, pad, true);
      if (target === el.scrollLeft) return;
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (animate && !reduced && typeof el.scrollTo === 'function') el.scrollTo({ left: target, behavior: 'smooth' });
      else el.scrollLeft = target;
    };
    // Item ids as one string: the centring effect runs when the items change, not on every render with a new `sections` array (which would pull the row back while the user scrolls it).
    const itemKey = sections.flatMap((section) => section.items.map((item) => item.id)).join('|');
    const mounted = useRef(false);
    // Set once the user scrolls or presses in the row, so a late re-centre (web fonts) never fights them.
    const touched = useRef(false);

    // Bring the current item to the middle of the scroller (on mount and when it changes).
    useEffect(() => {
      const el = scrollerRef.current;
      if (!el || o === 'vertical') return;
      const item = el.querySelector<HTMLElement>('[aria-current="page"]');
      if (item) centre(item, mounted.current);
      mounted.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, o, itemKey]);

    // Column: bring the current item into view when it sits outside the visible part of a scrolling column (on load and when it changes). Centred, instant on load, gliding later unless reduced motion. The page never moves. The layout is not final on the first pass (container query, heights of the page frame, web fonts), so it is placed again whenever the nav or the layout around it changes size and once fonts are ready, until the user has moved the column.
    const columnMounted = useRef(false);
    useEffect(() => {
      const el = scrollerRef.current;
      if (!el) return undefined;
      const place = (animate: boolean) => {
        const column = o === 'vertical' || (o === 'responsive' && getComputedStyle(el).flexDirection === 'column');
        const item = el.querySelector<HTMLElement>('[aria-current="page"]');
        if (column && item) revealInColumn(item, 'centre', animate);
      };
      place(columnMounted.current);
      columnMounted.current = true;
      let active = true;
      const settle = () => {
        if (active && !touched.current) place(false);
      };
      if (typeof document !== 'undefined' && document.fonts?.ready) document.fonts.ready.then(settle);
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(settle);
      [el.parentElement, el.closest('[data-slot="secondary-nav-layout"]')].forEach((target) => target && observer?.observe(target));
      return () => {
        active = false;
        observer?.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, o, itemKey]);

    // Web fonts, a badge or a count that arrives late change the item widths after the first paint, so the centre is measured again once fonts are ready and whenever an item changes size (unless the user already moved the row).
    useEffect(() => {
      const el = scrollerRef.current;
      if (!el || o === 'vertical') return undefined;
      let active = true;
      const settle = () => {
        if (!active || touched.current) return;
        const item = el.querySelector<HTMLElement>('[aria-current="page"]');
        if (item) centre(item, false);
      };
      if (typeof document !== 'undefined' && document.fonts?.ready) document.fonts.ready.then(settle);
      const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(settle);
      el.querySelectorAll('a[href], button').forEach((item) => sizes?.observe(item));
      return () => {
        active = false;
        sizes?.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [o, itemKey]);

    // Arrow keys, Home and End move focus between the enabled items. Left and Right in the row, Up and Down where the list renders as a column (`responsive` from the `@area` screen). Tab order is unchanged. The focused item is revealed inside the scroller, so a partly hidden item is never left under the edge fade.
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      touched.current = true;
      if (event.defaultPrevented || o === 'vertical' || event.altKey || event.ctrlKey || event.metaKey) return;
      const scroller = scrollerRef.current;
      const items = listItems(scroller);
      const index = items.indexOf(event.target as HTMLElement);
      if (index < 0 || !scroller) return;
      const style = getComputedStyle(scroller);
      const column = o === 'responsive' && style.flexDirection === 'column';
      const rtl = style.direction === 'rtl';
      const forward = column ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = column ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
      let next = -1;
      if (event.key === forward) next = index + 1;
      else if (event.key === backward) next = index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else return;
      event.preventDefault();
      const target = items[Math.min(items.length - 1, Math.max(0, next))];
      if (!target) return;
      target.focus({ preventScroll: true });
      if (column) revealInColumn(target, 'minimal', false, edgeOf(scroller, target));
      else reveal(target);
    };

    return (
      <nav
        ref={ref}
        data-collapsed={collapsed || undefined}
        data-orientation={o}
        onKeyDown={handleKeyDown}
        className={cn(
          'typography-ui flex max-w-full flex-col text-foreground',
          pick(o, cn('justify-between gap-4', collapsed ? 'w-sidebar-collapsed' : 'w-inner-column'), 'w-full', 'w-full @area:w-inner-column @area:justify-between @area:gap-4'),
          className,
        )}
        {...props}
      >
        <div
          ref={scrollerRef}
          onWheel={() => {
            touched.current = true;
          }}
          onTouchStart={() => {
            touched.current = true;
          }}
          onPointerDown={() => {
            touched.current = true;
          }}
          data-fade-start={fade.start || undefined}
          data-fade-end={fade.end || undefined}
          className={pick(
            o,
            'flex flex-col gap-4',
            rowScroller,
            cn(rowScroller, '@area:flex-col @area:items-stretch @area:gap-4 @area:overflow-visible @area:p-0 @area:[mask-image:none]'),
          )}
        >
          {sections.map((section) => (
            <div
              key={section.id}
              className={pick(
                o,
                'flex flex-col gap-1',
                'ml-2 flex shrink-0 flex-row items-center gap-2 border-l border-border pl-3 first:ml-0 first:border-l-0 first:pl-0',
                'ml-2 flex shrink-0 flex-row items-center gap-2 border-l border-border pl-3 first:ml-0 first:border-l-0 first:pl-0 @area:ml-0 @area:shrink @area:flex-col @area:items-stretch @area:gap-1 @area:border-l-0 @area:pl-0',
              )}
            >
              {section.label && !collapsed ? (
                <p
                  className={cn(
                    'text-muted-foreground',
                    zero ? 'typography-kpi-label' : 'typography-text-extra-small',
                    pick(o, zero ? 'px-2' : 'px-3', 'shrink-0 whitespace-nowrap', cn('shrink-0 whitespace-nowrap', zero ? '@area:px-2' : '@area:px-3')),
                  )}
                >
                  {section.label}
                </p>
              ) : null}
              <ul
                className={cn(
                  'm-0 flex list-none p-0',
                  pick(o, cn('flex-col', zero ? 'gap-micro' : 'gap-1'), 'flex-row items-center gap-1', cn('flex-row items-center gap-1', zero ? '@area:flex-col @area:items-stretch @area:gap-micro' : '@area:flex-col @area:items-stretch')),
                )}
              >
                {section.items.map((item) => {
                  const selected = current === item.id;
                  const cls = cn(
                    'typography-ui flex items-center rounded-item text-left',
                    pick(o, 'w-full', cn('shrink-0 whitespace-nowrap', rowHitArea), cn('shrink-0 whitespace-nowrap @area:w-full', rowHitAreaResponsive)),
                    zero ? 'gap-2 px-2' : 'gap-3 px-3',
                    collapsed && 'justify-center px-0',
                    itemSize[size],
                    selected ? 'bg-muted font-medium text-foreground' : cn(zero ? 'text-sidebar-foreground' : 'text-muted-foreground', 'hover:bg-muted hover:text-foreground'),
                    item.disabled && 'pointer-events-none opacity-disabled',
                    transitionBase,
                    focusRing,
                  );
                  const body = (
                    <>
                      {item.icon ? (
                        <span aria-hidden="true" className={cn('flex h-icon-nav w-icon-nav shrink-0 items-center justify-center [&>svg]:h-icon-nav [&>svg]:w-icon-nav', zero && !selected && 'text-icon-subtle')}>
                          {item.icon}
                        </span>
                      ) : null}
                      <span className={cn(pick(o, 'min-w-0 flex-1 truncate', 'whitespace-nowrap', 'whitespace-nowrap @area:min-w-0 @area:flex-1 @area:truncate'), collapsed && 'sr-only')}>{item.label}</span>
                      {item.count != null && !collapsed ? <span className="typography-text-extra-small tabular-nums text-muted-foreground">{item.count}</span> : null}
                      {item.badge != null && !collapsed ? (
                        <span data-nav-badge="" className="flex shrink-0 items-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  );
                  return (
                    <li key={item.id} className={pick(o, '', 'shrink-0', 'shrink-0 @area:shrink') || undefined}>
                      {item.href && renderLink ? (
                        renderLink(item, {
                          href: item.href,
                          className: cls,
                          title: collapsed ? item.label : undefined,
                          'aria-current': selected ? 'page' : undefined,
                          'aria-disabled': item.disabled ? true : undefined,
                          onClick: () => select(item.id),
                          children: body,
                        })
                      ) : item.href ? (
                        <a
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          aria-current={selected ? 'page' : undefined}
                          aria-disabled={item.disabled || undefined}
                          onClick={() => select(item.id)}
                          className={cls}
                        >
                          {body}
                        </a>
                      ) : (
                        <button type="button" title={collapsed ? item.label : undefined} aria-current={selected ? 'page' : undefined} disabled={item.disabled} onClick={() => select(item.id)} className={cls}>
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {footer && !collapsed && o !== 'horizontal' ? <div className={pick(o, 'px-3', '', 'hidden px-3 @area:block')}>{footer}</div> : null}
      </nav>
    );
  },
);
SecondaryNav.displayName = 'SecondaryNav';

export interface SecondaryNavLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  // The SecondaryNav (use `orientation="responsive"`). It is placed above the content in a narrow area and as a left column from the `@area` screen.
  nav: ReactNode;
  children: ReactNode;
  // Makes this wrapper the size container the nav measures. Turn off when an ancestor with the `@container` class already is the page area.
  container?: boolean;
  // Takes the height the parent offers: the layout, its row and the content slot get `h-full min-h-0 flex-1`, so a scrolling content area works without `[&>div]:h-full` overrides. The parent needs a definite height or to be a flex column.
  fill?: boolean;
  // Area title in the column header above the nav. Shown from the `@area` screen only: in the narrow row the nav carries navigation and nothing else, so the page header names the area. Pass visible text (a heading element if the page outline needs one).
  title?: ReactNode;
  // Actions of the area (for example an icon button): right of the title in the column header from the `@area` screen, and below it a fixed field at the end of the narrow row, outside the scrolling nav, so the action is always reachable. Use icon buttons with an `aria-label`; under a coarse pointer their hit area is 44px.
  actions?: ReactNode;
  // Extra classes for the nav slot and the content slot. The slot is the outer element: the title/actions grid is an inner element, so `flex flex-col` or similar on `navClassName` cannot replace it.
  navClassName?: string;
  contentClassName?: string;
}

// Page frame for a SecondaryNav: nav above the content in a narrow area (hairline below), left column with a hairline on its end from the `@area` screen. Replaces the `flex-col @area:flex-row` plus width and border classes apps wrote around the nav.
const SecondaryNavLayout = forwardRef<HTMLDivElement, SecondaryNavLayoutProps>(({ className, nav, children, container = true, fill = false, title, actions, navClassName, contentClassName, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const header = title != null || actions != null;
  return (
  <div
    ref={ref}
    data-slot="secondary-nav-layout"
    data-fill={fill || undefined}
    className={cn(container && '@container', 'w-full', fill && 'flex h-full min-h-0 flex-1 flex-col', className)}
    {...props}
  >
    <div className={cn('flex flex-col @area:flex-row', fill && 'h-full min-h-0 flex-1')}>
      <div
        data-slot="secondary-nav-slot"
        className={cn('shrink-0 border-b border-solid border-border @area:border-b-0 @area:border-r', header && '@area:flex @area:min-h-0 @area:flex-col', navClassName)}
      >
        {/* With a header the grid lives on an inner element, so an app `navClassName` such as `flex flex-col` on the slot can never replace it in class merging. Below `@area`: the actions (fixed field at the start, outside the scrolling nav) and the nav share one row. From `@area`: title and actions form the header row above the nav, and the second row takes the height left over (`minmax(0,1fr)`), so a scrolling column nav fills the column. Stretching, no centring in the column. One DOM node each, in visual order (title, actions, nav), so the tab order always follows the picture. */}
        {header ? (
          <div data-slot="secondary-nav-grid" className="grid grid-cols-[auto_minmax(0,1fr)] items-center @area:h-full @area:min-h-0 @area:grid-cols-[minmax(0,1fr)_auto] @area:grid-rows-[auto_minmax(0,1fr)] @area:items-stretch">
            {title != null ? (
              <div data-slot="secondary-nav-title" className={cn('typography-title-sm col-start-2 row-start-1 hidden min-w-0 truncate py-3 text-foreground @area:col-start-1 @area:block', zero ? 'px-2' : 'px-3')}>
                {title}
              </div>
            ) : null}
            {actions != null ? (
              <div
                data-slot="secondary-nav-actions"
                className={cn(
                  'col-start-1 row-start-1 flex shrink-0 items-center gap-1 self-stretch border-0 border-r border-solid border-border px-2 @area:col-start-2 @area:border-r-0 @area:py-3',
                  zero ? '@area:px-2' : '@area:px-3',
                  // Touch: every icon button in the field has a 44px hit area (touch-target-lg, WCAG 2.5.5).
                  '[@media(pointer:coarse)]:[&_button]:min-h-[var(--size-touch-target-lg)] [@media(pointer:coarse)]:[&_button]:min-w-[var(--size-touch-target-lg)]',
                )}
              >
                {actions}
              </div>
            ) : null}
            <div data-slot="secondary-nav-nav" className="col-start-2 row-start-1 flex min-h-0 min-w-0 flex-col @area:col-span-2 @area:col-start-1 @area:row-start-2 [&>*]:min-h-0 @area:[&>*]:flex-1">
              {nav}
            </div>
          </div>
        ) : (
          nav
        )}
      </div>
      <div data-slot="secondary-nav-content" className={cn('min-w-0 flex-1', fill && 'min-h-0', contentClassName)}>
        {children}
      </div>
    </div>
  </div>
  );
});
SecondaryNavLayout.displayName = 'SecondaryNavLayout';

export interface StorageMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  used: number;
  total: number;
  label?: string;
  // Unit appended to the numbers, e.g. "GB".
  unit?: string;
}

// Used and total storage with a progress bar. The text carries the values, the bar is the visual.
const StorageMeter = forwardRef<HTMLDivElement, StorageMeterProps>(({ className, used, total, label: labelProp, unit = 'GB', ...props }, ref) => {
  const l = useLabels();
  const label = labelProp ?? l.storage;
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const near = percent >= 90;
  return (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      <p className="typography-text-extra-small flex items-baseline justify-between gap-2 text-muted-foreground">
        <span>{label}</span>
        <span className={cn('tabular-nums', near && 'text-text-destructive')}>
          {l.storageUsed(used, total, unit)}
        </span>
      </p>
      <Progress size="sm" value={used} max={total} variant={near ? 'destructive' : 'default'} aria-label={l.storagePercentUsed(label, percent)} />
    </div>
  );
});
StorageMeter.displayName = 'StorageMeter';

export { SecondaryNav, SecondaryNavLayout, StorageMeter };
