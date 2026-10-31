import * as React from 'react';
import { vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './button';
import { DesignSystemProvider } from './design-system-provider';
import {
  Sheet,
  SheetBanner,
  SheetBody,
  SheetCodeBlock,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetMeta,
  SheetNavLink,
  SheetPath,
  SheetSection,
  SheetTitle,
  type SheetContentProps,
} from './sheet';

const Example = ({ modal, ...content }: Partial<SheetContentProps> & { modal?: boolean; children?: React.ReactNode }) => (
  <Sheet open modal={modal}>
    <SheetContent {...content}>
      <SheetTitle>Edit company</SheetTitle>
      <SheetDescription>Details</SheetDescription>
      {content.children}
    </SheetContent>
  </Sheet>
);

describe('Sheet defaults (unchanged)', () => {
  it('keeps the responsive width, padding and scrim', () => {
    render(<Example />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('w-3/4', 'sm:max-w-3xl', 'p-6', 'gap-4', 'right-0');
    expect(dialog).toHaveAttribute('data-sheet-mode', 'modal');
    expect(dialog).not.toHaveAttribute('aria-busy');
    expect(document.querySelector('.bg-overlay')).toBeInTheDocument();
  });

  it('keeps the left side widths', () => {
    render(<Example side="left" />);
    expect(screen.getByRole('dialog')).toHaveClass('w-3/4', 'left-0');
  });
});

describe('Sheet sizes and modes', () => {
  it.each([
    ['sm', 'w-sheet-sm'],
    ['md', 'w-sheet-md'],
    ['lg', 'w-sheet-lg'],
    ['xl', 'w-sheet-xl'],
  ] as const)('size %s uses the sheet width token', (size, cls) => {
    render(<Example size={size} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass(cls);
    expect(dialog).not.toHaveClass('w-3/4');
  });

  it('push mode has no scrim, stays open on outside interaction and rounds the leading edge', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <>
        <button>Outside</button>
        <Sheet open modal={false} onOpenChange={onOpenChange}>
          <SheetContent mode="push" size="md" padded={false}>
            <SheetTitle>Edit</SheetTitle>
            <SheetDescription>d</SheetDescription>
          </SheetContent>
        </Sheet>
      </>,
    );
    expect(document.querySelector('.bg-overlay')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('rounded-l-surface', 'p-0');
    await user.click(screen.getByText('Outside'));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    // A docked sheet only closes on Escape while focus is inside it (0.15).
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    screen.getByRole('dialog').focus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('inset docks a push sheet below the top bar and clear of the sidebar, default stays at the window edge', () => {
    const { unmount } = render(<Example mode="push" size="md" />);
    expect(screen.getByRole('dialog')).not.toHaveClass('top-topbar');
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-sheet-inset');
    unmount();
    render(<Example mode="push" side="left" size="md" inset="topbar-sidebar" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('top-topbar', 'bottom-0', 'left-[var(--size-sidebar)]');
    expect(dialog).toHaveAttribute('data-sheet-inset', 'topbar-sidebar');
  });

  it('container portals the sheet and its scrim into the work area and positions them absolute', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(<Example mode="modal" size="md" container={host} />);
    const dialog = screen.getByRole('dialog');
    expect(host).toContainElement(dialog);
    expect(dialog).toHaveClass('absolute');
    expect(dialog).toHaveAttribute('data-sheet-scoped');
    expect(host.querySelector('.bg-overlay')).toHaveClass('absolute');
    host.remove();
  });

  it('overlay mode floats with a scrim and all corners rounded', () => {
    render(<Example mode="overlay" size="md" />);
    expect(screen.getByRole('dialog')).toHaveClass('rounded-surface', 'right-2', 'inset-y-2');
    expect(document.querySelector('.bg-overlay')).toBeInTheDocument();
  });

  it('stack depth shifts the panel by the stack offset and mutes the surface', () => {
    render(<Example size="md" stackDepth={2} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('bg-muted');
    expect(dialog.style.getPropertyValue('--sheet-depth')).toBe('2');
    expect(dialog.className).toContain('right-[calc(var(--size-sheet-stack-offset)*var(--sheet-depth))]');
  });
});

describe('Sheet width', () => {
  it('keeps a floating panel inside the viewport and offers a full size', () => {
    const { unmount } = render(<Example mode="overlay" size="lg" />);
    expect(screen.getByRole('dialog').className).toContain('max-w-[calc(100%-1rem)]');
    unmount();
    render(<Example size="full" />);
    expect(screen.getByRole('dialog').className).toContain('w-full');
  });
});

describe('Sheet zero anatomy and states', () => {
  const Zero = ({ onRetry, ...props }: Partial<SheetContentProps> & { onRetry?: () => void }) => (
    <Example size="md" padded={false} {...props}>
      <SheetHeader variant="zero">
        <SheetPath>Companies / Nordwind Handel GmbH</SheetPath>
        <SheetTitle variant="zero">Edit company</SheetTitle>
        <SheetMeta>12 contacts</SheetMeta>
      </SheetHeader>
      <SheetBody onRetry={onRetry}>
        <SheetSection title="Label" description="Helper">
          <input aria-label="field" />
        </SheetSection>
      </SheetBody>
      <SheetFooter variant="zero">
        <Button>Save</Button>
      </SheetFooter>
    </Example>
  );

  it('renders path with Esc hint, sections and a saved footer by default', () => {
    render(<Zero />);
    expect(screen.getByText('Companies / Nordwind Handel GmbH')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Label' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-sheet-state', 'default');
  });

  it('loading state shows skeletons and marks the sheet busy', () => {
    render(<Zero state="loading" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'field' })).not.toBeInTheDocument();
  });

  it('error state shows an alert with a retry that works', async () => {
    const onRetry = vi.fn();
    render(<Zero state="error" onRetry={onRetry} />);
    // The footer status chip adds its own assertive announcement for the error state.
    expect(screen.getAllByRole('alert').some((el) => el.textContent?.includes('Could not load this content'))).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('dirty state shows the unsaved changes note in the footer', () => {
    render(<Zero state="dirty" />);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'field' })).toBeInTheDocument();
  });
});

describe('Sheet card and centered modes', () => {
  it('card floats a hugging panel with the card width and height cap', () => {
    render(<Example mode="card" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-sheet-mode', 'card');
    expect(dialog).toHaveClass('w-sheet-md', 'h-auto', 'rounded-surface', 'top-2', 'right-2');
    expect(dialog.className).toContain('--size-sheet-card');
    expect(dialog).not.toHaveClass('inset-y-0', 'h-full');
    expect(document.querySelector('.bg-overlay')).toBeInTheDocument();
  });

  it('card respects an explicit size and the left side', () => {
    render(<Example mode="card" size="sm" side="left" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('w-sheet-sm', 'left-2');
  });

  it('centered sits in the middle with a scrim and keeps the dialog role', () => {
    render(<Example mode="centered" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-sheet-mode', 'centered');
    expect(dialog).toHaveClass('left-1/2', 'top-1/2', '-translate-x-1/2', '-translate-y-1/2', 'w-sheet-md', 'rounded-surface');
    expect(dialog).not.toHaveClass('inset-x-0');
    expect(document.querySelector('.bg-overlay')).toBeInTheDocument();
  });

  it('closes on Escape in centered mode', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent mode="centered">
          <SheetTitle>Connect bank</SheetTitle>
          <SheetDescription>Details</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('SheetBanner', () => {
  it.each([
    ['error', 'bg-background-destructive-subtle', 'alert'],
    ['warning', 'bg-background-warning-subtle', 'alert'],
    ['primary', 'bg-background-brand-subtle', 'status'],
    ['success', 'bg-background-success-subtle', 'status'],
    ['neutral', 'bg-muted', 'status'],
  ] as const)('tone %s uses the semantic background and the %s role', (tone, cls, role) => {
    render(<SheetBanner tone={tone}>Heads up</SheetBanner>);
    const banner = screen.getByRole(role);
    expect(banner).toHaveClass(cls);
    expect(banner).toHaveAttribute('data-tone', tone);
  });

  it('draws the hairline on the edge facing the content for top and bottom', () => {
    const { rerender } = render(<SheetBanner>Top</SheetBanner>);
    expect(screen.getByRole('status')).toHaveClass('border-b');
    rerender(<SheetBanner position="bottom">Bottom</SheetBanner>);
    expect(screen.getByRole('status')).toHaveClass('border-t');
    expect(screen.getByRole('status')).toHaveAttribute('data-position', 'bottom');
  });
});

describe('SheetCodeBlock', () => {
  it('renders the label header and copies the code', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<SheetCodeBlock label="Terminal" code="npm run build" language="Shell" />);
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByLabelText('Shell')).toHaveClass('typography-code-block');
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('npm run build');
  });

  it('falls back to the Code label from the provider texts', () => {
    render(<SheetCodeBlock code="x" />);
    expect(screen.getByText('Code')).toBeInTheDocument();
  });
});

describe('Docked non-modal Sheet focus and Escape (0.15)', () => {
  const Docked = ({ modal, onOpenChange, focusOnOpen }: { modal: boolean; onOpenChange: (o: boolean) => void; focusOnOpen?: boolean }) => (
    <>
      <button type="button">Page action</button>
      <Sheet open modal={modal} onOpenChange={onOpenChange}>
        <SheetContent mode={modal ? 'modal' : 'push'} focusOnOpen={focusOnOpen}>
          <SheetTitle>Details</SheetTitle>
          <SheetDescription>Docked</SheetDescription>
          <button type="button">Inside</button>
        </SheetContent>
      </Sheet>
    </>
  );

  it('does not steal focus on open when non-modal', async () => {
    const page = document.createElement('button');
    document.body.appendChild(page);
    page.focus();
    render(<Docked modal={false} onOpenChange={() => {}} />);
    await Promise.resolve();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(false);
    expect(document.activeElement).toBe(page);
    page.remove();
  });

  it('still moves focus in for modal sheets and when focusOnOpen is set', async () => {
    const { unmount } = render(<Docked modal onOpenChange={() => {}} />);
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
    unmount();
    render(<Docked modal={false} focusOnOpen onOpenChange={() => {}} />);
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
  });

  it('closes on Escape only while focus is inside when non-modal', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Docked modal={false} onOpenChange={onOpenChange} />);
    screen.getByRole('button', { name: 'Page action' }).focus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'Inside' }).focus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps Escape closing a modal sheet', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Docked modal onOpenChange={onOpenChange} />);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('Sheet close button size', () => {
  it('is a fixed 40px square (h-10 w-10) with and without the zero preset', () => {
    const { unmount } = render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('h-10', 'w-10');
    unmount();
    render(
      <DesignSystemProvider preset="zero">
        <Sheet open>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('h-10', 'w-10');
  });
});

describe('Sheet initial focus and tab order (0.28)', () => {
  it('puts the close button first in the DOM and the tab order', async () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
          <a href="#one">One</a>
          <button type="button">Two</button>
        </SheetContent>
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog');
    const close = dialog.querySelector('[data-slot="sheet-close"]');
    expect(dialog.querySelector('button, a[href]')).toBe(close);
    expect(close).toHaveClass('z-chrome');
  });

  it('focuses the first link on open, links included', async () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
          <a href="#one">One</a>
          <button type="button">Two</button>
        </SheetContent>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'One' })).toHaveFocus());
  });

  it('keeps an element that took focus itself and lets the consumer prevent the default', async () => {
    const { unmount } = render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Edit</SheetTitle>
          <SheetDescription>Form</SheetDescription>
          <a href="#one">One</a>
          <input aria-label="Name" autoFocus />
        </SheetContent>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    unmount();
    render(
      <Sheet open>
        <SheetContent onOpenAutoFocus={(event) => event.preventDefault()}>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
          <a href="#one">One</a>
        </SheetContent>
      </Sheet>,
    );
    await Promise.resolve();
    expect(screen.getByRole('link', { name: 'One' })).not.toHaveFocus();
  });

  it('skips hidden elements and focuses the first visible one inside the dialog', async () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
          <a href="#gone" style={{ display: 'none' }}>
            Gone
          </a>
          <div style={{ display: 'none' }}>
            <button type="button">Nested gone</button>
          </div>
          <a href="#shown" style={{ visibility: 'hidden' }}>
            Invisible
          </a>
          <a href="#one">One</a>
        </SheetContent>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'One' })).toHaveFocus());
  });

  it('falls back to the close button when nothing else can take focus', async () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Info</SheetTitle>
          <SheetDescription>Read only</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  it('tabs from the close button to the first link and wraps back from the last element', async () => {
    const user = userEvent.setup();
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
          <a href="#one">One</a>
          <a href="#two">Two</a>
        </SheetContent>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'One' })).toHaveFocus());
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Two' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });
});

