import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Chip } from './chip';

describe('Chip component', () => {
  it('renders the label', () => {
    render(<Chip label="Design" />);
    expect(screen.getByTitle('Design')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('renders children after the label (e.g. a trailing remove button)', () => {
    render(
      <Chip label="Design">
        <button aria-label="Remove">x</button>
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Chip ref={ref} label="Design" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a consumer className with the variant classes', () => {
    render(<Chip label="Design" className="max-w-[200px]" />);
    expect(screen.getByTitle('Design').closest('div')).toHaveClass('max-w-[200px]', 'rounded-full');
  });

  describe('variant', () => {
    it.each([
      ['default', 'bg-background-neutral-subtle', 'text-text-default'],
      ['secondary', 'bg-transparent', 'text-text-subtle'],
      ['info', 'bg-general-info-default', 'text-general-info-on'],
      ['success', 'bg-general-success-hover', 'text-general-success-on'],
      ['destructive', 'bg-general-error-default', 'text-general-error-on'],
      ['warning', 'bg-general-warning-hover', 'text-general-warning-on'],
    ] as const)('applies token classes for the %s variant', (variant, bgClass, textClass) => {
      render(<Chip variant={variant} label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass(bgClass, textClass);
    });

    it('never renders a raw Tailwind palette color class', () => {
      const variants = ['default', 'secondary', 'info', 'success', 'destructive', 'warning'] as const;
      variants.forEach((variant) => {
        const { unmount } = render(<Chip variant={variant} label="Chip" />);
        const chip = screen.getByTitle('Chip').closest('div');
        const rawPaletteClass = /(^|\s)(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/;
        expect(chip?.className).not.toMatch(rawPaletteClass);
        unmount();
      });
    });

    it('uses the regular border-default token for the secondary boundary', () => {
      render(<Chip variant="secondary" label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass('border-border-default');
      expect(chip).not.toHaveClass('border-general-border-default');
    });
  });

  describe('disabled', () => {
    it('sets aria-disabled and data-disabled instead of the HTML disabled attribute', () => {
      render(<Chip disabled label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveAttribute('aria-disabled', 'true');
      expect(chip).toHaveAttribute('data-disabled', 'true');
      expect(chip).toHaveClass('aria-disabled:opacity-disabled', 'aria-disabled:pointer-events-none');
    });

    it('does not set aria-disabled when disabled is not passed', () => {
      render(<Chip label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).not.toHaveAttribute('aria-disabled');
      expect(chip).not.toHaveAttribute('data-disabled');
    });

    it('leaves a nested remove button independently disableable', () => {
      render(
        <Chip disabled label="Design">
          <button aria-label="Remove" disabled>
            x
          </button>
        </Chip>,
      );
      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });
  });

  describe('invalid', () => {
    it('sets aria-invalid and data-invalid', () => {
      render(<Chip invalid label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveAttribute('aria-invalid', 'true');
      expect(chip).toHaveAttribute('data-invalid', 'true');
    });

    it('forces the destructive/error token treatment regardless of variant', () => {
      render(<Chip variant="success" invalid label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass('bg-general-error-default', 'text-general-error-on');
      expect(chip).not.toHaveClass('bg-general-success-default');
    });

    it('announces invalidity in text, since aria-invalid alone is unreliable on a role-less element', () => {
      render(<Chip invalid label="Chip" />);
      expect(screen.getByText('(invalid)', { exact: false })).toBeInTheDocument();
    });

    it('does not announce invalidity when invalid is not set', () => {
      render(<Chip label="Chip" />);
      expect(screen.queryByText('(invalid)', { exact: false })).not.toBeInTheDocument();
    });
  });

  // --- Leading icon slot (Material filter-chip anatomy: a leading glyph, replaced by a checkmark
  // once selected) ---
  describe('icon', () => {
    it('renders a passed icon before the label', () => {
      render(<Chip icon={<svg data-testid="custom-icon" />} label="Chip" />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('does not render an icon by default', () => {
      render(<Chip label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip?.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders a checkmark instead of the passed icon when selected', () => {
      render(<Chip selected icon={<svg data-testid="custom-icon" />} label="Chip" />);
      expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders a checkmark when selected even without a passed icon', () => {
      render(<Chip selected label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip?.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  // --- Interactive "filter chip" mode: only enabled by passing onClick, so a static tag/label
  // Chip is never given an unreachable focus ring (MAT-3 / CHIP-A11Y-03) ---
  describe('interactive (onClick provided)', () => {
    it('is not focusable and carries no button role without onClick', () => {
      render(<Chip selected label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).not.toHaveAttribute('role');
      expect(chip).not.toHaveAttribute('tabindex');
      expect(chip).not.toHaveAttribute('aria-pressed');
    });

    it('exposes role=button, a tab stop, and aria-pressed when onClick is provided', () => {
      const onClick = jest.fn();
      render(<Chip selected onClick={onClick} label="Chip" />);
      const chip = screen.getByRole('button', { name: /Chip/ });
      expect(chip).toHaveAttribute('tabindex', '0');
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    });

    it('fires onClick when activated via mouse, Enter, or Space', async () => {
      const onClick = jest.fn();
      render(<Chip onClick={onClick} label="Chip" />);
      const chip = screen.getByRole('button', { name: 'Chip' });
      await userEvent.click(chip);
      chip.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('does not become interactive when disabled, even with onClick set', () => {
      const onClick = jest.fn();
      render(<Chip disabled onClick={onClick} label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).not.toHaveAttribute('role');
      expect(chip).not.toHaveAttribute('tabindex');
    });

    it('announces selection via aria-pressed rather than duplicating it in text', () => {
      const onClick = jest.fn();
      render(<Chip selected onClick={onClick} label="Chip" />);
      expect(screen.queryByText('(selected)', { exact: false })).not.toBeInTheDocument();
    });

    it('announces selection in text when non-interactive (no ARIA widget role available)', () => {
      render(<Chip selected label="Chip" />);
      expect(screen.getByText('(selected)', { exact: false })).toBeInTheDocument();
    });
  });

  // --- WCAG 2.2 SC 2.5.8 (Target Size Minimum): only an interactive small chip is a real pointer
  // target, so only that combination needs the 24px floor (CHIP-MAT-02 / CHIP-A11Y-06) ---
  describe('target size', () => {
    it('applies the 24px minimum hit area when size=small is interactive (onClick provided)', () => {
      const onClick = jest.fn();
      render(<Chip size="small" onClick={onClick} label="Chip" />);
      const chip = screen.getByRole('button', { name: 'Chip' });
      expect(chip).toHaveClass('min-h-target');
    });

    it('applies the 24px minimum hit area for the default (small) size when interactive', () => {
      const onClick = jest.fn();
      render(<Chip onClick={onClick} label="Chip" />);
      const chip = screen.getByRole('button', { name: 'Chip' });
      expect(chip).toHaveClass('min-h-target');
    });

    it('does not bump a static (non-interactive) small chip, which is a compact tag/label, not a target', () => {
      render(<Chip size="small" label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).not.toHaveClass('min-h-target');
    });

    it('does not bump medium/large interactive chips, which already clear the 24px floor', () => {
      const onClick = jest.fn();
      render(<Chip size="medium" onClick={onClick} label="Chip" />);
      const chip = screen.getByRole('button', { name: 'Chip' });
      expect(chip).not.toHaveClass('min-h-target');
    });
  });

  describe('selected', () => {
    it('sets data-selected and applies the active tone for the variant', () => {
      render(<Chip selected label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveAttribute('data-selected', 'true');
      expect(chip).toHaveClass('bg-background-neutral-default');
    });

    it.each([
      ['info', 'bg-general-info-active'],
      ['success', 'bg-general-success-hover'],
      ['destructive', 'bg-general-error-active'],
      ['warning', 'bg-general-warning-hover'],
    ] as const)('uses the %s selected token', (variant, activeClass) => {
      render(<Chip variant={variant} selected label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass(activeClass);
    });

    it('does not set data-selected when selected is not passed', () => {
      render(<Chip label="Chip" />);
      expect(screen.getByTitle('Chip').closest('div')).not.toHaveAttribute('data-selected');
    });
  });

  describe('focus-visible', () => {
    it('carries the shared focus ring tokens', () => {
      render(<Chip label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass(
        'focus-visible:ring-focus',
        'focus-visible:ring-ring-default',
        'focus-visible:ring-offset-focus',
      );
    });
  });

  describe('outline variant', () => {
    it('is a transparent hairline tag with 6px radius, 12px/500 text and 22px height', () => {
      render(<Chip variant="outline" label="Tag" />);
      const chip = screen.getByTitle('Tag').closest('div');
      expect(chip).toHaveClass('bg-transparent', 'border-hairline', 'rounded-item', 'text-xs', 'font-medium', 'text-foreground', 'h-badge');
      expect(chip).not.toHaveClass('rounded-full', 'font-regular');
    });
  });

  describe('dotLeading', () => {
    it('renders a decorative dot with an inline CSS color', () => {
      const { container } = render(<Chip label="Project" dotLeading dotColor="#2563eb" />);
      const dot = container.querySelector('[data-chip-dot]') as HTMLElement;
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(dot).toHaveStyle({ backgroundColor: '#2563eb' });
    });

    it('accepts a token class as dotColor', () => {
      const { container } = render(<Chip label="Project" dotLeading dotColor="bg-general-info-default" />);
      const dot = container.querySelector('[data-chip-dot]') as HTMLElement;
      expect(dot).toHaveClass('bg-general-info-default');
      expect(dot).not.toHaveAttribute('style');
    });

    it('takes precedence over icon but yields to the selected checkmark', () => {
      const { container, rerender } = render(<Chip label="P" dotLeading icon={<svg data-testid="ic" />} />);
      expect(screen.queryByTestId('ic')).not.toBeInTheDocument();
      expect(container.querySelector('[data-chip-dot]')).toBeInTheDocument();
      rerender(<Chip label="P" dotLeading selected />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('size control (filter chip)', () => {
    it('uses control height, item radius and the extra-small type role', () => {
      render(<Chip size="control" label="Filter" data-testid="chip" />);
      expect(screen.getByTestId('chip')).toHaveClass(
        'h-control-sm',
        'rounded-item',
        'px-2',
        'typography-text-extra-small',
        'bg-muted',
      );
    });

    it('keeps the existing default size unchanged', () => {
      render(<Chip label="Plain" data-testid="chip" />);
      expect(screen.getByTestId('chip')).toHaveClass('text-xs', 'px-2', 'leading-5', 'rounded-full');
    });
  });

  describe('onRemove', () => {
    it('is not rendered by default', () => {
      render(<Chip label="Filter" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a named, keyboard-operable close button that does not bubble', async () => {
      const onRemove = vi.fn();
      const onParent = vi.fn();
      render(
        <div onClick={onParent}>
          <Chip size="control" label="Open" onRemove={onRemove} />
        </div>,
      );
      const btn = screen.getByRole('button', { name: 'Remove Open' });
      btn.focus();
      await userEvent.keyboard('{Enter}');
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onParent).not.toHaveBeenCalled();
    });

    it('disables the close button when the chip is disabled', () => {
      render(<Chip label="Open" disabled onRemove={() => undefined} />);
      expect(screen.getByRole('button', { name: 'Remove Open' })).toBeDisabled();
    });
  });
});

describe('Chip neutral variant', () => {
  it('uses the stronger neutral fill as opt-in while default stays subtle', () => {
    const { rerender } = render(<Chip label="A" variant="neutral" />);
    expect(screen.getByText('A').parentElement).toHaveClass('bg-background-neutral-default');
    rerender(<Chip label="A" />);
    expect(screen.getByText('A').parentElement).toHaveClass('bg-background-neutral-subtle');
  });

  describe('chipStyle', () => {
    it('textOnly has no border, no fill, no dot and a tone colour', () => {
      render(<Chip chipStyle="textOnly" variant="success" label="Own company" dotLeading />);
      const chip = screen.getByText('Own company').parentElement as HTMLElement;
      expect(chip).toHaveClass('border-transparent', 'bg-transparent', 'text-text-success');
      expect(chip.querySelector('[data-chip-dot]')).toBeNull();
    });

    it('textOnly default tone uses the default text colour', () => {
      render(<Chip chipStyle="textOnly" label="Partner" />);
      expect(screen.getByText('Partner').parentElement).toHaveClass('text-text-default');
    });

    it('productDot renders a square dot in the given token colour with a neutral border', () => {
      render(<Chip chipStyle="productDot" dotColor="bg-product-vacancy-default" label="vacancy" />);
      const chip = screen.getByText('vacancy').parentElement as HTMLElement;
      const dot = chip.querySelector('[data-chip-dot]') as HTMLElement;
      expect(dot).toHaveClass('bg-product-vacancy-default', 'rounded-xs');
      expect(chip).toHaveClass('border-hairline', 'text-text-default');
    });

    it('productDot accepts a CSS colour as inline background', () => {
      render(<Chip chipStyle="productDot" dotColor="#e5484d" label="DGTL" />);
      const dot = screen.getByText('DGTL').parentElement?.querySelector('[data-chip-dot]') as HTMLElement;
      expect(dot.style.backgroundColor).not.toBe('');
    });

    it('default style is unchanged', () => {
      render(<Chip label="Plain" />);
      expect(screen.getByText('Plain').parentElement).toHaveClass('border-transparent', 'bg-background-neutral-subtle');
    });

    it('invalid wins over the style', () => {
      render(<Chip chipStyle="textOnly" invalid label="Bad" />);
      expect(screen.getByText('Bad').parentElement).toHaveClass('bg-general-error-default');
    });
  });
});

describe('Chip link mode, tinted, categorical, muted, avatar', () => {
  it('renders an anchor with href and is not a button', () => {
    render(<Chip href="/docs" label="Docs" />);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders the child element with the chip styling and content on asChild', () => {
    render(
      <Chip asChild variant="outline" label="Docs">
        <a href="/x" data-testid="child">
          extra
        </a>
      </Chip>,
    );
    const link = screen.getByTestId('child');
    expect(link.tagName).toBe('A');
    expect(link).toHaveTextContent('Docsextra');
    expect(link.className).toContain('inline-flex');
  });

  it('does not render the remove button in link mode and drops the href when disabled', () => {
    const { rerender } = render(<Chip href="/a" label="A" onRemove={() => undefined} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Chip href="/a" label="A" disabled />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it.each([
    ['info', 'general-info'],
    ['success', 'general-success'],
    ['warning', 'general-warning'],
    ['destructive', 'general-error'],
  ] as const)('tinted %s uses container and on-container tokens', (variant, family) => {
    render(<Chip variant={variant} tinted label={variant} />);
    const chip = screen.getByText(variant).closest('div');
    expect(chip).toHaveClass(`bg-${family}-container`, `text-${family}-on-container`);
  });

  it('renders the categorical border and dot', () => {
    const { container } = render(<Chip category={3} label="Cat" />);
    expect(container.firstChild).toHaveClass('border-chart-3');
    expect(container.querySelector('[data-chip-dot]')).toHaveClass('bg-chart-3');
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)('category %i uses the tinted chart-subtle fill', (n) => {
    const { container } = render(<Chip category={n} label="Cat" />);
    expect(container.firstChild).toHaveClass(`bg-chart-subtle-${n}`, `border-chart-${n}`, 'text-text-default');
    expect(container.firstChild).not.toHaveClass('bg-background-neutral-subtle');
  });

  it('muted variant uses the muted surface', () => {
    const { container } = render(<Chip variant="muted" label="Quiet" />);
    expect(container.firstChild).toHaveClass('bg-muted', 'text-text-muted');
  });

  it('keeps the count after the label', () => {
    const { container } = render(<Chip label="Open" count={4} />);
    expect(container.textContent).toBe('Open4');
  });

  it('keeps the avatar when selected instead of the checkmark', () => {
    const { container } = render(<Chip selected onClick={() => undefined} avatar={<span data-testid="avatar" />} label="Ana" />);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the icon when selected with keepLeadingWhenSelected, default still swaps to the checkmark', () => {
    const { container, rerender } = render(<Chip selected icon={<span data-testid="ic" />} keepLeadingWhenSelected label="X" />);
    expect(screen.getByTestId('ic')).toBeInTheDocument();
    rerender(<Chip selected icon={<span data-testid="ic" />} label="X" />);
    expect(screen.queryByTestId('ic')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('Chip dense size', () => {
  it('is 20px high with tight padding and keeps the 24px floor when operable', () => {
    const { rerender } = render(<Chip label="Tag" size="dense" />);
    expect(screen.getByText('Tag').closest('div')).toHaveClass('h-5', 'px-1');
    expect(screen.getByText('Tag').closest('div')).not.toHaveClass('min-h-target');
    rerender(<Chip label="Tag" size="dense" onClick={() => {}} />);
    expect(screen.getByText('Tag').closest('[role="button"]') ?? screen.getByText('Tag').closest('div')).toHaveClass('min-h-target');
  });

  it('renders the count as a small round pill, also on outlined chips', () => {
    render(<Chip variant="outline" label="Open" count={4} />);
    const pill = screen.getByText('4');
    expect(pill).toHaveClass('rounded-full', 'text-text-muted');
    expect(pill).not.toHaveClass('rounded-item');
  });

  describe('adoption options', () => {
    it('muted keeps the muted text by default and aligns with neutral on request', () => {
      const { rerender } = render(<Chip variant="muted" label="Chip" />);
      expect(screen.getByTitle('Chip').closest('div')).toHaveClass('text-text-muted');
      rerender(<Chip variant="muted" mutedText="default" label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass('text-text-default');
      expect(chip).not.toHaveClass('text-text-muted');
    });

    it('neutral has its own selected fill', () => {
      const { rerender } = render(<Chip variant="neutral" label="Chip" />);
      expect(screen.getByTitle('Chip').closest('div')).toHaveClass('bg-background-neutral-default');
      rerender(<Chip variant="neutral" selected label="Chip" />);
      const chip = screen.getByTitle('Chip').closest('div');
      expect(chip).toHaveClass('bg-background-neutral-hover');
      expect(chip).not.toHaveClass('bg-background-neutral-default');
    });

    it('tinted chips show the count without a grey block', () => {
      const { container, rerender } = render(<Chip variant="info" tinted selected count={3} label="Chip" />);
      const count = container.querySelector('[data-chip-count]');
      expect(count).toHaveClass('bg-transparent', 'text-current');
      expect(count).not.toHaveClass('bg-muted');
      rerender(<Chip variant="info" count={3} label="Chip" />);
      expect(container.querySelector('[data-chip-count]')).toHaveClass('bg-muted', 'text-text-muted');
    });
  });
  describe('chipStyle weighted', () => {
    it('uses the skill fill and on-fill text pair with a leading dot', () => {
      render(<Chip chipStyle="weighted" skill="frontend" label="Frontend" weight="weight 3" />);
      const chip = screen.getByTitle('Frontend').closest('div');
      expect(chip).toHaveClass('bg-data-skill-frontend-default', 'text-data-skill-frontend-on-fill', 'font-medium');
      expect(chip?.querySelector('[data-chip-dot]')).toBeInTheDocument();
    });

    it('shows the weight text only when given', () => {
      const { rerender } = render(<Chip chipStyle="weighted" label="Frontend" />);
      expect(screen.queryByText('weight 3')).not.toBeInTheDocument();
      rerender(<Chip chipStyle="weighted" label="Frontend" weight="weight 3" />);
      expect(screen.getByText('weight 3')).toBeInTheDocument();
    });

    it('falls back to the fallback skill fill', () => {
      render(<Chip chipStyle="weighted" label="Other" />);
      expect(screen.getByTitle('Other').closest('div')).toHaveClass('bg-data-skill-fallback-default', 'text-data-skill-fallback-on-fill');
    });

    it('drops the weighted look when invalid', () => {
      render(<Chip chipStyle="weighted" skill="backend" invalid label="Bad" weight="weight 2" />);
      expect(screen.getByTitle('Bad').closest('div')).not.toHaveClass('bg-data-skill-backend-default');
      expect(screen.queryByText('weight 2')).not.toBeInTheDocument();
    });
  });

  describe('control height and selected check', () => {
    it('medium shares the Button sm control height token', () => {
      render(<Chip size="medium" label="Chip" />);
      expect(screen.getByTitle('Chip').closest('div')).toHaveClass('h-control-sm');
    });

    it.each([
      ['small', 'h-icon-2xs'],
      ['dense', 'h-icon-2xs'],
      ['medium', 'h-icon-xs'],
      ['control', 'h-icon-xs'],
      ['large', 'h-icon-sm'],
    ] as const)('selected check scales with the %s chip via the icon tokens', (size, cls) => {
      render(<Chip size={size} selected label="Chip" />);
      const check = screen.getByTitle('Chip').closest('div')?.querySelector('[data-chip-check]');
      expect(check).toHaveClass(cls);
      expect(check).not.toHaveClass('h-3');
    });

    it('focus ring sits on an offset in the background colour, apart from the selected border', () => {
      render(<Chip selected onClick={() => undefined} label="Chip" />);
      expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-offset-focus', 'focus-visible:ring-offset-background');
    });
  });
});

describe('Chip muted hover (0.18.1)', () => {
  it('hovers with the neutral hover fill (slate-200 step), not muted-strong', () => {
    render(<Chip variant="muted" label="Tag" onClick={() => {}} />);
    const chip = screen.getByRole('button', { name: /Tag/ });
    expect(chip.className).toContain('hover:bg-background-neutral-hover');
    expect(chip.className).not.toContain('hover:bg-muted-strong');
  });
});

describe('Chip in narrow containers', () => {
  it('never wraps, can shrink and truncates the label with a title', () => {
    const { container } = render(<Chip label="Projektbedarf KW 44" />);
    expect(container.firstElementChild).toHaveClass('whitespace-nowrap', 'max-w-full');
    const label = screen.getByText('Projektbedarf KW 44');
    expect(label).toHaveClass('min-w-0', 'truncate');
    expect(label).toHaveAttribute('title', 'Projektbedarf KW 44');
  });

  it.each(['info', 'success', 'warning', 'destructive'] as const)('%s filled: the secondary text inherits the on-fill colour', (variant) => {
    const { container } = render(<Chip label="Label" variant={variant} meta="3+ yrs" />);
    const meta = container.querySelector('[data-chip-meta]');
    expect(meta).toHaveClass('text-current');
    expect(meta).not.toHaveClass('text-text-muted');
  });

  it('neutral chips keep the muted secondary text', () => {
    const { container } = render(<Chip label="Label" meta="3+ yrs" />);
    expect(container.querySelector('[data-chip-meta]')).toHaveClass('text-text-muted');
  });

  it('keeps count, meta and dot from shrinking', () => {
    const { container } = render(<Chip label="In Prüfung" count={3} meta="3+ yrs" dotLeading />);
    expect(container.querySelector('[data-chip-count]')).toHaveClass('shrink-0');
    expect(screen.getByText('3+ yrs')).toHaveClass('shrink-0');
    expect(container.querySelector('[data-chip-dot]')).toHaveClass('shrink-0');
  });
});

describe('Chip disabled click guard (0.28.1)', () => {
  it('never calls onClick while disabled, even when the click is dispatched directly', () => {
    const onClick = vi.fn();
    render(<Chip label="Design" disabled onClick={onClick} />);
    fireEvent.click(screen.getByText('Design'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
