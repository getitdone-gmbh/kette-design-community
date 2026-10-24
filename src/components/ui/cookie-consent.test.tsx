import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { vi } from 'vitest';

import { CookieConsent, openCookieSettings, useCookieConsent } from './cookie-consent';
import { DesignSystemProvider } from './design-system-provider';

describe('CookieConsent', () => {
  it('renders nothing when closed', () => {
    render(<CookieConsent open={false} description="Text" onAccept={() => undefined} onDecline={() => undefined} />);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('offers decline and accept as equal actions without taking focus', () => {
    render(<CookieConsent title="Cookies" description="We use cookies." onAccept={() => undefined} onDecline={() => undefined} />);
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
    const decline = screen.getByRole('button', { name: 'Decline non-essential' });
    const accept = screen.getByRole('button', { name: 'Accept all' });
    expect(decline.className).toBe(accept.className);
    expect(document.body).toHaveFocus();
  });

  it('calls the handlers and offers the optional settings path', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    const onCustomize = vi.fn();
    render(<CookieConsent description="We use cookies." onAccept={onAccept} onDecline={onDecline} onCustomize={onCustomize} />);
    await user.click(screen.getByRole('button', { name: 'Decline non-essential' }));
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onCustomize).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();
  });

  it('accepts label overrides', () => {
    render(<CookieConsent description="x" onAccept={() => undefined} onDecline={() => undefined} acceptLabel="OK" declineLabel="No" />);
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('closes without consent by calling decline', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(<CookieConsent closable description="x" onAccept={onAccept} onDecline={onDecline} />);
    await user.click(screen.getByRole('button', { name: 'Close cookie banner' }));
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('supports the centered-wide layout', () => {
    render(<CookieConsent layout="centered-wide" positioning="static" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
    expect(screen.getByRole('region').className).toContain('max-w-4xl');
  });

  it('keeps accept and decline identical when acceptEmphasis is on', () => {
    render(<CookieConsent acceptEmphasis description="x" onAccept={() => undefined} onDecline={() => undefined} />);
    const decline = screen.getByRole('button', { name: 'Decline non-essential' });
    const accept = screen.getByRole('button', { name: 'Accept all' });
    expect(accept.className).toBe(decline.className);
    expect(accept.className).toContain('bg-button-background-primary-default');
  });

  describe('settings view', () => {
    const categories = [
      { id: 'necessary', title: 'Necessary', necessary: true },
      { id: 'statistics', title: 'Statistics', description: 'Anonymous usage numbers.' },
      { id: 'marketing', title: 'Marketing' },
    ];

    it('opens per-category switches with nothing pre-ticked and saves the selection', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<CookieConsent categories={categories} onSave={onSave} description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      const necessary = screen.getByRole('switch', { name: 'Necessary' });
      expect(necessary).toBeChecked();
      expect(necessary).toBeDisabled();
      const statistics = screen.getByRole('switch', { name: 'Statistics' });
      expect(statistics).not.toBeChecked();
      expect(screen.getByRole('switch', { name: 'Marketing' })).not.toBeChecked();
      await user.click(statistics);
      await user.click(screen.getByRole('button', { name: 'Save selection' }));
      expect(onSave).toHaveBeenCalledWith({ necessary: true, statistics: true, marketing: false });
    });

    it('shows a category notice with a working link in the settings view only', async () => {
      const user = userEvent.setup();
      const withNotice = [{ id: 'necessary', title: 'Necessary', necessary: true, notice: <a href="/privacy">Privacy policy</a> }, ...categories.slice(1)];
      render(<CookieConsent categories={withNotice} description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      expect(screen.queryByRole('link', { name: 'Privacy policy' })).toBeNull();
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy');
      expect(screen.getByRole('switch', { name: 'Necessary' })).not.toHaveAccessibleDescription(/Privacy/);
    });

    it('starts the switches from initialConsent and ignores unknown ids', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(
        <CookieConsent categories={categories} initialConsent={{ statistics: true, other: true }} onSave={onSave} description="x" onAccept={() => undefined} onDecline={() => undefined} />,
      );
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      expect(screen.getByRole('switch', { name: 'Statistics' })).toBeChecked();
      expect(screen.getByRole('switch', { name: 'Marketing' })).not.toBeChecked();
      await user.click(screen.getByRole('button', { name: 'Save selection' }));
      expect(onSave).toHaveBeenCalledWith({ necessary: true, statistics: true, marketing: false });
    });

    it('restores the stored choice when settings are reopened after editing', async () => {
      const user = userEvent.setup();
      render(<CookieConsent categories={categories} initialConsent={{ marketing: true }} description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      await user.click(screen.getByRole('switch', { name: 'Marketing' }));
      expect(screen.getByRole('switch', { name: 'Marketing' })).not.toBeChecked();
      await user.click(screen.getByRole('button', { name: 'Back' }));
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      expect(screen.getByRole('switch', { name: 'Marketing' })).toBeChecked();
    });

    it('controlled value drives the switches and reports changes', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<CookieConsent categories={categories} value={{ statistics: true }} onValueChange={onValueChange} description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      expect(screen.getByRole('switch', { name: 'Statistics' })).toBeChecked();
      await user.click(screen.getByRole('switch', { name: 'Marketing' }));
      expect(onValueChange).toHaveBeenCalledWith({ necessary: true, statistics: true, marketing: true });
      expect(screen.getByRole('switch', { name: 'Marketing' })).not.toBeChecked();
    });

    it('goes back to the first layer', async () => {
      const user = userEvent.setup();
      render(<CookieConsent categories={categories} description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      await user.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeInTheDocument();
    });
  });

  describe('dismissBehavior', () => {
    it('defer closes without deciding: no accept, no decline, onDismiss once, banner hides itself', async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onDecline = vi.fn();
      const onDismiss = vi.fn();
      render(<CookieConsent closable dismissBehavior="defer" onDismiss={onDismiss} description="x" onAccept={onAccept} onDecline={onDecline} />);
      await user.click(screen.getByRole('button', { name: 'Close cookie banner' }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onDecline).not.toHaveBeenCalled();
      expect(onAccept).not.toHaveBeenCalled();
      expect(screen.queryByRole('region')).toBeNull();
    });

    it('defer shows the banner again on the next mount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<CookieConsent closable dismissBehavior="defer" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Close cookie banner' }));
      unmount();
      render(<CookieConsent closable dismissBehavior="defer" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('decline stays the default and does not call onDismiss', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const onDecline = vi.fn();
      render(<CookieConsent closable onDismiss={onDismiss} description="x" onAccept={() => undefined} onDecline={onDecline} />);
      await user.click(screen.getByRole('button', { name: 'Close cookie banner' }));
      expect(onDecline).toHaveBeenCalledTimes(1);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('keeps accept and decline equally prominent with defer', () => {
      render(<CookieConsent closable dismissBehavior="defer" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      expect(screen.getByRole('button', { name: 'Decline non-essential' }).className).toBe(screen.getByRole('button', { name: 'Accept all' }).className);
    });
  });

  describe('settings view texts', () => {
    const categories = [
      { id: 'necessary', title: 'Necessary', description: 'Needed for login.', necessary: true },
      { id: 'statistics', title: 'Statistics', description: 'Anonymous usage numbers.' },
    ];

    it('keeps every category description and the default always-active text', async () => {
      const user = userEvent.setup();
      render(<CookieConsent categories={categories} description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      expect(screen.getByText('Needed for login.')).toBeInTheDocument();
      expect(screen.getByText('Anonymous usage numbers.')).toBeInTheDocument();
      expect(screen.getByText('Always active')).toBeInTheDocument();
    });

    it('overrides the always-active text and localises it in German', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<CookieConsent categories={categories} alwaysActiveLabel="Required" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      await user.click(screen.getByRole('button', { name: 'Settings' }));
      expect(screen.getByText('Required')).toBeInTheDocument();
      unmount();
      render(
        <DesignSystemProvider locale="de">
          <CookieConsent categories={categories} description="x" onAccept={() => undefined} onDecline={() => undefined} />
        </DesignSystemProvider>,
      );
      await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
      expect(screen.getByText('Immer aktiv')).toBeInTheDocument();
    });
  });
});

describe('CookieConsent scroll padding', () => {
  it('reserves the banner height on the document scroller while open and restores it on close', () => {
    const observed: Array<() => void> = [];
    class ResizeObserverStub {
      constructor(callback: () => void) {
        observed.push(callback);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    const rect = { height: 120, bottom: 700, top: 580, left: 0, right: 0, width: 0, x: 0, y: 580, toJSON: () => ({}) };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 716 });
    const props = { description: 'Text', onAccept: () => undefined, onDecline: () => undefined };
    const { rerender, unmount } = render(<CookieConsent {...props} />);
    // 120 banner + 16 bottom offset + 8 gap
    expect(document.documentElement.style.scrollPaddingBottom).toBe('144px');
    expect((document.querySelector('[data-cookie-consent-spacer]') as HTMLElement).style.height).toBe('144px');
    rerender(<CookieConsent {...props} open={false} />);
    expect(document.documentElement.style.scrollPaddingBottom).toBe('');
    expect(document.querySelector('[data-cookie-consent-spacer]')).toBeNull();
    rerender(<CookieConsent {...props} />);
    expect(document.documentElement.style.scrollPaddingBottom).toBe('144px');
    unmount();
    expect(document.documentElement.style.scrollPaddingBottom).toBe('');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document.documentElement, 'clientHeight');
  });

  it('leaves the scroller alone for static positioning', () => {
    render(<CookieConsent description="Text" positioning="static" onAccept={() => undefined} onDecline={() => undefined} />);
    expect(document.documentElement.style.scrollPaddingBottom).toBe('');
  });
});

describe('CookieConsent focus reveal', () => {
  const props = { description: 'Text', onAccept: () => undefined, onDecline: () => undefined };
  const rectOf = (top: number, bottom: number, left = 0, right = 300) =>
    ({ top, bottom, left, right, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('scrolls a focused element in a horizontal scroller into view and above the banner', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const { container } = render(
      <div>
        <div data-testid="scroller" style={{ overflowX: 'auto' }}>
          <a href="#card" data-testid="card">
            Card
          </a>
        </div>
        <CookieConsent {...props} />
      </div>,
    );
    const banner = container.querySelector('section') as HTMLElement;
    const card = container.querySelector('[data-testid="card"]') as HTMLElement;
    vi.spyOn(banner, 'getBoundingClientRect').mockReturnValue(rectOf(600, 700));
    // The card ends 40px behind the banner top (minus the 8px gap).
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(rectOf(500, 640));
    card.focus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(scrollBy).toHaveBeenCalledWith(0, 48);
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('does nothing extra for focus inside the banner or once the banner is closed', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    const { container, rerender } = render(
      <div>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <CookieConsent {...props} />
      </div>,
    );
    (container.querySelector('section button') as HTMLElement).focus();
    expect(scrollIntoView).not.toHaveBeenCalled();
    rerender(
      <div>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <CookieConsent {...props} open={false} />
      </div>,
    );
    (container.querySelector('[data-testid="outside"]') as HTMLElement).focus();
    expect(scrollIntoView).not.toHaveBeenCalled();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });
});

describe('CookieConsent action stacking', () => {
  it('stacks the actions below sm and keeps the row layout from sm up', () => {
    render(<CookieConsent description="x" onAccept={() => undefined} onDecline={() => undefined} onCustomize={() => undefined} />);
    const row = screen.getByRole('button', { name: 'Accept all' }).parentElement as HTMLElement;
    expect(row).toHaveClass('flex-col', 'items-stretch', 'sm:flex-row', 'sm:flex-wrap', 'sm:items-center');
    expect(row).not.toHaveClass('flex-wrap');
    expect(Array.from(row.querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Decline non-essential', 'Accept all', 'Settings']);
  });

  it('stacks two actions and the settings view actions the same way', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CookieConsent description="x" onAccept={() => undefined} onDecline={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Accept all' }).parentElement).toHaveClass('flex-col', 'sm:flex-row');
    unmount();
    render(
      <CookieConsent description="x" onAccept={() => undefined} onDecline={() => undefined} categories={[{ id: 'a', title: 'A' }]} />,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('button', { name: 'Back' }).parentElement).toHaveClass('flex-col', 'sm:flex-row');
  });
  describe('focus on reopen', () => {
    const Page = ({ title = 'Cookies', titleAs, initialOpen = false, remount = false }: { title?: string; titleAs?: 'p'; initialOpen?: boolean; remount?: boolean }) => {
      const [open, setOpen] = React.useState(initialOpen);
      // `remount` re-creates the footer trigger with a new key while the banner is open, like a re-rendered footer.
      const [generation, setGeneration] = React.useState(0);
      return (
        <div>
          <footer>
            <button key={remount ? generation : 0} type="button" id="cookie-settings" onClick={() => setOpen(true)}>
              Cookie settings
            </button>
          </footer>
          <button type="button" onClick={() => setGeneration((g) => g + 1)}>
            Rerender footer
          </button>
          <CookieConsent
            open={open}
            title={title}
            titleAs={titleAs}
            description="We use cookies."
            onAccept={() => setOpen(false)}
            onDecline={() => setOpen(false)}
          />
        </div>
      );
    };

    it('does not take focus on the first automatic appearance', () => {
      render(<Page initialOpen />);
      expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
      expect(document.body).toHaveFocus();
    });

    it('does not take focus when the banner appears without a trigger holding focus', () => {
      const { rerender } = render(<CookieConsent open={false} title="Cookies" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      rerender(<CookieConsent open title="Cookies" description="x" onAccept={() => undefined} onDecline={() => undefined} />);
      expect(document.body).toHaveFocus();
    });

    it('moves focus to the title on a user reopen and back to the trigger on accept', async () => {
      const user = userEvent.setup();
      render(<Page />);
      const trigger = screen.getByRole('button', { name: 'Cookie settings' });
      await user.click(trigger);
      expect(screen.getByRole('heading', { name: 'Cookies' })).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Accept all' }));
      expect(screen.queryByRole('region')).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('returns focus after decline and after a keyboard reopen', async () => {
      const user = userEvent.setup();
      render(<Page />);
      const trigger = screen.getByRole('button', { name: 'Cookie settings' });
      trigger.focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('heading', { name: 'Cookies' })).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Decline non-essential' }));
      expect(trigger).toHaveFocus();
    });

    it('moves focus to a paragraph title when titleAs is p', async () => {
      const user = userEvent.setup();
      render(<Page titleAs="p" />);
      await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
      const region = screen.getByRole('region', { name: 'Cookies' });
      const title = within(region).getByText('Cookies');
      expect(title.tagName).toBe('P');
      expect(title).toHaveFocus();
    });

    it('focuses the region when there is no title', async () => {
      const user = userEvent.setup();
      render(<Page title="" />);
      await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
      expect(screen.getByRole('region', { name: 'Cookie consent' })).toHaveFocus();
    });

    it('finds a re-created trigger again when the banner closes', async () => {
      const user = userEvent.setup();
      render(<Page remount />);
      await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
      await user.click(screen.getByRole('button', { name: 'Rerender footer' }));
      const fresh = document.getElementById('cookie-settings');
      await user.click(screen.getByRole('button', { name: 'Accept all' }));
      expect(document.getElementById('cookie-settings')).toBe(fresh);
      expect(fresh).toHaveFocus();
    });

    it('treats a banner mounted while a trigger holds focus as a reopen (uncontrolled use)', async () => {
      const Mounted = () => {
        const [shown, setShown] = React.useState(false);
        return (
          <div>
            <button type="button" onClick={() => setShown(true)}>
              Cookie settings
            </button>
            {shown ? <CookieConsent title="Cookies" description="x" onAccept={() => setShown(false)} onDecline={() => setShown(false)} /> : null}
          </div>
        );
      };
      const user = userEvent.setup();
      render(<Mounted />);
      const trigger = screen.getByRole('button', { name: 'Cookie settings' });
      await user.click(trigger);
      expect(screen.getByRole('heading', { name: 'Cookies' })).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Accept all' }));
      expect(trigger).toHaveFocus();
    });
  });
});

describe('CookieConsent reopen API', () => {
  const noop = () => undefined;

  const FooterLink = () => {
    const { reopen } = useCookieConsent();
    return (
      <button type="button" onClick={() => reopen()}>
        Cookie settings
      </button>
    );
  };

  it('reopens an uncontrolled banner (open false) from the hook, moves focus in and back out', async () => {
    const Page = () => {
      const [decided, setDecided] = React.useState(true);
      return (
        <div>
          <FooterLink />
          <CookieConsent open={!decided} title="Cookies" description="x" onAccept={() => setDecided(true)} onDecline={() => setDecided(true)} />
        </div>
      );
    };
    const user = userEvent.setup();
    render(<Page />);
    const trigger = screen.getByRole('button', { name: 'Cookie settings' });
    await user.click(trigger);
    expect(screen.getByRole('heading', { name: 'Cookies' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('shows the banner without any open handling in the consumer and hides it after a decision', async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(
      <div>
        <FooterLink />
        <CookieConsent open={false} title="Cookies" description="x" onAccept={onAccept} onDecline={noop} />
      </div>,
    );
    expect(screen.queryByRole('region')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Cookie settings' });
    await user.click(trigger);
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('calls onReopen so a controlled consumer can set open', async () => {
    const onReopen = vi.fn();
    const user = userEvent.setup();
    render(
      <div>
        <FooterLink />
        <CookieConsent open={false} title="Cookies" description="x" onReopen={onReopen} onAccept={noop} onDecline={noop} />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
    expect(onReopen).toHaveBeenCalledTimes(1);
  });

  it('works with the plain function from a non-React handler and reports whether a banner took it', async () => {
    expect(openCookieSettings()).toBe(false);
    render(<CookieConsent open={false} title="Cookies" description="x" onAccept={noop} onDecline={noop} />);
    let handled = false;
    await act(async () => {
      handled = openCookieSettings();
    });
    expect(handled).toBe(true);
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
  });

  it('brings a banner that is already showing back to its first view with focus', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FooterLink />
        <CookieConsent title="Cookies" description="x" categories={[{ id: 'a', title: 'A' }]} onAccept={noop} onDecline={noop} />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
    expect(screen.getByRole('heading', { name: 'Cookies' })).toHaveFocus();
  });

  it('reopens a banner that was deferred', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FooterLink />
        <CookieConsent title="Cookies" description="x" closable dismissBehavior="defer" onAccept={noop} onDecline={noop} />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('region')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
  });
});

describe('CookieConsent 0.27.8', () => {
  const noop = () => undefined;

  it('returns focus inside the region of the opener when it was re-rendered, not to a same-named button elsewhere', async () => {
    let rekey = () => {};
    const Page = () => {
      const [decided, setDecided] = React.useState(true);
      const [key, setKey] = React.useState(0);
      rekey = () => setKey((k) => k + 1);
      return (
        <div>
          <header>
            <button type="button">Cookie settings</button>
          </header>
          <footer>
            <button
              key={key}
              type="button"
              onClick={() => {
                openCookieSettings();
                setDecided(false);
              }}
            >
              Cookie settings
            </button>
          </footer>
          <CookieConsent open={!decided} title="Cookies" description="x" onAccept={() => setDecided(true)} onDecline={() => setDecided(true)} />
        </div>
      );
    };
    const user = userEvent.setup();
    render(<Page />);
    const [decoy, original] = screen.getAllByRole('button', { name: 'Cookie settings' });
    await user.click(original as HTMLElement);
    // A new key while the banner is open replaces the opener with a new element.
    act(() => rekey());
    expect(original?.isConnected).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    const buttons = screen.getAllByRole('button', { name: 'Cookie settings' });
    expect(decoy).not.toHaveFocus();
    expect(buttons[1]).toHaveFocus();
  });

  it('restores focus without scrolling the page', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const Page = () => {
      const [decided, setDecided] = React.useState(true);
      return (
        <div>
          <button type="button" onClick={() => { openCookieSettings(); setDecided(false); }}>
            Cookie settings
          </button>
          <CookieConsent open={!decided} title="Cookies" description="x" onAccept={() => setDecided(true)} onDecline={() => setDecided(true)} />
        </div>
      );
    };
    const user = userEvent.setup();
    render(<Page />);
    const trigger = screen.getByRole('button', { name: 'Cookie settings' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(trigger).toHaveFocus();
    const restore = focus.mock.calls.filter(([options]) => options && (options as FocusOptions).preventScroll === true);
    expect(restore.length).toBeGreaterThanOrEqual(2);
    focus.mockRestore();
  });

  it('gives the programmatic focus targets only a keyboard outline, never the full focus ring', () => {
    render(<CookieConsent title="Cookies" description="x" onAccept={noop} onDecline={noop} />);
    const heading = screen.getByRole('heading', { name: 'Cookies' });
    const region = screen.getByRole('region', { name: 'Cookies' });
    for (const el of [heading, region]) {
      expect(el).toHaveAttribute('tabindex', '-1');
      expect(el).toHaveClass('outline-none', 'focus-visible:outline', 'focus-visible:outline-2');
      expect(el.className).not.toContain('ring-focus');
      expect(el.className).not.toContain('focus-visible:ring');
    }
  });

  it('Escape closes the banner like the close button when it is closable (decline by default)', async () => {
    const onDecline = vi.fn();
    const user = userEvent.setup();
    render(<CookieConsent title="Cookies" description="x" closable onAccept={noop} onDecline={onDecline} />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('Escape follows dismissBehavior="defer": closes without a decision', async () => {
    const onDecline = vi.fn();
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<CookieConsent title="Cookies" description="x" closable dismissBehavior="defer" onDismiss={onDismiss} onAccept={noop} onDecline={onDecline} />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Escape does nothing without a close action: it never decides on its own', async () => {
    const onDecline = vi.fn();
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<CookieConsent title="Cookies" description="x" onAccept={onAccept} onDecline={onDecline} />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    expect(onDecline).not.toHaveBeenCalled();
    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
  });

  it('Escape in the settings view goes back to the summary first', async () => {
    const onDecline = vi.fn();
    const user = userEvent.setup();
    render(<CookieConsent title="Cookies" description="x" closable categories={[{ id: 'a', title: 'Analytics' }]} onAccept={noop} onDecline={onDecline} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Accept all' })).toBeInTheDocument();
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('keeps the consumer onKeyDown and lets it prevent the Escape handling', async () => {
    const onDecline = vi.fn();
    const user = userEvent.setup();
    render(<CookieConsent title="Cookies" description="x" closable onKeyDown={(e) => e.preventDefault()} onAccept={noop} onDecline={onDecline} />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('size="sm" renders the buttons small, default keeps the 40px control', () => {
    const { rerender } = render(<CookieConsent title="Cookies" description="x" categories={[{ id: 'a', title: 'A' }]} onAccept={noop} onDecline={noop} />);
    expect(screen.getByRole('button', { name: 'Accept all' })).toHaveClass('h-control-md');
    rerender(<CookieConsent title="Cookies" description="x" size="sm" categories={[{ id: 'a', title: 'A' }]} onAccept={noop} onDecline={noop} />);
    for (const name of ['Accept all', 'Settings']) expect(screen.getByRole('button', { name })).toHaveClass('h-control-sm');
    expect(screen.getByRole('button', { name: 'Accept all' })).not.toHaveClass('h-control-md');
    expect(screen.getByRole('region', { name: 'Cookies' })).toHaveAttribute('data-size', 'sm');
  });

  it('size="sm" also applies to the settings view buttons', async () => {
    const user = userEvent.setup();
    render(<CookieConsent title="Cookies" description="x" size="sm" categories={[{ id: 'a', title: 'A' }]} onAccept={noop} onDecline={noop} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('button', { name: 'Back' })).toHaveClass('h-control-sm');
  });
});

describe('CookieConsent focus when closed without an opener (0.27.13)', () => {
  const noop = () => undefined;
  afterEach(() => {
    document.body.removeAttribute('tabindex');
    document.body.removeAttribute('style');
  });
  // The consumer owns the choice: any decision hides the banner, as in an app that stores it.
  const Banner = ({ closable = true }: { closable?: boolean }) => {
    const [open, setOpen] = React.useState(true);
    return <CookieConsent open={open} title="Cookies" description="x" closable={closable} onAccept={() => setOpen(false)} onDecline={() => setOpen(false)} />;
  };
  const Page = ({ withMain = true, closable = true }: { withMain?: boolean; closable?: boolean }) => {
    const banner = <Banner closable={closable} />;
    return withMain ? (
      <div>
        <main data-testid="main">
          <h1>Page</h1>
          <button type="button">Page action</button>
        </main>
        {banner}
      </div>
    ) : (
      <div>{banner}</div>
    );
  };

  it('keeps the first visit free of any focus move', () => {
    render(<Page />);
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('Escape moves focus to <main> instead of losing it to the body, without scrolling and without a focus ring', async () => {
    const user = userEvent.setup();
    render(<Page />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    const main = screen.getByTestId('main');
    const focusSpy = vi.spyOn(main, 'focus');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region')).toBeNull();
    expect(main).toHaveFocus();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(main.style.outline).toBe('none');
  });

  it('removes the temporary tabindex and outline from <main> once focus leaves it', async () => {
    const user = userEvent.setup();
    render(<Page />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    const main = screen.getByTestId('main');
    expect(main).toHaveAttribute('tabindex', '-1');
    // The next Tab continues at the top of the content.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Page action' })).toHaveFocus();
    expect(main).not.toHaveAttribute('tabindex');
    expect(main).not.toHaveAttribute('style');
  });

  it('falls back to the first h1 and then to the body start when the page has no <main>', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <div>
        <h1>Title</h1>
        <Banner />
      </div>,
    );
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading', { name: 'Title' })).toHaveFocus();
    unmount();
    render(<Page withMain={false} />);
    screen.getByRole('button', { name: 'Accept all' }).focus();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(document.body);
    // The body only holds the sequential navigation start for as long as it has focus.
    expect(document.body).toHaveAttribute('tabindex', '-1');
  });

  it('also covers accept and decline clicks', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Decline non-essential' }));
    expect(screen.getByTestId('main')).toHaveFocus();
  });

  it('does not move focus that is somewhere else on the page when the banner closes', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [open, setOpen] = React.useState(true);
      return (
        <div>
          <main>
            <button type="button" onClick={() => setOpen(false)}>
              Hide banner
            </button>
            <button type="button">Elsewhere</button>
          </main>
          <CookieConsent open={open} title="Cookies" description="x" onAccept={noop} onDecline={noop} />
        </div>
      );
    };
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Hide banner' }));
    expect(screen.queryByRole('region')).toBeNull();
    // Focus stays on the control the user used, which is not lost.
    expect(screen.getByRole('button', { name: 'Hide banner' })).toHaveFocus();
  });

  it('keeps returning focus to the trigger when there is one', async () => {
    const user = userEvent.setup();
    const WithTrigger = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <main>
            <button type="button" onClick={() => setOpen(true)}>
              Cookie settings
            </button>
          </main>
          <CookieConsent open={open} title="Cookies" description="x" onAccept={() => setOpen(false)} onDecline={() => setOpen(false)} />
        </div>
      );
    };
    render(<WithTrigger />);
    await user.click(screen.getByRole('button', { name: 'Cookie settings' }));
    await user.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(screen.getByRole('button', { name: 'Cookie settings' })).toHaveFocus();
  });
});
