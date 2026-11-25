import { expect } from '@storybook/jest';
import { PlusIcon } from '@radix-ui/react-icons';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { DesignSystemProvider } from './design-system-provider';
import { ListFilter } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Label } from './label';
import { MultiSelect, MultiSelectContext, MultiSelectOption, MultiSelectProps, MultiSelectProvider } from './multiselect';
import { Spacing } from './spacing';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const enum Support {
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  BOTH = 'both',
  OTHER = 'other',
}

const meta: Meta<MultiSelectProps> = {
  id: 'primitives-multiselect',
  title: 'Primitives · Inputs/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  argTypes: {
    emptyText: { control: { type: 'text' }, description: 'Text of the empty search result. Wins over the provider text.' },
    chipVariant: { control: { type: 'select' }, options: ['info', 'default', 'secondary', 'neutral', 'muted', 'primary', 'success', 'destructive'], description: 'Chip look of the chosen values. `info` (default) is blue in every theme, `primary` follows the brand colour of the theme (violet in runzero), `neutral` and `muted` are quiet. `default` is the card fill and disappears on a card in dark mode.' },
    inputId: { control: { type: 'text' }, description: 'Id an outside Label points to with htmlFor; that label then names the search input.' },
    hideAutosaveHint: { control: { type: 'boolean' }, description: 'Hides "(autosave)" next to Close, for a list that a form button saves.' },
    maxSelected: { control: { type: 'number' }, description: 'Most values that can be chosen; the other options are disabled until one is removed.' },
    addHintText: { control: { type: 'text' }, description: 'Hint under the empty result when adding is allowed.' },
    loadingText: { control: { type: 'text' }, description: 'Visible text of the loading add button.' },
    addNewText: { control: { type: 'text' }, description: 'Visible text of the add button.' },
  },
  decorators: [
    (Story) => {
      const [selected, setSelected] = useState<string[]>([Support.DESIGN, Support.DEVELOPMENT]);
      const [options] = useState(defaultArgs.options);

      const handleChange = (newSelected: string[]) => {
        setSelected(newSelected);
      };

      const handleUpdateOrder = (updatedOptions: MultiSelectOption[]) => {
        setSelected(updatedOptions.map((option) => option.id));
        console.log('updatedOptions', updatedOptions);
      };

      return (
        <div className="max-w-[560px]">
          <MultiSelectProvider>
            <Story
              selected={{
                selected,
              }}
              setSelected={{
                setSelected,
              }}
              options={{ options }}
              onChange={{ handleChange }}
              onUpdateOrder={{ handleUpdateOrder }}
            />
          </MultiSelectProvider>
        </div>
      );
    },
  ],
} satisfies Meta<typeof MultiSelect>;

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
        'With very long text that should wrap and not overflow the container and some more text wrapped in multiple lines or truncate',
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
      order: 9,
    },
  ],
  placeholder: 'Search jobs...',
  selected: [],
  onChange: () => {},
  loading: false,
  label: 'Job Type',
  id: 'job-type',
  noButton: false,
  disableAddNew: false,
  chipsInside: false,
  disableSearch: false,
  decentToggle: false,
  chipsAsCol: false,
  hideCheckedItems: false,
  useSheet: false,
  useDragAndDrop: false,
  disableCheckbox: false,
  chipPosition: 'top',
  selectedOptionsAsText: false,
  renderItem: undefined,
  selectedOptionsAsListItems: false,
  description: null,
  disableCheckAll: false,
  useSheetText: 'All items',
  useSheetTrigger: (
    <>
      <PlusIcon className="h-4 w-4 min-w-[16px]" />
      Add
    </>
  ),
  truncateChips: true,
};

