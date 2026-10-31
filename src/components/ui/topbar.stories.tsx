import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { useState } from 'react';
import { Bell, Clock, HelpCircle, History, Sparkles, X } from 'lucide-react';

import { AutosaveStatus } from './autosave-status';
import { Avatar, AvatarFallback, AvatarGroup } from './avatar';
import { Button } from './button';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu';
import { ObjectIcon } from './object-icon';
import { SidebarObjectIcon } from './sidebar';
import {
  TimerPill,
  TopBar,
  TopBarBrand,
  TopBarBreadcrumb,
  TopBarEnd,
  TopBarEscapeHint,
  TopBarHelpButton,
  TopBarIconButton,
  TopBarMenuButton,
  TopBarMobileMenu,
  TopBarNav,
  TopBarPreferences,
  TopBarStart,
  TopBarSubRow,
} from './topbar';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  title: 'Compositions/Top bar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Header navigation: Inset App, Settings, Guest, plus Simple, Dual-tier and Mobile. Compose the parts into the start and end slots.',
      },
    },
  },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const person = (initials: string, n: 1 | 2 | 3) => (
  <Avatar size="xs" key={initials}>
    <AvatarFallback
      size="xs"
      className={
        n === 1
          ? 'bg-data-avatar-1-default text-data-avatar-1-on'
          : n === 2
            ? 'bg-data-avatar-2-default text-data-avatar-2-on'
            : 'bg-data-avatar-3-default text-data-avatar-3-on'
      }
    >
      {initials}
    </AvatarFallback>
  </Avatar>
);

export const App: Story = {
  render: () => (
    <TopBar>
      <TopBarStart>
        <TopBarBreadcrumb
          icon={<SidebarObjectIcon product="vacancy"><Sparkles /></SidebarObjectIcon>}
          items={[{ label: 'vacancy', href: '#' }, { label: 'Demands' }]}
          context="NWH, AGILE"
          contextSwatches={['var(--colors-data-project-1)', 'var(--colors-data-project-2)']}
        />
      </TopBarStart>
      <TopBarEnd>
        <AvatarGroup aria-label="People on this page" data-topbar-secondary="">
          {[person('ST', 1), person('JM', 2), person('LK', 3)]}
        </AvatarGroup>
        <TimerPill time="01:24:37" data-topbar-secondary="" />
        <TopBarIconButton label="History" data-topbar-secondary="">
          <History />
        </TopBarIconButton>
        <TopBarIconButton label="Notifications" count={5}>
          <Bell />
        </TopBarIconButton>
        <TopBarIconButton label="Help" status="success" statusLabel="Connected" data-topbar-secondary="">
          <HelpCircle />
        </TopBarIconButton>
        <Button variant="outline" size="control-md" icon={<Sparkles />} data-topbar-action="">
          Ask workload.zero
        </Button>
      </TopBarEnd>
    </TopBar>
  ),
};

export const Settings: Story = {
  render: () => (
    <TopBar>
      <TopBarStart>
        <ObjectIcon app="contextual"><Sparkles /></ObjectIcon>
        <TopBarBreadcrumb items={[{ label: 'Settings', href: '#' }, { label: 'Personal', href: '#' }, { label: 'Account' }]} />
      </TopBarStart>
      <TopBarEnd>
        <AutosaveStatus state="saved" />
        <TopBarEscapeHint />
        <TopBarIconButton label="Close settings">
          <X />
        </TopBarIconButton>
      </TopBarEnd>
    </TopBar>
  ),
};

// Settings mode with the Help button instead of the close button (Figma Header navigation Mode=Settings).
export const SettingsHelp: Story = {
  render: () => (
    <TopBar>
      <TopBarStart>
        <ObjectIcon app="contextual"><Sparkles /></ObjectIcon>
        <TopBarBreadcrumb items={[{ label: 'Settings', href: '#' }, { label: 'Personal', href: '#' }, { label: 'Account' }]} />
      </TopBarStart>
      <TopBarEnd>
        <AutosaveStatus state="saved" />
        <TopBarEscapeHint />
        <TopBarHelpButton />
      </TopBarEnd>
    </TopBar>
  ),
};

