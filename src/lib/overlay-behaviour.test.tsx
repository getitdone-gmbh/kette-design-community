import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '../components/ui/drawer';
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';

const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 56;

const mockHeights = () => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.dataset.testid === 'bar-header') return HEADER_HEIGHT;
    if (this.dataset.testid === 'bar-footer') return FOOTER_HEIGHT;
    return 0;
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Sticky header and footer inset (WCAG 2.4.11)', () => {
  it('Sheet: a sticky header and footer report their height as scroll padding on the panel', () => {
    mockHeights();
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader data-testid="bar-header" style={{ position: 'sticky', top: 0 }}>
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>Details</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <input aria-label="First" />
          </SheetBody>
          <SheetFooter data-testid="bar-footer" style={{ position: 'sticky', bottom: 0 }}>
            <button type="button">Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    const panel = screen.getByRole('dialog');
    expect(panel.style.getPropertyValue('--sticky-inset-top')).toBe(`${HEADER_HEIGHT}px`);
    expect(panel.style.getPropertyValue('--sticky-inset-bottom')).toBe(`${FOOTER_HEIGHT}px`);
    expect(panel.className).toContain('scroll-pt-[var(--sticky-inset-top,0px)]');
    expect(panel.className).toContain('scroll-pb-[var(--sticky-inset-bottom,0px)]');
    expect(screen.getByLabelText('First').closest('[data-state]')?.className).toContain('scroll-pt-[var(--sticky-inset-top,0px)]');
  });

  it('Sheet: a header in normal flow adds no inset', () => {
    mockHeights();
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader data-testid="bar-header">
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>Details</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').style.getPropertyValue('--sticky-inset-top')).toBe('0px');
  });

  it('Dialog: sticky header and footer set the inset on the content', () => {
    mockHeights();
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="bar-header" style={{ position: 'sticky', top: 0 }}>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Text</DialogDescription>
          </DialogHeader>
          <DialogFooter data-testid="bar-footer" style={{ position: 'fixed', bottom: 0 }}>
            <button type="button">OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const panel = screen.getByRole('dialog');
    expect(panel.style.getPropertyValue('--sticky-inset-top')).toBe(`${HEADER_HEIGHT}px`);
    expect(panel.style.getPropertyValue('--sticky-inset-bottom')).toBe(`${FOOTER_HEIGHT}px`);
    expect(panel.className).toContain('scroll-pt-[var(--sticky-inset-top,0px)]');
  });

  it('Drawer: sticky header and footer set the inset on the content', () => {
    mockHeights();
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader data-testid="bar-header" style={{ position: 'sticky', top: 0 }}>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Text</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter data-testid="bar-footer" style={{ position: 'sticky', bottom: 0 }}>
            <button type="button">OK</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    const panel = screen.getByRole('dialog');
    expect(panel.style.getPropertyValue('--sticky-inset-top')).toBe(`${HEADER_HEIGHT}px`);
    expect(panel.style.getPropertyValue('--sticky-inset-bottom')).toBe(`${FOOTER_HEIGHT}px`);
    expect(panel.className).toContain('scroll-pb-[var(--sticky-inset-bottom,0px)]');
  });

  it('drops the inset when the bar unmounts', () => {
    mockHeights();
    const Example = ({ show }: { show: boolean }) => (
      <Sheet open>
        <SheetContent>
          <SheetTitle>Edit</SheetTitle>
          <SheetDescription>Details</SheetDescription>
          {show && (
            <SheetHeader data-testid="bar-header" style={{ position: 'sticky', top: 0 }}>
              Bar
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>
    );
    const { rerender } = render(<Example show />);
    expect(screen.getByRole('dialog').style.getPropertyValue('--sticky-inset-top')).toBe(`${HEADER_HEIGHT}px`);
    rerender(<Example show={false} />);
    expect(screen.getByRole('dialog').style.getPropertyValue('--sticky-inset-top')).toBe('');
  });
});

const Basic = ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) => (
  <Sheet onOpenChange={onOpenChange}>
    <SheetTrigger>Open sheet</SheetTrigger>
    <SheetContent>
      <SheetTitle>Edit</SheetTitle>
      <SheetDescription>Details</SheetDescription>
      <input aria-label="Name" />
      <SheetClose>Done</SheetClose>
    </SheetContent>
  </Sheet>
);

