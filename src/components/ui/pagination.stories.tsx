import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';
import { useState } from 'react';

import { Pagination, type PaginationVariant } from './pagination';

const meta = {
  title: 'Patterns/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: { variant: 'page', shape: 'square', pageCount: 24 },
  argTypes: {
    previousLabel: { control: { type: 'text' }, description: 'Accessible name of the previous arrow (compact). Wins over the provider text.' },
    nextLabel: { control: { type: 'text' }, description: 'Accessible name of the next arrow (compact). Wins over the provider text.' },
    previousText: { control: { type: 'text' }, description: 'Visible text of the previous button.' },
    nextText: { control: { type: 'text' }, description: 'Visible text of the next button.' },
    rowsPerPageLabel: { control: { type: 'text' }, description: 'Accessible name of the page size select.' },
    pagesLabel: { control: { type: 'text' }, description: 'Accessible name of the button group (card-button-group).' },
    pageLabel: { description: 'Accessible name of a page button. String or function of the page number.' },
    pageOfText: { description: 'Text "Page x of y". String or function of page and page count.' },
    perPageText: { description: 'Text "n per page". String or function of the size.' },
    rangeText: { description: 'Text "1 to 20 of 214". String or function of first, last and total.' },
    showingText: { description: 'Text "Showing n of m" (lazy). String or function.' },
    loadMoreText: { control: { type: 'text' }, description: 'Visible text of the load more button.' },
    loadingMoreLabel: { control: { type: 'text' }, description: 'Accessible name of the load more spinner.' },
    variant: {
      control: { type: 'select' },
      options: ['page', 'page-minimal', 'card', 'card-minimal', 'card-button-group', 'compact', 'lazy'],
    },
    shape: { control: { type: 'select' }, options: ['square', 'circle'] },
    align: { control: { type: 'select' }, options: ['left', 'center', 'right'] },
  },
  // `page`, `onPageChange`, `onPageSizeChange` and `onLoadMore` switch rendering paths, so Storybook must not inject actions for them.
  parameters: { actions: { argTypesRegex: '^on(?!PageChange|PageSizeChange|LoadMore)[A-Z].*' } },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Circle: Story = { args: { shape: 'circle' } };

export const Card: Story = { args: { variant: 'card' } };

export const CardMinimal: Story = { args: { variant: 'card-minimal', pageCount: 10 } };

export const CardButtonGroup: Story = { args: { variant: 'card-button-group', align: 'center' } };

export const Disabled: Story = { args: { variant: 'card', disabled: true } };

// Compact (zero): range summary, per page selector, arrows and pages.
const CompactDemo = (args: React.ComponentProps<typeof Pagination>) => {
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  return (
    <Pagination
      {...args}
      variant="compact"
      total={214}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      pageSizeOptions={[10, 20, 50, 100]}
      onPageSizeChange={(s) => {
        setPageSize(s);
        setPage(1);
      }}
    />
  );
};

export const Compact: Story = {
  render: (args) => <CompactDemo {...args} />,
};

// A page is loading: the range reads "Loading…", the pager is aria-busy and its controls are disabled.
export const CompactLoading: Story = {
  render: () => <Pagination variant="compact" total={120} pageSize={25} page={2} pageSizeOptions={[25, 50]} onPageSizeChange={() => undefined} loading />,
};

const LazyDemo = (args: React.ComponentProps<typeof Pagination>) => {
  const [loaded, setLoaded] = useState(20);
  const [loading, setLoading] = useState(false);
  return (
    <Pagination
      {...args}
      variant="lazy"
      total={134}
      pageSize={loaded}
      loading={loading}
      exhausted={loaded >= 134}
      onLoadMore={() => {
        setLoading(true);
        setTimeout(() => {
          setLoaded((n) => Math.min(134, n + 20));
          setLoading(false);
        }, 800);
      }}
    />
  );
};

export const Lazy: Story = {
  render: (args) => <LazyDemo {...args} />,
};

export const LazyLoading: Story = { args: { variant: 'lazy', total: 134, pageSize: 20, loading: true } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(['page', 'page-minimal', 'card', 'card-minimal', 'card-button-group', 'compact'] as PaginationVariant[]).map((v) => (
        <div key={v} className="flex flex-col gap-2">
          <span className="typography-text-extra-small text-text-subtle">{v}</span>
          <Pagination variant={v} aria-label={`Pagination, ${v}`} pageCount={10} total={214} defaultPage={2} />
        </div>
      ))}
    </div>
  ),
};

export const Localized: Story = {
  args: {} as any,
  parameters: { docs: { description: { story: 'Provider locale `de` translates ranges, page size and arrow names. `rowsPerPageLabel` overrides one text for this instance.' } } },
  render: () => (
    <DesignSystemProvider locale="de">
      <Pagination variant="compact" total={214} pageSize={20} pageSizeOptions={[20, 50]} onPageSizeChange={() => {}} rowsPerPageLabel="Einträge je Seite" />
    </DesignSystemProvider>
  ),
};

// Size sm puts every control on the Button sm height (control-sm token: 32, zero 28). The button group variant is the one that changes, the other variants already sit on that height.
export const SizeSm: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-col gap-8">
      {(['page', 'card-minimal', 'card-button-group', 'compact'] as PaginationVariant[]).map((v) => (
        <div key={v} className="flex flex-col gap-2">
          <span className="typography-text-extra-small text-text-subtle">{`${v}, size sm`}</span>
          <Pagination variant={v} size="sm" aria-label={`Pagination, ${v}, small`} pageCount={10} total={214} defaultPage={4} />
        </div>
      ))}
    </div>
  ),
};
