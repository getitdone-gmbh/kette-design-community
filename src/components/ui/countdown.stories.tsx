import type { Meta, StoryObj } from '@storybook/react';

import { Countdown } from './countdown';

const inDays = (days: number) => new Date(Date.now() + days * 86400000 + 3723000);

const meta = {
  id: 'data-display-countdown',
  title: 'Patterns · Data/Countdown',
  component: Countdown,
  tags: ['autodocs'],
  args: { to: inDays(12), label: 'Launch in' },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HideEmptyDays: Story = { args: { to: new Date(Date.now() + 3723000), hideEmptyDays: true } };
export const Ended: Story = { args: { to: new Date(Date.now() - 1000) } };
export const EndedCustomText: Story = { args: { to: new Date(Date.now() - 1000), finishedText: 'Registration closed' } };
export const EndedZeroDigits: Story = { args: { to: new Date(Date.now() - 1000), finishedText: false } };
export const Inline: Story = { args: { variant: 'inline', to: new Date(Date.now() + 2 * 86400000 + 4 * 3600000 + 12 * 60000 + 30000), label: 'Ends in' } };
export const InlineLastHour: Story = { args: { variant: 'inline', to: new Date(Date.now() + 12 * 60000 + 9000) } };
export const InlineEnded: Story = { args: { variant: 'inline', to: new Date(Date.now() - 1000) } };
