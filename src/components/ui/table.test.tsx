import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { vi } from 'vitest';

import { Chip } from './chip';
import { LogoTile } from './logo-tile';

import {
  Table,
  TableBody,
  TableBadgeCell,
  TableCaption,
  TableCell,
  TableEmpty,
  TableError,
  TableLoadingMore,
  TableFooter,
  TableHead,
  TableHeader,
  TableLeadCell,
  TableLoading,
  TableRow,
} from './table';

const rawPaletteClass =
  /(^|\s)(bg|text|border|shadow|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;

const BasicTable = (props: Partial<React.ComponentProps<typeof Table>> = {}) => (
  <Table {...props}>
    <TableCaption>Caption</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>Alice</TableCell>
        <TableCell>Active</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

describe('Table component', () => {
  it('renders a native table with caption, header and body rows', () => {
    render(<BasicTable />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Caption')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
  });

  it('forwards a ref to the root table element', () => {
    const ref = createRef<HTMLTableElement>();
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>a</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('applies the dedicated table-* surface tokens, never a raw Tailwind palette color', () => {
    render(<BasicTable />);
    const table = screen.getByRole('table');
    expect(table).toHaveClass('bg-background', 'text-foreground');
    expect(table.className).not.toMatch(rawPaletteClass);
  });

  describe('density', () => {
    it.each([
      ['compact', 'h-6'],
      ['default', 'h-8'],
      ['comfortable', 'h-12'],
    ] as const)('applies the %s density to header cells', (density, expectedClass) => {
      render(
        <Table density={density}>
          <TableHeader>
            <TableRow>
              <TableHead>Col</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );
      expect(screen.getByRole('columnheader')).toHaveClass(expectedClass);
    });

    it('header uses the typography-table-head role; cells use the typography-table-cell role', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Col</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Val</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );
      const head = screen.getByRole('columnheader');
      const cell = screen.getByRole('cell');
      expect(head).toHaveClass('typography-table-head', 'text-muted-foreground');
      expect(head).not.toHaveClass('text-xs', 'text-sm');
      expect(cell).toHaveClass('typography-table-cell');
      expect(cell).not.toHaveClass('text-xs', 'text-sm');
    });
  });

  describe('sticky header', () => {
    it('uses the token-driven table surface instead of a hardcoded white background', () => {
      render(
        <Table stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>Col</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );
      const thead = screen.getByRole('columnheader').closest('thead');
      expect(thead).toHaveClass('bg-background', 'sticky');
      expect(thead?.className).not.toMatch(rawPaletteClass);
    });
  });

  describe('root wrapper (overflow + shape)', () => {
    const getWrapper = (element: HTMLElement) => element.parentElement as HTMLElement;

    it('always applies overflow-x-auto, the surface radius and a hairline border, regardless of stickyHeader', () => {
      render(<BasicTable stickyHeader={false} />);
      const wrapper = getWrapper(screen.getByRole('table'));
      expect(wrapper).toHaveClass('overflow-x-auto', 'rounded-surface', 'border', 'border-solid', 'border-hairline');
    });

    it('only gates vertical overflow-y-auto/max-h on stickyHeader', () => {
      render(<BasicTable stickyHeader maxHeight="600px" />);
      const stickyWrapper = getWrapper(screen.getByRole('table'));
      expect(stickyWrapper).toHaveClass('overflow-y-auto');
      expect(stickyWrapper).toHaveStyle({ maxHeight: '600px' });

      render(<BasicTable stickyHeader={false} />);
      const wrappers = screen.getAllByRole('table').map(getWrapper);
      const nonStickyWrapper = wrappers[wrappers.length - 1];
      expect(nonStickyWrapper).not.toHaveStyle({ maxHeight: '600px' });
      // still scrollable horizontally even without the sticky/vertical-clamp path
      expect(nonStickyWrapper).toHaveClass('overflow-x-auto');
    });
  });

  describe('TableRow', () => {
    it('is a plain, non-interactive row by default', () => {
      render(<BasicTable />);
      const row = screen.getByRole('cell', { name: 'Alice' }).closest('tr') as HTMLElement;
      expect(row).not.toHaveAttribute('tabindex');
      expect(row).not.toHaveAttribute('aria-selected');
      expect(row).not.toHaveAttribute('aria-disabled');
      expect(row).not.toHaveAttribute('aria-invalid');
    });

    it('does not apply a hover/active state layer or cursor-pointer to a plain, non-clickable row', () => {
      render(<BasicTable />);
      const row = screen.getByRole('cell', { name: 'Alice' }).closest('tr') as HTMLElement;
      expect(row).not.toHaveClass('active:bg-muted', 'cursor-pointer');
    });

    it('applies the hover/active state layer only to an interactive (onClick) row', () => {
      render(
        <Table>
          <TableBody>
            <TableRow onClick={() => {}}>
              <TableCell>a</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );
      const row = screen.getByRole('cell').closest('tr') as HTMLElement;
      expect(row).toHaveClass('active:bg-muted', 'cursor-pointer');
    });

    describe('selected', () => {
      it('sets data-state, aria-selected, the selected surface token, and a non-color left-accent border', () => {
        render(
          <Table>
            <TableBody>
              <TableRow selected>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        expect(row).toHaveAttribute('data-state', 'selected');
        expect(row).toHaveAttribute('aria-selected', 'true');
        expect(row).toHaveClass('bg-accent');
        expect(row.className).not.toMatch(/border-l-general-brand-default/);
      });

      it('does not set data-state/aria-selected when not selected', () => {
        render(<BasicTable />);
        const row = screen.getByRole('cell', { name: 'Alice' }).closest('tr') as HTMLElement;
        expect(row).not.toHaveAttribute('data-state');
        expect(row).not.toHaveAttribute('aria-selected');
      });

      it('keeps the selected background/border on an even-indexed row of a striped table', () => {
        render(
          <Table striped>
            <TableBody>
              <TableRow>
                <TableCell>row 1</TableCell>
              </TableRow>
              <TableRow selected>
                <TableCell>row 2</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByText('row 2').closest('tr') as HTMLElement;
        expect(row).toHaveClass('bg-accent');
        expect(row.className).not.toMatch(/border-l-general-brand-default/);
        const tbody = row.closest('tbody') as HTMLElement;
        // the striped rule must not target a selected (or invalid) row at all
        expect(tbody.className).toContain(
          'nth-child(even):not([data-state="selected"]):not([aria-invalid="true"])',
        );
      });
    });

    describe('disabled', () => {
      it('sets aria-disabled/data-disabled instead of the HTML disabled attribute and blocks the click', async () => {
        const onClick = jest.fn();
        render(
          <Table>
            <TableBody>
              <TableRow disabled onClick={onClick}>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        expect(row).toHaveAttribute('aria-disabled', 'true');
        expect(row).toHaveAttribute('data-disabled', 'true');
        expect(row).toHaveClass('aria-disabled:opacity-disabled', 'aria-disabled:pointer-events-none');
        expect(row).not.toHaveAttribute('tabindex');

        await userEvent.click(row, { pointerEventsCheck: 0 });
        expect(onClick).not.toHaveBeenCalled();
      });
    });

    describe('invalid', () => {
      it('sets aria-invalid/data-invalid, the error-tint token, and a non-color left-accent border', () => {
        render(
          <Table>
            <TableBody>
              <TableRow invalid>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        expect(row).toHaveAttribute('aria-invalid', 'true');
        expect(row).toHaveAttribute('data-invalid', 'true');
        expect(row).toHaveClass('bg-general-error-default/10', 'border-l-general-error-default');
      });
    });

    describe('interactive (onClick provided)', () => {
      it('becomes a real tab stop with a cursor affordance', () => {
        const onClick = jest.fn();
        render(
          <Table>
            <TableBody>
              <TableRow onClick={onClick}>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        expect(row).toHaveAttribute('tabindex', '0');
        expect(row).toHaveClass('cursor-pointer');
      });

      it('fires onClick via mouse click and via keyboard Enter', async () => {
        const onClick = jest.fn();
        render(
          <Table>
            <TableBody>
              <TableRow onClick={onClick}>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        await userEvent.click(row);
        row.focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(2);
      });

      it('fires onClick via keyboard Space, consistent with Enter', async () => {
        const onClick = jest.fn();
        render(
          <Table>
            <TableBody>
              <TableRow onClick={onClick}>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        row.focus();
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(1);
      });

      it('carries the shared focus-visible ring tokens', () => {
        const onClick = jest.fn();
        render(
          <Table>
            <TableBody>
              <TableRow onClick={onClick}>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        expect(row).toHaveClass('focus-visible:ring-[3px]', 'focus-visible:ring-ring/30', 'focus-visible:ring-inset');
      });

      it('is not a tab stop when disabled, even with onClick set', () => {
        const onClick = jest.fn();
        render(
          <Table>
            <TableBody>
              <TableRow disabled onClick={onClick}>
                <TableCell>a</TableCell>
              </TableRow>
            </TableBody>
          </Table>,
        );
        const row = screen.getByRole('cell').closest('tr') as HTMLElement;
        expect(row).not.toHaveAttribute('tabindex');
        expect(row).not.toHaveClass('cursor-pointer');
      });
    });
  });

  describe('TableHead sortable', () => {
    it('renders a real keyboard-operable button and exposes aria-sort on the header cell', async () => {
      const onSort = jest.fn();
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead sortable sortDirection="asc" onSort={onSort}>
                Name
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );
      const header = screen.getByRole('columnheader', { name: 'Name' });
      expect(header).toHaveAttribute('aria-sort', 'ascending');

      const button = screen.getByRole('button', { name: 'Name' });
      button.focus();
      await userEvent.keyboard('{Enter}');
      expect(onSort).toHaveBeenCalledTimes(1);
    });

    it('sets aria-sort="none" when sortable but not yet sorted', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead sortable onSort={() => {}}>
                Name
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );
      expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none');
    });

    it('does not set aria-sort or render a button when not sortable', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );
      const header = screen.getByRole('columnheader', { name: 'Name' });
      expect(header).not.toHaveAttribute('aria-sort');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('TableLoading', () => {
    it('announces the loading state to assistive tech', () => {
      render(<TableLoading columns={3} rows={2} />);
      expect(screen.getByRole('status', { name: 'Loading table data' })).toBeInTheDocument();
    });

    it('never applies a raw Tailwind palette color class, on its own wrapper or the composed Skeleton tiles', () => {
      // TABLE-MAT-02 (fixed): `TableLoading` composes the shared `Skeleton` primitive (DRY reuse
      // instead of hand-rolled pulse divs) — `Skeleton` previously hardcoded `bg-slate-200` with no
      // dark-mode value at all. Now that skeleton.tsx binds the token-driven `bg-background-neutral-default`
      // (see skeleton.test.tsx), this assertion covers the full rendered tree, not just the wrapper.
      const { container } = render(<TableLoading columns={3} rows={2} />);
      const wrapper = screen.getByRole('status', { name: 'Loading table data' });
      expect(wrapper.className).not.toMatch(rawPaletteClass);
      const tiles = container.querySelectorAll('[class*="animate-pulse"]');
      expect(tiles.length).toBeGreaterThan(0);
      tiles.forEach((tile) => expect(tile.className).not.toMatch(rawPaletteClass));
    });
  });

  describe('TableEmpty', () => {
    it('renders the default message inside a full-width cell and forwards its ref to the <td>', () => {
      const ref = createRef<HTMLTableCellElement>();
      render(
        <Table>
          <TableBody>
            <TableEmpty ref={ref} columns={3} />
          </TableBody>
        </Table>,
      );
      const cell = screen.getByRole('cell');
      expect(cell).toHaveAttribute('colspan', '3');
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(ref.current).toBe(cell);
    });

    it('renders a custom message', () => {
      render(
        <Table>
          <TableBody>
            <TableEmpty columns={2} message="No orders found." />
          </TableBody>
        </Table>,
      );
      expect(screen.getByText('No orders found.')).toBeInTheDocument();
    });

    it('uses the foreground-muted token, not the undefined muted-foreground class', () => {
      render(
        <Table>
          <TableBody>
            <TableEmpty columns={2} />
          </TableBody>
        </Table>,
      );
      const wrapper = screen.getByText('No data available').parentElement;
      expect(wrapper).toHaveClass('text-text-subtle');
      expect(wrapper).not.toHaveClass('text-muted-foreground');
    });

    it('uses the typography-table-item role for its message', () => {
      render(
        <Table>
          <TableBody>
            <TableEmpty columns={2} />
          </TableBody>
        </Table>,
      );
      const wrapper = screen.getByText('No data available').parentElement;
      expect(wrapper).toHaveClass('typography-table-item');
    });
  });

  describe('TableCaption', () => {
    it('uses the typography-table-item role instead of a raw text-sm size', () => {
      render(<BasicTable />);
      const caption = screen.getByText('Caption');
      expect(caption).toHaveClass('typography-table-item');
      expect(caption).not.toHaveClass('text-sm');
    });
  });

  describe('TableFooter', () => {
    it('uses token classes for its border and background, never a raw palette color', () => {
      render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );
      const footer = screen.getByRole('cell').closest('tfoot');
      expect(footer).toHaveClass('border-hairline', 'bg-muted/50');
      expect(footer?.className).not.toMatch(rawPaletteClass);
    });
  });
});

describe('Table rows (Attio recipe)', () => {
  it('uses hairline row dividers and a hover tint for unselected, valid rows', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>a</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const row = screen.getByRole('cell').closest('tr') as HTMLElement;
    expect(row).toHaveClass('border-hairline');
    expect(row.className).toContain('hover:bg-muted/50');
  });

  describe('opt-in zero props', () => {
    it('changes nothing by default', () => {
      render(<BasicTable />);
      expect(screen.getByRole('table').parentElement).not.toHaveClass('shadow-elevation-table');
      expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveClass('bg-muted');
      expect(screen.getByRole('row', { name: /Alice/ }).className).toContain('hover:bg-muted/50');
    });

    it('elevated adds the elevation-table shadow to the container', () => {
      render(<BasicTable elevated />);
      expect(screen.getByRole('table').parentElement).toHaveClass('shadow-elevation-table');
    });

    it('headerTone=muted paints the header band with muted and subtle text', () => {
      render(<BasicTable headerTone="muted" />);
      expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('bg-muted', 'text-text-muted');
      expect(screen.getAllByRole('rowgroup')[0]).toHaveClass('bg-muted');
    });

    it('rowHover=table swaps the hover wash for the table hover token', () => {
      render(<BasicTable rowHover="table" />);
      const cls = screen.getByRole('row', { name: /Alice/ }).className;
      expect(cls).toContain('hover:bg-table-background-hover');
      expect(cls).not.toContain('hover:bg-muted/50');
    });

    it('select cells use the table-select width token', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell select>x</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );
      expect(screen.getByRole('cell')).toHaveClass('w-[var(--size-table-select)]');
    });

    it('TableLeadCell renders a decorative logo, the name and supporting text in a cell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableLeadCell name="Nordwind Handel" supportingText="Berlin" logo={<span data-testid="logo" />} />
            </TableRow>
          </TableBody>
        </Table>,
      );
      expect(screen.getByRole('cell', { name: /Nordwind Handel/ })).toHaveTextContent('Nordwind HandelBerlin');
      expect(screen.getByTestId('logo').parentElement).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

const inTable = (row: React.ReactNode, rowProps: React.ComponentProps<typeof TableRow> = {}) =>
  render(
    <Table>
      <TableBody>
        <TableRow {...rowProps}>{row}</TableRow>
      </TableBody>
    </Table>,
  );

describe('Table cell styles and states (Figma Table cell)', () => {
  it('plain TableCell is unchanged: no height, alignment, state or aria attributes', () => {
    inTable(<TableCell>Plain</TableCell>);
    const cell = screen.getByRole('cell', { name: 'Plain' });
    expect(cell).toHaveClass('typography-table-cell', 'px-4', 'py-2');
    expect(cell.className).not.toMatch(/h-row|text-right|ring-|bg-table|border-l-2/);
    expect(cell).not.toHaveAttribute('aria-invalid');
    expect(cell).not.toHaveAttribute('aria-disabled');
    expect(cell).not.toHaveAttribute('data-state');
  });

  it('row selected still tints the row and exposes aria-selected for lead logo, badge and checkbox cells', () => {
    inTable(
      <>
        <TableLeadCell logo={<LogoTile initials="NH" />} name="Nordwind Handel GmbH" />
        <TableBadgeCell>
          <Chip variant="success">Active</Chip>
        </TableBadgeCell>
        <TableCell select>
          <input type="checkbox" aria-label="Select row" defaultChecked />
        </TableCell>
      </>,
      { selected: true },
    );
    const row = screen.getAllByRole('row')[0];
    expect(row).toHaveAttribute('data-state', 'selected');
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(row).toHaveClass('bg-accent');
  });

  it('cell selected applies the table selected background and data-state', () => {
    inTable(<TableCell selected>Sel</TableCell>);
    const cell = screen.getByRole('cell', { name: 'Sel' });
    expect(cell).toHaveClass('bg-table-background-selected');
    expect(cell).toHaveAttribute('data-state', 'selected');
  });

  it('align right and row heights map to the row tokens', () => {
    inTable(
      <>
        <TableCell align="right" rowHeight="default">
          42
        </TableCell>
        <TableCell rowHeight="two-line">Two</TableCell>
      </>,
    );
    expect(screen.getByRole('cell', { name: '42' })).toHaveClass('text-right', 'h-row');
    expect(screen.getByRole('cell', { name: 'Two' })).toHaveClass('h-row-two-line');
  });

  it('active, focused, invalid and disabled states', () => {
    inTable(
      <>
        <TableCell active>A</TableCell>
        <TableCell focused>F</TableCell>
        <TableCell invalid>E</TableCell>
        <TableCell disabled>D</TableCell>
      </>,
    );
    expect(screen.getByRole('cell', { name: 'A' })).toHaveClass('border-l-2', 'border-l-border-brand', 'bg-background-brand-subtle');
    expect(screen.getByRole('cell', { name: 'F' })).toHaveClass('ring-2', 'ring-inset', 'ring-border-focus');
    const err = screen.getByRole('cell', { name: 'E' });
    expect(err).toHaveClass('text-text-destructive', 'ring-border-destructive');
    expect(err).toHaveAttribute('aria-invalid', 'true');
    const dis = screen.getByRole('cell', { name: 'D' });
    expect(dis).toHaveClass('opacity-disabled');
    expect(dis).toHaveAttribute('aria-disabled', 'true');
  });

  it('tag renders a chip after the content', () => {
    inTable(
      <TableCell tag={<Chip size="small">from time</Chip>}>Olivia Rhye</TableCell>,
    );
    const cell = screen.getByRole('cell');
    expect(cell).toHaveTextContent('Olivia Rhyefrom time');
  });

  it('TableBadgeCell pads with space/3 by default and space/6 when wide', () => {
    inTable(
      <>
        <TableBadgeCell>
          <Chip>Default</Chip>
        </TableBadgeCell>
        <TableBadgeCell padding="wide" selected disabled>
          <Chip>Wide</Chip>
        </TableBadgeCell>
      </>,
    );
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveClass('px-3');
    expect(cells[0].className).not.toMatch(/(^|\s)px-4/);
    expect(cells[1]).toHaveClass('px-6', 'bg-table-background-selected', 'opacity-disabled');
  });

  it('TableLeadCell: control slot is exposed, logo stays decorative, tag follows the name', () => {
    inTable(
      <TableLeadCell
        control={<input type="checkbox" aria-label="Select Nordwind Handel" />}
        logo={<LogoTile initials="NH" color={3} />}
        name="Nordwind Handel GmbH"
        supportingText="Berlin"
        tag={<Chip size="small">Required</Chip>}
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Nordwind Handel' })).toBeInTheDocument();
    expect(screen.getByText('NH')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('NH')).toHaveClass('bg-data-project-3');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('TableRow active sets aria-current and the brand accent, selected wins', () => {
    inTable(<TableCell>A</TableCell>, { active: true });
    const row = screen.getAllByRole('row')[0];
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(row).toHaveClass('border-l-border-brand', 'bg-background-brand-subtle');
  });

  it('TableRow active is a no-op when selected', () => {
    inTable(<TableCell>A</TableCell>, { active: true, selected: true });
    expect(screen.getAllByRole('row')[0].className).not.toMatch(/bg-background-brand-subtle/);
  });
});

describe('Table DataGrid states and densities (Figma Table)', () => {
  it('zero density: 34px head and 44px rows with 12px padding', () => {
    render(
      <Table density="zero">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>A</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('h-table-head', 'px-3', 'py-2');
    expect(screen.getByRole('cell', { name: 'A' })).toHaveClass('h-row', 'px-3');
  });

  it('zero-compact density: 36px rows', () => {
    render(
      <Table density="zero-compact">
        <TableBody>
          <TableRow>
            <TableCell>A</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell', { name: 'A' })).toHaveClass('h-row-compact');
  });

  it('default density keeps the existing head and cell classes', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>A</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).toHaveClass('h-8', 'px-4', 'py-2');
    expect(screen.getByRole('cell')).toHaveClass('px-4', 'py-2');
    expect(screen.getByRole('cell').className).not.toMatch(/h-row/);
  });

  it('TableEmpty plain text default is unchanged and rich props render the EmptyState', () => {
    const wrap = (el: React.ReactNode) => (
      <Table>
        <TableBody>{el}</TableBody>
      </Table>
    );
    const { rerender } = render(wrap(<TableEmpty columns={2} />));
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(wrap(<TableEmpty columns={2} title="No clients" description="Try another filter." actions={<button type="button">Clear</button>} />));
    expect(screen.getByRole('status')).toHaveTextContent('No clients');
    expect(screen.getByText('Try another filter.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('TableError is an alert with a working retry', async () => {
    const onRetry = jest.fn();
    render(
      <Table>
        <TableBody>
          <TableError columns={3} onRetry={onRetry} />
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Data could not be loaded');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '3');
  });

  it('TableError without onRetry has no button', () => {
    render(
      <Table>
        <TableBody>
          <TableError columns={1} />
        </TableBody>
      </Table>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('TableLoadingMore announces loading and offers Load more when idle', async () => {
    const onLoadMore = jest.fn();
    const { rerender } = render(
      <Table>
        <TableBody>
          <TableLoadingMore columns={2} loading />
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Loading more').closest('[role="status"]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(
      <Table>
        <TableBody>
          <TableLoadingMore columns={2} onLoadMore={onLoadMore} />
        </TableBody>
      </Table>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('TableLoading skeleton="row" uses the overlay skeleton rows, default keeps tiles', () => {
    const { container, rerender } = render(<TableLoading columns={3} rows={2} />);
    expect(container.querySelector('.animate-pulse.rounded-default.bg-overlay-skeleton-default')).toBeInTheDocument();
    rerender(<TableLoading columns={3} rows={3} skeleton="row" />);
    expect(container.querySelectorAll('.h-row')).toHaveLength(3);
    expect(container.querySelector('.bg-overlay-skeleton-default')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading table data');
  });

  describe('align and stickyMode', () => {
    it('right-aligns a plain head and a sortable head with its button', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="right">Plain</TableHead>
              <TableHead align="right" sortable sortDirection="asc" onSort={() => undefined}>
                Hours
              </TableHead>
              <TableHead>Default</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );
      const [plain, sortable, def] = screen.getAllByRole('columnheader');
      expect(plain).toHaveClass('text-right');
      expect(plain.firstElementChild).toHaveClass('justify-end');
      expect(sortable).toHaveClass('text-right');
      expect(sortable).toHaveAttribute('aria-sort', 'ascending');
      expect(screen.getByRole('button', { name: 'Hours' })).toHaveClass('justify-end');
      expect(def).not.toHaveClass('text-right');
    });

    it('caps the height only when maxHeight is set, fills the parent in parent mode', () => {
      const { rerender } = render(<BasicTable />);
      expect(screen.getByRole('table').parentElement).not.toHaveClass('overflow-y-auto');
      expect((screen.getByRole('table').parentElement as HTMLElement).style.maxHeight).toBe('');
      rerender(<BasicTable maxHeight="60vh" />);
      expect(screen.getByRole('table').parentElement).toHaveStyle({ maxHeight: '60vh' });
      rerender(<BasicTable stickyMode="parent" />);
      const wrapper = screen.getByRole('table').parentElement as HTMLElement;
      expect(wrapper).toHaveClass('h-full', 'overflow-y-auto');
      expect(wrapper.style.maxHeight).toBe('');
    });

    it('sticks under the top bar in page mode without an overflow container', () => {
      render(<BasicTable stickyMode="page" />);
      const wrapper = screen.getByRole('table').parentElement as HTMLElement;
      expect(wrapper).toHaveClass('overflow-visible');
      expect(wrapper).not.toHaveClass('overflow-x-auto');
      expect(screen.getAllByRole('rowgroup')[0]).toHaveClass('sticky', 'top-[var(--table-sticky-offset,var(--size-topbar))]');
      expect((screen.getAllByRole('rowgroup')[0] as HTMLElement).style.getPropertyValue('--table-sticky-offset')).toBe('');
    });

    it('stickyOffset stacks the page header below a toolbar through the offset variable', () => {
      render(<BasicTable stickyMode="page" stickyOffset="calc(var(--size-topbar) + var(--size-control-lg))" />);
      expect((screen.getAllByRole('rowgroup')[0] as HTMLElement).style.getPropertyValue('--table-sticky-offset')).toBe('calc(var(--size-topbar) + var(--size-control-lg))');
    });

    it('stickyOffset is ignored outside page mode', () => {
      render(<BasicTable stickyOffset="10px" />);
      expect((screen.getAllByRole('rowgroup')[0] as HTMLElement).style.getPropertyValue('--table-sticky-offset')).toBe('');
    });
  });
});

describe('Table scroll container 0.29', () => {
  it('exposes the overflowing scroll container as a named region and draws the focus ring in an overlay', () => {
    const { container } = render(
      <Table scrollLabel="Time entries">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const scroller = container.querySelector('table')?.parentElement as HTMLElement;
    expect(scroller).toHaveClass('peer');
    // The overlay stays in its own stacking context: it must not paint over an app bar on the same z-index.
    expect(scroller.parentElement).toHaveClass('relative', 'isolate');
    const overlay = scroller.nextElementSibling as HTMLElement;
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    // DR-0290-01: the overlay is on the sticky layer, never on the chrome layer of an app top bar (z-30).
    expect(overlay).toHaveClass('peer-focus-visible:block', 'z-sticky', 'outline-2');
    expect(overlay).not.toHaveClass('z-chrome');
  });
});

describe('TableEmpty frame in the visible scroll area (RA-LIB-05)', () => {
  const emptyTable = (props: Partial<React.ComponentProps<typeof TableEmpty>> = {}) => (
    <Table scrollLabel="People">
      <TableBody>
        <TableEmpty columns={3} message="No people" {...props} />
      </TableBody>
    </Table>
  );

  it('puts the content in a sticky frame as wide as the visible scroll area, minus the row gutter on both sides', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const { container } = render(emptyTable());
    const frame = container.querySelector('[data-slot="table-empty-frame"]') as HTMLElement;
    expect(frame).toHaveClass('sticky', 'max-w-full');
    expect(frame.style.left).toBe('4px');
    expect(frame.style.width).toBe('292px');
    expect(frame.parentElement).toHaveClass('px-0');
    expect(frame).toHaveTextContent('No people');
    spy.mockRestore();
  });

  it('keeps the rich variant centred inside the same frame', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const { container } = render(emptyTable({ title: 'No people found', description: 'Change the filters.' }));
    const frame = container.querySelector('[data-slot="table-empty-frame"]') as HTMLElement;
    expect(frame.firstElementChild).toHaveClass('mx-auto', 'max-w-lg');
    expect(screen.getByText('No people found')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('falls back to the cell width until the scroll area is measured', () => {
    const { container } = render(emptyTable());
    const frame = container.querySelector('[data-slot="table-empty-frame"]') as HTMLElement;
    expect(frame.getAttribute('style')).toBeNull();
  });

  it('still forwards the ref to the cell and lets a className win over the default padding', () => {
    const ref = createRef<HTMLTableCellElement>();
    render(emptyTable({ ref, className: 'px-8' }));
    expect(ref.current?.tagName).toBe('TD');
    expect(ref.current).toHaveClass('px-8');
    expect(ref.current).not.toHaveClass('px-0');
  });
});
