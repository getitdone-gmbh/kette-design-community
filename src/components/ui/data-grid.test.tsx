import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DataGrid, DataGridTwoLine, type DataGridColumn } from './data-grid';
import { Chip } from './chip';
import { TableBadgeCell, TableLeadCell } from './table';
import { TableActionsCell } from './table-cells';
import { DesignSystemProvider } from './design-system-provider';

interface Demand {
  id: string;
  title: string;
  applications: number;
}

const rows: Demand[] = [
  { id: 'a', title: 'Frontend', applications: 14 },
  { id: 'b', title: 'Agile Coach', applications: 0 },
  { id: 'c', title: 'Data Engineer', applications: 7 },
];

const columns: DataGridColumn<Demand>[] = [
  { id: 'title', header: 'Demand', sortable: true, sortValue: (r) => r.title },
  { id: 'applications', header: 'Applic.', align: 'right', sortable: true, sortValue: (r) => r.applications, priority: 3 },
];

const firstColumn = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);

describe('DataGrid', () => {
  it('renders a native table from the column definition with a named caption', () => {
    render(<DataGrid label="Demands" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.getByRole('table', { name: 'Demands' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(firstColumn()).toEqual(['Frontend', 'Agile Coach', 'Data Engineer']);
    expect(screen.getByRole('columnheader', { name: /Applic/ })).toHaveClass('text-right');
  });

  it('sorts client side with aria-sort and cycles asc, desc, none', async () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    const head = screen.getByRole('columnheader', { name: /Demand/ });
    expect(head).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(within(head).getByRole('button'));
    expect(head).toHaveAttribute('aria-sort', 'ascending');
    expect(firstColumn()).toEqual(['Agile Coach', 'Data Engineer', 'Frontend']);
    await userEvent.click(within(head).getByRole('button'));
    expect(head).toHaveAttribute('aria-sort', 'descending');
    expect(firstColumn()).toEqual(['Frontend', 'Data Engineer', 'Agile Coach']);
    await userEvent.click(within(head).getByRole('button'));
    expect(head).toHaveAttribute('aria-sort', 'none');
    expect(firstColumn()).toEqual(['Frontend', 'Agile Coach', 'Data Engineer']);
  });

  it('reports sort changes and leaves row order to the consumer without sortValue', async () => {
    const onSortChange = vi.fn();
    render(<DataGrid columns={[{ id: 'title', header: 'Demand', sortable: true }]} rows={rows} getRowId={(r) => r.id} onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Demand/ }));
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'title', direction: 'asc' });
    expect(firstColumn()).toEqual(['Frontend', 'Agile Coach', 'Data Engineer']);
  });

  it('selects rows and all rows with labelled checkboxes and an indeterminate header', async () => {
    const onSelectedIdsChange = vi.fn();
    render(<DataGrid selectable columns={columns} rows={rows} getRowId={(r) => r.id} onSelectedIdsChange={onSelectedIdsChange} />);
    const all = screen.getByRole('checkbox', { name: 'Select all rows' });
    const rowBoxes = screen.getAllByRole('checkbox', { name: 'Select row' });
    expect(rowBoxes).toHaveLength(3);
    await userEvent.click(rowBoxes[0]);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['a']);
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(all);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
    await userEvent.click(all);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
  });

  // R-PAGES-04 (L-22, moved to the library DataGrid): the whole selection cell is the hit area.
  it('toggles the row when the selection cell around the checkbox is clicked, without activating the row', async () => {
    const onSelectedIdsChange = vi.fn();
    const onRowClick = vi.fn();
    render(<DataGrid selectable columns={columns} rows={rows} getRowId={(r) => r.id} onSelectedIdsChange={onSelectedIdsChange} onRowClick={onRowClick} />);
    const box = screen.getAllByRole('checkbox', { name: 'Select row' })[1];
    const cell = box.closest('td') as HTMLElement;
    await userEvent.click(cell);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['b']);
    expect(box).toBeChecked();
    await userEvent.click(cell);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
    // A click on the checkbox itself counts once.
    await userEvent.click(box);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['b']);
    expect(onSelectedIdsChange).toHaveBeenCalledTimes(3);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('selects with the keyboard and does not activate the row', async () => {
    const onRowClick = vi.fn();
    render(<DataGrid selectable columns={columns} rows={rows} getRowId={(r) => r.id} onRowClick={onRowClick} />);
    screen.getAllByRole('checkbox', { name: 'Select row' })[1].focus();
    await userEvent.keyboard(' ');
    expect(screen.getAllByRole('checkbox', { name: 'Select row' })[1]).toBeChecked();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('makes rows actionable with Enter', async () => {
    const onRowClick = vi.fn();
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} onRowClick={onRowClick} getRowLabel={(r) => `Open ${r.title}`} />);
    screen.getByRole('row', { name: 'Open Frontend' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('compact density uses the compact row and drops the type a step', () => {
    render(<DataGrid density="compact" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.getByRole('table').className).toContain('typography-text-small');
    expect(screen.getAllByRole('cell')[0]).toHaveClass('h-row-compact');
  });

  it('hides low priority columns on narrow viewports via classes', () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.getByRole('columnheader', { name: /Applic/ })).toHaveClass('max-lg:hidden');
  });

  it('shows the loading, error and empty states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<DataGrid loading columns={columns} rows={[]} getRowId={(r) => r.id} />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading table data');
    rerender(<DataGrid error onRetry={onRetry} columns={columns} rows={rows} getRowId={(r) => r.id} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<DataGrid columns={columns} rows={[]} emptyTitle="No demands" getRowId={(r) => r.id} />);
    expect(screen.getByText('No demands')).toBeInTheDocument();
  });

  it('renders one skeleton cell per column while loading, aligned with the headers', () => {
    render(<DataGrid selectable loading loadingRows={3} columns={columns} rows={[]} getRowId={(r) => r.id} />);
    const body = screen.getAllByRole('row').slice(1);
    expect(body).toHaveLength(3);
    body.forEach((row) => expect(within(row).getAllByRole('cell')).toHaveLength(columns.length + 1));
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('announces a load through a live region that is mounted before the load starts (A11Y-KB-06)', () => {
    const { rerender } = render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();
    rerender(<DataGrid loading columns={columns} rows={[]} getRowId={(r) => r.id} />);
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Loading table data');
    rerender(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(region).toBeEmptyDOMElement();
  });

  it('keeps a single root element, the live region sits inside it next to the table', () => {
    const { container } = render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toContainElement(screen.getByRole('status'));
    expect(screen.getByRole('table')).not.toContainElement(screen.getByRole('status'));
  });

  it('keeps the footer silent on first load and announces only loadingMore', () => {
    const pagination = { pageSize: 10 };
    const { rerender } = render(<DataGrid loading columns={columns} rows={[]} getRowId={(r) => r.id} pagination={pagination} />);
    expect(screen.getByText('Loading…').closest('[aria-live]')).toHaveAttribute('aria-live', 'off');
    rerender(<DataGrid loadingMore columns={columns} rows={rows} getRowId={(r) => r.id} pagination={pagination} />);
    expect(screen.getByText('Loading…').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('pages client side and server side', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ id: String(i), title: `Row ${i + 1}`, applications: i }));
    const { rerender } = render(<DataGrid columns={columns} rows={many} getRowId={(r) => r.id} pagination={{ pageSize: 10 }} />);
    expect(screen.getAllByRole('row')).toHaveLength(1 + 10 + 1);
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(firstColumn().slice(0, 5)).toEqual(['Row 21', 'Row 22', 'Row 23', 'Row 24', 'Row 25']);
    const onPageChange = vi.fn();
    rerender(<DataGrid columns={columns} rows={many.slice(0, 10)} getRowId={(r) => r.id} pagination={{ pageSize: 10, total: 100, page: 1, onPageChange }} />);
    expect(screen.getAllByRole('row')).toHaveLength(1 + 10 + 1);
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('uses German labels from the provider', () => {
    render(
      <DesignSystemProvider locale="de">
        <DataGrid selectable columns={columns} rows={rows} getRowId={(r) => r.id} />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('checkbox', { name: 'Alle Zeilen auswählen' })).toBeInTheDocument();
  });
});

describe('DataGrid two-line rows', () => {
  it('applies the two-line row height to every cell and renders title with subtitle', () => {
    const cols: DataGridColumn<Demand>[] = [
      { id: 'title', header: 'Demand', cell: (r) => <DataGridTwoLine title={r.title} subtitle={`${r.applications} applications`} /> },
      { id: 'applications', header: 'Applic.' },
    ];
    render(<DataGrid rowHeight="two-line" columns={cols} rows={rows} getRowId={(r) => r.id} />);
    const cells = screen.getAllByRole('cell');
    expect(cells.every((cell) => cell.classList.contains('h-row-two-line'))).toBe(true);
    expect(within(cells[0]).getByText('Frontend')).toBeInTheDocument();
    expect(within(cells[0]).getByText('14 applications')).toHaveClass('text-text-subtle');
  });

  it('gives a text title and subtitle their full text as tooltip', () => {
    render(<DataGridTwoLine title="Senior Platform Engineer Kubernetes" subtitle="Hansa Logistik Nord GmbH" />);
    expect(screen.getByText('Senior Platform Engineer Kubernetes')).toHaveAttribute('title', 'Senior Platform Engineer Kubernetes');
    expect(screen.getByText('Senior Platform Engineer Kubernetes')).toHaveClass('truncate');
    expect(screen.getByText('Hansa Logistik Nord GmbH')).toHaveAttribute('title', 'Hansa Logistik Nord GmbH');
  });

  it('sets no tooltip for an element title', () => {
    render(<DataGridTwoLine title={<b>Bold</b>} />);
    expect(screen.getByText('Bold').parentElement).not.toHaveAttribute('title');
  });

  it('keeps the single-line height by default', () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.getAllByRole('cell')[0]).not.toHaveClass('h-row-two-line');
  });
});

