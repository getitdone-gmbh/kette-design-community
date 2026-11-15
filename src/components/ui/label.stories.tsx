import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './checkbox';
import { Input } from './input';
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

export const Required: Story = {
  render: () => (
    // the marker is decorative; the field itself carries required, so assistive tech announces it
    <Spacing gap="2" direction="column">
      <Label htmlFor="label-required" required>
        Message
      </Label>
      <Input id="label-required" required />
    </Spacing>
  ),
};
