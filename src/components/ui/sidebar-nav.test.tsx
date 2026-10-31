import { vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { Home, Layers, Settings } from 'lucide-react';
import { useState } from 'react';

import { Sidebar, SidebarContent, SidebarLayout, SidebarNavItem, SidebarQuickActions, SidebarTree, SidebarWorkspaceSwitcher } from './sidebar';
import {
  SidebarAccount,
  SidebarBackRow,
  SidebarFeaturedCard,
  SidebarMobileMenu,
  SidebarNavGroups,
  SidebarNavTree,
  SidebarRailButton,
  SidebarSearchField,
  SidebarTier,
  type SidebarNavNode,
} from './sidebar-nav';

const apps: SidebarNavNode[] = [
  {
    id: 'workstream',
    label: 'workstream',
    children: [
      { id: 'projects', label: 'Projects', href: '/projects' },
      { id: 'board', label: 'Board', href: '/board' },
    ],
  },
  {
    id: 'backoffice',
    label: 'backoffice',
    href: '/backoffice',
    children: [{ id: 'time', label: 'Time', href: '/time' }],
  },
  {
    id: 'vacancy',
    label: 'vacancy',
    children: [{ id: 'demands', label: 'Demands', href: '/demands', active: true }],
  },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings />, disabled: true },
];

