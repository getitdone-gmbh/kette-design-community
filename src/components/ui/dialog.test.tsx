import { screen, waitFor } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { CheckCircle2 } from 'lucide-react';
import * as React from 'react';
import { vi } from 'vitest';

import { RadioGroup, RadioGroupItem } from './radio-group';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { Switch } from './switch';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFeaturedIcon, DialogFooter, DialogHeader, DialogTitle } from './dialog';

const Example = ({ size }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) => (
  <Dialog open>
    <DialogContent size={size}>
      <DialogHeader orientation={size ? 'horizontal' : undefined}>
        {size && (
          <DialogFeaturedIcon tone="success">
            <CheckCircle2 />
          </DialogFeaturedIcon>
        )}
        <div>
          <DialogTitle>Archive company?</DialogTitle>
          <DialogDescription>Hidden from lists.</DialogDescription>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

describe('Dialog close button', () => {
  it('is the 40px icon button square with the shared focus ring, like the Sheet close', () => {
    render(<Example />);
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('h-10', 'w-10', 'focus-visible:ring-focus', 'focus-visible:ring-ring-default');
    expect(close.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Dialog sizes', () => {
  it('keeps max-w-lg without a size (unchanged)', () => {
    render(<Example />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-lg');
    expect(screen.getByText('Archive company?').parentElement?.parentElement).toHaveClass('flex-col');
  });

  it.each([
    ['sm', 'max-w-sheet-sm'],
    ['md', 'max-w-sheet-md'],
    ['lg', 'max-w-sheet-lg'],
    ['xl', 'max-w-sheet-xl'],
  ] as const)('size %s sets the token width', (size, cls) => {
    render(<Example size={size} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass(cls);
    expect(dialog).not.toHaveClass('max-w-lg');
  });

  it('horizontal header places a decorative featured icon beside the text', () => {
    render(<Example size="sm" />);
    const icon = document.querySelector('[aria-hidden="true"].rounded-full');
    expect(icon).toHaveClass('bg-general-success-container');
    expect(screen.getByRole('dialog', { name: 'Archive company?' })).toBeInTheDocument();
  });
});

describe('Dialog footer and scrolling body', () => {
  it('stacks footer buttons with a gap on mobile and keeps the row layout from sm', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>t</DialogTitle>
          <DialogDescription>d</DialogDescription>
          <DialogFooter data-testid="footer">
            <button type="button">Cancel</button>
            <button type="button">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByTestId('footer')).toHaveClass('flex-col-reverse', 'gap-2', 'sm:flex-row', 'sm:justify-end');
  });

  it('keeps the original scrolling panel unless scrollable is set', () => {
    render(<Example />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('grid', 'overflow-y-auto');
  });

  it('scrollable: panel is a clipped flex column, DialogBody scrolls and is keyboard reachable, footer stays outside it', () => {
    render(
      <Dialog open>
        <DialogContent scrollable>
          <DialogHeader>
            <DialogTitle>Apply</DialogTitle>
            <DialogDescription>Long form</DialogDescription>
          </DialogHeader>
          <DialogBody data-testid="body">
            <p>content</p>
          </DialogBody>
          <DialogFooter data-testid="footer">
            <button type="button">Send</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('flex', 'flex-col', 'overflow-hidden');
    expect(dialog).not.toHaveClass('grid', 'overflow-y-auto');
    const body = screen.getByTestId('body');
    expect(body).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(body).toHaveAttribute('tabindex', '0');
    expect(body.contains(screen.getByTestId('footer'))).toBe(false);
    expect(screen.getByTestId('footer')).toHaveClass('shrink-0');
  });

  describe('scrollable body focus', () => {
    const Form = ({ withField = true, onOpenAutoFocus }: { withField?: boolean; onOpenAutoFocus?: (event: Event) => void }) => (
      <Dialog open>
        <DialogContent scrollable onOpenAutoFocus={onOpenAutoFocus}>
          <DialogHeader>
            <DialogTitle>Apply</DialogTitle>
            <DialogDescription>Long form</DialogDescription>
          </DialogHeader>
          <DialogBody data-testid="body">{withField ? <input aria-label="Name" /> : <p>Read only terms</p>}</DialogBody>
          <DialogFooter>
            <button type="button">Send</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    it('focuses the first form field on open, not the body', async () => {
      render(<Form />);
      await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus());
      expect(screen.getByTestId('body')).not.toHaveFocus();
    });

    it('is no tab stop when it holds a focusable child, so scrolling happens through the field', () => {
      render(<Form />);
      expect(screen.getByTestId('body')).not.toHaveAttribute('tabindex');
    });

    it('stays a tab stop without focusable children but does not take initial focus', async () => {
      render(<Form withField={false} />);
      const body = screen.getByTestId('body');
      expect(body).toHaveAttribute('tabindex', '0');
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toHaveFocus());
      expect(body).not.toHaveFocus();
    });

    it('becomes a tab stop again when its fields are removed', async () => {
      const Toggle = () => {
        const [show, setShow] = React.useState(true);
        return (
          <Dialog open>
            <DialogContent scrollable>
              <DialogTitle>T</DialogTitle>
              <DialogDescription>D</DialogDescription>
              <DialogBody data-testid="body">{show ? <input aria-label="Name" /> : <p>Done</p>}</DialogBody>
              <button type="button" onClick={() => setShow(false)}>
                Hide
              </button>
            </DialogContent>
          </Dialog>
        );
      };
      render(<Toggle />);
      await userEvent.click(screen.getByRole('button', { name: 'Hide' }));
      await waitFor(() => expect(screen.getByTestId('body')).toHaveAttribute('tabindex', '0'));
    });

    it('respects a consumer onOpenAutoFocus that prevents the default', async () => {
      const onOpenAutoFocus = vi.fn((event: Event) => event.preventDefault());
      render(<Form onOpenAutoFocus={onOpenAutoFocus} />);
      await waitFor(() => expect(onOpenAutoFocus).toHaveBeenCalled());
      expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveFocus();
    });
  });
});

describe('initial focus priority', () => {
  const LanguageTabs = () => (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="de">Deutsch</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const Consultation = ({ scrollable, initialFocus, defaultValue }: { scrollable?: boolean; initialFocus?: 'auto' | 'first-field'; defaultValue?: string }) => {
    const radios = (
      <RadioGroup defaultValue={defaultValue} aria-label="Topic">
        <RadioGroupItem value="a" aria-label="Strategy" />
        <RadioGroupItem value="b" aria-label="Delivery" />
      </RadioGroup>
    );
    return (
      <Dialog open>
        <DialogContent scrollable={scrollable} initialFocus={initialFocus}>
          <LanguageTabs />
          <DialogHeader>
            <DialogTitle>Book a call</DialogTitle>
            <DialogDescription>Pick a topic</DialogDescription>
          </DialogHeader>
          {scrollable ? <DialogBody>{radios}</DialogBody> : radios}
          <DialogFooter>
            <button type="button">Cancel</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  it('scrollable body: a radio group wins over the tabs that come first in the DOM', async () => {
    render(<Consultation scrollable />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Strategy' })).toHaveFocus());
    expect(screen.getByRole('tab', { name: 'English' })).not.toHaveFocus();
  });

  it('lands on the checked radio, the single tab stop of the group', async () => {
    render(<Consultation scrollable defaultValue="b" />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Delivery' })).toHaveFocus());
  });

  it('native radio groups land on the checked radio, else the first', async () => {
    const Native = ({ checked }: { checked?: string }) => (
      <Dialog open>
        <DialogContent scrollable>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <button type="button">Before</button>
          <DialogBody>
            <input type="radio" name="x" aria-label="One" defaultChecked={checked === 'one'} />
            <input type="radio" name="x" aria-label="Two" defaultChecked={checked === 'two'} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
    const { unmount } = render(<Native />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'One' })).toHaveFocus());
    unmount();
    render(<Native checked="two" />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Two' })).toHaveFocus());
  });

  it('a switch or checkbox in the body wins over buttons before it', async () => {
    render(
      <Dialog open>
        <DialogContent scrollable>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <button type="button">Help</button>
          <DialogBody>
            <Switch aria-label="Notify me" />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Notify me' })).toHaveFocus());
  });

  it('skips disabled and hidden controls', async () => {
    render(
      <Dialog open>
        <DialogContent scrollable>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <DialogBody>
            <input aria-label="Off" disabled />
            <div hidden>
              <input aria-label="Hidden" />
            </div>
            <input aria-label="Real" />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Real' })).toHaveFocus());
  });

  it('dialogs without a body keep the Radix default unless initialFocus="first-field"', async () => {
    const { unmount } = render(<Consultation />);
    // The Radix default is the first tabbable element: the active tab trigger, which comes before the radios and the footer button.
    await waitFor(() => expect(screen.getByRole('tab', { name: 'English' })).toHaveFocus());
    expect(screen.getByRole('radio', { name: 'Strategy' })).not.toHaveFocus();
    unmount();
    render(<Consultation initialFocus="first-field" />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Strategy' })).toHaveFocus());
  });

  it('first-field without any control leaves the Radix default', async () => {
    render(
      <Dialog open>
        <DialogContent initialFocus="first-field">
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <button type="button">Ok</button>
        </DialogContent>
      </Dialog>,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ok' })).toHaveFocus());
  });

  it('the scrolling body pads itself and pulls back with a negative margin so focus rings are not clipped', () => {
    render(
      <Dialog open>
        <DialogContent scrollable>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <DialogBody data-testid="body">
            <input aria-label="Name" />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByTestId('body')).toHaveClass('overflow-y-auto', '-m-1', 'p-1');
  });
});
