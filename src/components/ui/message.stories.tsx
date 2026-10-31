import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, AvatarFallback, AvatarOnlineIndicator } from './avatar';
import { Smile, Reply, MoreHorizontal, ThumbsUp } from 'lucide-react';

import { Message, MessageAction, MessageActions, MessageAttachment, MessageReaction, MessageReactions } from './message';
import { DesignSystemProvider } from './design-system-provider';

const avatar = (
  <Avatar size="md">
    <AvatarFallback>PB</AvatarFallback>
    <AvatarOnlineIndicator />
  </Avatar>
);

const meta = {
  id: 'patterns-message',
  title: 'Patterns · Interface/Message',
  component: Message,
  tags: ['autodocs'],
  args: { author: 'Tobias Lindner', time: 'Friday 2:20pm', avatar, text: 'Hey Lena, can you please review the latest design when you can?' },
} satisfies Meta<typeof Message>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Incoming: Story = {};
export const Own: Story = { args: { author: 'You', own: true, text: "Sure thing, I'll have a look today." } };
export const WithReactions: Story = {
  args: {
    reactions: (
      <MessageReactions>
        <MessageReaction emoji="❤" count={1} />
        <MessageReaction emoji="👌" count={2} active />
      </MessageReactions>
    ),
  },
};
export const WithIconReactions: Story = {
  args: {
    reactions: (
      <MessageReactions>
        <MessageReaction icon={<ThumbsUp />} count={2} aria-label="Thumbs up" />
        <MessageReaction icon={<ThumbsUp />} count={1} active aria-label="Thumbs up, you reacted" />
        <MessageReaction icon={<ThumbsUp />} aria-label="Thumbs up" />
      </MessageReactions>
    ),
  },
};
export const WithAttachment: Story = { args: { text: undefined, attachment: <MessageAttachment name="Latest design screenshot.jpg" size="1.2 MB" /> } };
export const Typing: Story = { args: { typing: true, text: undefined, time: undefined } };

export const Compact: Story = { args: { density: 'compact', meta: <span>edited</span> } };
export const WithActions: Story = {
  args: {
    density: 'compact',
    actions: (
      <MessageActions>
        <MessageAction aria-label="React">
          <Smile aria-hidden />
        </MessageAction>
        <MessageAction aria-label="Reply">
          <Reply aria-hidden />
        </MessageAction>
        <MessageAction aria-label="More">
          <MoreHorizontal aria-hidden />
        </MessageAction>
      </MessageActions>
    ),
  },
};

export const Quiet: StoryObj<typeof Message> = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <Message quiet author="Tobias Lindner" time="2:20pm" text="Quiet message, sender is only read by assistive tech." />
      <Message quiet own text="Quiet and without any header." />
    </div>
  ),
};

export const OwnNeutral: Story = { args: { author: 'You', own: true, ownTone: 'neutral', text: "Sure thing, I'll have a look today." } };

export const Bare: StoryObj<typeof Message> = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <Message author="Assistant" bare text="Reply without a bubble, set on the page surface." />
      <Message author="You" own bare quiet text="Own reply without a bubble." />
    </div>
  ),
};
export const OwnInverse: Story = { args: { author: 'You', own: true, ownTone: 'inverse', text: "Sure thing, I'll have a look today." } };
export const SmallText: Story = { args: { size: 'sm' } };
export const SurfaceRadius: Story = { args: { radius: 'surface' } };

// The time sits next to the author name, `meta` stays at the end of the row.
export const TimeBesideAuthor: Story = { args: { timePlacement: 'author', meta: <span>edited</span> } };

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