describe('SheetNavLink (0.28)', () => {
  const Menu = ({ onNavigate }: { onNavigate?: (info: { href: string; target: HTMLElement | null }) => void }) => {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Menu
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Sections</SheetDescription>
            <SheetNavLink href="#pricing" onNavigate={onNavigate}>
              Pricing
            </SheetNavLink>
            <SheetNavLink href="/other">Other page</SheetNavLink>
          </SheetContent>
        </Sheet>
        <section id="pricing" aria-label="Pricing section">
          Pricing
        </section>
      </>
    );
  };

  it('closes the sheet, then scrolls to the section and focuses it', async () => {
    const user = userEvent.setup();
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<Menu />);
    await user.click(screen.getByRole('link', { name: 'Pricing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const section = screen.getByLabelText('Pricing section');
    await waitFor(() => expect(section).toHaveFocus());
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#pricing');
    // The section keeps no stray tab stop after focus leaves.
    section.blur();
    expect(section).not.toHaveAttribute('tabindex');
  });

  it('runs onNavigate after the sheet is gone instead of the default jump', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    render(<Menu onNavigate={onNavigate} />);
    await user.click(screen.getByRole('link', { name: 'Pricing' }));
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1));
    expect(onNavigate).toHaveBeenCalledWith({ href: '#pricing', target: screen.getByLabelText('Pricing section') });
  });

  it('leaves other hrefs and modified clicks alone and keeps the sheet open', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const other = screen.getByRole('link', { name: 'Other page' });
    other.addEventListener('click', (event) => event.preventDefault());
    await user.click(other);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'Pricing' }));
    await user.keyboard('{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('leaves a link to a missing element or a malformed hash alone and keeps the sheet open', async () => {
    const user = userEvent.setup();
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Sections</SheetDescription>
          <SheetNavLink href="#missing">Missing</SheetNavLink>
          <SheetNavLink href="#%E0">Broken</SheetNavLink>
        </SheetContent>
      </Sheet>,
    );
    const stop = (event: Event) => event.preventDefault();
    const missing = screen.getByRole('link', { name: 'Missing' });
    const broken = screen.getByRole('link', { name: 'Broken' });
    missing.addEventListener('click', stop);
    broken.addEventListener('click', stop);
    await user.click(missing);
    await user.click(broken);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has a left aligned label, a visible underline and the control height', () => {
    render(
      <SheetNavLink href="#x">
        Go
      </SheetNavLink>,
    );
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveClass('justify-start', 'h-control-md', 'underline');
  });

  it('drops the jump when the parent keeps the sheet open', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <>
        <Sheet open onOpenChange={() => {}}>
          <SheetContent>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Sections</SheetDescription>
            <SheetNavLink href="#x" onNavigate={onNavigate}>
              Go
            </SheetNavLink>
          </SheetContent>
        </Sheet>
      </>,
    );
    await user.click(screen.getByRole('link', { name: 'Go' }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await user.keyboard('{Escape}');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('jumps immediately outside a sheet', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <SheetNavLink href="#x" onNavigate={onNavigate}>
        Go
      </SheetNavLink>,
    );
    await user.click(screen.getByRole('link', { name: 'Go' }));
    expect(onNavigate).toHaveBeenCalledWith({ href: '#x', target: null });
  });
});

