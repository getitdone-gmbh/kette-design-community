import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';

// R-LIB-05 (L-20): indeterminate shows a minus glyph, never the check mark.
describe('Checkbox indeterminate glyph (R-LIB-05)', () => {
  const glyphs = (box: HTMLElement) => ({
    check: box.querySelector('svg.lucide-check') as SVGElement | null,
    minus: box.querySelector('svg.lucide-minus') as SVGElement | null,
  });

  it.each(['default', 'sm'] as const)('shows the minus and hides the check when indeterminate (%s)', (size) => {
    render(<Checkbox aria-label="All" size={size} checked="indeterminate" />);
    const box = screen.getByRole('checkbox', { name: 'All' });
    expect(box).toHaveAttribute('aria-checked', 'mixed');
    const { check, minus } = glyphs(box);
    expect(minus).not.toBeNull();
    expect(minus).toHaveClass('group-data-[state=indeterminate]/checkbox:block');
    expect(minus).toHaveClass('hidden');
    expect(check).toHaveClass('group-data-[state=indeterminate]/checkbox:hidden');
    // Same glyph size as the check mark.
    const iconSize = size === 'sm' ? ['h-3', 'w-3'] : ['h-4', 'w-4'];
    expect(minus).toHaveClass(...iconSize);
    expect(check).toHaveClass(...iconSize);
  });

  it('marks the root as the group the glyphs follow', () => {
    render(<Checkbox aria-label="All" checked="indeterminate" />);
    expect(screen.getByRole('checkbox', { name: 'All' })).toHaveClass('group/checkbox');
  });

  it('also works uncontrolled with defaultChecked indeterminate', () => {
    render(<Checkbox aria-label="All" defaultChecked="indeterminate" />);
    const box = screen.getByRole('checkbox', { name: 'All' });
    expect(box).toHaveAttribute('data-state', 'indeterminate');
    expect(glyphs(box).minus).not.toBeNull();
  });
});

describe('comfortable touch target', () => {
  it('Checkbox keeps its box and has no extra hit area by default', () => {
    render(<Checkbox aria-label="Plain" />);
    const box = screen.getByRole('checkbox', { name: 'Plain' });
    expect(box).not.toHaveAttribute('data-comfortable');
    expect(box.className).not.toContain('after:');
  });

  it('Checkbox grows the hit area to the touch-target token with `comfortable`, the box size is unchanged', () => {
    render(<Checkbox aria-label="Touch" comfortable />);
    const box = screen.getByRole('checkbox', { name: 'Touch' });
    expect(box).toHaveAttribute('data-comfortable', 'true');
    expect(box).toHaveClass('h-5', 'w-5', 'after:h-[var(--size-touch-target-lg)]', 'after:w-[var(--size-touch-target-lg)]');
  });

  it('RadioGroupItem grows the hit area with `comfortable`, the radio size is unchanged', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" aria-label="Plain" />
        <RadioGroupItem value="b" aria-label="Touch" comfortable />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: 'Plain' }).className).not.toContain('after:');
    expect(screen.getByRole('radio', { name: 'Touch' })).toHaveClass('h-4', 'w-4', 'after:h-[var(--size-touch-target-lg)]');
  });
});