export const Default: Story = {
  args: {
    ...defaultArgs,
    truncateChips: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;

    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    loading: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const Multiple: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <>
        <MultiSelect
          {...args}
          id="1"
          selected={selected}
          onChange={handleChange}
          options={options}
          onUpdateOrder={handleUpdateOrder}
        />
        <MultiSelect
          {...args}
          id="2"
          selected={selected}
          onChange={handleChange}
          options={options}
          onUpdateOrder={handleUpdateOrder}
        />
        <MultiSelect
          {...args}
          id="3"
          selected={selected}
          onChange={handleChange}
          options={options}
          onUpdateOrder={handleUpdateOrder}
        />
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
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        disabled
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const Description: Story = {
  args: {
    ...defaultArgs,
    description: 'Select job type...',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const CustomAction: Story = {
  args: {
    ...defaultArgs,
    customAction: (
      <Button size="sm" variant="link">
        Custom Action
      </Button>
    ),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;

    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const CustomAddAction: Story = {
  args: {
    ...defaultArgs,
    useSheet: true,
    customAddAction: (
      <Button size="sm" variant="link">
        Add new
      </Button>
    ),
    customAction: (
      <Button size="sm" variant="link">
        sort
      </Button>
    ),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;

    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const ChipsInside: Story = {
  args: {
    ...defaultArgs,
    chipsInside: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const ChipVariant: Story = {
  args: {
    ...defaultArgs,
    chipVariant: 'secondary',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

const chipVariantNames = ['info', 'primary', 'neutral', 'muted', 'secondary', 'default', 'success', 'destructive'] as const;

const ChipVariantsDemo = () => {
  const [selected, setSelected] = useState<string[]>(['design', 'development']);
  const opts = [
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'other', label: 'Other' },
  ];
  return (
    <div className="flex flex-col gap-4">
      {chipVariantNames.map((variant) => (
        <MultiSelectProvider key={variant}>
          <MultiSelect id={`chip-${variant}`} label={`chipVariant="${variant}"`} chipsInside options={opts} selected={selected} onChange={setSelected} onUpdateOrder={() => {}} chipVariant={variant} disableAddNew hideAutosaveHint />
        </MultiSelectProvider>
      ))}
    </div>
  );
};

// Every chip look of the chosen values on the page surface. `info` stays the default (blue in every theme); `primary` is the brand colour (violet in runzero); `neutral` and `muted` stay readable in dark mode where `default` (card fill) vanishes.
export const ChipVariants: Story = {
  args: {} as any,
  render: () => <ChipVariantsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByTitle('Design').length).toBe(chipVariantNames.length));
  },
};

export const ChipsAsCol: Story = {
  args: {
    ...defaultArgs,
    chipsAsCol: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const NoSearchExample: Story = {
  args: {
    ...defaultArgs,
    placeholder: 'Select job type...',
    chipsInside: true,
    disableSearch: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
        disableSearch
      />
    );
  },
};

export const NoAddNew: Story = {
  args: {
    ...defaultArgs,
    disableAddNew: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const NoCheckbox: Story = {
  args: {
    ...defaultArgs,
    disableCheckbox: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const HideCheckedItems: Story = {
  args: {
    ...defaultArgs,
    hideCheckedItems: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const DecentToggle: Story = {
  args: {
    ...defaultArgs,
    decentToggle: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const SelectedOptionsAsText: Story = {
  args: {
    ...defaultArgs,
    selectedOptionsAsText: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const Sheet: Story = {
  args: {
    ...defaultArgs,
    useSheet: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};
export const DragAndDrop: Story = {
  args: {
    ...defaultArgs,
    useDragAndDrop: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const DragAndDropAndSheet: Story = {
  args: {
    ...defaultArgs,
    useSheet: true,
    useDragAndDrop: true,
    hideCheckedItems: true,
    disableCheckbox: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const RenderItem: Story = {
  args: {
    ...defaultArgs,
    renderItem: (option: MultiSelectOption) => (
      <div className="flex items-center space-x-2 text-left">
        <PlusIcon className="min-w-[16px] h-4" />
        <span>{option.label}</span>
      </div>
    ),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const RenderToggleItems: Story = {
  args: {
    ...defaultArgs,
    useSheet: true,
    useDragAndDrop: true,
    onlyCheckOnCheckbox: true,
    orderCheckedOnTop: true,
    renderItem: (option: MultiSelectOption, selected: string[]) => {
      const isSelected = selected.includes(option.id);

      return (
        <Spacing alignItems="center" justifyContent="between" className="w-full">
          <span className="font-medium max-w-xs">{option.label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroup type="single" size="sm" disabled={!isSelected}>
                  <ToggleGroupItem value="daily" aria-label="Toggle daily">
                    Daily
                  </ToggleGroupItem>
                  <ToggleGroupItem value="weekly" aria-label="Toggle weekly">
                    Weekly
                  </ToggleGroupItem>
                  <ToggleGroupItem value="monthly" aria-label="Toggle monthly">
                    Monthly
                  </ToggleGroupItem>
                </ToggleGroup>
              </TooltipTrigger>
              <TooltipContent>
                {!isSelected ? (
                  <p>
                    Please select <strong>{option.label}</strong> first
                  </p>
                ) : (
                  <p>
                    Rate your skill <strong>{option.label}</strong>
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Spacing>
      );
    },
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
        renderItem={(option) => (args as any)?.renderItem(option, selected)}
      />
    );
  },
};

const ToggleItem = ({
  option,
  selected,
  setSelected,
}: {
  option: MultiSelectOption;
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
}) => {
  const isSelected = selected.includes(option.id);
  const [toggleValue, setToggleValue] = useState(isSelected ? 'weekly' : '');

  const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({
    daily: null,
    weekly: null,
    monthly: null,
  });

  const updateDataState = (newValue: string) => {
    Object.keys(itemRefs.current).forEach((key) => {
      if (key === newValue) {
        itemRefs.current[key]?.setAttribute('data-state', 'on');
      } else {
        itemRefs.current[key]?.setAttribute('data-state', 'off');
      }
    });
  };

  const handleToggleChange = (value: string) => {
    if (value) {
      setToggleValue(value);
      setSelected((prevSelected) => {
        if (!prevSelected.includes(option.id)) {
          return [...prevSelected, option.id];
        }
        return prevSelected;
      });
    } else {
      setToggleValue('');
      setSelected((prevSelected) => prevSelected.filter((id) => id !== option.id));
    }
  };

  useEffect(() => {
    if (isSelected) {
      setToggleValue((prevValue) => (prevValue ? prevValue : 'weekly'));
    } else {
      setToggleValue('');
    }
  }, [isSelected]);

  useEffect(() => {
    updateDataState(toggleValue);
  }, [toggleValue]);

  return (
    <Spacing alignItems="center" justifyContent="between" className="w-full">
      <span className="font-medium max-w-xs">{option.label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroup
              className="font-regular"
              type="single"
              size="sm"
              value={toggleValue}
              onValueChange={(value) => handleToggleChange(value)}
            >
              <Spacing gap="2">
                <ToggleGroupItem value="daily" aria-label="Toggle daily" ref={(el) => (itemRefs.current['daily'] = el)}>
                  <span className={cn({ 'text-text-subtle': !isSelected })}>Daily</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="weekly"
                  aria-label="Toggle weekly"
                  ref={(el) => (itemRefs.current['weekly'] = el)}
                >
                  <span className={cn({ 'text-text-subtle': !isSelected })}>Weekly</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="monthly"
                  aria-label="Toggle monthly"
                  ref={(el) => (itemRefs.current['monthly'] = el)}
                >
                  <span className={cn({ 'text-text-subtle': !isSelected })}>Monthly</span>
                </ToggleGroupItem>
              </Spacing>
            </ToggleGroup>
          </TooltipTrigger>
          <TooltipContent>
            {!isSelected ? (
              <p>
                Please select <strong>{option.label}</strong> first
              </p>
            ) : (
              <p>
                Rate your skill <strong>{option.label}</strong>
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Spacing>
  );
};

export const RenderToggleItemsWithAutoToggle: Story = {
  args: {
    ...defaultArgs,
    useSheet: true,
    useDragAndDrop: true,
    onlyCheckOnCheckbox: true,
    orderCheckedOnTop: true,
    renderItem: (option: MultiSelectOption, selected: string[], setSelected: Dispatch<SetStateAction<string[]>>) => (
      <ToggleItem option={option} selected={selected} setSelected={setSelected} />
    ),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    const { setSelected } = context.setSelected;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
        renderItem={(option) => (args as any)?.renderItem(option, selected, setSelected)}
      />
    );
  },
};

export const Filter: Story = {
  args: {
    ...defaultArgs,
    id: 'filter',
    useSheet: true,
    useDragAndDrop: true,
    onlyCheckOnCheckbox: true,
    orderCheckedOnTop: true,
    useSheetText: 'Filter items',
    useSheetTrigger: <ListFilter className="w-4 h-4" />,
    disableCheckAll: true,
    disableAddNew: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const HighlightChipById: Story = {
  args: {
    ...defaultArgs,
    selected: [Support.DESIGN, Support.DEVELOPMENT, Support.OTHER, Support.BOTH],
    highlightChipById: [Support.DESIGN, Support.BOTH],
    chipVariant: 'default',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;

    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const WithIcon: Story = {
  args: {
    ...defaultArgs,
    placeholder: 'Filter items',
    icon: <ListFilter className="w-4 h-4 mr-2 text-text-subtle" />,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;

    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const PersistentMode: Story = {
  args: {
    ...defaultArgs,
    mode: 'persistent',
    label: 'Filter Items',
    placeholder: 'Search items...',
    description: 'Changes require explicit Apply to save',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const PersistentModeWithSheet: Story = {
  args: {
    ...defaultArgs,
    mode: 'persistent',
    useSheet: true,
    label: 'Filter Items',
    placeholder: 'Search items...',
    description: 'Changes require explicit Apply to save',
    applyButtonText: 'Save Changes',
    cancelButtonText: 'Discard',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const PersistentModeChipsInside: Story = {
  args: {
    ...defaultArgs,
    mode: 'persistent',
    chipsInside: true,
    label: 'Select Technologies',
    placeholder: 'Search technologies...',
    disableAddNew: true,
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const PersistentModeWithCustomCallbacks: Story = {
  args: {
    ...defaultArgs,
    mode: 'persistent',
    label: 'Select Skills',
    placeholder: 'Search skills...',
    onCancel: () => console.log('User cancelled changes'),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={(newSelected) => {
          handleChange(newSelected);
          console.log('Applied changes:', newSelected);
        }}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

// Without a MultiSelectProvider (the path a single listing field uses): the field keeps its own open state. The context is reset to none here, so the story shows that path although the other stories sit inside the provider.
const StandaloneDemo = () => {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <MultiSelectContext.Provider value={null}>
      <MultiSelect
        id="categories"
        label="Categories"
        placeholder="Search categories"
        options={[
          { label: 'Developer tools', id: 'dev' },
          { label: 'Web', id: 'web' },
          { label: 'Data', id: 'data' },
        ]}
        selected={selected}
        onChange={setSelected}
      />
    </MultiSelectContext.Provider>
  );
};

export const Standalone: Story = {
  render: () => <StandaloneDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Categories' });
    await expect(canvas.getAllByRole('combobox')).toHaveLength(1);
    await userEvent.click(field);
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.keyboard('web');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('option', { name: /Web/ })).toHaveAttribute('aria-checked', 'true'));
    await userEvent.keyboard('{Escape}');
    await expect(field).toHaveValue('');
  },
};

// The field sits at the bottom of a short view, so the list opens upwards. The card keeps its full height and its surface (it hangs from `bottom`, not from `top` as well).
const OpensUpDemo = () => {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <MultiSelectContext.Provider value={null}>
      <div style={{ height: 'calc(100vh - 32px)', display: 'flex', alignItems: 'flex-end' }}>
        <div className="w-full">
          <MultiSelect
            id="opens-up"
            label="Categories"
            placeholder="Search categories"
            options={['Developer tools', 'Web', 'Data', 'Design', 'Search', 'Security', 'Cloud', 'Files'].map((label) => ({ label, id: label }))}
            selected={selected}
            onChange={setSelected}
          />
        </div>
      </div>
    </MultiSelectContext.Provider>
  );
};

export const OpensUpwards: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <OpensUpDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Categories' }));
    const list = await canvas.findByRole('listbox', { name: 'Categories' });
    const card = list.closest('.card') as HTMLElement;
    await waitFor(() => expect(card.getBoundingClientRect().height).toBeGreaterThan(list.getBoundingClientRect().height - 1));
    expect(getComputedStyle(card).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

export const KeyboardNavigationDemo: Story = {
  args: {
    ...defaultArgs,
    label: 'Keyboard Navigation Demo',
    placeholder: 'Type to search, Tab to navigate...',
    description: 'Try: type "de", ArrowDown to the match, Space or Enter to toggle it, Escape to close. Tab closes the list and moves on to the next control.',
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
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <>
        <div className="mb-4 rounded bg-muted p-4 text-foreground">
          <h3 className="font-semibold mb-2">Keyboard Shortcuts:</h3>
          <ul className="text-sm space-y-1">
            <li>
              • <kbd>Tab</kbd> or <kbd>↓</kbd> from search: Focus first item
            </li>
            <li>
              • <kbd>↑</kbd> <kbd>↓</kbd>: Navigate items
            </li>
            <li>
              • <kbd>Space</kbd> or <kbd>Enter</kbd>: Toggle selection
            </li>
            <li>
              • <kbd>Tab</kbd> from item: Return to search
            </li>
            <li>
              • <kbd>Esc</kbd>: Close dropdown
            </li>
          </ul>
        </div>
        <MultiSelect {...args} selected={selected} onChange={handleChange} onUpdateOrder={handleUpdateOrder} />
      </>
    );
  },
};

export const WithCustomAction: Story = {
  args: {
    ...defaultArgs,
    customAction: (
      <Button size="sm" variant="ghost" className="px-2 text-sm">
        <PlusIcon className="h-3 w-3 mr-1" />
        Custom Action
      </Button>
    ),
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <MultiSelect
        {...args}
        selected={selected}
        onChange={handleChange}
        options={options}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  },
};

export const SheetWithDisabledBackdropClose: Story = {
  args: {
    ...defaultArgs,
    useSheet: true,
    disableBackdropClose: true,
    mode: 'persistent',
    truncateChips: true,
    label: 'Sheet with Disabled Backdrop Close',
    description:
      "Clicking outside won't close. Apply/Cancel saves changes but keeps sheet open. Use Close or X to close.",
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <div>
        <p className="mb-4 text-sm text-text-subtle">
          • Clicking outside won't close the sheet
          <br />
          • Escape key still closes the sheet
          <br />
          • Apply/Cancel saves changes but keeps sheet open
          <br />• Use the Close or X button to close the sheet
        </p>
        <MultiSelect {...args} selected={selected} onChange={handleChange} onUpdateOrder={handleUpdateOrder} />
      </div>
    );
  },
};

export const DisableMaxChips = {
  args: {
    ...defaultArgs,
    label: 'Skills with Max Chip Display',
    description: 'Compare default (max 3 chips) vs unlimited chip display',
    id: 'disable-max-chips-demo',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;

    return (
      <div className="space-y-4">
        <p className="text-sm text-text-subtle">
          Select multiple items to see the difference between default chip limit and unlimited display
        </p>
        <div className="space-y-8">
          <div>
            <h3 className="mb-2 font-medium">Default Behavior (Max 3 Chips)</h3>
            <MultiSelect {...args} selected={selected} onChange={handleChange} onUpdateOrder={handleUpdateOrder} />
            <p className="mt-2 text-sm text-text-subtle">Shows maximum 3 chips with "+X items" indicator for overflow</p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">With disableMaxChips=true</h3>
            <MultiSelect
              {...args}
              id="disable-max-chips-demo-unlimited"
              selected={selected}
              onChange={handleChange}
              onUpdateOrder={handleUpdateOrder}
              disableMaxChips={true}
            />
            <p className="mt-2 text-sm text-text-subtle">Shows all selected chips without limit</p>
          </div>
        </div>
      </div>
    );
  },
};

export const ChipsInsideWithMaxLimit = {
  args: {
    ...defaultArgs,
    label: 'Chips Inside Input',
    chipsInside: true,
    description: 'Demonstration of chip limit when chips are rendered inside the input',
    id: 'chips-inside-max-demo',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;

    return (
      <div className="space-y-8">
        <div>
          <h3 className="mb-2 font-medium">Chips Inside - Limited (Default)</h3>
          <MultiSelect {...args} selected={selected} onChange={handleChange} onUpdateOrder={handleUpdateOrder} />
        </div>

        <div>
          <h3 className="mb-2 font-medium">Chips Inside - Unlimited</h3>
          <MultiSelect
            {...args}
            id="chips-inside-max-demo-unlimited"
            selected={selected}
            onChange={handleChange}
            onUpdateOrder={handleUpdateOrder}
            disableMaxChips={true}
          />
        </div>
      </div>
    );
  },
};

export const CustomMaxChipsToShow = {
  args: {
    ...defaultArgs,
    label: 'Custom Chip Limit',
    description: 'Configure how many chips to show before displaying the overflow indicator',
    id: 'custom-max-chips-demo',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;

    return (
      <div className="space-y-4">
        <p className="text-sm text-text-subtle mb-6">Select multiple items to see different chip limits in action</p>

        <div className="space-y-8">
          <div>
            <h3 className="mb-2 font-medium">Show only 1 chip</h3>
            <MultiSelect
              {...args}
              id="max-chips-1"
              selected={selected}
              onChange={handleChange}
              onUpdateOrder={handleUpdateOrder}
              maxChipsToShow={1}
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">Show 2 chips (custom)</h3>
            <MultiSelect
              {...args}
              id="max-chips-2"
              selected={selected}
              onChange={handleChange}
              onUpdateOrder={handleUpdateOrder}
              maxChipsToShow={2}
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">Show 5 chips (custom)</h3>
            <MultiSelect
              {...args}
              id="max-chips-5"
              selected={selected}
              onChange={handleChange}
              onUpdateOrder={handleUpdateOrder}
              maxChipsToShow={5}
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">Chips Inside with maxChipsToShow=2</h3>
            <MultiSelect
              {...args}
              id="max-chips-inside-2"
              selected={selected}
              onChange={handleChange}
              onUpdateOrder={handleUpdateOrder}
              chipsInside={true}
              maxChipsToShow={2}
            />
          </div>
        </div>
      </div>
    );
  },
};

export const Invalid: Story = {
  args: {
    ...defaultArgs,
    id: 'invalid-multiselect',
  } as any,
  render: (args, context) => {
    const { selected } = context.selected;
    const { options } = context.options;
    const { handleChange } = context.onChange;
    const { handleUpdateOrder } = context.onUpdateOrder;
    return (
      <div className="space-y-2">
        <MultiSelect
          {...args}
          selected={selected}
          onChange={handleChange}
          options={options}
          onUpdateOrder={handleUpdateOrder}
          invalid
          ariaDescribedBy="multiselect-job-type-error"
        />
        {/*
          `text-input-foreground-hint-error` (not `text-error`) — the raw `error` swatch is
          below the 4.5:1 AA minimum for body text; `input-foreground-hint-error` is the
          semantic on-surface/hint-text pairing that clears it (mirrors select.stories.tsx's
          `Invalid` story). `aria-describedby` wires this message to the trigger.
        */}
        <p id="multiselect-job-type-error" className="text-sm text-input-foreground-hint-error">
          Please select at least one job type.
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
      <MultiSelectProvider>
        <MultiSelect id="localized" label="Typ" options={[{ id: 'design', label: 'Design' }]} selected={[]} onChange={() => {}} disableAddNew emptyText="Nichts gefunden" />
      </MultiSelectProvider>
    </DesignSystemProvider>
  ),
};

const InvalidValuesDemo = () => {
    const [selected, setSelected] = useState<string[]>(['design', 'retired', 'legacy']);
    return (
      <MultiSelectProvider>
        <MultiSelect
          id="invalid-values"
          label="Job Type"
          options={[
            { id: 'design', label: 'Design' },
            { id: 'development', label: 'Development' },
            { id: 'legacy', label: 'Legacy', invalid: true },
          ]}
          selected={selected}
          onChange={setSelected}
          onUpdateOrder={() => {}}
          disableAddNew
        />
      </MultiSelectProvider>
    );
};

export const InvalidValues: Story = {
  args: {} as any,
  parameters: { docs: { description: { story: 'A single value can be invalid without the whole field being invalid. Mark it with `invalid: true` on the option, `invalidValues` or `isValueInvalid(id)`. A selected id that is not in the options is shown as invalid with its id as label. The chip uses the destructive role and is announced as invalid.' } } },
  render: () => <InvalidValuesDemo />,
};

const SizeSmDemo = () => {
  const [a, setA] = useState<string[]>(['design']);
  const [b, setB] = useState<string[]>(['design', 'development', 'other']);
  const opts = [
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'other', label: 'Other' },
  ];
  return (
    <MultiSelectProvider>
      <div className="flex w-full max-w-[480px] flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <MultiSelect id="sm-a" ariaLabel="Job type, small" size="sm" chipsInside options={opts} selected={a} onChange={setA} onUpdateOrder={() => {}} disableAddNew />
          </div>
          <Button variant="outline" size="sm">
            Button sm
          </Button>
        </div>
        <MultiSelect id="sm-b" ariaLabel="Job type, small, wrapping" size="sm" chipsInside options={opts} selected={b} onChange={setB} onUpdateOrder={() => {}} disableAddNew />
        <MultiSelect id="sm-c" ariaLabel="Job type, default" chipsInside options={opts} selected={a} onChange={setA} onUpdateOrder={() => {}} disableAddNew />
      </div>
    </MultiSelectProvider>
  );
};

// Size sm is as high as Button sm (control-sm token: 32, zero 28): one row with a compact search input and toggle. Chips inside wrap with a tight gap.
export const SizeSm: Story = {
  args: {} as any,
  render: () => <SizeSmDemo />,
};

const MaxSelectedDemo = () => {
  const [selected, setSelected] = useState<string[]>(['design', 'development']);
  const opts = [
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'other', label: 'Other' },
    { id: 'testing', label: 'Testing' },
  ];
  return (
    <MultiSelectProvider>
      <MultiSelect id="max-selected" label="Job type (at most 2)" options={opts} selected={selected} onChange={setSelected} onUpdateOrder={() => {}} maxSelected={2} disableAddNew hideAutosaveHint />
    </MultiSelectProvider>
  );
};

// With `maxSelected` the unchosen options are disabled once the limit is reached and a hint says why. Check All is hidden, Uncheck All stays. `hideAutosaveHint` removes the "(autosave)" text behind Close.
export const MaxSelected: Story = {
  args: {} as any,
  render: () => <MaxSelectedDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByPlaceholderText('Search...'));
    await waitFor(() => expect(canvas.getByText('You can choose up to 2. Remove one to choose another.')).toBeInTheDocument());
  },
};

const LimitStableDemo = () => {
  const [selected, setSelected] = useState<string[]>(['design']);
  const opts = [
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'other', label: 'Other' },
    { id: 'testing', label: 'Testing' },
  ];
  return (
    <MultiSelectProvider>
      <MultiSelect id="limit-stable" label="Job type (at most 2)" options={opts} selected={selected} onChange={setSelected} onUpdateOrder={() => {}} maxSelected={2} disableAddNew hideAutosaveHint />
    </MultiSelectProvider>
  );
};

// The limit state: the limit text sits in a footer below the options and holds its place before the limit, so no option row moves when the limit is reached or released. The play function measures the rows.
export const MaxSelectedLimitStaysPut: Story = {
  args: {} as any,
  render: () => <LimitStableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByPlaceholderText('Search...'));
    // Measured from the top of the list, so the open animation and a moved field do not count; only the rows moving inside the list does.
    const rowTop = (name: string) => canvas.getByText(name, { selector: 'label' }).closest('[cmdk-item]')!.getBoundingClientRect().top - canvasElement.querySelector('[role="listbox"]')!.getBoundingClientRect().top;
    const hint = () => canvasElement.querySelector<HTMLElement>('[data-slot="multiselect-limit-hint"]')!;
    await waitFor(() => expect(canvas.getByText('Development', { selector: 'label' })).toBeInTheDocument());
    // the list grows in over 300 ms when it opens
    const settle = () => new Promise((done) => setTimeout(done, 600));
    await settle();
    const before = rowTop('Testing');
    await expect(hint().getAttribute('aria-hidden')).toBe('true');
    // reach the limit
    await userEvent.click(canvas.getByText('Development', { selector: 'label' }));
    await waitFor(() => expect(hint().getAttribute('aria-hidden')).toBeNull());
    await settle();
    await expect(rowTop('Testing')).toBe(before);
    await expect(canvas.getByText('You can choose up to 2. Remove one to choose another.')).toBeInTheDocument();
    // release it
    await userEvent.click(canvas.getByText('Development', { selector: 'label' }));
    await waitFor(() => expect(hint().getAttribute('aria-hidden')).toBe('true'));
    await settle();
    await expect(rowTop('Testing')).toBe(before);
  },
};

const ChipFocusDemo = () => {
  const [selected, setSelected] = useState<string[]>(['design', 'development', 'other']);
  const opts = [
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'other', label: 'Other' },
  ];
  return (
    <MultiSelectProvider>
      <MultiSelect id="chip-focus" label="Job type" options={opts} selected={selected} onChange={setSelected} onUpdateOrder={() => {}} disableAddNew hideAutosaveHint />
    </MultiSelectProvider>
  );
};

// Removing a chip with its remove button and Enter keeps focus in the field: next chip, else the previous one, else the search input.
export const RemoveChipKeepsFocus: Story = {
  args: {} as any,
  render: () => <ChipFocusDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remove Development' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Remove Other' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Remove Design' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByPlaceholderText('Search...')).toHaveFocus());
  },
};

// An empty result names the search: No matches for "zzz". It is announced and the text can be replaced with `emptyText`.
export const EmptyResult: Story = {
  args: {} as any,
  render: () => <ChipFocusDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Search...'), 'zzz');
    await waitFor(() => expect(canvas.getAllByText('No matches for "zzz"').length).toBeGreaterThan(0));
  },
};

const ClearSearchOnSelectDemo = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const opts = [
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
    { id: 'devops', label: 'DevOps' },
    { id: 'testing', label: 'Testing' },
  ];
  return (
    <MultiSelectProvider>
      <MultiSelect id="clear-search" label="Job type" options={opts} selected={selected} onChange={setSelected} onUpdateOrder={() => {}} clearSearchOnSelect disableAddNew />
    </MultiSelectProvider>
  );
};

// `clearSearchOnSelect`: after a pick the search text is cleared, so the whole list is back for the next one. Type "dev", pick an option, the list shows all options again.
export const ClearSearchOnSelect: Story = {
  args: {} as any,
  render: () => <ClearSearchOnSelectDemo />,
};

const OutsideLabelDemo = () => {
  const [selected, setSelected] = useState<string[]>(['anna', 'ben']);
  const people = [
    { id: 'anna', label: 'Anna Becker' },
    { id: 'ben', label: 'Tobias Lindner' },
    { id: 'carla', label: 'Sarah Tran' },
    { id: 'david', label: 'Jonas Weber' },
    { id: 'eva', label: 'Mia Hofmann' },
  ];
  return (
    <div className="flex w-full max-w-[480px] flex-col gap-1">
      <Label htmlFor="max-share-input">Share with (optional)</Label>
      <MultiSelect
        id="max-share"
        inputId="max-share-input"
        size="sm"
        placeholder="Colleagues"
        options={people}
        selected={selected}
        onChange={setSelected}
        onUpdateOrder={() => {}}
        disableAddNew
        hideAutosaveHint
        maxSelected={3}
      />
      <span className="typography-ui-sm text-text-subtle">{selected.length} selected, up to 3 colleagues</span>
    </div>
  );
};

// A form field: the outside Label names the search input (inputId), the form saves (no "(autosave)"), nothing can be added and at most 3 values can be chosen.
export const OutsideLabel: Story = {
  args: {} as any,
  render: () => <OutsideLabelDemo />,
};
