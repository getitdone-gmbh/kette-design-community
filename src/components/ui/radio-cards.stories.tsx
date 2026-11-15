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

// Long titles and descriptions wrap inside the card without a className, also in a narrow sheet and where the app sets nowrap on buttons.
export const LongTextWraps: Story = {
  args: { defaultValue: 'per_member', 'aria-label': 'Rate mode' },
  render: (args) => (
    <div className="whitespace-nowrap" style={{ width: 360 }}>
      <RadioCardGroup {...args}>
        <RadioCard value="same" title="Same rate for all" description="Members see this rate." />
        <RadioCard value="per_member" title="Rate per member" description="What the company pays each member. Usual for projects with an intermediary." />
        <RadioCard value="pdf" title="From credit note PDF with the line items of the intermediary" />
      </RadioCardGroup>
    </div>
  ),
};

// Browser check: the cards are one radio group. The radio is named by its title, described by its text, and the arrow keys move the selection.
export const KeyboardGroup: Story = {
  render: (args) => (
    <RadioCardGroup {...args} className="max-w-sheet-md">
      <RadioCard value="personal" icon={<User />} title="Personal" description="Just you" />
      <RadioCard value="team" icon={<Building2 />} title="Team" description="Up to 20 people" />
      <RadioCard value="cloud" icon={<Cloud />} title="Cloud" description="Hosted by us" />
    </RadioCardGroup>
  ),
  play: async ({ canvasElement }) => {
    const team = canvasElement.querySelector<HTMLElement>('[role="radio"][value="team"]');
    if (!team) throw new Error('Team card missing');
    if (team.getAttribute('aria-labelledby') === null) throw new Error('The radio has no accessible name');
    team.focus();
    team.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (document.activeElement?.getAttribute('value') !== 'cloud') throw new Error('The arrow key did not move to the next card');
  },
};
