import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';

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
