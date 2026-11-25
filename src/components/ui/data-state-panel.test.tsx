import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DataStatePanel, SkeletonBar } from './data-state-panel';

describe('DataStatePanel', () => {
  it('empty is a status with title, description and action', () => {
    render(<DataStatePanel kind="empty" title="Nothing" description="Add one" action={<button>Add</button>} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing');
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('error is an alert with a retry that fires', async () => {
    const onRetry = vi.fn();
    render(<DataStatePanel kind="error" title="Broken" onRetry={onRetry} retryLabel="Retry" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Broken');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('skeleton bars are hidden from assistive tech and stop pulsing under reduced motion', () => {
    const { container } = render(<SkeletonBar />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveClass('motion-reduce:animate-none');
  });
});

describe('DataStatePanel shared body (ZERO-790)', () => {
  it('empty is outlined by default and shares the empty state classes', () => {
    render(<DataStatePanel kind="empty" title="Nothing" description="Add one" icon={<svg data-testid="ic" />} />);
    const root = screen.getByRole('status');
    expect(root).toHaveClass('border-dashed', 'rounded-card', 'justify-center', 'flex-1', 'w-full');
    expect(screen.getByText('Nothing')).toHaveClass('typography-ui-medium');
    expect(screen.getByText('Add one')).toHaveClass('typography-text-extra-small');
    expect(screen.getByTestId('ic').parentElement).toHaveClass('h-icon-md', 'w-icon-md', 'text-icon-subtle');
  });

  it('empty outlined={false} has no frame, error stays unframed by default', () => {
    const { rerender } = render(<DataStatePanel kind="empty" outlined={false} title="Nothing" />);
    expect(screen.getByRole('status')).not.toHaveClass('border-dashed');
    rerender(<DataStatePanel kind="error" title="Broken" />);
    expect(screen.getByRole('alert')).not.toHaveClass('border-border-destructive');
    rerender(<DataStatePanel kind="error" outlined title="Broken" />);
    expect(screen.getByRole('alert')).toHaveClass('border-border-destructive');
  });
});
