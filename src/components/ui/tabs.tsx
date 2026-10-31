'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { rowScrollTarget } from './../../lib/row-scroll';
import { cn } from './../../lib/utils';
import { usePreset } from './labels-context';

/**
 * `segmented` (default): pill-in-track look, the active trigger is a raised `bg-background` chip.
 * `line`: transparent track with a hairline baseline; the active trigger gets a 2px bottom bar. Full width by default (`w-full`; use `w-auto` in `className` for an inline list). One row that scrolls sideways when the tabs do not fit (no wrapping), the active tab is kept in view.
 * `segment`: segmented control with control-height triggers, the `tab` type role and an `elevation-surface` active chip.
 */
// Theme expression (kette-tokens 5.26.0): list image and bevel (the line variant keeps its own hairline shadow), none by default
const tabsListVariants = cva('inline-flex h-10 items-center justify-center text-muted-foreground bg-[image:var(--image-tabs-list)] shadow-[shadow:var(--bevel-tabs-list)]', {
  variants: {
    variant: {
      // Track padding is 3px outside zero (the 0.16 value, no spacing token exists for it) and the 2px micro token in zero (see TabsList).
      segmented: 'rounded-control bg-muted p-[3px]',
      // Segmented control (zero): 2px track padding and gap, control radius, auto height (trigger sets it).
      segment: 'h-auto justify-start gap-micro rounded-control bg-muted p-micro',
      // One scrolling row. The hairline is an inset shadow on the track (token colour variable inside one arbitrary value, because a separate shadow colour class would replace the size in class merging), because a border would be cut off by the scroll container where the active bar overlaps it. The scrollbar is hidden (the cut-off tab shows that more follows).
      line: 'relative h-auto w-full max-w-full flex-nowrap justify-start gap-x-4 overflow-x-auto overscroll-x-contain rounded-none bg-transparent p-0 shadow-[inset_0_-1px_0_0_rgb(var(--colors-utility-hairline)/var(--colors-utility-hairline-alpha))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-px-8 [mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)] data-[fade-start]:[--fade-start:var(--space-8)] data-[fade-end]:[--fade-end:var(--space-8)] contrast-more:[mask-image:none] [@media(prefers-reduced-transparency:reduce)]:[mask-image:none]',
      // Vertical nav list (Figma "Vertical tabs"): stacked full-width triggers. Pair with `<Tabs orientation="vertical">`.
      vertical: 'h-auto flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0',
    },
  },
  defaultVariants: { variant: 'segmented' },
});

