'use client';

import { Calendar, Plus } from 'lucide-react';
import {
  Children,
  createContext,
  forwardRef,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  type TdHTMLAttributes,
} from 'react';

import { focusRing, scrollRegionFocusVisible, transitionBase } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { DataStatePanel, SkeletonBar } from '@/components/ui/data-state-panel';
import { edgeClass, useEdge } from '@/components/ui/edge';
import { useScrollRegion } from '@/components/ui/use-scroll-region';
import { useLabels, usePreset } from '@/components/ui/labels-context';

// Full class strings so Tailwind's content scan finds every token.
const projectDot = {
  1: 'bg-data-project-1',
  2: 'bg-data-project-2',
  3: 'bg-data-project-3',
  4: 'bg-data-project-4',
  5: 'bg-data-project-5',
  6: 'bg-data-project-6',
  7: 'bg-data-project-7',
  8: 'bg-data-project-8',
  internal: 'bg-data-internal',
} as const;

const entryTone = {
  default: 'border-transparent bg-muted text-foreground',
  ok: 'border-transparent bg-general-success-container text-general-success-on-container',
  warning: 'border-transparent bg-general-warning-container text-general-warning-on-container',
  error: 'border-transparent bg-general-error-container text-general-error-on-container',
  suggested: 'border-dashed border-hairline bg-transparent text-muted-foreground',
} as const;

export interface WeekGridEntryProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  tone?: keyof typeof entryTone;
  selected?: boolean;
  // Project color slot 1 to 8 or `internal` (data tokens). Omit for no dot.
  project?: keyof typeof projectDot;
  // Custom dot colour (user data): a CSS colour or a token utility such as `bg-data-project-3`. Wins over `project`.
  dotColor?: string;
}

// Time or shift entry inside a calendar cell. Renders a button when interactive, a plain chip otherwise.
const WeekGridEntry = forwardRef<HTMLButtonElement, WeekGridEntryProps>(
  ({ className, tone = 'default', selected, project, dotColor, children, onClick, type = 'button', ...props }, ref) => {
    const zero = usePreset() === 'zero';
    const dotShape = zero ? 'h-2 w-2 rounded-hairline' : 'h-2 w-2 rounded-item';
    const body = (
      <>
        {dotColor ? (
          <span
            aria-hidden="true"
            data-entry-dot=""
            className={cn('shrink-0', dotShape, dotColor.startsWith('bg-') ? dotColor : 'bg-current')}
            style={dotColor.startsWith('bg-') ? undefined : { backgroundColor: dotColor }}
          />
        ) : project ? (
          <span aria-hidden="true" data-entry-dot="" className={cn('shrink-0', dotShape, projectDot[project])} />
        ) : null}
        <span className="min-w-0 truncate">{children}</span>
      </>
    );
    const base = cn(
      'flex w-full min-w-0 items-center rounded-item border border-solid text-left tabular-nums',
      zero ? 'typography-detail gap-label px-label py-micro' : 'typography-ui gap-2 px-2 py-1',
      entryTone[tone],
      selected && 'ring-2 ring-ring',
      className,
    );
    if (!onClick) {
      return (
        <span data-tone={tone} data-selected={selected || undefined} className={base}>
          {body}
        </span>
      );
    }
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        aria-pressed={selected === undefined ? undefined : selected}
        data-tone={tone}
        data-selected={selected || undefined}
        className={cn(base, 'cursor-pointer hover:brightness-95', transitionBase, focusRing)}
        {...props}
      >
        {body}
      </button>
    );
  },
);
WeekGridEntry.displayName = 'WeekGridEntry';

export type WeekGridLayout = 'rows' | 'day-columns';

// Lets rows and cells follow the grid layout without prop drilling.
const WeekGridLayoutContext = createContext<WeekGridLayout>('rows');

export interface WeekGridColumn {
  id: string;
  label: ReactNode;
  today?: boolean;
  weekend?: boolean;
}

export interface WeekGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  'aria-label': string;
  columns: WeekGridColumn[];
  // `rows` (default): one row per project or member with a sticky row header. `day-columns`: no row header, each day is a column whose cells stack their entries from the top.
  layout?: WeekGridLayout;
  // Header of the first column, e.g. "Project" or "Member".
  rowHeaderLabel?: ReactNode;
  // Header of the last column. Omit to render no total column.
  totalLabel?: ReactNode;
  state?: 'default' | 'loading' | 'empty' | 'error';
  // Rows (WeekGridRow) and a WeekGridTotals row.
  children?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  loadingLabel?: string;
  loadingRows?: number;
}

