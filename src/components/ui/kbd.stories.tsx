import type { Meta, StoryObj } from '@storybook/react';

import { Kbd, KbdGroup } from './kbd';

const meta = {
  id: 'primitives-kbd',
  title: 'Primitives · Display/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: { children: 'Ctrl K' },
  argTypes: { size: { control: { type: 'select' }, options: ['md', 'sm'] } },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };

export const Sequence: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <KbdGroup>
        <Kbd>Ctrl K</Kbd> then <Kbd>C</Kbd>
      </KbdGroup>
      <KbdGroup size="sm">
        <Kbd size="sm">Ctrl K</Kbd> then <Kbd size="sm">C</Kbd>
      </KbdGroup>
    </div>
  ),
};
