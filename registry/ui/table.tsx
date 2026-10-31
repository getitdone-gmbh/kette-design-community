'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  createContext,
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { scrollRegionRing } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { edgeClass, useEdge } from '@/components/ui/edge';
import { useLabels, usePreset } from '@/components/ui/labels-context';

// `zero` and `zero-compact` follow the Figma DataGrid: head 34px (`table-head`), rows 44px (`row`) or 36px (`row-compact`), 12px cell padding.
type TableDensity = 'compact' | 'default' | 'comfortable' | 'zero' | 'zero-compact';
type SortDirection = 'asc' | 'desc' | false;
// Where a sticky header sticks. `container` (default) clamps the table height and scrolls inside it; `parent` fills a parent that has a height; `page` sticks under the app top bar while the page scrolls.
type TableStickyMode = 'container' | 'parent' | 'page';

interface TableContextValue {
  density?: TableDensity;
  striped?: boolean;
  stickyHeader?: boolean;
  stickyMode?: TableStickyMode;
  stickyOffset?: string;
  headerTone?: TableHeaderTone;
  rowHover?: TableRowHover;
  // Width of the visible scroll area (the scroll container without its border) in px, measured by the Table. Unset until measured.
  visibleWidth?: number;
}

// `muted` paints the header band with the muted surface; `table` hovers rows with the dedicated table hover token.
type TableHeaderTone = 'default' | 'muted';
type TableRowHover = 'default' | 'table';

const TableContext = createContext<TableContextValue>({
  density: 'default',
  striped: false,
  stickyHeader: true,
  stickyMode: 'container',
  headerTone: 'default',
  rowHover: 'default',
});

// Every color below is one of the dedicated `table-*` tokens (Design Tokens library, live —
// `colors/table/background/default`, `/selected`, `colors/table/foreground/default`) or an
// existing generic semantic/`general-*` token already used the same way elsewhere in this repo
// (Chip, Alert). None is a raw Tailwind palette class.
// Data voice of the theme (kette-tokens 5.26.0 font-data, numeric-data), zero specificity so consumer classes win; neutral keeps the body font and inherited figures
const tableVariants = cva('w-full caption-bottom text-sm bg-background text-foreground [:where(&)]:[font-family:var(--font-data),sans-serif] [:where(&)]:[font-variant-numeric:var(--numeric-data)]');

