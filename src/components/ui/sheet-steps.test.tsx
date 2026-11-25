import * as React from 'react';
import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './button';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetConfirm,
  SheetContent,
  SheetHeader,
  SheetStage,
  SheetStages,
  SheetTitle,
  useSheetStages,
  type SheetContentProps,
} from './sheet';

// jsdom has no PointerEvent: a MouseEvent with a pointer id carries clientY and button for the swipe tests.
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
      }
    }
    (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = PointerEventPolyfill;
  }
});

// Phone sheet (ZERO-912, gaps of ZERO-830): stages pushed in the same sheet, confirmation as a step, discard guard, grabber, 44px close and Escape past a static menu.

const Controlled = ({ onOpenChange, children, ...content }: Partial<SheetContentProps> & { onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <SheetContent {...content}>
        <SheetHeader>
          <SheetTitle>Task</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};

const PushButton = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const { push } = useSheetStages();
  return (
    <Button type="button" onClick={() => push(to)}>
      {children}
    </Button>
  );
};

const StagedTask = () => (
  <SheetStages>
    <SheetStage id="task" label="Task">
      <SheetBody>
        <label htmlFor="task-name">Name</label>
        <input id="task-name" defaultValue="" />
        <PushButton to="status">Status: Open</PushButton>
      </SheetBody>
    </SheetStage>
    <SheetStage id="status" title="Status">
      <SheetBody>
        <Button type="button">Done</Button>
      </SheetBody>
    </SheetStage>
  </SheetStages>
);

