import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../components/ui/sheet';

// jsdom runs no CSS animations. Closed layers report a running exit animation so Radix Presence keeps them mounted until `animationend`, as in a browser.
const realComputedStyle = window.getComputedStyle.bind(window);
const endAnimation = (el: Element) => {
  const event = new Event('animationend', { bubbles: true });
  Object.assign(event, { animationName: 'exit' });
  act(() => {
    el.dispatchEvent(event);
  });
};

beforeEach(() => {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
    const style = realComputedStyle(el, pseudo);
    // Live like a browser style object: Radix reads it again when the state changes.
    return new Proxy(style, {
      get: (target, prop) => {
        if (prop === 'animationName') return el.getAttribute('data-state') === 'closed' ? 'exit' : 'none';
        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// The page is everything outside the layer: it is inert while a modal is open.
const pageInert = () => (document.querySelector('main') as HTMLElement).closest('[inert]') !== null;

const Page = ({ children }: { children: React.ReactNode }) => (
  <div id="app-root">
    <main>
      <input aria-label="Search" />
    </main>
    {children}
  </div>
);

const SheetCase = ({ onAfterClose }: { onAfterClose?: () => void }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <Page>
      <button type="button" onClick={() => setOpen(false)}>
        Close from page
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>Open sheet</SheetTrigger>
        <SheetContent onAfterClose={onAfterClose}>
          <SheetTitle>Month</SheetTitle>
          <SheetDescription>Details</SheetDescription>
          <button type="button" data-testid="inside" onClick={() => setOpen(false)}>
            Done
          </button>
        </SheetContent>
      </Sheet>
    </Page>
  );
};

describe('modal close order', () => {
  it('frees the page as soon as the sheet starts closing, not when its exit animation ends', async () => {
    render(<SheetCase />);
    expect(pageInert()).toBe(true);
    act(() => {
      screen.getByTestId('inside').click();
    });
    // Content and scrim are still mounted (exit animation running), the page is already usable.
    expect(screen.queryByRole('dialog')).not.toBeNull();
    await waitFor(() => expect(pageInert()).toBe(false));
    expect(document.querySelectorAll('[inert]')).toHaveLength(0);
    endAnimation(document.querySelector('[data-modal-overlay]') as Element);
    endAnimation(screen.getByRole('dialog'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('inerts the page again when the sheet reopens before it has unmounted', async () => {
    const Reopen = () => {
      const [open, setOpen] = React.useState(true);
      return (
        <Page>
          <button type="button" onClick={() => setOpen((v) => !v)}>
            Toggle
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle>Month</SheetTitle>
              <SheetDescription>Details</SheetDescription>
            </SheetContent>
          </Sheet>
        </Page>
      );
    };
    render(<Reopen />);
    expect(pageInert()).toBe(true);
    // The toggle button is inert while open, so drive the state through Escape and reopen via the page after the page is free.
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await waitFor(() => expect(pageInert()).toBe(false));
    act(() => {
      screen.getByText('Toggle').click();
    });
    await waitFor(() => expect(pageInert()).toBe(true));
  });
});

describe('onAfterClose', () => {
  it('Sheet: fires once the page is free, the scrim is gone and focus is back on the opener', async () => {
    const seen: Record<string, unknown> = {};
    const onAfterClose = vi.fn(() => {
      seen.inert = document.querySelectorAll('[inert]').length;
      seen.scrim = document.querySelectorAll('[data-modal-overlay]').length;
      seen.focus = document.activeElement?.textContent;
    });
    const Controlled = () => (
      <Page>
        <Sheet>
          <SheetTrigger>Open sheet</SheetTrigger>
          <SheetContent onAfterClose={onAfterClose}>
            <SheetTitle>Month</SheetTitle>
            <SheetDescription>Details</SheetDescription>
            <button type="button">Inside</button>
          </SheetContent>
        </Sheet>
      </Page>
    );
    render(<Controlled />);
    const trigger = screen.getByText('Open sheet');
    trigger.focus();
    act(() => {
      trigger.click();
    });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onAfterClose).not.toHaveBeenCalled();
    endAnimation(document.querySelector('[data-modal-overlay]') as Element);
    // The content is still animating out: the callback must wait for it.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onAfterClose).not.toHaveBeenCalled();
    endAnimation(screen.getByRole('dialog'));
    await waitFor(() => expect(onAfterClose).toHaveBeenCalledTimes(1));
    expect(seen).toEqual({ inert: 0, scrim: 0, focus: 'Open sheet' });
  });

  it('Dialog: fires after the close with the page free', async () => {
    const onAfterClose = vi.fn(() => {
      expect(document.querySelectorAll('[inert]')).toHaveLength(0);
    });
    render(
      <Page>
        <Dialog>
          <DialogTrigger>Open dialog</DialogTrigger>
          <DialogContent onAfterClose={onAfterClose}>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Sure?</DialogDescription>
          </DialogContent>
        </Dialog>
      </Page>,
    );
    act(() => {
      screen.getByText('Open dialog').click();
    });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    endAnimation(document.querySelector('[data-modal-overlay]') as Element);
    endAnimation(screen.getByRole('dialog'));
    await waitFor(() => expect(onAfterClose).toHaveBeenCalledTimes(1));
  });

  it('does not fire while the sheet is open', async () => {
    const onAfterClose = vi.fn();
    render(<SheetCase onAfterClose={onAfterClose} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onAfterClose).not.toHaveBeenCalled();
  });
});

describe('Radix focus guards while a modal is open', () => {
  it('keeps the guards at the body edges out of the inert page', async () => {
    render(
      <Page>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Sure?</DialogDescription>
            <button type="button">First</button>
          </DialogContent>
        </Dialog>
      </Page>,
    );
    await waitFor(() => expect(document.querySelectorAll('[data-radix-focus-guard]').length).toBeGreaterThan(0));
    document.querySelectorAll('[data-radix-focus-guard]').forEach((guard) => {
      expect(guard.hasAttribute('inert')).toBe(false);
      expect(guard.closest('[inert]')).toBeNull();
    });
    // The page itself stays inert.
    expect(pageInert()).toBe(true);
  });

  it('does not stop the focus events of a guard, so the Radix focus scope keeps handling them', async () => {
    render(
      <Page>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Sure?</DialogDescription>
            <button type="button">First</button>
          </DialogContent>
        </Dialog>
      </Page>,
    );
    await waitFor(() => expect(document.querySelectorAll('[data-radix-focus-guard]').length).toBeGreaterThan(0));
    const first = screen.getByText('First');
    first.focus();
    const guard = document.querySelector('[data-radix-focus-guard]') as HTMLElement;
    const seen = vi.fn();
    document.addEventListener('focusin', seen);
    guard.focus();
    document.removeEventListener('focusin', seen);
    expect(seen).toHaveBeenCalled();
    // Radix sends focus from the guard back into the layer: never to the body.
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
});