interface TableProps extends HTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {
  // Row and header sizing. Unset: `zero` in the zero preset, otherwise `default`.
  density?: TableDensity;
  striped?: boolean;
  stickyHeader?: boolean;
  // Sticky behaviour: `container` keeps the bounded scroll area (default), `parent` fills a parent with a set height, `page` sticks the header under the top bar (`top-topbar`) while the page scrolls. `page` does not scroll horizontally inside the table.
  stickyMode?: TableStickyMode;
  // `page` mode only: distance from the viewport top where the header sticks, as a CSS length or var, e.g. `calc(var(--size-topbar) + var(--size-toolbar))`.
  // Stacks the header below a sticky toolbar. Sets `--table-sticky-offset` on the header, which defaults to `var(--size-topbar)`.
  // You can also set `--table-sticky-offset` on any ancestor instead.
  stickyOffset?: string;
  /** Header band colour. `default` keeps the surface colour; `muted` uses the muted surface and subtle text. */
  headerTone?: TableHeaderTone;
  /** Row hover colour. `default` is the muted wash; `table` uses `table-background-hover`. */
  rowHover?: TableRowHover;
  // Height cap of the scroll area as a CSS length or var, for example `600px` or `60vh`. Opt-in: without it the table grows with its rows. The cap makes the table scroll vertically inside itself, which is what the sticky header sticks to.
  // For a sticky header inside a scroll container you provide, use `stickyMode="page"` with `stickyOffset="0px"` (the table then does not scroll sideways by itself).
  maxHeight?: string;
  /** Adds the `elevation-table` shadow to the table container (zero theme: none in base). */
  elevated?: boolean;
  /** Accessible name of the scroll container. While the table overflows, the container is a tab stop; with a name it is exposed as a region, so a screen reader announces what the tab stop is. */
  scrollLabel?: string;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      density: densityProp,
      striped = false,
      stickyHeader = true,
      stickyMode = 'container',
      stickyOffset,
      headerTone = 'default',
      rowHover = 'default',
      elevated = false,
      scrollLabel,
      maxHeight,
      ...props
    },
    ref,
  ) => {
    const zeroPreset = usePreset() === 'zero';
    // The zero preset defaults to the zero density (rows 44, head 34, cell padding 12), other presets to `default`. An explicit density always wins.
    const density: TableDensity = densityProp ?? (zeroPreset ? 'zero' : 'default');
    // Horizontally scrolled: pinned columns show their edge shadow only then.
    const [scrolledX, setScrolledX] = useState(false);
    // A scroll area with nothing focusable inside must be reachable by keyboard (WCAG 2.1.1), so it becomes a tab stop only while it really overflows.
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [overflowing, setOverflowing] = useState(false);
    // Visible width of the scroll area, so a state row that spans every column (TableEmpty) can centre in what is on screen and not in the full table width.
    const [visibleWidth, setVisibleWidth] = useState<number | undefined>(undefined);
    useEffect(() => {
      const node = wrapperRef.current;
      if (!node) return;
      const measure = () => {
        setOverflowing(node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight);
        setVisibleWidth(node.clientWidth > 0 ? node.clientWidth : undefined);
      };
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      if (node.firstElementChild) observer.observe(node.firstElementChild);
      return () => observer.disconnect();
    }, []);
    return (
    <TableContext.Provider value={{ density, striped, stickyHeader, stickyMode, stickyOffset, headerTone, rowHover, visibleWidth }}>
      {/* `overflow-x-auto` is unconditional so a wide table always scrolls within its own bounded
          container (WCAG 1.4.10 Reflow) regardless of `stickyHeader`, instead of overflowing the
          page. Only the vertical clamp (`max-h`/`overflow-y-auto`) is gated on `stickyHeader`,
          since that's the one feature that needs a bounded viewport to scroll under. `rounded-default`
          + the same `border-border-subtle` token the row/thead dividers already use gives Table a
          real, clipped surface boundary like every other surface component (Card/Dialog/Alert),
          instead of flat, borderless corners. */}
      {/* The focus ring is drawn by a sibling overlay above the sticky header: a ring or outline on the scroll container itself is painted under the sticky header band. The overlay sits on the sticky layer (z-sticky, 10) and comes later in the tree than the header, so it wins that tie. It is never on the chrome layer: `isolate` keeps it in its own stacking context, and even where an app does not generate that class the ring stays below a fixed top bar on z-30 (DR-0290-01). */}
      <div className={cn('relative isolate w-full', stickyHeader && stickyMode === 'parent' && 'h-full min-h-0')}>
      <div
        ref={wrapperRef}
        tabIndex={overflowing ? 0 : undefined}
        role={overflowing && scrollLabel ? 'region' : undefined}
        aria-label={overflowing && scrollLabel ? scrollLabel : undefined}
        data-scrolled-x={scrolledX || undefined}
        style={maxHeight && stickyHeader && stickyMode === 'container' ? { maxHeight } : undefined}
        onScroll={(event) => {
          const next = event.currentTarget.scrollLeft > 0;
          if (next !== scrolledX) setScrolledX(next);
        }}
        className={cn(
          'peer relative w-full rounded-surface border border-solid focus-visible:outline-none',
          edgeClass(zeroPreset),
          // Page mode must not clip: an overflow container would become the sticky scroll parent.
          stickyHeader && stickyMode === 'page' ? 'overflow-visible' : 'overflow-x-auto',
          stickyHeader && stickyMode === 'container' && maxHeight && 'overflow-y-auto',
          stickyHeader && stickyMode === 'parent' && 'h-full min-h-0 overflow-y-auto',
          elevated && 'shadow-elevation-table',
        )}
      >
        <table ref={ref} className={cn(tableVariants({ className }))} {...props} />
      </div>
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 z-sticky hidden rounded-surface peer-focus-visible:block', ...scrollRegionRing)} />
      </div>
    </TableContext.Provider>
    );
  },
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, style, ...props }, ref) => {
    const { stickyHeader, stickyMode, stickyOffset, headerTone } = useContext(TableContext);
    const edge = useEdge();
    return (
      <thead
        data-slot="table-header"
        ref={ref}
        style={stickyOffset && stickyMode === 'page' ? ({ '--table-sticky-offset': stickyOffset, ...style } as CSSProperties) : style}
        className={cn(
          '[&_tr]:border-b border-solid',
          // Theme header band (kette-tokens 5.26.0 image-table-header, bevel-table-header); the sticky hairline shadow replaces the bevel
          'bg-[image:var(--image-table-header)] shadow-[shadow:var(--bevel-table-header)]',
          // A muted header paints the row accent gutter (border-l-4) in the header fill, so no strip of table surface shows next to the first header cell.
          headerTone === 'muted' && '[&_tr]:border-l-muted',
          edge,
          // NOTE: `bg-table-background-default` replaces a previously hardcoded `bg-white` here —
          // that raw value stayed white in dark mode, occluding scrolled-under rows with a
          // light panel over a dark table. Token-driven, it now tracks the theme in both modes.
          stickyHeader &&
            `sticky ${stickyMode === 'page' ? 'top-[var(--table-sticky-offset,var(--size-topbar))]' : 'top-0'} z-sticky ${
              headerTone === 'muted' ? 'bg-muted' : 'bg-background'
            } shadow-[0_1px_0_0] shadow-border-muted`,
          className,
        )}
        {...props}
      />
    );
  },
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    const { striped } = useContext(TableContext);
    return (
      <tbody
        ref={ref}
        className={cn(
          '[&_tr:last-child]:border-b-0',
          // Static zebra-stripe surface — `background-subtle` (a permanent-surface token), not the
          // pointer-state `general-background-hover` token, even though both currently resolve to
          // the same slate-50 value in light mode. The `:not(...)` guards scope the stripe selector
          // to rows that are neither selected nor invalid, so a row's own state tint (set via
          // `data-state="selected"` / `aria-invalid`, see `tableRowVariants`) is never silently
          // overridden by the zebra tint on even rows — the state cue stays visible for sighted
          // users, not just `aria-selected`/`aria-invalid` for assistive tech.
          striped && '[&_tr:nth-child(even):not([data-state="selected"]):not([aria-invalid="true"])]:bg-background-neutral-subtle [&_tr:nth-child(even):not([data-state="selected"]):not([aria-invalid="true"])]:[--table-pin-tint:theme(colors.background-neutral-subtle)]',
          className,
        )}
        {...props}
      />
    );
  },
);
TableBody.displayName = 'TableBody';