describe('SidebarNavTree', () => {
  it('renders data driven groups collapsed unless they hold the active item', () => {
    render(<SidebarNavTree nodes={apps} />);
    expect(screen.getByRole('button', { name: 'workstream' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'vacancy' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Demands' })).toHaveAttribute('aria-current', 'page');
  });

  it('toggles a group with the keyboard', async () => {
    const user = userEvent.setup();
    render(<SidebarNavTree nodes={apps} />);
    const trigger = screen.getByRole('button', { name: 'workstream' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Board' })).toBeInTheDocument();
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a linked group row a link and adds a separate toggle', async () => {
    const user = userEvent.setup();
    render(<SidebarNavTree nodes={apps} />);
    expect(screen.getByRole('link', { name: 'backoffice' })).toHaveAttribute('href', '/backoffice');
    const toggle = screen.getByRole('button', { name: 'backoffice' });
    await user.click(toggle);
    expect(screen.getByRole('link', { name: 'Time' })).toBeInTheDocument();
  });

  it('supports controlled open ids', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [ids, setIds] = useState<string[]>(['workstream']);
      return (
        <SidebarNavTree
          nodes={apps}
          openIds={ids}
          onOpenIdsChange={(next) => {
            onChange(next);
            setIds(next);
          }}
        />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'workstream' }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
  });

  it('marks a disabled node aria-disabled and out of the tab order', () => {
    render(<SidebarNavTree nodes={apps} />);
    const item = screen.getByText('Settings').closest('a');
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveAttribute('tabindex', '-1');
  });

  it('lets renderLink swap the anchor element', () => {
    render(
      <SidebarNavTree
        nodes={[{ id: 'a', label: 'Home', href: '/home', icon: <Home /> }]}
        renderLink={(node, props) => <SidebarNavItem {...props} data-router="yes" />}
      />,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-router', 'yes');
  });
});

describe('Sidebar collapsed rail', () => {
  const Example = ({ mode }: { mode?: 'hide' | 'rail' }) => (
    <SidebarLayout defaultCollapsed collapsedMode={mode}>
      <Sidebar>
        <SidebarWorkspaceSwitcher logo="GD" name="Get IT Done" />
        <SidebarQuickActions />
        <SidebarContent>
          <SidebarNavItem href="#" icon={<Home />} label="Home" count={3} active />
        </SidebarContent>
      </Sidebar>
    </SidebarLayout>
  );

  it('removes the sidebar by default (unchanged)', () => {
    render(<Example />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('keeps an icon only rail with accessible names in rail mode', () => {
    render(<Example mode="rail" />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('data-rail', 'true');
    expect(nav).toHaveClass('data-[rail]:w-sidebar-collapsed');
    const home = screen.getByRole('link', { name: /Home/ });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Home')).toHaveClass('group-data-[rail]/sb:sr-only');
  });
});

describe('Sidebar settings mode', () => {
  it('back row shows the Esc hint and calls back', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SidebarBackRow onClick={onClick} />);
    const back = screen.getByRole('button', { name: /Settings/ });
    expect(back).toHaveAttribute('aria-keyshortcuts', 'Escape');
    expect(back).toHaveTextContent('Esc');
    await user.click(back);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('back row leaves on Escape only when closeOnEscape is set', () => {
    const onClick = vi.fn();
    const { rerender } = render(<SidebarBackRow onClick={onClick} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClick).not.toHaveBeenCalled();
    rerender(<SidebarBackRow onClick={onClick} closeOnEscape />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('search field is a labelled search landmark', async () => {
    const user = userEvent.setup();
    render(<SidebarSearchField placeholder="Find settings" />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    const input = screen.getByRole('searchbox', { name: 'Find settings' });
    await user.type(input, 'sec');
    expect(input).toHaveValue('sec');
  });
});

describe('Sidebar tiers', () => {
  it('rail button renders a link with a name and current state', () => {
    render(<SidebarRailButton href="#" icon={<Layers />} label="Projects" active />);
    const link = screen.getByRole('link', { name: 'Projects' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('title', 'Projects');
  });

  it('rail button without href is a toggle button', () => {
    render(<SidebarRailButton icon={<Layers />} label="Projects" />);
    expect(screen.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('tier is a navigation with a width variant', () => {
    render(<SidebarTier aria-label="Primary" width="wide" />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toHaveClass('w-aside-compact');
  });

  it('featured card dismisses from the close button and the action', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<SidebarFeaturedCard title="Used space" description="80%" onDismiss={onDismiss} action={<a href="#upgrade">Upgrade plan</a>} />);
    expect(screen.getByRole('region', { name: 'Used space' })).toBeInTheDocument();
    const dismiss = screen.getAllByRole('button', { name: 'Dismiss' });
    expect(dismiss).toHaveLength(2);
    await user.click(dismiss[1]);
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Upgrade plan' })).toBeInTheDocument();
  });

  it('account row shows name, secondary and action', () => {
    render(<SidebarAccount avatar={<span>OR</span>} name="Lena Hartmann" secondary="lena.hartmann@example.com" action={<button aria-label="Log out" />} />);
    expect(screen.getByText('Lena Hartmann')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('mobile menu is a dialog with a navigation landmark and closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SidebarMobileMenu open onOpenChange={onOpenChange}>
        <SidebarNavItem href="#" label="Home" />
      </SidebarMobileMenu>,
    );
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menu' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('Sidebar round 3', () => {
  it('tree level 1 indents further, default unchanged', () => {
    render(
      <>
        <SidebarTree data-testid="a" />
        <SidebarTree data-testid="b" level={1} />
      </>,
    );
    expect(screen.getByTestId('a')).toHaveClass('ml-[15px]');
    expect(screen.getByTestId('a')).not.toHaveAttribute('data-level');
    expect(screen.getByTestId('b')).toHaveClass('ml-[30px]');
    expect(screen.getByTestId('b')).not.toHaveClass('ml-[15px]');
  });

  it('nested nav tree groups use level 1', () => {
    render(
      <SidebarNavTree
        nodes={[{ id: 'a', label: 'A', defaultOpen: true, children: [{ id: 'b', label: 'B', defaultOpen: true, children: [{ id: 'c', label: 'C', href: '#c' }] }] }]}
      />,
    );
    const groups = screen.getAllByRole('group');
    expect(groups[0]).not.toHaveAttribute('data-level');
    expect(groups[1]).toHaveAttribute('data-level', '1');
  });

  it('plain workspace switcher is a plain button', () => {
    render(
      <SidebarLayout>
        <SidebarWorkspaceSwitcher logo="GD" name="Get IT Done" />
      </SidebarLayout>,
    );
    expect(screen.getByRole('button', { name: 'Get IT Done' })).not.toHaveAttribute('aria-haspopup');
  });

  it('workspace switcher menu opens with the keyboard, selects, creates and returns focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCreate = vi.fn();
    render(
      <SidebarLayout>
        <SidebarWorkspaceSwitcher
          logo="GD"
          name="Nordwind Handel"
          workspaces={[{ id: 'a', name: 'Nordwind Handel' }, { id: 'b', name: 'Beta' }]}
          activeWorkspaceId="a"
          onWorkspaceChange={onChange}
          personal={{ name: 'Personal' }}
          onCreateWorkspace={onCreate}
        />
      </SidebarLayout>,
    );
    const trigger = screen.getByRole('button', { name: 'Nordwind Handel' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Nordwind Handel' })).toHaveAttribute('aria-current', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'Create workspace' }));
    expect(onCreate).toHaveBeenCalled();
  });
});

describe('SidebarNavItem status dot and lock', () => {
  it('renders on and off status dots with the 6px token and an accessible text', () => {
    render(
      <>
        <SidebarNavItem href="#" label="Calendar" statusDot="on" />
        <SidebarNavItem href="#" label="Jira" statusDot="off" />
      </>,
    );
    const on = screen.getByRole('link', { name: /Calendar/ }).querySelector('[data-status-dot="on"] > span[aria-hidden]');
    const off = screen.getByRole('link', { name: /Jira/ }).querySelector('[data-status-dot="off"] > span[aria-hidden]');
    expect(on).toHaveClass('h-[var(--size-status-dot)]', 'w-[var(--size-status-dot)]', 'bg-status-success-dot');
    expect(off).toHaveClass('bg-text-subtlest');
    expect(screen.getByRole('link', { name: 'Calendar Active' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jira Inactive' })).toBeInTheDocument();
  });

  it('renders a lock icon with a screen reader label', () => {
    render(<SidebarNavItem href="#" label="Master data" locked />);
    const link = screen.getByRole('link', { name: 'Master data Locked' });
    expect(link.querySelector('[data-locked] svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders nothing extra by default and passes the props through SidebarNavTree', () => {
    const { container } = render(<SidebarNavItem href="#" label="Plain" />);
    expect(container.querySelector('[data-status-dot], [data-locked]')).toBeNull();
    render(<SidebarNavTree nodes={[{ id: 'a', label: 'Locked node', href: '/a', locked: true, statusDot: 'on' }]} />);
    expect(screen.getByRole('link', { name: 'Locked node Locked Active' })).toBeInTheDocument();
  });
});

describe('SidebarNavGroups', () => {
  const groups = [
    { id: 'finance', label: 'Integrations · Finance', nodes: [{ id: 'bank', label: 'Bank', href: '/bank' }] },
    { id: 'admin', label: 'Admin', collapsible: true, nodes: [{ id: 'users', label: 'Users', href: '/users' }] },
  ];

  it('renders a labelled group per entry with its links', () => {
    render(<SidebarNavGroups groups={groups} />);
    expect(screen.getByRole('group', { name: 'Integrations · Finance' })).toContainElement(screen.getByRole('link', { name: 'Bank' }));
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
  });

  it('collapsible groups toggle with the keyboard', async () => {
    const user = userEvent.setup();
    render(<SidebarNavGroups groups={groups} />);
    const toggle = screen.getByRole('button', { name: 'Admin' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull();
  });
});
