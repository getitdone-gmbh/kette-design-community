import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { NotificationItem, NotificationList } from './activity-feed';
import { DesignSystemProvider } from './design-system-provider';
import { FacetFilter, FacetGroup, FacetOption } from './facet-filter';
import { KpiStrip, MetricItem } from './metric';
import { List } from './list/List';
import { Pagination } from './pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { cn } from '../../lib/utils';

describe('0.26 data and navigation fixes', () => {
  it('a NotificationItem directly in a NotificationList is a block, not a list item', () => {
    render(
      <NotificationList>
        <NotificationItem title="Paid" />
      </NotificationList>,
    );
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('a nested List moves into an unmarked list item of the outer list', () => {
    const { container } = render(
      <List type="numeric">
        <List.Item>One</List.Item>
        <List type="alphabetical">
          <List.Item>Inner</List.Item>
        </List>
      </List>,
    );
    expect(container.querySelector('ol > ol')).toBeNull();
    expect(container.querySelector('ol > li > ol')).not.toBeNull();
  });

  it('tabs without panels drop aria-controls', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'A' })).not.toHaveAttribute('aria-controls');
  });

  it('a select column head without text gets a visually hidden name', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead select aria-label="Select all" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).toHaveTextContent('Select all');
  });

  it('zero preset defaults the table to zero density and the default border', () => {
    const { container } = render(
      <DesignSystemProvider preset="zero">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>H</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>x</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DesignSystemProvider>,
    );
    expect(container.querySelector('th')?.className).toContain('h-table-head');
    expect(container.querySelector('td')?.className).toContain('h-row');
    expect(container.querySelector('tbody tr')?.className).toContain('border-border-default');
    expect(container.querySelector('tbody tr')?.className).not.toContain('border-hairline');
  });

  it('default preset keeps the hairline border and default density', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(container.querySelector('tr')?.className).toContain('border-hairline');
    expect(container.querySelector('td')?.className).toContain('px-4');
  });

  it('facet checkboxes are named by their option label', () => {
    render(
      <FacetFilter title="Filters">
        <FacetGroup label="Status">
          <FacetOption label="Active" count={3} />
        </FacetGroup>
      </FacetFilter>,
    );
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeInTheDocument();
  });

  it('page and card pagination collapse to a page summary below sm', () => {
    render(<Pagination variant="card" pageCount={10} defaultPage={2} />);
    expect(screen.getByText('Page 2 of 10')).toHaveClass('sm:hidden');
  });

  it('a later type role wins over an earlier one in cn', () => {
    expect(cn('typography-input-text', 'typography-detail')).toBe('typography-detail');
  });

  it('KpiStrip raised surface only adds a dark fill', () => {
    render(
      <KpiStrip surface="raised" aria-label="k">
        <MetricItem label="a" value="1" />
      </KpiStrip>,
    );
    expect(screen.getByRole('group')).toHaveClass('bg-surface-strip-raised');
  });
});
