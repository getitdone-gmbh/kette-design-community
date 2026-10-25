import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import * as React from 'react';

import { Button } from './button';
import { CookieConsent } from './cookie-consent';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastViewport } from './toast';
import { Toaster } from './toaster';
import { TOAST_INSET_PROPERTY, useToastInset } from '../../lib/toast-inset';
import { useToast } from './use-toast';

const meta = {
  title: 'Primitives/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [
    (Story) => {
      const { toast } = useToast();

      return (
        <>
          <Toaster />
          <Story
            value={{
              toast,
            }}
          />
        </>
      );
    },
  ],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args, context) => {
    const { toast } = context.value;

    return (
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up ',
            description: 'Friday, February 10, 2023 at 5:57 PM',
            action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
          });
        }}
      >
        Add to calendar
      </Button>
    );
  },
};

export const FluidFont: Story = {
  render: (args, context) => {
    const { toast } = context.value;

    return (
      <Button
        variant="outline"
        onClick={() => {
          toast({
            clamp: true,
            title: 'Scheduled: Catch up ',
            description: 'Friday, February 10, 2023 at 5:57 PM',
            action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
          });
        }}
      >
        Add to calendar
      </Button>
    );
  },
};

// Exercises the `destructive` variant end-to-end: the token-driven solid error surface on the
// root, plus the `group-[.destructive]:` hover/focus-visible/active states on the nested
// ToastAction/ToastClose (see the TOAST-TOK-01/02 comments in toast.tsx).
export const Destructive: Story = {
  render: (args, context) => {
    const { toast } = context.value;

    return (
      <Button
        variant="destructive"
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        }}
      >
        Trigger error toast
      </Button>
    );
  },
};

// The action button's disabled state — e.g. while a retry is already in flight.
export const ActionDisabled: Story = {
  render: (args, context) => {
    const { toast } = context.value;

    return (
      <Button
        variant="outline"
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Retrying…',
            description: 'Please wait for the current attempt to finish.',
            action: (
              <ToastAction altText="Try again" disabled>
                Try again
              </ToastAction>
            ),
          });
        }}
      >
        Trigger toast with disabled action
      </Button>
    );
  },
};

export const InverseCompact: Story = {
  name: 'Inverse (compact undo)',
  render: () => (
    <ToastProvider>
      <Toast open variant="inverse" className="w-fit">
        <ToastDescription>Task deleted</ToastDescription>
        <ToastAction altText="Undo the deletion">Undo</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};

const isHiddenFromUsers = (el: Element) => el.closest('[inert], [aria-hidden="true"]') !== null;

const toastRegion = () => document.querySelector('[role="region"][aria-label^="Notifications"]') as HTMLElement;

const OverSheetDemo = ({ toastFirst }: { toastFirst: boolean }) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const fire = () =>
    toast({
      title: 'Task deleted',
      duration: 600000,
      action: <ToastAction altText="Undo the deletion">Undo</ToastAction>,
    });
  return (
    <main>
      {toastFirst ? <Button onClick={fire}>Fire toast</Button> : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button>Open sheet</Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Details</SheetTitle>
            <SheetDescription>The page behind is inert, the toast stays reachable.</SheetDescription>
          </SheetHeader>
          <Button onClick={fire}>Delete task</Button>
          <SheetFooter className="sticky bottom-0 mt-auto border-0 border-t border-solid border-hairline bg-background py-4">
            <Button>Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
};

// A toast fired while a modal Sheet is open stays visible to assistive technology and operable by keyboard (A11Y-WBDASH-013).
export const OverModalSheet: Story = {
  name: 'Over a modal sheet',
  render: () => <OverSheetDemo toastFirst={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
    const dialog = await within(document.body).findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete task' }));
    const undo = await within(document.body).findByRole('button', { name: 'Undo' });
    await waitFor(() => expect(isHiddenFromUsers(toastRegion())).toBe(false));
    expect(isHiddenFromUsers(undo)).toBe(false);
    // The page behind the sheet stays inert.
    expect(isHiddenFromUsers(canvas.getByRole('button', { name: 'Open sheet' }))).toBe(true);
    // F8 moves focus into the toast region and the action is focusable while the sheet is open.
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true }));
    await waitFor(() => expect(toastRegion().contains(document.activeElement)).toBe(true));
    undo.focus();
    await waitFor(() => expect(document.activeElement).toBe(undo));
    // The sheet is still open: focus in the toast does not dismiss it.
    expect(within(document.body).queryByRole('dialog')).not.toBeNull();
    // Dismissing works with the sheet open and leaves the sheet alone.
    await userEvent.click(within(toastRegion()).getByRole('button', { name: /dismiss|close/i }));
    await waitFor(() => expect(within(document.body).queryByRole('button', { name: 'Undo' })).toBeNull());
    expect(within(document.body).queryByRole('dialog')).not.toBeNull();
    // Focus goes back into the sheet, not to the emptied toast list.
    await waitFor(() => expect(within(document.body).getByRole('dialog').contains(document.activeElement)).toBe(true));
  },
};

