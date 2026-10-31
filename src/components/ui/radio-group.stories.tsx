import type { Meta, StoryObj } from '@storybook/react';

import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Spacing } from './spacing';

const meta = {
  id: 'primitives-radiogroup',
  title: 'Primitives · Inputs/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup>
      <Label>
        <Spacing gap="2" alignItems="center">
          <RadioGroupItem value="1"></RadioGroupItem>
          Option 1
        </Spacing>
      </Label>
      <Label>
        <Spacing gap="2" alignItems="center">
          <RadioGroupItem value="2"></RadioGroupItem>
          Option 2
        </Spacing>
      </Label>
      <Label>
        <Spacing gap="2" alignItems="center">
          <RadioGroupItem value="3"></RadioGroupItem>
          Option 3
        </Spacing>
      </Label>
    </RadioGroup>
  ),
};

export const FilledAndLarge: Story = {
  render: () => (
    <RadioGroup defaultValue="a">
      <RadioGroupItem value="a" aria-label="Filled" size="md" appearance="filled" />
      <RadioGroupItem value="b" aria-label="Medium" size="md" />
    </RadioGroup>
  ),
};
