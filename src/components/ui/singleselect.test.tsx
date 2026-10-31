import { vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { DesignSystemProvider } from './design-system-provider';
import { SingleSelect, SingleSelectProps, SingleSelectProvider } from './singleselect';

// jsdom has no ResizeObserver / pointer-capture / scrollIntoView, all of which the
// combobox's resize-tracking effect and cmdk touch while positioning the dropdown.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const options = [
  { label: 'Design', id: 'design' },
  { label: 'Development', id: 'development' },
];

const renderSingleSelect = (props: { disabled?: boolean; invalid?: boolean; selected?: string | null } = {}) =>
  render(
    <SingleSelectProvider>
      <SingleSelect
        id="job-type"
        label="Job Type"
        options={options}
        selected={props.selected ?? null}
        onChange={() => {}}
        disabled={props.disabled}
        invalid={props.invalid}
        ariaDescribedBy={props.invalid ? 'job-type-error' : undefined}
      />
    </SingleSelectProvider>,
  );

describe('SingleSelect component', () => {
  // --- token usage / no raw palette (SELECT-MAT-04) ---
  it('renders the trigger with token-styled classes, no raw palette values', () => {
    renderSingleSelect();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('border-form-border-default', 'hover:border-input-background-hover');
    expect(trigger.className).not.toMatch(/\bbg-slate-|bg-gray-|text-gray-|amber-/);
  });

  // --- disabled state uses opacity, not a raw color swap ---
  it('dims the label via opacity-disabled instead of a raw gray text color', () => {
    renderSingleSelect({ disabled: true });
    const label = screen.getByText('Job Type');
    expect(label).toHaveClass('opacity-disabled');
    expect(label.className).not.toMatch(/\btext-gray-400\b/);
  });

  // --- invalid state (SELECT-MAT-07) ---
  describe('invalid', () => {
    it('sets aria-invalid and the error-token border class on the trigger', () => {
      renderSingleSelect({ invalid: true });
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveClass('aria-[invalid=true]:border-error');
      expect(trigger).toHaveAttribute('aria-describedby', 'job-type-error');
    });

    it('does not set aria-invalid when not invalid', () => {
      renderSingleSelect();
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
    });
  });

  // --- selected item token treatment (SELECT-MAT-04) ---
  it('marks the chosen item with the same background-accent token Select uses', async () => {
    renderSingleSelect({ selected: 'development' });
    const trigger = screen.getByRole('combobox');
    // Toggle button (ChevronsUpDown) is the reliable open affordance once a value is
    // already selected — the "combobox" div itself has no click handler of its own.
    const toggleButton = within(trigger).getAllByRole('button').at(-1)!;
    await userEvent.click(toggleButton);

    const selectedOption = await waitFor(() => screen.getByText('Development', { selector: 'label' }));
    const selectedItem = selectedOption.closest('[cmdk-item]');
    expect(selectedItem).toHaveClass('bg-background-accent', 'text-foreground-accent');
    expect(selectedItem?.className).not.toMatch(/\bbg-slate-|bg-gray-|bg-background-neutral-default\b/);
  });
});

describe('SingleSelect readOnly', () => {
  const renderReadOnly = (selected: string | null = 'design') =>
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-type" label="Job Type" options={options} selected={selected} onChange={() => {}} readOnly />
      </SingleSelectProvider>,
    );

  it('shows the value, is focusable and exposes aria-readonly', async () => {
    renderReadOnly();
    const field = screen.getByRole('combobox');
    expect(field).toHaveTextContent('Design');
    expect(field).toHaveAttribute('aria-readonly', 'true');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    expect(field).toHaveClass('bg-muted');
    await userEvent.tab();
    expect(field).toHaveFocus();
  });

  it('cannot be opened or changed', async () => {
    const onChange = vi.fn();
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-type" options={options} selected="design" onChange={onChange} readOnly />
      </SingleSelectProvider>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Enter}{ArrowDown}');
    expect(screen.queryByText('Development')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the placeholder when nothing is selected', () => {
    renderReadOnly(null);
    expect(screen.getByRole('combobox')).toHaveTextContent('Search...');
  });

  it('default (not read only) is unchanged: no aria-readonly', () => {
    renderSingleSelect();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-readonly');
  });
});

