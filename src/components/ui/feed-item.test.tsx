import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { contrast, loadThemes } from '../../lib/token-contrast';
import { FeedItem, FeedList } from './feed-item';

describe('FeedList', () => {
  it('renders a named list of items', () => {
    render(
      <FeedList aria-label="Versions">
        <FeedItem title="Version 4" time="Today" supporting="Anna Meier" />
        <FeedItem title="Version 3" />
      </FeedList>,
    );
    expect(screen.getByRole('list', { name: 'Versions' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('unread items carry an accessible marker and selected items aria-current', () => {
    render(
      <FeedList aria-label="Versions">
        <FeedItem title="Version 4" unread selected />
      </FeedList>,
    );
    expect(screen.getByRole('img', { name: 'Unread' })).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
  });

  it('onSelect makes the row a keyboard operable button', async () => {
    const onSelect = vi.fn();
    render(
      <FeedList aria-label="Versions">
        <FeedItem title="Version 3" onSelect={onSelect} />
      </FeedList>,
    );
    screen.getByRole('button', { name: /Version 3/ }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalled();
  });

  it('shows loading, empty and error states', () => {
    const { rerender } = render(<FeedList aria-label="Versions" state="loading" />);
    expect(screen.getByRole('status', { name: 'Loading Versions' })).toHaveAttribute('aria-busy', 'true');
    rerender(<FeedList aria-label="Versions" state="empty" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    rerender(<FeedList aria-label="Versions" state="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
  });

  it('accepts custom empty and error panels', () => {
    render(<FeedList aria-label="Versions" state="empty" emptyState={<p>Nothing</p>} />);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
  });

  it('shows an unread count badge instead of the dot, capped at 99+', () => {
    const { rerender } = render(
      <FeedList aria-label="Chats">
        <FeedItem title="Anna" unread unreadCount={3} />
      </FeedList>,
    );
    expect(screen.getByRole('img', { name: '3 unread' })).toHaveTextContent('3');
    expect(screen.queryByRole('img', { name: 'Unread' })).toBeNull();
    rerender(
      <FeedList aria-label="Chats">
        <FeedItem title="Anna" unreadCount={120} />
      </FeedList>,
    );
    expect(screen.getByRole('img', { name: '120 unread' })).toHaveTextContent('99+');
  });

  it('truncates the preview with a title and keeps the full text for screen readers', () => {
    render(
      <FeedList aria-label="Chats">
        <FeedItem title="Anna" supporting="A very long preview of the last message" truncateSupporting />
      </FeedList>,
    );
    const preview = screen.getByText('A very long preview of the last message');
    expect(preview).toHaveClass('truncate');
    expect(preview).toHaveAttribute('title', 'A very long preview of the last message');
  });

  it('muted state exposes an icon and screen reader text', () => {
    render(
      <FeedList aria-label="Chats">
        <FeedItem title="Anna" muted time="10:24" />
      </FeedList>,
    );
    expect(screen.getByText('Muted')).toHaveClass('sr-only');
  });
});

describe('FeedItem selected contrast (0.15)', () => {
  it('draws the selected state with the selected fill and an inset border-focus ring', () => {
    render(
      <ul>
        <FeedItem title="Version 4" selected onSelect={() => {}} />
        <FeedItem title="Version 3" onSelect={() => {}} />
      </ul>,
    );
    const selected = screen.getByRole('button', { name: /Version 4/ });
    expect(selected).toHaveClass('bg-background-selected-default', 'ring-2', 'ring-inset', 'ring-border-focus');
    expect(screen.getByRole('button', { name: /Version 3/ })).not.toHaveClass('ring-2');
  });

  const surfaces = ['sidebar-background', 'background-muted', 'background'] as const;
  it.each(loadThemes().flatMap((t) => [[t.name, 'light', t.light] as const, [t.name, 'dark', t.dark] as const]))(
    '%s %s: the selected ring is at least 3:1 against sidebar, muted and page surfaces',
    (_name, _mode, tokens) => {
      surfaces.forEach((surface) => {
        expect(contrast(tokens['border-focus'], tokens[surface])).toBeGreaterThanOrEqual(3);
      });
    },
  );
});

describe('FeedItem hover visibility (0.17)', () => {
  it('uses the muted-strong hover fill instead of the muted fill that equals the sidebar surface', () => {
    render(<FeedItem title="Version 3" onSelect={() => {}} />);
    const row = screen.getByRole('button', { name: /Version 3/ });
    expect(row).toHaveClass('hover:bg-muted-strong');
    expect(row).not.toHaveClass('hover:bg-muted');
  });

  const surfaces = ['sidebar-background', 'utility-muted', 'background'] as const;
  it.each(loadThemes().flatMap((t) => [[t.name, 'light', t.light] as const, [t.name, 'dark', t.dark] as const]))(
    '%s %s: the hover fill differs from sidebar, muted and page surfaces by at least 1.2',
    (_name, _mode, tokens) => {
      surfaces.forEach((surface) => {
        expect(contrast(tokens['utility-muted-strong'], tokens[surface])).toBeGreaterThanOrEqual(1.2);
      });
    },
  );
});

describe('FeedList list reset (0.17)', () => {
  it('removes the browser list padding, margin and marker', () => {
    render(<FeedList aria-label="Versions" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('m-0', 'p-0', 'list-none');
  });
});
