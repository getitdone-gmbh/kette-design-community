import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ButtonGroup, ButtonGroupItem } from './button-group';

describe('ButtonGroup', () => {
  it('is a named group of buttons with the shared frame', () => {
    render(
      <ButtonGroup aria-label="View">
        <ButtonGroupItem>Day</ButtonGroupItem>
        <ButtonGroupItem>Week</ButtonGroupItem>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'View' });
    expect(group).toHaveClass('rounded-control', 'border-input', 'overflow-hidden', 'shadow-elevation-surface');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('type', 'button');
  });

  it('segment: control height, label role, dividers except the last, hover state', () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem>One</ButtonGroupItem>
        <ButtonGroupItem>Two</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'One' })).toHaveClass(
      'h-control-md',
      'typography-label',
      'border-r',
      'last:border-r-0',
      'hover:bg-muted',
      'px-4',
    );
  });

  it('current segment is pressed and muted', () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem current>On</ButtonGroupItem>
        <ButtonGroupItem current={false}>Off</ButtonGroupItem>
        <ButtonGroupItem>Plain</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'On' })).toHaveClass('data-[current]:bg-muted');
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Plain' })).not.toHaveAttribute('aria-pressed');
  });

  it('icon only is square and needs an aria-label, leading icon is decorative, dot variant', () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem aria-label="Add" icon={<svg data-testid="plus" />} />
        <ButtonGroupItem icon={<svg data-testid="lead" />}>Filter</ButtonGroupItem>
        <ButtonGroupItem dotLeading>Live</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass('w-control-md');
    expect(screen.getByRole('button', { name: 'Add' })).not.toHaveClass('px-4');
    expect(screen.getByTestId('lead').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Live' }).querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('disabled segment cannot be clicked', async () => {
    const onClick = vi.fn();
    render(
      <ButtonGroup>
        <ButtonGroupItem disabled onClick={onClick}>
          Off
        </ButtonGroupItem>
      </ButtonGroup>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('tab order follows segments with an inset focus ring', async () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem>A</ButtonGroupItem>
        <ButtonGroupItem>B</ButtonGroupItem>
      </ButtonGroup>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'A' })).toHaveClass('focus-visible:ring-inset', 'focus-visible:ring-focus');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus();
  });
});

describe('ButtonGroupItem aria-disabled gating (0.28.1)', () => {
  it('stays hoverable, calls onGatedClick only and does not bubble', async () => {
    const onClick = vi.fn();
    const onGatedClick = vi.fn();
    const onParentClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test wrapper
      <div onClick={onParentClick}>
        <ButtonGroup aria-label="View">
          <ButtonGroupItem aria-disabled="true" onClick={onClick} onGatedClick={onGatedClick}>
            Board
          </ButtonGroupItem>
        </ButtonGroup>
      </div>,
    );
    const item = screen.getByRole('button', { name: 'Board' });
    expect(item.className).not.toMatch(/aria-disabled:pointer-events-none/);
    await userEvent.click(item);
    expect(onGatedClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('still acts when enabled', async () => {
    const onClick = vi.fn();
    render(
      <ButtonGroup aria-label="View">
        <ButtonGroupItem onClick={onClick}>Board</ButtonGroupItem>
      </ButtonGroup>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Board' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
