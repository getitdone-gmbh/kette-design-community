import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { ContentDivider } from './content-divider';

const meta = {
  id: 'primitives-contentdivider',
  title: 'Primitives · Layout/ContentDivider',
  component: ContentDivider,
  tags: ['autodocs'],
  args: { children: 'Today' },
  argTypes: {
    variant: { control: { type: 'select' }, options: ['single', 'dual', 'filled'] },
    emphasis: { control: { type: 'select' }, options: ['text', 'heading'] },
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const Dual: Story = { args: { variant: 'dual', children: 'Notifications' } };
export const Filled: Story = { args: { variant: 'filled', children: 'Group' } };
export const Heading: Story = { args: { emphasis: 'heading', variant: 'dual', children: 'Heading' } };
export const WithButton: Story = {
  args: {
    children: (
      <Button size="sm" variant="outline">
        Add
      </Button>
    ),
  },
};
export const Plain: Story = { args: { children: undefined } };
