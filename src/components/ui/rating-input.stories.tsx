import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { RatingInput } from './rating-input';

const meta = {
  id: 'primitives-ratinginput',
  title: 'Primitives · Inputs/RatingInput',
  component: RatingInput,
  tags: ['autodocs'],
  args: { 'aria-label': 'Quality', defaultValue: 3 },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof RatingInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <RatingInput key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

const Controlled = () => {
  const [value, setValue] = React.useState(2);
  return (
    <div className="flex items-center gap-3">
      <RatingInput aria-label="Quality" value={value} onValueChange={setValue} />
      <span className="typography-ui text-text-subtle">{value} of 5</span>
    </div>
  );
};

export const ControlledValue: Story = { render: () => <Controlled /> };
export const ReadOnly: Story = { args: { readOnly: true, value: 4 } };
export const Invalid: Story = { args: { invalid: true, defaultValue: 0 } };
export const Disabled: Story = { args: { disabled: true } };
