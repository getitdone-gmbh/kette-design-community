import { screen, waitFor } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';

// jsdom has no ResizeObserver / pointer-capture / scrollIntoView, all of which Radix's Popper-based
// primitives (DropdownMenu is built on it, like Select/Tooltip/Popover) touch while positioning.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const renderMenu = () =>
  render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Profile
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Billing</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

describe('DropdownMenu component', () => {
  it('is closed by default', () => {
    renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on trigger click and shows its items', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Profile/ })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('menu');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  // --- token usage / no raw palette ---
  it('renders the panel with token-styled classes, no raw palette values', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass(
      'bg-popover',
      'text-popover-foreground',
      'border-hairline',
      'shadow-popover',
      'rounded-popover',
    );
    expect(menu.className).not.toMatch(/\bbg-white\b/);
    expect(menu.className).not.toMatch(/\bbg-black\b/);
  });

  it('never renders the broken (non-token) bg-accent / opacity-50 classes', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const item = screen.getByRole('menuitem', { name: /Profile/ });
    expect(item.className).not.toMatch(/(^|\s)bg-accent(\s|$)/);
    expect(item.className).not.toMatch(/(^|\s)text-accent-foreground(\s|$)/);
    expect(item.className).not.toMatch(/opacity-50\b/);
  });

  // --- hover / keyboard highlight (Radix data-highlighted) ---
  describe('highlight (hover + focus-visible)', () => {
    it('carries the highlighted-state token classes for keyboard/pointer highlight', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const item = await screen.findByRole('menuitem', { name: /Profile/ });
      expect(item).toHaveClass(
        'data-[highlighted]:bg-muted',
        'rounded-item',
        'gap-[10px]',
      );
      // Highlight is a plain surface change: the legacy inset ring is gone.
      expect(item.className).not.toMatch(/data-\[highlighted\]:ring/);
    });

    it('highlights the first item via keyboard arrow navigation', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      await screen.findByRole('menu');
      await userEvent.keyboard('{ArrowDown}');
      const item = screen.getByRole('menuitem', { name: /Profile/ });
      expect(item).toHaveAttribute('data-highlighted');
    });
  });

  // --- disabled ---
  describe('disabled item', () => {
    it('sets data-disabled and the token opacity/pointer-events classes', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const item = await screen.findByRole('menuitem', { name: 'Billing' });
      expect(item).toHaveAttribute('data-disabled');
      expect(item).toHaveClass('data-[disabled]:opacity-disabled', 'data-[disabled]:pointer-events-none');
    });

    it('is skipped by keyboard navigation', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      await screen.findByRole('menu');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      const profile = screen.getByRole('menuitem', { name: /Profile/ });
      const billing = screen.getByRole('menuitem', { name: 'Billing' });
      expect(billing).not.toHaveAttribute('data-highlighted');
      expect(profile).toHaveAttribute('data-highlighted');
    });
  });

  // --- selection ---
  it('fires onSelect when an item is activated', async () => {
    const onSelect = jest.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Profile' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  // --- checkbox / radio items ---
  describe('DropdownMenuCheckboxItem', () => {
    it('reflects the checked state via role=menuitemcheckbox', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>Show toolbar</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const item = await screen.findByRole('menuitemcheckbox', { name: 'Show toolbar' });
      expect(item).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('DropdownMenuRadioItem', () => {
    it('reflects the selected radio value via role=menuitemradio', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="bottom">
              <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByRole('menuitemradio', { name: 'Bottom' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('menuitemradio', { name: 'Top' })).toHaveAttribute('aria-checked', 'false');
    });
  });

  // --- shortcut (no double-dimming when the parent item is disabled) ---
  it('renders the shortcut with the dedicated muted token instead of opacity-disabled', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const shortcut = await screen.findByText('⌘P');
    expect(shortcut).toHaveClass('text-muted-foreground');
    expect(shortcut.className).not.toMatch(/opacity-disabled/);
  });

  // --- reduced motion (prefers-reduced-motion) ---
  it('carries a motion-reduce fallback so open/close is instant, not animated', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass('motion-reduce:animate-none', 'motion-reduce:transition-none');
  });

  // --- label (MAT-1: hierarchy via muted color only, weight 400 — matches SelectLabel) ---
  describe('DropdownMenuLabel', () => {
    it('renders with the muted token foreground color', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByText('My Account')).toHaveClass('text-muted-foreground');
    });

    it('never carries a bold weight class (org rule: weight 400 only, hierarchy via size/color)', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const label = await screen.findByText('My Account');
      expect(label.className).not.toMatch(/font-semibold|font-bold|font-medium/);
    });

    // --- DROPDOWNMENU-A11Y-03: id/aria-labelledby wiring to a sibling group (WCAG 1.3.1) ---
    it('self-assigns a stable id via useId() when no id prop is given', async () => {
      renderMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const label = await screen.findByText('My Account');
      expect(label.id).toBeTruthy();
    });

    it('lets an explicit id override the generated one', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel id="explicit-label-id">My Account</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByText('My Account')).toHaveAttribute('id', 'explicit-label-id');
    });
  });

  describe('DropdownMenuGroup + DropdownMenuLabel pairing (DROPDOWNMENU-A11Y-03)', () => {
    it('exposes an accessible group name via aria-labelledby pointing at the label id', async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel id="account-label">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup aria-labelledby="account-label">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      expect(await screen.findByRole('group', { name: 'My Account' })).toBeInTheDocument();
    });

    it('exposes an accessible name on a radio group the same way', async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel id="panel-position-label">Panel position</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value="bottom" aria-labelledby="panel-position-label">
              <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      expect(await screen.findByRole('group', { name: 'Panel position' })).toBeInTheDocument();
    });
  });
});