describe('DataGrid lazy loading', () => {
  it('offers Load more only with hasMore and onLoadMore and reports the click', async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    rerender(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} hasMore onLoadMore={onLoadMore} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows a live loading status while loadingMore and no button', () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} hasMore onLoadMore={() => undefined} loadingMore />);
    // The grid's own live region stays empty, the load more row announces itself.
    expect(within(screen.getByRole('table')).getByRole('status')).toHaveTextContent('Loading more');
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('spans all columns including the select column and uses German labels', () => {
    render(
      <DesignSystemProvider locale="de">
        <DataGrid selectable columns={columns} rows={rows} getRowId={(r) => r.id} hasMore onLoadMore={() => undefined} />
      </DesignSystemProvider>,
    );
    const button = screen.getByRole('button', { name: 'Mehr laden' });
    expect(button.closest('td')).toHaveAttribute('colspan', '3');
  });
});

describe('DataGrid active row', () => {
  it('marks the active row with aria-current and the token wash, distinct from selection', () => {
    render(<DataGrid selectable defaultSelectedIds={['c']} activeRowId="b" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    const [, a, b, c] = screen.getAllByRole('row');
    expect(b).toHaveAttribute('aria-current', 'true');
    expect(b).toHaveClass('bg-background-brand-subtle');
    expect(b).not.toHaveAttribute('aria-selected');
    expect(a).not.toHaveAttribute('aria-current');
    expect(c).toHaveAttribute('aria-selected', 'true');
    expect(c).not.toHaveAttribute('aria-current');
  });

  it('has no active row by default or with null', () => {
    render(<DataGrid activeRowId={null} columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(document.querySelector('[aria-current]')).toBeNull();
  });
});

describe('DataGrid custom cells', () => {
  const cols: DataGridColumn<Demand>[] = [
    { id: 'title', header: 'Demand', cell: (r) => <TableLeadCell name={r.title} supportingText="Nordlicht AG" /> },
    { id: 'status', header: 'Status', priority: 2, cell: () => <TableBadgeCell><Chip variant="success" size="small">Active</Chip></TableBadgeCell> },
    { id: 'actions', header: 'Actions', align: 'right', cell: (r) => <TableActionsCell actions={[{ label: `Edit ${r.title}`, icon: <span>i</span> }]} /> },
    { id: 'plain', header: 'Plain', cell: (r) => <span>{r.id}</span> },
  ];

  it('uses TableCell based components as the cell itself without nesting a td in a td', () => {
    const { container } = render(<DataGrid columns={cols} rows={rows} getRowId={(r) => r.id} />);
    expect(container.querySelectorAll('td td')).toHaveLength(0);
    expect(screen.getAllByRole('row')[1].querySelectorAll(':scope > td')).toHaveLength(4);
    expect(screen.getAllByRole('cell')).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'Edit Frontend' })).toBeInTheDocument();
  });

  it('applies column priority, alignment and row height to a returned cell component', () => {
    render(<DataGrid rowHeight="two-line" columns={cols} rows={rows} getRowId={(r) => r.id} />);
    const [lead, badge, actions, plain] = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(badge).toHaveClass('max-md:hidden');
    expect(actions).toHaveClass('text-right');
    expect([lead, badge, actions, plain].every((cell) => cell.classList.contains('h-row-two-line'))).toBe(true);
  });

  it('cellAs element lets a custom wrapper around TableCell act as the cell', () => {
    const Wrapped = ({ className }: { className?: string }) => <TableBadgeCell className={className}>x</TableBadgeCell>;
    const custom: DataGridColumn<Demand>[] = [{ id: 'a', header: 'A', cellAs: 'element', priority: 3, cell: () => <Wrapped /> }];
    const { container } = render(<DataGrid columns={custom} rows={rows} getRowId={(r) => r.id} />);
    expect(container.querySelectorAll('td td')).toHaveLength(0);
    expect(screen.getAllByRole('cell')[0]).toHaveClass('max-lg:hidden');
  });

  it('cellAs cell wraps even a cell component', () => {
    const forced: DataGridColumn<Demand>[] = [{ id: 'a', header: 'A', cellAs: 'cell', cell: () => <span>plain</span> }];
    render(<DataGrid columns={forced} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.getAllByRole('cell')).toHaveLength(3);
  });

  describe('phone list', () => {
    const P = '[@container_kette-table_(max-width:767.98px)]:';

    it('passes phone through to the table and places columns by position without roles', () => {
      render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} phone="list" selectable />);
      expect(screen.getByRole('table')).toHaveAttribute('role', 'table');
      expect(screen.getByRole('cell', { name: 'Frontend' })).toHaveAttribute('data-phone', 'title');
      expect(screen.getByRole('cell', { name: '14' })).toHaveAttribute('data-phone', 'value');
      // The select column stays in the list as the row start, its head becomes the select-all bar with a visible name (ZERO-943).
      expect(screen.getAllByRole('checkbox')[1].closest('td')).toHaveAttribute('data-phone', 'select');
      expect(screen.getAllByRole('checkbox')[1].closest('td')).toHaveClass(`${P}[grid-area:1/1/3/2]`, `${P}min-w-target-lg`);
      const head = screen.getByRole('checkbox', { name: 'Select all rows' }).closest('th');
      expect(head).toHaveClass(`${P}flex`, `${P}min-h-[calc(var(--size-row)+theme(spacing.2))]`);
      expect(head).toHaveTextContent('Select all rows');
      expect(head?.closest('thead')).toHaveClass(`${P}[&:has([data-select])]:not-sr-only`);
    });

    it('a column role wins over priority in the list', () => {
      const withRoles: DataGridColumn<Demand>[] = [
        { id: 'title', header: 'Demand', phone: 'title' },
        { id: 'applications', header: 'Applic.', align: 'right', priority: 3, phone: 'value' },
        { id: 'id', header: 'Id', phone: 'hidden' },
      ];
      render(<DataGrid columns={withRoles} rows={rows} getRowId={(r) => r.id} phone="list" onRowClick={() => undefined} getRowLabel={(r) => r.title} />);
      const value = screen.getByRole('cell', { name: '14' });
      expect(value).toHaveAttribute('data-phone', 'value');
      // Priority hiding stays for the table layout; the list display class comes later in the CSS and wins below 768px.
      expect(value).toHaveClass('max-lg:hidden', `${P}block`);
      expect(screen.getByRole('cell', { name: 'a' })).toHaveAttribute('data-phone', 'hidden');
      expect(screen.getByRole('row', { name: 'Frontend' }).querySelector('[data-slot="table-row-chevron"]')).not.toBeNull();
    });

    it('a returned cell component takes the column role unless it sets its own', () => {
      const custom: DataGridColumn<Demand>[] = [
        { id: 'title', header: 'Demand', phone: 'title', cell: (r) => <TableLeadCell name={r.title} /> },
        { id: 'status', header: 'Status', phone: 'value', cell: (r) => <TableBadgeCell phone="meta"><Chip>{r.applications}</Chip></TableBadgeCell> },
        { id: 'actions', header: 'Actions', cell: () => <TableActionsCell actions={[{ label: 'Edit', icon: <span /> }]} /> },
      ];
      render(<DataGrid columns={custom} rows={rows.slice(0, 1)} getRowId={(r) => r.id} phone="list" />);
      expect(screen.getByRole('cell', { name: 'Frontend' })).toHaveAttribute('data-phone', 'title');
      expect(screen.getByRole('cell', { name: '14' })).toHaveAttribute('data-phone', 'meta');
      expect(screen.getByRole('group', { name: /actions/i }).closest('td')).toHaveAttribute('data-phone', 'hidden');
    });

    it('shows the select-all bar only with rows to select', () => {
      const { rerender } = render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} phone="list" selectable loading />);
      expect(screen.getByRole('checkbox', { name: 'Select all rows' }).closest('th')).not.toHaveAttribute('data-select');
      rerender(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} phone="list" selectable />);
      expect(screen.getByRole('checkbox', { name: 'Select all rows' }).closest('th')).toHaveAttribute('data-select', 'true');
    });

    it('the visible select-all name in the list toggles the checkbox', async () => {
      const onSelected = vi.fn();
      render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} phone="list" selectable onSelectedIdsChange={onSelected} />);
      const head = screen.getByRole('checkbox', { name: 'Select all rows' }).closest('th')!;
      await userEvent.click(within(head).getByText('Select all rows', { selector: 'span[aria-hidden]' }));
      expect(onSelected).toHaveBeenCalledWith(['a', 'b', 'c']);
    });

    it('an action cell stays hidden when its column has a role', () => {
      const custom: DataGridColumn<Demand>[] = [
        { id: 'title', header: 'Demand', phone: 'title' },
        { id: 'actions', header: 'Actions', phone: 'value', cell: () => <TableActionsCell actions={[{ label: 'Edit', icon: <span /> }]} /> },
      ];
      render(<DataGrid columns={custom} rows={rows.slice(0, 1)} getRowId={(r) => r.id} phone="list" />);
      expect(screen.getByRole('group', { name: /actions/i }).closest('td')).toHaveAttribute('data-phone', 'hidden');
    });

    it('action cells hide by default in a grid without roles', () => {
      const custom: DataGridColumn<Demand>[] = [
        { id: 'title', header: 'Demand' },
        { id: 'applications', header: 'Applic.' },
        { id: 'actions', header: 'Actions', cell: () => <TableActionsCell actions={[{ label: 'Edit', icon: <span /> }]} /> },
      ];
      render(<DataGrid columns={custom} rows={rows.slice(0, 1)} getRowId={(r) => r.id} phone="list" />);
      expect(screen.getByRole('cell', { name: '14' })).toHaveAttribute('data-phone', 'value');
      expect(screen.getByRole('group', { name: /actions/i }).closest('td')).toHaveAttribute('data-phone', 'hidden');
    });

    it('loading, empty and error states render in list mode', () => {
      const { rerender } = render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} phone="list" loading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      rerender(<DataGrid columns={columns} rows={[]} getRowId={(r) => r.id} phone="list" emptyTitle="No demands" />);
      expect(screen.getByText('No demands').closest('td')).toHaveAttribute('data-phone', 'full');
      rerender(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} phone="list" error onRetry={() => undefined} />);
      expect(screen.getByRole('button', { name: 'Try again' }).closest('td')).toHaveAttribute('data-phone', 'full');
    });
  });
});