const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    const edge = useEdge();
    return (
    <tfoot
      ref={ref}
      className={cn(
        // `border-border-subtle` replaces a previously colorless `border-t` (no color utility was
        // set, so the browser's UA-default border color rendered instead — visually undefined and
        // very likely wrong in dark mode). `bg-background-neutral-subtle` replaces raw `bg-slate-50`.
        'border-t border-solid bg-muted/50 font-medium [&>tr]:last:border-b-0',
        edge,
        className,
      )}
      {...props}
    />
    );
  },
);
TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /**
   * Passing `onClick` opts the row into the full interactive bundle: hover/pressed state layer,
   * a real tab stop, a `focus-visible` ring, `cursor-pointer`, and keyboard activation on both
   * `Enter` and `Space`. A screen-reader user tabbing onto the row is only told "row" by its
   * native semantics — pass a descriptive `aria-label` (e.g. `aria-label="Open Laptop Pro"`) so
   * the row's accessible name communicates what activating it does (WCAG 4.1.2).
   */
  onClick?: HTMLAttributes<HTMLTableRowElement>['onClick'];
  /**
   * Marks this row as the current selection (e.g. a checked/active record). Sets
   * `data-state="selected"` for styling (kept as the pre-existing DOM-attribute contract) and
   * `aria-selected` for assistive tech — `row` has native ARIA-table semantics and supports
   * `aria-selected` directly, unlike Chip's plain `<div>`, so no extra sr-only text is needed here.
   */
  selected?: boolean;
  /**
   * Dims the row and blocks pointer interaction. `<tr>` has no native `disabled` attribute, so
   * this is expressed via `aria-disabled`/`data-disabled` — same rationale as Chip/Avatar's opt-in
   * interactive mode.
   */
  disabled?: boolean;
  /**
   * Flags the row as failing validation (e.g. a bulk-import row that failed a check). Tints the
   * row with the same `general-error-default` wash Alert's `destructive` variant uses (via the
   * `/10` opacity modifier — see alert.tsx) and sets `aria-invalid`/`data-invalid`. `aria-invalid`
   * support is best-effort on a non-widget `row` in some assistive tech — pair with an explicit
   * status cell/icon column for a cue that is always announced.
   */
  invalid?: boolean;
  // Marks the row whose record is open in a side sheet (Figma Table cell State=Active): brand-subtle wash plus a brand left
  // accent. Sets `aria-current` and `data-active`. Opt-in; rows without it are unchanged.
  active?: boolean;
}

