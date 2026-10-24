import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '../components/ui/drawer';
import { LoadingOverlay } from '../components/ui/loading-overlay';
import { Toast, ToastAction, ToastProvider, ToastViewport } from '../components/ui/toast';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../components/ui/sheet';
import { suppressOutside } from './modal-inert';

// App shell as in a real product: the page lives in a root element, an aria-live status sits deep inside <main> (this defeats Radix aria-hidden).
const Page = ({ children }: { children?: React.ReactNode }) => (
  <>
    <div id="app-root" data-testid="root">
      <header>Top bar</header>
      <main data-testid="main">
        <section>
          <p role="status" aria-live="polite">
            Saved
          </p>
          <button type="button">Open</button>
        </section>
      </main>
    </div>
    <div id="toasts" data-modal-exempt data-testid="toasts">
      <p aria-live="polite">Toast</p>
    </div>
    {children}
  </>
);

const hidden = (el: Element) => el.closest('[inert], [aria-hidden="true"]') !== null;
const inertAncestor = (el: Element) => el.closest('[inert]');

const SheetCase = ({ open, modal }: { open: boolean; modal?: boolean }) => (
  <Page>
    <Sheet open={open} modal={modal}>
      <SheetContent>
        <SheetTitle>Month</SheetTitle>
        <SheetDescription>Details</SheetDescription>
        <button type="button">Inside</button>
      </SheetContent>
    </Sheet>
  </Page>
);

const DialogCase = ({ open, modal }: { open: boolean; modal?: boolean }) => (
  <Page>
    <Dialog open={open} modal={modal}>
      <DialogContent>
        <DialogTitle>Confirm</DialogTitle>
        <DialogDescription>Sure?</DialogDescription>
      </DialogContent>
    </Dialog>
  </Page>
);

const DrawerCase = ({ open, modal }: { open: boolean; modal?: boolean }) => (
  <Page>
    <Drawer open={open} modal={modal}>
      <DrawerContent>
        <DrawerTitle>Filters</DrawerTitle>
        <DrawerDescription>Pick</DrawerDescription>
      </DrawerContent>
    </Drawer>
  </Page>
);

afterEach(() => {
  expect(document.querySelectorAll('[inert]')).toHaveLength(0);
});

describe.each([
  ['Sheet', SheetCase, 'dialog'],
  ['Dialog', DialogCase, 'dialog'],
  ['Drawer', DrawerCase, 'dialog'],
] as const)('%s background while open', (_name, Case, role) => {
  it('makes the app root and main inert while open and restores them on close', () => {
    const { rerender } = render(<Case open={false} />);
    expect(hidden(screen.getByTestId('main'))).toBe(false);

    rerender(<Case open />);
    expect(screen.getByRole(role)).toBeInTheDocument();
    // The root is the ancestor of <main>, so main and the live region inside it are out of the tree.
    expect(inertAncestor(screen.getByTestId('main'))).toBe(screen.getByTestId('root'));
    expect(hidden(screen.getByText('Open'))).toBe(true);
    expect(hidden(screen.getByText('Saved'))).toBe(true);
    // The modal layer and the exempt toast layer stay reachable.
    expect(hidden(screen.getByRole(role))).toBe(false);
    expect(hidden(screen.getByTestId('toasts'))).toBe(false);

    rerender(<Case open={false} />);
    expect(screen.queryByRole(role)).not.toBeInTheDocument();
    expect(hidden(screen.getByTestId('main'))).toBe(false);
    expect(screen.getByTestId('root')).not.toHaveAttribute('inert');
    expect(screen.getByTestId('root')).not.toHaveAttribute('aria-hidden');
  });

  it('leaves the page alone when the layer is not modal', () => {
    render(<Case open modal={false} />);
    expect(screen.getByRole(role)).toBeInTheDocument();
    expect(hidden(screen.getByTestId('main'))).toBe(false);
    expect(screen.getByTestId('root')).not.toHaveAttribute('inert');
  });
});

