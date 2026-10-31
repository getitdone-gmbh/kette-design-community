import type { Meta, StoryObj } from '@storybook/react';
import { Inbox } from 'lucide-react';

import { Button } from './button';
import { DataStatePanel } from './data-state-panel';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-data-state-panel',
  title: 'Patterns · Data/Data state panel',
  component: DataStatePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Shared empty and error body of data components (calendar grids, boards, lists, cards). The error kind is an alert and can offer a retry. The empty kind is a status and can offer one action.' } },
  },
  args: { kind: 'empty', title: 'No entries this week', description: 'Entries you log show up here.' },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataStatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const EmptyWithIconAndAction: Story = {
  args: { icon: <Inbox className="h-icon-md w-icon-md" />, action: <Button variant="outline" size="control-sm">Log time</Button> },
};

export const EmptyOutlined: Story = { args: { outlined: true, icon: <Inbox className="h-icon-md w-icon-md" /> } };

export const ErrorState: Story = {
  args: { kind: 'error', title: 'The service is not responding', description: 'Check your connection and try again.', onRetry: () => {} },
};

export const ErrorOutlined: Story = { args: { ...ErrorState.args, outlined: true } };

export const ErrorWithoutRetry: Story = { args: { kind: 'error', title: 'You do not have access to this record' } };

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  args: { outlined: true },
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
