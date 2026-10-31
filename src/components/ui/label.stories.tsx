import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './checkbox';
import { Label } from './label';
import { Spacing } from './spacing';

const meta = {
  id: 'primitives-label',
  title: 'Primitives · Inputs/Label',
  component: Label,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Label>Label</Label>,
};

export const WithCheckbox: Story = {
  render: () => (
    <Spacing gap="2" alignItems="center">
      <Checkbox id="label-with-checkbox" />
      <Label htmlFor="label-with-checkbox">Label</Label>
    </Spacing>
  ),
};
