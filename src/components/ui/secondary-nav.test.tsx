import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { SecondaryNav, SecondaryNavLayout, StorageMeter } from './secondary-nav';

const sections = [
  { id: 'a', label: 'Spaces', items: [{ id: 'all', label: 'All files', count: 12 }, { id: 'mine', label: 'My files' }] },
  { id: 'b', items: [{ id: 'trash', label: 'Trash', href: '#trash' }, { id: 'off', label: 'Archive', disabled: true }] },
];

describe('SecondaryNav', () => {
  it('sizes the item icon wrapper with the 15px nav icon token', () => {
    render(<SecondaryNav aria-label="Files" sections={[{ id: 'a', items: [{ id: 'x', label: 'Inbox', icon: <svg data-testid="ico" /> }] }]} />);
    expect(screen.getByTestId('ico').parentElement).toHaveClass('h-icon-nav', 'w-icon-nav');
  });

  it('renders a named nav with section headers, items and counts', () => {
    render(<SecondaryNav aria-label="Files" sections={sections} />);
    expect(screen.getByRole('navigation', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByText('Spaces')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All files/ })).toHaveTextContent('12');
    expect(screen.getByRole('link', { name: 'Trash' })).toHaveAttribute('href', '#trash');
  });

  it('is uncontrolled with defaultValue and marks the current item', async () => {
    const onValueChange = vi.fn();
    render(<SecondaryNav aria-label="Files" sections={sections} defaultValue="all" onValueChange={onValueChange} />);
    expect(screen.getByRole('button', { name: /All files/ })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: 'My files' }));
    expect(screen.getByRole('button', { name: 'My files' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /All files/ })).not.toHaveAttribute('aria-current');
    expect(onValueChange).toHaveBeenCalledWith('mine');
  });

  it('is controlled with value', async () => {
    render(<SecondaryNav aria-label="Files" sections={sections} value="mine" />);
    await userEvent.click(screen.getByRole('button', { name: /All files/ }));
    expect(screen.getByRole('button', { name: 'My files' })).toHaveAttribute('aria-current', 'page');
  });

  it('activates with the keyboard and skips disabled items', async () => {
    render(<SecondaryNav aria-label="Files" sections={sections} />);
    screen.getByRole('button', { name: 'My files' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'My files' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
  });

  it('uses the nav item height for sm and the control height for md', () => {
    const { rerender } = render(<SecondaryNav aria-label="f" sections={sections} />);
    expect(screen.getByRole('button', { name: 'My files' })).toHaveClass('h-nav-item');
    rerender(<SecondaryNav aria-label="f" sections={sections} size="md" />);
    expect(screen.getByRole('button', { name: 'My files' })).toHaveClass('h-control-sm');
  });

  it('renders a footer slot with a storage meter', () => {
    render(<SecondaryNav aria-label="f" sections={sections} footer={<StorageMeter used={4} total={10} />} />);
    expect(screen.getByRole('progressbar', { name: 'Storage, 40 percent used' })).toHaveAttribute('aria-valuenow', '4');
    expect(screen.getByText('4 of 10 GB used')).toBeInTheDocument();
  });
});

describe('StorageMeter', () => {
  it('flags near full storage', () => {
    render(<StorageMeter used={9.5} total={10} label="Files" />);
    expect(screen.getByText('9.5 of 10 GB used')).toHaveClass('text-text-destructive');
  });
});

