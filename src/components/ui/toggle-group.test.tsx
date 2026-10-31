import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { ToggleGroup, ToggleGroupItem } from './toggle-group';

describe('ToggleGroup component', () => {
  it('is controlled when a value prop is supplied: the parent value always wins and flips data-state/aria-checked synchronously without a remount', () => {
    const { rerender } = render(
      <ToggleGroup type="single" value="a">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const itemA = screen.getByRole('radio', { name: 'a' });
    const itemB = screen.getByRole('radio', { name: 'b' });
    expect(itemA).toHaveAttribute('data-state', 'on');
    expect(itemA).toHaveAttribute('aria-checked', 'true');
    expect(itemB).toHaveAttribute('data-state', 'off');
    expect(itemB).toHaveAttribute('aria-checked', 'false');

    // Simulate a server-driven task.status change: parent re-renders with a new value.
    rerender(
      <ToggleGroup type="single" value="b">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    // Same DOM node, no remount: the identical element flips state.
    expect(screen.getByRole('radio', { name: 'a' })).toBe(itemA);
    expect(itemA).toHaveAttribute('data-state', 'off');
    expect(itemA).toHaveAttribute('aria-checked', 'false');
    expect(itemB).toHaveAttribute('data-state', 'on');
    expect(itemB).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onValueChange with the next value but does not flip state on its own while controlled (parent must re-render)', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    render(
      <ToggleGroup type="single" value="a" onValueChange={onValueChange}>
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole('radio', { name: 'b' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    // Still "a" because the parent hasn't re-rendered with the new value yet.
    expect(screen.getByRole('radio', { name: 'a' })).toHaveAttribute('data-state', 'on');
  });

  it('preserves uncontrolled internal-state behavior for consumers that do not pass a value prop', async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const itemB = screen.getByRole('radio', { name: 'b' });
    expect(itemB).toHaveAttribute('data-state', 'off');
    await user.click(itemB);
    expect(itemB).toHaveAttribute('data-state', 'on');
  });

  it('supports a fully controlled parent-owns-the-value loop (e.g. undo/rollback)', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState('a');
      return (
        <>
          <ToggleGroup type="single" value={value} onValueChange={(next) => next && setValue(next)}>
            <ToggleGroupItem value="a" aria-label="a">
              A
            </ToggleGroupItem>
            <ToggleGroupItem value="b" aria-label="b">
              B
            </ToggleGroupItem>
          </ToggleGroup>
          <button type="button" onClick={() => setValue('a')}>
            rollback
          </button>
        </>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole('radio', { name: 'b' }));
    expect(screen.getByRole('radio', { name: 'b' })).toHaveAttribute('data-state', 'on');

    // Conflict-rollback / undo: something external flips the value back.
    await user.click(screen.getByRole('button', { name: 'rollback' }));
    expect(screen.getByRole('radio', { name: 'a' })).toHaveAttribute('data-state', 'on');
    expect(screen.getByRole('radio', { name: 'b' })).toHaveAttribute('data-state', 'off');
  });
});

describe('ToggleGroupItem unreachable state', () => {
  it('marks the item aria-disabled and data-unreachable while keeping it in the roving-tabindex/arrow-key sequence', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b" unreachable>
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const blocked = screen.getByRole('radio', { name: 'b' });
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    expect(blocked).toHaveAttribute('data-unreachable', 'true');
    // Unlike native disabled, it must NOT be removed from the tab sequence / a11y tree.
    expect(blocked).not.toHaveAttribute('disabled');
    expect(blocked).toHaveAttribute('tabindex');
  });

  it('remains focusable via arrow keys but suppresses activation', async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b" unreachable>
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const itemA = screen.getByRole('radio', { name: 'a' });
    const itemB = screen.getByRole('radio', { name: 'b' });

    itemA.focus();
    await user.keyboard('{ArrowRight}');
    expect(itemB).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(itemB).toHaveAttribute('data-state', 'off');

    await user.click(itemB);
    expect(itemB).toHaveAttribute('data-state', 'off');
  });

  it('passes consumer-supplied aria-describedby through untouched', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" aria-label="a" unreachable aria-describedby="blocked-reason">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole('radio', { name: 'a' })).toHaveAttribute('aria-describedby', 'blocked-reason');
  });

  describe('Root className / variant / size', () => {
    it('forwards className to the Root element', () => {
      render(
        <ToggleGroup type="single" className="custom-root" data-testid="root">
          <ToggleGroupItem value="a" aria-label="a">
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByTestId('root')).toHaveClass('custom-root');
    });

    it('shares Root variant and size with items through context', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <ToggleGroupItem value="a" aria-label="a">
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const item = screen.getByRole('radio', { name: 'a' });
      expect(item).toHaveClass('h-8', 'px-2', 'border');
      expect(item).not.toHaveClass('h-9');
    });

    it('lets an item override the group variant and size', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <ToggleGroupItem value="a" aria-label="a" size="lg" variant="default">
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const item = screen.getByRole('radio', { name: 'a' });
      expect(item).toHaveClass('h-10', 'bg-transparent');
      expect(item).not.toHaveClass('h-8');
    });

    it('falls back to default item styling without Root variant/size', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" aria-label="a">
            A
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radio', { name: 'a' })).toHaveClass('h-9', 'px-3');
    });
  });
});

