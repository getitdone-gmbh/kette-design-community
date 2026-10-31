import type { Meta, StoryObj } from '@storybook/react';

import { CellGrid, CellGridCell } from './cell-grid';

const cell = (title: string, text: string) => (
  <>
    <p className="typography-ui-semibold m-0">{title}</p>
    <p className="typography-ui m-0 text-text-subtle">{text}</p>
  </>
);

const meta = {
  id: 'layout-cell-grid',
  title: 'Patterns · Interface/Cell grid',
  component: CellGrid,
  tags: ['autodocs'],
  argTypes: {
    columns: { control: { type: 'select' }, options: [1, 2, 3, 4] },
    padding: { control: { type: 'inline-radio' }, options: ['sm', 'md', 'lg'] },
    framed: { control: 'boolean' },
  },
  args: {
    columns: 3,
    items: [
      { id: '1', content: cell('Proof', 'Customers on the platform') },
      { id: '2', content: cell('Steps', 'Three steps to the first invoice') },
      { id: '3', content: cell('Roadmap', 'What ships next quarter') },
      { id: '4', content: cell('Security', 'Hosted in the EU') },
    ],
  },
} satisfies Meta<typeof CellGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TwoColumns: Story = { args: { columns: 2 } };
export const FourColumns: Story = { args: { columns: 4 } };
export const CustomCells: Story = {
  args: { items: undefined },
  render: (args) => (
    <CellGrid {...args} columns={2}>
      <CellGridCell>{cell('First', 'Custom cell content')}</CellGridCell>
      <CellGridCell className="bg-muted [&_.text-text-subtle]:text-text-subtle-on-muted">{cell('Second', 'Highlighted cell')}</CellGridCell>
    </CellGrid>
  ),
};
export const Unframed: Story = { args: { framed: false } };
export const ResponsiveColumns: Story = { args: { columns: { base: 2, md: 4 } } };
export const CompactPadding: Story = { args: { padding: 'sm' } };
export const LargePadding: Story = { args: { padding: 'lg' } };
export const SubtleHairline: Story = { args: { hairline: 'subtle' } };
export const CardSurface: Story = { args: { surface: 'card' } };
export const TransparentCells: Story = { args: { surface: 'none', hairline: 'subtle' } };
export const ResponsivePadding: Story = { args: { padding: { base: 'sm', md: 'md', lg: 'lg' } } };
