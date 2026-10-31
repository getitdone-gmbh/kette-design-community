import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { ColorInput, ColorSwatchPicker } from './color-picker';

const meta = {
  id: 'patterns-color-picker',
  title: 'Patterns · Interface/Color picker',
  component: ColorSwatchPicker,
  tags: ['autodocs'],
  args: { 'aria-label': 'Calendar colour', defaultValue: 'project-3' },
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Swatches: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ColorSwatchPicker key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

// Custom data colours (for example stored calendar colours) are passed as CSS values.
export const CustomColors: Story = {
  args: {
    defaultValue: '#0d9488',
    options: [
      { value: '#0d9488', label: 'Teal', color: '#0d9488' },
      { value: '#7c3aed', label: 'Violet', color: '#7c3aed' },
      { value: '#db2777', label: 'Pink', color: '#db2777' },
    ],
  },
};

// Compact: one small swatch button, the swatches open in a popover.
export const Compact: Story = { args: { compact: true } };

export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };

const ControlledHex = () => {
  const [value, setValue] = React.useState('#3b82f6');
  return <ColorInput value={value} onValueChange={setValue} />;
};

export const HexInput: Story = { render: () => <ControlledHex /> };

export const HexInputCompact: Story = { render: () => <ColorInput compact defaultValue="#0d9488" /> };

// Quick apply button next to the swatches.
export const WithApply: Story = { args: { onApply: () => {}, applyLabel: 'Apply to all' } };
export const CompactWithApply: Story = { args: { compact: true, onApply: () => {}, applyLabel: 'Apply to all' } };

export const HexInputSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ColorInput size="sm" defaultValue="#0d9488" />
      <ColorInput size="md" defaultValue="#0d9488" />
    </div>
  ),
};
