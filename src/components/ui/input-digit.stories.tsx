import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { InputDigit } from './input-digit';

const meta = {
  id: 'primitives-inputdigit',
  title: 'Primitives · Inputs/InputDigit',
  component: InputDigit,
  tags: ['autodocs'],
  // onValueChange and onComplete are data callbacks and do not change rendering.
  args: { label: 'Verification code', hint: 'This is a hint text to help user.' },
  argTypes: {
    length: { control: { type: 'number' } },
    size: { control: { type: 'select' }, options: ['sm', 'md', 'lg'] },
    type: { control: { type: 'select' }, options: ['numeric', 'alphanumeric'] },
  },
} satisfies Meta<typeof InputDigit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixDigits: Story = {};
export const FourDigits: Story = { args: { length: 4 } };
export const Small: Story = { args: { length: 4, size: 'sm' } };
export const Invalid: Story = {
  args: { length: 4, invalid: true, hint: 'The code is not valid.', defaultValue: '1234' },
};
export const Success: Story = { args: { length: 4, success: true, defaultValue: '1234', hint: 'Code accepted.' } };
export const Disabled: Story = { args: { length: 4, disabled: true } };
export const Alphanumeric: Story = {
  args: { type: 'alphanumeric', length: 6, separatorAfter: 3, defaultValue: 'AB12' },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <div className="flex flex-col gap-4">
        <InputDigit {...args} length={6} value={value} onValueChange={setValue} />
        <p className="typography-ui text-text-subtle">Value: {value || 'empty'}</p>
      </div>
    );
  },
};
