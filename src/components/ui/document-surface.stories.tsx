import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';
import { DocumentSurface } from './document-surface';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';

const meta = {
  id: 'primitives-documentsurface',
  title: 'Primitives · Layout/DocumentSurface',
  component: DocumentSurface,
  tags: ['autodocs'],
  argTypes: { fluid: { control: 'boolean' } },
} satisfies Meta<typeof DocumentSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        <h2 className="typography-page-title">Invoice 2026-0042</h2>
        <p>The surface stays light in dark mode so previews match the printed page.</p>
      </div>
    ),
  },
};

export const Fluid: Story = { args: { ...Default.args, fluid: true } };

const lines = [
  { item: 'Design system audit', qty: 1, price: '1.800,00' },
  { item: 'Component build', qty: 4, price: '3.200,00' },
];

// Switch the toolbar to Dark: the paper stays white and the table, badge and totals keep their light colours.
export const WithTableAndTotals: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="typography-page-title">Invoice 2026-0042</h2>
          <Badge variant="success">Paid</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.item}>
                <TableCell>{line.item}</TableCell>
                <TableCell className="text-right">{line.qty}</TableCell>
                <TableCell className="text-right">{line.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell className="text-right">5.000,00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    ),
  },
};
