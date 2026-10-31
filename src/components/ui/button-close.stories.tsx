import type { Meta, StoryObj } from '@storybook/react';

import { ButtonClose } from './button-close';

const meta = {
  id: 'primitives-buttonclose',
  title: 'Primitives · Actions/ButtonClose',
  component: ButtonClose,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'select' }, options: ['sm', 'md', 'lg'] },
    color: { control: { type: 'select' }, options: ['neutral', 'brand'] },
  },
} satisfies Meta<typeof ButtonClose>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['neutral', 'brand'] as const).map((color) => (
        <div key={color} className="flex items-center gap-4">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <ButtonClose key={size} size={size} color={color} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
