import { vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { DesignSystemProvider } from './design-system-provider';
import { MultiSelect, MultiSelectProps, MultiSelectProvider } from './multiselect';

// The outer trigger surface and cmdk's own internal search `<input>` both carry
// `role="combobox"` (cmdk mirrors the ARIA 1.0 combobox pattern on its input) — the trigger
// div is always the first in DOM order.
const getTrigger = () => screen.getAllByRole('combobox')[0];

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
    const label = screen.getByText('Job Type');
    expect(label).toHaveClass('opacity-disabled');
    expect(label.className).not.toMatch(/\btext-gray-400\b/);
  });

  // --- invalid state (SELECT-MAT-07) ---
  describe('invalid', () => {
    it('sets aria-invalid and the error-token border class on the trigger', () => {
      renderMultiSelect({ invalid: true });
      const trigger = getTrigger();
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveClass('aria-[invalid=true]:border-error');
      expect(trigger).toHaveAttribute('aria-describedby', 'job-type-error');
    });

    it('does not set aria-invalid when not invalid', () => {
      renderMultiSelect();
      expect(getTrigger()).not.toHaveAttribute('aria-invalid');
    });
  });

  // --- selected item token treatment (SELECT-MAT-04) ---
  it('marks a checked item with the same background-accent token Select uses', async () => {
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
    await userEvent.click(within(designItem).getByRole('checkbox'));

    await waitFor(() => expect(designItem).toHaveClass('bg-background-accent', 'text-foreground-accent'));
    expect(designItem.className).not.toMatch(/\bbg-slate-|bg-gray-|bg-background-neutral-default\b/);
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
      expect(getTrigger()).not.toHaveAttribute('aria-invalid');
    });

    it('marks a chip invalid via the option, with the destructive look and a screen reader text', () => {
      renderValues({ options: [{ label: 'Design', id: 'design', invalid: true }, options[1]] });
      const chip = document.querySelector('[data-invalid]') as HTMLElement;
      expect(chip).toHaveAttribute('aria-invalid', 'true');
      expect(chip).toHaveTextContent('Design (invalid)');
      expect(chip).toHaveClass('border-error', 'bg-general-error-container');
      expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
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
      expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
