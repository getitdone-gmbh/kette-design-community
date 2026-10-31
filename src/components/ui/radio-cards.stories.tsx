import type { Meta, StoryObj } from '@storybook/react';
import { Building2, Cloud, Server, User } from 'lucide-react';

import { RadioCard, RadioCardGroup } from './radio-cards';

const meta = {
  id: 'patterns-radio-cards',
  title: 'Patterns · Interface/Radio cards',
  component: RadioCardGroup,
  tags: ['autodocs'],
  argTypes: { columns: { control: 'select', options: [1, 2] } },
  args: { columns: 2, defaultValue: 'team', 'aria-label': 'Workspace type' },
} satisfies Meta<typeof RadioCardGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma Sheet block Type=Radio cards grid: 2x2, the 4th option is optional.
export const Grid: Story = {
  render: (args) => (
    <RadioCardGroup {...args} className="max-w-sheet-md">
      <RadioCard value="personal" icon={<User />} title="Personal" description="Just you" />
      <RadioCard value="team" icon={<Building2 />} title="Team" description="Up to 20 people" />
      <RadioCard value="cloud" icon={<Cloud />} title="Cloud" description="Hosted by us" />
      <RadioCard value="self" icon={<Server />} title="Self-hosted" description="Your own servers" />
    </RadioCardGroup>
  ),
};

export const ThreeOptions: Story = {
  render: (args) => (
    <RadioCardGroup {...args} className="max-w-sheet-md">
      <RadioCard value="personal" icon={<User />} title="Personal" description="Just you" />
      <RadioCard value="team" icon={<Building2 />} title="Team" description="Up to 20 people" />
      <RadioCard value="cloud" icon={<Cloud />} title="Cloud" description="Hosted by us" disabled />
    </RadioCardGroup>
  ),
};

export const SingleColumn: Story = {
  args: { columns: 1 },
  render: (args) => (
    <RadioCardGroup {...args} className="max-w-sheet-sm">
      <RadioCard value="personal" title="Personal" description="Just you" />
      <RadioCard value="team" title="Team" description="Up to 20 people" />
    </RadioCardGroup>
  ),
};