describe('SingleSelect useSheet', () => {
  const renderSheet = (onChange = vi.fn()) =>
    render(
      <SingleSelectProvider>
        <SingleSelect id="sheet-select" label="Country" options={options} selected={null} onChange={onChange} useSheet enableSearch />
      </SingleSelectProvider>,
    );

  it('renders the trigger with enableSearch without a cmdk store outside <Command>', () => {
    expect(() => renderSheet()).not.toThrow();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('opens the sheet, shows the search input there and selects an option', async () => {
    const onChange = vi.fn();
    renderSheet(onChange);
    await userEvent.click(screen.getByRole('combobox'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('combobox').length).toBeGreaterThan(0);
    await userEvent.click(await within(dialog).findByText('Design'));
    expect(onChange).toHaveBeenCalledWith('design');
  });

  // --- invalid value (value level) ---
  describe('invalid value', () => {
    const renderValue = (props: Partial<SingleSelectProps> & { locale?: 'en' | 'de' }) => {
      const { locale = 'en', ...rest } = props;
      return render(
        <DesignSystemProvider locale={locale}>
          <SingleSelectProvider>
            <SingleSelect id="job-type" label="Job Type" options={options} selected="design" onChange={() => {}} {...rest} />
          </SingleSelectProvider>
        </DesignSystemProvider>,
      );
    };

    it('shows a valid value normally', () => {
      renderValue({});
      expect(document.querySelector('[data-invalid]')).toBeNull();
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
    });

    it('shows an unknown value in the destructive style with the id as text', () => {
      renderValue({ selected: 'gone' });
      const value = document.querySelector('[data-invalid]') as HTMLElement;
      expect(value).toHaveClass('text-text-destructive');
      expect(value).toHaveTextContent('gone (invalid)');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not flag an unknown value while loading', () => {
      renderValue({ selected: 'gone', loading: true });
      expect(document.querySelector('[data-invalid]')).toBeNull();
    });

    it('marks the value invalid via the option, invalidValues or isValueInvalid', () => {
      const { unmount } = renderValue({ options: [{ label: 'Design', id: 'design', invalid: true }] });
      expect(document.querySelector('[data-invalid]')).toBeInTheDocument();
      unmount();
      const second = renderValue({ invalidValues: ['design'] });
      expect(document.querySelector('[data-invalid]')).toBeInTheDocument();
      second.unmount();
      renderValue({ isValueInvalid: (id) => id === 'design' });
      expect(document.querySelector('[data-invalid]')).toBeInTheDocument();
    });

    it('uses the German screen reader text from the provider', () => {
      renderValue({ locale: 'de', invalidValues: ['design'] });
      expect(document.querySelector('[data-invalid]')).toHaveTextContent('Design (ungültig)');
    });

    it('marks the read-only value invalid', () => {
      renderValue({ readOnly: true, invalidValues: ['design'] });
      expect(document.querySelector('[data-invalid]')).toHaveTextContent('Design (invalid)');
    });
  });
});

describe('SingleSelect trigger id (0.28.1)', () => {
  it('puts the id on the combobox so the label for points at an element', () => {
    renderSingleSelect();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('id', 'job-type');
    expect(document.getElementById('job-type')).toBe(trigger);
    const label = screen.getByText('Job Type');
    expect(label).toHaveAttribute('for', 'job-type');
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
  });

  it('generates a stable id when none is passed and keeps it across renders', () => {
    const element = (
      <SingleSelectProvider>
        <SingleSelect label="Job Type" options={options} selected={null} onChange={() => {}} />
      </SingleSelectProvider>
    );
    const { rerender } = render(element);
    const first = screen.getByRole('combobox').id;
    expect(first).not.toBe('');
    expect(screen.getByText('Job Type')).toHaveAttribute('for', first);
    rerender(element);
    expect(screen.getByRole('combobox').id).toBe(first);
  });

  it('moves focus to the control inside when the id is focused (focus restoration)', () => {
    renderSingleSelect();
    document.getElementById('job-type')?.focus();
    expect(screen.getByRole('button', { name: /^Open options/  })).toHaveFocus();
  });

  it('leaves Enter to cmdk (which picks the highlighted option) while the list is open, and keeps it for the chevron while closed', async () => {
    const onRootKeyDown = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- test observer for the bubbling keydown
      <div onKeyDown={onRootKeyDown}>
        <SingleSelectProvider>
          <SingleSelect id="job-type" label="Job Type" options={options} selected={null} onChange={() => {}} />
        </SingleSelectProvider>
      </div>,
    );
    const chevron = screen.getByRole('button', { name: /^Open options/  });
    chevron.focus();
    await userEvent.keyboard('{Enter}');
    // Closed: the chevron kept the key and opened the list.
    expect(onRootKeyDown).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Job Type' })).toHaveAttribute('aria-expanded', 'true');
    screen.getByRole('button', { name: /^Open options/  }).focus();
    await userEvent.keyboard('{Enter}');
    // Open: the key bubbles on to cmdk.
    expect(onRootKeyDown).toHaveBeenCalledTimes(1);
  });

  it('moves focus into the field when the own label is clicked', async () => {
    renderSingleSelect();
    await userEvent.click(screen.getByText('Job Type'));
    expect(screen.getByRole('button', { name: /^Open options/  })).toHaveFocus();
  });

  it('moves focus into the field when a label outside the component is clicked', async () => {
    render(
      <>
        <label htmlFor="team">Team</label>
        <SingleSelectProvider>
          <SingleSelect id="team" options={options} selected={null} onChange={() => {}} ariaLabel="Team" />
        </SingleSelectProvider>
      </>,
    );
    await userEvent.click(screen.getByText('Team'));
    expect(screen.getByRole('button', { name: /^Open options/  })).toHaveFocus();
  });

  it('opens with Enter on the chevron and removes with Enter on the remove button, then focuses the chevron', async () => {
    const onChange = vi.fn();
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-type" label="Job Type" options={options} selected="design" onChange={onChange} />
      </SingleSelectProvider>,
    );
    screen.getByRole('button', { name: /^Open options/  }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('combobox', { name: 'Job Type' })).toHaveAttribute('aria-expanded', 'true');
    const remove = screen.getByRole('button', { name: /^Remove/ });
    remove.focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(null);
    await waitFor(() => expect(screen.getByRole('button', { name: /^Open options/  })).toHaveFocus());
  });

  it('puts the id on the trigger of the sheet variant too', () => {
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-sheet" label="Job Type" options={options} selected={null} onChange={() => {}} useSheet />
      </SingleSelectProvider>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'job-sheet');
  });

  it('its chevron button does not submit a surrounding form', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <SingleSelectProvider>
          <SingleSelect id="job-type" label="Job Type" options={options} selected={null} onChange={() => {}} />
        </SingleSelectProvider>
      </form>,
    );
    const chevron = screen.getByRole('button', { name: /^Open options/  });
    expect(chevron).toHaveAttribute('type', 'button');
    await userEvent.click(chevron);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('SingleSelect 0.29', () => {
  it('names the chevron after the field: "Open options" plus the visible label', () => {
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-type" label="Job Type" options={options} selected={null} onChange={() => {}} />
      </SingleSelectProvider>,
    );
    expect(screen.getByRole('button', { name: 'Open options Job Type' })).toBeInTheDocument();
  });

  it('names the chevron after the aria-label when there is no visible label', () => {
    render(
      <SingleSelectProvider>
        <SingleSelect id="team" ariaLabel="Team" options={options} selected={null} onChange={() => {}} />
      </SingleSelectProvider>,
    );
    expect(screen.getByRole('button', { name: 'Open options Team' })).toBeInTheDocument();
  });

  it('closes the sheet variant with Escape from the search field (the always visible list owns no Escape)', async () => {
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-sheet" label="Job Type" options={options} selected={null} onChange={() => {}} useSheet />
      </SingleSelectProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Open options/ }));
    const dialog = await screen.findByRole('dialog');
    const input = dialog.querySelector('input') as HTMLElement;
    expect(input).not.toBeNull();
    input.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('SingleSelect sheet 0.29 review fixes', () => {
  it('opens in the search field and clears the search after closing', async () => {
    render(
      <SingleSelectProvider>
        <SingleSelect id="job-sheet" label="Job Type" options={options} selected={null} onChange={() => {}} useSheet />
      </SingleSelectProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Open options/ }));
    const dialog = await screen.findByRole('dialog');
    const input = dialog.querySelector('input') as HTMLInputElement;
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.keyboard('zzz');
    expect(input.value).toBe('zzz');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^Open options/ }));
    const again = (await screen.findByRole('dialog')).querySelector('input') as HTMLInputElement;
    expect(again.value).toBe('');
  });
});

describe('SingleSelect add dialog', () => {
  it('closes the Add dialog with Escape and puts focus back into the field', async () => {
    render(
      <SingleSelectProvider>
        <SingleSelect id="job" label="Job Type" options={options} selected={null} onChange={() => {}} onAddItemClick={() => {}} />
      </SingleSelectProvider>,
    );
    const search = screen.getByRole('combobox');
    await userEvent.click(search);
    await userEvent.type(search, 'Brand new');
    await userEvent.click(screen.getByRole('button', { name: 'Add new' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Add')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('combobox').contains(document.activeElement)).toBe(true));
  });
});
