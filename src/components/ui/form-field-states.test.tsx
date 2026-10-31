import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Checkbox } from './checkbox';
import { Command, CommandInput } from './command';
import { Input } from './input';
import { MultiSelect, MultiSelectProvider } from './multiselect';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch } from './switch';
import { Textarea } from './textarea';

const IOS = 'max-sm:text-[max(16px,var(--typo-input-text-size,1rem))]';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= MockResizeObserver;
  window.HTMLElement.prototype.scrollIntoView ??= () => {};
  window.HTMLElement.prototype.hasPointerCapture ??= () => false;
});

describe('iOS zoom guard: field text is at least 16px below sm', () => {
  it('Input and the search variant', () => {
    const { rerender } = render(<Input aria-label="a" />);
    expect(screen.getByLabelText('a')).toHaveClass(IOS, 'typography-input-text');
    rerender(<Input aria-label="a" variant="search" />);
    expect(screen.getByLabelText('a')).toHaveClass(IOS);
  });

  it('Textarea', () => {
    render(<Textarea aria-label="a" />);
    expect(screen.getByLabelText('a')).toHaveClass(IOS);
  });

  it('SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger aria-label="a">
          <SelectValue placeholder="x" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveClass(IOS);
  });

  it('CommandInput', () => {
    render(
      <Command>
        <CommandInput aria-label="search" />
      </Command>,
    );
    expect(screen.getByLabelText('search')).toHaveClass(IOS);
  });

  it('MultiSelect text input (SingleSelect renders the same CommandInput once open)', () => {
    const options = [{ label: 'Design', id: 'design' }];
    render(
      <MultiSelectProvider>
        <MultiSelect id="m" label="M" options={options} selected={[]} onChange={() => {}} onUpdateOrder={() => {}} />
      </MultiSelectProvider>,
    );
    expect(document.querySelector('input[cmdk-input]')).toHaveClass(IOS);
  });
});

describe('Input states', () => {
  it('keeps the plain input unchanged by default', () => {
    const { container } = render(<Input aria-label="a" />);
    expect(container.firstChild).toBe(screen.getByLabelText('a'));
    expect(screen.getByLabelText('a')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('a')).not.toHaveClass('bg-muted');
  });

  it('readonly appearance sets readOnly and the muted surface', () => {
    render(<Input aria-label="a" appearance="readonly" defaultValue="x" />);
    const input = screen.getByLabelText('a');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveClass('bg-muted');
  });

  it('loading shows a spinner and aria-busy', () => {
    const { container } = render(<Input aria-label="a" loading />);
    expect(screen.getByLabelText('a')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('success adds the success border; invalid still works via aria-invalid', () => {
    render(<Input aria-label="a" success aria-invalid />);
    expect(screen.getByLabelText('a')).toHaveClass('border-border-success');
    expect(screen.getByLabelText('a')).toHaveAttribute('aria-invalid', 'true');
  });

  it('leading and trailing icons add padding and render decoratively', () => {
    const { container } = render(<Input aria-label="a" leadingIcon={<i data-testid="l" />} trailingIcon={<i data-testid="t" />} />);
    expect(screen.getByLabelText('a').className).toMatch(/pl-\[calc/);
    expect(screen.getByLabelText('a').className).toMatch(/pr-\[calc/);
    expect(container.querySelector('[aria-hidden=true] [data-testid=l]')).toBeInTheDocument();
  });

  it('leading and trailing addons attach to the field edges', () => {
    const { container } = render(<Input aria-label="a" leadingAddon="http://" trailingAddon={<button type="button">Go</button>} />);
    expect(screen.getByText('http://')).toHaveClass('rounded-l-control');
    expect(screen.getByRole('button', { name: 'Go' }).parentElement).toHaveClass('rounded-r-control');
    expect(screen.getByLabelText('a')).toHaveClass('rounded-l-none', 'rounded-r-none');
    expect(container.querySelector('[data-input-group]')).toBeInTheDocument();
  });

  it('typing still works through the decorated wrapper', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="a" leadingAddon="x" />);
    await user.type(screen.getByLabelText('a'), 'hi');
    expect(screen.getByLabelText('a')).toHaveValue('hi');
  });
});

describe('Textarea states', () => {
  it('stays a bare textarea by default', () => {
    const { container } = render(<Textarea aria-label="a" />);
    expect(container.firstChild).toBe(screen.getByLabelText('a'));
  });

  it('readonly appearance', () => {
    render(<Textarea aria-label="a" appearance="readonly" />);
    expect(screen.getByLabelText('a')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('a')).toHaveClass('bg-muted');
  });

  it('character count follows the text and is described by', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="a" showCount maxLength={100} defaultValue="12345" onChange={onChange} />);
    expect(document.querySelector('[data-textarea-count]')).toHaveTextContent('5 / 100');
    await user.type(screen.getByLabelText('a'), 'ab');
    expect(document.querySelector('[data-textarea-count]')).toHaveTextContent('7 / 100');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('a')).toHaveAccessibleDescription('7 / 100');
  });

  it('controlled value drives the count', () => {
    render(<Textarea aria-label="a" showCount maxLength={10} value="abc" onChange={() => {}} />);
    expect(document.querySelector('[data-textarea-count]')).toHaveTextContent('3 / 10');
  });
});