describe('DataGrid fit and fill widths', () => {
  it('fit sizes a column to its one-line content and fill takes the rest with truncation', () => {
    const cols: DataGridColumn<Demand>[] = [
      { id: 'title', header: 'Demand', width: 'fill', cell: (r) => <DataGridTwoLine title={r.title} /> },
      { id: 'applications', header: 'Applic.', width: 'fit', align: 'right' },
    ];
    render(<DataGrid columns={cols} rows={rows} getRowId={(r) => r.id} />);
    const [titleHead, countHead] = screen.getAllByRole('columnheader');
    expect(titleHead).toHaveClass('w-full', 'max-w-0');
    expect(countHead).toHaveClass('w-px', 'whitespace-nowrap');
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveClass('w-full', 'max-w-0');
    expect(cells[1]).toHaveClass('w-px', 'whitespace-nowrap');
  });
});

describe('DataGrid loading layout (KETTE-84)', () => {
  const widthByHeader: Record<string, number> = { Demand: 431, 'Applic.': 120 };
  let widthSpy: ReturnType<typeof vi.spyOn>;
  let heightSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // jsdom has no layout: the header cells report the widths of a loaded page, the body reports a page height.
    widthSpy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'TH' ? widthByHeader[this.textContent?.trim() ?? ''] ?? 0 : 0;
    });
    heightSpy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'TBODY' ? 640 : 0;
    });
  });

  afterEach(() => {
    widthSpy.mockRestore();
    heightSpy.mockRestore();
  });

  const pagination = { pageSize: 10, total: 240, page: 2 };
  const grid = (props: Partial<React.ComponentProps<typeof DataGrid<Demand>>> = {}) => (
    <DataGrid label="Demands" columns={columns} rows={rows} getRowId={(r) => r.id} pagination={pagination} {...props} />
  );

  it('keeps the column widths of the loaded page on the skeleton rows', () => {
    const { rerender } = render(grid());
    rerender(grid({ loading: true, rows: [] }));
    const firstSkeletonRow = screen.getAllByRole('row')[1];
    const cells = within(firstSkeletonRow).getAllByRole('cell');
    expect(cells[0]).toHaveStyle({ width: '431px', minWidth: '431px' });
    expect(cells[1]).toHaveStyle({ width: '120px', minWidth: '120px' });
  });

  it('follows a resize of the header cells, so the skeleton never forces stale widths', () => {
    // Table observes too, so every observer is notified.
    const callbacks: Array<() => void> = [];
    const notify = () => callbacks.forEach((callback) => callback());
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    try {
      const { rerender } = render(grid());
      widthByHeader.Demand = 300;
      widthByHeader['Applic.'] = 90;
      act(() => notify());
      rerender(grid({ loading: true, rows: [] }));
      const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
      expect(cells[0]).toHaveStyle({ width: '300px' });
      expect(cells[1]).toHaveStyle({ width: '90px' });
    } finally {
      globalThis.ResizeObserver = original;
      widthByHeader.Demand = 431;
      widthByHeader['Applic.'] = 120;
    }
  });

  it('shrinks the frozen skeleton widths with the scroll area when the window gets narrower while loading', () => {
    // KETTE-94 QA-KB-01: 1440 -> 800 while loading left a 902px table in a 798px container.
    // Only live observers are notified, like the browser does.
    const live = new Set<() => void>();
    const notifyAll = () => live.forEach((callback) => callback());
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      private readonly callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
      }
      observe() {
        live.add(this.callback);
      }
      unobserve() {}
      disconnect() {
        live.delete(this.callback);
      }
    } as unknown as typeof ResizeObserver;
    let areaWidth = 1100;
    const areaSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'DIV' && this.querySelector(':scope > table') ? areaWidth : 0;
    });
    try {
      const { rerender } = render(grid());
      rerender(grid({ loading: true, rows: [] }));
      let cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
      expect(cells[0]).toHaveStyle({ width: '431px', minWidth: '431px', maxWidth: '431px' });
      areaWidth = 550;
      act(() => notifyAll());
      cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
      expect(cells[0]).toHaveStyle({ width: '215px', minWidth: '215px', maxWidth: '215px' });
      expect(cells[1]).toHaveStyle({ width: '60px', minWidth: '60px', maxWidth: '60px' });
      // A wider area does not stretch the frozen widths.
      areaWidth = 2000;
      act(() => notifyAll());
      cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
      expect(cells[0]).toHaveStyle({ width: '431px' });
    } finally {
      areaSpy.mockRestore();
      globalThis.ResizeObserver = original;
    }
  });

  it('never freezes widths whose sum exceeds the scroll area, also without a resize (QA-K2-03)', () => {
    // The loaded table measured 1px wider than its area (rounded cell widths).
    const area = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'DIV' && this.querySelector(':scope > table') ? 550 : 0;
    });
    const table = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'TABLE' ? 551 : this.tagName === 'TH' ? widthByHeader[this.textContent?.trim() ?? ''] ?? 0 : 0;
    });
    try {
      const { rerender } = render(grid());
      rerender(grid({ loading: true, rows: [] }));
      const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
      const sum = cells.reduce((total, cell) => total + parseInt(cell.style.width || '0', 10), 0);
      expect(sum).toBeLessThanOrEqual(550);
      expect(sum).toBeGreaterThan(540);
    } finally {
      area.mockRestore();
      table.mockRestore();
    }
  });

  it('keeps the pager mounted and its focused control focusable through loading', () => {
    const { rerender } = render(grid());
    const next = screen.getByRole('button', { name: 'Next page' });
    next.focus();
    rerender(grid({ loading: true }));
    const same = screen.getByRole('button', { name: 'Next page' });
    expect(same).toBe(next);
    expect(same).toHaveFocus();
    expect(same).toHaveAttribute('aria-disabled', 'true');
    expect(same).not.toBeDisabled();
  });

  it('does not change the page from a control while loading', async () => {
    const onPageChange = vi.fn();
    render(grid({ loading: true, pagination: { ...pagination, onPageChange } }));
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps the height of the previous page while loading with keepHeightWhileLoading', () => {
    const { rerender } = render(grid({ keepHeightWhileLoading: true }));
    rerender(grid({ keepHeightWhileLoading: true, loading: true, rows: [] }));
    expect(document.querySelector('tbody')).toHaveStyle({ height: '640px' });
  });

  it('does not pin the height without keepHeightWhileLoading', () => {
    const { rerender } = render(grid());
    rerender(grid({ loading: true, rows: [] }));
    expect(document.querySelector('tbody')?.style.height).toBe('');
  });
});

describe('DataGrid phoneQuery (ZERO-1001)', () => {
  it('passes phoneQuery through to the table', () => {
    const cols: DataGridColumn<{ id: string; title: string }>[] = [{ id: 'title', header: 'Title' }];
    render(<DataGrid columns={cols} rows={[{ id: 'a', title: 'Frontend' }]} getRowId={(r) => r.id} phone="list" phoneQuery="viewport" />);
    const area = screen.getByRole('table').parentElement as HTMLElement;
    expect(area).toHaveAttribute('data-phone-query', 'viewport');
    expect(area).toHaveClass('max-md:[container-type:inline-size]');
  });
});
