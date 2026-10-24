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
  title: 'Patterns/Page header',
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

// Phone order follows the prototype: title, scope controls (tabs slot), then the main action. Only CSS reorders, the DOM order stays the same.
export const PrimaryActionAfterTabsOnPhone: Story = {
  args: { ...PrimaryActionOnPhone.args, tabs: scopeTabs },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The reorder applies below the sm breakpoint of the viewport. The test runner also visits the story at desktop width.
    if (window.matchMedia('(min-width: 640px)').matches) return;
    const tabs = canvas.getByRole('tablist');
    const primary = canvas.getByRole('button', { name: 'New invoice' });
    await waitFor(() => expect(primary.getBoundingClientRect().top).toBeGreaterThanOrEqual(tabs.getBoundingClientRect().bottom));
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Below the sm breakpoint of the viewport the group dissolves on purpose (primary action behind the tabs), so only desktop width is checked.
    if (!window.matchMedia('(min-width: 640px)').matches) return;
    // Beside the actions, not below them: every action ends before the primary action starts.
    await waitFor(() => {
      const primary = canvas.getByRole('button', { name: 'New invoice' }).getBoundingClientRect();
      expect(primary.width).toBeGreaterThan(0);
      for (const name of ['Export', 'Import', 'Reminders', 'Bulk edit']) {
        expect(canvas.getByRole('button', { name }).getBoundingClientRect().right).toBeLessThanOrEqual(primary.left + 1);
      }
    });
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
