'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';
import { Checkbox } from './checkbox';
import { Pagination, type PaginationProps } from './pagination';
import { useLabels } from './labels-context';
import { Skeleton } from './skeleton';
import {
  isTableCellElement,
  type SortDirection,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableError,
  TableFooter,
  TableHead,
  TableHeader,
  TableLoadingMore,
  TableRow,
  phoneDefaultOf,
  type TableCellPhone,
  type TableProps,
} from './table';

// Data-driven grid built on the Table primitives: columns definition, row selection, sorting, density, state rows and a pager footer.
type DataGridDensity = 'default' | 'compact';
type DataGridAlign = 'left' | 'center' | 'right';
// Row height: `default` is the single-line row, `two-line` fits a title with a subtitle (Table row-two-line size).
type DataGridRowHeight = 'default' | 'two-line';
// Fixed column widths from the Figma Table first column variants (160, 200, 240, 360, 440). Unset columns share the remaining width.
// `fit` shrinks the column to its content on one line (icon, badge, date, amount). `fill` takes the width the other columns leave and lets its content truncate (the title column).
type DataGridColumnWidth = 160 | 200 | 240 | 360 | 440 | 'fit' | 'fill';

// Bound to the `size-column-<n>` sizing tokens. The fallback keeps the Figma value until the token ships in the installed tokens version.
const columnWidthClass: Record<DataGridColumnWidth, string> = {
  160: 'w-[var(--size-column-160,160px)] min-w-[var(--size-column-160,160px)] max-w-[var(--size-column-160,160px)]',
  200: 'w-[var(--size-column-200,200px)] min-w-[var(--size-column-200,200px)] max-w-[var(--size-column-200,200px)]',
  240: 'w-[var(--size-column-240,240px)] min-w-[var(--size-column-240,240px)] max-w-[var(--size-column-240,240px)]',
  360: 'w-[var(--size-column-360,360px)] min-w-[var(--size-column-360,360px)] max-w-[var(--size-column-360,360px)]',
  440: 'w-[var(--size-column-440,440px)] min-w-[var(--size-column-440,440px)] max-w-[var(--size-column-440,440px)]',
  // w-px lets the auto table layout give the column only its min-content width; nowrap makes that one line. Needs the auto layout: in a table-fixed table the column would be 1px.
  fit: 'w-px whitespace-nowrap',
  // max-w-0 stops the auto layout from growing the column to its text, so truncate inside works; min-w keeps a readable title next to many fit columns.
  fill: 'w-full min-w-[var(--size-column-200,200px)] max-w-0',
};

interface DataGridColumn<T> {
  id: string;
  header: React.ReactNode;
  // Cell renderer. Without it the cell shows `String(row[id])`.
  cell?: (row: T, index: number) => React.ReactNode;
  align?: DataGridAlign;
  // Shows the sort button in the header. Sorting is client side when `sortValue` is set, otherwise the consumer sorts via `onSortChange`.
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  // Hides the column on narrow viewports: `2` below md, `3` below lg. `1` (default) always shows. In a `phone="list"` grid the list takes over below 768px and `phone` decides what shows there.
  priority?: 1 | 2 | 3;
  className?: string;
  // Pins the column to the start edge while the grid scrolls sideways (opaque in every row state, edge shadow while scrolled). Use it on the first column; with `selectable` the checkbox column pins too.
  pinned?: boolean;
  // Fixed width in px from the Figma column presets: 160, 200, 240, 360 or 440, the cell content truncates inside it. `fit` sizes the column to its one-line content, `fill` gives it the rest of the width (one `fill` column per grid).
  width?: DataGridColumnWidth;
  // How `cell` output is placed. `auto` (default) uses a returned TableCell-based component (TableLeadCell, TableBadgeCell, TableActionsCell, ...)
  // as the cell itself and wraps anything else in a TableCell. `element` always uses the output as the cell, `cell` always wraps it.
  cellAs?: 'auto' | 'cell' | 'element';
  // Place of the column in the phone list (`phone="list"` on the grid): `lead`, `title`, `subtitle`, `value`, `meta` or `hidden`. Once one column sets it, columns without it hide in the list. Without any, the first column is the title, the second the subtitle, the last the value. A role wins over `priority` in the list.
  phone?: TableCellPhone;
}

