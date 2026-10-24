import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import * as React from 'react';
import { DesignSystemProvider } from './design-system-provider';

import { Button } from './button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet';

const meta = {
  title: 'Primitives/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as any,
  decorators: [
    (Story) => (
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Are you sure absolutely sure?</SheetTitle>
            <SheetDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    ),
  ],
};

export const Localized: Story = {
  args: {} as any,
  parameters: {
    docs: {
      description: {
        story:
          'Provider locale `de` translates the close button and the loading and error texts. `SheetContent` takes `closeLabel`; `SheetBody` takes `loadingLabel`, `errorText` and `retryText` (the older `errorMessage` and `retryLabel` still work). Props win over the provider.',
      },
    },
  },
  render: () => (
    <DesignSystemProvider locale="de">
      <Sheet open>
        <SheetContent side="right" closeLabel="Seitenleiste zumachen">
          <SheetHeader>
            <SheetTitle>Details</SheetTitle>
            <SheetDescription>Mit eigenem closeLabel.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </DesignSystemProvider>
  ),
};

// Editor width (900) for invoice and quote editors.
export const ExtraLarge: Story = {
  args: {} as any,
  decorators: [
    () => (
      <Sheet defaultOpen>
        <SheetContent side="right" size="xl">
          <SheetHeader>
            <SheetTitle>Invoice editor</SheetTitle>
            <SheetDescription>The xl size is 900px wide and never exceeds the viewport.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    ),
  ],
};

// Padding: outside the zero preset SheetContent pads itself (`p-6`). In zero it does not, because SheetHeader, SheetSection and SheetFooter own their `px-5`.
// This is intentional so the zero anatomy never doubles up. Pass `padded` to override either default.
export const PaddingDefaults: Story = {
  args: {} as any,
  decorators: [
    () => (
      <Sheet defaultOpen>
        <SheetContent side="right" padded>
          <SheetHeader>
            <SheetTitle>Padded content</SheetTitle>
            <SheetDescription>padded is the default outside zero. The close button has a 24px target around the 16px icon.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    ),
  ],
};

const fields = Array.from({ length: 24 }, (_, index) => `Field ${index + 1}`);

// A sheet with a sticky header and footer inside a scrolling panel. Tab to the last field, then Shift+Tab back up: the first field stops below the header and the last above the footer (WCAG 2.4.11).
export const StickyHeaderReverseTab: Story = {
  args: {} as any,
  parameters: { layout: 'fullscreen' },
  decorators: [
    () => (
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent side="right" padded={false} className="overflow-y-auto">
          <SheetHeader className="sticky top-0 z-raised border-0 border-b border-solid border-hairline bg-background p-6">
            <SheetTitle>Edit record</SheetTitle>
            <SheetDescription>The header stays in view while the form scrolls.</SheetDescription>
          </SheetHeader>
          <form className="flex flex-col gap-4 p-6">
            {fields.map((label) => (
              <label key={label} className="flex flex-col gap-1 text-sm">
                {label}
                <input className="h-10 rounded-control border border-solid border-border bg-background px-3" />
              </label>
            ))}
          </form>
          <SheetFooter className="sticky bottom-0 z-raised border-0 border-t border-solid border-hairline bg-background p-6">
            <Button type="button">Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
  ],
};

// Close order in a real browser: the page is free (no inert) while the sheet still slides out, and `onAfterClose` runs only when the sheet, the scrim, the inert state and the scroll lock are gone and focus is back on the opener.
const AfterCloseDemo = () => {
  const [log, setLog] = React.useState('waiting');
  return (
    <div>
      <p data-testid="log">{log}</p>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent
          onAfterClose={() => {
            const scrim = document.querySelectorAll('[data-modal-overlay]').length;
            const inert = document.querySelectorAll('[inert]').length;
            const focus = document.activeElement?.textContent ?? 'none';
            setLog(`after close: scrim ${scrim}, inert ${inert}, focus ${focus}`);
          }}
        >
          <SheetHeader>
            <SheetTitle>Edit month</SheetTitle>
            <SheetDescription>Close the sheet and watch the log.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const OnAfterClose: Story = {
  args: {} as any,
  render: () => <AfterCloseDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open Sheet' }));
    const dialog = await within(document.body).findByRole('dialog');
    await waitFor(() => expect(canvasElement.closest('[inert]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    // The page is free while the sheet is still in the DOM (exit animation).
    await waitFor(() => expect(canvasElement.closest('[inert]')).toBeNull());
    await waitFor(() => expect(canvas.getByTestId('log').textContent).toBe('after close: scrim 0, inert 0, focus Open Sheet'));
    expect(dialog.isConnected).toBe(false);
  },
};