// Zero preset overrides of the line list, applied after the variant classes.
// The trigger has 4px side padding in zero too (see the line trigger), so the gap is 12px + 2 x 4px = the former 20px between labels.
const LINE_LIST_ZERO = 'gap-x-3 shadow-[inset_0_-1px_0_0_rgb(var(--semantic-border-default))]';

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default focus-visible:[--tw-ring-shadow:var(--tw-ring-inset)_0_0_0_calc(var(--size-focus-ring-width)+var(--tw-ring-offset-width))_var(--tw-ring-color),var(--glow-focus)] disabled:pointer-events-none disabled:opacity-disabled data-[state=active]:text-foreground ' +
    // Theme expression (kette-tokens 5.26.0): tab voice, active image, indicator line (offset > 0 top, < 0 bottom), bevel and text shadow over the variant's own active shadow (--tab-elevation); the defaults change nothing
    '![font-family:var(--font-tab),sans-serif] [text-transform:var(--case-tab)] [--tracking-extra:var(--tracking-tab)] [--tab-elevation:0_0_transparent] data-[state=active]:bg-[image:var(--image-tab-active)] data-[state=active]:[text-shadow:var(--text-shadow-tab-active)] data-[state=active]:shadow-[shadow:inset_0_var(--indicator-tab-active-offset)_0_var(--indicator-tab-active-color),var(--tab-bevel,0_0_transparent),var(--tab-elevation)]',
  {
    variants: {
      variant: {
        segmented:
          'px-3 py-[6px] text-sm leading-normal font-medium rounded-item data-[state=active]:bg-background [--tab-bevel:var(--bevel-tab-active)] data-[state=active]:[--tab-elevation:theme(boxShadow.xs)]',
        segment:
          'h-control-sm shrink-0 gap-gap-control rounded-item px-control-px-sm typography-tab data-[state=active]:bg-background [--tab-bevel:var(--bevel-tab-active)] data-[state=active]:[--tab-elevation:var(--elevation-surface,0_0_transparent)]',
        // Vertical tab: left aligned, 32px high, `tab` type role, brand-subtle fill when active.
        vertical:
          'h-8 w-full justify-start gap-2 rounded-item px-3 typography-tab [--tab-bevel:var(--bevel-tab-active)] [&>svg]:h-icon-nav [&>svg]:w-icon-nav [&>svg]:shrink-0 data-[state=active]:bg-background-brand-subtle data-[state=active]:text-general-brand-on-container',
        // The scroll container of the list clips a ring outside the trigger, so the focus ring is drawn inside (inset, no offset). `shrink-0` keeps every tab whole in the scrolling row.
        line: 'shrink-0 rounded-none border-b-2 border-solid border-transparent px-1 py-[6px] pb-2 focus-visible:ring-inset focus-visible:ring-offset-0 data-[state=active]:border-foreground data-[state=active]:[border-image-source:var(--image-accent-stripe)] data-[state=active]:[border-image-slice:1]',
      },
      // Product preset (DesignSystemProvider `preset`). `zero` gives the line tab a 40px row with the tab role and the vertical tab the muted active row.
      preset: { default: '', zero: '' },
      size: { sm: '', md: '' },
    },
    compoundVariants: [
      { variant: 'line', preset: 'default', className: 'text-sm leading-normal font-medium' },
      // Outside zero the segmented tab is 32px, so the track (3px padding) is 38px like the segmented ToggleGroup.
      { variant: 'segmented', preset: 'default', className: 'h-8 py-0' },
      // Zero: the count span carries no margin, so the trigger gap (6px token) spaces it from the label in every variant and size.
      { variant: ['segmented', 'segment', 'line'], preset: 'zero', className: 'gap-gap-control' },
      // The first and last tab keep only 2px (the micro token) of the 4px side padding, so the first label sits 2px from the content edge and the 2px inset focus ring sits next to the glyph without covering it. The list and its hairline stay inside the parent.
      { variant: 'line', preset: 'zero', className: 'h-10 px-1 py-0 typography-tab first:pl-micro last:pr-micro' },
      // Segment tab height by list size: `sm` is a 28px list in zero (24px tabs), `md` keeps the control-sm tab.
      { variant: 'segment', size: 'sm', className: 'h-control-xs' },
      { variant: 'vertical', preset: 'zero', className: 'h-nav-item data-[state=active]:bg-muted data-[state=active]:text-foreground' },
    ],
    defaultVariants: { variant: 'segmented', preset: 'default', size: 'md' },
  },
);

type TabsVariantContextValue = NonNullable<VariantProps<typeof tabsListVariants>['variant']>;

// The list owns the variant; triggers read it from context (and may override with their own prop).
const TabsVariantContext = React.createContext<TabsVariantContextValue>('segmented');
// Size of the segment list, read by the triggers.
const TabsSizeContext = React.createContext<'sm' | 'md' | undefined>(undefined);

const Tabs = TabsPrimitive.Root;

// Edge fades of the scrolling `line` row, as in the SecondaryNav row: only on the side that has more tabs. The list carries `data-fade-start` / `data-fade-end`, the mask is in the line variant. Set on the node directly, so a scroll does not re-render the tabs.
const useEdgeFade = (listRef: React.RefObject<HTMLElement | null>, enabled: boolean) => {
  React.useEffect(() => {
    const el = listRef.current;
    if (!el || !enabled) return undefined;
    const measure = () => {
      const overflow = el.scrollWidth - el.clientWidth > 1;
      el.toggleAttribute('data-fade-start', overflow && el.scrollLeft > 1);
      el.toggleAttribute('data-fade-end', overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) document.fonts.ready.then(measure);
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(measure);
    mutations?.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
      mutations?.disconnect();
      el.removeAttribute('data-fade-start');
      el.removeAttribute('data-fade-end');
    };
  }, [listRef, enabled]);
};