// A toast that is already open when the sheet opens keeps working.
export const OpenBeforeModalSheet: Story = {
  name: 'Open before a modal sheet',
  render: () => <OverSheetDemo toastFirst />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Fire toast' }));
    await within(document.body).findByRole('button', { name: 'Undo' });
    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
    await within(document.body).findByRole('dialog');
    const undo = within(document.body).getByRole('button', { name: 'Undo' });
    await waitFor(() => expect(isHiddenFromUsers(toastRegion())).toBe(false));
    expect(isHiddenFromUsers(undo)).toBe(false);
    undo.focus();
    await waitFor(() => expect(document.activeElement).toBe(undo));
    expect(within(document.body).queryByRole('dialog')).not.toBeNull();
    await userEvent.click(within(toastRegion()).getByRole('button', { name: /dismiss|close/i }));
    await waitFor(() => expect(within(document.body).queryByRole('button', { name: 'Undo' })).toBeNull());
    await waitFor(() => expect(within(document.body).getByRole('dialog').contains(document.activeElement)).toBe(true));
  },
};

const isPhone = () => window.innerWidth < 640;

// Phones put the toast at the bottom edge. It must stay on screen, below the sheet header with its close button and above the sticky footer action.
const expectPhonePlacement = (toastEl: HTMLElement, headerEl: HTMLElement, actionEl: HTMLElement) => {
  const toastBox = toastEl.getBoundingClientRect();
  expect(toastBox.bottom).toBeLessThanOrEqual(window.innerHeight);
  expect(toastBox.top).toBeGreaterThanOrEqual(headerEl.getBoundingClientRect().bottom);
  expect(toastBox.top).toBeGreaterThan(0);
  expect(toastBox.bottom).toBeLessThanOrEqual(actionEl.getBoundingClientRect().top + 1);
};

// Phone width (390px): the toast sits at the bottom edge instead of the top, so it never covers the sheet header or its close button, and it rides above the sticky footer action.
export const PhoneBottomOverSheet: Story = {
  name: 'Phone, bottom, over a sheet (390px)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <OverSheetDemo toastFirst={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
    const dialog = await within(document.body).findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete task' }));
    const undo = await within(document.body).findByRole('button', { name: 'Undo' });
    const toastEl = undo.closest('li') as HTMLElement;
    await waitFor(() => expect(isHiddenFromUsers(toastRegion())).toBe(false));
    if (!isPhone()) {
      // Desktop is unchanged: bottom right, narrower than the viewport.
      const box = toastEl.getBoundingClientRect();
      expect(box.right).toBeLessThanOrEqual(window.innerWidth);
      expect(box.left).toBeGreaterThan(window.innerWidth / 2);
      return;
    }
    await waitFor(() => expectPhonePlacement(toastEl, within(dialog).getByText('Details'), within(dialog).getByRole('button', { name: 'Save changes' })));
    // The close button of the sheet stays uncovered and reachable.
    const closeBox = within(dialog).getByRole('button', { name: /close/i }).getBoundingClientRect();
    const toastBox = toastEl.getBoundingClientRect();
    expect(toastBox.top).toBeGreaterThan(closeBox.bottom);
  },
};

const SheetFooterDemo = ({ side, sticky }: { side: 'right' | 'bottom'; sticky: boolean }) => {
  const { toast } = useToast();
  return (
    <main>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open sheet</Button>
        </SheetTrigger>
        <SheetContent side={side} className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit month</SheetTitle>
            <SheetDescription>The toast rides above the footer actions on phones.</SheetDescription>
          </SheetHeader>
          <Button variant="outline" onClick={() => toast({ title: 'Month saved', duration: 600000, action: <ToastAction altText="Undo the save">Undo</ToastAction> })}>
            Save month
          </Button>
          <SheetFooter className={sticky ? 'sticky bottom-0 mt-auto bg-background' : 'mt-auto'}>
            <Button>Publish</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Toaster />
    </main>
  );
};

