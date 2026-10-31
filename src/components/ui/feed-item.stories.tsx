import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, AvatarFallback } from './avatar';
import { FeedItem, FeedList } from './feed-item';
import { DesignSystemProvider } from './design-system-provider';

const av = (t: string) => (
  <Avatar size="sm">
    <AvatarFallback>{t}</AvatarFallback>
  </Avatar>
);

const meta = {
  id: 'patterns-feed-item',
  title: 'Patterns · Interface/Feed item',
  component: FeedList,
  tags: ['autodocs'],
  argTypes: {
    divider: { control: 'select', options: ['none', 'line'] },
    state: { control: 'select', options: ['ready', 'loading', 'empty', 'error'] },
  },
  args: {
    'aria-label': 'Messages',
    divider: 'line',
    children: (
      <>
        <FeedItem avatar={av('AB')} title="Anna Becker" time="10:24" unread supporting="Can you check the staging deploy?" />
        <FeedItem avatar={av('ST')} title="Sarah Tran" time="Yesterday" supporting="Great to see you again!" />
      </>
    ),
  },
} satisfies Meta<typeof FeedList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Messages: Story = {};
export const Versions: Story = {
  args: {
    'aria-label': 'Versions',
    divider: 'none',
    children: (
      <>
        <FeedItem title="Version 4" time="Today, 10:24" selected onSelect={() => {}} supporting="Anna Becker" />
        <FeedItem title="Version 3" time="Yesterday, 17:40" onSelect={() => {}} supporting="Jonas Weber" />
      </>
    ),
  },
};
// The selected row must stay visible on grey sidebar surfaces.
export const SelectedOnSidebar: Story = {
  args: Versions.args,
  decorators: [
    (Story) => (
      <div className="w-sheet-sm max-w-full bg-sidebar-background p-2">
        <Story />
      </div>
    ),
  ],
};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const ErrorState: Story = { args: { state: 'error' } };

export const ChatList: StoryObj<typeof FeedList> = {
  args: {
    'aria-label': 'Chats',
    children: (
      <>
        <FeedItem avatar={av('AB')} title="Anna Becker" time="10:24" unreadCount={3} truncateSupporting supporting="Can you check the staging deploy before the release goes out this afternoon?" />
        <FeedItem avatar={av('ST')} title="Sarah Tran" time="Yesterday" muted truncateSupporting supporting="Great to see you again!" />
        <FeedItem avatar={av('TL')} title="Tobias Lindner" time="Mon" unreadCount={120} supporting="Thanks" />
      </>
    ),
  },
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
