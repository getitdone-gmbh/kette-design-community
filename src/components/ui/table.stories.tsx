import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@storybook/testing-library';
import { useState, type ReactNode } from 'react';

import { Avatar, AvatarFallback } from './avatar';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import { Chip } from './chip';
import { LogoTile, type LogoTileColor } from './logo-tile';

import {
  type SortDirection,
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

const meta = {
  id: 'primitives-table',
  title: 'Primitives · Display/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    density: { control: { type: 'select' }, options: ['default', 'zero'], description: 'Row and header height.' },
    striped: { control: { type: 'boolean' }, description: 'Alternating row fill.' },
    stickyHeader: { control: { type: 'boolean' }, description: 'Keeps the header visible while the rows scroll.' },
    stickyMode: { description: 'What the header sticks to: its own scroll area, the parent or the page.' },
    stickyOffset: { description: 'Distance from the top where the header sticks in page mode.' },
    headerTone: { description: 'Header band colour: surface or muted.' },
    rowHover: { description: 'Row hover colour.' },
    maxHeight: { description: 'Height cap of the scroll area; the table scrolls inside itself above it.' },
    elevated: { control: { type: 'boolean' }, description: 'Shadow around the table.' },
    scrollLabel: { description: 'Accessible name of the scroll area when the table overflows.' },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card',
  },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const CompactDensity: Story = {
  render: () => (
    <Table density="compact">
      <TableCaption>Compact density table</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 5).map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const DefaultDensity: Story = {
  render: () => (
    <Table density="default">
      <TableCaption>Default density table</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 5).map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const ComfortableDensity: Story = {
  render: () => (
    <Table density="comfortable">
      <TableCaption>Comfortable density table</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 5).map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithoutStickyHeader: Story = {
  render: () => (
    <Table stickyHeader={false}>
      <TableCaption>Table without sticky header</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 15 }, (_, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">User {i + 1}</TableCell>
            <TableCell>user{i + 1}@example.com</TableCell>
            <TableCell>{['Developer', 'Designer', 'Manager'][i % 3]}</TableCell>
            <TableCell>{i % 3 === 0 ? 'Active' : 'Inactive'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Lena Hartmann</TableCell>
          <TableCell>lena.hartmann@example.com</TableCell>
          <TableCell>Developer</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Tobias Lindner</TableCell>
          <TableCell>tobias.lindner@example.com</TableCell>
          <TableCell>Designer</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Anna Becker</TableCell>
          <TableCell>emily.park@example.com</TableCell>
          <TableCell>Manager</TableCell>
          <TableCell>Inactive</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableCaption>No data available.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithHoverState: Story = {
  name: 'Interactive rows show a hover state layer (plain rows do not)',
  render: () => (
    <Table>
      <TableCaption>
        The first three rows are wired with `onClick` (real hover/press affordance); the last row is
        plain and must NOT show a hover background or pointer cursor.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow onClick={() => window.alert('Open Laptop Pro')} aria-label="Open Laptop Pro">
          <TableCell className="font-medium">Laptop Pro</TableCell>
          <TableCell>Electronics</TableCell>
          <TableCell className="text-right">12</TableCell>
          <TableCell className="text-right">$1,999.00</TableCell>
        </TableRow>
        <TableRow onClick={() => window.alert('Open Wireless Mouse')} aria-label="Open Wireless Mouse">
          <TableCell className="font-medium">Wireless Mouse</TableCell>
          <TableCell>Accessories</TableCell>
          <TableCell className="text-right">143</TableCell>
          <TableCell className="text-right">$79.00</TableCell>
        </TableRow>
        <TableRow onClick={() => window.alert('Open USB-C Cable')} aria-label="Open USB-C Cable">
          <TableCell className="font-medium">USB-C Cable</TableCell>
          <TableCell>Accessories</TableCell>
          <TableCell className="text-right">0</TableCell>
          <TableCell className="text-right">$19.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">HDMI Adapter (not clickable)</TableCell>
          <TableCell>Accessories</TableCell>
          <TableCell className="text-right">54</TableCell>
          <TableCell className="text-right">$14.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithSelectedState: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Complete project documentation</TableCell>
          <TableCell>In Progress</TableCell>
          <TableCell>High</TableCell>
          <TableCell>2024-01-15</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell className="font-medium">Review pull requests</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>Medium</TableCell>
          <TableCell>2024-01-12</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Update dependencies</TableCell>
          <TableCell>Complete</TableCell>
          <TableCell>Low</TableCell>
          <TableCell>2024-01-10</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const InteractiveRows: Story = {
  name: 'Interactive rows (hover / focus-visible / active)',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: 'Laptop Pro', category: 'Electronics', stock: 12, price: '$1,999.00' },
          { name: 'Wireless Mouse', category: 'Accessories', stock: 143, price: '$79.00' },
          { name: 'USB-C Cable', category: 'Accessories', stock: 0, price: '$19.00' },
        ].map((item) => (
          // No manual `cursor-pointer`/tabIndex/keydown wiring needed — passing `onClick` alone
          // opts the row into the full interactive state set (hover, focus-visible ring, active
          // press, keyboard Enter- or Space-to-activate). `aria-label` gives the row an accessible
          // name beyond the native "row" role (WCAG 4.1.2).
          <TableRow key={item.name} onClick={() => window.alert(`Open ${item.name}`)} aria-label={`Open ${item.name}`}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell className="text-right">{item.stock}</TableCell>
            <TableCell className="text-right">{item.price}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const DisabledRow: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Migrate database</TableCell>
          <TableCell>In Progress</TableCell>
          <TableCell>Alex</TableCell>
        </TableRow>
        <TableRow disabled onClick={() => window.alert('should never fire')}>
          <TableCell className="font-medium">Archived task (locked)</TableCell>
          <TableCell>Locked</TableCell>
          <TableCell>—</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const InvalidRow: Story = {
  render: () => (
    <Table>
      <TableCaption>Rows flagged by an import validation pass.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Row</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">1</TableCell>
          <TableCell>jonas.weber@example.com</TableCell>
          <TableCell>$120.00</TableCell>
        </TableRow>
        <TableRow invalid>
          <TableCell className="font-medium">2</TableCell>
          <TableCell>not-an-email</TableCell>
          <TableCell>$0.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Responsive: Story = {
  name: 'Responsive (horizontal scroll, no clipped columns)',
  render: () => (
    // `Table` owns its own `overflow-x-auto` + `rounded-default` border wrapper now — no
    // hand-rolled `overflow-hidden` wrapper needed (that would have clipped, not scrolled, any
    // column that didn't fit). The `max-w-md` here only constrains the demo viewport so the
    // scroll behavior is visible in this story.
    <div className="max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Transaction ID</TableHead>
            <TableHead className="min-w-[150px]">Date</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="min-w-[150px]">Category</TableHead>
            <TableHead className="min-w-[150px] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">TXN-001-2024</TableCell>
            <TableCell>Jan 10, 2024</TableCell>
            <TableCell>Monthly subscription payment for cloud services</TableCell>
            <TableCell>Software</TableCell>
            <TableCell className="text-right">$49.99</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">TXN-002-2024</TableCell>
            <TableCell>Jan 11, 2024</TableCell>
            <TableCell>Office supplies and stationery purchase</TableCell>
            <TableCell>Operations</TableCell>
            <TableCell className="text-right">$125.50</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">TXN-003-2024</TableCell>
            <TableCell>Jan 12, 2024</TableCell>
            <TableCell>Team lunch meeting at downtown restaurant</TableCell>
            <TableCell>Entertainment</TableCell>
            <TableCell className="text-right">$280.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithoutStickyHeaderWideScrolls: Story = {
  name: 'Without sticky header (still scrolls horizontally, not the page)',
  render: () => (
    <div className="max-w-md">
      <Table stickyHeader={false}>
        <TableCaption>`stickyHeader=false` still gets a bounded horizontal scroll container.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Transaction ID</TableHead>
            <TableHead className="min-w-[150px]">Date</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="min-w-[150px]">Category</TableHead>
            <TableHead className="min-w-[150px] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">TXN-001-2024</TableCell>
            <TableCell>Jan 10, 2024</TableCell>
            <TableCell>Monthly subscription payment for cloud services</TableCell>
            <TableCell>Software</TableCell>
            <TableCell className="text-right">$49.99</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const SelectedAndInvalidOnStripedRows: Story = {
  name: 'Selected/invalid state wins over the zebra stripe',
  render: () => (
    <Table striped>
      <TableCaption>Even rows 2 and 4 are `selected`/`invalid` — their state tint and left-accent border must win over the stripe.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Jonas Weber</TableCell>
          <TableCell>jonas.weber@example.com</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell className="font-medium">Emily Park</TableCell>
          <TableCell>emily.park@example.com</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Sarah Tran</TableCell>
          <TableCell>sarah.tran@example.com</TableCell>
          <TableCell>On Leave</TableCell>
        </TableRow>
        <TableRow invalid>
          <TableCell className="font-medium">Mia Hofmann</TableCell>
          <TableCell>not-an-email</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Striped: Story = {
  render: () => (
    <Table striped>
      <TableCaption>Striped table rows</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Jonas Weber</TableCell>
          <TableCell>jonas.weber@example.com</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Emily Park</TableCell>
          <TableCell>emily.park@example.com</TableCell>
          <TableCell>Marketing</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Sarah Tran</TableCell>
          <TableCell>sarah.tran@example.com</TableCell>
          <TableCell>Sales</TableCell>
          <TableCell>On Leave</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Mia Hofmann</TableCell>
          <TableCell>mia.hofmann@example.com</TableCell>
          <TableCell>HR</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Jonas Meier</TableCell>
          <TableCell>jonas.meier@example.com</TableCell>
          <TableCell>Finance</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

const SortableTable = () => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(false);

    const data = [
      { id: 1, name: 'Laptop', price: 999, stock: 15 },
      { id: 2, name: 'Mouse', price: 29, stock: 150 },
      { id: 3, name: 'Keyboard', price: 79, stock: 85 },
      { id: 4, name: 'Monitor', price: 299, stock: 32 },
      { id: 5, name: 'Headphones', price: 99, stock: 67 },
    ];

    const handleSort = (key: string) => {
      if (sortKey === key) {
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else if (sortDirection === 'desc') {
          setSortDirection(false);
          setSortKey(null);
        } else {
          setSortDirection('asc');
        }
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    };

    const sortedData = [...data].sort((a, b) => {
      if (!sortKey || !sortDirection) return 0;

      const aValue = a[sortKey as keyof typeof a];
      const bValue = b[sortKey as keyof typeof b];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            sortable
            sortDirection={sortKey === 'name' ? sortDirection : false}
            onSort={() => handleSort('name')}
          >
            Product
          </TableHead>
          <TableHead
            sortable
            sortDirection={sortKey === 'price' ? sortDirection : false}
            onSort={() => handleSort('price')}
            className="text-right"
          >
            Price
          </TableHead>
          <TableHead
            sortable
            sortDirection={sortKey === 'stock' ? sortDirection : false}
            onSort={() => handleSort('stock')}
            className="text-right"
          >
            Stock
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-right">${item.price}</TableCell>
            <TableCell className="text-right">{item.stock}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const Sortable: Story = {
  render: () => <SortableTable />,
};

export const LoadingState: Story = {
  render: () => <TableLoading columns={4} rows={5} />,
};

export const EmptyWithCustomMessage: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty columns={4} message="No orders found. Try adjusting your filters." />
      </TableBody>
    </Table>
  ),
};

const StickyHeaderTable = () => {
  const longData = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: ['Engineering', 'Sales', 'Marketing', 'HR'][i % 4],
    salary: 50000 + Math.floor(Math.random() * 50000),
    startDate: new Date(2020 + Math.floor(i / 5), i % 12, 1).toLocaleDateString(),
  }));

  return (
    <Table maxHeight="24rem">
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead className="text-right">Salary</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {longData.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>{employee.id}</TableCell>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.department}</TableCell>
            <TableCell>{employee.startDate}</TableCell>
            <TableCell className="text-right">${employee.salary.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const StickyHeader: Story = {
  render: () => <StickyHeaderTable />,
};

/** Opt-in zero treatment: muted header band, table hover token, elevation-table container, select column, lead cell with logo. */
export const ZeroStyle: Story = {
  render: () => (
    <Table headerTone="muted" rowHover="table" elevated stickyHeader={false}>
      <TableCaption>Companies</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead select>
            <Checkbox aria-label="Select all" />
          </TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: 'Acme GmbH', sub: 'Berlin', initials: 'AG', tone: 'bg-data-avatar-3-default text-data-avatar-3-on' },
          { name: 'Globex AG', sub: 'Zurich', initials: 'GA', tone: 'bg-data-avatar-5-default text-data-avatar-5-on' },
        ].map((row) => (
          <TableRow key={row.name}>
            <TableCell select>
              <Checkbox aria-label={`Select ${row.name}`} />
            </TableCell>
            <TableLeadCell
              name={row.name}
              supportingText={row.sub}
              logo={
                <Avatar shape="square" size="xs">
                  <AvatarFallback size="xs" className={row.tone}>
                    {row.initials}
                  </AvatarFallback>
                </Avatar>
              }
            />
            <TableCell>Active</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

const leadRows: Array<{ name: string; sub: string; initials: string; color: LogoTileColor; status: string }> = [
  { name: 'Acme GmbH', sub: 'Berlin', initials: 'AG', color: 1, status: 'Active' },
  { name: 'Globex AG', sub: 'Zurich', initials: 'GA', color: 4, status: 'Active' },
  { name: 'Hansa Logistik', sub: 'Hamburg', initials: 'HL', color: 6, status: 'Active' },
];

// Lead logo (LogoTile), Badge default and Checkbox select cells, with a selected row and an open (active) row.
const ClientsDemo = () => {
  const [selected, setSelected] = useState<string[]>(['Globex AG']);
  return (
    <Table density="default">
      <TableCaption>Clients</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead select aria-label="Select" />
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leadRows.map((r) => {
          const isSelected = selected.includes(r.name);
          return (
            <TableRow key={r.name} selected={isSelected} active={r.name === 'Hansa Logistik'}>
              <TableCell select>
                <Checkbox
                  aria-label={`Select ${r.name}`}
                  checked={isSelected}
                  onCheckedChange={(v) => setSelected((cur) => (v ? [...cur, r.name] : cur.filter((n) => n !== r.name)))}
                />
              </TableCell>
              <TableLeadCell logo={<LogoTile initials={r.initials} color={r.color} />} name={r.name} supportingText={r.sub} />
              <TableBadgeCell>
                <Badge variant="success">{r.status}</Badge>
              </TableBadgeCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const LeadLogoBadgeCheckbox: Story = {
  render: () => <ClientsDemo />,
};

// Cell level states: Default, Selected, Active, Focused, Error, Disabled, plus Align=Right, Two-line and Tag.
export const CellStates: Story = {
  render: () => (
    <Table>
      <TableCaption>Cell states</TableCaption>
      <TableBody>
        <TableRow>
          <TableCell rowHeight="default">Default</TableCell>
          <TableCell rowHeight="default" selected>
            Selected
          </TableCell>
          <TableCell rowHeight="default" active>
            Active
          </TableCell>
          <TableCell rowHeight="default" focused>
            Focused
          </TableCell>
          <TableCell rowHeight="default" invalid>
            Error
          </TableCell>
          <TableCell rowHeight="default" disabled>
            Disabled
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell rowHeight="two-line" align="right">
            1,240.00
          </TableCell>
          <TableCell rowHeight="two-line" tag={<Chip size="small">from time</Chip>}>
            Lena Hartmann
          </TableCell>
          <TableLeadCell rowHeight="two-line" name="Timesheet due" tag={<Chip variant="warning" size="small">Required</Chip>} />
          <TableBadgeCell rowHeight="two-line" padding="wide">
            <Badge variant="success">Active</Badge>
          </TableBadgeCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// Figma DataGrid densities: Default (rows 44) and Compact (rows 36), head 34 in both.
export const ZeroDensity: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['zero', 'zero-compact'] as const).map((d) => (
        <Table key={d} density={d} headerTone="muted">
          <TableCaption>{d}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Lena Hartmann</TableCell>
              <TableCell>Designer</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tobias Lindner</TableCell>
              <TableCell>Engineer</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ))}
    </div>
  ),
};

export const RichEmpty: Story = {
  render: () => (
    <Table>
      <TableBody>
        <TableEmpty columns={3} title="No projects found" description="Your search did not match any projects." actions={<button type="button">Clear search</button>} />
      </TableBody>
    </Table>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <Table>
      <TableBody>
        <TableError columns={3} title="List not loaded" onRetry={() => undefined} />
      </TableBody>
    </Table>
  ),
};

export const LazyLoadingFooter: Story = {
  render: () => (
    <Table density="zero">
      <TableBody>
        <TableRow>
          <TableCell>Lena Hartmann</TableCell>
        </TableRow>
        <TableLoadingMore columns={1} loading />
      </TableBody>
    </Table>
  ),
};

export const SkeletonRows: Story = {
  render: () => <TableLoading columns={4} rows={4} skeleton="row" />,
};

export const RightAlignedSortableHead: Story = {
  render: () => (
    <Table stickyHeader={false}>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead align="right" sortable sortDirection="desc" onSort={() => undefined}>
            Hours
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Jonas</TableCell>
          <TableCell align="right">38.5</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const StickyInParent: Story = {
  render: () => (
    <div className="h-64">
      <Table stickyMode="parent">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>{`Person ${i + 1}`}</TableCell>
              <TableCell>Engineer</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const StickyUnderTopbar: Story = {
  render: () => (
    <Table stickyMode="page">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 40 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>{`Person ${i + 1}`}</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// Stacks the page header below a sticky toolbar: stickyOffset adds the toolbar height to the top bar (sets --table-sticky-offset).
export const StickyUnderTopbarAndToolbar: Story = {
  render: () => (
    <div>
      <div className="sticky top-topbar z-20 flex h-control-lg items-center border-0 border-b border-solid border-hairline bg-background px-3 typography-ui">Toolbar</div>
      <Table stickyMode="page" stickyOffset="calc(var(--size-topbar) + var(--size-control-lg))">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 40 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>{`Person ${i + 1}`}</TableCell>
              <TableCell>Engineer</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

// A pinned first column stays opaque in every row state (hover, selected, invalid) and shows an edge shadow only while the table is scrolled sideways.
export const PinnedColumn: Story = {
  render: () => (
    <div className="max-w-[480px]">
      <Table stickyHeader={false}>
        <TableHeader>
          <TableRow>
            <TableHead pinned>Name</TableHead>
            {['Role', 'Team', 'Location', 'Start', 'Manager', 'Status'].map((h) => (
              <TableHead key={h} className="min-w-[160px]">{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {['Lena', 'Tobias', 'Anna', 'Jonas'].map((name, i) => (
            <TableRow key={name} selected={i === 1} invalid={i === 2}>
              <TableCell pinned>{name}</TableCell>
              {['Engineer', 'Platform', 'Berlin', '2024-01-02', 'Alex', 'Active'].map((v) => (
                <TableCell key={v}>{v}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

// The table grows with its rows. `maxHeight` opts into a capped scroll area where the header sticks.
export const MaxHeight: Story = {
  render: () => (
    <Table maxHeight="12rem">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 20 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>{`Person ${i + 1}`}</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// A wide table in a narrow container (320px): the scroll container is a tab stop and its focus ring is an inset outline that sits above the cells.
export const NarrowScrollRegionFocus: Story = {
  render: () => (
    <div className="w-80">
      <Table scrollLabel="Time entries">
        <TableCaption>Time entries</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }, (_, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap">Project {i + 1}</TableCell>
              <TableCell className="whitespace-nowrap">Implementation and review</TableCell>
              <TableCell className="whitespace-nowrap">2026-10-0{i + 1}</TableCell>
              <TableCell>7.5</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

// DR-0290-01: under a fixed app top bar (z-30) the focus ring of a tall scroll region must not paint into the bar when the region is scrolled underneath it. The test runner tabs into the region at 390x844, scrolls its top 30px below the viewport top and counts ring pixels inside the bar (limit 20, target 0).
export const FocusRingUnderFixedBar: Story = {
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    focusRingUnderBar: { width: 390, height: 844, bar: '[data-testid="app-bar"]', region: '[role="region"]' },
  },
  render: () => (
    <div>
      <header data-testid="app-bar" className="typography-ui fixed inset-x-0 top-0 z-30 flex h-topbar items-center border-0 border-b border-solid border-border bg-background px-4">
        App bar
      </header>
      <main className="px-4 pb-8 pt-[calc(var(--size-topbar)+1rem)]">
        <Table scrollLabel="Suppression list">
          <TableCaption>Suppression list</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 30 }, (_, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap">{`contact${i + 1}@example-${i + 1}.example`}</TableCell>
                <TableCell className="whitespace-nowrap">Unsubscribe request</TableCell>
                <TableCell className="whitespace-nowrap">Reply</TableCell>
                <TableCell className="whitespace-nowrap">2026-10-01</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  ),
};

// RA-LIB-05: a wide table in a narrow area (320px, eight 160px columns) with nothing to show. The empty state is centred in the visible scroll area, not in the full table width, so it stays on screen and also stays centred while the table is scrolled sideways.
const emptyColumns = ['Name', 'Role', 'Team', 'Location', 'Start', 'Manager', 'Status', 'Updated'];
const emptyMiddle = (canvasElement: HTMLElement) => {
  const region = canvasElement.querySelector('[data-slot="table-empty-frame"]')?.closest('div[class*="overflow-x-auto"]') as HTMLElement;
  const text = within(canvasElement).getByText('No people found');
  const box = text.getBoundingClientRect();
  const visible = region.getBoundingClientRect();
  // The scroll container has a 1px border on each side.
  return { text: box.left + box.width / 2, area: visible.left + 1 + region.clientWidth / 2, region };
};
export const EmptyCentredInScrollArea: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="w-80">
      <Table scrollLabel="People">
        <TableCaption>People</TableCaption>
        <TableHeader>
          <TableRow>
            {emptyColumns.map((name) => (
              <TableHead key={name} className="min-w-[160px]">{name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty columns={emptyColumns.length} title="No people found" description="Change the filters to see more." />
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const { text, area, region } = emptyMiddle(canvasElement);
      expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
      expect(Math.abs(text - area)).toBeLessThanOrEqual(2);
    });
    // Scrolled to the far end it is still in the middle of what is visible.
    const { region } = emptyMiddle(canvasElement);
    region.scrollLeft = region.scrollWidth;
    await waitFor(() => {
      const { text, area } = emptyMiddle(canvasElement);
      expect(Math.abs(text - area)).toBeLessThanOrEqual(2);
    });
  },
};

// The plain message variant takes the same frame.
export const EmptyMessageCentredInScrollArea: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="w-80">
      <Table scrollLabel="People">
        <TableCaption>People</TableCaption>
        <TableHeader>
          <TableRow>
            {emptyColumns.map((name) => (
              <TableHead key={name} className="min-w-[160px]">{name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty columns={emptyColumns.length} message="No people found" />
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const { text, area } = emptyMiddle(canvasElement);
      expect(Math.abs(text - area)).toBeLessThanOrEqual(2);
    });
  },
};

// UX-030-02: the error and lazy-loading state rows take the same sticky frame as the empty state, so the message and the button stay on screen in a wide table in a narrow area.
const wideStateTable = (body: ReactNode) => (
  <div className="w-80">
    <Table scrollLabel="People">
      <TableCaption>People</TableCaption>
      <TableHeader>
        <TableRow>
          {emptyColumns.map((name) => (
            <TableHead key={name} className="min-w-[160px]">{name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{body}</TableBody>
    </Table>
  </div>
);
const insideScrollArea = (canvasElement: HTMLElement, el: HTMLElement) => {
  const region = canvasElement.querySelector('[data-slot="table-empty-frame"]')?.closest('div[class*="overflow-x-auto"]') as HTMLElement;
  const area = region.getBoundingClientRect();
  const box = el.getBoundingClientRect();
  return { region, left: box.left >= area.left - 1, right: box.right <= area.right + 1 };
};

export const ErrorCentredInScrollArea: Story = {
  parameters: { layout: 'padded' },
  render: () => wideStateTable(<TableError columns={emptyColumns.length} title="List not loaded" onRetry={() => undefined} />),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      const { region, left, right } = insideScrollArea(canvasElement, canvas.getByRole('button', { name: 'Try again' }));
      expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
      expect(left && right).toBe(true);
    });
    const { region } = insideScrollArea(canvasElement, canvas.getByText('List not loaded'));
    region.scrollLeft = region.scrollWidth;
    await waitFor(() => {
      const { left, right } = insideScrollArea(canvasElement, canvas.getByText('List not loaded'));
      expect(left && right).toBe(true);
    });
  },
};

export const LoadingMoreCentredInScrollArea: Story = {
  parameters: { layout: 'padded' },
  render: () => wideStateTable(<TableLoadingMore columns={emptyColumns.length} onLoadMore={() => undefined} />),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      const { region, left, right } = insideScrollArea(canvasElement, canvas.getByRole('button', { name: 'Load more' }));
      expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
      expect(left && right).toBe(true);
    });
  },
};
