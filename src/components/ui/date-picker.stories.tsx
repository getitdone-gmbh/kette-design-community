import type { Meta, StoryObj } from '@storybook/react';
import { addDays, startOfDay, subDays } from 'date-fns';
import { useState } from 'react';

import { Button } from './button';
import { DatePicker, DatePickerModal, DatePickerPanel, type DatePickerValue } from './date-picker';

const today = startOfDay(new Date());

const meta = {
  id: 'primitives-datepicker',
  title: 'Primitives · Inputs/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  args: { 'aria-label': 'Date' },
  argTypes: {
    mode: { control: { type: 'select' }, options: ['single', 'range'], description: 'One date or a date range.', table: { defaultValue: { summary: 'single' } } },
    defaultValue: { description: 'Date (or range) selected at the start; the picker keeps its own state.' },
    'aria-label': { description: 'Accessible name of the trigger when there is no visible label.' },
    placeholder: { description: 'Text of the trigger while nothing is selected.' },
    disabled: { control: { type: 'boolean' }, description: 'Blocks the picker.', table: { defaultValue: { summary: 'false' } } },
    invalid: { control: { type: 'boolean' }, description: 'Error border on the trigger.', table: { defaultValue: { summary: 'false' } } },
    readOnly: { control: { type: 'boolean' }, description: 'Shows the value without letting it change.', table: { defaultValue: { summary: 'false' } } },
    actions: { control: { type: 'boolean' }, description: 'Cancel and Apply row: picking only changes a draft until Apply.' },
    presets: { description: 'Quick choices such as the last 7 days.' },
  },
  decorators: [
    // The single story view keeps room for the open calendar; a docs page lets the stage grow when it opens.
    (Story, { viewMode }) => (
      <div className={viewMode === 'docs' ? 'w-72' : 'min-h-[28rem] w-72'}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = { args: { defaultValue: today } };
export const Placeholder: Story = {};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: today } };

export const Range: Story = {
  args: {
    mode: 'range',
    defaultValue: { from: subDays(today, 3), to: addDays(today, 3) },
    placeholder: 'Select dates',
  },
};

export const RangeWithPresetsAndActions: Story = {
  args: {
    mode: 'range',
    actions: true,
    placeholder: 'Select dates',
    presets: [
      { label: 'Last 7 days', value: { from: subDays(today, 6), to: today } },
      { label: 'Last 30 days', value: { from: subDays(today, 29), to: today } },
    ],
  },
};

export const Panel: Story = {
  render: function Render() {
    const [value, setValue] = useState<DatePickerValue>(today);
    return (
      <div className="w-fit rounded-surface border border-solid border-hairline">
        <DatePickerPanel value={value} onValueChange={setValue} />
      </div>
    );
  },
};

export const Modal: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open date picker modal</Button>
        <DatePickerModal open={open} onOpenChange={setOpen} mode="range" />
      </>
    );
  },
};
