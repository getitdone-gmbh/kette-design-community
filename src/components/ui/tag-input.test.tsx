import { vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet';
import { TagInput } from './tag-input';

describe('TagInput', () => {
  it('shows existing tags as chips with remove buttons', () => {
    render(<TagInput defaultValue={['a', 'b']} />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove b' })).toBeInTheDocument();
  });

  it('adds a tag on Enter and clears the draft', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput onValueChange={onValueChange} />);
    await user.type(screen.getByRole('textbox', { name: 'Add tag' }), 'react{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(['react']);
    expect(screen.getByRole('textbox', { name: 'Add tag' })).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Added react');
  });

  it('adds on a delimiter and on blur', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'one,two');
    expect(onValueChange).toHaveBeenLastCalledWith(['one']);
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(['one', 'two']);
  });

  it('splits pasted text and ignores duplicates', () => {
    const onValueChange = vi.fn();
    render(<TagInput defaultValue={['a']} onValueChange={onValueChange} />);
    fireEvent.paste(screen.getByRole('textbox'), { clipboardData: { getData: () => 'a, b\nc' } });
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('Backspace on an empty draft removes the last tag', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput defaultValue={['a', 'b']} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenCalledWith(['a']);
  });

  it('removes a tag with its button', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput defaultValue={['a', 'b']} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove a' }));
    expect(onValueChange).toHaveBeenCalledWith(['b']);
  });

  it('marks invalid tags and keeps them', async () => {
    const user = userEvent.setup();
    render(<TagInput validate={(t) => t.includes('@')} />);
    await user.type(screen.getByRole('textbox'), 'nope{Enter}');
    expect(screen.getByText('nope').closest('[aria-invalid]')).toHaveAttribute('aria-invalid', 'true');
  });

  it('stops at maxTags', async () => {
    const user = userEvent.setup();
    render(<TagInput maxTags={1} />);
    await user.type(screen.getByRole('textbox'), 'a{Enter}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('read only has no input and no remove buttons', () => {
    render(<TagInput defaultValue={['a']} readOnly />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('supports invalid, disabled and form value', () => {
    const { container } = render(<TagInput defaultValue={['a', 'b']} invalid disabled name="tags" />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('input[type=hidden][name=tags]')).toHaveValue('a,b');
  });
});

describe('TagInput suggestions', () => {
  const suggestions = ['react', 'redux', 'vue'];

  it('is a combobox that filters suggestions and moves with the arrow keys using aria-activedescendant', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput suggestions={suggestions} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Add tag' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.type(input, 're');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Suggestions' });
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['react', 'redux']);
    expect(screen.getByRole('status')).toHaveTextContent('2 suggestions available');
    await user.keyboard('{ArrowDown}');
    const first = screen.getByRole('option', { name: 'react' });
    expect(input).toHaveAttribute('aria-activedescendant', first.id);
    expect(first).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}{ArrowUp}{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'redux' }).id);
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(['redux']);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('picks with the mouse, skips chosen tags and closes with Escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput suggestions={suggestions} defaultValue={['vue']} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['react', 'redux']);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    await user.click(screen.getByRole('option', { name: 'redux' }));
    expect(onValueChange).toHaveBeenCalledWith(['vue', 'redux']);
    expect(input).toHaveFocus();
  });

  it('still adds free text with Enter when no option is active', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput suggestions={suggestions} onValueChange={onValueChange} />);
    await user.type(screen.getByRole('combobox'), 'svelte{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(['svelte']);
  });

  it('stays a plain textbox without suggestions', () => {
    render(<TagInput />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-expanded');
  });
});


describe('TagInput categorised suggestions', () => {
  const suggestions = [
    { value: 'react', label: 'React', category: 'Frameworks' },
    { value: 'vue', label: 'Vue', category: 'Frameworks' },
    { value: 'ts', label: 'TypeScript', category: 'Languages' },
    { value: 'misc', label: 'Misc' },
  ];

  it('groups options under labelled groups, ungrouped entries first', async () => {
    render(<TagInput suggestions={suggestions} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}');
    const frameworks = screen.getByRole('group', { name: 'Frameworks' });
    const languages = screen.getByRole('group', { name: 'Languages' });
    expect(within(frameworks).getAllByRole('option').map((o) => o.textContent)).toEqual(['React', 'Vue']);
    expect(within(languages).getAllByRole('option').map((o) => o.textContent)).toEqual(['TypeScript']);
    const all = screen.getAllByRole('option').map((o) => o.textContent);
    expect(all).toEqual(['Misc', 'React', 'Vue', 'TypeScript']);
    expect(screen.getByRole('listbox')).toContainElement(frameworks);
  });

  it('keyboard order follows the visual order and picks the value, the chip shows the label', async () => {
    const onValueChange = vi.fn();
    render(<TagInput suggestions={suggestions} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(['react']);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('filters by label and hides empty groups', async () => {
    render(<TagInput suggestions={suggestions} />);
    await userEvent.type(screen.getByRole('combobox'), 'type');
    expect(screen.queryByRole('group', { name: 'Frameworks' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Languages' })).getByRole('option', { name: 'TypeScript' })).toBeInTheDocument();
  });
});

// R-LIB-15 (L-33): Escape on an open suggestion list closes the list only, the sheet around it stays open.
describe('TagInput Escape inside a sheet (R-LIB-15)', () => {
  const InSheet = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Skills</SheetTitle>
        <SheetDescription>Tags</SheetDescription>
        <TagInput aria-label="Skills" suggestions={['React', 'Redux', 'Remix']} />
      </SheetContent>
    </Sheet>
  );

  it('first Escape closes the list, the second closes the sheet', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<InSheet onOpenChange={onOpenChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('Re');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
