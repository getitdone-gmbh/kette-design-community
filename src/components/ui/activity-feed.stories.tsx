import type { Meta, StoryObj } from '@storybook/react';
import { Check, FileText } from 'lucide-react';

import { Avatar, AvatarFallback } from './avatar';
import { Button } from './button';
import { MilestoneTimeline, NotificationGroup, NotificationItem, NotificationList, Timeline, TimelineItem } from './activity-feed';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-activity-feed',
  title: 'Patterns · Data/Activity feed',
  component: Timeline,
  tags: ['autodocs'],
  // onRetry shows the error button
  parameters: { actions: { argTypesRegex: '^on(?!Retry)[A-Z].*' } },
  args: { 'aria-label': 'Activity' },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimelineRecord: Story = {
  args: {
    children: (
      <>
        <TimelineItem title="Demand created" meta="Anna Becker created Senior Developer" time="2 h ago" />
        <TimelineItem title="Quote accepted" meta="Acme GmbH accepted Q-2026-041" time="Yesterday" tone="success" icon={<Check className="h-icon-xs w-icon-xs" />} />
        <TimelineItem title="Note added" meta="Call with procurement" time="3 days ago" tone="brand" icon={<FileText className="h-icon-xs w-icon-xs" />} />
        <TimelineItem title="Invoice overdue" meta="2026-038 is 14 days overdue" time="Last week" tone="destructive" />
      </>
    ),
  },
};
export const TimelineCompact: Story = {
  args: {} as any,
  render: () => (
    <Timeline aria-label="Record history" density="compact" className="max-w-xl">
      <TimelineItem title="Demand created" meta="Anna Becker created Senior Developer" time="2 h ago" />
      <TimelineItem title="Quote accepted" meta="Acme GmbH accepted Q-2026-041" time="Yesterday" tone="success" icon={<Check className="h-icon-xs w-icon-xs" />} />
      <TimelineItem title="Note added" meta="Call with procurement" time="3 days ago" tone="brand" icon={<FileText className="h-icon-xs w-icon-xs" />} />
      <TimelineItem title="Invoice overdue" meta="2026-038 is 14 days overdue" time="Last week" tone="destructive" />
    </Timeline>
  ),
};

export const TimelineLoading: Story = { args: { state: 'loading' } };
export const TimelineEmpty: Story = { args: { state: 'empty', emptyDescription: 'Changes, notes and emails on this record show up here.', emptyAction: <Button variant="outline">Add note</Button> } };
export const TimelineError: Story = { args: { state: 'error' } };

const items = (
  <>
    <NotificationGroup label="Today">
      <NotificationItem
        unread
        title="Anna Becker mentioned you in NWH Relaunch"
        meta="10:24"
        leading={
          <Avatar size="sm">
            <AvatarFallback size="sm">AM</AvatarFallback>
          </Avatar>
        }
      >
        <Button variant="outline" size="control-sm">
          Reply
        </Button>
      </NotificationItem>
      <NotificationItem title="Quote Q-2026-041 accepted" meta="Acme GmbH, 09:02" unread />
    </NotificationGroup>
    <NotificationGroup label="Yesterday">
      <NotificationItem title="Timesheet September approved" meta="backoffice, 17:40" />
    </NotificationGroup>
  </>
);

export const NotificationsPopover: StoryObj<typeof NotificationList> = { render: () => <NotificationList onMarkAllRead={() => {}} className="w-sheet-sm max-w-full">{items}</NotificationList> };
export const NotificationsInbox: StoryObj<typeof NotificationList> = { render: () => <NotificationList variant="inbox" onMarkAllRead={() => {}} className="w-sheet-md max-w-full">{items}</NotificationList> };
export const NotificationsLoading: StoryObj<typeof NotificationList> = { render: () => <NotificationList state="loading" className="w-sheet-sm max-w-full" /> };
export const NotificationsEmpty: StoryObj<typeof NotificationList> = { render: () => <NotificationList state="empty" className="w-sheet-sm max-w-full" /> };
export const NotificationsError: StoryObj<typeof NotificationList> = { render: () => <NotificationList state="error" onRetry={() => {}} className="w-sheet-sm max-w-full" /> };

export const TimelineWithAvatar: Story = {
  args: {
    'aria-label': 'Activity',
    children: (
      <>
        <TimelineItem
          avatar={
            <Avatar size="xs">
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
          }
          title="Anna commented"
          meta="Looks good to me"
          time="2 h ago"
        />
        <TimelineItem title="Quote sent" time="Yesterday" tone="brand" />
      </>
    ),
  },
};
export const NotificationWithTimeAndWrappingActions: StoryObj<typeof NotificationList> = {
  render: () => (
    <NotificationList className="w-sheet-sm max-w-full">
      <NotificationItem unread title="Anna mentioned you in Demand 42" meta="Acme GmbH" time="10:24">
        <Button size="sm">Reply</Button>
        <Button size="sm" variant="outline">
          Mark as read
        </Button>
        <Button size="sm" variant="outline">
          Open demand
        </Button>
      </NotificationItem>
    </NotificationList>
  ),
};

export const NotificationTrailing: Story = {
  render: () => (
    <NotificationList aria-label="Notifications">
      <NotificationItem title="Invoice 2026-114 was paid" meta="Acme GmbH" time="10:24" trailing={<Button size="sm" variant="outline">Open</Button>} />
    </NotificationList>
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  ...TimelineRecord,
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};

const milestones = [
  { id: 'kickoff', date: '2026-01-12', label: 'Kickoff' },
  { id: 'alpha', date: '2026-03-02', label: 'Alpha' },
  { id: 'beta', date: '2026-05-18', label: 'Beta' },
  { id: 'launch', date: '2026-09-01', label: 'Launch' },
];

// Horizontal axis with proportional dots. The axis is decorative, the list carries the information.
export const MilestoneAxis: StoryObj<typeof MilestoneTimeline> = {
  render: () => (
    <div className="max-w-xl">
      <MilestoneTimeline aria-label="Project milestones" milestones={milestones} cutoff="2026-04-01" caption="Milestones of the 2026 relaunch." />
    </div>
  ),
};

export const MilestoneWithDetails: StoryObj<typeof MilestoneTimeline> = {
  render: () => (
    <div className="max-w-xl">
      <MilestoneTimeline aria-label="Project milestones" milestones={milestones} cutoff="2026-04-01" detailsLabel="Show milestones">
        <Timeline aria-label="Milestone list">
          {milestones.map((m) => (
            <TimelineItem key={m.id} title={m.label} time={m.date} />
          ))}
        </Timeline>
      </MilestoneTimeline>
    </div>
  ),
};