// Phone width: with or without a sticky footer, on the right or the bottom edge, the toast ends above the top of the footer actions of an open sheet.
const phoneFooterPlay: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
  const dialog = await within(document.body).findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save month' }));
  await waitFor(() => expect(within(toastRegion()).getByRole('button', { name: 'Undo' })).toBeTruthy());
  const undo = within(toastRegion()).getByRole('button', { name: 'Undo' });
  const toastEl = undo.closest('li') as HTMLElement;
  const publish = within(dialog).getByRole('button', { name: 'Publish' });
  if (!isPhone()) return;
  await waitFor(() => expect(toastEl.getBoundingClientRect().bottom).toBeLessThanOrEqual(publish.getBoundingClientRect().top + 1));
  await waitFor(() => {
    const box = publish.getBoundingClientRect();
    expect(publish.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))).toBe(true);
  });
};

export const PhoneAboveSheetFooterRight: Story = {
  name: 'Phone, above a sheet footer, side right (390px)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <SheetFooterDemo side="right" sticky={false} />,
  play: phoneFooterPlay,
};

export const PhoneAboveSheetFooterSticky: Story = {
  name: 'Phone, above a sticky sheet footer (390px)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <SheetFooterDemo side="right" sticky />,
  play: phoneFooterPlay,
};

export const PhoneAboveSheetFooterBottom: Story = {
  name: 'Phone, above a sheet footer, side bottom (390px)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <SheetFooterDemo side="bottom" sticky={false} />,
  play: phoneFooterPlay,
};

const BottomDrawerDemo = () => {
  const { toast } = useToast();
  return (
    <main>
      <Drawer>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move goal</DrawerTitle>
            <DrawerDescription>The toast rides above the drawer footer on phones.</DrawerDescription>
          </DrawerHeader>
          <Button
            variant="outline"
            onClick={() => toast({ title: 'Goal moved', duration: 600000, action: <ToastAction altText="Undo the move">Undo</ToastAction> })}
          >
            Move goal
          </Button>
          <DrawerFooter>
            <Button>Submit</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
};

// A Drawer from the bottom: the primary action in its footer stays visible and clickable while a toast is shown (phones).
export const PhoneBottomOverDrawer: Story = {
  name: 'Phone, bottom, over a drawer (390px)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <BottomDrawerDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    const dialog = await within(document.body).findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move goal' }));
    const undo = await within(document.body).findByRole('button', { name: 'Undo' });
    const toastEl = undo.closest('li') as HTMLElement;
    const submit = within(dialog).getByRole('button', { name: 'Submit' });
    if (!isPhone()) return;
    // Wait for the drawer slide-in, then the toast must end above the Submit button.
    await waitFor(() => expect(toastEl.getBoundingClientRect().bottom).toBeLessThanOrEqual(submit.getBoundingClientRect().top + 1));
    // The drawer is still sliding in at first, so wait until the Submit button is hit-testable.
    await waitFor(() => {
      const box = submit.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(submit.contains(hit)).toBe(true);
    });
  },
};

const CookieBannerDemo = () => {
  const { toast } = useToast();
  return (
    <main>
      <Button variant="outline" onClick={() => toast({ variant: 'destructive', title: 'Could not save', description: 'The server did not answer.', duration: 600000 })}>
        Save
      </Button>
      <CookieConsent
        description="We use cookies to measure how the site is used."
        onAccept={() => {}}
        onDecline={() => {}}
        layout="compact"
        closable={false}
      />
    </main>
  );
};

// A fixed cookie banner reports its inset by itself (useToastInset): on phones the error toast ends above the banner, so Accept and Decline stay visible and clickable.
export const PhoneAboveCookieBanner: Story = {
  name: 'Phone, above a cookie banner (390px)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <CookieBannerDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const close = await within(document.body).findByRole('button', { name: /dismiss|close/i });
    const toastEl = close.closest('li') as HTMLElement;
    const banner = within(document.body).getByRole('region', { name: /cookie/i });
    const accept = within(banner).getByRole('button', { name: /accept/i });
    const decline = within(banner).getByRole('button', { name: /decline|reject/i });
    if (!isPhone()) return;
    // Geometry: the toast ends above the banner top and covers neither button.
    await waitFor(() => expect(toastEl.getBoundingClientRect().bottom).toBeLessThanOrEqual(banner.getBoundingClientRect().top + 1));
    for (const button of [accept, decline]) {
      const box = button.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(button.contains(hit)).toBe(true);
    }
    // The dismiss control of the destructive toast stays reachable.
    expect(toastEl.getBoundingClientRect().top).toBeGreaterThan(0);
  },
};

