import type { Meta, StoryObj } from '@storybook/react';

import { ArrowLeftIcon, MoreHorizontalIcon, XIcon } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { Input } from './input';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  size: 'default',
  variant: 'default',
  underline: false,
  icon: null,
  children: <>Button</>,
  disabled: false,
  asChild: false,
} as ButtonProps;

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as ButtonProps,
};
// Icon-only button with a status dot in the corner. The status text joins the accessible name.
export const IconWithStatus: Story = {
  args: { size: 'icon', variant: 'outline', 'aria-label': 'Sync', status: 'success', statusLabel: 'Connected', children: <ArrowLeftIcon aria-hidden="true" /> },
};

export const Small: Story = {
  args: {
    ...defaultArgs,
    size: 'sm',
  } as ButtonProps,
};
export const Medium: Story = {
  args: {
    ...defaultArgs,
    size: 'md',
  } as ButtonProps,
};
export const Large: Story = {
  args: {
    ...defaultArgs,
    size: 'lg',
  } as ButtonProps,
};
export const ExtraLarge: Story = {
  args: {
    ...defaultArgs,
    size: 'xl',
  } as ButtonProps,
};
export const ExtraExtraLarge: Story = {
  args: {
    ...defaultArgs,
    size: '2xl',
  } as ButtonProps,
};

export const FluidFont: Story = {
  args: {
    ...defaultArgs,
    size: 'clamp',
  } as ButtonProps,
};

// Resting border fixed to the Figma "Outlined/Neutral/Default" spec (node 3287:428629):
// `border-form-border-default` (gray/300 light, gray/700 dark) — previously unset, so it
// rendered Tailwind's `currentColor` (near-black text) instead of the intended light
// stroke. View in both Light and Dark (toolbar) to confirm the stroke is visibly lighter
// than the label text in both modes, not a near-black outline.
//
// Hover fill fixed to the Figma "Outlined/Neutral/Hover" spec (node 3287:428797):
// `hover:bg-general-background-hover` (gray/50 light, gray/800 dark). Reviewers: hover
// this story in BOTH Light and Dark (toolbar) — confirm a visible neutral fill appears
// on hover (not `bg-transparent`) and that the border color/width does not change
// between resting and hover.
export const Primary: Story = {
  args: {
    ...defaultArgs,
    variant: 'primary',
  } as ButtonProps,
};
export const Outline: Story = {
  args: {
    ...defaultArgs,
    variant: 'outline',
  } as ButtonProps,
};
export const Ghost: Story = {
  args: {
    ...defaultArgs,
    variant: 'ghost',
  } as ButtonProps,
};

export const Link: Story = {
  args: {
    ...defaultArgs,
    variant: 'link',
    size: 'link',
  } as ButtonProps,
};

export const LinkSmall: Story = {
  args: {
    ...defaultArgs,
    variant: 'link',
    size: 'link-sm',
  } as ButtonProps,
};

export const LinkWithUnderline: Story = {
  args: {
    ...defaultArgs,
    variant: 'link',
    size: 'link',
    underline: true,
  } as ButtonProps,
};

export const Icon: Story = {
  args: {
    ...defaultArgs,
    variant: 'link',
    icon: <ArrowLeftIcon />,
  } as ButtonProps,
};

export const IconOnlySmall: Story = {
  args: {
    ...defaultArgs,
    size: 'icon-sm',
    icon: <ArrowLeftIcon />,
    children: null,
    'aria-label': 'Go back',
  } as ButtonProps,
};
export const IconOnlyMedium: Story = {
  args: {
    ...defaultArgs,
    size: 'icon',
    icon: <ArrowLeftIcon />,
    children: null,
    'aria-label': 'Go back',
  } as ButtonProps,
};
export const IconOnlyLarge: Story = {
  args: {
    ...defaultArgs,
    size: 'icon-lg',
    icon: <ArrowLeftIcon />,
    children: null,
    'aria-label': 'Go back',
  } as ButtonProps,
};
export const IconOnlyExtraLarge: Story = {
  args: {
    ...defaultArgs,
    size: 'icon-xl',
    icon: <ArrowLeftIcon />,
    children: null,
    'aria-label': 'Go back',
  } as ButtonProps,
};
export const IconOnlyExtraExtraLarge: Story = {
  args: {
    ...defaultArgs,
    size: 'icon-2xl',
    icon: <ArrowLeftIcon />,
    children: null,
    'aria-label': 'Go back',
  } as ButtonProps,
};