const tableRowVariants = cva(
  [
    // `border-l-4 border-l-transparent` reserves a left-accent gutter on every row (so a row
    // gaining/losing the selected/invalid accent never shifts layout), painted over by the
    // selected/invalid compound variants below. It's a shape/position cue in addition to the
    // background tint — not color alone — for WCAG 1.4.1.
    'border-b border-l-4 border-solid border-l-transparent transition-colors',
    // Theme selection indicator (kette-tokens 5.26.0: edge and ring) on the selected row, nothing by default
    'data-[state=selected]:shadow-[shadow:inset_var(--indicator-selection-edge)_0_0_var(--indicator-selection-edge-color),inset_0_0_0_var(--indicator-selection-ring)_var(--indicator-selection-ring-color)]',
    // Rows highlight on hover (data tables are scanned); selected/invalid rows keep their own tint.
    '[&:not([data-state=selected]):not([aria-invalid=true])]:hover:bg-muted/50',
    // Row state colours as variables, so a pinned (solid) cell can repaint exactly the tint its row shows.
    '[&:not([data-state=selected]):not([aria-invalid=true])]:hover:[--table-pin-tint:theme(colors.muted/50%)]',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/30',
    'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-disabled',
  ],
  {
    variants: {
      selected: { true: '', false: '' },
      invalid: { true: '', false: '' },
      // Only an actionable row (a consumer wired `onClick` on, and it's not disabled) gets a
      // hover/pressed state layer — a plain, non-clickable row (the common case: `Default`,
      // `CompactDensity`, `Striped`, …) must not show a false clickable affordance.
      interactive: { true: '', false: '' },
    },
    compoundVariants: [
      {
        selected: false,
        invalid: false,
        interactive: true,
        className: 'active:bg-muted active:[--table-pin-tint:theme(colors.muted)]',
      },
      // Selected wins over invalid when a row is somehow both — the user's explicit selection is
      // the higher-priority signal; `aria-invalid`/`data-invalid` stay set either way so the
      // validation flag is never silently lost, only its background tint is deprioritized.
      // `border-l-general-brand-default` is the non-color (shape/position) cue required alongside
      // the background tint — see TABLE-A11Y-03 token gap below re: the tint's own contrast ratio.
      {
        selected: true,
        className:
          'bg-accent hover:bg-accent active:bg-accent [--table-pin-tint:theme(colors.accent)]',
      },
      {
        selected: false,
        invalid: true,
        className:
          'border-l-general-error-default bg-general-error-default/10 hover:bg-general-error-default/20 active:bg-general-error-default/25 [--table-pin-tint:theme(colors.general-error-default/10%)] hover:[--table-pin-tint:theme(colors.general-error-default/20%)] active:[--table-pin-tint:theme(colors.general-error-default/25%)] [--table-pin-accent:theme(colors.general-error-default)]',
      },
    ],
    defaultVariants: { selected: false, invalid: false, interactive: false },
  },
);

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, disabled, invalid, active, onClick, onKeyDown, tabIndex, ...props }, ref) => {
    // Only an actionable row (one a consumer wired `onClick` on) becomes a real tab stop — a
    // purely presentational row never gets an unreachable focus ring (same rule as Chip/Avatar).
    const interactive = Boolean(onClick) && !disabled;
    const { rowHover } = useContext(TableContext);
    const edge = useEdge();

    const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
      onKeyDown?.(event);
      // Ignore keys bubbling from nested controls (checkbox, button, link); only the row itself activates.
      if (!interactive || event.defaultPrevented || event.target !== event.currentTarget) return;
      // Enter and Space are both wired — the conventional button-activation key set — so keyboard
      // users get one consistent expectation of what activates a row, matching the "hover, focus-
      // visible ring, active press, keyboard-activate" bundle consumers opt into via `onClick`.
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        onClick?.(event as unknown as MouseEvent<HTMLTableRowElement>);
      }
    };

    return (
      <tr
        ref={ref}
        data-state={selected ? 'selected' : undefined}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-active={active || undefined}
        aria-current={active ? 'true' : undefined}
        aria-selected={selected || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        tabIndex={disabled ? undefined : (tabIndex ?? (interactive ? 0 : undefined))}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          // The edge colour comes first so the left accent colours below are not merged away.
          edge,
          tableRowVariants({ selected: Boolean(selected), invalid: Boolean(invalid), interactive }),
          interactive && 'cursor-pointer',
          active && !selected && !invalid && 'border-l-border-brand bg-background-brand-subtle [--table-pin-tint:theme(colors.background-brand-subtle)] [--table-pin-accent:theme(colors.border-brand)]',
          rowHover === 'table' &&
            '[&:not([data-state=selected]):not([aria-invalid=true])]:hover:bg-table-background-hover [&:not([data-state=selected]):not([aria-invalid=true])]:hover:[--table-pin-tint:theme(colors.table-background-hover)]',
          className,
        )}
        {...props}
      />
    );
  },
);
TableRow.displayName = 'TableRow';

// Type comes from the dedicated `typography-table-head` role (size/weight/line-height/letter-
// spacing, incl. its 700 weight — not a hardcoded `font-medium`), never a raw `text-xs`/`text-sm`
// utility. Density only varies row height and padding, not the type role itself; if density-scaled
// type ever becomes a real product need, that's a new density-specific type role to raise with
// design-tokens-maintainer, not a raw size override here.
const tableHeadVariants = cva(
  'typography-table-head text-left align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0',
  {
    variants: {
      density: {
        compact: 'h-6 px-2 py-1',
        default: 'h-8 px-4 py-2',
        comfortable: 'h-12 px-6 py-3',
        zero: 'h-table-head px-3 py-2',
        'zero-compact': 'h-table-head px-3 py-2',
      },
    },
    defaultVariants: {
      density: 'default',
    },
  },
);

// Pinned (sticky) first column. Solid page background plus the row's own tint (--table-pin-tint, set per row state) so hover, selected, invalid, active and striped rows stay opaque,
// an inset gutter in the row's accent colour (--table-pin-accent) because the row border scrolls away, and an edge shadow that only shows while the table is scrolled sideways.
const tablePinned = [
  'sticky left-0 z-raised bg-background',
  '[background-image:linear-gradient(var(--table-pin-tint,transparent),var(--table-pin-tint,transparent))]',
  '[box-shadow:inset_theme(borderWidth.4)_0_0_0_var(--table-pin-accent,transparent)]',
  'after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-3 after:bg-gradient-to-r after:from-overlay-scrim after:to-transparent after:opacity-0 after:transition-opacity',
  '[[data-scrolled-x=true]_&]:after:opacity-100',
];

// Select (checkbox) column width from the `table-select` size token; the preset has no width utility for it yet.
const tableSelectCell = 'w-[var(--size-table-select)] min-w-[var(--size-table-select)] pr-0';

// Zero densities already reserve the 4px accent gutter on the row, so the checkbox pads 12 to land 16 from the frame edge.
const selectCellPadding = (density: TableDensity | undefined, zero: boolean) => (zero && (density === 'zero' || density === 'zero-compact') ? 'pl-3' : 'pl-4');

