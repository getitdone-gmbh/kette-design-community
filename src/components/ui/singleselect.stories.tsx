import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';
import { useEffect, useState } from 'react';
import { Button } from './button';
import { SingleSelect, SingleSelectProps, SingleSelectProvider } from './singleselect';

const enum Support {
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  BOTH = 'both',
  OTHER = 'other',
}

const meta: Meta<SingleSelectProps> = {
  id: 'primitives-singleselect',
  title: 'Primitives · Inputs/SingleSelect',
  component: SingleSelect,
  tags: ['autodocs'],
  argTypes: {
    emptyText: { control: { type: 'text' }, description: 'Text of the empty search result. Wins over the provider text.' },
    addHintText: { control: { type: 'text' }, description: 'Hint under the empty result when adding is allowed.' },
    loadingText: { control: { type: 'text' }, description: 'Visible text of the loading add button.' },
    addNewText: { control: { type: 'text' }, description: 'Visible text of the add button.' },
  },
  decorators: [
    (Story) => {
      const [selected, setSelected] = useState<string>();

      useEffect(() => {
        const firstInput = document.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }, []);

      return (
        <div className="max-w-[560px]">
          <SingleSelectProvider>
            <Story
              selected={{
                selected,
              }}
              setSelected={{
                setSelected,
              }}
            />
          </SingleSelectProvider>
        </div>
      );
    },
  ],
} satisfies Meta<typeof SingleSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  options: [
    {
      label: 'Design',
      id: Support.DESIGN,
    },
    {
      label: 'Development',
      id: Support.DEVELOPMENT,
    },
    {
      label: 'Other',
      id: Support.OTHER,
    },
    {
      label: 'Both',
      id: Support.BOTH,
    },
    {
      label:
        'With very long text that should wrap and not overflow the container and some more text wrapped in multiple lines',
      id: 'long-text',
    },
    {
      label: 'item 1',
      id: 'item-1',
    },
    {
      label: 'item 2',
      id: 'item-2',
    },
    {
      label: 'item 3',
      id: 'item-3',
    },
    {
      label: 'item 4',
      id: 'item-4',
    },
  ],
  placeholder: 'Select job type...',
  onChange: () => {},
  loading: false,
  label: 'Job Type',
  id: 'job-type',
  disableRemove: false,
  disableAddNew: false,
  enableSearch: false,
  decentToggle: false,
  useSheet: false,
};

export const Default: Story = {
  parameters: { layout: 'padded' },
  args: {
    ...defaultArgs,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} />;
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    loading: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} />;
  },
};

export const Multiple: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return (
      <>
        <SingleSelect {...args} id="1" selected={selected} onChange={setSelected} />
        <SingleSelect {...args} id="2" selected={selected} onChange={setSelected} />
        <SingleSelect {...args} id="3" selected={selected} onChange={setSelected} />
      </>
    );
  },
};

export const Disabled: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} disabled selected={selected} onChange={setSelected} />;
  },
};

export const WithSearchExample: Story = {
  args: {
    ...defaultArgs,
    placeholder: 'Select job type...',
    chipsInside: true,
    enableSearch: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} enableSearch />;
  },
};

export const NoAddNew: Story = {
  args: {
    ...defaultArgs,
    disableAddNew: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} />;
  },
};

export const DecentToggle: Story = {
  args: {
    ...defaultArgs,
    decentToggle: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} />;
  },
};

export const NoRemove: Story = {
  args: {
    ...defaultArgs,
    disableRemove: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} />;
  },
};

export const SheetExample: Story = {
  parameters: { layout: 'padded' },
  args: {
    ...defaultArgs,
    useSheet: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return <SingleSelect {...args} selected={selected} onChange={setSelected} useSheet />;
  },
};

export const KeyboardNavigationDemo: Story = {
  args: {
    ...defaultArgs,
    label: 'Keyboard Navigation Demo',
    placeholder: 'Type to search...',
    description: 'Try: Type "de" → Enter/Arrow → Select with Space/Enter',
    enableSearch: true,
    options: [
      { label: 'Design', id: 'design' },
      { label: 'Development', id: 'development' },
      { label: 'DevOps', id: 'devops' },
      { label: 'Data Science', id: 'data-science' },
      { label: 'Other', id: 'other' },
      { label: 'Operations', id: 'operations' },
      { label: 'Testing', id: 'testing' },
      { label: 'Technical Writing', id: 'tech-writing' },
    ],
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return (
      <>
        <div className="mb-4 rounded bg-muted p-4 text-foreground">
          <h3 className="font-semibold mb-2">Keyboard Shortcuts:</h3>
          <ul className="text-sm space-y-1">
            <li>
              • <kbd>Arrow Keys</kbd>: Navigate through options (cmdk built-in)
            </li>
            <li>
              • <kbd>Space</kbd>: Select current option
            </li>
            <li>
              • <kbd>Enter</kbd>: Select option or add new (if enabled)
            </li>
            <li>
              • <kbd>Tab</kbd> from item: Return to search (if search enabled)
            </li>
            <li>
              • <kbd>Esc</kbd>: Close dropdown
            </li>
          </ul>
        </div>
        <SingleSelect {...args} selected={selected} onChange={setSelected} />
      </>
    );
  },
};

