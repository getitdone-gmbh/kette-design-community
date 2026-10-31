import type { Meta, StoryObj } from '@storybook/react';

import { StepMarker } from './step-marker';

const meta = {
  id: 'primitives-stepmarker',
  title: 'Primitives · Display/StepMarker',
  component: StepMarker,
  tags: ['autodocs'],
  args: { step: 1, state: 'upcoming', size: 'md' },
  argTypes: {
    state: { control: { type: 'select' }, options: ['upcoming', 'current', 'complete', 'error'] },
    size: { control: { type: 'select' }, options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof StepMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <StepMarker step={1} state="complete" />
      <StepMarker step={2} state="current" />
      <StepMarker step={3} state="upcoming" />
      <StepMarker step={4} state="error" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <StepMarker key={size} step={2} state="current" size={size} />
      ))}
    </div>
  ),
};

// Next to its own text in a process list.
export const InList: Story = {
  render: () => (
    <ol className="flex flex-col gap-3 text-sm text-text-default">
      {['Create account', 'Connect calendar', 'Invite team'].map((title, i) => (
        <li key={title} className="flex items-center gap-3">
          <StepMarker step={i + 1} state={i === 0 ? 'complete' : i === 1 ? 'current' : 'upcoming'} />
          {title}
        </li>
      ))}
    </ol>
  ),
};