describe('SelectTrigger states', () => {
  const renderSelect = (props = {}) =>
    render(
      <Select>
        <SelectTrigger aria-label="Member" {...props}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
        </SelectContent>
      </Select>,
    );

  it('default is unchanged: chevron, no aria-busy or readonly', () => {
    const { container } = renderSelect();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-readonly');
    expect(container.querySelector('svg.lucide-chevron-down')).toBeInTheDocument();
  });

  it('loading swaps the chevron for a spinner and sets aria-busy', () => {
    const { container } = renderSelect({ loading: true });
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    expect(container.querySelector('svg.lucide-chevron-down')).toBeNull();
  });

  it('readonly never opens by pointer or keyboard', async () => {
    const user = userEvent.setup();
    renderSelect({ appearance: 'readonly' });
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-readonly', 'true');
    expect(trigger).toHaveClass('bg-muted');
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    trigger.focus();
    await user.keyboard('{Enter}{ArrowDown}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('a default select still opens', async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('leading content is decorative and success sets the border', () => {
    const { container } = renderSelect({ leading: <i data-testid="dot" />, success: true });
    expect(container.querySelector('[data-select-leading]')).toContainElement(screen.getByTestId('dot'));
    expect(container.querySelector('[data-select-leading]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('combobox')).toHaveClass('border-border-success');
  });
});

describe('Checkbox / Radio / Switch states', () => {
  it('Checkbox default keeps the 20px box; sm uses the checkbox size token', () => {
    const { rerender } = render(<Checkbox aria-label="c" />);
    expect(screen.getByRole('checkbox')).toHaveClass('h-5', 'w-5');
    rerender(<Checkbox aria-label="c" size="sm" />);
    expect(screen.getByRole('checkbox')).toHaveClass('h-checkbox-sm', 'w-checkbox-sm');
    expect(screen.getByRole('checkbox')).not.toHaveClass('h-5');
  });

  it('Checkbox checked is filled with the dark-aware brand pair', () => {
    render(<Checkbox aria-label="c" defaultChecked />);
    expect(screen.getByRole('checkbox')).toHaveClass('data-[state=checked]:bg-background-brand-bold-default', 'data-[state=checked]:text-text-on-brand');
  });

  it('Radio default is 16px with the outlined dot; md and filled are opt in', () => {
    const { rerender } = render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" aria-label="a" />
      </RadioGroup>,
    );
    const item = screen.getByRole('radio');
    expect(item).toHaveClass('h-4', 'w-4');
    expect(item).not.toHaveClass('data-[state=checked]:bg-background-brand-bold-default');
    expect(item.querySelector('[aria-hidden=true]')).toHaveClass('bg-background-brand-bold-default', 'h-2');
    rerender(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" aria-label="a" size="md" appearance="filled" />
      </RadioGroup>,
    );
    const filled = screen.getByRole('radio');
    expect(filled).toHaveClass('h-5', 'w-5', 'data-[state=checked]:bg-background-brand-bold-default');
    expect(filled.querySelector('[aria-hidden=true]')).toHaveClass('bg-text-on-brand', 'h-3');
  });

  it('Switch readOnly blocks changes but stays focusable', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="s" readOnly defaultChecked onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-readonly', 'true');
    await user.click(toggle);
    await user.keyboard(' ');
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle).toBeChecked();
    toggle.focus();
    expect(toggle).toHaveFocus();
  });

  it('Switch has Figma hover tracks and keeps the resting look', () => {
    render(<Switch aria-label="s" />);
    const cls = screen.getByRole('switch').className;
    expect(cls).toContain('data-[state=unchecked]:hover:bg-switch-background-unchecked-hover');
    expect(cls).toContain('data-[state=checked]:hover:bg-background-brand-bold-hover');
    expect(cls).toContain('data-[state=checked]:bg-background-brand-bold-default');
    expect(cls).toContain('data-[state=unchecked]:bg-switch-background-unchecked');
  });

  it('Switch readOnly keeps its track on hover and invalid gets the destructive border', () => {
    render(<Switch aria-label="s" readOnly aria-invalid />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('data-[readonly=true]:data-[state=checked]:hover:bg-background-brand-bold-default');
    expect(toggle.className).toContain('aria-[invalid=true]:border-destructive');
  });

  it('Switch default still toggles and has no readonly attributes', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="s" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).not.toHaveAttribute('aria-readonly');
    await user.click(toggle);
    expect(toggle).toBeChecked();
  });
});
