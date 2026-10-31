import type { Meta, StoryObj } from '@storybook/react';

import { StatusDot } from './status-dot';

const meta = {
  id: 'primitives-statusdot',
  title: 'Primitives · Display/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  args: { tone: 'success', size: 'sm' },
  argTypes: {
    tone: { control: { type: 'select' }, options: ['success', 'warning', 'destructive', 'info', 'credit', 'neutral'] },
    size: { control: { type: 'select' }, options: ['sm', 'md'] },
  },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Beside a visible text the dot stays decorative.
export const WithText: Story = {
  render: () => (
    <ul className="flex flex-col gap-2 text-sm text-text-default">
      {(['success', 'warning', 'destructive', 'info', 'credit', 'neutral'] as const).map((tone) => (
        <li key={tone} className="flex items-center gap-2">
          <StatusDot tone={tone} />
          {tone}
        </li>
      ))}
    </ul>
  ),
};

// Standing alone, a label names it for screen readers.
export const Standalone: Story = { args: { tone: 'destructive', size: 'md', label: 'Offline' } };
