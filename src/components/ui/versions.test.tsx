import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DesignSystemProvider } from './design-system-provider';
import { Versions } from './versions';

const items = [
  { id: 'v3', version: 3, current: true, author: 'Ada', date: '2026-10-01T10:00:00Z', note: 'Added terms' },
  { id: 'v2', version: 2, author: 'Bob', date: '2026-09-01T10:00:00Z' },
];

describe('Versions', () => {
  it('lists versions, marks the current one and falls back for a missing note', () => {
    render(<Versions items={items} />);
    expect(screen.getByRole('list', { name: 'Versions' })).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('by Ada')).toBeInTheDocument();
    expect(screen.getByText('No change note')).toBeInTheDocument();
  });

  it('offers restore only on older versions', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Versions items={items} onRestore={onRestore} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Restore version 2' }));
    expect(onRestore).toHaveBeenCalledWith(items[1]);
  });

  it('shows a busy restore button', () => {
    render(<Versions items={items} onRestore={() => undefined} restoringId="v2" />);
    const button = screen.getByRole('button', { name: 'Restore version 2' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Restoring');
  });

  it('covers empty, loading and error states', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<Versions items={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('No versions yet');
    rerender(<Versions items={items} state="loading" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Versions items={items} state="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
  });

  const labels = {
    title: 'Version history',
    current: 'Live',
    restore: 'Roll back',
    restoring: 'Rolling back',
    emptyTitle: 'Nothing saved',
    emptyDescription: 'Saved versions show up here.',
    errorTitle: 'Versions failed to load',
    errorDescription: 'Check your connection.',
    retry: 'Retry now',
  };

  it('uses the labels prop for the list, badge and restore texts', () => {
    render(<Versions items={items} onRestore={() => undefined} restoringId="v2" labels={labels} />);
    expect(screen.getByRole('list', { name: 'Version history' })).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore version 2' })).toHaveTextContent('Rolling back');
  });

  it('uses the labels prop for the function texts', () => {
    render(<Versions items={items} onRestore={() => undefined} labels={{ version: (n) => `Fassung ${n}`, by: (name) => `durch ${name}`, restoreAria: (n) => `Fassung ${n} laden`, noNote: 'Ohne Notiz' }} />);
    expect(screen.getByText('Fassung 3')).toBeInTheDocument();
    expect(screen.getByText('durch Ada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fassung 2 laden' })).toBeInTheDocument();
    expect(screen.getByText('Ohne Notiz')).toBeInTheDocument();
  });

  it('shows empty and error titles, descriptions and the retry action from labels', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<Versions items={[]} labels={labels} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing saved');
    expect(screen.getByRole('status')).toHaveTextContent('Saved versions show up here.');
    rerender(<Versions items={[]} state="error" onRetry={onRetry} labels={labels} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Versions failed to load');
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection.');
    await user.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('defaults the retry action to Try again', () => {
    render(<Versions items={[]} state="error" onRetry={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('prefers prop over provider over English', () => {
    render(
      <DesignSystemProvider locale="de">
        <Versions items={items} labels={{ current: 'Live' }} />
      </DesignSystemProvider>,
    );
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('von Ada')).toBeInTheDocument();
  });

  it('formats dates with formatDate when given', () => {
    render(<Versions items={items} formatDate={(d) => `Y${d.getUTCFullYear()}`} />);
    expect(screen.getAllByText(/^Y2026$/)).toHaveLength(2);
  });

  it('skips an invalid date instead of crashing', () => {
    render(<Versions items={[{ id: 'x', version: 1, date: 'nope' }]} />);
    expect(screen.getByText('Version 1')).toBeInTheDocument();
  });
});
