import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta = {
  id: 'primitives-popover',
  title: 'Primitives · Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <PopoverTrigger asChild>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-3 text-sm">
            <div className="font-semibold tracking-[-0.01em]">Dimensions</div>
            <p className="text-muted-foreground">Set the dimensions for the layer.</p>
            <Input placeholder="Width" aria-label="Width" />
          </div>
        </PopoverContent>
      </>
    ),
  },
  render: (args) => (
    <div className="p-6">
      <Popover {...args} />
    </div>
  ),
};