const thClass = 'typography-text-extra-small whitespace-nowrap border-b border-l border-solid border-hairline bg-muted px-2 py-2 text-left font-medium text-muted-foreground first:border-l-0';
// Zero: 12/500 subtle labels, the current day in the brand text colour.
const thClassZero = 'typography-detail whitespace-nowrap border-b border-l border-solid border-border-default bg-muted px-2 py-2 text-left text-text-subtle-on-muted first:border-l-0';
// Sticky first column: stays visible while the day columns scroll inside the container.
const stickyHead = 'sticky left-0 z-sticky w-32 border-r';

const WeekGrid = forwardRef<HTMLDivElement, WeekGridProps>(
  (
    {
      className,
      'aria-label': ariaLabel,
      columns,
      layout = 'rows',
      rowHeaderLabel: rowHeaderLabelProp,
      totalLabel,
      state = 'default',
      children,
      emptyTitle: emptyTitleProp,
      emptyDescription,
      emptyAction,
      errorTitle: errorTitleProp,
      errorDescription: errorDescriptionProp,
      onRetry,
      loadingLabel: loadingLabelProp,
      loadingRows = 4,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const rowHeaderLabel = rowHeaderLabelProp ?? l.weekRowHeader;
    const emptyTitle = emptyTitleProp ?? l.weekEmptyTitle;
    const errorTitle = errorTitleProp ?? l.weekErrorTitle;
    const errorDescription = errorDescriptionProp ?? l.serviceNotResponding;
    const loadingLabel = loadingLabelProp ?? l.weekLoading;
    const zero = usePreset() === 'zero';
    const edge = edgeClass(zero);
    const th = zero ? thClassZero : thClass;
    const dayColumns = layout === 'day-columns';
    const span = columns.length + (dayColumns ? 0 : 1) + (totalLabel != null ? 1 : 0);
    const loading = state === 'loading';
    const scroll = useScrollRegion<HTMLDivElement>();
    return (
      <div
        ref={(node) => {
          scroll.ref.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        aria-busy={loading || undefined}
        role={scroll.overflowing && ariaLabel ? 'region' : undefined}
        aria-label={scroll.overflowing ? ariaLabel : undefined}
        tabIndex={scroll.overflowing ? 0 : undefined}
        className={cn('overflow-x-auto rounded-surface border border-solid bg-card', ...scrollRegionFocusVisible, edge, className)}
        {...props}
      >
        <WeekGridLayoutContext.Provider value={layout}>
        <table data-layout={layout} className="typography-ui w-full min-w-max table-auto border-collapse text-foreground" aria-label={ariaLabel}>
          <thead>
            <tr>
              {dayColumns ? null : (
                <th scope="col" className={cn(th, stickyHead)}>
                  {rowHeaderLabel}
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  aria-current={c.today ? 'date' : undefined}
                  className={cn(th, dayColumns ? 'w-32' : 'w-24', c.today && (zero ? 'text-text-brand-on-subtle' : 'font-semibold text-foreground'))}
                >
                  {c.label}
                </th>
              ))}
              {totalLabel != null ? <th scope="col" className={cn(th, 'w-20 text-right')}>{totalLabel}</th> : null}
            </tr>
          </thead>
          <tbody>
            {state === 'default' ? children : null}
            {loading
              ? Array.from({ length: loadingRows }).map((_, r) => (
                  <tr key={r} className="h-row">
                    {Array.from({ length: span }).map((__, i) => (
                      <td key={i} className={cn('border-l border-t border-solid px-2 first:border-l-0', edge)}>
                        <SkeletonBar className="h-4 w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {state === 'empty' || state === 'error' ? (
              <tr>
                <td colSpan={span} className={cn('border-t border-solid', edge)}>
                  {state === 'empty' ? (
                    <DataStatePanel
                      kind="empty"
                      icon={<Calendar className="h-icon-md w-icon-md" />}
                      title={emptyTitle}
                      description={emptyDescription}
                      action={emptyAction}
                    />
                  ) : (
                    <DataStatePanel kind="error" title={errorTitle} description={errorDescription} onRetry={onRetry} />
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </WeekGridLayoutContext.Provider>
        {loading ? (
          <span role="status" className="sr-only">
            {loadingLabel}
          </span>
        ) : null}
      </div>
    );
  },
);
WeekGrid.displayName = 'WeekGrid';

export interface WeekGridRowProps extends Omit<HTMLAttributes<HTMLTableRowElement>, 'children'> {
  // Row header content (project name, or avatar plus member name). Not rendered in the `day-columns` layout.
  header?: ReactNode;
  // Right aligned total, e.g. "26:00".
  total?: ReactNode;
  // One WeekGridCell per column.
  children?: ReactNode;
}

const cellBase = 'border-l border-t border-solid px-2 py-1 align-middle';

const stickyCell = 'sticky left-0 z-sticky w-32 border-l-0 border-r';

const WeekGridRow = forwardRef<HTMLTableRowElement, WeekGridRowProps>(({ className, header, total, children, ...props }, ref) => {
  const layout = useContext(WeekGridLayoutContext);
  const edge = useEdge();
  return (
    <tr ref={ref} className={cn(layout === 'day-columns' ? 'h-auto' : 'h-row', className)} {...props}>
      {layout === 'day-columns' ? null : (
        <th scope="row" className={cn(cellBase, edge, stickyCell, 'typography-ui bg-card text-left font-normal')}>
          {header}
        </th>
      )}
      {children}
      {total != null ? <td className={cn(cellBase, edge, 'typography-ui-semibold text-right tabular-nums')}>{total}</td> : null}
    </tr>
  );
});
WeekGridRow.displayName = 'WeekGridRow';

export interface WeekGridCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  // Shows an add button while the cell has no children. Called when it is pressed.
  onAdd?: () => void;
  // Accessible name of the add button, e.g. "Log time for DGTL, Mon 6". Defaults to the provider text.
  addLabel?: string;
}

const WeekGridCell = forwardRef<HTMLTableCellElement, WeekGridCellProps>(({ className, onAdd, addLabel, children, ...props }, ref) => {
  const l = useLabels();
  const dayColumns = useContext(WeekGridLayoutContext) === 'day-columns';
  const edge = useEdge();
  return (
    <td ref={ref} className={cn(cellBase, edge, dayColumns && 'align-top', className)} {...props}>
      {dayColumns && Children.toArray(children).length > 0 ? <div className="flex flex-col gap-1">{children}</div> : children}
      {onAdd && Children.toArray(children).length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel ?? l.addEntry}
          className={cn(
            'grid h-control-md w-full cursor-pointer place-items-center rounded-item border border-solid border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            transitionBase,
            focusRing,
          )}
        >
          <Plus aria-hidden="true" className="h-icon-xs w-icon-xs" />
        </button>
      ) : null}
    </td>
  );
});
WeekGridCell.displayName = 'WeekGridCell';

export interface WeekGridTotalsProps extends HTMLAttributes<HTMLTableRowElement> {
  label?: ReactNode;
  values?: ReactNode[];
  total?: ReactNode;
}

const WeekGridTotals = forwardRef<HTMLTableRowElement, WeekGridTotalsProps>(
  ({ className, label: labelProp, values = [], total, ...props }, ref) => {
    const l = useLabels();
    const label = labelProp ?? l.total;
    const dayColumns = useContext(WeekGridLayoutContext) === 'day-columns';
    const edge = useEdge();
    return (
    <tr ref={ref} className={cn('h-row bg-muted', className)} {...props}>
      {dayColumns ? null : (
        <th scope="row" className={cn(cellBase, edge, stickyCell, 'typography-ui-semibold bg-muted text-left')}>
          {label}
        </th>
      )}
      {values.map((v, i) => (
        <td key={i} className={cn(cellBase, edge, 'typography-ui-semibold tabular-nums')}>
          {v}
        </td>
      ))}
      {total != null ? <td className={cn(cellBase, edge, 'typography-ui-semibold text-right tabular-nums')}>{total}</td> : null}
    </tr>
  );
  },
);
WeekGridTotals.displayName = 'WeekGridTotals';

// MonthGrid

export interface MonthGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  'aria-label': string;
  weekdays?: string[];
  state?: 'default' | 'loading' | 'empty' | 'error';
  // MonthGridCell elements, in reading order. Chunked into rows of seven.
  children?: ReactNode;
  // One total per week row, e.g. "32:00". Adds a trailing total column; a missing entry renders an empty cell.
  weekTotals?: ReactNode[];
  // Header of the total column. Defaults to the provider text.
  weekTotalLabel?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  loadingLabel?: string;
  // Number of week rows shown while loading or empty.
  placeholderRows?: number;
  // Five day layout: hides Saturday and Sunday. Pass cells as full Monday to Sunday weeks (seven per row); the weekend cells are dropped from the layout, so weekTotals computed by the caller stay correct.
  weekdaysOnly?: boolean;
}

const MonthGrid = forwardRef<HTMLDivElement, MonthGridProps>(
  (
    {
      className,
      weekdays: weekdaysProp,
      state = 'default',
      children,
      weekTotals,
      weekTotalLabel,
      emptyTitle: emptyTitleProp,
      emptyDescription,
      emptyAction,
      errorTitle: errorTitleProp,
      errorDescription: errorDescriptionProp,
      onRetry,
      loadingLabel: loadingLabelProp,
      placeholderRows = 5,
      weekdaysOnly = false,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const edge = useEdge();
    const dayColumns = weekdaysOnly ? 5 : 7;
    const emptyTitle = emptyTitleProp ?? l.monthEmptyTitle;
    const errorTitle = errorTitleProp ?? l.monthErrorTitle;
    const errorDescription = errorDescriptionProp ?? l.serviceNotResponding;
    const loadingLabel = loadingLabelProp ?? l.monthLoading;
    const weekdays = (weekdaysProp ?? l.weekdaysShort).slice(0, dayColumns);
    const cells = Children.toArray(children);
    const rows: ReactNode[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + dayColumns));
    const withTotals = weekTotals != null;
    // Seven equal day columns plus a fixed total column (width scale token).
    const rowGrid = withTotals
      ? weekdaysOnly
        ? 'grid grid-cols-[repeat(5,minmax(0,1fr))_theme(width.24)]'
        : 'grid grid-cols-[repeat(7,minmax(0,1fr))_theme(width.24)]'
      : weekdaysOnly
        ? 'grid grid-cols-5'
        : 'grid grid-cols-7';
    const totalCell = cn('typography-ui-semibold flex items-start justify-end border-l border-t border-solid bg-muted p-2 tabular-nums', edge);
    const headerRow = (
      <div role="row" className={rowGrid}>
        {weekdays.map((d) => (
          <div
            key={d}
            role="columnheader"
            className={cn('typography-text-extra-small border-b border-l border-solid bg-muted px-2 py-2 font-medium text-muted-foreground first:border-l-0', edge)}
          >
            {d}
          </div>
        ))}
        {withTotals ? (
          <div
            role="columnheader"
            className={cn('typography-text-extra-small border-b border-l border-solid bg-muted px-2 py-2 text-right font-medium text-muted-foreground', edge)}
          >
            {weekTotalLabel ?? l.weekTotal}
          </div>
        ) : null}
      </div>
    );
    return (
      <>
      <div
        ref={ref}
        role="grid"
        aria-busy={state === 'loading' || undefined}
        className={cn('overflow-hidden rounded-surface border border-solid bg-card', edge, className)}
        {...props}
      >
        {headerRow}
        {state === 'default'
          ? rows.map((row, r) => (
              <div key={r} role="row" className={rowGrid}>
                {row}
                {withTotals ? (
                  <div role="gridcell" data-week-total="" className={totalCell}>
                    {weekTotals[r]}
                  </div>
                ) : null}
              </div>
            ))
          : null}
        {state === 'loading'
          ? Array.from({ length: placeholderRows }).map((_, r) => (
              <div key={r} role="row" className={weekdaysOnly ? 'grid grid-cols-5' : 'grid grid-cols-7'}>
                {Array.from({ length: dayColumns }).map((__, c) => (
                  <div key={c} role="gridcell" className={cn('h-month-cell border-l border-t border-solid p-2 first:border-l-0', edge)}>
                    <SkeletonBar className="mb-2 h-3 w-4" />
                    <SkeletonBar className="h-4 w-4/5" />
                  </div>
                ))}
              </div>
            ))
          : null}
        {state === 'empty' ? (
          <div role="row">
            <div role="gridcell" className={cn('border-t border-solid', edge)}>
              <DataStatePanel
                kind="empty"
                icon={<Calendar className="h-icon-md w-icon-md" />}
                title={emptyTitle}
                description={emptyDescription}
                action={emptyAction}
              />
            </div>
          </div>
        ) : null}
        {state === 'error' ? (
          <div role="row">
            <div role="gridcell" className={cn('border-t border-solid', edge)}>
              <DataStatePanel kind="error" title={errorTitle} description={errorDescription} onRetry={onRetry} />
            </div>
          </div>
        ) : null}
      </div>
      {state === 'loading' ? (
        // A status is not allowed as a child of a grid, so it sits next to it.
        <span role="status" className="sr-only">
          {loadingLabel}
        </span>
      ) : null}
      </>
    );
  },
);
MonthGrid.displayName = 'MonthGrid';

export interface MonthGridCellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  // Day number shown top left.
  day: ReactNode;
  // Full date for assistive tech, e.g. "Thursday 14 March".
  label?: string;
  // Day belongs to the previous or next month.
  outside?: boolean;
  // Weekend or non working day: muted surface.
  nonWorking?: boolean;
  // Public holiday: tinted surface and a visually hidden "Holiday" prefix (provider text) unless `note` already names it.
  holiday?: boolean;
  today?: boolean;
  selected?: boolean;
  disabled?: boolean;
  // Short note instead of entries, e.g. "Vacation" or "Holiday".
  note?: ReactNode;
  // Makes the whole cell a button. Entries inside stay independently focusable.
  onSelectDay?: () => void;
  // Shows an add button in the cell corner. Called when it is pressed.
  onAdd?: () => void;
  // Accessible name of the add button. Defaults to the provider text plus the date label.
  addLabel?: string;
}

const MonthGridCell = forwardRef<HTMLDivElement, MonthGridCellProps>(
  ({ className, day, label, outside, nonWorking, holiday, today, selected, disabled, note, onSelectDay, onAdd, addLabel, children, ...props }, ref) => {
    const l = useLabels();
    const edge = useEdge();
    return (
    <div
      ref={ref}
      role="gridcell"
      aria-selected={selected === undefined ? undefined : selected}
      aria-current={today ? 'date' : undefined}
      aria-disabled={disabled || undefined}
      data-outside={outside || undefined}
      data-holiday={holiday || undefined}
      data-selected={selected || undefined}
      className={cn(
        // Min-height from the month-cell size token (no minHeight token exists yet) so content can grow the row
        'relative flex min-h-[theme(height.month-cell)] flex-col gap-1 border-l border-t border-solid p-2 first:border-l-0',
        edge,
        (outside || nonWorking) && 'bg-muted',
        holiday && !outside && 'bg-general-warning-container',
        selected && 'z-raised bg-accent ring-2 ring-inset ring-ring',
        disabled && 'pointer-events-none opacity-disabled',
        className,
      )}
      {...props}
    >
      {onSelectDay ? (
        <button
          type="button"
          onClick={onSelectDay}
          aria-label={label ?? (typeof day === 'string' || typeof day === 'number' ? String(day) : undefined)}
          className={cn('absolute inset-0 rounded-item', focusRing)}
        />
      ) : null}
      <span
        className={cn(
          'typography-text-extra-small tabular-nums',
          !today && (outside ? 'text-muted-foreground' : 'text-foreground'),
          // Today: filled circle around the number. The inverse pair holds >= 17:1 in every theme and mode, which the brand fill does not (bright brand colours stay below 4.5:1 with any text colour).
          today && 'inline-flex h-6 w-6 items-center justify-center self-start rounded-full bg-background-inverse font-semibold text-text-inverse',
          holiday && !outside && !today && 'font-semibold text-general-warning-on-container',
          selected && 'font-semibold',
        )}
      >
        {holiday && !note ? <span className="sr-only">{l.holiday}, </span> : null}
        {day}
      </span>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel ?? (label ? `${l.addEntry}, ${label}` : l.addEntry)}
          className={cn(
            'absolute right-1 top-1 z-raised grid h-6 w-6 cursor-pointer place-items-center rounded-item border border-solid border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            transitionBase,
            focusRing,
          )}
        >
          <Plus aria-hidden="true" className="h-icon-xs w-icon-xs" />
        </button>
      ) : null}
      {note ? <span className={cn('typography-text-extra-small', holiday && !outside ? 'text-general-warning-on-container' : 'text-muted-foreground')}>{note}</span> : null}
      {children ? <div className="relative flex min-w-0 flex-col gap-1">{children}</div> : null}
    </div>
    );
  },
);
MonthGridCell.displayName = 'MonthGridCell';

export { MonthGrid, MonthGridCell, WeekGrid, WeekGridCell, WeekGridEntry, WeekGridRow, WeekGridTotals };
