import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { PaginationDotGroup } from './pagination-dot-group';

const meta = {
  id: 'patterns-paginationdotgroup',
  title: 'Patterns · Data/PaginationDotGroup',
  component: PaginationDotGroup,
  tags: ['autodocs'],
  args: { count: 5, current: 1, size: 'md', indicator: 'dot', framed: false },
  argTypes: {
    tone: { control: { type: 'select' }, options: ['primary-light-bg', 'primary-dark-bg', 'gray-light-bg', 'gray-dark-bg'] },
    size: { control: { type: 'select' }, options: ['md', 'lg'] },
    indicator: { control: { type: 'select' }, options: ['dot', 'line'] },
  },
  // `onSelect` turns the indicators into buttons, so Storybook must not inject an action for it.
  parameters: { actions: { argTypesRegex: '^on(?!Select)[A-Z].*' } },
} satisfies Meta<typeof PaginationDotGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Line: Story = { args: { indicator: 'line' } };

export const Framed: Story = { args: { framed: true } };

export const Large: Story = { args: { size: 'lg', indicator: 'line', framed: true } };

const InteractiveDots = (args: React.ComponentProps<typeof PaginationDotGroup>) => {
  const [current, setCurrent] = useState(0);
  return <PaginationDotGroup {...args} current={current} onSelect={setCurrent} />;
};

export const Interactive: Story = {
  render: (args) => <InteractiveDots {...args} />,
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['primary-light-bg', 'primary-dark-bg', 'gray-light-bg', 'gray-dark-bg'] as const).map((tone) => (
        <div key={tone} className="flex flex-wrap items-center gap-6 bg-muted p-4">
          <span className="typography-text-extra-small w-32 text-text-subtle-on-muted">{tone}</span>
          <PaginationDotGroup count={3} current={0} tone={tone} framed />
          <PaginationDotGroup count={3} current={0} tone={tone} framed indicator="line" />
          <PaginationDotGroup count={3} current={0} tone={tone} framed size="lg" />
        </div>
      ))}
    </div>
  ),
};
