import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

// The components measure with bounding boxes (relative to the scroller), so the tests place an element by its left edge.
const rectAt = (left: number) => ({ left, right: left, top: 0, bottom: 0, width: 0, height: 0, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;
// A scrolled row moves its items to the left on screen, so the box follows the scroll position of the row.
const rowOf = (el: HTMLElement) => (el.closest('[role="tablist"]') ?? el.closest('nav')?.firstElementChild) as HTMLElement;
const at = (el: HTMLElement, left: number) => Object.defineProperty(el, 'getBoundingClientRect', { configurable: true, value: () => rectAt(left - rowOf(el).scrollLeft) });

const renderTabs = (variant?: 'segmented' | 'line' | 'segment') =>
  render(
    <Tabs defaultValue="a">
      <TabsList variant={variant} aria-label="Sections">
        <TabsTrigger value="a">Account</TabsTrigger>
        <TabsTrigger value="b">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>,
  );

describe('Tabs', () => {
  it('sizes vertical trigger icons with the 15px nav icon token', () => {
    render(
      <Tabs defaultValue="a" orientation="vertical">
        <TabsList variant="vertical" aria-label="Sections">
          <TabsTrigger value="a">Account</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveClass('[&>svg]:h-icon-nav', '[&>svg]:w-icon-nav');
  });

  it('defaults to the segmented track with a raised active chip', () => {
    renderTabs();
    expect(screen.getByRole('tablist')).toHaveClass('bg-muted', 'p-[3px]', 'rounded-control', 'inline-flex');
    const active = screen.getByRole('tab', { name: 'Account' });
    expect(active).toHaveClass(
      'rounded-item',
      'text-muted-foreground',
      'hover:text-foreground',
      'data-[state=active]:bg-background',
      'data-[state=active]:text-foreground',
      'data-[state=active]:[--tab-elevation:theme(boxShadow.xs)]',
    );
  });

  // Since 0.23.3 the segmented track is 38px outside zero (32px tab plus 3px padding), like the segmented ToggleGroup
  it('segmented outside zero: auto-height track with 32px tabs', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('h-auto', 'p-[3px]');
    expect(list).not.toHaveClass('h-10');
    const tab = screen.getByRole('tab', { name: 'Account' });
    expect(tab).toHaveClass('h-8', 'py-0');
    expect(tab).not.toHaveClass('py-[6px]');
  });

  it('line variant: transparent track with a hairline baseline and a 2px active bar', () => {
    renderTabs('line');
    const list = screen.getByRole('tablist');
    // The hairline is an inset shadow (a border would be cut off by the scroll container), coloured by the hairline token variable.
    expect(list.className).toContain('shadow-[inset_0_-1px_0_0_rgb(var(--colors-utility-hairline)');
    expect(list).toHaveClass('bg-transparent');
    expect(list).not.toHaveClass('border-b');
    expect(list.className).not.toMatch(/(^|\s)bg-muted(\s|$)/);
    const tab = screen.getByRole('tab', { name: 'Account' });
    expect(tab).toHaveClass('border-b-2', 'border-transparent', 'data-[state=active]:border-foreground');
    expect(tab.className).not.toMatch(/data-\[state=active\]:shadow-xs/);
  });

  it('line variant stays one row and scrolls sideways at narrow widths instead of wrapping (RA-LIB-04)', () => {
    renderTabs('line');
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('flex-nowrap', 'overflow-x-auto', 'max-w-full');
    expect(list).not.toHaveClass('flex-wrap');
    expect(list.className).toContain('[scrollbar-width:none]');
    // Tabs keep their width in the scrolling row, and the focus ring is drawn inside so the scroll container cannot cut it.
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveClass('shrink-0', 'focus-visible:ring-inset', 'focus-visible:ring-offset-0');
  });

  describe('line variant keeps the active tab in view', () => {
    const metric = (el: HTMLElement, name: 'scrollWidth' | 'clientWidth' | 'offsetWidth', value: number) => Object.defineProperty(el, name, { configurable: true, value });
    const media = (reduce: boolean) =>
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({ matches: reduce && query.includes('prefers-reduced-motion'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null }) as MediaQueryList);
    const measured = () => {
      const view = render(
        <Tabs defaultValue="a">
          <TabsList variant="line" aria-label="Sections">
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger value="b">Password</TabsTrigger>
            <TabsTrigger value="c">Security</TabsTrigger>
          </TabsList>
        </Tabs>,
      );
      const list = screen.getByRole('tablist');
      metric(list, 'scrollWidth', 1000);
      metric(list, 'clientWidth', 200);
      at(screen.getByRole('tab', { name: 'Password' }), 450);
      metric(screen.getByRole('tab', { name: 'Password' }), 'offsetWidth', 100);
      const scrollTo = vi.fn();
      Object.defineProperty(list, 'scrollTo', { configurable: true, value: scrollTo });
      return { ...view, list, scrollTo };
    };

    it('centres the new active tab with a glide and never calls scrollIntoView', async () => {
      const spy = media(false);
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const { scrollTo } = measured();
      await act(async () => {
        await userEvent.click(screen.getByRole('tab', { name: 'Password' }));
      });
      expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: 'smooth' });
      expect(scrollIntoView).not.toHaveBeenCalled();
      delete (Element.prototype as Partial<Element>).scrollIntoView;
      spy.mockRestore();
    });

    it('jumps when the user prefers reduced motion', async () => {
      const spy = media(true);
      const { list, scrollTo } = measured();
      await act(async () => {
        await userEvent.click(screen.getByRole('tab', { name: 'Password' }));
      });
      expect(scrollTo).not.toHaveBeenCalled();
      expect(list.scrollLeft).toBe(400);
      spy.mockRestore();
    });

    it('does nothing for the other variants', async () => {
      render(
        <Tabs defaultValue="a">
          <TabsList variant="segment" aria-label="Sections">
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger value="b">Password</TabsTrigger>
            <TabsTrigger value="c">Security</TabsTrigger>
          </TabsList>
        </Tabs>,
      );
      const list = screen.getByRole('tablist');
      metric(list, 'scrollWidth', 1000);
      metric(list, 'clientWidth', 200);
      const scrollTo = vi.fn();
      Object.defineProperty(list, 'scrollTo', { configurable: true, value: scrollTo });
      await act(async () => {
        await userEvent.click(screen.getByRole('tab', { name: 'Password' }));
      });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('keeps arrow key navigation and forwards the list ref', async () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Tabs defaultValue="a">
          <TabsList variant="line" aria-label="Sections" ref={ref}>
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger value="b">Password</TabsTrigger>
          </TabsList>
        </Tabs>,
      );
      expect(ref.current).toBe(screen.getByRole('tablist'));
      screen.getByRole('tab', { name: 'Account' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Password' })).toHaveFocus();
      await userEvent.keyboard('{Home}');
      expect(screen.getByRole('tab', { name: 'Account' })).toHaveFocus();
    });
  });

  it('uses the shared focus recipe on triggers', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveClass('focus-visible:ring-focus', 'focus-visible:ring-ring-default');
  });

  it('is keyboard operable (arrow keys move focus, Enter/Space activates after focus)', async () => {
    renderTabs();
    const a = screen.getByRole('tab', { name: 'Account' });
    a.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel B')).toBeInTheDocument();
  });

  it('renders a count slot after the label, including zero', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" count={3}>
            Open
          </TabsTrigger>
          <TabsTrigger value="b" count={0}>
            Done
          </TabsTrigger>
          <TabsTrigger value="c">None</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const open = screen.getByRole('tab', { name: /Open/ });
    expect(open).toHaveTextContent('Open3');
    expect(screen.getByText('3')).toHaveClass('text-micro', 'tabular-nums', 'text-text-subtle-on-muted');
    expect(screen.getByRole('tab', { name: /Done/ })).toHaveTextContent('Done0');
    expect(screen.getByRole('tab', { name: 'None' })).toHaveTextContent(/^None$/);
  });
  it('renders a destructive count tone that stays destructive on the active tab', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="vertical">
          <TabsTrigger value="a" count="3 selected" countTone="destructive">
            Frontend
          </TabsTrigger>
          <TabsTrigger value="b" count={2}>
            Backend
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByText('3 selected')).toHaveClass('text-text-destructive-on-subtle');
    expect(screen.getByText('2')).not.toHaveClass('text-text-destructive-on-subtle');
  });

  it('segment variant: 2px padded track, control-height triggers, tab type role, elevation-surface active chip', () => {
    renderTabs('segment');
    expect(screen.getByRole('tablist')).toHaveClass('bg-muted', 'p-micro', 'gap-micro', 'rounded-control', 'h-auto');
    const tab = screen.getByRole('tab', { name: 'Account' });
    expect(tab).toHaveClass(
      'h-control-sm',
      'typography-tab',
      'rounded-item',
      'data-[state=active]:bg-background',
      'data-[state=active]:[--tab-elevation:var(--elevation-surface,0_0_transparent)]',
    );
    expect(tab).not.toHaveClass('py-[6px]');
  });

  it('segment variant: count is plain text in the kpi-label-strong role and stays subtle when active', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="segment">
          <TabsTrigger value="a" count={7}>
            Open
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const count = screen.getByText('7');
    expect(count).toHaveClass('typography-kpi-label-strong', 'tabular-nums', 'text-text-subtle-on-muted');
    expect(count.className).not.toMatch(/group-data-\[state=active\]:text-muted-foreground/);
  });

  it('segment variant is keyboard operable', async () => {
    renderTabs('segment');
    screen.getByRole('tab', { name: 'Account' }).focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute('aria-selected', 'true');
  });
  describe('segment with seven tabs (Figma Horizontal tabs Type=Segment, Tab 5..7)', () => {
    const tabs: Array<[string, number | undefined]> = [
      ['Mine', 7],
      ['Active', 4],
      ['In review', 1],
      ['Expired', 1],
      ['Performance', undefined],
      ['All workspaces', 38],
      ['Archived', 12],
    ];
    const renderSeven = () =>
      render(
        <Tabs defaultValue="Mine">
          <TabsList variant="segment" aria-label="Views">
            {tabs.map(([label, count]) => (
              <TabsTrigger key={label} value={label} count={count}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(([label]) => (
            <TabsContent key={label} value={label}>{`Panel ${label}`}</TabsContent>
          ))}
        </Tabs>,
      );

    it('renders all seven triggers with counts and no hard limit', () => {
      renderSeven();
      expect(screen.getAllByRole('tab')).toHaveLength(7);
      expect(screen.getByRole('tab', { name: /All workspaces/ })).toHaveTextContent('All workspaces38');
      expect(screen.getByRole('tab', { name: 'Performance' })).toHaveTextContent(/^Performance$/);
    });

    it('triggers never shrink or wrap so the list can scroll instead of squashing labels', () => {
      renderSeven();
      screen.getAllByRole('tab').forEach((tab) => expect(tab).toHaveClass('shrink-0', 'whitespace-nowrap'));
    });

    it('arrow keys reach the last tab and Home/End wrap the roving focus', async () => {
      renderSeven();
      screen.getByRole('tab', { name: /Mine/ }).focus();
      await userEvent.keyboard('{End}');
      expect(screen.getByRole('tab', { name: /Archived/ })).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /Mine/ })).toHaveFocus();
    });
  });

  describe('vertical orientation', () => {
    const renderVertical = () =>
      render(
        <Tabs defaultValue="a" orientation="vertical">
          <TabsList variant="vertical" aria-label="Settings">
            <TabsTrigger value="a">My details</TabsTrigger>
            <TabsTrigger value="b" count={2}>
              Notifications
            </TabsTrigger>
            <TabsTrigger value="c">API</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Panel A</TabsContent>
          <TabsContent value="b">Panel B</TabsContent>
        </Tabs>,
      );

    it('exposes aria-orientation and stacks full-width triggers', () => {
      renderVertical();
      const list = screen.getByRole('tablist');
      expect(list).toHaveAttribute('aria-orientation', 'vertical');
      expect(list).toHaveClass('flex-col', 'gap-1');
      expect(screen.getByRole('tab', { name: 'My details' })).toHaveClass('w-full', 'justify-start', 'h-8', 'typography-tab');
    });

    it('moves focus with ArrowDown/ArrowUp, not left/right', async () => {
      renderVertical();
      screen.getByRole('tab', { name: 'My details' }).focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('tab', { name: /Notifications/ })).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      expect(screen.getByRole('tab', { name: 'My details' })).toHaveFocus();
    });

    it('pushes the count to the row end', () => {
      renderVertical();
      expect(screen.getByText('2')).toHaveClass('ml-auto', 'tabular-nums');
    });
  });

  it('makes the line list positioned and full width by default, with w-auto as the opt-out (TABS-0300-01)', () => {
    const { rerender } = render(
      <Tabs defaultValue="a">
        <TabsList variant="line" aria-label="Sections">
          <TabsTrigger value="a">One</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toHaveClass('relative', 'w-full');
    rerender(
      <Tabs defaultValue="a">
        <TabsList variant="line" aria-label="Sections" className="w-auto">
          <TabsTrigger value="a">One</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toHaveClass('w-auto');
    expect(screen.getByRole('tablist')).not.toHaveClass('w-full');
  });

  it('scrolls the first and the last tab fully to the end of the row, clear of the fade (DR-0301-01)', async () => {
    const view = render(
      <Tabs defaultValue="a">
        <TabsList variant="line" aria-label="Sections">
          <TabsTrigger value="a">Account</TabsTrigger>
          <TabsTrigger value="b">Password</TabsTrigger>
          <TabsTrigger value="c">Security</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 330 });
    Object.defineProperty(list, 'clientWidth', { configurable: true, value: 280 });
    at(screen.getByRole('tab', { name: 'Security' }), 250);
    Object.defineProperty(screen.getByRole('tab', { name: 'Security' }), 'offsetWidth', { configurable: true, value: 80 });
    await act(async () => {
      await userEvent.click(screen.getByRole('tab', { name: 'Security' }));
    });
    // The centre would be 10 short of the end, which leaves the tab under the fade.
    expect(list.scrollLeft).toBe(50);
    view.unmount();
  });
});
