import { vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { DesignSystemProvider } from './design-system-provider';
import { MultiSelect, MultiSelectProps, MultiSelectProvider } from './multiselect';

// The styled trigger surface (`data-id`) carries no role while the search input exists: the input is the only combobox.
const getTrigger = () => document.querySelector('[data-id]') as HTMLElement;
// The single combobox is the search input.
const getInput = () => screen.getByRole('combobox');

// jsdom has no ResizeObserver / pointer-capture / scrollIntoView / drag-and-drop APIs, all of
// which the combobox's resize-tracking effect, cmdk, and react-dnd's HTML5 backend touch.
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

const renderMultiSelect = (
  props: { disabled?: boolean; invalid?: boolean; selected?: string[]; loading?: boolean } = {},
) =>
  render(
    <MultiSelectProvider>
      <MultiSelect
        id="job-type"
        label="Job Type"
        options={options}
        selected={props.selected ?? []}
        onChange={() => {}}
        onUpdateOrder={() => {}}
        disabled={props.disabled}
        loading={props.loading}
        invalid={props.invalid}
        ariaDescribedBy={props.invalid ? 'job-type-error' : undefined}
      />
    </MultiSelectProvider>,
  );

describe('MultiSelect component', () => {
  // --- token usage / no raw palette (SELECT-MAT-04) ---
  it('renders the trigger with token-styled classes, no raw palette values', () => {
    renderMultiSelect();
    const trigger = getTrigger();
    expect(trigger).toHaveClass('border-form-border-default', 'hover:border-input-background-hover');
    expect(trigger.className).not.toMatch(/\bbg-slate-|bg-gray-|text-gray-|amber-/);
  });

  // --- disabled state uses opacity, not a raw color swap ---
  it('dims the label via opacity-disabled instead of a raw gray text color', () => {
    renderMultiSelect({ disabled: true });
    const label = document.getElementById('job-type-label') as HTMLElement;
    expect(label).toHaveClass('opacity-disabled');
    expect(label.className).not.toMatch(/\btext-gray-400\b/);
  });

  // --- invalid state (SELECT-MAT-07) ---
  describe('invalid', () => {
    it('sets aria-invalid and the error-token border class on the trigger', () => {
      renderMultiSelect({ invalid: true });
      expect(getInput()).toHaveAttribute('aria-invalid', 'true');
      // the surface carries no role and no aria-invalid while the input exists, so the error border hangs on data-field-invalid
      expect(getTrigger()).toHaveAttribute('data-field-invalid', 'true');
      expect(getTrigger()).toHaveClass('data-[field-invalid=true]:border-error');
      expect(getInput()).toHaveAttribute('aria-describedby', 'job-type-error');
    });

    it('does not set aria-invalid when not invalid', () => {
      renderMultiSelect();
      expect(getInput()).not.toHaveAttribute('aria-invalid');
      expect(getTrigger()).not.toHaveAttribute('data-field-invalid');
    });
  });

  // --- selected item token treatment (SELECT-MAT-04) ---
  it('shows a checked item through aria-checked and the checkbox, not a row background (RZ2-D01)', async () => {
    // Controlled component — a stateful wrapper is needed for the checkbox click to
    // actually flip `selected` (a bare no-op `onChange` would leave the item unchecked).
    const ControlledMultiSelect = (props: Partial<MultiSelectProps>) => {
      const [selected, setSelected] = useState<string[]>([]);
      return (
        <MultiSelectProvider>
          <MultiSelect
            id="job-type"
            label="Job Type"
            options={options}
            selected={selected}
            onChange={setSelected}
            onUpdateOrder={() => {}}
            {...props}
          />
        </MultiSelectProvider>
      );
    };
    render(<ControlledMultiSelect />);

    // The search input (always mounted) is what actually opens the dropdown on click —
    // the outer trigger `div` only carries the visual/aria state, not the click handler.
    await userEvent.click(screen.getByPlaceholderText('Search...'));
    const designLabel = await waitFor(() => screen.getByText('Design', { selector: 'label' }));
    const designItem = designLabel.closest('[cmdk-item]') as HTMLElement;
    // The checkbox is a visual only: not a tab stop, hidden from assistive technology (UX-RZ2-01).
    const box = within(designItem).getByRole('checkbox', { hidden: true });
    expect(box.closest('[inert]')).not.toBeNull();
    expect(box.closest('[aria-hidden="true"]')).not.toBeNull();
    await userEvent.click(designItem);

    await waitFor(() => expect(designItem).toHaveAttribute('aria-checked', 'true'));
    expect(designItem.className).not.toMatch(/(^|\s)bg-background-accent\b/);
    expect(designItem).toHaveClass('aria-selected:ring-inset');
  });

  // --- icon family (SELECT-MAT-06) ---
  it('renders the loading spinner from lucide-react, not @radix-ui/react-icons', async () => {
    renderMultiSelect({ loading: true });
    await userEvent.click(screen.getByPlaceholderText('Search...'));
    const waitLabel = await waitFor(() => screen.getByText('Please wait'));
    const spinner = waitLabel.parentElement?.querySelector('svg');
    expect(spinner).toHaveClass('lucide', 'animate-spin');
  });
});

const manyOptions = [
  { label: 'Design', id: 'design' },
  { label: 'Development', id: 'development' },
  { label: 'Other', id: 'other' },
];

const Controlled = (props: Partial<MultiSelectProps> & { initial?: string[] }) => {
  const [selected, setSelected] = useState<string[]>(props.initial ?? []);
  return (
    <MultiSelectProvider>
      <MultiSelect id="job-type" label="Job Type" options={manyOptions} selected={selected} onChange={setSelected} onUpdateOrder={() => {}} {...props} />
    </MultiSelectProvider>
  );
};

describe('MultiSelect round 3 props', () => {
  it('connects the visible label to the search input and does not rename the input', async () => {
    render(<Controlled />);
    await waitFor(() => expect(screen.getByLabelText('Job Type')).toBe(getInput()));
    expect(getInput().id).not.toBe('multiselect-inputjob-type');
  });

  it('maxSelected disables the unchosen options at the limit, shows a hint and hides Check All', async () => {
    render(<Controlled maxSelected={2} initial={['design', 'development']} />);
    await userEvent.click(getInput());
    const other = (await waitFor(() => screen.getByText('Other', { selector: 'label' }))).closest('[cmdk-item]') as HTMLElement;
    expect(other).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('You can choose up to 2. Remove one to choose another.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check All' })).not.toBeInTheDocument();
    await userEvent.click(other);
    expect(other).toHaveAttribute('aria-checked', 'false');
    const design = screen.getByText('Design', { selector: 'label' }).closest('[cmdk-item]') as HTMLElement;
    expect(design).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(design);
    await waitFor(() => expect(design).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(other).not.toHaveAttribute('aria-disabled', 'true'));
  });

  it('maxSelectedText wins over the provider text', async () => {
    render(<Controlled maxSelected={1} maxSelectedText="Pick one only" initial={['design']} />);
    await userEvent.click(getInput());
    expect(await screen.findByText('Pick one only')).toBeInTheDocument();
  });

  it('clearSearchOnSelect empties the search after a pick, the list stays open', async () => {
    render(<Controlled clearSearchOnSelect />);
    const input = getInput();
    await userEvent.type(input, 'dev');
    const item = (await waitFor(() => screen.getByText('Development', { selector: 'label' }))).closest('[cmdk-item]') as HTMLElement;
    await userEvent.click(item);
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getByText('Other', { selector: 'label' })).toBeInTheDocument();
  });

  it('keeps the search text after a pick without clearSearchOnSelect', async () => {
    render(<Controlled />);
    const input = getInput();
    await userEvent.type(input, 'dev');
    const item = (await waitFor(() => screen.getByText('Development', { selector: 'label' }))).closest('[cmdk-item]') as HTMLElement;
    await userEvent.click(item);
    expect(input).toHaveValue('dev');
  });

  it('shows the autosave hint behind Close by default and hides it with hideAutosaveHint', async () => {
    const { unmount } = render(<Controlled />);
    await userEvent.click(getInput());
    expect(await screen.findByText('(autosave)')).toBeInTheDocument();
    unmount();
    render(<Controlled hideAutosaveHint />);
    await userEvent.click(getInput());
    await screen.findByRole('button', { name: 'Close' });
    expect(screen.queryByText('(autosave)')).not.toBeInTheDocument();
  });
});

