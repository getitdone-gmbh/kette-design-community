import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ListItem } from './list-item';

describe('ListItem', () => {
  it('is a plain row without onClick', () => {
    render(<ListItem title="Team members" subtitle="12 Members" trailing="12" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Team members')).toBeInTheDocument();
    expect(screen.getByText('12 Members')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('is a button with keyboard activation when onClick is set', async () => {
    const onClick = vi.fn();
    render(<ListItem title="Team" onClick={onClick} chevron />);
    const button = screen.getByRole('button', { name: /Team/ });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks selected with aria-current and disabled as inert', () => {
    const { rerender } = render(<ListItem title="Team" onClick={() => {}} selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
    rerender(<ListItem title="Team" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders lead and trailing slots', () => {
    render(<ListItem title="t" lead={<svg data-testid="lead" />} trailing={<span data-testid="tr" />} />);
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(screen.getByTestId('tr')).toBeInTheDocument();
  });
});

describe('ListItem link mode', () => {
  it('renders an anchor with href and interactive styles', () => {
    render(<ListItem title="Team" href="/team" target="_blank" rel="noreferrer" />);
    const link = screen.getByRole('link', { name: 'Team' });
    expect(link).toHaveAttribute('href', '/team');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveClass('hover:bg-muted');
  });

  it('marks the current link and drops the href when disabled', () => {
    render(<ListItem title="Team" href="/team" selected disabled />);
    const el = screen.getByText('Team').closest('a') as HTMLElement;
    expect(el).not.toHaveAttribute('href');
    expect(el).toHaveAttribute('aria-disabled', 'true');
    expect(el).toHaveAttribute('aria-current', 'true');
  });

  it('asChild puts the row styles and content on the given link element', () => {
    render(
      <ListItem title="Team" subtitle="12" asChild>
        <a href="/team">x</a>
      </ListItem>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/team');
    expect(link).toHaveClass('hover:bg-muted');
    expect(link).toHaveTextContent('Team');
    expect(link).toHaveTextContent('12');
  });
});

describe('ListItem responsive', () => {
  it('stacks the trailing controls by default of the container query and moves them at the area-2xs screen', () => {
    render(<ListItem responsive title="t" trailing={<span data-testid="tr" />} data-testid="row" />);
    expect(screen.getByTestId('row')).toHaveClass('flex-wrap', '@area-2xs:flex-nowrap');
    expect(screen.getByTestId('tr').parentElement).toHaveClass('w-full', '@area-2xs:w-auto');
  });

  it('is unchanged without responsive', () => {
    render(<ListItem title="t" trailing={<span data-testid="tr" />} data-testid="row" />);
    expect(screen.getByTestId('row')).not.toHaveClass('flex-wrap');
  });
});
