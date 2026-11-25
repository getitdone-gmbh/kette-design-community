import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataGrid } from './data-grid';
import { DesignSystemProvider } from './design-system-provider';
import { Pagination } from './pagination';

// 0.12.2: pagers show a loading summary instead of the row range and block navigation while a page loads
describe('Pagination loading', () => {
  it('compact shows the loading text, is aria-busy and gates its controls with aria-disabled (KETTE-84)', () => {
    render(<Pagination variant="compact" total={120} pageSize={25} page={2} loading />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-busy', 'true');
    expect(nav).toHaveTextContent('Loading…');
    expect(nav).not.toHaveTextContent('26');
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses the provider locale and the prop override', () => {
    const { unmount } = render(
      <DesignSystemProvider locale="de">
        <Pagination variant="compact" total={120} pageSize={25} loading />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('navigation')).toHaveTextContent('Wird geladen…');
    unmount();
    render(<Pagination variant="compact" total={120} pageSize={25} loading loadingText="Fetching" />);
    expect(screen.getByRole('navigation')).toHaveTextContent('Fetching…');
  });

  it('minimal variants replace "Page x of y" while loading', () => {
    render(<Pagination variant="page-minimal" pageCount={5} page={2} loading />);
    expect(screen.getByRole('navigation')).toHaveTextContent('Loading…');
  });

  it('without loading the range and controls are unchanged', () => {
    render(<Pagination variant="compact" total={120} pageSize={25} page={2} />);
    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveAttribute('aria-busy');
    expect(nav).toHaveTextContent('26');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });
});

describe('DataGrid passes loading to the pager', () => {
  const columns = [{ id: 'name', header: 'Name', cell: (r: { id: string; name: string }) => r.name }];
  const rows = Array.from({ length: 30 }, (_, i) => ({ id: String(i), name: `Row ${i}` }));

  it('shows the loading summary in the footer while loading more', () => {
    render(<DataGrid label="Rows" columns={columns} rows={rows} getRowId={(r) => r.id} pagination={{ pageSize: 10, total: 120 }} loadingMore />);
    const pager = screen.getByRole('navigation');
    expect(pager).toHaveAttribute('aria-busy', 'true');
    expect(pager).toHaveTextContent('Loading…');
  });
});

describe('DataGrid paged loading shows one status', () => {
  const columns = [{ id: 'name', header: 'Name', cell: (r: { id: string; name: string }) => r.name }];
  const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: `Row ${i}` }));

  it('does not render the lazy loading row when a pager is present', () => {
    render(<DataGrid label="Rows" columns={columns} rows={rows} getRowId={(r) => r.id} pagination={{ pageSize: 10, total: 120 }} loadingMore />);
    expect(screen.queryByText('Loading more')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation')).toHaveTextContent('Loading…');
  });
});
