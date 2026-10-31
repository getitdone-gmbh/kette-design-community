import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { RangeSlider, Slider } from './slider';

const meta = {
  id: 'primitives-slider',
  title: 'Primitives · Inputs/Slider',
  component: Slider,
  tags: ['autodocs'],
  args: { 'aria-label': 'Volume', defaultValue: 40 },
  argTypes: { valueLabel: { control: { type: 'select' }, options: ['none', 'bottom', 'top-floating'] } },
  decorators: [
    (Story) => (
      <div className="w-72 py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const FloatingLabel: Story = { args: { valueLabel: 'top-floating', formatValue: (v) => `${v}%` } };
export const BottomLabel: Story = { args: { valueLabel: 'bottom', formatValue: (v) => `${v}%` } };

export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = useState(25);
    return (
      <Slider
        aria-label="Capacity"
        value={value}
        onValueChange={setValue}
        valueLabel="top-floating"
        formatValue={(v) => `${v} h`}
        max={40}
      />
    );
  },
};

export const Range: Story = {
  render: () => (
    <RangeSlider aria-label="Price" defaultValue={[20, 70]} valueLabel="top-floating" formatValue={(v) => `${v} EUR`} />
  ),
};

export const RangeDisabled: Story = {
  render: () => <RangeSlider aria-label="Price" defaultValue={[20, 70]} disabled />,
};
