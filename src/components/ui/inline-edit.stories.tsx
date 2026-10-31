import type { Meta, StoryObj } from '@storybook/react';

import { InlineEdit } from './inline-edit';

const meta = {
  id: 'primitives-inline-edit',
  title: 'Primitives · Inputs/Inline edit',
  component: InlineEdit,
  tags: ['autodocs'],
  args: { 'aria-label': 'Company name', defaultValue: 'Acme GmbH' },
  argTypes: { variant: { control: 'select', options: ['attribute', 'cell'] } },
} satisfies Meta<typeof InlineEdit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Attribute: Story = {};
export const Cell: Story = { args: { variant: 'cell' } };
export const Invalid: Story = { args: { invalid: true, errorMessage: 'Name is required' } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const Disabled: Story = { args: { disabled: true } };
