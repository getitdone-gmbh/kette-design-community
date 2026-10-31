import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';
import { useState } from 'react';

import { Button } from './button';
import { Chip } from './chip';

const meta = {
  id: 'primitives-chip',
  title: 'Primitives · Display/Chip',
  component: Chip,
  tags: ['autodocs'],
  // onRemove renders the remove button, so it must not get an auto action arg
  parameters: { actions: { argTypesRegex: '^on(?!Remove)[A-Z].*' } },
  argTypes: {
    removeLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the remove button. A string or a function of the label. Wins over the provider text.',
    },
    selectedLabel: { control: { type: 'text' }, description: 'Screen reader suffix of a chosen static chip. Wins over the provider text.' },
    invalidLabel: { control: { type: 'text' }, description: 'Screen reader suffix of an invalid static chip. Wins over the provider text.' },
    variant: {
      control: { type: 'select' },
      options: ['default', 'neutral', 'secondary', 'info', 'success', 'destructive', 'warning'],
      description: 'The variant of the chip.',
      defaultValue: 'default',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large', 'control', 'dense'],
      description: 'The size of the chip.',
      defaultValue: 'medium',
    },
    label: {
      control: { type: 'text' },
      description: 'The label of the chip.',
    },
    selected: {
      control: { type: 'boolean' },
      description: 'Persistent chosen/toggled-on state (e.g. an active filter chip).',
      defaultValue: false,
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Dims the chip and blocks pointer interaction (via aria-disabled/data-disabled).',
      defaultValue: false,
    },
    invalid: {
      control: { type: 'boolean' },
      description: 'Forces the destructive/error treatment and sets aria-invalid, e.g. an invalid tag.',
      defaultValue: false,
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

type ChipProps = React.ComponentProps<typeof Chip>;

export const Default: Story = {
  args: {
    label: 'Chip',
    variant: 'default',
    size: 'medium',
  } as ChipProps,
};

export const Secondary: Story = {
  args: {
    label: 'Chip',
    variant: 'secondary',
    size: 'medium',
  } as ChipProps,
};

export const Info: Story = {
  args: {
    label: 'Chip',
    variant: 'info',
    size: 'medium',
  } as ChipProps,
};

export const Success: Story = {
  args: {
    label: 'Chip',
    variant: 'success',
    size: 'medium',
  } as ChipProps,
};

export const Destructive: Story = {
  args: {
    label: 'Chip',
    variant: 'destructive',
    size: 'medium',
  } as ChipProps,
};

/**
 * Reserved for a normal, frequent `priority=high` state. `destructive` is reserved for true
 * errors, so `warning` is the correct hue for high priority.
 */
export const Warning: Story = {
  args: {
    label: 'Chip',
    variant: 'warning',
    size: 'medium',
  } as ChipProps,
};

export const Small: Story = {
  args: {
    label: 'Small Chip',
    variant: 'default',
    size: 'small',
  } as ChipProps,
};

export const Dense: Story = {
  args: {
    label: 'Dense Chip',
    variant: 'default',
    size: 'dense',
  } as ChipProps,
};

export const Medium: Story = {
  args: {
    label: 'Medium Chip',
    variant: 'default',
    size: 'medium',
  } as ChipProps,
};

export const Large: Story = {
  args: {
    label: 'Large Chip',
    variant: 'default',
    size: 'large',
  } as ChipProps,
};

// Static "chosen" chip — no `onClick`, so it stays a non-focusable label. Selection is carried by
// the leading checkmark plus a screen-reader-only "(selected)" cue, not by background color alone
// (see the token-gap note in chip.tsx: the underlying color tokens do not yet distinguish
// "selected" from "hover"/"active").
export const Selected: Story = {
  args: {
    label: 'Chosen tag',
    variant: 'default',
    size: 'medium',
    selected: true,
  } as ChipProps,
};

// Real interactive filter chip: passing `onClick` opts Chip into role="button", a tab stop,
// `aria-pressed`, and Enter/Space activation, exercising the accessible wiring a consumer gets
// for free instead of having to hand-roll it (see MAT-3 / CHIP-A11Y-03).
export const FilterChipToggle: Story = {
  render: (args) => {
    const FilterChip = () => {
      const [selected, setSelected] = useState(Boolean(args.selected));
      return (
        <Chip
          {...args}
          selected={selected}
          onClick={() => setSelected((current) => !current)}
        />
      );
    };
    return <FilterChip />;
  },
  args: {
    label: 'Remote',
    variant: 'default',
    size: 'medium',
  } as ChipProps,
};

// WCAG 2.2 SC 2.5.8 (Target Size Minimum) coverage: `size="small"` + `onClick` is the one
// interactive+small combination the pointer-target rule actually cares about (a static small chip
// is a compact tag/label, not a target). Chip bumps the hit area to a 24px minimum only in this
// interactive case — see the `meetsMinTargetSize` note in chip.tsx (CHIP-MAT-02 / CHIP-A11Y-06).
export const SmallInteractive: Story = {
  render: (args) => {
    const FilterChip = () => {
      const [selected, setSelected] = useState(Boolean(args.selected));
      return (
        <Chip
          {...args}
          selected={selected}
          onClick={() => setSelected((current) => !current)}
        />
      );
    };
    return <FilterChip />;
  },
  args: {
    label: 'Remote',
    variant: 'default',
    size: 'small',
  } as ChipProps,
};

export const Disabled: Story = {
  args: {
    label: 'Chip',
    variant: 'default',
    size: 'medium',
    disabled: true,
  } as ChipProps,
};

export const Invalid: Story = {
  args: {
    label: 'Invalid tag',
    variant: 'default',
    size: 'medium',
    invalid: true,
  } as ChipProps,
};

// Exercises the truncate + title-tooltip anatomy: a long label inside a width-constrained chip
// truncates with an ellipsis and exposes the full text via the native title tooltip on hover.
export const Truncated: Story = {
  args: {
    label: 'A very long chip label that needs to be truncated',
    variant: 'default',
    size: 'medium',
    className: 'max-w-[160px]',
  } as ChipProps,
};

// The remove control is the chip's own `onRemove` slot: a 24 x 24 hit area with the accessible name "Remove <label>".
export const WithRemoveIcon: Story = {
  render: (args) => <Chip {...args} onRemove={() => {}} />,
  args: {
    label: 'Design',
    variant: 'default',
    size: 'medium',
  } as ChipProps,
};

export const OutlineWithDot: StoryObj<typeof Chip> = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip variant="outline" label="Outline" />
      <Chip variant="outline" label="Website relaunch" dotLeading dotColor="#2563eb" />
      <Chip variant="outline" label="Internal" dotLeading dotColor="bg-general-success-default" />
      <Chip variant="outline" label="Selected" selected onClick={() => undefined} />
      <Chip label="Default dot" dotLeading dotColor="#f59e0b" />
    </div>
  ),
};