export const Guest: Story = {
  render: () => (
    <TopBar variant="guest">
      <TopBarStart>
        <ObjectIcon app="contextual" size="md" label="workload.zero"><Sparkles /></ObjectIcon>
        <span className="typography-ui-semibold">workload.zero</span>
        <TopBarNav
          tone="muted"
          className="ml-2"
          items={[
            { label: 'Jobs', href: '#jobs', current: true },
            { label: 'Community', href: '#community' },
            { label: 'Pricing', href: '#pricing' },
          ]}
        />
      </TopBarStart>
      <TopBarEnd>
        <Button variant="ghost" size="control-md">
          Sign in
        </Button>
        <Button variant="outline" size="control-md">
          Request a demo
        </Button>
      </TopBarEnd>
    </TopBar>
  ),
};

export const GuestWithBylineAndPreferences: Story = {
  render: () => (
    <TopBar variant="guest">
      <TopBarStart>
        <TopBarBrand
          mark={
            <ObjectIcon app="contextual" size="md" label="workload.zero">
              <Sparkles />
            </ObjectIcon>
          }
          name="workload.zero"
          byline="by Get IT Done"
        />
        <TopBarNav
          tone="muted"
          className="ml-2"
          items={[
            { label: 'Jobs', href: '#jobs', current: true },
            { label: 'Community', href: '#community' },
            { label: 'Pricing', href: '#pricing' },
          ]}
        />
      </TopBarStart>
      <TopBarEnd>
        <TopBarPreferences language="English" onLanguageClick={() => undefined} theme="light" onThemeToggle={() => undefined} />
        <Button variant="ghost" size="control-md">
          Sign in
        </Button>
      </TopBarEnd>
    </TopBar>
  ),
};

// Auth pages hide the menu: leave TopBarNav out (Figma Show menu off).
export const GuestAuthPage: Story = {
  render: () => (
    <TopBar variant="guest">
      <TopBarStart>
        <TopBarBrand name="workload.zero" byline="by Get IT Done" />
      </TopBarStart>
      <TopBarEnd>
        <TopBarPreferences language="English" onLanguageClick={() => undefined} theme="dark" onThemeToggle={() => undefined} />
      </TopBarEnd>
    </TopBar>
  ),
};

const simpleNav = [
  { label: 'Home', href: '#' },
  { label: 'Dashboard', href: '#', current: true },
  { label: 'Projects', href: '#' },
  { label: 'Tasks', href: '#' },
];

export const Simple: Story = {
  render: () => (
    <TopBar variant="simple">
      <TopBarStart className="gap-8">
        <span className="typography-title-sm">Get IT Done</span>
        <TopBarNav items={simpleNav} />
      </TopBarStart>
      <TopBarEnd>
        <TopBarIconButton label="Settings">
          <Clock />
        </TopBarIconButton>
        <TopBarIconButton label="Notifications">
          <Bell />
        </TopBarIconButton>
      </TopBarEnd>
    </TopBar>
  ),
};

export const DualTier: Story = {
  render: () => (
    <div>
      <TopBar variant="simple" className="border-b-0">
        <TopBarStart className="gap-8">
          <span className="typography-title-sm">Get IT Done</span>
          <TopBarNav items={simpleNav} />
        </TopBarStart>
        <TopBarEnd>
          <Button variant="outline" size="control-md">
            Upgrade now
          </Button>
        </TopBarEnd>
      </TopBar>
      <TopBarSubRow>
        <TopBarNav
          aria-label="Section"
          items={[
            { label: 'Overview', href: '#', current: true },
            { label: 'Notifications', href: '#' },
            { label: 'Analytics', href: '#' },
          ]}
        />
      </TopBarSubRow>
    </div>
  ),
};