// Dense list rows (tasks, tags, comments, chat): 28px in the default scale, 24px in zero, glyph 14px. Both pass the 24px target size minimum (WCAG 2.5.8).
export const IconOnlyDense: Story = {
  args: {
    ...defaultArgs,
    variant: 'ghost',
    size: 'icon-xs',
    icon: <XIcon />,
    children: null,
    'aria-label': 'Remove',
  } as ButtonProps,
};

export const DotLeading: Story = {
  args: {
    ...defaultArgs,
    dotLeading: true,
  } as ButtonProps,
};
export const DotLeadingOutline: Story = {
  args: {
    ...defaultArgs,
    variant: 'outline',
    dotLeading: true,
  } as ButtonProps,
};
export const DotLeadingGhost: Story = {
  args: {
    ...defaultArgs,
    variant: 'ghost',
    dotLeading: true,
  } as ButtonProps,
};
export const DotLeadingDestructive: Story = {
  args: {
    ...defaultArgs,
    variant: 'destructive',
    dotLeading: true,
  } as ButtonProps,
};

export const AsChild: Story = {
  args: {
    ...defaultArgs,
    asChild: true,
    children: <span>I am a span element</span>,
  } as ButtonProps,
};

const STATE_VARIANTS = ['default', 'primary', 'destructive', 'outline', 'outline-destructive', 'secondary', 'ghost', 'link'] as const;

/**
 * State model per variant. Hover/active are real pseudo-states (hover the buttons to see them);
 * the "Open" column forces `data-state="open"`, which is what a menu/popover trigger receives and
 * which mirrors the hover look for every variant.
 */
export const States: Story = {
  args: {} as ButtonProps,
  render: () => (
    <div className="grid grid-cols-[120px_repeat(4,max-content)] items-center gap-x-6 gap-y-4 p-6 text-sm text-foreground">
      <span />
      <span className="text-muted-foreground">Rest</span>
      <span className="text-muted-foreground">Open (= hover)</span>
      <span className="text-muted-foreground">Disabled</span>
      <span className="text-muted-foreground">Icon</span>
      {STATE_VARIANTS.map((variant) => (
        <div key={variant} className="contents">
          <span className="text-muted-foreground">{variant}</span>
          <Button variant={variant}>Button</Button>
          <Button variant={variant} data-state="open">
            Button
          </Button>
          <Button variant={variant} disabled>
            Button
          </Button>
          <Button variant={variant} size="icon" aria-label={`${variant} icon button`}>
            <ArrowLeftIcon />
          </Button>
        </div>
      ))}
    </div>
  ),
};

/** `sm` is 13px/500 at 32px, 28 in zero (padding and gap from the button tokens). `control-sm` is an alias of `sm`, `control-md` and `control-lg` follow the theme density vars (zero: 28/32/36). */
export const DenseSizes: StoryObj<typeof Button> = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm">Small</Button>
      <Button variant="outline" size="control-sm">Control sm</Button>
      <Button variant="outline" size="control-md">Control md</Button>
      <Button variant="outline" size="control-lg">Control lg</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { children: 'Save', variant: 'primary', loading: true },
};

export const LoadingVariants: StoryObj<typeof Button> = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary" loading>
        Save
      </Button>
      <Button variant="outline" loading>
        Send
      </Button>
      <Button variant="destructive" loading>
        Delete
      </Button>
      <Button variant="ghost" loading>
        Reload
      </Button>
    </div>
  ),
};

export const WithCount: Story = {
  args: { children: 'Filters', variant: 'outline', count: 3 },
};

