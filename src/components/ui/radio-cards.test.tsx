import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { RadioCard, RadioCardGroup } from './radio-cards';

const setup = (props: Partial<React.ComponentProps<typeof RadioCardGroup>> = {}) =>
  render(
    <RadioCardGroup aria-label="Type" defaultValue="a" {...props}>
      <RadioCard value="a" title="Alpha" description="First" />
      <RadioCard value="b" title="Beta" description="Second" />
      <RadioCard value="c" title="Gamma" disabled />
      <RadioCard value="d" title="Delta" />
    </RadioCardGroup>,
  );

describe('RadioCardGroup', () => {
  it('is a radiogroup of named radios in a 2 column grid by default', () => {
    setup();
    const group = screen.getByRole('radiogroup', { name: 'Type' });
    expect(group).toHaveClass('grid', 'sm:grid-cols-2');
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('columns=1 stacks the cards', () => {
    setup({ columns: 1 });
    expect(screen.getByRole('radiogroup')).not.toHaveClass('sm:grid-cols-2');
  });

  it('selects on click and calls onValueChange', async () => {
    const onValueChange = vi.fn();
    setup({ onValueChange });
    await userEvent.click(screen.getByRole('radio', { name: /Beta/ }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('radio', { name: /Beta/ })).toBeChecked();
  });

  it('moves with arrow keys and skips disabled cards', async () => {
    setup();
    screen.getByRole('radio', { name: /Beta/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /Delta/ })).toHaveFocus();
    expect(screen.getByRole('radio', { name: /Gamma/ })).toBeDisabled();
  });

  it('names each radio by its title and describes it by the description (ZERO-575)', () => {
    setup();
    const alpha = screen.getByRole('radio', { name: 'Alpha' });
    expect(alpha).toHaveAccessibleDescription('First');
    expect(screen.getByRole('radio', { name: 'Delta' })).not.toHaveAttribute('aria-describedby');
  });

  it('lets a consumer name win over the title', () => {
    render(
      <RadioCardGroup aria-label="Type" defaultValue="a">
        <RadioCard value="a" title="Alpha" aria-label="Plan Alpha" />
      </RadioCardGroup>,
    );
    expect(screen.getByRole('radio', { name: 'Plan Alpha' })).not.toHaveAttribute('aria-labelledby');
  });

  it('keeps one tab stop and wraps with the arrow keys like a radio group', async () => {
    setup({ defaultValue: 'd' });
    screen.getByRole('radio', { name: 'Delta' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveFocus();
    const stops = screen.getAllByRole('radio').filter((radio) => radio.getAttribute('tabindex') !== '-1' && !radio.hasAttribute('disabled'));
    expect(stops).toHaveLength(1);
  });
});

describe('RadioCard text wrapping (KETTE-63)', () => {
  it('lets title and description wrap without a consumer className', () => {
    render(
      <RadioCardGroup aria-label="Rate mode" defaultValue="same">
        <RadioCard value="same" title="Same rate for all" description="What the company pays each member. Usual for projects with an intermediary." />
      </RadioCardGroup>,
    );
    const radio = screen.getByRole('radio', { name: 'Same rate for all' });
    expect(radio).toHaveClass('whitespace-normal', 'min-w-0');
    const title = screen.getByText('Same rate for all');
    const description = screen.getByText(/What the company pays/);
    for (const el of [title, description]) expect(el).toHaveClass('min-w-0', '[overflow-wrap:anywhere]');
    expect(title.parentElement).toHaveClass('min-w-0', 'flex-1');
  });
});
