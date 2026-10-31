import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@storybook/testing-library';
import { Building2, Download, Plus } from 'lucide-react';

import { Avatar, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Button } from './button';
import { Chip } from './chip';
import { DropdownMenuItem } from './dropdown-menu';
import { PageHeader } from './page-header';

const actions = (
  <>
    <Button variant="outline" size="sm" icon={<Download />}>Import</Button>
    <Button variant="primary" size="sm" icon={<Plus />}>New company</Button>
  </>
);

const meta = {
  id: 'patterns-page-header',
  title: 'Patterns · Interface/Page header',
  component: PageHeader,
  tags: ['autodocs'],
  args: { title: 'Companies', subtitle: 'All companies in this workspace. 112 records.', actions },
  argTypes: { variant: { control: 'select', options: ['default', 'zero', 'record', 'avatar', 'banner', 'banner-avatar'] } },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Zero: Story = {
  args: {
    variant: 'zero',
    actions: (
      <>
        <Button variant="outline" size="control-md" icon={<Download />}>Import</Button>
        <Button variant="primary" size="control-md" icon={<Plus />}>New company</Button>
      </>
    ),
  },
};
export const Record: Story = {
  args: {
    variant: 'record',
    title: 'Acme GmbH',
    subtitle: 'Hamburg · Software · 12 contacts',
    leading: (
      <Avatar shape="square" size="md">
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>
    ),
    badges: <Badge variant="subtle">Client</Badge>,
    actions: <Button variant="primary" size="sm">New demand</Button>,
  },
};
export const WithAttributes: Story = {
  args: { variant: 'record', title: 'Acme GmbH', attributes: <p className="typography-ui text-text-subtle">Attributes column</p> },
};

const cover = <div className="h-full w-full bg-gradient-to-br from-chart-brand-3 to-chart-brand-1" />;
const profileAvatar = (
  <Avatar size="2xl">
    <AvatarFallback>OR</AvatarFallback>
  </Avatar>
);

export const Banner: Story = { args: { variant: 'banner', title: 'Team members', subtitle: 'Manage your team and permissions.', cover, divider: true } };
export const BannerCentered: Story = { args: { variant: 'banner', centered: true, title: 'Team members', subtitle: 'Manage your team.', cover } };
export const BannerAvatar: Story = { args: { variant: 'banner-avatar', title: 'Lena Hartmann', subtitle: 'lena.hartmann@example.com', cover, leading: profileAvatar } };
export const BannerAvatarCentered: Story = { args: { variant: 'banner-avatar', centered: true, title: 'Lena Hartmann', subtitle: 'lena.hartmann@example.com', cover, leading: profileAvatar } };
// Scope chips row under the subtitle (Figma Scope chips / Scope chip 2).
export const ScopeChips: Story = {
  args: {
    variant: 'zero',
    title: 'Companies',
    subtitle: 'All companies in this workspace. 112 records.',
    scopeChips: (
      <>
        <Chip size="medium" icon={<Building2 />} label="Acme GmbH" />
        <Chip chipStyle="textOnly" label="All regions" />
      </>
    ),
  },
};

export const AvatarStyle: Story = { args: { variant: 'avatar', title: 'Lena Hartmann', subtitle: 'lena.hartmann@example.com', leading: profileAvatar } };

// Below the sm breakpoint the actions give way to a More button (icon-sm, never shrinks) that opens a menu with 44px touch rows. From sm up the actions show. Resize the viewport to see both.
export const MobileOverflow: Story = {
  args: {
    variant: 'zero',
    title: 'Shift planning with a very long title that would squeeze a shrinking trigger',
    subtitle: 'Week 44. 18 shifts.',
    overflow: (
      <>
        <DropdownMenuItem>Import</DropdownMenuItem>
        <DropdownMenuItem>New shift</DropdownMenuItem>
        <DropdownMenuItem>Export</DropdownMenuItem>
      </>
    ),
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

// `primaryAction` is always visible, also on a phone. `actions` collapse into the More menu below sm, `primaryAction` stays full width under the title. Only CSS switches the layout, so nothing moves after hydration.
export const PrimaryActionOnPhone: Story = {
  args: {
    variant: 'zero',
    title: 'Invoices',
    subtitle: '24 open. 3 overdue.',
    actions: <Button variant="outline" size="sm" icon={<Download />}>Export</Button>,
    primaryAction: <Button variant="primary" size="sm" icon={<Plus />}>New invoice</Button>,
    overflow: (
      <>
        <DropdownMenuItem>Export</DropdownMenuItem>
        <DropdownMenuItem>Import</DropdownMenuItem>
      </>
    ),
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const PrimaryActionDesktop: Story = {
  args: { ...PrimaryActionOnPhone.args },
};

const scopeTabs = (
  <div role="tablist" aria-label="Scope" className="flex gap-2">
    <Button role="tab" aria-selected="true" variant="secondary" size="sm">All invoices</Button>
    <Button role="tab" aria-selected="false" variant="ghost" size="sm">Mine</Button>
  </div>
);

// Tab order equals visual order. The DOM order is title, actions, primary action, tabs, and the layout shows the same order at 390 and 1024 pixels without any CSS reordering. The test runner presses Tab with a real keyboard at both widths (parameter keyboardOrder) and compares the focus sequence with the on-screen reading order.
export const PrimaryActionKeyboardOrder: Story = {
  args: {
    ...PrimaryActionOnPhone.args,
    actions: (
      <>
        <Button variant="outline" size="sm" icon={<Download />}>Export</Button>
        <Button variant="outline" size="sm">Import</Button>
      </>
    ),
    tabs: scopeTabs,
  },
  parameters: { keyboardOrder: { widths: [390, 1024] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // DOM order of the focusable elements, whatever the viewport shows.
    const names = Array.from(canvasElement.querySelectorAll<HTMLElement>('button')).map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim());
    expect(names.indexOf('New invoice')).toBeLessThan(names.indexOf('All invoices'));
    expect(canvas.getByRole('tablist')).toBeInTheDocument();
  },
};

// At mid widths the actions wrap among themselves. The primary action stays beside them at the end of the group, it never drops alone onto its own row.
export const PrimaryActionStaysWithActions: Story = {
  args: {
    variant: 'zero',
    title: 'Invoices and credit notes',
    subtitle: '24 open. 3 overdue.',
    actions: (
      <>
        <Button variant="outline" size="sm" icon={<Download />}>Export</Button>
        <Button variant="outline" size="sm">Import</Button>
        <Button variant="outline" size="sm">Reminders</Button>
        <Button variant="outline" size="sm">Bulk edit</Button>
      </>
    ),
    primaryAction: <Button variant="primary" size="sm" icon={<Plus />}>New invoice</Button>,
  },
  decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>],
  // Measured by the test runner at desktop width: beside the actions, not below them, every action ends before the primary action starts. Below the sm breakpoint the group dissolves on purpose (primary action follows the title, before the tabs).
  parameters: {
    layoutInvariants: {
      widths: [1440],
      leftOf: [{ each: ['button:Export', 'button:Import', 'button:Reminders', 'button:Bulk edit'], of: 'button:New invoice' }],
    },
  },
};

// Actions that are all hidden (responsive hiding by class) leave no blank row behind: the header is exactly as tall as one without actions.
export const HiddenActionsLeaveNoGap: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div data-testid="with-hidden">
        <PageHeader
          variant="zero"
          title="Invoices"
          subtitle="24 open."
          actions={
            <>
              <Button className="hidden" variant="outline" size="sm">Export</Button>
              <Button className="hidden" variant="outline" size="sm">Import</Button>
            </>
          }
          tabs={scopeTabs}
        />
      </div>
      <div data-testid="without">
        <PageHeader variant="zero" title="Invoices" subtitle="24 open." tabs={scopeTabs} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const a = canvas.getByTestId('with-hidden');
    const b = canvas.getByTestId('without');
    await waitFor(() => expect(a.getBoundingClientRect().height).toBe(b.getBoundingClientRect().height));
  },
};

// Reports-like header: wide tabs plus several actions and a primary action, in a container of a fixed width.
const allReportActions = ['Export PDF', 'Import data', 'Reminders', 'Bulk edit', 'Archive', 'Share report', 'Schedule', 'Compare', 'Annotate', 'Subscribe', 'Print layout', 'Duplicate'];
// Wider frames get more actions so the row really wraps at every width.
const reportHeaderStory = (width: number, count: number): Story => {
  const reportActions = allReportActions.slice(0, count - 1).concat('Duplicate');
  return {
  args: {
    variant: 'zero',
    title: 'Reports',
    subtitle: 'Hours and revenue per project.',
    tabs: scopeTabs,
    actions: (
      <>
        {reportActions.map((name) => (
          <Button key={name} variant="outline" size="sm">{name}</Button>
        ))}
      </>
    ),
    primaryAction: <Button variant="primary" size="sm" icon={<Plus />}>New report</Button>,
  },
  decorators: [(Story) => <div data-testid="frame" style={{ width, maxWidth: '100%' }}><Story /></div>],
  // Measured by the test runner at desktop width (the group dissolves below the sm breakpoint on purpose): no overflow of the frame or the page, the actions really wrap (the last sits lower than the first) and the primary action shares the row of the last action.
  parameters: {
    layoutInvariants: {
      widths: [1440],
      noOverflow: ['[data-testid="frame"]'],
      lowerThan: [{ el: `button:${reportActions[reportActions.length - 1]}`, than: `button:${reportActions[0]}` }],
      sameBottom: [{ a: 'button:New report', b: `button:${reportActions[reportActions.length - 1]}` }],
    },
  },
  };
};
export const WrappedActions640: Story = reportHeaderStory(640, 8);
export const WrappedActions700: Story = reportHeaderStory(700, 8);
export const WrappedActions900: Story = reportHeaderStory(900, 11);
export const WrappedActions1024: Story = reportHeaderStory(1024, 12);

// Shift planning example: the title block keeps a minimum width, so when the actions would fit on one row only by squeezing the title, they wrap below it instead. The frame widths are the content widths seen at 1033 to 1191 pixels with the sidebar collapsed.
// Every action is 120px wide, and the count leaves less than the title minimum next to them, which is what used to squeeze the title to a few pixels.
// The test runner measures it at 1440 pixels (parameter layoutInvariants): the heading and the subtitle are at least 240px wide and the actions start below the title.
const TITLE_MIN = 240;
const shiftPlanningLabels = ['Copy week', 'Publish plan', 'Swap shifts', 'Import rota', 'Export plan', 'Send reminder', 'Print plan', 'Share link', 'Archive week', 'Lock week'];
const shiftPlanningStory = (width: number): Story => {
  const count = Math.floor((width - 60 + 8) / 128);
  return {
    args: {
      variant: 'zero',
      title: 'Shift planning for the production teams in Frankfurt and Munich',
      subtitle: 'Plan, publish and swap shifts for the coming weeks.',
      actions: (
        <>
          {shiftPlanningLabels.slice(0, count).map((label) => (
            <Button key={label} variant="outline" size="sm" style={{ width: 120 }}>{label}</Button>
          ))}
        </>
      ),
    },
    decorators: [(Story) => <div data-testid="frame" style={{ width, maxWidth: '100%' }}><Story /></div>],
    parameters: {
      layoutInvariants: {
        widths: [1440],
        minWidth: [
          { selector: '#storybook-root h1', px: TITLE_MIN },
          { selector: '#storybook-root header p', px: TITLE_MIN },
        ],
        below: [{ selector: '#storybook-root header button', of: '#storybook-root header p' }],
      },
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(canvas.getAllByRole('button')).toHaveLength(count);
    },
  };
};
export const TitleKeepsMinWidth1033: Story = shiftPlanningStory(1033);
export const TitleKeepsMinWidth1100: Story = shiftPlanningStory(1100);
export const TitleKeepsMinWidth1191: Story = shiftPlanningStory(1191);

// On a phone a header with many actions and no `overflow` prop keeps every label on one line. The actions wrap onto more rows instead (the test runner measures the labels at 390 pixels).
export const ManyActionsOnPhone: Story = {
  args: {
    variant: 'zero',
    title: 'Shift planning',
    subtitle: 'Plan and publish the next weeks.',
    actions: (
      <>
        {['Export report', 'Import data', 'Copy last week', 'Publish plan', 'Send reminder', 'Swap shifts', 'Print plan'].map((label) => (
          <Button key={label} variant="outline" size="sm">{label}</Button>
        ))}
      </>
    ),
  },
  parameters: { viewport: { defaultViewport: 'mobile1' }, layoutInvariants: { widths: [390] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('button', { name: 'Copy last week' })).toHaveClass('whitespace-nowrap');
  },
};