// The count is a 20px round pill on every variant outside zero, filled variants keep the on-fill tint.
export const CountVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(['default', 'primary', 'destructive', 'outline', 'secondary', 'ghost'] as const).map((variant) => (
        <Button key={variant} variant={variant} count={variant === 'primary' ? 12 : 3}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

const SIZE_ROWS = [
  { label: 'xs', text: null, icon: 'icon-xs' },
  { label: 'sm', text: 'sm', icon: 'icon-sm' },
  { label: 'default', text: 'default', icon: 'icon' },
  { label: 'lg', text: 'lg', icon: 'icon-lg' },
  { label: 'xl', text: 'xl', icon: 'icon-xl' },
  { label: '2xl', text: '2xl', icon: 'icon-2xl' },
] as const;

/** Text and icon-only button of every size side by side. Each icon size has the height of its text size, so mixed rows line up. Heights are the control tokens: 28, 32, 40, 42, 48 and 56 for 2xl (zero: 24, 28, 32, 36, 40, 48). Use the theme switcher to compare the default scale with zero. */
export const SizeScale: StoryObj<typeof Button> = {
  render: () => (
    <div className="grid grid-cols-[80px_repeat(4,max-content)] items-center gap-x-4 gap-y-3 p-6 text-sm text-foreground">
      <span />
      <span className="text-muted-foreground">Text</span>
      <span className="text-muted-foreground">Icon only</span>
      <span className="text-muted-foreground">Mixed row</span>
      <span />
      {SIZE_ROWS.map((row) => (
        <div key={row.label} className="contents">
          <span className="text-muted-foreground">{row.label}</span>
          {row.text ? <Button variant="outline" size={row.text}>Button</Button> : <span className="text-muted-foreground">none</span>}
          <Button variant="outline" size={row.icon} aria-label={`Icon ${row.label}`}>
            <ArrowLeftIcon />
          </Button>
          <div className="flex items-center gap-2">
            {row.text ? <Button variant="outline" size={row.text}>Edit</Button> : null}
            <Button variant="ghost" size={row.icon} aria-label={`More ${row.label}`}>
              <MoreHorizontalIcon />
            </Button>
          </div>
          <span />
        </div>
      ))}
    </div>
  ),
};

/** Link variant: unpadded by default so it reads as inline text. `padded` keeps the horizontal padding of the size, for a link button next to other buttons in a toolbar or group. */
export const LinkPadded: StoryObj<typeof Button> = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 text-sm text-foreground">
      <p>
        Inline: read the <Button variant="link" size="sm">docs</Button> before you start.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Save</Button>
        <Button variant="link" size="sm" padded>Cancel</Button>
        <Button variant="link" size="sm" padded>Reset</Button>
      </div>
      <div role="toolbar" aria-label="Row actions" className="flex items-center gap-1">
        <Button variant="ghost" size="sm">Edit</Button>
        <Button variant="link" size="sm" padded>Details</Button>
        <Button variant="ghost" size="icon-sm" aria-label="More">
          <MoreHorizontalIcon />
        </Button>
      </div>
    </div>
  ),
};

/** `size="inline"` is for a link button inside running text. It looks like a link by default (link colour, underline), inherits font size, weight and line height of the paragraph (a `text-*` or `font-*` class you pass always wins), has no border and no fixed height, so the box is the text line. The 24px target (WCAG 2.5.8) is a centered hit area that is at most 8px taller than the line, so it never covers the lines or controls around it. Use it instead of `size="sm"` with `h-auto`. Use `sm` for a link button in a toolbar or button group. Hover changes colour and underline thickness only, the text never reflows. */
export const LinkInline: StoryObj<typeof Button> = {
  render: () => (
    <div className="flex max-w-reading flex-col gap-4 p-6 text-base text-foreground">
      <p className="m-0">
        Read the <Button variant="link" size="inline" underline>documentation</Button> before you start, or ask in the <Button variant="link" size="inline" underline>community forum</Button>. Your data is handled as described in the <Button variant="link" size="inline" underline>privacy policy</Button>.
      </p>
      <p className="m-0 text-sm">
        The same size in a smaller paragraph: <Button variant="link" size="inline" underline>terms of use</Button>.
      </p>
    </div>
  ),
};

/** Tight line height: a 14px label with a 14px line (consent checkbox next to a form field). The box stays one line high, the hit area grows to at most 22px and does not reach the input above or below. */
export const LinkInlineTightLine: StoryObj<typeof Button> = {
  render: () => (
    <div className="flex max-w-reading flex-col gap-2 p-6 text-foreground">
      <label className="flex items-start gap-2 text-sm leading-[14px]">
        <input type="checkbox" className="mt-0" />
        <span>
          I accept the <Button variant="link" size="inline">terms of use</Button> and the <Button variant="link" size="inline">privacy policy</Button>.
        </span>
      </label>
      <Input aria-label="Name" />
    </div>
  ),
};

/** Type classes of the consumer win over the inherited type. */
export const LinkInlineTypeOverride: StoryObj<typeof Button> = {
  render: () => (
    <p className="m-0 max-w-reading p-6 text-base text-foreground">
      Body text with a <Button variant="link" size="inline" className="text-sm font-medium">smaller medium link</Button> and an <Button variant="link" size="inline">inherited link</Button>.
    </p>
  ),
};
