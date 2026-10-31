import type { Meta, StoryObj } from '@storybook/react';

import { ContainerSpacer, Spacer } from './spacer';

const meta = {
  id: 'primitives-spacer',
  title: 'Primitives · Layout/Spacer',
  component: Spacer,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'select' }, options: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] },
    direction: { control: { type: 'select' }, options: ['x', 'y'] },
  },
} satisfies Meta<typeof Spacer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  args: { size: 24, direction: 'y' },
  render: (args) => (
    <div className="w-64 bg-muted p-2">
      <div className="bg-background p-2">Above</div>
      <Spacer {...args} className="bg-background-brand-subtle" />
      <div className="bg-background p-2">Below</div>
    </div>
  ),
};

export const Horizontal: Story = {
  args: { size: 32, direction: 'x' },
  render: (args) => (
    <div className="flex bg-muted p-2">
      <div className="bg-background p-2">Left</div>
      <Spacer {...args} className="bg-background-brand-subtle" />
      <div className="bg-background p-2">Right</div>
    </div>
  ),
};

export const Container: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ContainerSpacer key={size} size={size} className="bg-muted py-2 typography-ui">
          Container {size}
        </ContainerSpacer>
      ))}
    </div>
  ),
};
