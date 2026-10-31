import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Badge } from './badge';
import { DataGrid, DataGridTwoLine, type DataGridColumn, type DataGridSort } from './data-grid';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
import { TableBadgeCell, TableLeadCell } from './table';
import { TableActionsCell } from './table-cells';
import { Pencil, Trash2 } from 'lucide-react';
import { DesignSystemProvider } from './design-system-provider';

interface Demand {
  id: string;
  title: string;
  client: string;
  status: 'Active' | 'In review' | 'Draft';
  applications: number;
  deadline: string;
}

const demands: Demand[] = Array.from({ length: 47 }, (_, i) => ({
  id: String(i + 1),
  title: ['Frontend Dev React', 'UX Lead', 'Agile Coach', 'Backend Dev NestJS', 'Data Engineer', 'QA Automation'][i % 6],
  client: ['Nordlicht AG', 'Digitalwerk KG', 'Globex AG'][i % 3],
  status: (['Active', 'In review', 'Draft'] as const)[i % 3],
  applications: (i * 7) % 19,
  deadline: `2026-1${i % 3}-${String((i % 27) + 1).padStart(2, '0')}`,
}));

// The first column keeps the table cell size (weight 500 only), so every text in a row has one size. Status in a row is a tinted Badge (22 high, radius 6, 12/500), deliberately its own compact role, not a solid Chip.
const statusVariant = { Active: 'success', 'In review': 'warning', Draft: 'secondary' } as const;

const columns: DataGridColumn<Demand>[] = [
  { id: 'title', header: 'Demand', sortable: true, sortValue: (r) => r.title, cell: (r) => <span className="typography-table-cell font-medium text-text-default">{r.title}</span> },
  { id: 'client', header: 'Client', sortable: true, sortValue: (r) => r.client, priority: 2 },
  { id: 'status', header: 'Status', cell: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>, priority: 2 },
  { id: 'applications', header: 'Applic.', align: 'right', sortable: true, sortValue: (r) => r.applications },
  { id: 'deadline', header: 'Deadline', sortable: true, sortValue: (r) => r.deadline, priority: 3 },
];

const meta = {
  id: 'patterns-data-grid',
  title: 'Patterns · Data/Data grid',
  component: DataGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof DataGrid>;
export default meta;
type Story = StoryObj;

const base = { columns, getRowId: (r: Demand) => r.id, label: 'Demands' };

export const Default: Story = {
  render: () => <DataGrid {...base} rows={demands.slice(0, 6)} />,
};

// Selection, sorting and the compact pager footer, the Figma DataGrid with select and pagination.
const SelectionDemo = () => {
  const [selected, setSelected] = useState<string[]>(['2']);
  return (
    <DataGrid
      {...base}
      rows={demands}
      selectable
      selectedIds={selected}
      onSelectedIdsChange={setSelected}
      defaultSort={{ columnId: 'applications', direction: 'desc' }}
      pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50] }}
      getRowLabel={(r) => r.title}
    />
  );
};

export const SelectionSortingPagination: Story = {
  render: () => <SelectionDemo />,
};

// Compact density drops the row to 36px and the type one step.
export const CompactDensity: Story = {
  render: () => <DataGrid {...base} rows={demands.slice(0, 8)} density="compact" selectable />,
};

// Server side: the consumer sorts and pages, the grid reports the changes.
const ServerSideDemo = () => {
  const [sort, setSort] = useState<DataGridSort | null>(null);
  const [page, setPage] = useState(1);
  const rows = demands.slice((page - 1) * 10, page * 10);
  return (
    <DataGrid
      {...base}
      rows={rows}
      sort={sort}
      onSortChange={setSort}
      pagination={{ page, onPageChange: setPage, pageSize: 10, total: demands.length }}
    />
  );
};

export const ServerSide: Story = {
  render: () => <ServerSideDemo />,
};

export const ClickableRows: Story = {
  render: () => <DataGrid {...base} rows={demands.slice(0, 6)} onRowClick={() => undefined} getRowLabel={(r) => `Open ${r.title}`} />,
};

export const Loading: Story = {
  render: () => <DataGrid {...base} rows={[]} loading selectable />,
};

export const ErrorState: Story = {
  render: () => <DataGrid {...base} rows={[]} error onRetry={() => undefined} />,
};

