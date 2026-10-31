import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MenuListItem, NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu';

const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 700;
const ROOT_BOTTOM = 40;

const observers: Array<{ callback: () => void; targets: Element[] }> = [];

class ResizeObserverStub {
  entry: { callback: () => void; targets: Element[] };
  constructor(callback: () => void) {
    this.entry = { callback, targets: [] };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.entry.targets = [];
  }
}

const geometry = { rootLeft: 100, panelWidth: 300 };

const mockGeometry = (rootLeft: number, panelWidth: number) => {
  geometry.rootLeft = rootLeft;
  geometry.panelWidth = panelWidth;
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT_HEIGHT);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => geometry.panelWidth);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({ left: geometry.rootLeft, right: geometry.rootLeft + 100, top: 0, bottom: ROOT_BOTTOM, width: 100, height: ROOT_BOTTOM, x: geometry.rootLeft, y: 0, toJSON: () => ({}) }) as DOMRect,
  );
};

const renderMenu = (props: { collisionPadding?: number; defaultValue?: string } = {}) =>
  render(
    <NavigationMenu {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="features">
          <NavigationMenuTrigger>Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul>
              <MenuListItem href="/a" title="A">
                Text
              </MenuListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );

const anchor = () => document.querySelector<HTMLElement>('[data-slot="navigation-menu-viewport-anchor"]') as HTMLElement;
const viewport = () => anchor().firstElementChild as HTMLElement;
const hasViewportTarget = () => observers.some((entry) => entry.targets.some((target) => target.parentElement === anchor()));

describe('NavigationMenu viewport placement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shifts a panel that would pass the right viewport edge back inside with the default margin', () => {
    mockGeometry(900, 600);
    renderMenu({ defaultValue: 'features' });
    // 900 + 600 - (1024 - 16) = 492 px overflow, so left = 900 - 492
    expect(anchor().style.left).toBe('408px');
  });

  it('honours a custom collision padding', () => {
    mockGeometry(900, 600);
    renderMenu({ defaultValue: 'features', collisionPadding: 32 });
    expect(anchor().style.left).toBe('392px');
  });

  it('leaves a panel that fits untouched', () => {
    mockGeometry(100, 300);
    renderMenu({ defaultValue: 'features' });
    expect(anchor().style.left).toBe('100px');
  });

  it('keeps a panel off the left edge', () => {
    mockGeometry(-20, 300);
    renderMenu({ defaultValue: 'features' });
    expect(anchor().style.left).toBe('16px');
  });

  it('places the panel correctly on the first open, not only after a resize', () => {
    mockGeometry(900, 600);
    renderMenu();
    expect(screen.queryByRole('link', { name: /a/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /features/i }));
    expect(viewport()).toBeInTheDocument();
    expect(anchor().style.left).toBe('408px');
    expect(anchor().style.top).toBe(`${ROOT_BOTTOM}px`);
  });

  it('attaches the size observer to the panel once it exists', () => {
    mockGeometry(900, 600);
    renderMenu();
    expect(anchor().firstElementChild).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /features/i }));
    expect(hasViewportTarget()).toBe(true);
  });

  it('repositions when the content width changes', () => {
    mockGeometry(700, 200);
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /features/i }));
    expect(anchor().style.left).toBe('700px');
    geometry.panelWidth = 600;
    act(() => observers.forEach((entry) => entry.targets.length > 0 && entry.callback()));
    expect(anchor().style.left).toBe('408px');
  });

  it('repositions on window resize', () => {
    mockGeometry(100, 300);
    renderMenu({ defaultValue: 'features' });
    geometry.rootLeft = 40;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(anchor().style.left).toBe('40px');
  });

  it('follows the root while the page scrolls', () => {
    mockGeometry(100, 300);
    renderMenu({ defaultValue: 'features' });
    geometry.rootLeft = 60;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(anchor().style.left).toBe('60px');
  });
});

describe('NavigationMenu portal and layer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the open panel in a portal on the dropdown layer, outside the header', () => {
    mockGeometry(100, 300);
    const { container } = renderMenu({ defaultValue: 'features' });
    expect(container.contains(anchor())).toBe(false);
    expect(anchor().parentElement).toBe(document.body);
    expect(anchor().className).toContain('z-dropdown');
    expect(anchor().className).toContain('fixed');
    expect(viewport()).toContainElement(screen.getByRole('link', { name: /a/i }));
  });

  it('keeps the trigger state and the focus proxy in the root', () => {
    mockGeometry(100, 300);
    renderMenu();
    const trigger = screen.getByRole('button', { name: /features/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('NavigationMenu height cap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('caps the available height to the viewport below the root minus the collision padding', () => {
    mockGeometry(100, 300);
    renderMenu({ defaultValue: 'features' });
    // 700 - 40 - 6 (gap) - 16 (padding)
    expect(anchor().style.getPropertyValue('--navigation-menu-available-height')).toBe('638px');
  });

  it('shrinks the cap on a short viewport and makes the panel scroll', () => {
    mockGeometry(100, 300);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(400);
    renderMenu({ defaultValue: 'features' });
    expect(anchor().style.getPropertyValue('--navigation-menu-available-height')).toBe('338px');
    expect(viewport().className).toContain('max-h-[var(--navigation-menu-available-height)]');
    expect(viewport().className).toContain('overflow-y-auto');
  });
});

describe('NavigationMenuTrigger in a top bar action slot', () => {
  beforeEach(() => mockGeometry(100, 300));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a leading icon and gives the label as tooltip with data-topbar-action', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger data-topbar-action="" icon={<svg data-testid="lead" />}>
              Products
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Products' });
    expect(trigger).toHaveAttribute('title', 'Products');
    expect(trigger).toContainElement(screen.getByTestId('lead'));
    expect(trigger.querySelector('[data-chevron]')).not.toBeNull();
    expect(screen.getByTestId('lead').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('adds no title without the marker', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByRole('button', { name: 'Products' })).not.toHaveAttribute('title');
  });
});
