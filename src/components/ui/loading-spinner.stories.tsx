import type { Meta, StoryObj } from '@storybook/react';

import { LoadingSpinner, LoadingSpinnerProps } from './loading-spinner';

const meta = {
  id: 'primitives-loadingspinner',
  title: 'Primitives · Display/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Diameter + ring thickness: sm=16px, default=48px (unchanged legacy size), lg=64px, xl=96px.',
      defaultValue: 'default',
    },
    tone: {
      control: { type: 'select' },
      options: ['default', 'inverse', 'destructive'],
      description:
        '`default` (brand) for use on a neutral surface, `inverse` for use on a solid brand-color surface (e.g. inside a filled primary Button), `destructive` for a retry-after-error loading state.',
      defaultValue: 'default',
    },
    label: {
      control: { type: 'text' },
      description: 'Accessible name announced via aria-label while the spinner is visible. Defaults to "Loading".',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'LoadingSpinner is a self-announcing status indicator: it renders `role="status" aria-live="polite" aria-label` (default label "Loading") on its own root, unlike Skeleton (which is a purely visual tile that a composing component must wrap in its own live region). No dedicated component spec exists for this primitive in the Figma "GetITDone-Basic" library — see the LOADSPIN-FIGMA-01 note in loading-spinner.tsx — so this aligns the existing ring visual to design tokens and to Material\'s canonical circular-progress-indicator anatomy (subtle track + high-emphasis active indicator) instead of fabricating a Figma-driven redesign.',
      },
    },
  },
} satisfies Meta<LoadingSpinnerProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <LoadingSpinner size="sm" label="Loading, small" />
      <LoadingSpinner size="default" label="Loading, default" />
      <LoadingSpinner size="lg" label="Loading, large" />
      <LoadingSpinner size="xl" label="Loading, extra large" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <LoadingSpinner tone="default" label="Loading" />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-general-brand-default">
        <LoadingSpinner tone="inverse" size="sm" label="Loading" />
      </div>
      <LoadingSpinner tone="destructive" label="Retrying" />
    </div>
  ),
};

// The common "spinner drawn inside a filled primary Button while an async action is in flight"
// composition — `tone="inverse"` uses `general-brand-on` so the active indicator stays perceivable
// against the solid brand-color button fill (see the tone-alignment note in loading-spinner.tsx).
//
// A11Y (LOADSPIN-A11Y-03): the button already carries its own visible "Saving…" text, which is
// what supplies the button's accessible name via name-from-content. LoadingSpinner's own
// `role="status" aria-live="polite" aria-label` would otherwise fold into that same name-from-
// content computation, producing a duplicated "Saving Saving…" announcement — the ONLY documented
// composition example for the single most common real-world use of this component, so it must
// teach the correct pattern rather than the bug. Fix: `aria-hidden="true"` on the nested spinner
// instance removes it (and its aria-label) from the accessibility tree entirely, so it no longer
// contributes to the button's computed name — the visible "Saving…" text remains the sole,
// unduplicated accessible name. `aria-busy="true"` on the button additionally exposes the
// in-flight state to assistive tech for the duration of the async action.
export const InsideAFilledButton: Story = {
  render: () => (
    <button
      type="button"
      disabled
      aria-busy="true"
      className="inline-flex h-10 items-center gap-2 rounded-default bg-general-brand-default px-4 typography-button-md text-button-foreground-default disabled:opacity-disabled"
    >
      <LoadingSpinner size="sm" tone="inverse" aria-hidden="true" />
      Saving…
    </button>
  ),
};

export const Styles: Story = {
  render: () => (
    <div className="flex items-start gap-8">
      <LoadingSpinner size="sm" />
      <LoadingSpinner variant="line" size="sm" />
      <LoadingSpinner variant="dots" size="sm" />
      <LoadingSpinner variant="dots" supportingText="Loading data..." />
    </div>
  ),
};

export const InlineText: StoryObj<typeof LoadingSpinner> = {
  render: () => <LoadingSpinner size="sm" layout="inline" supportingText="Saving..." />,
};