describe('uses aria-hidden where the browser has no inert', () => {
  it('sets aria-hidden next to the inert attribute and removes both on close', () => {
    const { rerender } = render(<SheetCase open />);
    const supportsInert = 'inert' in HTMLElement.prototype;
    expect(screen.getByTestId('root')).toHaveAttribute('inert');
    if (!supportsInert) expect(screen.getByTestId('root')).toHaveAttribute('aria-hidden', 'true');
    rerender(<SheetCase open={false} />);
    expect(screen.getByTestId('root')).not.toHaveAttribute('inert');
    expect(screen.getByTestId('root')).not.toHaveAttribute('aria-hidden');
  });

  it('keeps an aria-hidden the app set itself', () => {
    const { rerender } = render(
      <Page>
        <div aria-hidden="true" data-testid="decor" />
      </Page>,
    );
    rerender(
      <Page>
        <div aria-hidden="true" data-testid="decor" />
        <Sheet open>
          <SheetContent>
            <SheetTitle>t</SheetTitle>
            <SheetDescription>d</SheetDescription>
          </SheetContent>
        </Sheet>
      </Page>,
    );
    rerender(
      <Page>
        <div aria-hidden="true" data-testid="decor" />
      </Page>,
    );
    expect(screen.getByTestId('decor')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('nested modal layers', () => {
  const Nested = ({ outer, inner }: { outer: boolean; inner: boolean }) => (
    <Page>
      <Dialog open={outer}>
        <DialogContent>
          <DialogTitle>Outer</DialogTitle>
          <DialogDescription>Outer text</DialogDescription>
          <Sheet open={inner}>
            <SheetContent>
              <SheetTitle>Inner</SheetTitle>
              <SheetDescription>Inner text</SheetDescription>
            </SheetContent>
          </Sheet>
        </DialogContent>
      </Dialog>
    </Page>
  );

  it('keeps the background inert until the last layer closes and frees the outer layer when the inner one closes', () => {
    const { rerender } = render(<Nested outer inner={false} />);
    const outer = screen.getByText('Outer').closest('[role="dialog"]') as HTMLElement;
    expect(hidden(screen.getByTestId('main'))).toBe(true);
    expect(hidden(outer)).toBe(false);

    rerender(<Nested outer inner />);
    const inner = screen.getByText('Inner').closest('[role="dialog"]') as HTMLElement;
    expect(hidden(inner)).toBe(false);
    expect(hidden(outer)).toBe(true);
    expect(hidden(screen.getByTestId('main'))).toBe(true);

    rerender(<Nested outer inner={false} />);
    expect(hidden(outer)).toBe(false);
    expect(hidden(screen.getByTestId('main'))).toBe(true);

    rerender(<Nested outer={false} inner={false} />);
    expect(hidden(screen.getByTestId('main'))).toBe(false);
  });
});

describe('LoadingOverlay', () => {
  it('makes the page inert while it blocks and restores it afterwards', () => {
    const { rerender } = render(
      <Page>
        <LoadingOverlay open />
      </Page>,
    );
    expect(hidden(screen.getByTestId('main'))).toBe(true);
    rerender(
      <Page>
        <LoadingOverlay open={false} />
      </Page>,
    );
    expect(hidden(screen.getByTestId('main'))).toBe(false);
  });
});

describe('suppressOutside', () => {
  it('counts overlapping callers so the first undo does not free the page', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div><div id="c"></div>';
    const a = document.getElementById('a') as HTMLElement;
    const b = document.getElementById('b') as HTMLElement;
    const c = document.getElementById('c') as HTMLElement;
    const undoA = suppressOutside([a]);
    const undoB = suppressOutside([b]);
    expect(a).toHaveAttribute('inert');
    expect(b).toHaveAttribute('inert');
    expect(c).toHaveAttribute('inert');
    // Layer A keeps b and c inert, layer B kept a and c inert. Closing B frees a only.
    undoB();
    expect(a).not.toHaveAttribute('inert');
    expect(b).toHaveAttribute('inert');
    expect(c).toHaveAttribute('inert');
    undoA();
    expect(document.querySelectorAll('[inert]')).toHaveLength(0);
    document.body.innerHTML = '';
  });
});

describe('toast viewport while a modal is open', () => {
  const App = ({ open, toast }: { open: boolean; toast: boolean }) => (
    <>
      <div id="app-root">
        <main data-testid="main">
          <p role="status" aria-live="polite">
            Saved
          </p>
          <ToastProvider>
            {toast ? (
              <Toast open>
                <ToastAction altText="Undo the change">Undo</ToastAction>
              </Toast>
            ) : null}
            <ToastViewport />
          </ToastProvider>
        </main>
      </div>
      <Sheet open={open}>
        <SheetContent>
          <SheetTitle>Month</SheetTitle>
          <SheetDescription>Details</SheetDescription>
        </SheetContent>
      </Sheet>
    </>
  );
  const region = () => screen.getByRole('region', { name: /Notifications/, hidden: true });

  it('keeps the Radix region wrapper and its list reachable', () => {
    render(<App open toast />);
    expect(region()).toHaveAttribute('data-modal-exempt');
    expect(hidden(region())).toBe(false);
    expect(screen.getByRole('button', { name: 'Undo', hidden: true }).closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(hidden(screen.getByTestId('main'))).toBe(false);
    // The rest of the page stays inert.
    expect(screen.getByText('Saved')).toHaveAttribute('inert');
  });

  it('keeps a toast that is already open when the sheet opens', () => {
    const { rerender } = render(<App open={false} toast />);
    rerender(<App open toast />);
    expect(hidden(region())).toBe(false);
    rerender(<App open={false} toast />);
    expect(document.querySelectorAll('[inert]')).toHaveLength(0);
  });

  it('keeps a toast that opens after the sheet', () => {
    const { rerender } = render(<App open toast={false} />);
    rerender(<App open toast />);
    expect(hidden(region())).toBe(false);
    expect(hidden(screen.getByRole('button', { name: 'Undo', hidden: true }))).toBe(false);
  });

  it('re-evaluates an exempt element that mounts after the modal opened', async () => {
    document.body.innerHTML = '<div id="shell"><main id="m"><button>Page</button></main></div><div id="modal"></div>';
    const modal = document.getElementById('modal') as HTMLElement;
    const undo = suppressOutside([modal], document.body, { exemptSelector: '[data-modal-exempt]' });
    expect(document.getElementById('shell')).toHaveAttribute('inert');
    const late = document.createElement('div');
    late.setAttribute('data-modal-exempt', '');
    late.innerHTML = '<button>Undo</button>';
    document.getElementById('shell')?.appendChild(late);
    await waitFor(() => expect(late.closest('[inert]')).toBeNull());
    expect(document.getElementById('m')).toHaveAttribute('inert');
    undo();
    expect(document.querySelectorAll('[inert]')).toHaveLength(0);
    document.body.innerHTML = '';
  });

  it('removes a Radix aria-hidden from the exempt chain and not from the page', async () => {
    document.body.innerHTML = '<div id="shell"><main id="m">Page</main><div id="t" data-modal-exempt></div></div><div id="modal"></div>';
    const shell = document.getElementById('shell') as HTMLElement;
    const undo = suppressOutside([document.getElementById('modal') as HTMLElement], document.body, { exemptSelector: '[data-modal-exempt]' });
    await act(async () => {
      [shell, document.getElementById('m') as HTMLElement].forEach((el) => {
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('data-aria-hidden', 'true');
      });
    });
    await waitFor(() => expect(shell).not.toHaveAttribute('aria-hidden'));
    expect(document.getElementById('m')).toHaveAttribute('inert');
    undo();
    document.body.innerHTML = '';
  });

  it('does not let the focus trap take focus back from an exempt element', () => {
    document.body.innerHTML = '<div id="t" data-modal-exempt><button id="b">Undo</button></div><div id="modal"></div>';
    const undo = suppressOutside([document.getElementById('modal') as HTMLElement], document.body, { exemptSelector: '[data-modal-exempt]' });
    const atDocument = vi.fn();
    const atToast = vi.fn();
    document.addEventListener('focusin', atDocument);
    document.getElementById('t')?.addEventListener('focusin', atToast);
    document.getElementById('b')?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(atToast).toHaveBeenCalledTimes(1);
    expect(atDocument).not.toHaveBeenCalled();
    document.removeEventListener('focusin', atDocument);
    undo();
    document.body.innerHTML = '';
  });
});

describe('focus in an emptied exempt element', () => {
  it('returns to the last focused element in the modal', () => {
    document.body.innerHTML = '<div id="t" data-modal-exempt><ol id="list" tabindex="-1"></ol></div><div id="modal"><button id="in">In</button></div>';
    const undo = suppressOutside([document.getElementById('modal') as HTMLElement], document.body, { exemptSelector: '[data-modal-exempt]' });
    document.getElementById('in')?.focus();
    document.getElementById('list')?.focus();
    expect(document.activeElement?.id).toBe('in');
    undo();
    document.body.innerHTML = '';
  });
});