export const Mobile: Story = {
  render: () => (
    <TopBar variant="mobile">
      <span className="typography-title-sm">Get IT Done</span>
      <TopBarEnd>
        <TopBarMenuButton />
      </TopBarEnd>
    </TopBar>
  ),
};

// Popover and menu triggers: `expanded` sets aria-expanded and the open surface (use `pressed` for plain toggles instead).
const ExpandedDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex items-center gap-2 p-6">
      <TopBarIconButton label="Notifications" expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <Bell />
      </TopBarIconButton>
      <TopBarIconButton label="Help" expanded={false} aria-haspopup="menu">
        <HelpCircle />
      </TopBarIconButton>
    </div>
  );
};

export const ExpandedTrigger: Story = {
  render: () => <ExpandedDemo />,
};

export const TimerStates: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6">
      <TimerPill time="01:24:37" />
      <TimerPill time="00:00:00" running={false} />
    </div>
  ),
};

export const TimerWithDetails: Story = {
  render: () => (
    <div className="flex items-center justify-end gap-4 p-6">
      <TimerPill
        time="01:24:37"
        details={
          <div className="flex flex-col gap-2">
            <p className="typography-ui-semibold">Website relaunch</p>
            <p className="typography-text-extra-small text-muted-foreground">Started 09:12</p>
            <Button size="sm">Stop timer</Button>
          </div>
        }
      />
    </div>
  ),
};

export const AutosaveStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      {(['saved', 'saving', 'dirty', 'error', 'offline'] as const).map((state) => (
        <AutosaveStatus key={state} state={state} />
      ))}
    </div>
  ),
};

export const GuestWithMobileMenu: Story = {
  render: () => {
    const items = [
      { label: 'Jobs', href: '#jobs', current: 'location' as const },
      { label: 'Pricing', href: '#pricing' },
    ];
    return (
      <TopBar variant="guest">
        <TopBarStart>
          <TopBarBrand name="workload.zero" size="md" />
          <TopBarNav tone="muted" className="ml-2 hidden md:block" items={items} />
        </TopBarStart>
        <TopBarEnd>
          <TopBarPreferences language="Deutsch" languageHref="/de" languageHrefLang="de" className="hidden md:flex" />
          <TopBarMobileMenu items={items}>
            <TopBarPreferences language="Deutsch" languageHref="/de" languageHrefLang="de" />
          </TopBarMobileMenu>
        </TopBarEnd>
      </TopBar>
    );
  },
};

// Flat links mixed with collapsible groups (library Accordion). The group with the current page starts open.
export const GuestWithMobileMenuGroups: Story = {
  render: () => (
    <TopBar variant="guest">
      <TopBarStart>
        <TopBarBrand name="workload.zero" size="md" />
      </TopBarStart>
      <TopBarEnd>
        <TopBarMobileMenu
          alwaysVisible
          items={[
            { label: 'Home', href: '#home' },
            { group: 'Products', items: [{ label: 'Vacancy', href: '#vacancy' }, { label: 'Time', href: '#time' }] },
            { group: 'Company', items: [{ label: 'About', href: '#about', current: 'page' }, { label: 'Contact', href: '#contact' }] },
          ]}
        />
      </TopBarEnd>
    </TopBar>
  ),
};

// Non-collapsible groups show a visible heading, and the footer slot keeps "Sign in" visible while the list scrolls.
export const GuestMobileMenuFooterAndHeadings: Story = {
  render: () => (
    <TopBar variant="guest">
      <TopBarStart>
        <TopBarBrand name="workload.zero" size="md" />
      </TopBarStart>
      <TopBarEnd>
        <TopBarMobileMenu
          alwaysVisible
          defaultOpen
          footer={<Button variant="primary">Sign in</Button>}
          items={[
            { group: 'Products', collapsible: false, items: [{ label: 'Vacancy', href: '#vacancy' }, { label: 'Time', href: '#time' }] },
            { group: 'Company', items: [{ label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }] },
          ]}
        />
      </TopBarEnd>
    </TopBar>
  ),
};

