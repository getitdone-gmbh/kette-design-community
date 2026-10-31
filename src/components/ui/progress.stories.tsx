import type { Meta, StoryObj } from '@storybook/react';

import { Progress } from './progress';

const meta = {
  id: 'primitives-progress',
  title: 'Primitives · Display/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: { 'aria-label': 'Progress', value: 60 },
  argTypes: {
    variant: { control: { type: 'select' }, options: ['default', 'destructive', 'success', 'warning'] },
    size: { control: { type: 'select' }, options: ['sm', 'md'] },
    value: { control: { type: 'number' } },
  },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Destructive: Story = { args: { variant: 'destructive', value: 85 } };
export const Success: Story = { args: { variant: 'success', value: 100 } };
export const Warning: Story = { args: { variant: 'warning', value: 72 } };
export const Indeterminate: Story = { args: { value: null } };

export const Matrix: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      {(['md', 'sm'] as const).map((size) =>
        (['default', 'destructive', 'success', 'warning'] as const).map((variant) => (
          <Progress key={`${size}-${variant}`} aria-label={`${size} ${variant}`} size={size} variant={variant} value={45} />
        )),
      )}
    </div>
  ),
};

export const Labels: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      {(['right', 'bottom', 'top-floating', 'bottom-floating'] as const).map((label) => (
        <Progress key={label} aria-label={label} value={60} label={label} />
      ))}
    </div>
  ),
};

export const Stacked: Story = {
  args: {
    'aria-label': 'Sprint capacity',
    segments: [
      { value: 30, tone: 'success', label: 'Done' },
      { value: 20, tone: 'warning', label: 'In review' },
      { value: 15, tone: 'default', label: 'Open' },
    ],
  },
};

// Per-segment colour, for example project colours. The label keeps the meaning available without colour.
export const SegmentsWithProjectColors: Story = {
  args: {
    'aria-label': 'Hours by project',
    segments: [
      { value: 30, color: 'bg-data-project-1', label: 'Website' },
      { value: 25, color: 'bg-data-project-2', label: 'Backoffice' },
      { value: 15, color: 'rgb(124 58 237)', label: 'Research' },
    ],
  },
};