interface TableHeadProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  // Horizontal alignment of the label (and the sort button). `right` suits numbers. Default `left` adds no class.
  align?: 'left' | 'center' | 'right';
  /** Fixes the cell to the select-column width (`size-table-select`) for a leading checkbox. */
  select?: boolean;
  // Pins the column to the start edge while the table scrolls sideways (use on the head and on every cell of that column).
  pinned?: boolean;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, select = false, pinned = false, align, sortable = false, sortDirection = false, onSort, ...props }, ref) => {
    const { density, headerTone } = useContext(TableContext);
    const zeroPreset = usePreset() === 'zero';
    const l = useLabels();
    // A select column head has no visible text, so its name becomes visually hidden text (an empty table header fails WCAG 1.3.1).
    const emptySelectHead = select && !sortable && (children === undefined || children === null || children === false || children === '');
    const ariaSort = !sortable
      ? undefined
      : sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
      ? 'descending'
      : 'none';

    return (
      <th
        data-slot="table-head"
        ref={ref}
        scope="col"
        aria-sort={ariaSort}
        className={cn(
          tableHeadVariants({ density }),
          headerTone === 'muted' && 'bg-muted text-text-muted',
          pinned && ['sticky left-0 z-raised', headerTone === 'muted' ? 'bg-muted' : 'bg-background', tablePinned[3], tablePinned[4]],
          select && [tableSelectCell, selectCellPadding(density, zeroPreset)],
          align === 'right' && 'text-right',
          align === 'center' && 'text-center',
          className,
        )}
        {...props}
      >
        {sortable ? (
          // A real <button> gets keyboard operability (Enter/Space, tab stop) for free — the
          // previous `onClick`-only <th> had no keyboard path at all (WCAG 2.1.1). Hover/active/
          // focus-visible are scoped to the button itself, not the whole header cell.
          <button
            type="button"
            onClick={onSort}
            className={cn(
              '-mx-1 flex min-h-target w-full cursor-pointer select-none items-center gap-1 rounded-item px-1 transition-colors',
              align === 'right' && 'justify-end',
              align === 'center' && 'justify-center',
              'hover:bg-muted hover:text-foreground active:bg-muted-strong',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/30',
            )}
          >
            {children}
            <span className={align === 'right' || align === 'center' ? undefined : 'ml-auto'} aria-hidden="true">
              {sortDirection === 'asc' && <ChevronUp className="h-4 w-4" />}
              {sortDirection === 'desc' && <ChevronDown className="h-4 w-4" />}
              {!sortDirection && <ChevronUp className="h-4 w-4 opacity-20" />}
            </span>
          </button>
        ) : emptySelectHead ? (
          <span className="sr-only">{props['aria-label'] ?? l.selectAllRows}</span>
        ) : (
          <div className={cn('flex items-center gap-1', align === 'right' && 'justify-end', align === 'center' && 'justify-center')}>{children}</div>
        )}
      </th>
    );
  },
);
TableHead.displayName = 'TableHead';

// Same rationale as `tableHeadVariants` above: type comes from the dedicated `typography-table-cell`
// role, density only varies padding.
const tableCellVariants = cva('typography-table-cell align-middle [&:has([role=checkbox])]:pr-0', {
  variants: {
    density: {
      compact: 'px-2 py-1',
      default: 'px-4 py-2',
      comfortable: 'px-6 py-3',
      zero: 'h-row px-3 py-2',
      'zero-compact': 'h-row-compact px-3 py-1',
    },
  },
  defaultVariants: {
    density: 'default',
  },
});

interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** Fixes the cell to the select-column width (`size-table-select`) for a leading checkbox. */
  select?: boolean;
  // Pins the column to the start edge while the table scrolls sideways. Opaque in every row state; an edge shadow shows while scrolled.
  pinned?: boolean;
  // Horizontal alignment (Figma Align). `right` suits numbers. Default `left` adds no class.
  align?: 'left' | 'right';
  // Fixed cell height (Figma Height): `default` is the row height, `two-line` the two-line row height. Unset keeps the density-driven height.
  rowHeight?: 'default' | 'two-line';
  // Standalone selected wash (Figma State=Selected). Inside a `TableRow selected` the row already tints.
  selected?: boolean;
  // Row open in a side sheet (Figma State=Active): brand-subtle wash and a 2px brand left border.
  active?: boolean;
  // Cell is being edited (Figma State=Focused): 2px inside focus ring.
  focused?: boolean;
  // Cell failed validation (Figma State=Error): destructive inside border and text. Sets `aria-invalid`.
  invalid?: boolean;
  // Dims the cell (Figma State=Disabled).
  disabled?: boolean;
  // Chip or badge rendered after the content (Figma Tag).
  tag?: ReactNode;
}

