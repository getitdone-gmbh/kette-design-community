import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { Toast, ToastAction, ToastClose, ToastProvider, ToastTitle, ToastViewport } from './toast';
import { Toaster } from './toaster';
import { ACTION_TOAST_DURATION, toast, useToast } from './use-toast';

// Radix Toast uses pointer capture, which jsdom lacks.
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

// C-5: Toast with an action slot (Undo) as data, rendered by the Toaster.
describe('Toast action slot (C-5)', () => {
  it('renders the action descriptor as a button before the close button', async () => {
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => {
      toast({ title: 'Checks disabled', action: { label: 'Undo', altText: 'Undo disabling checks', onClick } });
    });
    const action = await screen.findByRole('button', { name: 'Undo' });
    const close = screen.getByRole('button', { name: 'Dismiss' });
    // Action comes first in tab order, so the keyboard reaches it before the dismissal control.
    expect(action.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(action).toHaveAttribute('data-radix-toast-announce-alt', 'Undo disabling checks');
    await userEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);
    act(() => {
      toast({ title: 'cleanup' });
    });
  });

  it('altText defaults to the label', async () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Removed', action: { label: 'Undo' } });
    });
    const action = await screen.findByRole('button', { name: 'Undo' });
    expect(action).toHaveAttribute('data-radix-toast-announce-alt', 'Undo');
  });

  it('an element action still works', async () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Removed', action: <button type="button">Custom</button> as never });
    });
    expect(await screen.findByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  it('is reachable with the keyboard and activates with Enter', async () => {
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => {
      toast({ title: 'Saved', action: { label: 'Undo', onClick } });
    });
    const action = await screen.findByRole('button', { name: 'Undo' });
    action.focus();
    expect(action).toHaveFocus();
    fireEvent.keyDown(action, { key: 'Enter' });
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(onClick).toHaveBeenCalled());
  });
});

describe('Toast timeout and focus (C-5)', () => {
  it('pauses the timeout while the action has focus and dismisses after focus leaves', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(
        <ToastProvider duration={1000}>
          <Toast>
            <ToastTitle>Disabled checks</ToastTitle>
            <ToastAction altText="Undo disabling checks">Undo</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );
      const action = screen.getByRole('button', { name: 'Undo' });
      act(() => action.focus());
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
      act(() => action.blur());
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull());
    } finally {
      vi.useRealTimers();
    }
  });
});

// UX-RZ-02, UX-RZ-03: focus ring on the root tab stop and a longer default for a toast with an action.
describe('Toast focus and duration', () => {
  it('the toast root is a tab stop with the inset focus ring', async () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>Saved</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const root = document.querySelector('li[data-state="open"]') as HTMLElement;
    expect(root).toHaveClass('focus-visible:ring-inset', 'focus-visible:ring-ring-default');
  });

  it('a toast with an action stays open past the 5 s default, one without closes', async () => {
    vi.useFakeTimers();
    try {
      render(<Toaster />);
      act(() => {
        toast({ title: 'With action', action: { label: 'Undo' } });
      });
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

// R-LIB-01 (L-26): the action duration lives in the store entry, so custom renderers inherit it.
describe('Action toast duration in the store (R-LIB-01)', () => {
  const lastEntry = () => {
    const { result } = renderHook(() => useToast());
    return result.current.toasts[0];
  };

  it('gives an action toast without duration the 10 s action duration', () => {
    act(() => {
      toast({ title: 'Removed', action: { label: 'Undo' } });
    });
    expect(ACTION_TOAST_DURATION).toBe(10000);
    expect(lastEntry().duration).toBe(10000);
  });

  it('keeps an explicit duration on an action toast', () => {
    act(() => {
      toast({ title: 'Removed', action: { label: 'Undo' }, duration: 3000 });
    });
    expect(lastEntry().duration).toBe(3000);
  });

  it('leaves duration undefined without an action', () => {
    act(() => {
      toast({ title: 'Saved' });
    });
    expect(lastEntry().duration).toBeUndefined();
  });
});
