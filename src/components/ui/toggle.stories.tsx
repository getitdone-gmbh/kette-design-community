import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic } from 'lucide-react';

import { Toggle } from './toggle';

const meta = {
  id: 'primitives-toggle',
  title: 'Primitives · Actions/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: { 'aria-label': 'Toggle bold', children: <Bold className="h-icon-xs w-icon-xs" aria-hidden="true" /> },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = { args: { defaultPressed: true } };

export const Outline: Story = { args: { variant: 'outline' } };

export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  args: {
    'aria-label': undefined,
    children: (
      <>
        <Italic className="mr-2 h-icon-xs w-icon-xs" aria-hidden="true" />
        Italic
      </>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Toggle size="sm" aria-label="Small">
        <Bold className="h-icon-xs w-icon-xs" aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Default">
        <Bold className="h-icon-xs w-icon-xs" aria-hidden="true" />
      </Toggle>
      <Toggle size="lg" aria-label="Large">
        <Bold className="h-icon-xs w-icon-xs" aria-hidden="true" />
      </Toggle>
    </div>
  ),
};