describe('Sheet focus management', () => {
  it('focuses the panel itself when it holds nothing focusable', async () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Info</SheetTitle>
          <SheetDescription>Read only</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
  });

  it('moves focus into the sheet on open and back to the trigger on close', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Open sheet' });
    await user.click(trigger);
    const panel = await screen.findByRole('dialog');
    expect(panel.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('returns focus to a trigger that lives in a portal', async () => {
    const user = userEvent.setup();
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(
      <Sheet>
        {createPortal(<SheetTrigger>Portal trigger</SheetTrigger>, host)}
        <SheetContent>
          <SheetTitle>Edit</SheetTitle>
          <SheetDescription>Details</SheetDescription>
          <input aria-label="Name" />
        </SheetContent>
      </Sheet>,
    );
    const trigger = screen.getByRole('button', { name: 'Portal trigger' });
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger).toHaveFocus();
    host.remove();
  });

  it('returns focus to the trigger when the trigger is re-created while the sheet is open', async () => {
    const user = userEvent.setup();
    const Example = () => {
      const [generation, setGeneration] = React.useState(0);
      return (
        <Sheet>
          <SheetTrigger key={generation}>Open sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>Details</SheetDescription>
            <button type="button" onClick={() => setGeneration((value) => value + 1)}>
              Re-render trigger
            </button>
          </SheetContent>
        </Sheet>
      );
    };
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    await user.click(await screen.findByRole('button', { name: 'Re-render trigger' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Open sheet' })).toHaveFocus();
  });

  it('returns focus to the opener of a controlled sheet without a trigger', async () => {
    const user = userEvent.setup();
    const Example = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Plain opener
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle>Edit</SheetTitle>
              <SheetDescription>Details</SheetDescription>
              <input aria-label="Name" />
            </SheetContent>
          </Sheet>
        </>
      );
    };
    render(<Example />);
    const opener = screen.getByRole('button', { name: 'Plain opener' });
    await user.click(opener);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(opener).toHaveFocus();
  });

  it('returns focus to a controlled opener that was re-created while the sheet was open', async () => {
    const user = userEvent.setup();
    const Example = () => {
      const [open, setOpen] = React.useState(false);
      const [generation, setGeneration] = React.useState(0);
      return (
        <>
          <button key={generation} type="button" onClick={() => setOpen(true)}>
            Plain opener
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle>Edit</SheetTitle>
              <SheetDescription>Details</SheetDescription>
              <button type="button" onClick={() => setGeneration((value) => value + 1)}>
                Re-render opener
              </button>
            </SheetContent>
          </Sheet>
        </>
      );
    };
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Plain opener' }));
    await user.click(await screen.findByRole('button', { name: 'Re-render opener' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Plain opener' })).toHaveFocus();
  });
});

describe('Phone toast lifts above the bottom bar of an open layer', () => {
  const inset = () => document.documentElement.style.getPropertyValue('--toast-inset-bottom');

  it('Sheet: a sticky footer reports its height to the toast and releases it on close', () => {
    mockHeights();
    const { unmount } = render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>Details</SheetDescription>
          </SheetHeader>
          <SheetFooter data-testid="bar-footer" style={{ position: 'sticky', bottom: 0 }}>
            <button type="button">Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    expect(inset()).toBe(`${FOOTER_HEIGHT}px`);
    unmount();
    expect(inset()).toBe('');
  });

  it('Sheet: a footer in normal flow does not move the toast', () => {
    mockHeights();
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>Details</SheetDescription>
          </SheetHeader>
          <SheetFooter data-testid="bar-footer">
            <button type="button">Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    expect(inset()).toBe('');
  });

  it('Drawer: the footer is docked to the bottom edge, so it lifts the toast', () => {
    mockHeights();
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move</DrawerTitle>
            <DrawerDescription>Details</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter data-testid="bar-footer">
            <button type="button">Submit</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    expect(inset()).toBe(`${FOOTER_HEIGHT}px`);
  });
});

describe('Phone toast rides above a sheet footer that sits at the bottom edge (0.27.13)', () => {
  const inset = () => document.documentElement.style.getPropertyValue('--toast-inset-bottom');
  const VIEWPORT = 844;

  // jsdom has no layout: the footer is placed by hand. `top` is the footer top in the viewport.
  const placeFooter = (top: number, height = FOOTER_HEIGHT) => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'bar-footer') return { top, bottom: top + height, height, left: 0, right: 390, width: 390, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
      return { top: 0, bottom: 0, height: 0, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT });
  };

  const renderSheet = (side: 'right' | 'bottom' = 'right') =>
    render(
      <Sheet open>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>Details</SheetDescription>
          </SheetHeader>
          <SheetFooter data-testid="bar-footer">
            <button type="button">Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

  it('a footer in normal flow at the bottom edge lifts the toast above its top edge, panel padding included', () => {
    // Footer 56px high with 24px panel padding below it: its top is 80px above the viewport bottom.
    placeFooter(VIEWPORT - 80);
    renderSheet();
    expect(inset()).toBe('80px');
  });

  it('works for a sheet from the bottom edge and releases on close', () => {
    placeFooter(VIEWPORT - 80);
    const { unmount } = renderSheet('bottom');
    expect(inset()).toBe('80px');
    unmount();
    expect(inset()).toBe('');
  });

  it('a footer far above the bottom edge (short sheet content scrolled away) does not lift the toast', () => {
    placeFooter(300);
    renderSheet();
    expect(inset()).toBe('');
  });

  it('follows scrolling of the footer', () => {
    placeFooter(VIEWPORT - 80);
    renderSheet();
    expect(inset()).toBe('80px');
    vi.restoreAllMocks();
    placeFooter(VIEWPORT + 200);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(inset()).toBe('');
  });
});