describe('ToggleGroup segmented variant', () => {
  const renderSegmented = () =>
    render(
      <ToggleGroup type="single" variant="segmented" defaultValue="a" data-testid="group">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="b">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

  it('renders a muted track container and a raised on-item', () => {
    renderSegmented();
    expect(screen.getByTestId('group')).toHaveClass('bg-muted', 'p-[3px]', 'rounded-control');
    const on = screen.getByRole('radio', { name: 'a' });
    expect(on).toHaveClass('data-[state=on]:bg-background', 'data-[state=on]:shadow-xs', 'rounded-item');
    expect(on).toHaveAttribute('data-state', 'on');
  });

  it('keeps the default variant (no track) unchanged for existing consumers', () => {
    render(
      <ToggleGroup type="single" data-testid="plain">
        <ToggleGroupItem value="a" aria-label="a">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId('plain').className).not.toMatch(/bg-muted/);
    expect(screen.getByRole('radio', { name: 'a' })).toHaveClass('data-[state=on]:bg-muted');
  });

  it('is operable with the keyboard', async () => {
    renderSegmented();
    screen.getByRole('radio', { name: 'a' }).focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('radio', { name: 'b' })).toHaveAttribute('data-state', 'on');
  });

  // Since 0.23.4 the default-size segmented item is 32px outside zero (38px track), matching the segmented Tabs
  it('default-size segmented item is 32px outside zero', () => {
    render(
      <ToggleGroup type="single" variant="segmented" defaultValue="a" aria-label="View">
        <ToggleGroupItem value="a">Grid</ToggleGroupItem>
        <ToggleGroupItem value="b">List</ToggleGroupItem>
      </ToggleGroup>,
    );
    const item = screen.getByRole('radio', { name: 'Grid' });
    expect(item).toHaveClass('h-8');
    expect(item).not.toHaveClass('h-9');
  });
});

describe('ToggleGroup segmented width (0.28)', () => {
  const Group = ({ fullWidth }: { fullWidth?: boolean }) => (
    <div className="flex flex-col">
      <ToggleGroup type="single" variant="segmented" aria-label="Period" fullWidth={fullWidth}>
        <ToggleGroupItem value="a">Day</ToggleGroupItem>
        <ToggleGroupItem value="b">Week</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  it('fits its content by default, also in a flex-col parent', () => {
    render(<Group />);
    const track = screen.getByRole('radiogroup', { name: 'Period' });
    expect(track).toHaveClass('w-fit');
    expect(track).not.toHaveClass('w-full');
  });

  it('fullWidth stretches the track and shares the width between the items', () => {
    render(<Group fullWidth />);
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toHaveClass('w-full');
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveClass('flex-1');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveClass('flex-1');
  });

  it('leaves the other variants without a width class', () => {
    render(
      <ToggleGroup type="single" aria-label="Plain">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Plain' })).not.toHaveClass('w-fit');
  });
});
