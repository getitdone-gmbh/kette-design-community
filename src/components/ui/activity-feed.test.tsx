import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { MilestoneTimeline, NotificationGroup, NotificationItem, NotificationList, Timeline, TimelineItem } from './activity-feed';

describe('Timeline', () => {
  it('renders an ordered list of items with title, meta and time', () => {
    render(
      <Timeline aria-label="Activity">
        <TimelineItem title="Demand created" meta="Anna Meier" time="2 h ago" tone="success" />
        <TimelineItem title="Invoice overdue" tone="destructive" />
      </Timeline>,
    );
    expect(screen.getByRole('list', { name: 'Activity' }).tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 h ago')).toBeInTheDocument();
  });

  it('compact density tightens rows and uses the semibold title role', () => {
    render(
      <Timeline aria-label="Activity" density="compact">
        <TimelineItem title="Demand created" meta="Anna Meier" time="2 h ago" tone="success" />
      </Timeline>,
    );
    expect(screen.getByRole('list', { name: 'Activity' })).toHaveAttribute('data-density', 'compact');
    expect(screen.getByRole('listitem')).toHaveClass('py-1');
    expect(screen.getByText('Demand created')).toHaveClass('typography-ui-semibold');
  });

  it('renders loading, empty and error states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<Timeline aria-label="a" state="loading" />);
    expect(screen.getByRole('status', { name: 'Loading activity' })).toBeInTheDocument();
    rerender(<Timeline aria-label="a" state="empty" emptyAction={<button>Add note</button>} />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
    rerender(<Timeline aria-label="a" state="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load activity');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('NotificationList', () => {
  const List = (props: Partial<React.ComponentProps<typeof NotificationList>>) => (
    <NotificationList {...props}>
      <NotificationGroup label="Today">
        <NotificationItem unread title="Lena Hartmann mentioned you" meta="10:24">
          <button>Reply</button>
        </NotificationItem>
        <NotificationItem title="Quote accepted" />
      </NotificationGroup>
    </NotificationList>
  );

  it('renders a named region with a day group, unread marker and actions', () => {
    render(<List onMarkAllRead={() => {}} />);
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Unread:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
  });

  it('calls onMarkAllRead', async () => {
    const onMarkAllRead = vi.fn();
    render(<List onMarkAllRead={onMarkAllRead} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('applies the popover surface only for variant popover', () => {
    const { rerender } = render(<List />);
    expect(screen.getByRole('region')).toHaveClass('shadow-popover');
    rerender(<List variant="inbox" />);
    expect(screen.getByRole('region')).not.toHaveClass('shadow-popover');
  });

  it('renders loading, empty and error states and hides mark all read', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<List state="loading" onMarkAllRead={() => {}} />);
    expect(screen.getByRole('status', { name: 'Loading notifications' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();
    rerender(<List state="empty" />);
    expect(screen.getByText('All caught up')).toBeInTheDocument();
    rerender(<List state="error" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('TimelineItem avatar', () => {
  it('renders the avatar instead of the icon dot', () => {
    render(
      <Timeline aria-label="Activity">
        <TimelineItem title="Anna commented" avatar={<span data-testid="av" />} icon={<span data-testid="ic" />} />
      </Timeline>,
    );
    expect(screen.getByTestId('av')).toBeInTheDocument();
    expect(screen.queryByTestId('ic')).toBeNull();
  });
});

describe('NotificationItem time and wrapping actions', () => {
  it('renders the time on the meta line next to the meta text', () => {
    render(
      <NotificationItem title="Lena Hartmann mentioned you" meta="Nordwind Handel GmbH" time="10:24" />,
    );
    expect(screen.getByText('Nordwind Handel GmbH').parentElement).toContainElement(screen.getByText('10:24'));
  });

  it('actions wrap on narrow widths', () => {
    render(
      <NotificationItem title="t">
        <button>Reply</button>
      </NotificationItem>,
    );
    expect(screen.getByRole('button', { name: 'Reply' }).parentElement).toHaveClass('flex-wrap');
  });
});

describe('NotificationItem trailing slot', () => {
  it('renders the trailing content at the end of the row', () => {
    render(
      <ul>
        <NotificationItem title="Invoice paid" trailing={<button type="button">More</button>} />
        <NotificationItem title="No trailing" />
      </ul>,
    );
    const item = screen.getByText('Invoice paid').closest('li') as HTMLElement;
    const trailing = item.querySelector('[data-notification-trailing]') as HTMLElement;
    expect(trailing).toContainElement(screen.getByRole('button', { name: 'More' }));
    expect(item.lastElementChild).toBe(trailing);
    expect(screen.getByText('No trailing').closest('li')?.querySelector('[data-notification-trailing]')).toBeNull();
  });
});

describe('MilestoneTimeline', () => {
  const milestones = [
    { id: 'a', date: '2026-01-01', label: 'Start' },
    { id: 'b', date: '2026-01-11', label: 'Middle' },
    { id: 'c', date: '2026-01-21', label: 'End' },
  ];

  it('places dots proportionally and keeps the axis out of the accessibility tree', () => {
    const { container } = render(<MilestoneTimeline aria-label="Plan" milestones={milestones} cutoff="2026-01-11" />);
    const dots = container.querySelectorAll<HTMLElement>('[data-milestone-dot]');
    expect(Array.from(dots).map((d) => d.style.left)).toEqual(['0%', '50%', '100%']);
    expect(dots[0].className).toContain('bg-icon-subtle');
    expect(dots[2].className).toContain('bg-background-brand-bold-default');
    expect(dots[0].closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('lists the milestones for screen readers when no children are given', () => {
    render(<MilestoneTimeline aria-label="Plan" milestones={milestones} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('wraps children in a collapsible block with the summary', () => {
    render(
      <MilestoneTimeline aria-label="Plan" milestones={milestones} detailsLabel="Show list">
        <p>Custom list</p>
      </MilestoneTimeline>,
    );
    expect(screen.getByText('Show list').tagName).toBe('SUMMARY');
  });
});