const FocusReturnDemo = () => {
  const { toast } = useToast();
  return (
    <main>
      <Button variant="outline" onClick={() => toast({ title: 'Saved', description: 'Your changes are stored.', duration: 600000 })}>
        Save
      </Button>
    </main>
  );
};

// Focus after a dismissal goes back to the element that had it before the toast, never to the toast list. Escape and the close button are both covered; a swipe ends in the same hand-over.
export const FocusReturnsAfterDismiss: Story = {
  name: 'Focus returns after dismissal',
  render: () => <FocusReturnDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole('button', { name: 'Save' });
    const body = within(document.body);
    await userEvent.click(save);
    const toastEl = (await body.findByRole('button', { name: /dismiss|close/i })).closest('li') as HTMLElement;
    // Move focus from the trigger into the toast (the toaster renders before the page, so a plain Tab would go forward past it), then dismiss with Escape.
    toastEl.focus();
    await waitFor(() => expect(toastEl.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.body.contains(toastEl)).toBe(false));
    await waitFor(() => expect(save).toHaveFocus());
    // Again with the close button.
    await userEvent.click(save);
    const close = await body.findByRole('button', { name: /dismiss|close/i });
    const second = close.closest('li') as HTMLElement;
    close.focus();
    await waitFor(() => expect(second.contains(document.activeElement)).toBe(true));
    await userEvent.click(close);
    await waitFor(() => expect(document.body.contains(second)).toBe(false));
    await waitFor(() => expect(save).toHaveFocus());
    expect(document.activeElement?.closest('ol')).toBeNull();
  },
};

const LateBottomBar = () => {
  const [mounted, setMounted] = React.useState(false);
  return (
    <main>
      <Button variant="outline" onClick={() => setMounted((value) => !value)}>
        {mounted ? 'Remove bar' : 'Add bar'}
      </Button>
      <BarHost mounted={mounted} />
    </main>
  );
};

// The bar renders null first and appears later, as a mobile bottom navigation does while the session loads.
const BarHost = ({ mounted }: { mounted: boolean }) => {
  const barRef = React.useRef<HTMLDivElement>(null);
  useToastInset(barRef);
  return mounted ? (
    <div ref={barRef} role="toolbar" aria-label="Bottom bar" className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-center border-t border-solid border-general-border-default bg-surface-canvas">
      <Button size="sm">Decide</Button>
    </div>
  ) : null;
};

// useToastInset follows the element: a bar that mounts late reports its height, and removing it releases the inset.
export const InsetFromLateBottomBar: Story = {
  name: 'Inset from a bar that mounts late',
  render: () => <LateBottomBar />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inset = () => document.documentElement.style.getPropertyValue(TOAST_INSET_PROPERTY);
    expect(inset()).toBe('');
    await userEvent.click(canvas.getByRole('button', { name: 'Add bar' }));
    await waitFor(() => expect(parseInt(inset(), 10)).toBeGreaterThan(0));
    await userEvent.click(canvas.getByRole('button', { name: 'Remove bar' }));
    await waitFor(() => expect(inset()).toBe(''));
  },
};

const StickyBarBelowFold = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  useToastInset(ref);
  return (
    <main>
      <div style={{ height: 2000 }}>Long content above the bar.</div>
      <div ref={ref} role="toolbar" aria-label="Sticky bar" className="sticky flex h-16 items-center justify-center border-t border-solid border-general-border-default bg-surface-canvas">
        <Button size="sm">Decide</Button>
      </div>
    </main>
  );
};

// A sticky bar with no offset sits in the flow below the fold and reports nothing. Scrolling it to the bottom edge makes it report its height, scrolling away releases the inset.
export const InsetFromStickyBarAfterScrolling: Story = {
  name: 'Inset from a bar that reaches the bottom by scrolling',
  parameters: { layout: 'fullscreen' },
  render: () => <StickyBarBelowFold />,
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('toolbar', { name: 'Sticky bar' });
    const inset = () => document.documentElement.style.getPropertyValue(TOAST_INSET_PROPERTY);
    window.scrollTo(0, 0);
    await waitFor(() => expect(inset()).toBe(''));
    window.scrollTo(0, bar.offsetTop + bar.offsetHeight - window.innerHeight);
    await waitFor(() => expect(parseInt(inset(), 10)).toBeGreaterThan(0));
    window.scrollTo(0, 0);
    await waitFor(() => expect(inset()).toBe(''));
  },
};
