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

/** `comfortable` keeps the box as it is and grows the pointer hit area to the touch-target token (44px), for a standalone checkbox on a touch screen. Neighbouring controls need at least that much room, the dashed frames show the area. */
export const Comfortable: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <span className="inline-flex h-11 w-11 items-center justify-center border border-dashed border-border">
        <Checkbox aria-label="Comfortable" comfortable defaultChecked />
      </span>
      <span className="inline-flex h-11 w-11 items-center justify-center border border-dashed border-border">
        <Checkbox aria-label="Comfortable small" size="sm" comfortable />
      </span>
    </div>
  ),
};
