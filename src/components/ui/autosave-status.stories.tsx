import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';

import { AutosaveStatus } from './autosave-status';
import { DesignSystemProvider } from './design-system-provider';

const meta = {
  id: 'patterns-autosave-status',
  title: 'Patterns · Data/Autosave status',
  component: AutosaveStatus,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Quiet save state of an editor or form: saved, saving, unsaved changes, error and offline. A polite live region announces changes without moving focus. Error and offline are announced once, by an assertive alert, and the status itself stays silent.' } },
  },
  argTypes: { state: { control: { type: 'select' }, options: ['saved', 'saving', 'dirty', 'error', 'offline'] } },
  args: { state: 'saved' },
} satisfies Meta<typeof AutosaveStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {};
export const Saving: Story = { args: { state: 'saving' } };
export const Dirty: Story = { args: { state: 'dirty' } };
export const ErrorState: Story = { args: { state: 'error' } };
export const Offline: Story = { args: { state: 'offline' } };
export const CustomLabel: Story = { args: { state: 'saved', label: 'Saved 2 min ago' } };

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['saved', 'saving', 'dirty', 'error', 'offline'] as const).map((state) => (
        <AutosaveStatus key={state} state={state} />
      ))}
    </div>
  ),
};

// Product look of the workload.zero apps: the preset switches the component defaults (set it once at the app root).
export const ZeroPreset: Story = {
  ...AllStates,
  decorators: [
    (Story) => (
      <DesignSystemProvider preset="zero">
        <Story />
      </DesignSystemProvider>
    ),
  ],
};

// UX-030-06: error and offline are announced by the alert only. The status stays a polite live region, and its visible label is hidden from assistive technology in these states, so the message is not read a second time.
export const ErrorAnnouncedOnce: Story = {
  args: { state: 'error', onRetry: () => undefined },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector('[role="status"]') as HTMLElement;
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status.querySelector('[data-status-label]')).toHaveAttribute('aria-hidden', 'true');
    expect(canvasElement.querySelectorAll('[role="alert"]').length).toBe(1);
  },
};

// DR-0300-02: the label hides only inside a top bar narrower than 448px (a container named `topbar`). In a narrow page container that is not a top bar it always shows, so there is never a bare check mark where there is room.
export const InNarrowPageContainer: Story = {
  args: { state: 'saved' },
  render: (args) => (
    <div className="@container border border-solid border-border p-3" style={{ width: 300 }}>
      <AutosaveStatus {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('[data-status-label]') as HTMLElement;
    expect(label).toHaveTextContent('Saved');
    expect(label.getBoundingClientRect().width).toBeGreaterThan(20);
    expect(canvasElement.querySelector('[data-status-trigger]')).not.toBeVisible();
  },
};
