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
    docs: { description: { component: 'Shared empty and error body of data components (calendar grids, boards, lists, cards). The empty kind is a status with the dashed frame of EmptyState (same classes) and can offer one action; inside a table row or grid cell pass `outlined={false}`. The error kind is an alert, unframed by default, and can offer a retry.' } },
  },
  args: { kind: 'empty', title: 'No entries this week', description: 'Entries you log show up here.' },
  argTypes: {
    kind: { control: 'select', options: ['empty', 'error'], description: '`empty` is a status with the dashed frame, `error` an alert.' },
    title: { control: 'text', description: 'Short title line.' },
    description: { control: 'text', description: 'Smaller line under the title.' },
    icon: { control: false, description: 'Bare line icon above the title. The error kind shows an alert circle by default.' },
    action: { control: false, description: 'One action for the empty kind, e.g. "Log time".' },
    onRetry: { description: 'Error kind: renders a "Try again" button that calls this.' },
    retryLabel: { control: 'text', description: 'Deprecated, use `retryText`.' },
    retryText: { control: 'text', description: 'Text of the retry button.' },
    outlined: { control: 'boolean', description: 'Dashed frame (empty, default on) or destructive outline (error, default off). Set false inside a table row or grid cell.' },
  },
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

// Inside a table row or grid cell the cell is the frame: pass `outlined={false}` so the state has no second border.
export const EmptyUnframed: Story = { args: { outlined: false, icon: <Inbox className="h-icon-md w-icon-md" /> } };

export const ErrorState: Story = {
  args: { kind: 'error', title: 'The service is not responding', description: 'Check your connection and try again.', onRetry: () => {} },
};

export const ErrorOutlined: Story = { args: { ...ErrorState.args, outlined: true } };

export const ErrorWithoutRetry: Story = { args: { kind: 'error', title: 'You do not have access to this record' } };

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  args: {},
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};
