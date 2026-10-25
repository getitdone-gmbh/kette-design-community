import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarImage, AvatarOnlineIndicator, AvatarUpload } from './avatar';

// Radix's `Avatar.Image` only mounts once the underlying `new Image()` reports
// `complete && naturalWidth > 0` (i.e. "loaded") — jsdom's synthetic Image never actually fetches
// over the network, so without this mock every `<AvatarImage>` silently renders `null` forever and
// `<AvatarFallback>` shows instead. Force every image to report as already-loaded so `AvatarImage`
// tests exercise the real render path.
beforeAll(() => {
  Object.defineProperty(global.Image.prototype, 'complete', { get: () => true });
  Object.defineProperty(global.Image.prototype, 'naturalWidth', { get: () => 1 });
  // Radix 1.0.x waits for the image's onload, so fire it right after src is set
  Object.defineProperty(global.Image.prototype, 'src', {
    configurable: true,
    get() {
      return this.getAttribute('src') ?? '';
    },
    set(value: string) {
      this.setAttribute('src', value);
      setTimeout(() => this.onload?.(new Event('load')));
    },
  });
});
describe('Avatar component', () => {
  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Avatar ref={ref}>
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('merges a consumer className with the variant classes', () => {
    render(
      <Avatar className="max-w-[200px]" data-testid="avatar">
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('avatar')).toHaveClass('max-w-[200px]', 'rounded-full');
  });

  describe('size', () => {
    it.each([
      ['2xs', 'h-4', 'w-4'],
      ['xs', 'h-6', 'w-6'],
      ['sm', 'h-8', 'w-8'],
      ['md', 'h-10', 'w-10'],
      ['lg', 'h-12', 'w-12'],
      ['xl', 'h-14', 'w-14'],
      ['2xl', 'h-16', 'w-16'],
    ] as const)('applies token size classes for %s', (size, hClass, wClass) => {
      render(
        <Avatar size={size} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      expect(screen.getByTestId('avatar')).toHaveClass(hClass, wClass);
    });

    it('defaults to md', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      expect(screen.getByTestId('avatar')).toHaveClass('h-10', 'w-10');
    });
  });

  it('never renders a raw Tailwind palette color class', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>,
    );
    const rawPaletteClass =
      /(^|\s)(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;
    expect(screen.getByTestId('avatar').className).not.toMatch(rawPaletteClass);
  });

  describe('non-interactive (no onClick, the default)', () => {
    it('is not focusable and carries no button role', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).not.toHaveAttribute('role');
      expect(avatar).not.toHaveAttribute('tabindex');
    });
  });

  describe('interactive (onClick provided)', () => {
    it('exposes role=button and a tab stop', () => {
      render(
        <Avatar onClick={() => {}} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('role', 'button');
      expect(avatar).toHaveAttribute('tabindex', '0');
    });

    it('fires onClick when activated via mouse, Enter, or Space', async () => {
      const onClick = jest.fn();
      render(
        <Avatar onClick={onClick} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      await userEvent.click(avatar);
      avatar.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(3);
    });

    // Tokens 5.23.0 alias `ring-default` in dark mode (also in the coloured themes), so the interactive Avatar uses the same ring token as Button and Chip.
    it('carries the shared focus-visible ring recipe', () => {
      render(
        <Avatar onClick={() => {}} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass(
        'focus-visible:ring-focus',
        'focus-visible:ring-ring-default',
      );
      expect(avatar.className).not.toMatch(/ring-ring\/30/);
    });

    it('applies a token-driven state-layer overlay on hover/active (MAT-AVATAR-02)', () => {
      render(
        <Avatar onClick={() => {}} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass(
        "after:bg-background-inverse",
        'after:opacity-0',
        'hover:after:opacity-10',
        'active:after:opacity-20',
        'active:brightness-95',
      );
      // The previously-invented, untethered `brightness-90` step is gone.
      expect(avatar.className).not.toMatch(/brightness-90\b/);
    });
  });

  describe('interactive placeholder accessible name (AVATAR-A11Y-02)', () => {
    it('exposes an accessible name via an explicit aria-label when there is no image alt or text child', () => {
      render(
        <Avatar onClick={() => {}} aria-label="Open profile menu">
          <AvatarFallback />
        </Avatar>,
      );
      expect(screen.getByRole('button', { name: /open profile menu/i })).toBeInTheDocument();
    });
  });

  describe('disabled', () => {
    it('does not become interactive even with onClick set', () => {
      render(
        <Avatar disabled onClick={() => {}} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).not.toHaveAttribute('role');
      expect(avatar).not.toHaveAttribute('tabindex');
    });

    it('sets aria-disabled and data-disabled instead of the HTML disabled attribute', () => {
      render(
        <Avatar disabled onClick={() => {}} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('aria-disabled', 'true');
      expect(avatar).toHaveAttribute('data-disabled', 'true');
    });

    it('does not fire onClick when disabled', async () => {
      const onClick = jest.fn();
      render(
        <Avatar disabled onClick={onClick} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      await userEvent.click(screen.getByTestId('avatar'));
      expect(onClick).not.toHaveBeenCalled();
    });

    // AVATAR-MAT-03: disabled must visually dim and block pointer-events regardless of the
    // `interactive` computation — `disabled=true` always forces `interactive` to false, so classes
    // gated behind `interactive: true` (the previous location of these two classes) never applied.
    // These classes now live in the CVA base array (mirroring chip.tsx) so they apply unconditionally.
    it('dims and blocks pointer-events even though disabled forces interactive to false', () => {
      render(
        <Avatar disabled onClick={() => {}} data-testid="avatar">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass(
        'aria-disabled:pointer-events-none',
        'aria-disabled:opacity-disabled',
        'data-[disabled=true]:pointer-events-none',
        'data-[disabled=true]:opacity-disabled',
      );
    });
  });
});

describe('AvatarFallback', () => {
  it('renders passed initials', () => {
    render(
      <Avatar>
        <AvatarFallback>OR</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  // Figma's Placeholder=True, Text=False variant: no children means "no data available", so a
  // generic person glyph is rendered instead of leaving the circle empty.
  it('renders a generic placeholder glyph when given no children', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="fallback" />
      </Avatar>,
    );
    expect(screen.getByTestId('fallback').querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });

  // MAT-AVATAR-01 / AVATAR-A11Y-01: text-text-subtle only computed to ~4.34:1 against
  // bg-background-neutral-default in light mode (below the 4.5:1 AA minimum for 14px/500-weight text).
  // text-text-default is ≥13:1 against the same background in both light and dark mode.
  it('uses the WCAG AA-passing foreground token against the dark-mode-safe muted background', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="fallback">OR</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByTestId('fallback');
    expect(fallback).toHaveClass('bg-background-neutral-default', 'text-text-default');
    expect(fallback.className).not.toMatch(/\btext-foreground-muted\b/);
  });
});

describe('AvatarImage', () => {
  it('applies object-cover and fills the avatar circle', async () => {
    render(
      <Avatar>
        <AvatarImage data-testid="image" src="https://example.com/avatar.png" alt="Lena Hartmann" />
      </Avatar>,
    );
    // Radix sets the loaded status in an effect, so the img mounts after the first render
    expect(await screen.findByTestId('image')).toHaveClass('h-full', 'w-full', 'object-cover');
  });
});

describe('AvatarOnlineIndicator', () => {
  it('renders the success token color and an accessible label', () => {
    render(
      <Avatar>
        <AvatarFallback>CN</AvatarFallback>
        <AvatarOnlineIndicator data-testid="online" />
      </Avatar>,
    );
    const indicator = screen.getByTestId('online');
    expect(indicator).toHaveClass('bg-general-success-default');
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it.each([
    ['xs', 'h-[6px]', 'w-[6px]'],
    ['sm', 'h-2', 'w-2'],
    ['md', 'h-[10px]', 'w-[10px]'],
    ['lg', 'h-3', 'w-3'],
    ['xl', 'h-[14px]', 'w-[14px]'],
    ['2xl', 'h-4', 'w-4'],
  ] as const)('scales to 1/4 of the %s avatar size', (size, hClass, wClass) => {
    render(
      <Avatar size={size}>
        <AvatarFallback>CN</AvatarFallback>
        <AvatarOnlineIndicator size={size} data-testid="online" />
      </Avatar>,
    );
    expect(screen.getByTestId('online')).toHaveClass(hClass, wClass);
  });

  it('cuts out against the adaptive surface token, not a literal white', () => {
    render(
      <Avatar>
        <AvatarFallback>CN</AvatarFallback>
        <AvatarOnlineIndicator data-testid="online" />
      </Avatar>,
    );
    const indicator = screen.getByTestId('online');
    expect(indicator).toHaveClass('border-surface-canvas');
    expect(indicator.className).not.toMatch(/border-white\b/);
  });
});

// AVATAR-A11Y-03: the Avatar root's clip region is an inscribed CIRCLE, but AvatarBadge/
// AvatarOnlineIndicator are positioned against its SQUARE bounding-box corner (`bottom-0
// right-0`) — clipping the root itself (its previous `overflow-hidden`) clipped almost all of the
// badge away. The circular clip must live on an inner wrapper around content only, leaving the
// root (and thus the badge, its sibling) un-clipped.
describe('Avatar corner badge clipping (AVATAR-A11Y-03)', () => {
  it('does not clip the root itself, so the badge sibling is never clipped', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback data-testid="fallback">CN</AvatarFallback>
        <AvatarOnlineIndicator data-testid="online" />
      </Avatar>,
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar.className).not.toMatch(/(^|\s)overflow-hidden\b/);

    const online = screen.getByTestId('online');
    // The badge renders as a direct child of the (un-clipped) root, not nested inside the
    // circularly-clipped content wrapper.
    expect(online.parentElement).toBe(avatar);
  });

  it('still clips AvatarImage/AvatarFallback content via an inner wrapper', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback data-testid="fallback">CN</AvatarFallback>
        <AvatarOnlineIndicator data-testid="online" />
      </Avatar>,
    );
    const fallback = screen.getByTestId('fallback');
    expect(fallback.parentElement).toHaveClass('overflow-hidden', 'rounded-full', 'absolute', 'inset-0');
    expect(fallback.parentElement).not.toBe(screen.getByTestId('avatar'));
  });

  it('routes a directly-composed AvatarBadge (e.g. Verified/Company) the same way', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>CN</AvatarFallback>
        <AvatarBadge data-testid="badge" className="h-4 w-4 bg-general-info-default" />
      </Avatar>,
    );
    const avatar = screen.getByTestId('avatar');
    const badge = screen.getByTestId('badge');
    expect(badge.parentElement).toBe(avatar);
  });
});

describe('AvatarBadge', () => {
  it('positions at the bottom-right corner with a cutout border', () => {
    render(<AvatarBadge data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('absolute', 'bottom-0', 'right-0', 'border-surface-canvas');
  });

  it('forwards a ref to the badge element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<AvatarBadge ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});

describe('Avatar shape', () => {
  it('is round by default', () => {
    render(<Avatar data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('rounded-full');
  });

  it('shape="square" uses a 30% radius on the root, the clip wrapper and the fallback', () => {
    render(
      <Avatar shape="square" data-testid="avatar">
        <AvatarFallback data-testid="fallback">CN</AvatarFallback>
      </Avatar>,
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('rounded-[30%]');
    expect(avatar.className).not.toMatch(/rounded-full/);
    const wrapper = screen.getByTestId('fallback').parentElement as HTMLElement;
    expect(wrapper).toHaveClass('rounded-[30%]', 'overflow-hidden');
    expect(screen.getByTestId('fallback')).toHaveClass('rounded-[inherit]');
  });

  it('draws a hairline border on the clip wrapper', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback data-testid="fallback">CN</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('fallback').parentElement).toHaveClass('border', 'border-hairline');
  });
});

describe('AvatarFallback size roles', () => {
  it('keeps the default initials style when size is omitted', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="f">AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('f')).toHaveClass('text-sm', 'font-medium');
  });

  it('uses the avatar-xs and ui-semibold roles for xs and sm', () => {
    render(
      <>
        <Avatar>
          <AvatarFallback size="xs" data-testid="xs">
            AB
          </AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback size="sm" data-testid="sm">
            AB
          </AvatarFallback>
        </Avatar>
      </>,
    );
    expect(screen.getByTestId('xs')).toHaveClass('typography-avatar-xs');
    expect(screen.getByTestId('xs')).not.toHaveClass('text-sm');
    expect(screen.getByTestId('sm')).toHaveClass('typography-ui-semibold');
  });
});

describe('AvatarGroup', () => {
  it('is a labelled group with the avatar ring and overlap on children', () => {
    render(
      <AvatarGroup aria-label="Team" data-testid="g">
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );
    const group = screen.getByRole('group', { name: 'Team' });
    expect(group.className).toContain('[&>*]:ring-[length:var(--size-avatar-ring)]');
    expect(group.className).toContain('[&>*+*]:-ml-[6px]');
  });

  it('renders a +n overflow avatar with an accessible text', () => {
    render(<AvatarGroup overflowCount={3} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('+3').parentElement).toHaveTextContent('+3 more');
  });
  it('AvatarFallback keeps the neutral default and opts into data colours', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="plain">AB</AvatarFallback>
        <AvatarFallback data-testid="c3" color={3}>
          AB
        </AvatarFallback>
        <AvatarFallback data-testid="p2" color="project-2">
          AB
        </AvatarFallback>
        <AvatarFallback data-testid="brand" color="brand">
          AB
        </AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('plain')).toHaveClass('bg-background-neutral-default', 'text-text-default');
    expect(screen.getByTestId('c3')).toHaveClass('bg-data-avatar-3-default', 'text-data-avatar-3-on');
    expect(screen.getByTestId('p2')).toHaveClass('bg-data-project-2', 'text-data-project-2-on');
    expect(screen.getByTestId('brand')).toHaveClass('bg-background-brand-bold-default');
  });
});

describe('Avatar profile size and upload affordance', () => {
  it('renders the 192px profile size', () => {
    const { container } = render(
      <Avatar size="profile">
        <AvatarFallback>AF</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toHaveClass('h-48', 'w-48');
  });

  it('renders an upload button outside the clipped content and fires onClick', async () => {
    const onClick = vi.fn();
    const { container } = render(
      <Avatar size="profile">
        <AvatarFallback>AF</AvatarFallback>
        <AvatarUpload onClick={onClick} />
      </Avatar>,
    );
    const button = screen.getByRole('button', { name: 'Upload photo' });
    expect(button).toHaveAttribute('type', 'button');
    expect(container.firstChild).toContainElement(button);
    expect(button.parentElement).toBe(container.firstChild);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('lets the label prop win', () => {
    render(
      <Avatar>
        <AvatarUpload uploadLabel="Change picture" />
      </Avatar>,
    );
    expect(screen.getByRole('button', { name: 'Change picture' })).toBeInTheDocument();
  });
});

describe('AvatarFallback profile text size (0.15)', () => {
  it('scales the initials with the display role at the profile size', () => {
    render(
      <Avatar size="profile">
        <AvatarFallback size="profile">AF</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('AF')).toHaveClass('typography-display');
    expect(screen.getByText('AF')).not.toHaveClass('text-sm');
  });
});
