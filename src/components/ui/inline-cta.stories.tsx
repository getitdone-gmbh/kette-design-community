import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { InlineCta } from './inline-cta';

const meta = {
  id: 'patterns-inline-cta',
  title: 'Patterns · Interface/Inline CTA',
  component: InlineCta,
  tags: ['autodocs'],
  args: {
    title: "We've just released a new update!",
    description: 'Check out the all new dashboard view. Pages now load faster.',
    actions: (
      <>
        <Button variant="outline" size="sm">Dismiss</Button>
        <Button variant="primary" size="sm">Changelog</Button>
      </>
    ),
  },
} satisfies Meta<typeof InlineCta>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithBody: Story = {
  args: {
    title: 'Change your plan',
    description: 'Flexible pricing that grows with you.',
    children: <div className="typography-ui rounded-control border border-solid border-border p-4 text-text-default">Basic plan, $10 per month</div>,
  },
};
export const WithMedia: Story = { args: { media: <div className="h-full min-h-24 bg-muted" /> } };
