import type { Meta, StoryObj } from '@storybook/react';

import { Switch } from './switch';

const meta = {
  id: 'primitives-switch',
  title: 'Primitives · Inputs/Switch',
  component: Switch,
  tags: ['autodocs'],
  // Every story switch carries an accessible name.
  args: { 'aria-label': 'Example setting' } as any,
  argTypes: {
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    checked: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    disabled: false,
  } as any,
};

export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
  } as any,
};

/** Small switch: track and thumb follow the theme-aware `switch-*-sm` sizes (zero 32x18, neutral 36x20). */
export const Small: Story = {
  args: {
    size: 'sm',
    defaultChecked: true,
    'aria-label': 'Notifications',
  } as any,
};

export const ReadOnly: Story = {
  render: () => (
    <div className="flex gap-4">
      <Switch aria-label="On" readOnly defaultChecked />
      <Switch aria-label="Off" readOnly />
    </div>
  ),
};