export const WithImprovedNavigation: Story = {
  args: {
    ...defaultArgs,
    label: 'Select Technology',
    placeholder: 'Search technologies...',
    enableSearch: true,
    disableAddNew: true,
    options: [
      { label: 'React', id: 'react' },
      { label: 'Vue', id: 'vue' },
      { label: 'Angular', id: 'angular' },
      { label: 'Svelte', id: 'svelte' },
      { label: 'Next.js', id: 'nextjs' },
      { label: 'Nuxt.js', id: 'nuxtjs' },
      { label: 'Gatsby', id: 'gatsby' },
      { label: 'Remix', id: 'remix' },
    ],
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return (
      <div>
        <p className="text-sm text-text-subtle mb-4">
          The selected item has a light gray background when navigating with arrow keys.
        </p>
        <SingleSelect {...args} selected={selected} onChange={setSelected} />
      </div>
    );
  },
};

export const WithCustomAction: Story = {
  args: {
    ...defaultArgs,
    customAction: (
      <Button size="sm" variant="ghost" className="px-2 text-sm">
        Import Options
      </Button>
    ),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return (
      <div>
        <p className="text-sm text-text-subtle mb-4">
          This example shows a custom action button that replaces the default "Add new" button.
        </p>
        <SingleSelect {...args} selected={selected} onChange={setSelected} />
      </div>
    );
  },
};

export const Invalid: Story = {
  args: {
    ...defaultArgs,
    id: 'invalid-singleselect',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return (
      <div className="space-y-2">
        <SingleSelect
          {...args}
          selected={selected}
          onChange={setSelected}
          invalid
          ariaDescribedBy="singleselect-job-type-error"
        />
        {/*
          `text-input-foreground-hint-error` (not `text-error`) — the raw `error` swatch is
          below the 4.5:1 AA minimum for body text; `input-foreground-hint-error` is the
          semantic on-surface/hint-text pairing that clears it (mirrors select.stories.tsx's
          `Invalid` story). `aria-describedby` wires this message to the trigger.
        */}
        <p id="singleselect-job-type-error" className="text-sm text-input-foreground-hint-error">
          Please select a job type.
        </p>
      </div>
    );
  },
};

export const Localized: Story = {
  args: {} as any,
  parameters: { docs: { description: { story: 'Provider locale `de`. Type a search without a match to see the empty state, `emptyText` overrides it for this instance.' } } },
  render: () => (
    <DesignSystemProvider locale="de">
      <SingleSelectProvider>
        <SingleSelect id="localized" label="Typ" options={[{ id: 'design', label: 'Design' }]} selected={null} onChange={() => {}} disableAddNew emptyText="Nichts gefunden" />
      </SingleSelectProvider>
    </DesignSystemProvider>
  ),
};

const InvalidValueDemo = () => {
    const [selected, setSelected] = useState<string | null>('retired');
    return (
      <SingleSelectProvider>
        <SingleSelect id="invalid-value" label="Job Type" options={[{ id: 'design', label: 'Design' }, { id: 'development', label: 'Development' }]} selected={selected} onChange={setSelected} disableAddNew />
      </SingleSelectProvider>
    );
};

export const InvalidValue: Story = {
  args: {} as any,
  parameters: { docs: { description: { story: 'The current value can be invalid without the field being invalid. Mark it with `invalid: true` on the option, `invalidValues` or `isValueInvalid(id)`. A `selected` id that is not in the options is shown as invalid with its id as text. The value uses the destructive text role and is announced as invalid.' } } },
  render: () => <InvalidValueDemo />,
};

// The id sits on the field: the external label points at it, a click on the label moves focus into the field, and the chevron never submits the form.
const TeamForm = ({ selected, children }: { selected: string | null | undefined; children: React.ReactNode }) => {
  const [status, setStatus] = useState<'idle' | 'saved' | 'missing'>('idle');
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setStatus(selected ? 'saved' : 'missing');
      }}
    >
      <label htmlFor="team" className="typography-label text-text-default">
        Team
      </label>
      {children}
      <Button type="submit" variant="outline" size="sm" className="self-start">
        Save
      </Button>
      <p role="status" className={status === 'missing' ? 'typography-text-small text-text-destructive' : 'typography-text-small text-text-subtle'}>
        {status === 'saved' ? 'Saved' : status === 'missing' ? 'Choose a team first.' : 'Not saved yet'}
      </p>
    </form>
  );
};

export const InFormWithExternalLabel: Story = {
  args: {
    ...defaultArgs,
    id: 'team',
    label: undefined,
    placeholder: 'Select a team',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { setSelected } = context.setSelected;
    return (
      <TeamForm selected={selected}>
        <SingleSelect {...args} selected={selected} onChange={setSelected} ariaLabel="Team" />
      </TeamForm>
    );
  },
};