// Mobile menu on an inverse band (dark in light mode, light in dark mode). The menu button takes the inverse focus ring, and a logo link in the drawer gets the shared ring.
export const GuestMobileMenuInverse: Story = {
  render: () => {
    const items = [
      { label: 'Jobs', href: '#jobs' },
      { label: 'Pricing', href: '#pricing' },
    ];
    return (
      <TopBar variant="guest" className="bg-background-inverse text-text-inverse">
        <TopBarStart>
          <TopBarBrand name="workload.zero" size="md" tone="inverse" />
        </TopBarStart>
        <TopBarEnd>
          <TopBarMobileMenu items={items} tone="inverse">
            <a href="/" className="rounded-item typography-ui-semibold text-text-default no-underline">
              workload.zero
            </a>
          </TopBarMobileMenu>
        </TopBarEnd>
      </TopBar>
    );
  },
};

export const IconButtonPressedAndCap: Story = {
  render: () => (
    <TopBar>
      <TopBarEnd>
        <TopBarIconButton label="Notifications" count={120} pressed>
          <Bell />
        </TopBarIconButton>
      </TopBarEnd>
    </TopBar>
  ),
};

// Brand on an inverse surface with the display size (letter-spacing comes from the type role).
export const BrandInverse: Story = {
  render: () => (
    <div className="bg-background-inverse p-4">
      <TopBarBrand name="workload.zero" byline="by Get IT Done" size="lg" tone="inverse" />
    </div>
  ),
};

export const BrandSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <TopBarBrand name="workload.zero" size="18" />
      <TopBarBrand name="workload.zero" size="24" />
      <TopBarBrand name="workload.zero" size="18" uppercase tracking="wider" />
    </div>
  ),
};

// Stays light on dark in light and dark mode. Check both themes in the toolbar.
export const BrandInverseFixed: Story = {
  render: () => (
    <div className="dark bg-background-subtle p-4">
      <TopBarBrand name="workload.zero" byline="by Get IT Done" size="24" tone="inverse-fixed" />
    </div>
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  ...App,
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};

// A long middle crumb at 320 and 390: every level truncates with an ellipsis, the current page keeps its room and the primary action keeps only its icon below sm. Below sm the parents are display none (not focusable).
export const BreadcrumbLongMiddle: Story = {
  render: () => (
    <TopBar>
      <TopBarStart>
        <TopBarBreadcrumb
          icon={<SidebarObjectIcon product="vacancy"><Sparkles /></SidebarObjectIcon>}
          items={[{ label: 'vacancy', href: '#' }, { label: 'Quarterly reconciliation of open demands and partner contracts', href: '#' }, { label: 'Demands' }]}
          context="NWH, AGILE"
        />
      </TopBarStart>
      <TopBarEnd>
        <TopBarIconButton label="Notifications" count={5}>
          <Bell />
        </TopBarIconButton>
        <Button variant="outline" size="control-md" icon={<Sparkles />} data-topbar-action="">
          Ask workload.zero
        </Button>
      </TopBarEnd>
    </TopBar>
  ),
};

// The same long trail with a status chip and a menu trigger in the end slot at 320 and 390: below sm the parent shows as a back link (arrow plus label), the chip and the title truncate with an ellipsis and the trigger keeps only its icon (label as tooltip). Nothing overlaps.
export const BreadcrumbWithStatusAndMenu: Story = {
  render: () => (
    <TopBar>
      <TopBarStart>
        <TopBarBreadcrumb
          icon={<SidebarObjectIcon product="vacancy"><Sparkles /></SidebarObjectIcon>}
          items={[{ label: 'vacancy', href: '#' }, { label: 'Quarterly reconciliation of open demands', href: '#' }, { label: 'Demand with a very long working title' }]}
        />
      </TopBarStart>
      <TopBarEnd>
        <AutosaveStatus state="dirty" label="Unsaved changes in this demand" />
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-topbar-action="" icon={<Sparkles />}>
                Products
              </NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </TopBarEnd>
    </TopBar>
  ),
};

// DR-0300-02: a top bar narrower than 448px (here fixed at 360, whatever the viewport) keeps the chip icon only. The query runs against the container named `topbar`.
export const StatusChipIconOnlyInNarrowBar: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <TopBar>
        <TopBarStart>
          <TopBarBreadcrumb items={[{ label: 'Demands' }]} />
        </TopBarStart>
        <TopBarEnd>
          <AutosaveStatus state="saved" />
        </TopBarEnd>
      </TopBar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector('[role="status"]') as HTMLElement;
    expect((status.querySelector('[data-status-label]') as HTMLElement).getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(within(canvasElement).getByRole('button', { name: 'Saved' })).toBeVisible();
  },
};

