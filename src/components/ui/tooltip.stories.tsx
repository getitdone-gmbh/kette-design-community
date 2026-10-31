import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const meta = {
  id: 'primitives-tooltip',
  title: 'Primitives · Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  ],
  args: {} as any,
};

// Figma "Tooltip" spec includes an arrow anatomy (Arrow=Bottom center/Top center/Left/Right/…).
export const WithArrow: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a tooltip</p>
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  ],
  args: {} as any,
};

// Disabled state: a disabled trigger never fires the hover/focus events Radix listens
// for, so TooltipTrigger wraps it in a hoverable/focusable span while the inner control
// keeps its real `disabled` semantics — this is how the design system explains *why* an
// action is disabled.
export const DisabledTrigger: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>
            <Button variant="outline" disabled>
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don&apos;t have permission to save this item</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  ],
  args: {} as any,
};

// The disabled-trigger wrapper is the actual keyboard focus target, so it carries the
// system's standard `focus-visible:ring-2 ring-ring-default` treatment (matching
// Button) plus `role="button" aria-disabled="true"` for assistive tech — instead of
// relying on the browser's default outline, which is exactly what gets clipped away by
// `overflow:hidden` containers (toolbars/cards commonly use these for layout
// containment). Tab into this story to verify the ring still renders inside a clipped
// ancestor.
export const DisabledTriggerInClippedContainer: Story = {
  decorators: [
    (Story) => (
      <div className="w-64 overflow-hidden rounded-default border border-solid border-form-border-default p-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" disabled>
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>You don&apos;t have permission to save this item</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  ],
  args: {} as any,
};

export const LightWithSupportingText: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent tone="light" supportingText="Saves your draft automatically.">
          Autosave
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
