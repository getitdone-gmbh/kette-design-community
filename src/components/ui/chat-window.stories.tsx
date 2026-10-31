import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './button';
import { ChatWindow, type ChatWindowProps } from './chat-window';

const meta = {
  id: 'overlays-chat-window',
  title: 'Patterns · Interface/Chat window',
  component: ChatWindow,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, title: 'Assistant' },
} satisfies Meta<typeof ChatWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

const messages = (
  <ul className="m-0 flex list-none flex-col gap-3 p-0">
    <li className="typography-ui rounded-surface bg-muted p-3">How can I help with your timesheet?</li>
    <li className="typography-ui self-end rounded-surface bg-background-brand-subtle p-3">Show me last week.</li>
  </ul>
);

const InteractiveDemo = (args: ChatWindowProps) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  return (
    <div className="p-6">
      <p className="typography-body">The page stays usable while the window is open.</p>
      <Button onClick={() => setOpen(true)}>Open chat</Button>
      <ChatWindow {...args} open={open} onOpenChange={setOpen} minimized={minimized} onMinimizedChange={setMinimized}>
        {messages}
      </ChatWindow>
    </div>
  );
};

export const Default: Story = {
  args: { children: messages, footer: <input aria-label="Message" placeholder="Write a message" className="typography-ui w-full rounded-control border border-solid border-input bg-background p-2" /> },
};

export const Interactive: Story = {
  render: (args) => <InteractiveDemo {...args} />,
};

export const Minimized: Story = { args: { minimized: true, onMinimizedChange: () => undefined } };
export const LeftSide: Story = { args: { side: 'left', children: messages } };

export const WithSubtitle: Story = { args: { subtitle: 'Timesheet helper', children: messages } };
export const Compact: Story = { args: { height: 'sm', padding: 'sm', children: messages } };
export const FullContentHeight: Story = { args: { height: 'content', padding: 'lg', children: messages } };
// Phone width: the window stays inside the viewport minus both side offsets and clears the top bar.
export const FullContentHeightPhone: Story = { args: { height: 'content', padding: 'lg', children: messages }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
const longList = (
  <ul className="m-0 flex list-none flex-col gap-2 p-0">
    {Array.from({ length: 30 }, (_, i) => (
      <li key={i} className="typography-ui rounded-surface bg-muted p-3">
        Entry {i + 1}
      </li>
    ))}
  </ul>
);

// The header and tab list stay fixed, only the active view scrolls.
export const Views: Story = {
  args: {
    subtitle: 'Three views',
    views: [
      { id: 'chat', label: 'Chat', content: messages },
      { id: 'history', label: 'History', content: longList },
      { id: 'files', label: 'Files', content: <p className="typography-body m-0">No files yet.</p> },
    ],
    footer: <input aria-label="Message" placeholder="Write a message" className="typography-ui w-full rounded-control border border-solid border-input bg-background p-2" />,
  },
};
