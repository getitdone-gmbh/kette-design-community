import type { Meta, StoryObj } from '@storybook/react';
import { Home, Inbox, Menu, Sun } from 'lucide-react';

import { BottomNavigation, BottomNavigationAction, BottomNavigationItem } from './bottom-navigation';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-bottom-navigation',
  title: 'Patterns · Interface/Bottom navigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    docs: { description: { component: 'Mobile bottom navigation with count badges and a centered primary action.' } },
  },
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = (current: 'home' | 'inbox' | 'day' | 'more') => (
  <>
    <BottomNavigationItem href="#home" icon={<Home />} label="Home" current={current === 'home'} />
    <BottomNavigationItem href="#inbox" icon={<Inbox />} label="Inbox" count={6} current={current === 'inbox'} />
    <BottomNavigationAction label="New" />
    <BottomNavigationItem href="#day" icon={<Sun />} label="My Day" count={4} current={current === 'day'} />
    <BottomNavigationItem href="#more" icon={<Menu />} label="More" current={current === 'more'} />
  </>
);

export const Home_: Story = { name: 'Active Home', render: () => <BottomNavigation>{items('home')}</BottomNavigation> };
export const Inbox_: Story = { name: 'Active Inbox', render: () => <BottomNavigation>{items('inbox')}</BottomNavigation> };
export const MyDay: Story = { name: 'Active My Day', render: () => <BottomNavigation>{items('day')}</BottomNavigation> };
export const More: Story = { name: 'Active More', render: () => <BottomNavigation>{items('more')}</BottomNavigation> };

export const MoreAsButton: Story = {
  name: 'More as button',
  render: () => (
    <BottomNavigation>
      <BottomNavigationItem href="#home" icon={<Home />} label="Home" current />
      <BottomNavigationItem as="button" aria-haspopup="dialog" aria-expanded={false} icon={<Menu />} label="More" onClick={() => {}} />
    </BottomNavigation>
  ),
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
