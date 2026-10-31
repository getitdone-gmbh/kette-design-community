import type { Meta, StoryObj } from '@storybook/react';

import { Textarea, TextareaProps } from './textarea';

const meta = {
  id: 'primitives-textarea',
  title: 'Primitives · Inputs/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  // Every story field carries an accessible name.
  args: { 'aria-label': 'Example message' },
  argTypes: {
    disabled: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  value: undefined,
  clamp: false,
  disabled: false,
  placeholder: 'Type your message here...',
};

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as TextareaProps,
};

export const Filled: Story = {
  args: {
    ...defaultArgs,
    value: 'Filled',
  } as TextareaProps,
};

export const FluidFont: Story = {
  args: {
    ...defaultArgs,
    value: 'Fluid font',
    clamp: true,
  } as TextareaProps,
};

export const Disabled: Story = {
  args: {
    ...defaultArgs,
    disabled: true,
  } as TextareaProps,
};

export const ReadOnlyAppearance: Story = {
  name: 'Read only',
  args: { appearance: 'readonly', defaultValue: 'A little about the company and the team.' } as TextareaProps,
};

export const WithCharacterCount: Story = {
  args: { showCount: true, maxLength: 100, defaultValue: 'A little about the company and the team that you will be working with.' } as TextareaProps,
};

export const MinRows: Story = {
  args: { minRows: 2, placeholder: 'Write a message...' } as TextareaProps,
};
