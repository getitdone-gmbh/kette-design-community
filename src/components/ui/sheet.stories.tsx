import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import * as React from 'react';
import { DesignSystemProvider } from './design-system-provider';

import { Button } from './button';
import { CookieConsent } from './cookie-consent';
import { usePreset } from './labels-context';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetNavLink, SheetTitle, SheetTrigger } from './sheet';

const meta = {
  id: 'primitives-sheet',
  title: 'Primitives · Overlays/Sheet',
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

// The zero sheet gives its sections their own inset, so the nav takes the same one as the header; the default sheet pads the whole panel.
const NavDemo = () => {
  const inset = usePreset() === 'zero' ? 'px-5' : '';
  return (
  <div>
    <header className="sticky top-0 z-sticky flex h-12 items-center border-0 border-b border-solid border-hairline bg-background px-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open menu</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Jump to a section.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Sections" className={`flex flex-col py-4 ${inset}`}>
            <SheetNavLink href="#features">Features</SheetNavLink>
            <SheetNavLink href="#pricing">Pricing</SheetNavLink>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
    <section id="features" aria-label="Features" className="h-screen scroll-mt-12">
      <h2>Features</h2>
    </section>
    <section id="pricing" aria-label="Pricing" className="h-screen scroll-mt-12">
      <h2>Pricing</h2>
    </section>
  </div>
);
};

// A navigation sheet: focus lands on the first link when it opens (Shift+Tab reaches the close button, which is first in the tab order). A link with a #hash closes the sheet, waits until the scroll lock is released, scrolls to the section and focuses it. A fixed header needs `scroll-mt-*` on the sections.
export const NavSectionJump: Story = {
  args: {} as any,
  render: () => <NavDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const dialog = await within(document.body).findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('link', { name: 'Features' })).toHaveFocus());
    await userEvent.tab({ shift: true });
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.click(within(dialog).getByRole('link', { name: 'Pricing' }));
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    const pricing = canvas.getByLabelText('Pricing');
    await waitFor(() => expect(pricing).toHaveFocus());
    // The section starts below the sticky header once the smooth scroll has finished.
    await waitFor(() => expect(Math.round(pricing.getBoundingClientRect().top)).toBeGreaterThanOrEqual(47));
    await expect(document.querySelectorAll('[inert]').length).toBe(0);
  },
};

// The nav variant needs no overrides in a list: foreground token, regular weight, underline on hover and for the current page. The cookie bar is open on purpose: its focus listener must not undo `scroll-mt-*` after the jump.
const NavVariantDemo = () => {
  const inset = usePreset() === 'zero' ? 'px-5' : '';
  return (
  <div>
    <header className="sticky top-0 z-sticky flex h-12 items-center border-0 border-b border-solid border-hairline bg-background px-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open menu</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Jump to a section.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Sections" className={`flex flex-col py-4 ${inset}`}>
            <SheetNavLink variant="nav" href="#features" aria-current="location">
              Features
            </SheetNavLink>
            <SheetNavLink variant="nav" href="#pricing">
              Pricing
            </SheetNavLink>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
    <section id="features" aria-label="Features" className="h-screen scroll-mt-12">
      <h2>Features</h2>
    </section>
    <section id="pricing" aria-label="Pricing" className="h-screen scroll-mt-12">
      <h2>Pricing</h2>
    </section>
    <CookieConsent positioning="fixed" title="Cookies" description="Only needed cookies by default." onAccept={() => undefined} onDecline={() => undefined} />
  </div>
  );
};

export const NavVariantWithCookieBar: Story = {
  args: {} as any,
  parameters: { layout: 'fullscreen' },
  render: () => <NavVariantDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const dialog = await within(document.body).findByRole('dialog');
    const link = within(dialog).getByRole('link', { name: 'Pricing' });
    await expect(link).toHaveClass('text-foreground', 'font-normal');
    await userEvent.click(link);
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    const pricing = canvas.getByLabelText('Pricing');
    await waitFor(() => expect(pricing).toHaveFocus());
    // Lands below the 48px sticky header even though the cookie bar is open.
    await waitFor(() => expect(Math.round(pricing.getBoundingClientRect().top)).toBeGreaterThanOrEqual(47));
  },
};

// A read-only sheet: focusOnOpen={false} puts focus on the sheet itself (the dialog container), not on the page behind it.
export const FocusOnOpenFalse: Story = {
  args: {} as any,
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open sheet</Button>
      </SheetTrigger>
      <SheetContent focusOnOpen={false}>
        <SheetHeader>
          <SheetTitle>Time entries</SheetTitle>
          <SheetDescription>Read only.</SheetDescription>
        </SheetHeader>
        <Button variant="outline">First control</Button>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open sheet' }));
    const dialog = await within(document.body).findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    await expect(dialog).toHaveAttribute('tabindex', '-1');
  },
};

// Stress case, not a model: a title this long runs to three lines or more in a narrow sheet. Real titles stay within two lines. What it shows is that the text wraps before the close button, at least 8px between the text and the button.
export const LongTitleNextToClose: Story = {
  args: {} as any,
  render: () => (
    <Sheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Quarterly invoice reconciliation for the Frankfurt subsidiary and partners</SheetTitle>
          <SheetDescription>The title never runs under the close button.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    const title = within(dialog).getByRole('heading');
    const close = dialog.querySelector('[data-slot="sheet-close"]') as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(title);
    const right = Math.max(...Array.from(range.getClientRects()).map((rect) => rect.right));
    await expect(close.getBoundingClientRect().left - right).toBeGreaterThanOrEqual(8);
  },
};