const FilterChips = () => {
  const [chips, setChips] = useState(['Status: Open', 'Owner: Me', 'Created: last 90 days']);
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((label) => (
        <Chip key={label} size="control" label={label} onRemove={() => setChips((c) => c.filter((x) => x !== label))} />
      ))}
      <Chip size="control" variant="outline" label="Disabled" disabled onRemove={() => undefined} />
    </div>
  );
};

/** Filter chip: control height (28), muted fill, hairline border; the close button is a 24px hit area. */
export const FilterChipControl: Story = {
  render: () => <FilterChips />,
};

// Chip Style axis: Text only (relationship chips) and Product dot (product and project chips).
export const Styles: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip chipStyle="textOnly" variant="info" label="Client" />
        <Chip chipStyle="textOnly" variant="warning" label="Prospect" />
        <Chip chipStyle="textOnly" label="Partner" />
        <Chip chipStyle="textOnly" variant="success" label="Own company" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip chipStyle="productDot" dotColor="bg-product-backoffice-default" label="backoffice" />
        <Chip chipStyle="productDot" dotColor="bg-product-workstream-default" label="workstream" />
        <Chip chipStyle="productDot" dotColor="bg-product-vacancy-default" label="vacancy" />
        <Chip chipStyle="productDot" dotColor="bg-product-jobsearch-default" label="jobsearch" />
        <Chip chipStyle="productDot" dotColor="bg-product-coldcall-default" label="coldcall" />
        <Chip chipStyle="productDot" dotColor="bg-data-project-1" label="Project colour" />
      </div>
    </div>
  ),
};

export const Dashed: Story = { args: { label: 'Add filter', size: 'control', variant: 'outline', dashed: true } as ChipProps };
export const Hit: Story = { args: { label: 'React', size: 'control', variant: 'outline', hit: true } as ChipProps };
export const WithMeta: Story = { args: { label: 'React', size: 'control', variant: 'outline', meta: '3+ yrs' } as ChipProps };
export const WithCount: Story = { args: { label: 'Open', size: 'control', variant: 'outline', count: 5 } as ChipProps };

