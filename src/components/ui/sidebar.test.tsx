import { fireEvent, render, screen } from '@testing-library/react';
import { Home, Inbox } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarLayout,
  SidebarNavItem,
  SidebarObjectIcon,
  SidebarProvider,
  SidebarTrigger,
  SidebarQuickActions,
  SidebarSection,
  SidebarSectionAction,
  SidebarTree,
  SidebarWorkspaceSwitcher,
} from './sidebar';

function Example({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  return (
    <SidebarLayout defaultCollapsed={defaultCollapsed}>
      <Sidebar>
        <SidebarWorkspaceSwitcher logo="GD" name="Get IT Done" />
        <SidebarQuickActions />
        <SidebarContent>
          <SidebarNavItem href="#" icon={<Home />} label="Home" active />
          <SidebarNavItem href="#" icon={<Inbox />} label="Inbox" count={6} />
          <SidebarSection label="Apps">
            <SidebarNavItem href="#" icon={<SidebarObjectIcon product="backoffice" />} label="backoffice" />
            <SidebarTree>
              <SidebarNavItem href="#" label="Billing" />
            </SidebarTree>
          </SidebarSection>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>Inhalt</SidebarInset>
    </SidebarLayout>
  );
}

describe('SidebarProvider', () => {
  it('shares the collapse state without adding a wrapper element', () => {
    const { container } = render(
      <SidebarProvider defaultCollapsed={false}>
        <SidebarTrigger />
        <Sidebar>
          <SidebarContent>
            <SidebarNavItem href="#" label="Home" />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    expect(container.firstElementChild?.tagName).toBe('BUTTON');
    expect(container.querySelector('[data-state-layout], .min-h-screen')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('SidebarLayout still renders its min-h-screen wrapper with the state attribute', () => {
    const { container } = render(<Example />);
    expect(container.firstElementChild).toHaveClass('min-h-screen');
    expect(container.firstElementChild).toHaveAttribute('data-state', 'expanded');
  });
});

describe('Sidebar', () => {
  it('renders a labelled navigation landmark', () => {
    render(<Example />);
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Inhalt');
  });

  it('marks the active item with aria-current and the accent token', () => {
    render(<Example />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveClass('data-[active]:bg-sidebar-accent');
    expect(screen.getByRole('link', { name: /Inbox/ })).not.toHaveAttribute('aria-current');
  });

  it('shows the count next to the label', () => {
    render(<Example />);
    expect(screen.getByRole('link', { name: /Inbox/ })).toHaveTextContent('6');
  });

  it('collapses a section via its trigger (aria-expanded)', () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Apps' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Billing' })).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Billing' })).not.toBeInTheDocument();
  });

  it('hides and shows the sidebar with the trigger', () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Hide sidebar' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(screen.queryByRole('navigation', { name: 'Main menu' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('ml-2');
  });

  it('starts collapsed when defaultCollapsed is set', () => {
    render(<Example defaultCollapsed />);
    expect(screen.queryByRole('navigation', { name: 'Main menu' })).not.toBeInTheDocument();
  });

  it('exposes keyboard shortcuts on quick actions and labels the icon-only search button', () => {
    render(<Example />);
    expect(screen.getByRole('button', { name: /Quick Actions/ })).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('keeps section actions at least 24px (WCAG 2.5.8)', () => {
    render(
      <SidebarLayout>
        <Sidebar>
          <SidebarSection label="Projekte" action={<SidebarSectionAction aria-label="Projekt aktivieren">+</SidebarSectionAction>} />
        </Sidebar>
      </SidebarLayout>,
    );
    expect(screen.getByRole('button', { name: 'Projekt aktivieren' })).toHaveClass('h-[24px]', 'w-[24px]');
  });

  it('does not truncate the label away when secondary text is present', () => {
    render(
      <SidebarLayout>
        <Sidebar>
          <SidebarNavItem href="#" label="DGTL" secondary="Digital Transformation" />
        </Sidebar>
      </SidebarLayout>,
    );
    expect(screen.getByText('DGTL')).toHaveClass('shrink-0');
  });

  it('does not announce a popup unless wired to a menu', () => {
    render(<Example />);
    expect(screen.getByRole('button', { name: /Get IT Done/ })).not.toHaveAttribute('aria-haspopup');
  });

  it('wires product object icons to the product token family', () => {
    const { container } = render(<SidebarObjectIcon product="vacancy" data-testid="icon" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('bg-product-vacancy-default');
    expect(el).toHaveClass('text-product-vacancy-on');
  });

  it('wires the meeting.zero object icon to its product token family', () => {
    const { container } = render(<SidebarObjectIcon product="meeting" data-testid="icon" />);
    expect(container.firstChild as HTMLElement).toHaveClass('bg-product-meeting-default', 'text-product-meeting-on');
  });

  it('uses only token classes, no raw palette or hex values', () => {
    const { container } = render(<Example />);
    const classes = Array.from(container.querySelectorAll('*'))
      .map((el) => el.getAttribute('class') ?? '')
      .join(' ');
    expect(classes).not.toMatch(/\b(bg|text|border|ring)-(slate|zinc|gray|neutral|blue|red|green)-\d{2,3}\b/);
    expect(classes).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(classes).not.toMatch(/\b[a-z-]+-\d+\.5\b/);
  });

  it('nav-item variant uses the nav-item type roles and size tokens; default stays unchanged', () => {
    render(
      <SidebarLayout>
        <Sidebar>
          <SidebarNavItem href="#" label="Plain" count={2} />
          <SidebarNavItem variant="nav" href="#" label="Token" count={3} active />
        </Sidebar>
      </SidebarLayout>,
    );
    const plain = screen.getByRole('link', { name: /Plain/ });
    expect(plain).toHaveClass('gap-2', 'px-2', 'text-[14px]');
    expect(screen.getByText('2')).toHaveClass('text-[12px]');
    const token = screen.getByRole('link', { name: /Token/ });
    expect(token).toHaveClass(
      'typography-nav-item',
      'gap-[var(--size-nav-item-gap)]',
      'px-[var(--size-nav-item-padding-x)]',
    );
    expect(token).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('3')).toHaveClass('typography-ui-sm');
  });
});

describe('Sidebar positioning and current', () => {
  it('keeps sticky h-screen by default', () => {
    render(<SidebarLayout><Sidebar /></SidebarLayout>);
    expect(screen.getByRole('navigation')).toHaveClass('sticky', 'top-0', 'h-screen');
  });

  it('fixed docks below the top bar without h-screen', () => {
    render(<SidebarLayout><Sidebar position="fixed" /></SidebarLayout>);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('fixed', 'top-topbar', 'bottom-0', 'left-0');
    expect(nav).not.toHaveClass('h-screen', 'sticky');
  });

  it('static leaves placement to the parent and works without SidebarLayout', () => {
    render(<Sidebar position="static" />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('relative');
    expect(nav).not.toHaveClass('h-screen');
    expect(nav).not.toHaveAttribute('hidden');
  });

  it('SidebarNavItem current location sets aria-current location and implies active', () => {
    render(<SidebarNavItem href="#a" label="Section" current="location" />);
    const link = screen.getByRole('link', { name: 'Section' });
    expect(link).toHaveAttribute('aria-current', 'location');
    expect(link).toHaveAttribute('data-active');
  });
});

describe('Sidebar workspace logo tiles', () => {
  it('trigger logo uses the 24px logo tile tokens with weight 700', () => {
    render(<Example />);
    const logo = screen.getByText('GD');
    expect(logo).toHaveClass('rounded-logo-tile-24', 'text-logo-tile-24', 'font-bold');
    expect(logo.className).not.toContain('rounded-[6px]');
    expect(logo.className).not.toContain('text-micro');
  });

  it('menu item logo uses the 20px logo tile tokens with weight 700', () => {
    render(
      <SidebarProvider defaultCollapsed={false}>
        <SidebarWorkspaceSwitcher
          logo="GD"
          name="Get IT Done"
          workspaces={[{ id: 'a', name: 'Alpha', logo: 'AL' }]}
          activeWorkspaceId="a"
        />
      </SidebarProvider>,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: /Get IT Done/ }), { key: 'Enter' });
    const logo = screen.getByText('AL');
    expect(logo).toHaveClass('rounded-logo-tile-20', 'text-logo-tile-20', 'font-bold');
    expect(logo).not.toHaveClass('font-semibold');
  });
});
