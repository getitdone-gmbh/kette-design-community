import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './checkbox';
import { Label } from './label';

const meta = {
  id: 'primitives-checkbox',
  title: 'Primitives · Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  // Every story checkbox carries an accessible name.
  args: { 'aria-label': 'Example option' } as any,
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
    autoFocus: {
      control: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    disabled: false,
    autoFocus: true,
  } as any,
};
export const Checked: Story = {
  args: {
    checked: true,
    disabled: false,
  } as any,
};
export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
  } as any,
};
export const WithLabel: Story = {
  decorators: [
    (Story) => (
      <div className="flex flex-row flex-nowrap gap-1 items-start p-2">
        <Checkbox id="checkbox-with-label" />
        <Label htmlFor="checkbox-with-label">This is a label with a very long text to show that it will break</Label>
      </div>
    ),
  ],
  args: {
    checked: true,
    disabled: true,
  } as any,
};

export const Small: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox aria-label="Small" size="sm" defaultChecked />
      <Checkbox aria-label="Small indeterminate" size="sm" checked="indeterminate" />
    </div>
  ),
};