describe('Sheet 0.29', () => {
  it('focuses the content container when focusOnOpen is false on a modal sheet (never the body)', async () => {
    render(<Example focusOnOpen={false}>{null}</Example>);
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(dialog).toHaveAttribute('tabindex', '-1');
  });

  it('focuses the container of a stacked sheet with focusOnOpen false', async () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Cockpit</SheetTitle>
          <SheetDescription>Edit</SheetDescription>
          <Sheet open>
            <SheetContent stackDepth={1} focusOnOpen={false}>
              <SheetTitle>Time entries</SheetTitle>
              <SheetDescription>Rows</SheetDescription>
              <a href="/x">Link</a>
            </SheetContent>
          </Sheet>
        </SheetContent>
      </Sheet>,
    );
    await screen.findByText('Time entries');
    const dialogs = screen.getAllByRole('dialog', { hidden: true });
    const stacked = dialogs[dialogs.length - 1];
    await waitFor(() => expect(stacked).toHaveFocus());
  });

  it('keeps the page focus for a docked sheet by default', () => {
    render(
      <>
        <button type="button">Page</button>
        <Example modal={false} mode="push">
          {null}
        </Example>
      </>,
    );
    expect(screen.getByRole('dialog')).not.toHaveFocus();
  });

  it('reserves room for the close button in the header, default and zero', () => {
    const { rerender } = render(
      <Example>
        <SheetHeader data-testid="header">
          <SheetTitle>A very long title that runs toward the close button</SheetTitle>
        </SheetHeader>
      </Example>,
    );
    expect(screen.getByTestId('header')).toHaveClass('pr-10');
    rerender(
      <Example>
        <SheetHeader data-testid="header" variant="zero">
          <SheetTitle>A very long title</SheetTitle>
        </SheetHeader>
      </Example>,
    );
    expect(screen.getByTestId('header')).toHaveClass('pr-16');
  });

  it('SheetNavLink nav variant takes the foreground token, regular weight and underlines on hover and for the current page', () => {
    render(
      <Example>
        <SheetNavLink href="#a" variant="nav" aria-current="page">
          Section
        </SheetNavLink>
      </Example>,
    );
    const link = screen.getByRole('link', { name: 'Section' });
    expect(link).toHaveClass('text-foreground', 'font-normal', 'hover:underline', 'no-underline', 'aria-[current]:underline');
    expect(link).not.toHaveClass('text-link-default');
  });

  it('closeOnNavigate closes the sheet for a plain click that is not a section jump, also after your own preventDefault', async () => {
    const user = userEvent.setup();
    const Menu = () => {
      const [open, setOpen] = React.useState(true);
      return (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Pages</SheetDescription>
            <SheetNavLink href="/route" closeOnNavigate onClick={(event) => event.preventDefault()}>
              Route
            </SheetNavLink>
          </SheetContent>
        </Sheet>
      );
    };
    render(<Menu />);
    await user.click(screen.getByRole('link', { name: 'Route' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closeOnNavigate keeps the sheet open for a modified click', async () => {
    const user = userEvent.setup();
    render(
      <Example>
        <SheetNavLink href="/route" closeOnNavigate onClick={(event) => event.preventDefault()}>
          Route
        </SheetNavLink>
      </Example>,
    );
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'Route' }));
    await user.keyboard('{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('focuses the section before it scrolls, so the jump has the last word over focus listeners', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    Element.prototype.scrollIntoView = vi.fn(function scroll(this: Element) {
      order.push(`scroll:${document.activeElement === this ? 'focused' : 'unfocused'}`);
    });
    const Menu = () => {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Sections</SheetDescription>
              <SheetNavLink href="#order">Go</SheetNavLink>
            </SheetContent>
          </Sheet>
          <section id="order" aria-label="Order section">
            Order
          </section>
        </>
      );
    };
    render(<Menu />);
    await user.click(screen.getByRole('link', { name: 'Go' }));
    await waitFor(() => expect(order).toEqual(['scroll:focused']));
  });
});