const cellRowHeight = { default: 'h-row', 'two-line': 'h-row-two-line' } as const;

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  (
    { className, select = false, pinned = false, align, rowHeight, selected, active, focused, invalid, disabled, tag, children, ...props },
    ref,
  ) => {
    const { density } = useContext(TableContext);
    const zeroPreset = usePreset() === 'zero';
    return (
      <td
        ref={ref}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        data-state={selected ? 'selected' : undefined}
        data-active={active || undefined}
        className={cn(
          tableCellVariants({ density }),
          pinned && tablePinned,
          select && [tableSelectCell, selectCellPadding(density, zeroPreset)],
          align === 'right' && 'text-right',
          rowHeight && cellRowHeight[rowHeight],
          selected && 'bg-table-background-selected',
          active && 'border-l-2 border-solid border-l-border-brand bg-background-brand-subtle',
          focused && 'ring-2 ring-inset ring-border-focus',
          invalid && 'text-text-destructive ring-1 ring-inset ring-border-destructive',
          disabled && 'pointer-events-none opacity-disabled',
          className,
        )}
        {...props}
      >
        {tag ? (
          <div className={cn('flex items-center gap-2', align === 'right' && 'justify-end')}>
            {children}
            {tag}
          </div>
        ) : (
          children
        )}
      </td>
    );
  },
);
TableCell.displayName = 'TableCell';

// Marks a component as rendering a table cell (a `<td>`), so containers such as DataGrid can use it as the cell itself instead of wrapping it in another cell.
const TABLE_CELL_MARK = '__tableCell';

function markTableCell<C extends object>(component: C): C {
  (component as Record<string, unknown>)[TABLE_CELL_MARK] = true;
  return component;
}

function isTableCellElement(node: unknown): node is ReactElement<TableCellProps> {
  if (!isValidElement(node)) return false;
  const type = node.type as unknown as Record<string, unknown>;
  return (typeof type === 'object' || typeof type === 'function') && type !== null && type[TABLE_CELL_MARK] === true;
}
markTableCell(TableCell);

interface TableBadgeCellProps extends Omit<TableCellProps, 'tag'> {
  // `default` pads with space/3 (Figma Style=Badge default), `wide` with space/6 (Style=Badge).
  padding?: 'default' | 'wide';
}

// Cell that holds a single Chip or Badge. Compose the chip as children, e.g. `<TableBadgeCell><Chip variant="success">Active</Chip></TableBadgeCell>`.
const TableBadgeCell = forwardRef<HTMLTableCellElement, TableBadgeCellProps>(
  ({ className, padding = 'default', ...props }, ref) => (
    <TableCell ref={ref} className={cn(padding === 'wide' ? 'px-6' : 'px-3', className)} {...props} />
  ),
);
TableBadgeCell.displayName = 'TableBadgeCell';
markTableCell(TableBadgeCell);

interface TableLeadCellProps extends Omit<TableCellProps, 'children' | 'tag'> {
  // Logo or avatar slot, e.g. a `LogoTile` or a square `Avatar size="xs"`. Decorative: the name carries the meaning.
  logo?: ReactNode;
  // Leading control slot (checkbox, radio, toggle), rendered before the logo and exposed to assistive tech.
  control?: ReactNode;
  name: ReactNode;
  supportingText?: ReactNode;
  // Chip after the name, e.g. a Required chip (Figma Lead text required).
  tag?: ReactNode;
  // Weight of the name. `medium` (default, Figma Lead text strong) or `regular` (Figma Lead text, 13/400).
  weight?: 'medium' | 'regular';
}

// Lead cell: optional control and logo/avatar, strong name, optional supporting line. Same cell contract as TableCell.
const TableLeadCell = forwardRef<HTMLTableCellElement, TableLeadCellProps>(
  ({ className, logo, control, name, supportingText, tag, weight = 'medium', ...props }, ref) => (
    <TableCell ref={ref} className={className} {...props}>
      <div className="flex items-center gap-2">
        {control && <span className="inline-flex shrink-0">{control}</span>}
        {logo && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {logo}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className={cn('truncate text-text-default', weight === 'regular' ? 'typography-ui' : 'typography-ui-medium')}>{name}</span>
          {supportingText && (
            <span className="typography-text-extra-small truncate text-text-subtle [[data-state=selected]_&]:text-text-subtle-on-muted [[data-active=true]_&]:text-general-brand-on-container">{supportingText}</span>
          )}
        </div>
        {tag}
      </div>
    </TableCell>
  ),
);
TableLeadCell.displayName = 'TableLeadCell';
markTableCell(TableLeadCell);

const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('typography-table-item mt-4 text-text-subtle', className)} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';

// Loading state — composes the shared `Skeleton` primitive instead of hand-rolled pulse `div`s, and
// announces the loading state to assistive tech (previously purely visual, with no `role`/`aria-live`
// at all — a real gap given `data-app-ux`'s requirement that loading be a distinguishable, perceivable
// state, not just a visual one).
interface TableLoadingProps extends HTMLAttributes<HTMLDivElement> {
  columns: number;
  rows?: number;
  // `tile` (default) keeps the bordered Skeleton tiles; `row` renders the Figma skeleton rows (overlay-skeleton tokens, row height).
  skeleton?: 'tile' | 'row';
}