interface DataGridSort {
  columnId: string;
  direction: Exclude<SortDirection, false>;
}

interface DataGridPagination
  extends Pick<
    PaginationProps,
    'page' | 'defaultPage' | 'onPageChange' | 'pageSize' | 'pageSizeOptions' | 'onPageSizeChange' | 'total' | 'rangeText' | 'perPageText' | 'loadingText'
  > {}

interface DataGridProps<T> extends Omit<TableProps, 'density' | 'children'> {
  columns: DataGridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  // Accessible name of the table (rendered as a screen reader caption).
  label?: string;
  density?: DataGridDensity;
  // `two-line` gives every row the two-line height for cells that stack a title and a subtitle (see DataGridTwoLine).
  rowHeight?: DataGridRowHeight;
  // Row selection with a leading checkbox column. Controlled via `selectedIds`, uncontrolled via `defaultSelectedIds`.
  selectable?: boolean;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  // Sorting. Controlled via `sort`, uncontrolled via `defaultSort`.
  sort?: DataGridSort | null;
  defaultSort?: DataGridSort | null;
  onSortChange?: (sort: DataGridSort | null) => void;
  // Row whose record is open in a side sheet. Gets the active wash and `aria-current`, independent of selection (`aria-selected`).
  activeRowId?: string | null;
  // Makes rows actionable (hover, tab stop, Enter and Space).
  onRowClick?: (row: T) => void;
  getRowLabel?: (row: T) => string;
  // State rows from Table: loading skeleton, error with retry, empty.
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyActions?: React.ReactNode;
  // Pager footer (compact Pagination). Slices `rows` client side unless `total` is given, then `rows` is the current page.
  pagination?: DataGridPagination;
  loadingRows?: number;
  // While `loading` the skeleton body keeps the height the previous page had, so the pager and everything below do not jump (rows of a phone list are two lines, `loadingRows` alone is not enough). Needs a page to have been shown before; a first load has no height to keep.
  keepHeightWhileLoading?: boolean;
  // Lazy loading footer row (use instead of `pagination`). `hasMore` offers the Load more button via `onLoadMore`, `loadingMore` shows the live loading status.
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMoreLabel?: string;
  loadingMoreLabel?: string;
  selectAllLabel?: string;
  selectRowLabel?: string | ((row: unknown) => string);
}

const priorityClass = { 1: '', 2: 'max-md:hidden', 3: 'max-lg:hidden' } as const;

const toComparable = (value: string | number | Date | null | undefined) => (value instanceof Date ? value.getTime() : value);