// Status chip in a narrow top bar (under 448px, a container query on the bar, not the viewport): only the icon is drawn, the label stays the accessible name, and the chip is a button (44px hit area under touch) that opens the status text (UX-030-01). Error and offline add an alert and a Retry.
export const StatusChipIconOnPhone: Story = {
  parameters: { layoutInvariants: { widths: [390], noFragment: ['[role="status"] [data-status-label]'] } },
  render: () => (
    <TopBar>
      <TopBarStart>
        <TopBarBreadcrumb items={[{ label: 'vacancy', href: '#' }, { label: 'Demands' }]} />
      </TopBarStart>
      <TopBarEnd>
        <AutosaveStatus state="error" onRetry={() => undefined} />
      </TopBarEnd>
    </TopBar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvasElement.querySelector('[role="status"]') as HTMLElement;
    // The text is always in the live region, whatever the width shows.
    expect(status).toHaveTextContent('Save failed');
    expect(status).toHaveAttribute('title', 'Save failed');
    expect(canvas.getByRole('alert')).toHaveTextContent('Save failed');
    const narrow = (canvasElement.querySelector('header') as HTMLElement).getBoundingClientRect().width < 448;
    const trigger = canvas.getByRole('button', { name: 'Save failed' });
    if (!narrow) {
      expect(getComputedStyle(trigger).display).toBe('none');
      expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
      return;
    }
    // Icon only: no label drawn, the chip itself is a focusable button that opens the text and Retry.
    expect((status.querySelector('[data-status-label]') as HTMLElement).getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(trigger).toBeVisible();
    expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(status.getBoundingClientRect().height);
    trigger.focus();
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    const body = within(document.body);
    await waitFor(() => expect(body.getAllByRole('button', { name: 'Try again' }).some((b) => b.closest('[role="dialog"]'))).toBe(true));
  },
};

// A section jump from the mobile menu: the drawer closes, waits until the scroll lock is gone, scrolls and focuses the section.
export const GuestMobileMenuSectionJump: Story = {
  render: () => (
    <div>
      <TopBar variant="guest" className="sticky top-0 z-sticky">
        <TopBarStart>
          <TopBarBrand name="workload.zero" size="md" />
        </TopBarStart>
        <TopBarEnd>
          <TopBarMobileMenu alwaysVisible items={[{ label: 'Jobs', href: '#jobs' }, { label: 'Pricing', href: '#pricing' }]} />
        </TopBarEnd>
      </TopBar>
      <section id="jobs" aria-label="Jobs" className="h-screen scroll-mt-14">
        <h2>Jobs</h2>
      </section>
      <section id="pricing" aria-label="Pricing" className="h-screen scroll-mt-14">
        <h2>Pricing</h2>
      </section>
    </div>
  ),
};