describe('Sheet close button and grabber', () => {
  it('is 44px on a bottom sheet and below md, 40px on a desktop side sheet', () => {
    const { unmount } = render(<Controlled side="bottom" />);
    expect(screen.getByRole('button', { name: 'Close' }).className).toContain('min-h-target-lg');
    unmount();
    render(<Controlled side="right" />);
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.className).toContain('h-10');
    expect(close.className).toContain('max-md:min-h-target-lg');
  });

  it('shows the grabber only when asked, hidden from assistive tech', () => {
    const { unmount } = render(<Controlled side="bottom" />);
    expect(document.querySelector('[data-slot="sheet-handle"]')).toBeNull();
    unmount();
    render(<Controlled side="bottom" handle />);
    const handle = document.querySelector('[data-slot="sheet-handle"]');
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute('aria-hidden')).toBe('true');
  });

  it('closes when the grabber is dragged down', () => {
    const onOpenChange = vi.fn();
    render(<Controlled side="bottom" handle onOpenChange={onOpenChange} />);
    const handle = document.querySelector('[data-slot="sheet-handle"]') as HTMLElement;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 10 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 200 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 200 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('Sheet Escape with a static menu', () => {
  it('closes the sheet when focus is in a role="menu" that is part of the sheet', async () => {
    const onOpenChange = vi.fn();
    render(
      <Controlled onOpenChange={onOpenChange}>
        <div role="menu" aria-label="Workspace actions">
          <button type="button" role="menuitem">
            Settings
          </button>
        </div>
      </Controlled>,
    );
    screen.getByRole('menuitem', { name: 'Settings' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('SheetStages', () => {
  it('pushes a stage with a back header, Escape goes back and returns focus, the next Escape closes', async () => {
    const onOpenChange = vi.fn();
    render(
      <Controlled onOpenChange={onOpenChange}>
        <StagedTask />
      </Controlled>,
    );
    const pusher = screen.getByRole('button', { name: 'Status: Open' });
    await userEvent.click(pusher);
    const heading = screen.getByRole('heading', { name: 'Status' });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole('group', { name: 'Status' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Task' }).className).toContain('min-h-target-lg');
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Status' })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Status: Open' })));
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the root stage mounted, hidden and inert under a pushed stage, so its input survives', async () => {
    render(
      <Controlled>
        <StagedTask />
      </Controlled>,
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Draft');
    await userEvent.click(screen.getByRole('button', { name: 'Status: Open' }));
    const root = document.querySelector('[data-stage="task"]') as HTMLElement;
    expect(root.hidden).toBe(true);
    expect(root.hasAttribute('inert')).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Back to Task' }));
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Draft');
  });

  it('reports every stage change', async () => {
    const onStageChange = vi.fn();
    render(
      <Controlled>
        <SheetStages onStageChange={onStageChange}>
          <SheetStage id="task" label="Task">
            <PushButton to="status">Status</PushButton>
          </SheetStage>
          <SheetStage id="status" title="Status">
            <p>Pick one</p>
          </SheetStage>
        </SheetStages>
      </Controlled>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Status' }));
    expect(onStageChange).toHaveBeenLastCalledWith('status', ['task', 'status']);
  });
});

const ConfirmExample = ({ onConfirm = () => {}, pending = false, onOpenChange }: { onConfirm?: () => void; pending?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const [confirm, setConfirm] = React.useState(false);
  return (
    <Controlled onOpenChange={onOpenChange}>
      <SheetBody>
        <Button type="button" onClick={() => setConfirm(true)}>
          Delete stage
        </Button>
      </SheetBody>
      <SheetConfirm
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete stage?"
        description="Deals in this stage move to Qualified."
        confirmLabel="Delete"
        tone="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </Controlled>
  );
};

describe('SheetConfirm', () => {
  it('covers the panel with the question, focuses Cancel and makes the rest inert', async () => {
    render(<ConfirmExample />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete stage' }));
    const step = screen.getByRole('group', { name: 'Delete stage?' });
    expect(step.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
    const panel = document.querySelector('[data-slot="sheet-content"]') as HTMLElement;
    expect(panel.hasAttribute('data-sheet-confirm')).toBe(true);
    expect((document.querySelector('[data-slot="sheet-close"]') as HTMLElement).inert).toBe(true);
  });

  it('Escape cancels the step, keeps the sheet open and returns focus', async () => {
    const onOpenChange = vi.fn();
    render(<ConfirmExample onOpenChange={onOpenChange} />);
    const opener = screen.getByRole('button', { name: 'Delete stage' });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: 'Delete stage?' })).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect((document.querySelector('[data-slot="sheet-close"]') as HTMLElement).inert).toBe(false);
  });

  it('confirm runs the action; pending blocks only the confirm button', async () => {
    const onConfirm = vi.fn();
    const { unmount } = render(<ConfirmExample onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete stage' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    unmount();
    render(<ConfirmExample pending />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete stage' }));
    const step = within(screen.getByRole('group', { name: 'Delete stage?' }));
    const buttons = step.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons.map((b) => b.disabled)).toEqual([false, true]);
    expect(buttons[1].getAttribute('aria-busy')).toBe('true');
  });
});

describe('Sheet discard guard', () => {
  const Guarded = ({ state, onOpenChange }: { state: SheetContentProps['state']; onOpenChange: (open: boolean) => void }) => (
    <Controlled discardGuard state={state} onOpenChange={onOpenChange}>
      <SheetBody>
        <SheetClose asChild>
          <Button type="button">Cancel edit</Button>
        </SheetClose>
      </SheetBody>
    </Controlled>
  );

  it('Escape on a dirty sheet asks "Discard changes?" in the sheet; Keep editing goes back', async () => {
    const onOpenChange = vi.fn();
    render(<Guarded state="dirty" onOpenChange={onOpenChange} />);
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Discard changes?' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('group', { name: 'Discard changes?' })).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('the close button and SheetClose ask too; Discard closes', async () => {
    const onOpenChange = vi.fn();
    render(<Guarded state="dirty" onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel edit' }));
    expect(screen.getByRole('group', { name: 'Discard changes?' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('a clean sheet closes at once', async () => {
    const onOpenChange = vi.fn();
    render(<Guarded state="default" onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('group', { name: 'Discard changes?' })).toBeNull();
  });

  it('a swipe on a dirty sheet asks instead of closing', () => {
    const onOpenChange = vi.fn();
    render(<Controlled side="bottom" handle discardGuard state="dirty" onOpenChange={onOpenChange} />);
    const handle = document.querySelector('[data-slot="sheet-handle"]') as HTMLElement;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 10 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 300 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 300 });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Discard changes?' })).toBeTruthy();
  });
});