const TableLoading = forwardRef<HTMLDivElement, TableLoadingProps>(({ className, columns, rows = 5, skeleton = 'tile', ...props }, ref) => {
  const l = useLabels();
  const { visibleWidth } = useContext(TableContext);
  const body = skeleton === 'row' ? (
    <Skeleton ref={ref} variant="row" rows={rows} label={l.loadingTableData} className={className} {...props} />
  ) : (
  <div
    ref={ref}
    role="status"
    aria-live="polite"
    aria-label={l.loadingTableData}
    className={cn('w-full', className)}
    {...props}
  >
    <div className="space-y-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  </div>
  );
  // Inside a Table (a state row cell) it takes the same sticky frame as the other state rows.
  return visibleWidth ? <TableStateFrame>{body}</TableStateFrame> : body;
});
TableLoading.displayName = 'TableLoading';

// Empty state component
interface TableEmptyProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align' | 'title'> {
  columns: number;
  message?: string;
  // Rich empty state (Figma Example=Empty state): any of these renders the shared EmptyState instead of the plain message.
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  variant?: EmptyStateProps['variant'];
}

// Width of the left accent gutter every row reserves (`border-l-4` in `tableRowVariants`). The state frame of TableEmpty keeps this much free on both sides, so it is centred in the visible scroll area.
const ROW_GUTTER_PX = 4;

// Frame of every full-width state row (TableEmpty, TableError, TableLoadingMore, TableLoading inside a Table): as wide as the visible scroll area and pinned to its left edge, so the content stays on screen in a wide table.
const TableStateFrame = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { visibleWidth } = useContext(TableContext);
  return (
    <div data-slot="table-empty-frame" className={cn('sticky max-w-full', className)} style={visibleWidth ? { left: ROW_GUTTER_PX, width: Math.max(0, visibleWidth - 2 * ROW_GUTTER_PX) } : undefined}>
      {children}
    </div>
  );
};

// Fixed a pre-existing bug: this was typed/forwarded as `HTMLDivElement` and its callback never
// even accepted a `ref` param, so the ref was silently dropped — the actual rendered root is a
// <td> (via TableCell) inside a <tr>. Now correctly typed/forwarded to the <td>. Also replaced
// `text-muted-foreground`, which is not a token this system defines (so it resolved to no color at
// all), with the existing `text-text-subtle` token already used by TableCaption above.
const TableEmpty = forwardRef<HTMLTableCellElement, TableEmptyProps>(
  ({ columns, message: messageProp, className, title, description, icon, actions, variant = 'no-results', ...props }, ref) => {
    const l = useLabels();
    const message = messageProp ?? l.noDataAvailable;
    const rich = title !== undefined || description !== undefined || actions !== undefined || icon !== undefined;
    return (
      <TableRow>
        {/* The cell spans every column, so it is as wide as the whole table. The content sits in a frame as wide as the visible scroll area, pinned to its left edge (`sticky`, `left` = the row gutter), so it is centred on screen at any scroll position and not in the full table width (RA-LIB-05). The cell has no side padding, so the frame starts at the edge of the scroll area. */}
        <TableCell ref={ref} colSpan={columns} className={cn('px-0', rich ? 'py-12' : 'h-24 text-center', className)} {...props}>
          <TableStateFrame>
            {rich ? (
              <div className="mx-auto w-full max-w-lg px-4">
                <EmptyState variant={variant} title={title ?? message} description={description} icon={icon} actions={actions} />
              </div>
            ) : (
              <div className="typography-table-item flex flex-col items-center justify-center gap-1 px-4 text-text-subtle">
                <p>{message}</p>
              </div>
            )}
          </TableStateFrame>
        </TableCell>
      </TableRow>
    );
  },
);
TableEmpty.displayName = 'TableEmpty';

interface TableErrorProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align' | 'title'> {
  columns: number;
  title?: ReactNode;
  description?: ReactNode;
  // Retry button (Figma Example=Error, "Try again"). Omit to hide it.
  onRetry?: () => void;
  retryLabel?: string;
}

// Error state row (Figma Example=Error): shared EmptyState error variant, announced as an alert, with a retry action.
const TableError = forwardRef<HTMLTableCellElement, TableErrorProps>(
  (
    { columns, title: titleProp, description: descriptionProp, onRetry, retryLabel: retryLabelProp, className, ...props },
    ref,
  ) => {
    const l = useLabels();
    const title = titleProp ?? l.tableErrorTitle;
    const description = descriptionProp ?? l.tableErrorDescription;
    const retryLabel = retryLabelProp ?? l.tryAgain;
    return (
    <TableRow>
      <TableCell ref={ref} colSpan={columns} className={cn('px-0 py-12', className)} {...props}>
        <TableStateFrame>
        <div className="mx-auto w-full max-w-lg px-4">
          <EmptyState
            variant="error"
            title={title}
            description={description}
            actions={
              onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  {retryLabel}
                </Button>
              ) : undefined
            }
          />
        </div>
        </TableStateFrame>
      </TableCell>
    </TableRow>
  );
  },
);
TableError.displayName = 'TableError';

interface TableLoadingMoreProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  columns: number;
  // A page is being fetched: shows the spinner and announces `loadingLabel`.
  loading?: boolean;
  // Offers a button when idle. Omit for infinite scroll, where only the loading state is shown.
  onLoadMore?: () => void;
  label?: string;
  loadingLabel?: string;
}

