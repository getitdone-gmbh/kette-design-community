import type { Meta, StoryObj } from '@storybook/react';
import { Download, MoreVertical, Plus } from 'lucide-react';

import { Button } from './button';
import { Card } from './card';
import { PanelSectionHeader } from './section-header';
import { Tabs, TabsList, TabsTrigger } from './tabs';

const actions = (
  <>
    <Button variant="outline" size="sm" icon={<Download />}>Export</Button>
    <Button variant="primary" size="sm" icon={<Plus />}>Invite</Button>
  </>
);

const tabs = (
  <Tabs defaultValue="details">
    <TabsList>
      <TabsTrigger value="details">My details</TabsTrigger>
      <TabsTrigger value="profile">Profile</TabsTrigger>
      <TabsTrigger value="team">Team</TabsTrigger>
    </TabsList>
  </Tabs>
);

const meta = {
  id: 'patterns-section-header',
  title: 'Patterns · Interface/Section header',
  component: PanelSectionHeader,
  tags: ['autodocs'],
  args: { title: 'Team members', description: 'Manage your team members and their account permissions here.' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    titleAs: { control: 'select', options: ['h2', 'h3', 'h4'] },
  },
} satisfies Meta<typeof PanelSectionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithActions: Story = { args: { actions } };
export const WithTabs: Story = { args: { actions, tabs } };
export const WithDivider: Story = { args: { actions, divider: true } };
export const TabsAndDivider: Story = { args: { actions, tabs, divider: true } };
export const TitleOnly: Story = { args: { description: undefined } };
export const Medium: Story = { args: { size: 'md', actions } };
export const MenuAction: Story = {
  args: { actions: <Button variant="ghost" size="sm" aria-label="More" icon={<MoreVertical />} /> },
};

// Inside an inner column of a record page; switch the toolbar theme to zero and dark to check both.
export const InsideCard: Story = {
  render: (args) => (
    <Card className="flex flex-col gap-5 p-6">
      <PanelSectionHeader {...args} actions={actions} tabs={tabs} divider />
    </Card>
  ),
};