describe('MultiSelect readOnly', () => {
  it('shows the chosen values as chips, focusable, aria-readonly, cannot open', async () => {
    const onChange = vi.fn();
    render(
      <MultiSelectProvider>
        <MultiSelect id="job-type" label="Job Type" options={options} selected={['design', 'development']} onChange={onChange} onUpdateOrder={() => {}} readOnly />
      </MultiSelectProvider>,
    );
    const field = screen.getByRole('combobox');
    expect(field).toHaveAttribute('aria-readonly', 'true');
    expect(field).toHaveClass('bg-muted');
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await userEvent.tab();
    expect(field).toHaveFocus();
    await userEvent.click(field);
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the placeholder without a selection and default stays editable', () => {
    const { unmount } = render(
      <MultiSelectProvider>
        <MultiSelect id="a" options={options} selected={[]} onChange={() => {}} onUpdateOrder={() => {}} readOnly />
      </MultiSelectProvider>,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Search...');
    unmount();
    renderMultiSelect();
    expect(getTrigger()).not.toHaveAttribute('aria-readonly');
  });

  // --- invalid values (chip level) ---
  describe('invalid values', () => {
    const renderValues = (props: Partial<MultiSelectProps> & { locale?: 'en' | 'de' }) => {
      const { locale = 'en', ...rest } = props;
      return render(
        <DesignSystemProvider locale={locale}>
          <MultiSelectProvider>
            <MultiSelect id="job-type" label="Job Type" options={options} selected={['design']} onChange={() => {}} onUpdateOrder={() => {}} {...rest} />
          </MultiSelectProvider>
        </DesignSystemProvider>,
      );
    };

    it('keeps valid chips normal and does not flag the field', () => {
      renderValues({});
      expect(document.querySelector('[data-invalid]')).toBeNull();
      expect(getInput()).not.toHaveAttribute('aria-invalid');
    });

    it('marks a chip invalid via the option, with the destructive look and a screen reader text', () => {
      renderValues({ options: [{ label: 'Design', id: 'design', invalid: true }, options[1]] });
      const chip = document.querySelector('[data-invalid]') as HTMLElement;
      expect(chip).toHaveAttribute('aria-invalid', 'true');
      expect(chip).toHaveTextContent('Design (invalid)');
      expect(chip).toHaveClass('border-error', 'bg-general-error-container');
      expect(getInput()).toHaveAttribute('aria-invalid', 'true');
    });

    it('marks a chip invalid via invalidValues', () => {
      renderValues({ selected: ['design', 'development'], invalidValues: ['development'] });
      const flagged = document.querySelectorAll('[data-invalid]');
      expect(flagged).toHaveLength(1);
      expect(flagged[0]).toHaveTextContent('Development');
    });

    it('marks a chip invalid via isValueInvalid', () => {
      renderValues({ isValueInvalid: (id) => id === 'design' });
      expect(document.querySelectorAll('[data-invalid]')).toHaveLength(1);
    });

    it('shows an unknown selected value as an invalid chip with its id as label', () => {
      renderValues({ selected: ['gone'] });
      const chip = document.querySelector('[data-invalid]') as HTMLElement;
      expect(chip).toHaveTextContent('gone (invalid)');
    });

    it('does not flag an unknown value while options are loading', () => {
      renderValues({ selected: ['gone'], loading: true });
      expect(document.querySelector('[data-invalid]')).toBeNull();
    });

    it('uses the German screen reader text from the provider', () => {
      renderValues({ locale: 'de', invalidValues: ['design'] });
      expect(document.querySelector('[data-invalid]')).toHaveTextContent('Design (ungültig)');
    });

    it('marks the text form invalid with the destructive text colour', () => {
      renderValues({ selectedOptionsAsText: true, invalidValues: ['design'] });
      const item = document.querySelector('[data-invalid]') as HTMLElement;
      expect(item).toHaveClass('text-text-destructive');
      expect(item).toHaveTextContent('Design (invalid)');
    });

    it('marks an invalid chip in read-only mode', () => {
      renderValues({ readOnly: true, invalidValues: ['design'] });
      expect(document.querySelector('[data-invalid]')).toHaveTextContent('Design (invalid)');
      expect(getInput()).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

describe('MultiSelect standalone and keyboard (A11Y-FND-003)', () => {
  const categories = [
    { id: 'docs', label: 'Documentation' },
    { id: 'dev', label: 'Developer tools' },
    { id: 'data', label: 'Data' },
    { id: 'web', label: 'Web' },
  ];
  // No MultiSelectProvider on purpose: a standalone field has to open on its own.
  const Standalone = ({ max = 3 }: { max?: number }) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <MultiSelect
        id="categories"
        ariaLabel="Categories"
        options={categories}
        selected={selected}
        onChange={(next) => setSelected((prev) => (typeof next === 'function' ? next(prev) : next).slice(0, max))}
        placeholder="Choose categories"
        disableAddNew
      />
    );
  };

  it('has exactly one combobox, named, collapsed until opened', async () => {
    render(<Standalone />);
    const combos = screen.getAllByRole('combobox');
    expect(combos).toHaveLength(1);
    expect(combos[0].tagName).toBe('INPUT');
    expect(combos[0]).toHaveAccessibleName('Categories');
    expect(combos[0]).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(combos[0]);
    await waitFor(() => expect(combos[0]).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getAllByRole('option').length).toBe(4);
  });

  it('opens with ArrowDown, filters by typing, selects with Enter, removes with Backspace and announces both', async () => {
    render(<Standalone />);
    const input = screen.getByRole('combobox');
    // The field blurs itself once after mount, so move focus in after that.
    await new Promise((resolve) => setTimeout(resolve, 10));
    await userEvent.tab();
    expect(input).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(4));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
    expect(input).toHaveAttribute('aria-expanded', 'false');
    // Typing into a closed field opens it already filtered.
    await userEvent.keyboard('Doc');
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(1));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Documentation selected'));
    expect(screen.getByRole('button', { name: 'Remove Documentation' })).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Documentation removed'));
    expect(screen.queryByRole('button', { name: 'Remove Documentation' })).not.toBeInTheDocument();
  });

  it('moves with ArrowDown and keeps at most three selections', async () => {
    render(<Standalone />);
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(4));
    for (let i = 0; i < 4; i += 1) {
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{ArrowDown}');
    }
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(3);
    await waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBeTruthy());
  });
});

describe('MultiSelect keyboard and name (round 2)', () => {
  it('Tab closes the open list and clears the filter text', async () => {
    render(
      <MultiSelectProvider>
        <MultiSelect id="job-type" label="Job Type" options={options} selected={[]} onChange={() => {}} onUpdateOrder={() => {}} />
      </MultiSelectProvider>,
    );
    const field = screen.getByRole('combobox');
    await userEvent.click(field);
    await userEvent.keyboard('des');
    expect(field).toHaveAttribute('aria-expanded', 'true');
    // Tab walks through the list buttons first (Check All, Add, Close) and leaves the field after the last one.
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Check All' })).toHaveFocus();
    expect(field).toHaveAttribute('aria-expanded', 'true');
    for (let i = 0; i < 4 && field.getAttribute('aria-expanded') === 'true'; i += 1) await userEvent.tab();
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
    expect(field).toHaveValue('');
  });

  it('Enter on a list button runs the button, not the highlighted option', async () => {
    render(<Controlled initial={['design']} maxSelected={2} />);
    await userEvent.click(getInput());
    const uncheck = await screen.findByRole('button', { name: 'Uncheck All' });
    uncheck.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Uncheck All' })).not.toBeInTheDocument());
    expect(screen.getAllByRole('option').every((o) => o.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('Uncheck All with a limit keeps the list open and moves focus to the search input', async () => {
    render(<Controlled initial={['design', 'development']} maxSelected={2} />);
    await userEvent.click(getInput());
    await userEvent.click(await screen.findByRole('button', { name: 'Uncheck All' }));
    expect(getInput()).toHaveFocus();
    expect(getInput()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('announces the limit with the pick and points disabled options at the hint', async () => {
    render(<Controlled initial={['design']} maxSelected={2} />);
    await userEvent.click(getInput());
    const dev = (await screen.findByText('Development', { selector: 'label' })).closest('[cmdk-item]') as HTMLElement;
    await userEvent.click(dev);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Development selected. You can choose up to 2. Remove one to choose another.'));
    const other = screen.getByText('Other', { selector: 'label' }).closest('[cmdk-item]') as HTMLElement;
    const hint = document.querySelector('[data-slot="multiselect-limit-hint"]') as HTMLElement;
    expect(other.getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint).toHaveTextContent('You can choose up to 2. Remove one to choose another.');
  });

  it('returns focus to the search input when the list closes from a list button', async () => {
    render(<Controlled />);
    await userEvent.click(getInput());
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Check All' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(getInput()).toHaveAttribute('aria-expanded', 'false'));
    expect(getInput()).toHaveFocus();
    await userEvent.click(getInput());
    (await screen.findByRole('button', { name: /^Close/ })).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(getInput()).toHaveAttribute('aria-expanded', 'false'));
    expect(getInput()).toHaveFocus();
  });

  it('hands focus from the field id to the search input', () => {
    render(<Controlled />);
    (document.getElementById('job-type') as HTMLElement).focus();
    expect(getInput()).toHaveFocus();
  });

  it('renders no list while collapsed and names it by the field label when open', async () => {
    render(
      <MultiSelectProvider>
        <MultiSelect id="job-type" label="Job Type" options={options} selected={[]} onChange={() => {}} onUpdateOrder={() => {}} />
      </MultiSelectProvider>,
    );
    expect(screen.queryByRole('listbox')).toBeNull();
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox', { name: 'Job Type' })).toBeInTheDocument();
  });
});

describe('MultiSelect onlyCheckOnCheckbox keyboard (round 2)', () => {
  const Demo = ({ onToggle }: { onToggle: (ids: string[]) => void }) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <MultiSelectProvider>
        <MultiSelect
          id="job-type"
          label="Job Type"
          options={options}
          selected={selected}
          onChange={(next) => {
            setSelected(next);
            onToggle(typeof next === 'function' ? (next as (p: string[]) => string[])(selected) : next);
          }}
          onUpdateOrder={() => {}}
          onlyCheckOnCheckbox
        />
      </MultiSelectProvider>
    );
  };

  it('Enter toggles the highlighted option, a click on the row label does not, a click on the checkbox does', async () => {
    const onToggle = vi.fn();
    render(<Demo onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('combobox'));
    const first = (await screen.findAllByRole('option'))[0];
    await userEvent.click(within(first).getByText(/Design/, { selector: 'label' }));
    expect(onToggle).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(first).toHaveAttribute('aria-checked', 'true'));
    await userEvent.click(within(first).getByRole('checkbox', { hidden: true }));
    await waitFor(() => expect(first).toHaveAttribute('aria-checked', 'false'));
  });

  it('keeps one listbox, named by the field label', async () => {
    render(<Demo onToggle={() => {}} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findAllByRole('listbox')).toHaveLength(1);
    expect(screen.getByRole('listbox')).toHaveAccessibleName('Job Type');
  });
});

describe('MultiSelect filterMode', () => {
  it('prefix keeps word-start matches only', async () => {
    render(
      <MultiSelectProvider>
        <MultiSelect id="f" label="F" options={[{ label: 'GitHub', id: 'g' }, { label: 'Digital tools', id: 'd' }, { label: 'Postgres', id: 'p' }]} selected={[]} onChange={() => {}} onUpdateOrder={() => {}} filterMode="prefix" />
      </MultiSelectProvider>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('git');
    const names = (await screen.findAllByRole('option')).map((o) => o.textContent);
    expect(names).toHaveLength(1);
    expect(names[0]).toContain('GitHub');
  });
});

// Fix round 15.11.2026: limit footer, limit re-announce, chip remove focus, pointer pick focus, empty result text.
describe('MultiSelect limit footer, focus and empty result (0.40.1)', () => {
  const LIMIT_TEXT = 'You can choose up to 2. Remove one to choose another.';
  const getHint = () => document.querySelector('[data-slot="multiselect-limit-hint"]') as HTMLElement;

  it('keeps the limit text in a footer below the options that holds its place before the limit (DR-19)', async () => {
    render(<Controlled maxSelected={2} initial={['design']} />);
    await userEvent.click(getInput());
    const listbox = await screen.findByRole('listbox');
    const before = getHint();
    // below the options, in the layout, but invisible and out of the accessibility tree until the limit
    expect(before.compareDocumentPosition(listbox) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(before).toHaveClass('invisible');
    expect(before).toHaveAttribute('aria-hidden', 'true');
    expect(before).toHaveTextContent(LIMIT_TEXT);
    await userEvent.click((await screen.findByText('Development', { selector: 'label' })).closest('[cmdk-item]') as HTMLElement);
    await waitFor(() => expect(getHint()).not.toHaveClass('invisible'));
    // the same node, so nothing is inserted above the options
    expect(getHint()).toBe(before);
    expect(getHint()).not.toHaveAttribute('aria-hidden');
    expect(getHint().compareDocumentPosition(screen.getByRole('listbox')) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('has no footer without a limit', async () => {
    render(<Controlled />);
    await userEvent.click(getInput());
    await screen.findByRole('listbox');
    expect(getHint()).toBeNull();
  });

  it('announces the limit again when Enter hits an option that cannot be added (UXR-22)', async () => {
    const user = userEvent.setup();
    render(<Controlled maxSelected={2} initial={['design', 'development']} />);
    await user.type(getInput(), 'oth');
    await screen.findByText('Other', { selector: 'label' });
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(LIMIT_TEXT));
    const first = screen.getByRole('status').textContent;
    await user.keyboard('{Enter}');
    // the region changes, so the repeated text is read out again
    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe(first));
    expect(screen.getByRole('status')).toHaveTextContent(LIMIT_TEXT);
  });

  it('clears the status message when the list closes (UXR-22)', async () => {
    const user = userEvent.setup();
    render(<Controlled maxSelected={2} initial={['design']} />);
    await user.click(getInput());
    await user.click((await screen.findByText('Development', { selector: 'label' })).closest('[cmdk-item]') as HTMLElement);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(LIMIT_TEXT));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(''));
  });

  describe('removing a chip with its button (UXR-20)', () => {
    const removeButtons = () => screen.queryAllByRole('button').filter((b) => /^Remove /.test(b.getAttribute('aria-label') ?? ''));

    it('moves focus to the next chip, else the previous chip, else the search input', async () => {
      const user = userEvent.setup();
      render(<Controlled initial={['design', 'development', 'other']} />);
      removeButtons()[1].focus();
      await user.keyboard('{Enter}');
      await waitFor(() => expect(removeButtons()).toHaveLength(2));
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove Other');
      await user.keyboard('{Enter}');
      await waitFor(() => expect(removeButtons()).toHaveLength(1));
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove Design');
      await user.keyboard('{Enter}');
      await waitFor(() => expect(removeButtons()).toHaveLength(0));
      expect(getInput()).toHaveFocus();
    });

    it('moves focus to the search input when the last chip is the only one left', async () => {
      const user = userEvent.setup();
      render(<Controlled initial={['other']} />);
      removeButtons()[0].focus();
      await user.keyboard('{Enter}');
      await waitFor(() => expect(getInput()).toHaveFocus());
    });
  });

  it('returns focus to the search input after a pick with the pointer (UXR-21)', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(getInput());
    const dev = (await screen.findByText('Development', { selector: 'label' })).closest('[cmdk-item]') as HTMLElement;
    await user.click(dev);
    await waitFor(() => expect(dev).toHaveAttribute('aria-checked', 'true'));
    expect(getInput()).toHaveFocus();
    await user.keyboard('oth');
    expect(getInput()).toHaveValue('oth');
  });

  it('names the search in an empty result and announces it (UXR-23)', async () => {
    const user = userEvent.setup();
    render(<Controlled disableAddNew />);
    await user.type(getInput(), 'zzz');
    expect(await screen.findByText('No matches for "zzz"', { selector: 'span:not([role])' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No matches for "zzz"'));
  });

  it('lets emptyText override the empty result text, also with a search', async () => {
    const user = userEvent.setup();
    render(<Controlled disableAddNew emptyText="Nothing here" />);
    await user.type(getInput(), 'zzz');
    expect(await screen.findAllByText('Nothing here')).not.toHaveLength(0);
    expect(screen.queryByText(/No matches for/)).toBeNull();
  });
});
