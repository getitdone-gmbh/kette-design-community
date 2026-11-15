import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Download, Trash2, UserPlus } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ActionBar, ActionBarFilterTags, ActionBarRow, BatchBar, type BatchBarAction } from './action-bar';

const actions = (spies: Record<string, () => void> = {}): BatchBarAction[] => [
  { id: 'assign', label: 'Assign', icon: <UserPlus />, onSelect: spies.assign ?? (() => {}) },
  { id: 'export', label: 'Export', icon: <Download />, onSelect: spies.export ?? (() => {}) },
  { id: 'delete', label: 'Delete', icon: <Trash2 />, destructive: true, onSelect: spies.delete ?? (() => {}) },
];

describe('BatchBar', () => {
  it('is a labelled toolbar announcing the count', () => {
    render(<BatchBar selectedCount={3} onClear={() => {}} actions={actions()} />);
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toHaveClass('bg-background-brand-subtle', 'border-border-brand', 'rounded-surface');
    expect(screen.getByRole('status')).toHaveTextContent('3 selected');
    expect(screen.getByRole('status')).toHaveClass('typography-ui-semibold');
  });

  it('renders a chip slot after the count and nothing without it', () => {
    const { container, rerender } = render(<BatchBar selectedCount={3} onClear={() => {}} actions={actions()} />);
    expect(container.querySelector('[data-batch-chip]')).toBeNull();
    rerender(<BatchBar selectedCount={3} onClear={() => {}} actions={actions()} chip={<span>All 120 matches</span>} />);
    const chip = container.querySelector('[data-batch-chip]') as HTMLElement;
    expect(chip).toHaveTextContent('All 120 matches');
    expect(screen.getByRole('status').nextElementSibling).toBe(chip);
  });

  it('clears from the Clear button and the leading checkbox', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<BatchBar selectedCount={2} onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await user.click(screen.getByRole('checkbox', { name: 'Deselect all' }));
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  it('runs inline actions and styles destructive ones', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<BatchBar selectedCount={3} onClear={() => {}} actions={actions({ delete: onDelete })} />);
    const del = screen.getByRole('button', { name: 'Delete' });
    expect(del).toHaveClass('text-text-destructive-on-subtle');
    await user.click(del);
    expect(onDelete).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });

  it('moves actions beyond maxInline into the More menu (overflow variant)', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<BatchBar selectedCount={3} onClear={() => {}} maxInline={1} actions={actions({ export: onExport })} />);
    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: /Export/ }));
    expect(onExport).toHaveBeenCalled();
  });

  it('opens the More menu with the keyboard', async () => {
    const user = userEvent.setup();
    render(<BatchBar selectedCount={1} onClear={() => {}} actions={[]} moreActions={actions()} />);
    screen.getByRole('button', { name: 'More actions' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('disables an action', () => {
    render(<BatchBar selectedCount={1} onClear={() => {}} actions={[{ id: 'a', label: 'Assign', onSelect: () => {}, disabled: true }]} />);
    expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled();
  });
});

describe('ActionBar parts', () => {
  it('stacks rows with the 8px gap', () => {
    render(
      <ActionBar data-testid="bar">
        <ActionBarRow>tabs</ActionBarRow>
        <ActionBarRow>tools</ActionBarRow>
      </ActionBar>,
    );
    expect(screen.getByTestId('bar')).toHaveClass('flex-col', 'gap-2');
  });

  it('lists removable filter tags and resets', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onReset = vi.fn();
    render(
      <ActionBarFilterTags
        tags={[
          { id: 's', label: 'Status: Client', onRemove },
          { id: 'o', label: 'Owner: Me', onRemove: () => {} },
        ]}
        onReset={onReset}
      />,
    );
    expect(screen.getByRole('list', { name: 'Active filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Status: Client' }));
    expect(onRemove).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('renders nothing without tags', () => {
    const { container } = render(<ActionBarFilterTags tags={[]} onReset={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('BatchBar action popover', () => {
  it('lets an action render its button inside a Popover trigger', async () => {
    render(
      <BatchBar
        selectedCount={2}
        onClear={() => {}}
        actions={[
          {
            id: 'assign',
            label: 'Assign',
            render: (button) => (
              <Popover>
                <PopoverTrigger asChild>{button}</PopoverTrigger>
                <PopoverContent>
                  <input aria-label="Assignee" />
                </PopoverContent>
              </Popover>
            ),
          },
          { id: 'export', label: 'Export', onSelect: () => {} },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Assign' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Assignee' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('keeps plain actions working without onSelect when they only open something', () => {
    render(<BatchBar selectedCount={1} onClear={() => {}} actions={[{ id: 'a', label: 'Open' }]} />);
    expect(screen.getByRole('button', { name: 'Open' })).toBeEnabled();
  });

  // Imports the whole package index, which takes longer than the 5 s default on a loaded CI runner
  it('exports PopoverAnchor from the package index', async () => {
    const index = await import('../../index');
    expect(index.PopoverAnchor).toBeDefined();
    // The first import of the full index is slow on a loaded runner.
  }, 30000);
});

describe('BatchBar href actions (ZERO-575)', () => {
  it('renders a navigating action as a link inline and in the More menu', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <BatchBar
        selectedCount={2}
        onClear={() => {}}
        actions={[{ id: 'open', label: 'Open report', href: '/reports/1', onSelect }]}
        moreActions={[{ id: 'audit', label: 'Audit log', href: '/audit' }, { id: 'archive', label: 'Archive', onSelect: () => {} }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Open report' })).toHaveAttribute('href', '/reports/1');
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    const audit = await screen.findByRole('menuitem', { name: 'Audit log' });
    expect(audit.tagName).toBe('A');
    expect(audit).toHaveAttribute('href', '/audit');
    expect(screen.getByRole('menuitem', { name: 'Archive' }).tagName).toBe('DIV');
  });
});
