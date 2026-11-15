import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Command,
  CommandEmptyState,
  CommandInput,
  CommandItem,
  CommandItemText,
  CommandKbd,
  CommandKeys,
  CommandDialog,
  CommandList,
  CommandShortcut,
} from './command';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= ResizeObserverStub;
  Element.prototype.scrollIntoView ??= () => {};
});

describe('Command additions', () => {
  it('keeps the plain shortcut text unchanged', () => {
    render(<CommandShortcut>⌘K</CommandShortcut>);
    expect(screen.getByText('⌘K')).toHaveClass('ml-auto', 'text-xs');
  });

  it('shows a trailing shortcut hint in the input', () => {
    render(
      <Command>
        <CommandInput placeholder="Search" shortcut={<CommandKbd>⌘/</CommandKbd>} />
        <CommandList />
      </Command>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('⌘/')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders stacked item text and a key sequence, and selects with the keyboard', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem value="olivia" onSelect={onSelect}>
            <CommandItemText title="Olivia Rhye" description="@olivia" />
            <CommandKeys keys={['⌘K', 'P']} />
          </CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('@olivia')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
    await user.type(screen.getByRole('combobox'), '{Enter}');
    expect(onSelect).toHaveBeenCalled();
  });

  it('renders the empty state with actions', () => {
    render(
      <CommandEmptyState title="No projects found" description="Try again" actions={<button>New project</button>} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No projects found');
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument();
  });
});

describe('CommandInput shrink behaviour', () => {
  it('can shrink next to a hint and ends a long placeholder with an ellipsis by default', () => {
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList />
      </Command>,
    );
    expect(screen.getByPlaceholderText('Search')).toHaveClass('min-w-0', 'text-ellipsis');
  });
});

describe('CommandDialog', () => {
  it('forwards cmdk root props such as shouldFilter to Command', async () => {
    const user = userEvent.setup();
    render(
      <CommandDialog open shouldFilter={false} label="Palette">
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem value="alpha">Alpha</CommandItem>
          <CommandItem value="beta">Beta</CommandItem>
        </CommandList>
      </CommandDialog>,
    );
    await user.type(screen.getByPlaceholderText('Search'), 'zzz');
    // without filtering, both items stay visible even though neither matches
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('centres the close button on the 48px search row', async () => {
    render(
      <CommandDialog open>
        <CommandInput placeholder="Search" />
        <CommandList />
      </CommandDialog>,
    );
    const close = document.querySelector('[data-slot="dialog-close"]');
    expect(close).toHaveClass('top-1');
    expect(close).not.toHaveClass('top-3');
  });
});

describe('CommandInput name and active descendant (round 2)', () => {
  it('is named by its placeholder when the Command has no label', () => {
    render(
      <Command>
        <CommandInput placeholder="Find an action" />
        <CommandList>
          <CommandItem>One</CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Find an action');
  });

  it('points aria-activedescendant at the highlighted item on open', async () => {
    render(
      <Command label="Actions">
        <CommandInput placeholder="Find" />
        <CommandList>
          <CommandItem>One</CommandItem>
          <CommandItem>Two</CommandItem>
        </CommandList>
      </Command>,
    );
    const input = screen.getByRole('combobox');
    await vi.waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id));
    await userEvent.type(input, '{ArrowDown}');
    await vi.waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[1].id));
  });
});

