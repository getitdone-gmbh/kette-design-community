import type { Meta, StoryObj } from '@storybook/react';

import { Separator } from './separator';

const meta = {
  title: 'Primitives/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-[320px] space-y-3 p-6 text-sm text-foreground">
      <div>
        <div className="font-medium">Workspace</div>
        <div className="text-muted-foreground">An open-source CRM and work platform.</div>
      </div>
      <Separator {...args} />
      <div className="flex items-center gap-3">
        <span>Blog</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Docs</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Source</span>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex h-8 items-center gap-3 p-6 text-sm text-foreground">
      <span>One</span>
      <Separator {...args} />
      <span>Two</span>
    </div>
  ),
};

export const Semantic: Story = {
  args: { decorative: false },
  render: (args) => (
    <div className="w-[320px] space-y-3 p-6 text-sm text-foreground">
      <p>Section A</p>
      <Separator {...args} />
      <p>Section B</p>
    </div>
  ),
};