describe('SecondaryNav renderLink and collapsed rail', () => {
  it('renders items with href through renderLink and keeps classes, aria-current and selection', async () => {
    const onValueChange = vi.fn();
    render(
      <SecondaryNav
        aria-label="Files"
        sections={sections}
        defaultValue="trash"
        onValueChange={onValueChange}
        renderLink={(item, props) => <a data-router-link="" {...props}>{props.children}</a>}
      />,
    );
    const link = screen.getByRole('link', { name: 'Trash' });
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveAttribute('href', '#trash');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.className).toContain('rounded-item');
    await userEvent.click(link);
    expect(onValueChange).toHaveBeenCalledWith('trash');
  });

  it('collapsed is an icon rail: labels stay accessible, counts and headers are hidden', () => {
    render(
      <SecondaryNav
        aria-label="Files"
        collapsed
        footer={<span>Footer</span>}
        sections={[{ id: 'a', label: 'Spaces', items: [{ id: 'all', label: 'All files', count: 12, icon: <i /> }] }]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Files' });
    expect(nav).toHaveClass('w-sidebar-collapsed');
    expect(screen.queryByText('Spaces')).toBeNull();
    expect(screen.queryByText('12')).toBeNull();
    expect(screen.queryByText('Footer')).toBeNull();
    const button = screen.getByRole('button', { name: 'All files' });
    expect(button).toHaveAttribute('title', 'All files');
  });

  it('shows a second badge after the count and hides it in the collapsed rail', () => {
    const sections = [{ id: 'a', items: [{ id: 'all', label: 'All files', count: 12, badge: <span>Review</span>, icon: <i /> }] }];
    const { rerender } = render(<SecondaryNav aria-label="Files" sections={sections} />);
    const button = screen.getByRole('button', { name: /All files/ });
    expect(button).toHaveTextContent('All files12Review');
    rerender(<SecondaryNav aria-label="Files" collapsed sections={sections} />);
    expect(screen.queryByText('Review')).toBeNull();
  });
});

describe('SecondaryNav horizontal and responsive', () => {
  const rowSections = [
    { id: 'a', label: 'Finance', items: [{ id: 'cockpit', label: 'Cockpit' }, { id: 'accounts', label: 'Accounts' }, { id: 'off', label: 'Archive', disabled: true }] },
    { id: 'b', items: [{ id: 'tx', label: 'Transactions' }, { id: 'settings', label: 'Settings' }] },
  ];
  const scroller = (nav: HTMLElement) => nav.firstElementChild as HTMLElement;
  const metric = (el: HTMLElement, name: string, value: number) => Object.defineProperty(el, name, { configurable: true, value });

  it('renders one scrollable row whose padding keeps the focus ring inside the scroller', () => {
    render(<SecondaryNav aria-label="Finance" orientation="horizontal" sections={rowSections} />);
    const nav = screen.getByRole('navigation', { name: 'Finance' });
    expect(nav).toHaveAttribute('data-orientation', 'horizontal');
    expect(nav).not.toHaveClass('w-inner-column');
    const row = scroller(nav);
    expect(row).toHaveClass('flex-row', 'overflow-x-auto', 'px-4', 'py-2', 'scroll-px-8');
    expect(row.className).not.toMatch(/overflow-hidden|overflow-visible|flex-wrap|flex-col/);
    expect(screen.getByRole('button', { name: 'Cockpit' })).toHaveClass('shrink-0', 'whitespace-nowrap');
  });

  it('keeps the vertical column as the default', () => {
    render(<SecondaryNav aria-label="f" sections={rowSections} />);
    const nav = screen.getByRole('navigation', { name: 'f' });
    expect(nav).toHaveAttribute('data-orientation', 'vertical');
    expect(nav).toHaveClass('w-inner-column');
    expect(scroller(nav)).toHaveClass('flex-col');
    expect(scroller(nav)).not.toHaveClass('overflow-x-auto');
  });

  it('hides the footer in the row and ignores collapsed', () => {
    render(<SecondaryNav aria-label="f" orientation="horizontal" collapsed footer={<span>Footer</span>} sections={rowSections} />);
    expect(screen.queryByText('Footer')).toBeNull();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).not.toHaveAttribute('data-collapsed');
  });

  it('responsive is a row that becomes the column from a container width of 860px', () => {
    render(<SecondaryNav aria-label="f" orientation="responsive" footer={<span>Footer</span>} sections={rowSections} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('w-full', '@area:w-inner-column');
    expect(scroller(nav)).toHaveClass('flex-row', 'overflow-x-auto', '@area:flex-col', '@area:overflow-visible', '@area:p-0');
    expect(screen.getByText('Footer').parentElement).toHaveClass('hidden', '@area:block');
  });

  it('scrolls the current item into view on mount and when it changes, without clipping at the edges', () => {
    const { rerender } = render(<SecondaryNav aria-label="f" orientation="horizontal" value="cockpit" sections={rowSections} />);
    const row = scroller(screen.getByRole('navigation'));
    metric(row, 'scrollWidth', 600);
    metric(row, 'clientWidth', 200);
    const tx = screen.getByRole('button', { name: 'Transactions' });
    metric(tx, 'offsetLeft', 400);
    metric(tx, 'offsetWidth', 100);
    rerender(<SecondaryNav aria-label="f" orientation="horizontal" value="tx" sections={rowSections} />);
    // right edge 500 minus the visible width 200 (+ scroll padding, 0 in jsdom)
    expect(row.scrollLeft).toBe(300);
    const cockpit = screen.getByRole('button', { name: 'Cockpit' });
    metric(cockpit, 'offsetLeft', 0);
    metric(cockpit, 'offsetWidth', 80);
    rerender(<SecondaryNav aria-label="f" orientation="horizontal" value="cockpit" sections={rowSections} />);
    expect(row.scrollLeft).toBe(0);
  });

  it('scrolls the active item into view on mount', () => {
    const proto = HTMLElement.prototype;
    const spies = [
      vi.spyOn(proto, 'scrollWidth', 'get').mockReturnValue(600),
      vi.spyOn(proto, 'clientWidth', 'get').mockReturnValue(200),
      vi.spyOn(proto, 'offsetLeft', 'get').mockReturnValue(450),
      vi.spyOn(proto, 'offsetWidth', 'get').mockReturnValue(100),
    ];
    render(<SecondaryNav aria-label="f" orientation="horizontal" defaultValue="settings" sections={rowSections} />);
    expect(scroller(screen.getByRole('navigation')).scrollLeft).toBe(350);
    spies.forEach((spy) => spy.mockRestore());
  });

  it('shows the edge fades only while content overflows on that side', () => {
    const proto = HTMLElement.prototype;
    const spies = [vi.spyOn(proto, 'scrollWidth', 'get').mockReturnValue(600), vi.spyOn(proto, 'clientWidth', 'get').mockReturnValue(200)];
    render(<SecondaryNav aria-label="f" orientation="horizontal" sections={rowSections} />);
    const row = scroller(screen.getByRole('navigation'));
    expect(row).toHaveAttribute('data-fade-end');
    expect(row).not.toHaveAttribute('data-fade-start');
    expect(row.className).toContain('contrast-more:[mask-image:none]');
    expect(row.className).toContain('prefers-reduced-transparency');
    spies.forEach((spy) => spy.mockRestore());
  });

  it('shows no fade when everything fits', () => {
    render(<SecondaryNav aria-label="f" orientation="horizontal" sections={rowSections} />);
    const row = scroller(screen.getByRole('navigation'));
    expect(row).not.toHaveAttribute('data-fade-start');
    expect(row).not.toHaveAttribute('data-fade-end');
  });

  it('moves focus with arrow keys, Home and End and skips disabled items', async () => {
    render(<SecondaryNav aria-label="f" orientation="horizontal" sections={rowSections} />);
    screen.getByRole('button', { name: 'Cockpit' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Accounts' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Transactions' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Accounts' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Cockpit' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Cockpit' })).toHaveFocus();
  });

  it('scrolls a partly hidden item into view when an arrow key focuses it, without scrolling the page', async () => {
    render(<SecondaryNav aria-label="f" orientation="horizontal" sections={rowSections} />);
    const row = scroller(screen.getByRole('navigation'));
    metric(row, 'scrollWidth', 600);
    metric(row, 'clientWidth', 200);
    const cockpit = screen.getByRole('button', { name: 'Cockpit' });
    const accounts = screen.getByRole('button', { name: 'Accounts' });
    metric(cockpit, 'offsetLeft', 0);
    metric(cockpit, 'offsetWidth', 80);
    // Accounts sticks out of the right edge: left 150, right 250, visible width 200.
    metric(accounts, 'offsetLeft', 150);
    metric(accounts, 'offsetWidth', 100);
    const focus = vi.spyOn(accounts, 'focus');
    cockpit.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(accounts).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(row.scrollLeft).toBe(50);
    // Going back reveals the item at the left edge.
    await userEvent.keyboard('{ArrowLeft}');
    expect(row.scrollLeft).toBe(0);
  });

  it('uses Left and Right in the row of the responsive mode and ignores Up and Down', async () => {
    render(<SecondaryNav aria-label="f" orientation="responsive" sections={rowSections} />);
    screen.getByRole('button', { name: 'Cockpit' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Cockpit' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Accounts' })).toHaveFocus();
  });

  it('uses Up and Down where the responsive nav renders as a column, and ignores Left and Right', async () => {
    render(<SecondaryNav aria-label="f" orientation="responsive" sections={rowSections} />);
    const row = scroller(screen.getByRole('navigation'));
    const real = window.getComputedStyle.bind(window);
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const style = real(el, pseudo);
      return el === row ? ({ ...style, flexDirection: 'column', direction: 'ltr', scrollPaddingLeft: '0px' } as unknown as CSSStyleDeclaration) : style;
    });
    screen.getByRole('button', { name: 'Cockpit' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Cockpit' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Accounts' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Transactions' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Accounts' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    spy.mockRestore();
  });

  it('keeps the vertical column free of arrow key handling', async () => {
    render(<SecondaryNav aria-label="f" sections={rowSections} />);
    screen.getByRole('button', { name: 'Cockpit' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Cockpit' })).toHaveFocus();
  });

  it('works for links through renderLink', async () => {
    const links = [{ id: 'a', items: [{ id: 'one', label: 'One', href: '/one' }, { id: 'two', label: 'Two', href: '/two' }] }];
    render(<SecondaryNav aria-label="f" orientation="responsive" sections={links} renderLink={(item, props) => <a {...props}>{props.children}</a>} />);
    screen.getByRole('link', { name: 'One' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('link', { name: 'Two' })).toHaveFocus();
  });
});

describe('SecondaryNavLayout', () => {
  it('stacks nav above content in a narrow area and puts it in a left column from the @area screen', () => {
    render(
      <SecondaryNavLayout nav={<SecondaryNav aria-label="Settings" orientation="responsive" sections={[{ id: 'a', items: [{ id: 'x', label: 'General' }] }]} />}>
        <p>Content</p>
      </SecondaryNavLayout>,
    );
    const slot = document.querySelector('[data-slot="secondary-nav-slot"]') as HTMLElement;
    expect(slot.parentElement).toHaveClass('flex', 'flex-col', '@area:flex-row');
    expect(slot).toHaveClass('shrink-0', 'border-b', '@area:border-b-0', '@area:border-r');
    expect(screen.getByRole('navigation', { name: 'Settings' }).closest('[data-slot="secondary-nav-slot"]')).toBe(slot);
    expect(document.querySelector('[data-slot="secondary-nav-content"]')).toHaveClass('min-w-0', 'flex-1');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('is the size container the nav measures, unless container is off', () => {
    const { rerender } = render(
      <SecondaryNavLayout data-testid="l" nav={<span>nav</span>}>
        x
      </SecondaryNavLayout>,
    );
    expect(screen.getByTestId('l')).toHaveClass('@container');
    rerender(
      <SecondaryNavLayout data-testid="l" container={false} navClassName="w-sidebar" contentClassName="p-4" nav={<span>nav</span>}>
        x
      </SecondaryNavLayout>,
    );
    expect(screen.getByTestId('l')).not.toHaveClass('@container');
    expect(document.querySelector('[data-slot="secondary-nav-slot"]')).toHaveClass('w-sidebar');
    expect(document.querySelector('[data-slot="secondary-nav-content"]')).toHaveClass('p-4');
  });

  it('fill makes the layout, its row and the content slot take the available height', () => {
    const { rerender } = render(
      <SecondaryNavLayout data-testid="l" nav={<span>nav</span>}>
        x
      </SecondaryNavLayout>,
    );
    const layout = screen.getByTestId('l');
    const row = layout.firstElementChild as HTMLElement;
    const content = document.querySelector('[data-slot="secondary-nav-content"]') as HTMLElement;
    expect(layout).not.toHaveClass('flex-1');
    expect(row).not.toHaveClass('flex-1');
    expect(content).not.toHaveClass('min-h-0');
    rerender(
      <SecondaryNavLayout data-testid="l" fill nav={<span>nav</span>}>
        x
      </SecondaryNavLayout>,
    );
    expect(layout).toHaveClass('flex', 'flex-col', 'h-full', 'min-h-0', 'flex-1');
    expect(row).toHaveClass('h-full', 'min-h-0', 'flex-1');
    expect(content).toHaveClass('min-h-0', 'flex-1', 'min-w-0');
    expect(layout).toHaveAttribute('data-fill', 'true');
  });

  it('fill keeps a consumer className and contentClassName', () => {
    render(
      <SecondaryNavLayout data-testid="l" fill className="bg-muted" contentClassName="overflow-y-auto" nav={<span>nav</span>}>
        x
      </SecondaryNavLayout>,
    );
    expect(screen.getByTestId('l')).toHaveClass('bg-muted', 'flex-1');
    expect(document.querySelector('[data-slot="secondary-nav-content"]')).toHaveClass('overflow-y-auto', 'min-h-0');
  });
});
