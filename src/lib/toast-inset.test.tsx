import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';

import { CookieConsent } from '../components/ui/cookie-consent';
import { reportToastInset, TOAST_INSET_PROPERTY, useToastInset } from './toast-inset';

const inset = () => document.documentElement.style.getPropertyValue(TOAST_INSET_PROPERTY);

const mockGeometry = (element: HTMLElement, { top, height }: { top: number; height: number }) => {
  element.getBoundingClientRect = () => ({ top, bottom: top + height, height, left: 0, right: 390, width: 390, x: 0, y: top, toJSON: () => ({}) });
};

const Bar = ({ position, top, height, enabled }: { position: string; top: number; height: number; enabled?: boolean }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (ref.current) mockGeometry(ref.current, { top, height });
  });
  useToastInset(ref, { enabled });
  return <div ref={ref} data-testid="bar" style={{ position: position as React.CSSProperties['position'] }} />;
};

describe('reportToastInset / useToastInset', () => {
  beforeEach(() => {
    window.innerHeight = 800;
    document.documentElement.style.removeProperty(TOAST_INSET_PROPERTY);
  });

  it('publishes the tallest reported inset and releases it with 0', () => {
    reportToastInset('a', 80);
    reportToastInset('b', 120.2);
    expect(inset()).toBe('121px');
    reportToastInset('b', 0);
    expect(inset()).toBe('80px');
    reportToastInset('a', 0);
    expect(inset()).toBe('');
  });

  it('reports the distance from the viewport bottom to the top of a fixed bottom bar and releases on unmount', () => {
    const { unmount } = render(<Bar position="fixed" top={700} height={100} />);
    expect(inset()).toBe('100px');
    unmount();
    expect(inset()).toBe('');
  });

  it('counts the margin below a floating banner', () => {
    render(<Bar position="fixed" top={640} height={144} />);
    expect(inset()).toBe('160px');
  });

  it('ignores a bar that is not fixed or not at the bottom edge', () => {
    const { unmount } = render(<Bar position="relative" top={700} height={100} />);
    expect(inset()).toBe('');
    unmount();
    render(<Bar position="fixed" top={100} height={50} />);
    expect(inset()).toBe('');
  });

  it('reports nothing while disabled and follows enabled', () => {
    const { rerender } = render(<Bar position="fixed" top={700} height={100} enabled={false} />);
    expect(inset()).toBe('');
    rerender(<Bar position="fixed" top={700} height={100} enabled />);
    expect(inset()).toBe('100px');
  });

  // A bar that renders null first (session loading, no decision open yet) and mounts later without the hook host knowing.
  const LateBar = ({ show, top = 700, height = 100, onElement }: { show: boolean; top?: number; height?: number; onElement?: (el: HTMLElement) => void }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    useToastInset(ref);
    if (!show) return null;
    return (
      <div
        ref={(node) => {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (node) {
            mockGeometry(node, { top, height });
            onElement?.(node);
          }
        }}
        style={{ position: 'fixed' }}
      />
    );
  };

  it('picks up a bar that renders null first and releases it when it is removed', async () => {
    const { rerender } = render(<LateBar show={false} />);
    expect(inset()).toBe('');
    rerender(<LateBar show />);
    await waitFor(() => expect(inset()).toBe('100px'));
    rerender(<LateBar show={false} />);
    await waitFor(() => expect(inset()).toBe(''));
  });

  it('picks up a bar that a child mounts without the host re-rendering', async () => {
    const Host = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      useToastInset(ref);
      return <Slot ref={ref} />;
    };
    let showBar: (value: boolean) => void = () => {};
    const Slot = React.forwardRef<HTMLDivElement>((_props, ref) => {
      const [shown, setShown] = React.useState(false);
      showBar = setShown;
      return shown ? (
        <div
          ref={(node) => {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (node) mockGeometry(node, { top: 720, height: 80 });
          }}
          style={{ position: 'fixed' }}
        />
      ) : null;
    });
    Slot.displayName = 'Slot';
    render(<Host />);
    expect(inset()).toBe('');
    act(() => showBar(true));
    await waitFor(() => expect(inset()).toBe('80px'));
    act(() => showBar(false));
    await waitFor(() => expect(inset()).toBe(''));
  });

  it('releases the inset when the bar is hidden and reports again when it is shown', async () => {
    let bar: HTMLElement | null = null;
    render(<LateBar show onElement={(el) => (bar = el)} />);
    expect(inset()).toBe('100px');
    act(() => {
      bar!.style.display = 'none';
    });
    await waitFor(() => expect(inset()).toBe(''));
    act(() => {
      bar!.style.display = 'block';
    });
    await waitFor(() => expect(inset()).toBe('100px'));
  });

  it('re-measures on window resize and on visibility change', () => {
    let bar: HTMLElement | null = null;
    render(<LateBar show onElement={(el) => (bar = el)} />);
    expect(inset()).toBe('100px');
    mockGeometry(bar!, { top: 680, height: 120 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(inset()).toBe('120px');
    mockGeometry(bar!, { top: 660, height: 140 });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(inset()).toBe('140px');
  });

  it('moves the report to a new element and leaves nothing behind after unmount', async () => {
    const { rerender, unmount } = render(<LateBar key="a" show top={700} height={100} />);
    expect(inset()).toBe('100px');
    rerender(<LateBar key="b" show top={680} height={120} />);
    await waitFor(() => expect(inset()).toBe('120px'));
    unmount();
    expect(inset()).toBe('');
  });

  it('reports a sticky bar only while it sits at the bottom edge, following scrolling', async () => {
    let bar: HTMLElement | null = null;
    const Sticky = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      useToastInset(ref);
      return (
        <div
          ref={(node) => {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            bar = node;
            if (node) mockGeometry(node, { top: 1200, height: 60 });
          }}
          style={{ position: 'sticky' }}
        />
      );
    };
    render(<Sticky />);
    // Below the fold: not docked, nothing reported.
    expect(inset()).toBe('');
    // Scrolling brings it to the bottom edge.
    mockGeometry(bar!, { top: 740, height: 60 });
    act(() => {
      document.dispatchEvent(new Event('scroll'));
    });
    await waitFor(() => expect(inset()).toBe('60px'));
    // Scrolling in a nested container is caught too, and scrolling away releases the inset.
    mockGeometry(bar!, { top: 300, height: 60 });
    act(() => {
      document.body.dispatchEvent(new Event('scroll'));
    });
    await waitFor(() => expect(inset()).toBe(''));
  });

  // jsdom has no layout: fake a fixed element of the given tag at a given place.
  const fakeFixed = (tag: string, top: number, height: number) => {
    const original = window.getComputedStyle;
    const style = vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const computed = original(el, pseudo);
      if ((el as HTMLElement).tagName !== tag) return computed;
      return new Proxy(computed, { get: (target, key) => (key === 'position' ? 'fixed' : Reflect.get(target, key)) });
    });
    const proto = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function rect() {
      return this.tagName === tag ? ({ top, bottom: top + height, height, left: 0, right: 390, width: 390, x: 0, y: top, toJSON: () => ({}) } as DOMRect) : proto.call(this);
    };
    return () => {
      HTMLElement.prototype.getBoundingClientRect = proto;
      style.mockRestore();
    };
  };

  it('is used by the fixed CookieConsent banner and released when it closes', () => {
    const restore = fakeFixed('SECTION', 640, 144);
    const banner = (open: boolean) => <CookieConsent open={open} description="We use cookies." onAccept={() => {}} onDecline={() => {}} />;
    const { rerender } = render(banner(true));
    expect(inset()).toBe('160px');
    rerender(banner(false));
    expect(inset()).toBe('');
    restore();
  });

  it('is not reported by a static CookieConsent banner', () => {
    const restore = fakeFixed('SECTION', 640, 144);
    render(<CookieConsent positioning="static" description="We use cookies." onAccept={() => {}} onDecline={() => {}} />);
    expect(inset()).toBe('');
    restore();
  });
});
