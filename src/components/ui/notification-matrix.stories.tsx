import type { Meta, StoryObj } from '@storybook/react';

import { NotificationMatrix, NotificationMatrixCell, NotificationMatrixRow } from './notification-matrix';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-notification-matrix',
  title: 'Patterns · Interface/Notification matrix',
  component: NotificationMatrix,
  tags: ['autodocs'],
  args: { 'aria-label': 'Notification preferences', columns: ['In-app', 'Email', 'Push'] },
} satisfies Meta<typeof NotificationMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <NotificationMatrix {...args}>
      <NotificationMatrixRow label="Quote accepted" description="When a client accepts a quote">
        <NotificationMatrixCell label="Quote accepted, In-app" defaultChecked />
        <NotificationMatrixCell label="Quote accepted, Email" defaultChecked />
        <NotificationMatrixCell label="Quote accepted, Push" />
      </NotificationMatrixRow>
      <NotificationMatrixRow label="Timesheet approved">
        <NotificationMatrixCell label="Timesheet approved, In-app" defaultChecked />
        <NotificationMatrixCell label="Timesheet approved, Email" />
        <NotificationMatrixCell label="Timesheet approved, Push" disabled />
      </NotificationMatrixRow>
      <NotificationMatrixRow label="Security alert" required>
        <NotificationMatrixCell label="Security alert, In-app" checked readOnly />
        <NotificationMatrixCell label="Security alert, Email" checked readOnly />
        <NotificationMatrixCell label="Security alert, Push" checked readOnly />
      </NotificationMatrixRow>
    </NotificationMatrix>
  ),
};

export const SelectedRow: Story = {
  render: (args) => (
    <NotificationMatrix {...args}>
      <NotificationMatrixRow label="Quote accepted" description="When a client accepts a quote" selected>
        <NotificationMatrixCell label="Quote accepted, In-app" defaultChecked />
        <NotificationMatrixCell label="Quote accepted, Email" defaultChecked />
        <NotificationMatrixCell label="Quote accepted, Push" />
      </NotificationMatrixRow>
      <NotificationMatrixRow label="Timesheet approved" description="When a timesheet is approved">
        <NotificationMatrixCell label="Timesheet approved, In-app" defaultChecked />
        <NotificationMatrixCell label="Timesheet approved, Email" />
        <NotificationMatrixCell label="Timesheet approved, Push" />
      </NotificationMatrixRow>
    </NotificationMatrix>
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