// Footer row for lazy loading (Figma Example=Lazy loading): live status while loading, otherwise a Load more button.
const TableLoadingMore = forwardRef<HTMLTableCellElement, TableLoadingMoreProps>(
  ({ columns, loading = false, onLoadMore, label: labelProp, loadingLabel: loadingLabelProp, className, ...props }, ref) => {
    const l = useLabels();
    const label = labelProp ?? l.loadMore;
    const loadingLabel = loadingLabelProp ?? l.loadingMore;
    return (
    <TableRow>
      <TableCell ref={ref} colSpan={columns} className={cn('px-0 text-center', className)} {...props}>
        <TableStateFrame>
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 px-4 typography-table-item text-text-subtle">
          {loading ? (
            <>
              <LoadingSpinner size="sm" role="presentation" aria-live="off" aria-label="" />
              <span>{loadingLabel}</span>
            </>
          ) : (
            onLoadMore && (
              <Button type="button" variant="ghost" size="sm" onClick={onLoadMore}>
                {label}
              </Button>
            )
          )}
        </div>
        </TableStateFrame>
      </TableCell>
    </TableRow>
  );
  },
);
TableLoadingMore.displayName = 'TableLoadingMore';

export {
  isTableCellElement,
  markTableCell,
  Table,
  TableBody,
  TableBadgeCell,
  TableCaption,
  TableCell,
  TableEmpty,
  TableError,
  TableFooter,
  TableHead,
  TableHeader,
  TableLeadCell,
  TableLoading,
  TableLoadingMore,
  TableRow,
  type SortDirection,
  type TableBadgeCellProps,
  type TableCellProps,
  type TableDensity,
  type TableHeaderTone,
  type TableRowHover,
  type TableStickyMode,
  type TableLeadCellProps,
  type TableProps,
};

// --- KNOWN TOKEN GAPS (component-library-maintainer cannot close these from table.tsx — they are
// color VALUES owned by the design tokens; Table only consumes tokens by name and
// must not hardcode a raw hex/palette value around them) ---
//
// 1. No dedicated `table-border-*` token exists (only `table-background-{default,selected}` and
//    `table-foreground-default` are published). Row/header/footer dividers above fall back to the
//    generic semantic `border-default`/`border-muted` tokens (the same tier Card/Input/Checkbox use
//    for their own component-scoped borders) rather than a hardcoded value. A dedicated
//    `table-border-default` (and possibly `table-border-muted` for the lighter row-divider vs. a
//    stronger header/footer rule) would let Table's grid lines be tuned independently of unrelated
//    surfaces that also read `border-muted`.
//
// 2. WCAG 1.4.11 non-text contrast in dark mode (tracks the same root cause already flagged on
//    Alert/Chip as ALERT-TOK-03 / CHIP-A11Y-05): `--semantic-border-muted` (rgb(30 41 59)) against
//    `--colors-table-background-default` (rgb(15 23 42)) computes to only ~1.3:1 in the dark theme —
//    under the 3:1 minimum. Row/header dividers are decorative grid lines rather than an
//    operable-control boundary, so this is flagged as a hygiene gap rather than a blocker; still
//    needs a dedicated, more-separated dark-mode value from design-tokens-maintainer if row/column
//    boundaries ever become load-bearing for comprehension (e.g. a dense financial grid).
//
// 3. No `general-*-selected` token distinct from `-hover`/`-active` exists for the invalid-row tint
//    either (same family of gap as CHIP-MAT-01): a row that is simultaneously `selected` and
//    `invalid` can only show one tint (see the compoundVariants comment above), because there is no
//    token to blend or distinguish the two. The left-accent border (`border-l-general-brand-default`)
//    added below at least keeps a shape-based cue distinct in that combined case, but a dedicated
//    combined "selected + invalid" background treatment would need new token support, not a
//    hardcoded color, to add.
//
// 4. TABLE-A11Y-01 (blocker): `colors/table/background/default`, `colors/table/background/selected`,
//    and `colors/table/foreground/default` are published with a `:root`-only (light) value in
//    `kette-tokens/dist/theme.css` — neither the `.dark` block nor
//    `@media (prefers-color-scheme: dark)` overrides any of the three, so in dark mode Table
//    renders a light/near-black surface island against otherwise-dark chrome. This is a token
//    VALUE gap in the design tokens (`styles/theme.css`), not something table.tsx can fix by
//    changing which token name it binds — needs design-tokens-maintainer to add `.dark` values for
//    all three and verify text-on-surface contrast stays ≥4.5:1 before this can close.
//
// 5. TABLE-A11Y-03: the selected/invalid row background tints are the only *color* differentiator
//    from the default row background (`table-background-selected` vs `table-background-default` is
//    ~1.10:1; the invalid `general-error-default/10` wash is ~1.17:1 — both under the 3:1 a
//    state-bearing UI boundary needs). The left-accent border added to `tableRowVariants` below
//    supplies the required non-color (shape) cue, but the tint values themselves still need to be
//    raised to ≥3:1 against `table-background-default` by design-tokens-maintainer to also serve as
//    a secondary cue for low-vision users — table.tsx cannot raise a token's color value itself.