// Centres the active trigger (clear of the edge fades; the first and last tab go fully to the end) in the scrolling row of the `line` list. Only the list scrolls, never the page (no scrollIntoView). On mount it jumps, later changes glide unless the user prefers reduced motion.
const useRevealActiveTab = (listRef: React.RefObject<HTMLElement | null>, enabled: boolean) => {
  React.useEffect(() => {
    const list = listRef.current;
    if (!list || !enabled) return undefined;
    const reveal = (animate: boolean) => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (!active || list.scrollWidth <= list.clientWidth) return;
      // Measured against the list with bounding boxes, not `offsetLeft`, which is relative to the nearest positioned ancestor (TABS-0300-01).
      const left = Math.round(active.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft - list.clientLeft);
      const tabs = list.querySelectorAll('[role="tab"]');
      const edge = active === tabs[0] ? 'start' : active === tabs[tabs.length - 1] ? 'end' : undefined;
      // Clear of the edge fade (the scroll padding of the list is the fade width); the first and last tab scroll fully to the end, so the fade on that side goes.
      const target = rowScrollTarget(list, { left, width: active.offsetWidth, edge }, parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0, true);
      if (target === list.scrollLeft) return;
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (animate && !reduced && typeof list.scrollTo === 'function') list.scrollTo({ left: target, behavior: 'smooth' });
      else list.scrollLeft = target;
    };
    reveal(false);
    // Set once the user scrolls the row by hand (wheel or touch drag), so a late re-measure never fights them. Keys and clicks do not count: they move the active tab, and the row follows it.
    let touched = false;
    const touch = () => {
      touched = true;
    };
    list.addEventListener('wheel', touch, { passive: true });
    list.addEventListener('touchstart', touch, { passive: true });
    // Web fonts, a badge or a count that arrives late change the tab widths after the first paint, and a value set right after mount is centred before that. So the target is measured again whenever the row or a tab changes size (and once fonts are ready), until the user moves the row.
    let active = true;
    const settle = () => {
      if (active && !touched) reveal(false);
    };
    if (typeof document !== 'undefined' && document.fonts?.ready) document.fonts.ready.then(settle);
    const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(settle);
    sizes?.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => sizes?.observe(tab));
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver((records) => {
      if (records.some((record) => record.type === 'childList')) {
        sizes?.disconnect();
        sizes?.observe(list);
        list.querySelectorAll('[role="tab"]').forEach((tab) => sizes?.observe(tab));
      }
      if (records.some((record) => record.type === 'attributes')) reveal(true);
    });
    observer?.observe(list, { attributes: true, attributeFilter: ['data-state'], childList: true, subtree: true });
    return () => {
      active = false;
      observer?.disconnect();
      sizes?.disconnect();
      list.removeEventListener('wheel', touch);
      list.removeEventListener('touchstart', touch);
    };
  }, [listRef, enabled]);
};

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
    VariantProps<typeof tabsListVariants> & {
      // Zero: `sm` is a 28px list (24px tabs inside 2px padding), `md` the control-sm tab, default `sm`.
      // Outside zero, segmented and segment lists: `sm` is as tall as a Button sm (32px) and `md` as a default Button (40px), with 3px track padding. Without `size` the list keeps its legacy height (segmented 38px, segment 36px).
      size?: 'sm' | 'md';
    }
