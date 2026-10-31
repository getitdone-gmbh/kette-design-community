import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

const meta = {
  id: 'primitives-hovercard',
  title: 'Primitives · Overlays/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>
        <Button variant="ghost">Trigger</Button>
      </HoverCardTrigger>
      <HoverCardContent>Content</HoverCardContent>
    </HoverCard>
  ),
};

export const WithBackdrop: Story = {
  render: () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger>
        <Button variant="ghost">Trigger</Button>
      </HoverCardTrigger>
      <HoverCardContent backdrop>Content over a dimmed page</HoverCardContent>
    </HoverCard>
  ),
};
