import type { Meta, StoryObj } from '@storybook/react';

import { ProgressCircle } from './progress-circle';

const meta = {
  id: 'primitives-progresscircle',
  title: 'Primitives · Display/ProgressCircle',
  component: ProgressCircle,
  tags: ['autodocs'],
  args: { 'aria-label': 'Progress', value: 40, showLabel: true },
  argTypes: {
    size: { control: { type: 'select' }, options: ['xxs', 'xs', 'sm', 'md', 'lg'] },
    shape: { control: { type: 'select' }, options: ['circle', 'half'] },
    variant: { control: { type: 'select' }, options: ['default', 'destructive'] },
    value: { control: { type: 'number' } },
  },
} satisfies Meta<typeof ProgressCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HalfCircle: Story = { args: { shape: 'half', size: 'xs', value: 72 } };
export const Destructive: Story = { args: { variant: 'destructive', size: 'xs', value: 85 } };

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {(['xxs', 'xs', 'sm', 'md'] as const).map((size) => (
        <ProgressCircle key={size} aria-label={size} size={size} value={60} showLabel />
      ))}
    </div>
  ),
};