export const Localized: Story = {
  args: {} as any,
  parameters: { docs: { description: { story: 'Provider locale `de` gives "React entfernen". `removeLabel` takes a string or a function and wins over the provider.' } } },
  render: () => (
    <DesignSystemProvider locale="de">
      <div className="flex gap-3">
        <Chip label="React" onRemove={() => {}} />
        <Chip label="Vue" onRemove={() => {}} removeLabel={(label) => `${label} aus der Liste nehmen`} />
      </div>
    </DesignSystemProvider>
  ),
};

export const LinkMode: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip href="#docs" label="Documentation" />
      <Chip asChild variant="outline" size="control">
        <a href="#changelog">Changelog</a>
      </Chip>
    </div>
  ),
};

export const TintedStatus: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip variant="info" tinted label="Info" />
      <Chip variant="success" tinted label="Success" />
      <Chip variant="warning" tinted label="Warning" />
      <Chip variant="destructive" tinted label="Error" />
    </div>
  ),
};

export const Categorical: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((n) => (
        <Chip key={n} category={n} label={`Category ${n}`} />
      ))}
    </div>
  ),
};

export const Muted: Story = { args: { label: 'Quiet tag', variant: 'muted' } as ChipProps };

export const AvatarFilterSelected: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip size="control" variant="outline" onClick={() => undefined} selected avatar={<span className="inline-block rounded-full bg-chart-1" />} label="Ana" />
      <Chip size="control" variant="outline" onClick={() => undefined} avatar={<span className="inline-block rounded-full bg-chart-2" />} label="Ben" />
    </div>
  ),
};
export const MutedStrongText: Story = { args: { label: 'Quiet tag', variant: 'muted', mutedText: 'default' } as ChipProps };
export const NeutralSelected: Story = { args: { label: 'Neutral', variant: 'neutral', selected: true, onClick: () => undefined } as ChipProps };
export const TintedSelectedWithCount: Story = { args: { label: 'Open', variant: 'info', tinted: true, selected: true, count: 5, onClick: () => undefined } as ChipProps };

export const Weighted: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          ['design-ux', 'Design & UX'],
          ['frontend', 'Frontend'],
          ['data-ai', 'Data & AI'],
          ['project-management', 'Project management'],
          ['business-strategy', 'Business & strategy'],
          ['backend', 'Backend'],
          ['devops-cloud', 'DevOps & Cloud'],
          ['testing-qa', 'Testing & QA'],
          ['fallback', 'Other'],
        ] as const
      ).map(([skill, label]) => (
        <Chip key={skill} chipStyle="weighted" size="small" skill={skill} label={label} weight="weight 3" />
      ))}
    </div>
  ),
};

// Product dot chip with the muted product suffix (Figma Chip Style=Product dot, Show suffix).
export const ProductSuffix: Story = {
  args: { label: 'Vacancy', chipStyle: 'productDot', dotColor: 'bg-product-vacancy-default', suffix: '.zero' } as ChipProps,
};

// Chosen dashed filter chip: brand tint and brand border in the zero preset.
export const DashedSelected: Story = {
  args: { label: 'Remote', size: 'control', variant: 'outline', dashed: true, selected: true, onClick: () => undefined } as ChipProps,
};

// Narrow container: the label truncates with an ellipsis. Dot, icon, count and the remove button stay whole and nothing wraps or spills.
export const NarrowContainer: Story = {
  render: () => (
    <div className="flex w-[120px] flex-col items-start gap-2 border border-dashed border-border p-2">
      <Chip label="Projektbedarf KW 44" />
      <Chip label="In Prüfung seit gestern" count={12} />
      <Chip label="Veröffentlicht und geprüft" onRemove={() => {}} />
    </div>
  ),
};

export const FilledSecondaryText: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['info', 'success', 'warning', 'destructive'] as const).map((variant) => (
        <Chip key={variant} variant={variant} label={variant} meta="3+ yrs" />
      ))}
    </div>
  ),
};

// Height scale next to Button sm: `control` (filter chip, item radius) and `medium` (pill) are control-sm high (32, zero 28). `small` and `dense` are tag sizes below that.
export const HeightScaleWithButton: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip size="control" variant="outline" label="control" onClick={() => undefined} />
      <Chip size="medium" variant="outline" label="medium" onClick={() => undefined} />
      <Button size="sm" variant="outline">
        Button sm
      </Button>
      <Chip size="small" variant="outline" label="small" />
      <Chip size="dense" variant="outline" label="dense" />
    </div>
  ),
};