export const Empty: Story = {
  render: () => <DataGrid {...base} rows={[]} emptyTitle="No demands yet" emptyDescription="Create a demand to see it here." />,
};

// Fills a parent that has a height; the header sticks inside it.
export const StickyInParent: Story = {
  render: () => (
    <div className="h-80">
      <DataGrid {...base} rows={demands} stickyMode="parent" />
    </div>
  ),
};

// Two-line rows: the cell stacks a title and a subtitle, rowHeight gives every cell the two-line height.
const twoLineColumns: DataGridColumn<Demand>[] = [
  { id: 'title', header: 'Demand', sortable: true, sortValue: (r) => r.title, cell: (r) => <DataGridTwoLine title={r.title} subtitle={`${r.client} · ${r.deadline}`} /> },
  { id: 'status', header: 'Status', cell: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>, priority: 2 },
  { id: 'applications', header: 'Applic.', align: 'right', sortable: true, sortValue: (r) => r.applications },
];

export const TwoLineRows: Story = {
  render: () => <DataGrid {...base} columns={twoLineColumns} rows={demands.slice(0, 6)} rowHeight="two-line" selectable />,
};

// Lazy loading: Load more appends the next page, the footer shows a live status while it loads.
const LazyDemo = () => {
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const loadMore = () => {
    setLoading(true);
    window.setTimeout(() => {
      setCount((c) => Math.min(c + 8, demands.length));
      setLoading(false);
    }, 800);
  };
  return <DataGrid {...base} rows={demands.slice(0, count)} hasMore={count < demands.length} loadingMore={loading} onLoadMore={loadMore} />;
};

export const LazyLoadMore: Story = {
  render: () => <LazyDemo />,
};

// Paged grid while the next page loads: the footer says "Loading…" instead of the row range.
export const PagerLoading: Story = {
  render: () => <DataGrid {...base} rows={demands.slice(0, 8)} pagination={{ pageSize: 8, total: 120, page: 2 }} loadingMore />,
};

export const LoadingMore: Story = {
  render: () => <DataGrid {...base} rows={demands.slice(0, 8)} hasMore loadingMore onLoadMore={() => undefined} />,
};

// Active row: the record open in a side sheet gets the brand wash and aria-current, independent of selection.
const ActiveDemo = () => {
  const [activeId, setActiveId] = useState<string | null>('2');
  const [selected, setSelected] = useState<string[]>(['4']);
  const active = demands.find((d) => d.id === activeId);
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <div ref={setHost} className="relative min-h-96 overflow-hidden">
      <DataGrid
        {...base}
        rows={demands.slice(0, 6)}
        selectable
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
        activeRowId={activeId}
        onRowClick={(r) => setActiveId(r.id)}
        getRowLabel={(r) => `Open ${r.title}`}
      />
      <Sheet open={Boolean(active) && host !== null} modal={false} onOpenChange={(open) => !open && setActiveId(null)}>
        <SheetContent mode="push" size="sm" padded={false} container={host}>
          <SheetHeader variant="zero">
            <SheetTitle variant="zero">{active?.title}</SheetTitle>
            <SheetDescription>{active?.client}</SheetDescription>
          </SheetHeader>
          <SheetBody />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const ActiveRow: Story = {
  render: () => <ActiveDemo />,
};

// Custom cells: TableLeadCell, TableBadgeCell and TableActionsCell returned from `cell` become the td themselves.
const cellColumns: DataGridColumn<Demand>[] = [
  { id: 'title', header: 'Demand', cell: (r) => <TableLeadCell name={r.title} supportingText={r.client} /> },
  { id: 'status', header: 'Status', priority: 2, cell: (r) => <TableBadgeCell><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TableBadgeCell> },
  {
    id: 'actions',
    header: 'Actions',
    align: 'right',
    cell: (r) => (
      <TableActionsCell
        align="right"
        actions={[
          { label: `Edit ${r.title}`, icon: <Pencil /> },
          { label: `Delete ${r.title}`, icon: <Trash2 /> },
        ]}
      />
    ),
  },
];

export const CustomCells: Story = {
  render: () => <DataGrid {...base} columns={cellColumns} rows={demands.slice(0, 6)} rowHeight="two-line" />,
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  // The story needs its own render: without it Storybook mounts DataGrid with no columns or rows and throws.
  render: () => <DataGrid {...base} rows={demands.slice(0, 6)} />,
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