>(({ className, variant, size, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  // Zero: the plain list is the segmented control.
  const resolved = variant ?? (zero ? 'segment' : 'segmented');
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );
  useRevealActiveTab(listRef, resolved === 'line');
  useEdgeFade(listRef, resolved === 'line');
  return (
    <TabsVariantContext.Provider value={resolved}>
      <TabsSizeContext.Provider value={size ?? (zero ? 'sm' : undefined)}>
      <TabsPrimitive.List data-slot="tabs-list" data-variant={resolved} ref={setRefs} className={cn(tabsListVariants({ variant: resolved }), zero && resolved === 'segmented' && 'p-micro', !zero && resolved === 'segmented' && 'h-auto',
          // Sized track outside zero: total height is the Button control token, the triggers fill it (see TabsTrigger).
          !zero && size && (resolved === 'segmented' || resolved === 'segment') && cn('p-[3px]', size === 'sm' ? 'h-control-sm' : 'h-control-md'), zero && resolved === 'line' && LINE_LIST_ZERO, className)} {...props} />
      </TabsSizeContext.Provider>
    </TabsVariantContext.Provider>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Count slot convention: `<TabsTrigger count={3}>Open</TabsTrigger>` renders a `TabsCount` after the
 * label. Use `TabsCount` directly for custom content (e.g. `99+`). The count is muted at rest and
 * follows the trigger on the active tab (`group-data-[state=active]`). Tabular figures keep the
 * trigger width stable while the number changes.
 */
const TabsCount = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: TabsVariantContextValue;
    // `destructive` marks a count that needs attention, for example a selection or error count (Figma _Tab Badge=Count destructive).
    tone?: 'default' | 'destructive';
  }
>(({ className, variant, tone = 'default', ...props }, ref) => {
  const fromList = React.useContext(TabsVariantContext);
  const resolved = variant ?? fromList;
  const zero = usePreset() === 'zero';
  // The segmented track, the segment track and the active vertical row are bg-muted surfaces, so the count uses the on-muted role there.
  const onMuted = resolved === 'segmented' || resolved === 'segment' || resolved === 'vertical';
  const subtleCount = onMuted ? 'text-text-subtle-on-muted' : 'text-text-subtle';
  return (
    <span
      ref={ref}
      className={cn(
        zero && resolved !== 'vertical'
          ? cn('typography-kpi-label-strong tabular-nums', subtleCount)
          : resolved === 'vertical'
          ? // Pushed to the row end like a nav counter.
            cn('ml-auto typography-kpi-label-strong tabular-nums', subtleCount)
          : resolved === 'segment'
          ? // Plain-text count: the trigger gap spaces it, and it stays subtle on the active tab too.
            cn('typography-kpi-label-strong tabular-nums', subtleCount)
          : cn('ml-[6px] text-micro font-normal leading-none tabular-nums group-data-[state=active]:text-muted-foreground', subtleCount),
        tone === 'destructive' && (onMuted ? 'text-text-destructive-on-subtle group-data-[state=active]:text-text-destructive-on-subtle' : 'text-text-destructive group-data-[state=active]:text-text-destructive'),
        className,
      )}
      {...props}
    />
  );
});
TabsCount.displayName = 'TabsCount';

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    Omit<VariantProps<typeof tabsTriggerVariants>, 'preset' | 'size'> & {
      /** Optional count rendered in a `TabsCount` slot after the label. `0` is rendered; `undefined`/`null` is not. */
      count?: number | string | null;
      // Tone of the count slot. `destructive` uses the destructive text role.
      countTone?: 'default' | 'destructive';
    }
>(({ className, variant, count, countTone, children, ...props }, ref) => {
  const innerRef = React.useRef<HTMLButtonElement | null>(null);
  // Tabs used as a plain switch (no TabsContent at all, for example the view tabs of an action bar) must not point aria-controls at a panel that does not exist.
  // With panels, inactive tabs keep it: their panel is unmounted by design.
  React.useEffect(() => {
    const node = innerRef.current;
    const target = node?.getAttribute('aria-controls');
    if (!node || !target || node.ownerDocument.getElementById(target)) return;
    const list = node.closest('[role=tablist]');
    const root = list?.parentElement?.closest('[data-orientation]') ?? list?.parentElement;
    if (!root?.querySelector('[role=tabpanel]')) node.removeAttribute('aria-controls');
  });
  const setRefs = React.useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref],
  );
  const fromList = React.useContext(TabsVariantContext);
  const listSize = React.useContext(TabsSizeContext);
  const zero = usePreset() === 'zero';
  const resolvedVariant = variant ?? fromList;
  // Sized list outside zero: the trigger fills the track height (control token minus the 3px padding).
  const fillsTrack = !zero && listSize !== undefined && (resolvedVariant === 'segmented' || resolvedVariant === 'segment');
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-variant={resolvedVariant}
      ref={setRefs}
      className={cn(
        'group',
        tabsTriggerVariants({ variant: resolvedVariant, preset: zero ? 'zero' : 'default', size: zero ? listSize : undefined }),
        fillsTrack && 'h-full py-0',
        className,
      )}
      {...props}
    >
      {children}
      {count != null && <TabsCount variant={variant ?? fromList} tone={countTone}>
          {count}
        </TabsCount>}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 rounded-item focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsCount, TabsList, tabsListVariants, TabsTrigger, tabsTriggerVariants };
