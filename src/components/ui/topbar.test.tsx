import type * as React from 'react';
import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell } from 'lucide-react';

import { AutosaveStatus } from './autosave-status';
import { Button } from './button';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu';
import { DesignSystemProvider } from './design-system-provider';
import { SheetNavLink } from './sheet';
import { ObjectIcon } from './object-icon';
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
} from './topbar';

describe('TopBarHelpButton', () => {
  it('is an icon button named Help by default with a decorative icon', () => {
    render(<TopBarHelpButton />);
    const button = screen.getByRole('button', { name: 'Help' });
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes a label prop and fires onClick', async () => {
    const onClick = vi.fn();
    render(<TopBarHelpButton label="Get help" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Get help' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses the provider locale', () => {
    render(
      <DesignSystemProvider locale="de">
        <TopBarHelpButton />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Hilfe' })).toBeInTheDocument();
  });
});

describe('TopBar', () => {
  it('renders a banner with the inset height by default and a taller guest variant', () => {
    const { rerender } = render(<TopBar>x</TopBar>);
    expect(screen.getByRole('banner')).toHaveClass('h-topbar');
    rerender(<TopBar variant="guest">x</TopBar>);
    expect(screen.getByRole('banner')).toHaveClass('h-14');
  });

  it('places start and end slots', () => {
    render(
      <TopBar>
        <TopBarStart>start</TopBarStart>
        <TopBarEnd>end</TopBarEnd>
      </TopBar>,
    );
    expect(screen.getByText('end')).toHaveClass('ml-auto');
  });
});

// The extra back link of a collapsed trail (below sm only) is not one of the drawn levels.
const drawnLevels = () => screen.getAllByRole('listitem').filter((li) => !li.hasAttribute('data-back-link'));

describe('TopBarBreadcrumb', () => {
  const items = [
    { label: 'vacancy', href: '/v' },
    { label: 'Demands', href: '/d' },
    { label: 'Nordwind Handel', href: '/a' },
  ];

  it('is a labelled navigation with the last item as current page', () => {
    render(<TopBarBreadcrumb items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Nordwind Handel')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'vacancy' })).toHaveAttribute('href', '/v');
  });

  it('shows three levels at most and collapses the middle of longer trails', () => {
    render(<TopBarBreadcrumb items={[...items, { label: 'Tab' }]} />);
    expect(drawnLevels()).toHaveLength(3);
    expect(screen.getByText('vacancy')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Demands')).not.toBeInTheDocument();
    expect(screen.getByText('Hidden levels')).toBeInTheDocument();
  });

  describe('maxLevels', () => {
    const trail = (count: number) => Array.from({ length: count }, (_, i) => ({ label: `Crumb ${i + 1}`, href: `/c${i + 1}` }));
    const texts = () => drawnLevels().map((li) => li.textContent);

    it('keeps two items untouched with maxLevels 2', () => {
      render(<TopBarBreadcrumb items={trail(2)} maxLevels={2} />);
      expect(texts()).toEqual(['Crumb 1', 'Crumb 2']);
    });

    it('keeps first and last of three items with maxLevels 2 and never drops the current page', () => {
      render(<TopBarBreadcrumb items={trail(3)} maxLevels={2} />);
      expect(texts()).toEqual(['Crumb 1', 'Crumb 3']);
      expect(screen.getByText('Crumb 3')).toHaveAttribute('aria-current', 'page');
    });

    it('keeps first and last of five items with maxLevels 2', () => {
      render(<TopBarBreadcrumb items={trail(5)} maxLevels={2} />);
      expect(texts()).toEqual(['Crumb 1', 'Crumb 5']);
      expect(screen.getByText('Crumb 5')).toHaveAttribute('aria-current', 'page');
    });

    it('shows three items fully with maxLevels 3', () => {
      render(<TopBarBreadcrumb items={trail(3)} maxLevels={3} />);
      expect(texts()).toEqual(['Crumb 1', 'Crumb 2', 'Crumb 3']);
    });

    it('collapses only the middle of five items with maxLevels 3', () => {
      render(<TopBarBreadcrumb items={trail(5)} maxLevels={3} />);
      expect(texts()).toEqual(['Crumb 1', 'Hidden levels', 'Crumb 5']);
      expect(screen.getByText('Crumb 5')).toHaveAttribute('aria-current', 'page');
    });

    it('keeps one more tail item when more levels are allowed', () => {
      render(<TopBarBreadcrumb items={trail(6)} maxLevels={4} />);
      expect(texts()).toEqual(['Crumb 1', 'Hidden levels', 'Crumb 5', 'Crumb 6']);
    });
  });

  it('renders the object icon and the context', () => {
    render(<TopBarBreadcrumb items={items} icon={<ObjectIcon app="vacancy" />} context="DGTL, AGILE" />);
    expect(screen.getByText('DGTL, AGILE')).toBeInTheDocument();
  });
});

describe('TimerPill', () => {
  it('is a button named with state and time, and pulses only motion-safe', () => {
    render(<TimerPill time="01:24:37" />);
    const pill = screen.getByRole('button', { name: 'Timer running, 01:24:37' });
    expect(pill).toHaveClass('typography-ui-sm-semibold', 'border-border-brand-subtle', 'bg-background-brand-subtle');
    expect(pill.querySelector('span')).toHaveClass('motion-safe:animate-pulse');
  });

  it('stops the pulse when not running', () => {
    render(<TimerPill time="00:00:00" running={false} />);
    const pill = screen.getByRole('button', { name: 'Timer stopped, 00:00:00' });
    expect(pill.querySelector('span')).not.toHaveClass('motion-safe:animate-pulse');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<TimerPill time="00:01" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('opens an optional details panel and keeps the pill name', async () => {
    render(<TimerPill time="00:01" details={<p>Website relaunch</p>} />);
    const pill = screen.getByRole('button', { name: 'Timer running, 00:01' });
    expect(pill).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Website relaunch')).not.toBeInTheDocument();
    await userEvent.click(pill);
    expect(screen.getByText('Website relaunch')).toBeInTheDocument();
    expect(pill).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no popover semantics without details', () => {
    render(<TimerPill time="00:01" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-expanded');
  });
});

describe('TopBarIconButton', () => {
  it('needs a label and includes the count in the accessible name', () => {
    render(
      <TopBarIconButton label="Notifications" count={5}>
        <Bell />
      </TopBarIconButton>,
    );
    expect(screen.getByRole('button', { name: 'Notifications, 5' })).toBeInTheDocument();
  });
});

describe('TopBarEscapeHint', () => {
  it('shows the hint text and fires onEscape', () => {
    const onEscape = vi.fn();
    render(<TopBarEscapeHint onEscape={onEscape} />);
    expect(screen.getByText('Esc closes Settings')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not listen without a handler', () => {
    render(<TopBarEscapeHint />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByText('Esc closes Settings')).toBeInTheDocument();
  });
});

describe('TopBarNav and menu button', () => {
  it('marks the current item', () => {
    render(
      <TopBarNav
        items={[
          { label: 'Jobs', href: '/jobs', current: true },
          { label: 'Pricing', href: '/pricing' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Jobs' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Pricing' })).not.toHaveAttribute('aria-current');
  });

  it('menu button reflects the open state', () => {
    const { rerender } = render(<TopBarMenuButton />);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
    rerender(<TopBarMenuButton open />);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('AutosaveStatus', () => {
  it('is a polite status with the saved label by default', () => {
    render(<AutosaveStatus />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it.each([
    ['saving', 'Saving'],
    ['dirty', 'Unsaved changes'],
    ['error', 'Save failed'],
    ['offline', 'Offline'],
  ] as const)('labels the %s state', (state, label) => {
    render(<AutosaveStatus state={state} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
    expect(screen.getByRole('status')).toHaveAttribute('data-state', state);
  });

  it('spins the saving icon only motion-safe and accepts a custom label', () => {
    render(<AutosaveStatus state="saving" label="Syncing" />);
    expect(screen.getByRole('status')).toHaveTextContent('Syncing');
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('motion-safe:animate-spin');
  });
});

describe('Guest header parts', () => {
  it('TopBarBrand renders the wordmark and an optional byline', () => {
    const { container, rerender } = render(<TopBarBrand name="workload.zero" />);
    expect(screen.getByText('workload.zero')).toBeInTheDocument();
    expect(container.querySelector('[data-byline]')).toBeNull();
    rerender(<TopBarBrand name="workload.zero" byline="by Get IT Done" />);
    expect(container.querySelector('[data-byline]')).toHaveTextContent('by Get IT Done');
  });

  it('TopBarPreferences renders the language button and the theme toggle', async () => {
    const user = userEvent.setup();
    const onLanguageClick = vi.fn();
    const onThemeToggle = vi.fn();
    render(
      <TopBarPreferences language="English" onLanguageClick={onLanguageClick} theme="light" onThemeToggle={onThemeToggle} />,
    );
    await user.click(screen.getByRole('button', { name: 'Language: English' }));
    await user.click(screen.getByRole('button', { name: 'Switch theme' }));
    expect(onLanguageClick).toHaveBeenCalledTimes(1);
    expect(onThemeToggle).toHaveBeenCalledTimes(1);
  });

  it('renders only the parts that are configured', () => {
    render(<TopBarPreferences language="Deutsch" />);
    expect(screen.getByRole('button', { name: 'Language: Deutsch' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch theme' })).toBeNull();
  });

  it('takes the accessible names from props over the provider text', () => {
    render(<TopBarPreferences onThemeToggle={() => undefined} themeLabel="Darstellung" />);
    expect(screen.getByRole('button', { name: 'Darstellung' })).toBeInTheDocument();
  });
});

describe('TopBar 0.10 additions', () => {
  it('TopBarNav marks anchor sections with aria-current location and supports per-item onClick', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <TopBarNav
        items={[
          { label: 'Home', href: '/', current: true },
          { label: 'Pricing', href: '#pricing', current: 'location', onClick },
          { label: 'About', href: '#about' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    const pricing = screen.getByRole('link', { name: 'Pricing' });
    expect(pricing).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current');
    await userEvent.click(pricing);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('TopBarPreferences renders the language as a link with hreflang', () => {
    render(<TopBarPreferences language="Deutsch" languageHref="/de" languageHrefLang="de" />);
    const link = screen.getByRole('link', { name: 'Language: Deutsch' });
    expect(link).toHaveAttribute('href', '/de');
    expect(link).toHaveAttribute('hreflang', 'de');
  });

  it('TopBarIconButton shows a status dot in the corner with screen reader text', () => {
    render(
      <TopBarIconButton label="Sync" count={2} status="destructive" statusLabel="Offline">
        <Bell />
      </TopBarIconButton>,
    );
    const button = screen.getByRole('button', { name: 'Sync, 2, Offline' });
    expect(button.querySelector('[data-tone="destructive"]')).toHaveClass('absolute', 'bottom-0', 'right-0', 'ring-background');
  });

  it('TopBarIconButton exposes pressed and caps the count', () => {
    const { rerender } = render(<TopBarIconButton label="Alerts" pressed count={120}><Bell /></TopBarIconButton>);
    const button = screen.getByRole('button', { name: 'Alerts, 99+' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('99+');
    rerender(<TopBarIconButton label="Alerts" count={7}><Bell /></TopBarIconButton>);
    expect(screen.getByRole('button', { name: 'Alerts, 7' })).not.toHaveAttribute('aria-pressed');
  });

  it('TopBarIconButton expanded sets aria-expanded and the open surface and never aria-pressed', () => {
    const { rerender } = render(<TopBarIconButton label="Menu" expanded><Bell /></TopBarIconButton>);
    const button = screen.getByRole('button', { name: 'Menu' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveClass('data-[expanded]:bg-muted');
    expect(button).toHaveAttribute('data-expanded');
    expect(button).not.toHaveAttribute('aria-pressed');
    rerender(<TopBarIconButton label="Menu" expanded pressed><Bell /></TopBarIconButton>);
    expect(screen.getByRole('button', { name: 'Menu' })).not.toHaveAttribute('aria-pressed');
    rerender(<TopBarIconButton label="Menu" expanded={false}><Bell /></TopBarIconButton>);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Menu' })).not.toHaveAttribute('data-expanded');
  });

  it('TopBarBrand takes a type size', () => {
    render(<TopBarBrand name="Wordmark" size="lg" />);
    expect(screen.getByText('Wordmark')).toHaveClass('typography-display-sm');
  });

  it('TopBarBrand takes the letter-spacing from the type role of its size', () => {
    const { rerender } = render(<TopBarBrand name="Wordmark" size="lg" />);
    expect(screen.getByText('Wordmark')).toHaveStyle({ letterSpacing: 'var(--typo-display-sm-ls)' });
    rerender(<TopBarBrand name="Wordmark" size="md" />);
    expect(screen.getByText('Wordmark')).toHaveStyle({ letterSpacing: 'var(--typo-title-sm-ls)' });
    rerender(<TopBarBrand name="Wordmark" size="sm" />);
    // typography-ui-semibold already carries its own letter-spacing.
    expect(screen.getByText('Wordmark').style.letterSpacing).toBe('');
  });

  it('TopBarBrand takes the 18 and 24 sizes', () => {
    const { rerender } = render(<TopBarBrand name="Wordmark" size="18" />);
    expect(screen.getByText('Wordmark')).toHaveClass('typography-large');
    rerender(<TopBarBrand name="Wordmark" size="24" />);
    expect(screen.getByText('Wordmark')).toHaveClass('typography-page-title');
  });

  it('TopBarBrand sets capitals and tracking on request only', () => {
    const { rerender } = render(<TopBarBrand name="Wordmark" />);
    expect(screen.getByText('Wordmark')).not.toHaveClass('uppercase', 'tracking-wide');
    rerender(<TopBarBrand name="Wordmark" size="lg" uppercase tracking="wide" />);
    expect(screen.getByText('Wordmark')).toHaveClass('uppercase', 'tracking-wide');
    expect(screen.getByText('Wordmark').style.letterSpacing).toBe('');
  });

  it('TopBarBrand inverse-fixed scopes the dark theme so text stays light in both modes', () => {
    const { container } = render(<TopBarBrand name="Wordmark" byline="by Get IT Done" tone="inverse-fixed" />);
    expect(container.firstChild).toHaveClass('dark');
    expect(screen.getByText('Wordmark')).toHaveClass('text-text-default');
    expect(screen.getByText('by Get IT Done')).toHaveClass('text-text-subtle');
  });

  it('TopBarBrand inverse tone sets wordmark and byline for an inverse surface', () => {
    render(<TopBarBrand name="Wordmark" byline="by Get IT Done" tone="inverse" />);
    expect(screen.getByText('Wordmark')).toHaveClass('text-text-inverse');
    expect(screen.getByText('Wordmark')).not.toHaveClass('text-text-default');
    expect(screen.getByText('by Get IT Done')).toHaveClass('text-text-inverse-subtle');
  });

  it('TopBarMobileMenu opens a drawer with the links and closes on select', async () => {
    const user = userEvent.setup();
    render(<TopBarMobileMenu items={[{ label: 'Pricing', href: '#pricing', current: 'location' }]}>Extra</TopBarMobileMenu>);
    const trigger = screen.getByRole('button', { name: 'Menu' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toHaveAttribute('aria-current', 'location');
    expect(screen.getByText('Extra')).toBeInTheDocument();
    await user.click(link);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('TopBarMobileMenu names trigger, dialog and navigation separately and keeps the narrow drawer', async () => {
    const user = userEvent.setup();
    render(<TopBarMobileMenu items={[{ label: 'Pricing', href: '#p' }]} triggerLabel="Open menu" title="Site menu" navLabel="Main pages" />);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Site menu' });
    expect(screen.getByRole('navigation', { name: 'Main pages' })).toBeInTheDocument();
    expect(dialog.className).toContain('w-sheet-sm');
    expect(dialog.className).not.toContain('w-5/6');
  });

  it('TopBarMobileMenu renders collapsible groups next to flat links and closes on select', async () => {
    const user = userEvent.setup();
    render(
      <TopBarMobileMenu
        items={[
          { label: 'Home', href: '#home' },
          { group: 'Products', items: [{ label: 'Vacancy', href: '#vacancy' }, { label: 'Time', href: '#time' }] },
          { group: 'Company', items: [{ label: 'About', href: '#about', current: 'page' }] },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    const products = screen.getByRole('button', { name: 'Products' });
    expect(products).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Vacancy' })).toBeNull();
    // The group with the current page starts open.
    expect(screen.getByRole('button', { name: 'Company' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    await user.click(products);
    expect(products).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('link', { name: 'Vacancy' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('TopBarMobileMenu indents the items of a non-collapsible group like those of an expanded group', async () => {
    const user = userEvent.setup();
    render(
      <TopBarMobileMenu
        items={[
          { group: 'Flat', collapsible: false, items: [{ label: 'One', href: '#one' }] },
          { group: 'Open', defaultOpen: true, items: [{ label: 'Two', href: '#two' }] },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'One' }).parentElement).toHaveClass('pl-3');
    expect(screen.getByRole('link', { name: 'Two' }).parentElement).toHaveClass('pl-3');
  });

  it('TopBarMobileMenu menu button is a fixed 40x40 with and without preset zero', () => {
    const { unmount } = render(<TopBarMobileMenu items={[{ label: 'Pricing', href: '#p' }]} />);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveClass('h-10', 'w-10');
    expect(screen.getByRole('button', { name: 'Menu' })).not.toHaveClass('h-control-lg');
    unmount();
    render(
      <DesignSystemProvider preset="zero">
        <TopBarMobileMenu items={[{ label: 'Pricing', href: '#p' }]} />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveClass('h-10', 'w-10');
  });

  it('TopBarMobileMenu keeps the footer outside the scrolling list', async () => {
    const user = userEvent.setup();
    render(<TopBarMobileMenu items={[{ label: 'Pricing', href: '#p' }]} footer={<a href="/login">Sign in</a>} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const signIn = screen.getByRole('link', { name: 'Sign in' });
    expect(signIn.closest('nav')).toBeNull();
    expect(signIn.closest('[data-slot="topbar-mobile-menu-footer"]')).toHaveClass('shrink-0');
  });

  it('TopBarMobileMenu shows a visible heading for non-collapsible groups and a hover surface on collapsible triggers', async () => {
    const user = userEvent.setup();
    render(
      <TopBarMobileMenu
        items={[
          { group: 'Products', collapsible: false, items: [{ label: 'Vacancy', href: '#vacancy' }] },
          { group: 'Company', items: [{ label: 'About', href: '#about' }] },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const group = screen.getByRole('group', { name: 'Products' });
    expect(group).toContainElement(screen.getByRole('link', { name: 'Vacancy' }));
    expect(screen.queryByRole('button', { name: 'Products' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Company' })).toHaveClass('hover:bg-muted');
  });

  it('TopBarMobileMenu keeps `label` as the fallback for all three names', async () => {
    const user = userEvent.setup();
    render(<TopBarMobileMenu items={[{ label: 'Pricing', href: '#p' }]} label="Seiten" />);
    await user.click(screen.getByRole('button', { name: 'Seiten' }));
    expect(screen.getByRole('dialog', { name: 'Seiten' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Seiten' })).toBeInTheDocument();
  });

  it('TopBarMobileMenu names its close button "Close menu" / "Menü schließen" and can stay visible on desktop', async () => {
    const user = userEvent.setup();
    const items = [{ label: 'Pricing', href: '#pricing' }];
    const { unmount } = render(<TopBarMobileMenu items={items} alwaysVisible />);
    expect(screen.getByRole('button', { name: 'Menu' })).not.toHaveClass('md:hidden');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    unmount();
    render(
      <DesignSystemProvider locale="de">
        <TopBarMobileMenu items={items} />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Menü' })).toHaveClass('md:hidden');
    await user.click(screen.getByRole('button', { name: 'Menü' }));
    expect(screen.getByRole('button', { name: 'Menü schließen' })).toBeInTheDocument();
  });

  it('TopBarBrand supports the 20px step and tight tracking', () => {
    render(<TopBarBrand name="Brand" size="20" tracking="tight" />);
    const name = screen.getByText('Brand');
    expect(name).toHaveClass('typography-title-sm', 'tracking-tight');
    expect(name.style.letterSpacing).toBe('');
  });
});

describe('TopBarMenuButton focus ring', () => {
  it('uses the shared focus ring by default', () => {
    render(<TopBarMenuButton />);
    expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-ring-default', 'focus-visible:ring-offset-background');
  });

  it('follows the inverse surface with the inverse ring', () => {
    render(<TopBarMenuButton tone="inverse" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-text-inverse', 'focus-visible:ring-offset-background-inverse', 'text-text-inverse');
    expect(button).not.toHaveClass('focus-visible:ring-ring-default');
  });
});

describe('TopBarMobileMenu 0.29 section jumps', () => {
  it('starts on the first link, like a sheet', async () => {
    const user = userEvent.setup();
    render(<TopBarMobileMenu items={[{ label: 'Pricing', href: '#pricing' }, { label: 'Docs', href: '/docs' }]} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveFocus();
  });

  it('closes, then scrolls to and focuses the section of a #hash link', async () => {
    const user = userEvent.setup();
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(
      <>
        <TopBarMobileMenu items={[{ label: 'Pricing', href: '#pricing' }]} />
        <section id="pricing" aria-label="Pricing section">
          Pricing
        </section>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('link', { name: 'Pricing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.getByLabelText('Pricing section')).toHaveFocus());
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it('runs the menu onNavigate (and a link onNavigate first) after the drawer is gone', async () => {
    const user = userEvent.setup();
    const all = vi.fn();
    const own = vi.fn();
    render(
      <>
        <TopBarMobileMenu
          onNavigate={all}
          items={[{ label: 'Pricing', href: '#pricing' }, { label: 'Team', href: '#team', onNavigate: own }]}
        />
        <section id="pricing">Pricing</section>
        <section id="team">Team</section>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('link', { name: 'Pricing' }));
    await waitFor(() => expect(all).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('link', { name: 'Team' }));
    await waitFor(() => expect(own).toHaveBeenCalledTimes(1));
    expect(all).toHaveBeenCalledTimes(1);
  });

  it('keeps the drawer open for a modified click and closes for a route link after the own onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(<TopBarMobileMenu items={[{ label: 'Docs', href: '/docs', onClick }]} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'Docs' }));
    await user.keyboard('{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Docs' }));
    expect(onClick).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('hosts a SheetNavLink in its children', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <TopBarMobileMenu items={[]}>
        <SheetNavLink href="#x" onNavigate={onNavigate}>
          Jump
        </SheetNavLink>
      </TopBarMobileMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('link', { name: 'Jump' }));
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('TopBarBreadcrumb 0.29 narrow widths', () => {
  const trail = [{ label: 'vacancy', href: '/v' }, { label: 'A very long middle crumb name', href: '/m' }, { label: 'Demands' }];

  it('truncates every level with an ellipsis and keeps the full text as tooltip', () => {
    render(<TopBarBreadcrumb items={trail} />);
    const middle = screen.getByRole('link', { name: 'A very long middle crumb name' });
    expect(middle).toHaveClass('truncate', 'min-w-0');
    expect(middle).toHaveAttribute('title', 'A very long middle crumb name');
  });

  it('drops the root below sm with display none (not focusable) and keeps the parent as the back link', () => {
    render(<TopBarBreadcrumb items={trail} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveClass('max-sm:hidden');
    expect(items[1]).not.toHaveClass('max-sm:hidden');
    expect(items[2]).not.toHaveClass('max-sm:hidden');
    expect(screen.getByText('Demands')).toHaveAttribute('aria-current', 'page');
    const back = screen.getByRole('link', { name: 'A very long middle crumb name' });
    expect(back).toHaveAttribute('href', '/m');
    expect(back.querySelector('svg')).toHaveClass('sm:hidden');
    expect(screen.getByRole('link', { name: 'vacancy' }).querySelector('svg')).toBeNull();
  });

  it('offers no back link when the level above has no target', () => {
    render(<TopBarBreadcrumb items={[{ label: 'vacancy', href: '/v' }, { label: 'Plain' }, { label: 'Demands' }]} />);
    expect(screen.getAllByRole('listitem')[1]).toHaveClass('max-sm:hidden');
  });

  it('adds the real parent as an extra back link when a collapsed trail does not draw it', () => {
    const long = Array.from({ length: 5 }, (_, i) => ({ label: `Crumb ${i + 1}`, href: `/c${i + 1}` }));
    render(<TopBarBreadcrumb items={long} maxLevels={3} />);
    const extra = screen.getAllByRole('listitem').find((li) => li.hasAttribute('data-back-link'));
    expect(extra).toHaveClass('sm:hidden');
    expect(extra).toHaveTextContent('Crumb 4');
  });

  it('TopBarEnd collapses a marked action to its icon below sm', () => {
    render(
      <TopBarEnd data-testid="end">
        <Button data-topbar-action="" icon={<Bell />}>
          Ask
        </Button>
      </TopBarEnd>,
    );
    expect(screen.getByTestId('end').className).toContain('max-sm:[&_[data-topbar-action]:has(svg:not([data-chevron]))]:text-[0px]');
    expect(screen.getByRole('button', { name: 'Ask' })).toBeInTheDocument();
  });

  it('reaches a marked NavigationMenuTrigger at any depth and ignores its chevron as the icon', () => {
    render(
      <TopBarEnd data-testid="end">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-topbar-action="" icon={<Bell />}>
                Products
              </NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </TopBarEnd>,
    );
    const end = screen.getByTestId('end').className;
    expect(end).toContain('max-sm:[&_[data-topbar-action]:has(svg:not([data-chevron]))]:text-[0px]');
    expect(end).toContain('[&>[role=status]]:max-w-xs');
    expect(screen.getByRole('button', { name: 'Products' })).toHaveAttribute('title', 'Products');
  });

  it('lets an AutosaveStatus chip shrink with an ellipsis and keeps its full text as tooltip', () => {
    render(<AutosaveStatus state="dirty" />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('min-w-0', 'max-w-full');
    expect(screen.getByText('Unsaved changes')).toHaveClass('min-w-0', 'truncate');
    expect(screen.getByText('Unsaved changes')).toHaveAttribute('title', 'Unsaved changes');
  });

  it('hides the label of an AutosaveStatus by the width of the top bar, not the viewport, and keeps it as the accessible name (UX-030-01)', () => {
    render(
      <TopBarEnd data-testid="end">
        <AutosaveStatus state="dirty" />
      </TopBarEnd>,
    );
    const status = screen.getByRole('status');
    // Container query: the label is drawn whole until the top bar (size container) is narrower than the md container screen.
    expect(screen.getByText('Unsaved changes')).toHaveClass('[@container_topbar_(max-width:447px)]:sr-only');
    // The ceiling under that width only fits the icon.
    expect(screen.getByTestId('end').className).toContain('[@container_topbar_(max-width:447px)]:[&>[role=status]]:max-w-[var(--size-control-lg)]');
    expect(screen.getByTestId('end').className).not.toContain('max-sm:[&>[role=status]');
    expect(status).toHaveTextContent('Unsaved changes');
    expect(status).toHaveAttribute('title', 'Unsaved changes');
    expect(status.querySelector('[data-status-label]')).not.toBeNull();
  });

  it('makes the icon-only chip a button with a 44px touch hit area that opens the status text (UX-030-01)', async () => {
    const user = userEvent.setup();
    render(<AutosaveStatus state="dirty" />);
    const trigger = screen.getByRole('button', { name: 'Unsaved changes' });
    expect(trigger).toHaveClass('hidden', '[@container_topbar_(max-width:447px)]:block');
    expect(trigger.className).toContain('[@media(pointer:coarse)]:h-[var(--size-touch-target-lg)]');
    await user.click(trigger);
    expect(await screen.findByText('Unsaved changes', { selector: 'p span' })).toBeInTheDocument();
  });

  it('offers Retry for error and offline when onRetry is given, in the popover and inline, and announces them as an alert (UX-030-01)', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<AutosaveStatus state="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Save failed');
    // Announced by the alert only: the status stays polite, its label is hidden from assistive technology (UX-030-06).
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status').querySelector('[data-status-label]')).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Save failed' }));
    const retries = await screen.findAllByRole('button', { name: 'Try again' });
    expect(retries.length).toBe(2);
  });

  it('adds no alert and no Retry for saved, saving and dirty', () => {
    render(<AutosaveStatus state="dirty" onRetry={() => undefined} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('uses a custom string label as the tooltip of the chip and none for a node label', () => {
    const { rerender } = render(<AutosaveStatus state="dirty" label="Draft not saved" />);
    expect(screen.getByRole('status')).toHaveAttribute('title', 'Draft not saved');
    rerender(<AutosaveStatus state="dirty" label={<b>Draft</b>} />);
    expect(screen.getByRole('status')).not.toHaveAttribute('title');
  });
});

describe('TopBarEnd action tooltip', () => {
  it('gives a data-topbar-action button its text as title, unless it has one', () => {
    render(
      <TopBarEnd>
        <Button data-topbar-action="" icon={<Bell />}>
          Ask
        </Button>
        <Button data-topbar-action="" title="Own" icon={<Bell />}>
          Other
        </Button>
      </TopBarEnd>,
    );
    expect(screen.getByRole('button', { name: 'Ask' })).toHaveAttribute('title', 'Ask');
    expect(screen.getByRole('button', { name: 'Other' })).toHaveAttribute('title', 'Own');
  });

  it('shows the full text of the current page as tooltip', () => {
    render(<TopBarBreadcrumb items={[{ label: 'vacancy', href: '/v' }, { label: 'Demands and contracts' }]} />);
    expect(screen.getByText('Demands and contracts')).toHaveAttribute('title', 'Demands and contracts');
  });
});