const compareValues = (a: ReturnType<typeof toComparable>, b: ReturnType<typeof toComparable>) => {
  // Empty values sort last in both directions, handled by the caller.
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

function DataGridInner<T>(
  {
    columns,
    rows,
    getRowId,
    label,
    density = 'default',
    rowHeight,
    selectable = false,
    selectedIds: selectedIdsProp,
    defaultSelectedIds = [],
    onSelectedIdsChange,
    sort: sortProp,
    defaultSort = null,
    onSortChange,
    activeRowId,
    onRowClick,
    getRowLabel,
    loading = false,
    error = false,
    onRetry,
    emptyTitle,
    emptyDescription,
    emptyActions,
    pagination,
    loadingRows = 5,
    keepHeightWhileLoading = false,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
    loadMoreLabel,
    loadingMoreLabel,
    selectAllLabel,
    selectRowLabel,
    className,
    ...tableProps
  }: DataGridProps<T>,
  ref: React.ForwardedRef<HTMLTableElement>,
) {
  const l = useLabels({ selectAllRows: selectAllLabel, selectRow: typeof selectRowLabel === 'string' ? selectRowLabel : undefined });

  const [innerSelected, setInnerSelected] = React.useState<string[]>(defaultSelectedIds);
  const selectedControlled = selectedIdsProp !== undefined;
  const selected = selectedControlled ? selectedIdsProp : innerSelected;
  const setSelected = (next: string[]) => {
    if (!selectedControlled) setInnerSelected(next);
    onSelectedIdsChange?.(next);
  };

  const [innerSort, setInnerSort] = React.useState<DataGridSort | null>(defaultSort);
  const sort = sortProp !== undefined ? sortProp : innerSort;
  const changeSort = (columnId: string) => {
    // Cycle ascending, descending, none.
    const next: DataGridSort | null =
      sort?.columnId !== columnId ? { columnId, direction: 'asc' } : sort.direction === 'asc' ? { columnId, direction: 'desc' } : null;
    if (sortProp === undefined) setInnerSort(next);
    onSortChange?.(next);
  };

  const sorted = React.useMemo(() => {
    const column = sort ? columns.find((c) => c.id === sort.columnId) : undefined;
    if (!sort || !column?.sortValue) return rows;
    const read = column.sortValue;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = toComparable(read(a));
      const vb = toComparable(read(b));
      const emptyA = va === null || va === undefined || va === '';
      const emptyB = vb === null || vb === undefined || vb === '';
      if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
      return factor * compareValues(va, vb);
    });
  }, [rows, columns, sort]);

  const [innerPage, setInnerPage] = React.useState(pagination?.defaultPage ?? 1);
  const [innerPageSize, setInnerPageSize] = React.useState(pagination?.pageSize ?? pagination?.pageSizeOptions?.[0] ?? 20);
  const pageSize = pagination?.pageSize ?? innerPageSize;
  const serverSide = pagination?.total !== undefined;
  const total = pagination ? pagination.total ?? sorted.length : 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, pagination?.page ?? innerPage), pageCount);
  const visible = pagination && !serverSide ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const ids = visible.map(getRowId);
  const selectedOnPage = ids.filter((id) => selected.includes(id));
  const allChecked: boolean | 'indeterminate' = ids.length > 0 && selectedOnPage.length === ids.length ? true : selectedOnPage.length > 0 ? 'indeterminate' : false;
  const toggleAll = (checked: boolean | 'indeterminate') => {
    setSelected(checked === true ? Array.from(new Set([...selected, ...ids])) : selected.filter((id) => !ids.includes(id)));
  };
  const toggleRow = (id: string, checked: boolean | 'indeterminate') => {
    setSelected(checked === true ? [...selected, id] : selected.filter((x) => x !== id));
  };

  const columnCount = columns.length + (selectable ? 1 : 0);
  const compact = density === 'compact';
  const pinnedSelect = selectable && columns.some((c) => c.pinned);
  // With a pinned checkbox column the pinned data column sticks right after it.
  const pinnedClass = (column: DataGridColumn<T>) => (column.pinned && selectable ? 'left-[var(--size-table-select)]' : undefined);
  // Layout of the last loaded page, read after every render of the row state: header widths per column and the body height. The skeleton rows reuse it, so a load does not move the columns or the pager.
  const headerRef = React.useRef<HTMLTableSectionElement>(null);
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  const loadedLayout = React.useRef<{ widths: Record<string, number>; height: number; area: number; table: number }>({ widths: {}, height: 0, area: 0, table: 0 });
  // Visible width of the scroll area while loading, so the frozen widths shrink with the window (KETTE-94 QA-KB-01).
  const [loadingArea, setLoadingArea] = React.useState<number | undefined>(undefined);
  const scrollArea = () => headerRef.current?.closest('table')?.parentElement ?? null;
  const state = loading ? 'loading' : error ? 'error' : visible.length === 0 ? 'empty' : 'rows';
  // Reads the header widths and the body height of the loaded page into the ref.
  const measureLayout = React.useCallback(() => {
    const cells = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('th') ?? []);
    const offset = selectable ? 1 : 0;
    const widths: Record<string, number> = {};
    columns.forEach((column, index) => {
      const cell = cells[index + offset];
      // The phone list lays cells out as blocks, their width says nothing about a table column.
      if (!cell || getComputedStyle(cell).display !== 'table-cell') return;
      if (cell.offsetWidth > 0) widths[column.id] = cell.offsetWidth;
    });
    loadedLayout.current = { widths, height: bodyRef.current?.offsetHeight ?? 0, area: scrollArea()?.clientWidth ?? 0, table: scrollArea()?.querySelector('table')?.offsetWidth ?? 0 };
  }, [columns, selectable]);
  // Measures after every render of the row state, and again whenever the header or the body changes size (web font load, window resize), so the skeleton never forces stale widths.
  React.useLayoutEffect(() => {
    if (state !== 'rows') return undefined;
    measureLayout();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measureLayout);
    headerRef.current?.querySelectorAll('th').forEach((cell) => observer.observe(cell));
    if (bodyRef.current) observer.observe(bodyRef.current);
    // The scroll area can change without any header cell changing (a table that scrolls sideways).
    const area = scrollArea();
    if (area) observer.observe(area);
    return () => observer.disconnect();
  });
  // While loading, follows the width of the scroll area. The frozen widths are scaled down when the area got narrower than it was at measuring, so the skeleton table never outgrows its container.
  React.useLayoutEffect(() => {
    if (state !== 'loading') return undefined;
    const area = scrollArea();
    if (!area) return undefined;
    const read = () => setLoadingArea(area.clientWidth);
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(area);
    return () => observer.disconnect();
  }, [state]);
  // Frozen widths of the skeleton cells. The sum never exceeds the scroll area (QA-K2-03: rounded cell widths made the table 1px wider than its area). A grid that scrolled sideways when it was measured keeps its proportions and only follows the area when that shrinks.
  const loadedWidth = (column: DataGridColumn<T>): React.CSSProperties | undefined => {
    const { widths, area, table } = loadedLayout.current;
    const frozen = column.width ? undefined : widths[column.id];
    if (!frozen) return undefined;
    const current = loadingArea !== undefined && loadingArea > 0 ? loadingArea : area;
    const flexible = columns.reduce((sum, c) => sum + (c.width ? 0 : widths[c.id] ?? 0), 0);
    let scale = area > 0 && current < area ? current / area : 1;
    // The table fitted its area (within rounding): the whole table, the fixed columns included, has to fit the current area.
    if (table > 0 && area > 0 && table <= area + 1 && flexible > 0) {
      const target = Math.min(table, current) - (table - flexible);
      scale = Math.max(0, Math.min(1, target / flexible));
    }
    const width = Math.floor(frozen * scale);
    return { width, minWidth: width, maxWidth: width };
  };
  const keptHeight = keepHeightWhileLoading && state === 'loading' && loadedLayout.current.height > 0 ? loadedLayout.current.height : undefined;
  const rowName = (row: T) => (typeof selectRowLabel === 'function' ? selectRowLabel(row) : getRowLabel ? `${l.selectRow}: ${getRowLabel(row)}` : l.selectRow);

  return (
    <Table
      ref={ref}
      // Permanently mounted live region inside the table root: a status inserted together with its text is not announced everywhere.
      announcement={loading ? l.loadingTableData : ''}
      density={compact ? 'zero-compact' : 'zero'}
      headerTone="muted"
      rowHover="table"
      aria-busy={loading || undefined}
      // Compact drops the type one step: head 13 to 12, cell 16 to 14.
      className={cn(compact && '[&_th]:!typography-text-extra-small [&_td]:!typography-text-small', className)}
      {...tableProps}
    >
      {label ? <TableCaption className="sr-only">{label}</TableCaption> : null}
      <TableHeader ref={headerRef}>
        <TableRow>
          {selectable ? (
            // The select-all bar of the phone list shows only with rows to select (no bar over loading, empty or error).
            <TableHead select pinned={pinnedSelect} phone={state === 'rows' ? undefined : 'hidden'}>
              <Checkbox size="sm" aria-label={l.selectAllRows} checked={allChecked} disabled={state !== 'rows'} onCheckedChange={toggleAll} />
            </TableHead>
          ) : null}
          {columns.map((column) => (
            <TableHead
              key={column.id}
              align={column.align}
              pinned={column.pinned}
              sortable={column.sortable}
              sortDirection={sort?.columnId === column.id ? sort.direction : false}
              onSort={column.sortable ? () => changeSort(column.id) : undefined}
              phone={column.phone}
              className={cn(priorityClass[column.priority ?? 1], column.width && columnWidthClass[column.width], pinnedClass(column), column.className)}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody ref={bodyRef} style={keptHeight ? { height: keptHeight } : undefined}>
        {state === 'loading' ? (
          // One skeleton cell per column with the same width, priority and pin classes as the real cells, so the columns stay under their headers.
          Array.from({ length: loadingRows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {selectable ? (
                <TableCell select pinned={pinnedSelect}>
                  <Skeleton aria-hidden="true" className="h-4 w-4" />
                </TableCell>
              ) : null}
              {columns.map((column, colIndex) => (
                <TableCell
                  key={column.id}
                  pinned={column.pinned}
                  rowHeight={rowHeight}
                  phone={column.phone}
                  align={column.align === 'right' ? 'right' : undefined}
                  style={rowIndex === 0 ? loadedWidth(column) : undefined}
                  className={cn(column.align === 'center' && 'text-center', priorityClass[column.priority ?? 1], column.width && columnWidthClass[column.width], pinnedClass(column), column.className)}
                >
                  <Skeleton aria-hidden="true" className={cn('h-3 max-w-full', column.align === 'right' && 'ml-auto', column.align === 'center' && 'mx-auto', colIndex === 0 ? 'w-3/4' : 'w-1/2')} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : null}
        {state === 'error' ? <TableError columns={columnCount} onRetry={onRetry} /> : null}
        {state === 'empty' ? <TableEmpty columns={columnCount} title={emptyTitle} description={emptyDescription} actions={emptyActions} /> : null}
        {state === 'rows'
          ? visible.map((row, index) => {
              const id = getRowId(row);
              const isSelected = selected.includes(id);
              return (
                <TableRow
                  key={id}
                  selected={isSelected}
                  active={activeRowId !== undefined && activeRowId !== null && id === activeRowId}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  aria-label={onRowClick && getRowLabel ? getRowLabel(row) : undefined}
                >
                  {selectable ? (
                    // Keeps a checkbox click from activating the row. A click elsewhere in the cell toggles the row too, so the whole cell is the hit area.
                    <TableCell
                      select
                      pinned={pinnedSelect}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!(event.target as Element).closest('[data-slot="checkbox"]')) toggleRow(id, !isSelected);
                      }}
                    >
                      <Checkbox size="sm" aria-label={rowName(row)} checked={isSelected} onCheckedChange={(checked) => toggleRow(id, checked)} />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => {
                    const content = column.cell ? column.cell(row, index) : String((row as Record<string, unknown>)[column.id] ?? '');
                    const asElement = column.cellAs === 'element' || (column.cellAs !== 'cell' && isTableCellElement(content));
                    const columnClass = cn(column.align === 'center' && 'text-center', priorityClass[column.priority ?? 1], column.width && columnWidthClass[column.width], pinnedClass(column), column.className);
                    if (asElement && React.isValidElement<{ className?: string; align?: 'left' | 'right'; rowHeight?: DataGridRowHeight; pinned?: boolean; phone?: TableCellPhone }>(content)) {
                      // A cell component returned by `cell` is the td itself, so the row keeps valid table markup.
                      return React.cloneElement(content, {
                        key: column.id,
                        className: cn(columnClass, content.props.className),
                        align: content.props.align ?? (column.align === 'right' ? 'right' : undefined),
                        pinned: content.props.pinned ?? column.pinned,
                        rowHeight: content.props.rowHeight ?? rowHeight,
                        // A per-row control cell (actions, toggle, button) stays out of the phone list even when its column has a role, unless it sets one itself.
                        phone: content.props.phone ?? (column.phone && phoneDefaultOf(content) === 'hidden' ? 'hidden' : column.phone),
                      });
                    }
                    return (
                      <TableCell key={column.id} pinned={column.pinned} rowHeight={rowHeight} phone={column.phone} align={column.align === 'right' ? 'right' : undefined} className={columnClass}>
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          : null}
        {state === 'rows' && !pagination && (loadingMore || (hasMore && onLoadMore)) ? (
          <TableLoadingMore columns={columnCount} loading={loadingMore} onLoadMore={onLoadMore} label={loadMoreLabel} loadingLabel={loadingMoreLabel} />
        ) : null}
      </TableBody>
      {pagination ? (
        <TableFooter className="bg-card">
          <TableRow className="border-0">
            <TableCell colSpan={columnCount} className="h-auto p-0">
              <Pagination
                variant="compact"
                page={page}
                total={total}
                pageSize={pageSize}
                pageSizeOptions={pagination.pageSizeOptions}
                rangeText={pagination.rangeText}
                perPageText={pagination.perPageText}
                loading={loading || loadingMore}
                announce={!loading}
                loadingText={pagination.loadingText}
                onPageChange={(next) => {
                  if (pagination.page === undefined) setInnerPage(next);
                  pagination.onPageChange?.(next);
                }}
                onPageSizeChange={
                  pagination.pageSizeOptions || pagination.onPageSizeChange
                    ? (size) => {
                        if (pagination.pageSize === undefined) setInnerPageSize(size);
                        setInnerPage(1);
                        pagination.onPageSizeChange?.(size);
                      }
                    : undefined
                }
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}

// Generic forwardRef keeps the row type inferred from `rows` and `columns`.
const DataGrid = React.forwardRef(DataGridInner) as <T>(props: DataGridProps<T> & { ref?: React.ForwardedRef<HTMLTableElement> }) => ReturnType<typeof DataGridInner>;
(DataGrid as unknown as { displayName: string }).displayName = 'DataGrid';

interface DataGridTwoLineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

// Title with a subtitle for a DataGrid `cell` in a `rowHeight="two-line"` grid. Both lines truncate.
// A text title or subtitle carries its full text as a native tooltip, so a truncated line stays readable on hover.
const DataGridTwoLine = React.forwardRef<HTMLDivElement, DataGridTwoLineProps>(({ title, subtitle, className, ...props }, ref) => (
  <div ref={ref} className={cn('flex min-w-0 flex-col', className)} {...props}>
    <span className="typography-ui-medium truncate text-text-default" title={typeof title === 'string' ? title : undefined}>
      {title}
    </span>
    {subtitle ? (
      <span className="typography-text-extra-small truncate text-text-subtle" title={typeof subtitle === 'string' ? subtitle : undefined}>
        {subtitle}
      </span>
    ) : null}
  </div>
));
DataGridTwoLine.displayName = 'DataGridTwoLine';

export { DataGrid, DataGridTwoLine, type DataGridTwoLineProps, type DataGridRowHeight, type DataGridAlign, type DataGridColumn, type DataGridColumnWidth, type DataGridDensity, type DataGridPagination, type DataGridProps, type DataGridSort };