describe('Sheet 0.29 review fixes', () => {
  it('Shift+Tab from the container (focusOnOpen false) goes to the last control', async () => {
    const user = userEvent.setup();
    render(
      <Example focusOnOpen={false}>
        <button type="button">First</button>
        <button type="button">Last</button>
      </Example>,
    );
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('a jump to the hash that is already current adds no history entry', async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = vi.fn();
    window.history.pushState(null, '', '#again');
    const before = window.history.length;
    render(
      <>
        <SheetNavLink href="#again">Go</SheetNavLink>
        <section id="again">Again</section>
      </>,
    );
    await user.click(screen.getByRole('link', { name: 'Go' }));
    expect(window.history.length).toBe(before);
  });
});

describe('SheetNavLink history and focus', () => {
  it('pushes the history entry before it scrolls, so Back finds the old position', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    Element.prototype.scrollIntoView = vi.fn(() => {
      order.push('scroll');
    });
    const push = vi.spyOn(window.history, 'pushState').mockImplementation(() => {
      order.push('push');
    });
    render(
      <>
        <SheetNavLink href="#order-a">Go</SheetNavLink>
        <section id="order-a">A</section>
      </>,
    );
    await user.click(screen.getByRole('link', { name: 'Go' }));
    expect(order).toEqual(['push', 'scroll']);
    push.mockRestore();
  });

  it('focuses the section again after Back (popstate) instead of leaving focus on the body', async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <>
        <SheetNavLink href="#back-a">Go</SheetNavLink>
        <section id="back-a" aria-label="A">
          A
        </section>
        <button type="button">Elsewhere</button>
      </>,
    );
    await user.click(screen.getByRole('link', { name: 'Go' }));
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    expect(screen.getByRole('region', { name: 'A' })).not.toHaveFocus();
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('region', { name: 'A' })).toHaveFocus();
  });
});
