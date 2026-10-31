import { vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import {
  KANBAN_AUTOSCROLL,
  KANBAN_AUTOSCROLL_ARM_DISTANCE,
  KANBAN_POINTER_ACTIVATION,
  KANBAN_TOUCH_ACTIVATION,
  Kanban,
  KanbanCard,
  KanbanColumn,
  resolveKanbanTarget,
  type KanbanMove,
} from './kanban';
import { KanbanMoveToMenu } from './kanban-move-to-menu';

const Board = ({ onMove }: { onMove?: (m: KanbanMove) => void }) => (
  <Kanban aria-label="Pipeline" onMove={onMove}>
    <KanbanColumn id="lead" title="Lead" count={2} meta="EUR 380k" addLabel="Add Demand" onAdd={() => {}}>
      <KanbanCard id="a" title="Card A" subtitle="Nordwind Handel" />
      <KanbanCard id="b" title="Card B" />
    </KanbanColumn>
    <KanbanColumn id="won" title="Won" count={0} emptyLabel="No Demands in this stage" />
  </Kanban>
);

describe('Kanban', () => {
  it('renders columns as named regions with cards and header meta', () => {
    render(<Board />);
    expect(screen.getByRole('group', { name: 'Pipeline' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Lead' })).toBeInTheDocument();
    expect(screen.getByText('EUR 380k')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Card/ })).toHaveLength(2);
  });

  it('shows the empty label for a column without cards and the add action', () => {
    render(<Board />);
    expect(screen.getByText('No Demands in this stage')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Demand' })).toBeInTheDocument();
  });

  it('does not expose draggable semantics without onMove', () => {
    render(<Board />);
    const card = screen.getByRole('button', { name: /Card A/ });
    expect(card).not.toHaveAttribute('draggable');
    expect(card).not.toHaveAttribute('aria-roledescription');
  });

  it('activates a card with click and keyboard when not movable', async () => {
    const onClick = vi.fn();
    render(
      <Kanban aria-label="b">
        <KanbanColumn id="c" title="C">
          <KanbanCard id="a" title="A" onClick={onClick} />
        </KanbanColumn>
      </Kanban>,
    );
    screen.getByRole('button', { name: /A/ }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('moves a card with the keyboard: space picks up, arrows choose a target, space drops', async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    const card = screen.getByRole('button', { name: /Card A/ });
    card.focus();
    await userEvent.keyboard(' ');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    // A grabbed card keeps full opacity (text contrast) and is marked by a dashed focus border.
    expect(card).toHaveClass('border-dashed', 'border-border-focus');
    expect(card.className).not.toMatch(/opacity/);
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('region', { name: 'Won' })).toHaveAttribute('data-drop-target', 'true');
    await userEvent.keyboard(' ');
    expect(onMove).toHaveBeenCalledWith({ cardId: 'a', fromColumnId: 'lead', toColumnId: 'won', index: 0 });
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('reorders within a column with ArrowDown', async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    screen.getByRole('button', { name: /Card A/ }).focus();
    await userEvent.keyboard(' {ArrowDown} ');
    expect(onMove).toHaveBeenCalledWith({ cardId: 'a', fromColumnId: 'lead', toColumnId: 'lead', index: 1 });
  });

  it('cancels a pick up with Escape without calling onMove', async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    screen.getByRole('button', { name: /Card A/ }).focus();
    await userEvent.keyboard(' {ArrowRight}{Escape}');
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Move cancelled');
  });

  it('announces moves in a live region', async () => {
    render(<Board onMove={() => {}} />);
    screen.getByRole('button', { name: /Card A/ }).focus();
    await userEvent.keyboard(' ');
    expect(screen.getByText(/Picked up Card A/)).toBeInTheDocument();
  });

  it('works controlled: parent reorders and focus stays on the moved card', async () => {
    const Controlled = () => {
      const [cols, setCols] = useState<Record<string, string[]>>({ lead: ['a', 'b'], won: [] });
      return (
        <Kanban
          aria-label="c"
          onMove={({ cardId, fromColumnId, toColumnId, index }) => {
            setCols((prev) => {
              const next = { ...prev, [fromColumnId]: prev[fromColumnId].filter((x) => x !== cardId) };
              const target = [...(next[toColumnId] ?? prev[toColumnId])];
              target.splice(index, 0, cardId);
              return { ...next, [toColumnId]: target };
            });
          }}
        >
          {Object.entries(cols).map(([id, ids]) => (
            <KanbanColumn key={id} id={id} title={id}>
              {ids.map((c) => (
                <KanbanCard key={c} id={c} title={`Card ${c}`} />
              ))}
            </KanbanColumn>
          ))}
        </Kanban>
      );
    };
    render(<Controlled />);
    screen.getByRole('button', { name: /Card a/ }).focus();
    await userEvent.keyboard(' {ArrowRight} ');
    const won = screen.getByRole('region', { name: 'won' });
    expect(won).toContainElement(screen.getByRole('button', { name: /Card a/ }));
    expect(screen.getByRole('button', { name: /Card a/ })).toHaveFocus();
  });

  it('shows a stage dot and a record code', () => {
    render(
      <Kanban aria-label="b">
        <KanbanColumn id="c" title="C" stage={3}>
          <KanbanCard id="a" title="A" code="DEM-12" />
        </KanbanColumn>
      </Kanban>,
    );
    expect(screen.getByRole('region', { name: 'C' })).toHaveAttribute('data-stage', '3');
    expect(screen.getByText('DEM-12')).toHaveClass('typography-code-sm');
  });

  it('renders loading as a busy status', () => {
    render(<Kanban aria-label="b" state="loading" />);
    expect(screen.getByRole('status', { name: 'Loading board' })).toHaveAttribute('aria-busy', 'true');
  });

  it('renders error with retry', async () => {
    const onRetry = vi.fn();
    render(<Kanban aria-label="b" state="error" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Board not loaded');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('Kanban layout', () => {
  it('keeps the token column width and scrolls horizontally instead of squeezing columns', () => {
    const { container } = render(
      <Kanban aria-label="Board" columnWidth="fixed">
        <KanbanColumn id="a" title="A" />
        <KanbanColumn id="b" title="B" />
      </Kanban>,
    );
    const board = container.querySelector('[role="group"]') as HTMLElement;
    expect(board).toHaveClass('flex', 'overflow-x-auto');
    expect(board.className).not.toMatch(/auto-cols-fr/);
    container.querySelectorAll('[data-kanban-column]').forEach((col) => {
      expect(col).toHaveClass('w-kanban-column', 'min-w-kanban-column', 'shrink-0');
    });
  });
});

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

// Board 0..560 wide: lead column at 0..260 with cards A (0..40) and B (50..90), won column at 300..560.
const mockLayout = (container: HTMLElement) => {
  const at = (selector: string, r: DOMRect) => {
    const el = container.querySelector(selector) as HTMLElement;
    el.getBoundingClientRect = () => r;
  };
  at('[role="group"]', rect(0, 0, 560, 400));
  at('[data-column-id="lead"]', rect(0, 0, 260, 400));
  at('[data-column-id="won"]', rect(300, 0, 260, 400));
  at('[data-card-id="a"]', rect(8, 40, 244, 40));
  at('[data-card-id="b"]', rect(8, 90, 244, 40));
};

const firePointer = (target: Element | Document, type: string, init: { x: number; y: number; pointerType?: string }) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: init.x, clientY: init.y, button: 0 });
  Object.defineProperties(event, {
    pointerType: { value: init.pointerType ?? 'mouse' },
    isPrimary: { value: true },
    pointerId: { value: 1 },
  });
  act(() => {
    fireEvent(target, event);
  });
};

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

describe('Kanban sensors', () => {
  it('activates mouse after a small distance and touch after a 250ms long press with tolerance', () => {
    expect(KANBAN_POINTER_ACTIVATION).toEqual({ distance: 4 });
    expect(KANBAN_TOUCH_ACTIVATION.delay).toBe(250);
    expect(KANBAN_TOUCH_ACTIVATION.tolerance).toBeGreaterThan(0);
  });

  it('does not use native HTML5 drag and drop anymore', () => {
    render(<Board onMove={() => {}} />);
    expect(screen.getByRole('button', { name: /Card A/ })).not.toHaveAttribute('draggable');
  });

  it('keeps the own live region as the only status region', () => {
    render(<Board onMove={() => {}} />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});

describe('Kanban drop target resolution', () => {
  it('reorders within a column by the pointer position (excluding the grabbed card)', () => {
    const { container } = render(<Board onMove={() => {}} />);
    mockLayout(container);
    const board = container.querySelector('[role="group"]') as HTMLElement;
    expect(resolveKanbanTarget(board, { x: 100, y: 120 }, 'a')).toEqual({ columnId: 'lead', index: 1 });
    expect(resolveKanbanTarget(board, { x: 100, y: 45 }, 'b')).toEqual({ columnId: 'lead', index: 0 });
  });

  it('moves across columns and returns null outside the board', () => {
    const { container } = render(<Board onMove={() => {}} />);
    mockLayout(container);
    const board = container.querySelector('[role="group"]') as HTMLElement;
    expect(resolveKanbanTarget(board, { x: 400, y: 100 }, 'a')).toEqual({ columnId: 'won', index: 0 });
    expect(resolveKanbanTarget(board, { x: 700, y: 100 }, 'a')).toBeNull();
    expect(resolveKanbanTarget(board, { x: 280, y: 100 }, 'a')?.columnId).toBeDefined();
  });
});

describe('Kanban pointer and touch drag', () => {
  it('moves a card to another column with a mouse drag', async () => {
    const onMove = vi.fn();
    const { container } = render(<Board onMove={onMove} />);
    mockLayout(container);
    const card = screen.getByRole('button', { name: /Card B/ });
    firePointer(card, 'pointerdown', { x: 100, y: 110 });
    firePointer(document, 'pointermove', { x: 300, y: 110 });
    firePointer(document, 'pointermove', { x: 400, y: 110 });
    expect(screen.getByRole('region', { name: 'Won' })).toHaveAttribute('data-drop-target', 'true');
    firePointer(document, 'pointerup', { x: 400, y: 110 });
    expect(onMove).toHaveBeenCalledWith({ cardId: 'b', fromColumnId: 'lead', toColumnId: 'won', index: 0 });
    await flush();
  });

  it('reorders inside a column with a mouse drag', async () => {
    const onMove = vi.fn();
    const { container } = render(<Board onMove={onMove} />);
    mockLayout(container);
    const card = screen.getByRole('button', { name: /Card A/ });
    firePointer(card, 'pointerdown', { x: 100, y: 60 });
    firePointer(document, 'pointermove', { x: 100, y: 100 });
    firePointer(document, 'pointermove', { x: 100, y: 125 });
    firePointer(document, 'pointerup', { x: 100, y: 125 });
    expect(onMove).toHaveBeenCalledWith({ cardId: 'a', fromColumnId: 'lead', toColumnId: 'lead', index: 1 });
    await flush();
  });

  it('ignores a mouse pointerdown that does not move', () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    const card = screen.getByRole('button', { name: /Card A/ });
    firePointer(card, 'pointerdown', { x: 100, y: 60 });
    firePointer(document, 'pointerup', { x: 100, y: 60 });
    expect(onMove).not.toHaveBeenCalled();
  });

  it('starts a touch drag only after the long press and then moves the card', () => {
    vi.useFakeTimers();
    try {
      const onMove = vi.fn();
      const { container } = render(<Board onMove={onMove} />);
      mockLayout(container);
      const card = screen.getByRole('button', { name: /Card B/ });
      const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y, identifier: 1, target: card }], changedTouches: [{ clientX: x, clientY: y, identifier: 1, target: card }] });
      fireEvent.touchStart(card, touch(100, 110));
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(card).toHaveAttribute('aria-pressed', 'false');
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(card).toHaveAttribute('aria-pressed', 'true');
      fireEvent.touchMove(card, touch(400, 110));
      fireEvent.touchEnd(card, touch(400, 110));
      expect(onMove).toHaveBeenCalledWith({ cardId: 'b', fromColumnId: 'lead', toColumnId: 'won', index: 0 });
      act(() => {
        vi.runAllTimers();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the page scrollable: moving before the long press cancels the touch drag', () => {
    vi.useFakeTimers();
    try {
      const onMove = vi.fn();
      const { container } = render(<Board onMove={onMove} />);
      mockLayout(container);
      const card = screen.getByRole('button', { name: /Card B/ });
      const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y, identifier: 1, target: card }], changedTouches: [{ clientX: x, clientY: y, identifier: 1, target: card }] });
      fireEvent.touchStart(card, touch(100, 110));
      fireEvent.touchMove(card, touch(100, 160));
      act(() => {
        vi.advanceTimersByTime(400);
      });
      fireEvent.touchEnd(card, touch(100, 160));
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(onMove).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Kanban card actions', () => {
  const WithActions = ({ onMove, onMenu, onClick }: { onMove?: (m: KanbanMove) => void; onMenu: () => void; onClick?: () => void }) => (
    <Kanban aria-label="Pipeline" onMove={onMove}>
      <KanbanColumn id="lead" title="Lead">
        <KanbanCard
          id="a"
          title="Card A"
          onClick={onClick}
          actions={
            <button type="button" aria-label="Move Card A" onClick={onMenu}>
              Move
            </button>
          }
        />
      </KanbanColumn>
    </Kanban>
  );

  it('renders the actions next to the handle, not inside the button role, and keeps card click separate', async () => {
    const onMenu = vi.fn();
    const onClick = vi.fn();
    render(<WithActions onMenu={onMenu} onClick={onClick} onMove={() => {}} />);
    const action = screen.getByRole('button', { name: 'Move Card A' });
    expect(screen.getByRole('button', { name: /^Card A/ })).not.toContainElement(action);
    await userEvent.click(action);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('lets the actions move a card without dragging via the onMove callback owned by the consumer', async () => {
    const onMove = vi.fn();
    render(
      <Kanban aria-label="Pipeline" onMove={onMove}>
        <KanbanColumn id="lead" title="Lead">
          <KanbanCard id="a" title="Card A" actions={<button type="button" onClick={() => onMove({ cardId: 'a', fromColumnId: 'lead', toColumnId: 'won', index: 0 })}>Move to Won</button>} />
        </KanbanColumn>
        <KanbanColumn id="won" title="Won" />
      </Kanban>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Move to Won' }));
    expect(onMove).toHaveBeenCalledWith({ cardId: 'a', fromColumnId: 'lead', toColumnId: 'won', index: 0 });
  });
});

describe('KanbanCard actionsPlacement and titleLines', () => {
  it('keeps the actions in the top right by default', () => {
    const { container } = render(<KanbanCard id="a" title="Card A" actions={<button type="button">Do</button>} />);
    const actions = container.querySelector('[data-kanban-actions]');
    expect(actions).toHaveAttribute('data-placement', 'top');
    expect(actions).toHaveClass('top-2');
    expect(container.querySelector('[data-kanban-handle]')).toHaveClass('pr-10');
  });

  it('reserves inline action space on the title row only, not on the whole card', () => {
    const { container } = render(
      <KanbanCard id="a" title="Card A" actionsPlacement="inline" actions={<button type="button">Do</button>}>
        <span>badge</span>
      </KanbanCard>,
    );
    const handle = container.querySelector('[data-kanban-handle]');
    expect(handle).not.toHaveClass('pr-10');
    expect(handle).not.toHaveClass('pr-20');
    const titleRow = handle?.firstElementChild;
    expect(titleRow).toHaveClass('pr-7');
    expect(titleRow).toContainElement(screen.getByText('Card A'));
    expect(titleRow).not.toContainElement(screen.getByText('badge'));
  });

  it('counts the rendered actions of a fragment, not the fragment as one', () => {
    const { container, rerender } = render(
      <KanbanCard
        id="a"
        title="Card A"
        actionsPlacement="inline"
        actions={
          <>
            <button type="button">One</button>
            <button type="button">Two</button>
          </>
        }
      />,
    );
    expect(container.querySelector('[data-kanban-handle]')?.firstElementChild).toHaveClass('pr-16');
    rerender(
      <KanbanCard
        id="a"
        title="Card A"
        actionsPlacement="inline"
        actions={
          <>
            {false}
            <button type="button">One</button>
          </>
        }
      />,
    );
    expect(container.querySelector('[data-kanban-handle]')?.firstElementChild).toHaveClass('pr-7');
    rerender(<KanbanCard id="a" title="Card A" actionsPlacement="inline" actions={<>{null}</>} />);
    expect(container.querySelector('[data-kanban-handle]')?.firstElementChild).not.toHaveClass('pr-7');
  });

  it('builds the 8px gap between title row and subtitle into the card', () => {
    render(<KanbanCard id="a" title="Card A" code="K-1" subtitle="Sub" />);
    expect(screen.getByText('Sub')).toHaveClass('mt-2');
  });

  it('puts the actions in a row below the content when placed at the bottom', () => {
    const { container } = render(<KanbanCard id="a" title="Card A" actionsPlacement="bottom" actions={<button type="button">Do</button>} />);
    const actions = container.querySelector('[data-kanban-actions]');
    expect(actions).toHaveAttribute('data-placement', 'bottom');
    expect(actions).toHaveClass('bottom-2');
    expect(actions).not.toHaveClass('top-2');
    const handle = container.querySelector('[data-kanban-handle]');
    expect(handle).toHaveClass('pb-11');
    expect(handle).not.toHaveClass('pr-10');
    expect(screen.getByRole('button', { name: 'Do' })).toBeInTheDocument();
  });

  it('truncates the title to one line by default and wraps up to two lines on request', () => {
    const { rerender } = render(<KanbanCard id="a" title="A very long card title" />);
    expect(screen.getByText('A very long card title')).toHaveClass('truncate');
    rerender(<KanbanCard id="a" title="A very long card title" titleLines={2} />);
    expect(screen.getByText('A very long card title')).toHaveClass('line-clamp-2');
    expect(screen.getByText('A very long card title')).not.toHaveClass('truncate');
  });
});

describe('KanbanCard standalone', () => {
  it('renders outside a Kanban as a non-draggable static card', () => {
    render(<KanbanCard id="x" title="Task" code="T-1" />);
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelector('li')).toBeNull();
  });

  it('is a focusable button with the token focus ring when it has onClick, and opens with Enter and Space', async () => {
    const onClick = vi.fn();
    render(<KanbanCard id="x" title="Task" onClick={onClick} />);
    const card = screen.getByRole('button', { name: /Task/ });
    expect(card).toHaveClass('focus-visible:ring-focus', 'focus-visible:ring-ring-default');
    card.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe('Kanban wrapper cards', () => {
  // A wrapper without an id prop: the column must still find the grabbed card.
  const TaskCard = ({ cardId, title }: { cardId: string; title: string }) => <KanbanCard id={cardId} title={title} />;

  it('places the drop marker by the grabbed card position when the child has no id prop', async () => {
    render(
      <Kanban aria-label="Pipeline" onMove={() => undefined}>
        <KanbanColumn id="lead" title="Lead">
          <TaskCard cardId="a" title="Card A" />
          <TaskCard cardId="b" title="Card B" />
          <TaskCard cardId="c" title="Card C" />
        </KanbanColumn>
      </Kanban>,
    );
    screen.getByRole('button', { name: /Card B/ }).focus();
    await userEvent.keyboard(' ');
    // Target starts at slot 1 of the other two cards: the marker sits before C, after the grabbed B.
    const items = Array.from(screen.getByRole('region', { name: 'Lead' }).querySelectorAll('ul > li')).map((li) =>
      li.hasAttribute('data-kanban-drop-marker') ? 'marker' : li.getAttribute('data-card-id'),
    );
    expect(items).toEqual(['a', 'b', 'marker', 'c']);
    await userEvent.keyboard('{ArrowDown}');
    const after = Array.from(screen.getByRole('region', { name: 'Lead' }).querySelectorAll('ul > li')).map((li) =>
      li.hasAttribute('data-kanban-drop-marker') ? 'marker' : li.getAttribute('data-card-id'),
    );
    expect(after).toEqual(['a', 'b', 'c', 'marker']);
  });

  it('prefers getItemId when given', async () => {
    const getItemId = vi.fn((child: { props: { cardId?: string } }) => child.props.cardId);
    render(
      <Kanban aria-label="Pipeline" onMove={() => undefined}>
        <KanbanColumn id="lead" title="Lead" getItemId={getItemId as never}>
          <TaskCard cardId="a" title="Card A" />
          <TaskCard cardId="b" title="Card B" />
        </KanbanColumn>
      </Kanban>,
    );
    screen.getByRole('button', { name: /Card A/ }).focus();
    await userEvent.keyboard(' ');
    expect(getItemId).toHaveBeenCalled();
    const items = Array.from(screen.getByRole('region', { name: 'Lead' }).querySelectorAll('ul > li')).map((li) =>
      li.hasAttribute('data-kanban-drop-marker') ? 'marker' : li.getAttribute('data-card-id'),
    );
    expect(items).toEqual(['a', 'marker', 'b']);
  });
});

describe('Kanban scroll at narrow widths', () => {
  it('lets the board shrink inside flex parents and scroll with snapping', () => {
    const { container } = render(
      <Kanban aria-label="Board">
        <KanbanColumn id="a" title="A" />
      </Kanban>,
    );
    const board = container.querySelector('[role="group"]') as HTMLElement;
    expect(board).toHaveClass('min-w-0', 'max-w-full', 'overflow-x-auto', 'snap-x');
    expect(container.querySelector('[data-kanban-column]')).toHaveClass('snap-start');
  });
});

describe('KanbanColumn dot colours', () => {
  it('maps stages beyond five to project and internal tokens', () => {
    const { container } = render(
      <Kanban aria-label="Board">
        <KanbanColumn id="a" title="A" stage={7} />
        <KanbanColumn id="b" title="B" stage="internal" />
      </Kanban>,
    );
    const dots = container.querySelectorAll('[data-column-dot]');
    expect(dots[0]).toHaveClass('bg-data-project-2');
    expect(dots[1]).toHaveClass('bg-data-internal');
  });

  it('takes a custom colour that wins over the stage', () => {
    const { container } = render(
      <Kanban aria-label="Board">
        <KanbanColumn id="a" title="A" stage={1} dotColor="rgb(1, 2, 3)" />
        <KanbanColumn id="b" title="B" dotColor="bg-data-project-4" />
      </Kanban>,
    );
    const dots = container.querySelectorAll('[data-column-dot]');
    expect(dots[0]).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
    expect(dots[0]).not.toHaveClass('bg-data-stage-1');
    expect(dots[1]).toHaveClass('bg-data-project-4');
  });
});

describe('Kanban touch while the board is still coasting (0.15)', () => {
  // 0.13 added snap-x on the board. A finger landing on a coasting snap scroller kept it animating under the 250ms press, so the long press drifted past the tolerance or the touch moves turned uncancelable. The board now drops scroll snap for as long as a finger is down or a card is dragged.
  it('suspends scroll snap while a finger is down and restores it on release', () => {
    const { container } = render(
      <Kanban aria-label="Board">
        <KanbanColumn id="a" title="A" />
      </Kanban>,
    );
    const board = container.querySelector('[role="group"]') as HTMLElement;
    expect(board).toHaveClass('snap-x', 'data-[touching=true]:snap-none');
    expect(board).not.toHaveAttribute('data-touching');
    fireEvent.touchStart(board.querySelector('[data-kanban-column]') as HTMLElement, { touches: [{ clientX: 10, clientY: 10 }] });
    expect(board).toHaveAttribute('data-touching', 'true');
    fireEvent.touchEnd(document.body);
    expect(board).not.toHaveAttribute('data-touching');
  });

  it('also releases the snap suspension when the browser cancels the touch to scroll', () => {
    const { container } = render(
      <Kanban aria-label="Board">
        <KanbanColumn id="a" title="A" />
      </Kanban>,
    );
    const board = container.querySelector('[role="group"]') as HTMLElement;
    fireEvent.touchStart(board, { touches: [{ clientX: 10, clientY: 10 }] });
    expect(board).toHaveAttribute('data-touching', 'true');
    fireEvent.touchCancel(document.body);
    expect(board).not.toHaveAttribute('data-touching');
  });

  it('keeps a press tolerance that absorbs the drift of a finger landing on a coasting board', () => {
    expect(KANBAN_TOUCH_ACTIVATION.delay).toBe(250);
    expect(KANBAN_TOUCH_ACTIVATION.tolerance).toBeGreaterThanOrEqual(12);
  });
});

describe('Kanban auto-scroll arming (0.17)', () => {
  it('keeps the dnd-kit edge zone and speed for deliberate drags', () => {
    expect(KANBAN_AUTOSCROLL).toEqual({ acceleration: 4, threshold: { x: 0.15, y: 0.15 } });
    expect(KANBAN_AUTOSCROLL_ARM_DISTANCE).toBeGreaterThan(KANBAN_POINTER_ACTIVATION.distance);
  });

  it('holds auto-scroll back after a press at the edge until the pointer travelled the arm distance', async () => {
    const { container } = render(<Board onMove={() => {}} />);
    mockLayout(container);
    const board = container.querySelector('[role="group"]') as HTMLElement;
    const card = screen.getByRole('button', { name: /Card B/ });
    expect(board).not.toHaveAttribute('data-autoscroll');
    firePointer(card, 'pointerdown', { x: 100, y: 110 });
    // Past the activation distance but inside the arm distance: dragging, auto-scroll still off.
    firePointer(document, 'pointermove', { x: 100 + KANBAN_POINTER_ACTIVATION.distance + 1, y: 110 });
    expect(board).toHaveAttribute('data-autoscroll', 'pending');
    firePointer(document, 'pointermove', { x: 100 + KANBAN_AUTOSCROLL_ARM_DISTANCE + 2, y: 110 });
    expect(board).toHaveAttribute('data-autoscroll', 'armed');
    firePointer(document, 'pointerup', { x: 130, y: 110 });
    expect(board).not.toHaveAttribute('data-autoscroll');
    await flush();
  });

  it('disarms again for the next drag', async () => {
    const { container } = render(<Board onMove={() => {}} />);
    mockLayout(container);
    const board = container.querySelector('[role="group"]') as HTMLElement;
    const card = screen.getByRole('button', { name: /Card B/ });
    firePointer(card, 'pointerdown', { x: 100, y: 110 });
    firePointer(document, 'pointermove', { x: 160, y: 110 });
    firePointer(document, 'pointerup', { x: 160, y: 110 });
    await flush();
    firePointer(card, 'pointerdown', { x: 100, y: 110 });
    firePointer(document, 'pointermove', { x: 106, y: 110 });
    expect(board).toHaveAttribute('data-autoscroll', 'pending');
    firePointer(document, 'pointerup', { x: 106, y: 110 });
    await flush();
  });
});

describe('Kanban rollback focus', () => {
  const Rollback = ({ revert }: { revert: { current: () => void } }) => {
    const start = { lead: ['a', 'b'], won: [] as string[] };
    const [cols, setCols] = useState<Record<string, string[]>>(start);
    revert.current = () => setCols(start);
    return (
      <Kanban
        aria-label="c"
        onMove={({ cardId, fromColumnId, toColumnId, index }) =>
          setCols((prev) => {
            const next = { ...prev, [fromColumnId]: prev[fromColumnId].filter((x) => x !== cardId) };
            const target = [...next[toColumnId]];
            target.splice(index, 0, cardId);
            return { ...next, [toColumnId]: target };
          })
        }
      >
        {Object.entries(cols).map(([id, ids]) => (
          <KanbanColumn key={id} id={id} title={id}>
            {ids.map((c) => (
              <KanbanCard key={c} id={c} title={`Card ${c}`} />
            ))}
          </KanbanColumn>
        ))}
      </Kanban>
    );
  };

  it('returns focus to the card at its original position when the parent rolls the move back', async () => {
    const revert = { current: () => {} };
    render(<Rollback revert={revert} />);
    screen.getByRole('button', { name: /Card a/ }).focus();
    await userEvent.keyboard(' {ArrowRight} ');
    expect(screen.getByRole('region', { name: 'won' })).toContainElement(screen.getByRole('button', { name: /Card a/ }));
    // The save failed: the card remounts in its old column and the page would keep focus.
    act(() => revert.current());
    const lead = screen.getByRole('region', { name: 'lead' });
    const card = await screen.findByRole('button', { name: /Card a/ });
    expect(lead).toContainElement(card);
    await vi.waitFor(() => expect(card).toHaveFocus());
    expect(screen.getByText(/Card a moved back/)).toBeInTheDocument();
  });

  it('does not take focus back when the user moved on to something else', async () => {
    const revert = { current: () => {} };
    render(
      <>
        <button type="button">Elsewhere</button>
        <Rollback revert={revert} />
      </>,
    );
    screen.getByRole('button', { name: /Card a/ }).focus();
    await userEvent.keyboard(' {ArrowRight} ');
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    act(() => revert.current());
    await screen.findByRole('button', { name: /Card a/ });
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });
});

describe('Kanban rejected drop focus (0.20)', () => {
  // Confirm-then-move: the parent never applies the move itself. A rejected save leaves the card where it was; "blip" stands for the parent remounting the board content around the request (loading state, refetch).
  const Confirm = ({ onMove, blip }: { onMove: (m: KanbanMove) => void; blip: { current: () => void } }) => {
    const [busy, setBusy] = useState(false);
    blip.current = () => {
      setBusy(true);
      setTimeout(() => setBusy(false), 0);
    };
    return (
      <Kanban aria-label="Pipeline" onMove={onMove} state={busy ? 'loading' : 'default'}>
        <KanbanColumn id="lead" title="Lead">
          <KanbanCard id="a" title="Card A" />
          <KanbanCard id="b" title="Card B" />
        </KanbanColumn>
        <KanbanColumn id="won" title="Won" />
      </Kanban>
    );
  };

  it('puts focus back on the card after a pointer drag whose move the parent did not apply', async () => {
    const onMove = vi.fn();
    const { container } = render(<Confirm onMove={onMove} blip={{ current: () => {} }} />);
    mockLayout(container);
    const card = screen.getByRole('button', { name: /Card B/ });
    expect(document.body).toHaveFocus();
    firePointer(card, 'pointerdown', { x: 100, y: 110 });
    firePointer(document, 'pointermove', { x: 300, y: 110 });
    firePointer(document, 'pointermove', { x: 400, y: 110 });
    firePointer(document, 'pointerup', { x: 400, y: 110 });
    expect(onMove).toHaveBeenCalledWith({ cardId: 'b', fromColumnId: 'lead', toColumnId: 'won', index: 0 });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /Card B/ })).toHaveFocus());
    expect(screen.getByRole('region', { name: 'Lead' })).toContainElement(screen.getByRole('button', { name: /Card B/ }));
  });

  it('puts focus back on the card when the parent remounts the board after a rejected keyboard drop', async () => {
    const blip = { current: () => {} };
    render(<Confirm onMove={() => undefined} blip={blip} />);
    screen.getByRole('button', { name: /Card A/ }).focus();
    await userEvent.keyboard(' {ArrowRight} ');
    act(() => blip.current());
    const card = await screen.findByRole('button', { name: /Card A/ });
    expect(screen.getByRole('region', { name: 'Lead' })).toContainElement(card);
    await vi.waitFor(() => expect(card).toHaveFocus());
  });

  it('puts focus back on the card when the parent remounts the board after a rejected move-to-menu move', async () => {
    const blip = { current: () => {} };
    const Menu = () => {
      const [busy, setBusy] = useState(false);
      blip.current = () => {
        setBusy(true);
        setTimeout(() => setBusy(false), 0);
      };
      return (
        <Kanban aria-label="Pipeline" onMove={() => undefined} state={busy ? 'loading' : 'default'}>
          <KanbanColumn id="lead" title="Lead">
            <KanbanCard id="a" title="Card A" actions={<KanbanMoveToMenu title="Card A" targets={[{ id: 'lead', label: 'Lead' }, { id: 'won', label: 'Won' }]} currentId="lead" onMove={() => blip.current()} />} />
          </KanbanColumn>
          <KanbanColumn id="won" title="Won" />
        </Kanban>
      );
    };
    render(<Menu />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Actions for Card A' }), { key: 'Enter' });
    // dnd-kit swallows document clicks for 50ms after a drag ends, and the drag of the previous test can still be inside that window.
    await act(() => new Promise((resolve) => setTimeout(resolve, 60)));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Won' }));
    const card = await screen.findByRole('button', { name: /^Card A$/ });
    expect(screen.getByRole('region', { name: 'Lead' })).toContainElement(card);
    await vi.waitFor(() => expect(card).toHaveFocus());
  });

  it('does not take focus when the user moved on to something else', async () => {
    const blip = { current: () => {} };
    render(
      <>
        <button type="button">Elsewhere</button>
        <Confirm onMove={() => undefined} blip={blip} />
      </>,
    );
    screen.getByRole('button', { name: /Card A/ }).focus();
    await userEvent.keyboard(' {ArrowRight} ');
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    act(() => blip.current());
    await screen.findByRole('button', { name: /Card A/ });
    await flush();
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });
});

describe('Kanban stale refocus after a rejected move (0.21)', () => {
  // Confirm-then-move on a touch board: the save is refused after 800ms and the board shows its loading state meanwhile. The refocus watch of the first move must not outlive the next interaction.
  const Confirm = ({ blip }: { blip?: { current: () => void } }) => {
    const [busy, setBusy] = useState(false);
    const reject = () => {
      setBusy(true);
      setTimeout(() => setBusy(false), 800);
    };
    if (blip) blip.current = reject;
    return (
      <Kanban aria-label="Pipeline" onMove={reject} state={busy ? 'loading' : 'default'}>
        <KanbanColumn id="lead" title="Lead">
          <KanbanCard id="a" title="Card A" />
          <KanbanCard id="b" title="Card B" />
        </KanbanColumn>
        <KanbanColumn id="won" title="Won" />
      </Kanban>
    );
  };

  const touchAt = (card: Element, x: number, y: number) => ({
    touches: [{ clientX: x, clientY: y, identifier: 1, target: card }],
    changedTouches: [{ clientX: x, clientY: y, identifier: 1, target: card }],
  });
  const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  const focusedCards = (spy: { mock: { instances: unknown[] } }) =>
    spy.mock.instances.map((el) => (el as HTMLElement).closest('[data-kanban-card]')?.getAttribute('data-card-id')).filter(Boolean);

  // Rejects a touch drag of card B and lets the board settle: B is focused again.
  const rejectTouchDrag = async (container: HTMLElement) => {
    mockLayout(container);
    const card = screen.getByRole('button', { name: /Card B/ });
    fireEvent.touchStart(card, touchAt(card, 100, 110));
    await advance(300);
    fireEvent.touchMove(card, touchAt(card, 400, 110));
    fireEvent.touchEnd(card, touchAt(card, 400, 110));
    await advance(900);
    expect(screen.getByRole('button', { name: /Card B/ })).toHaveFocus();
  };

  it.each([2500, 4000])('does not pull focus back to the rejected card when another card is long-pressed after %ims', async (gap) => {
    vi.useFakeTimers();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    try {
      const { container } = render(<Confirm />);
      await rejectTouchDrag(container);
      await advance(gap);
      // The long press on another card leaves focus on the page.
      act(() => (document.activeElement as HTMLElement).blur());
      focus.mockClear();
      const other = screen.getByRole('button', { name: /Card A/ });
      mockLayout(container);
      fireEvent.touchStart(other, touchAt(other, 100, 60));
      await advance(300);
      expect(other).toHaveAttribute('aria-pressed', 'true');
      fireEvent.touchMove(other, touchAt(other, 120, 60));
      await advance(50);
      expect(focusedCards(focus)).not.toContain('b');
      expect(screen.getByRole('button', { name: /Card B/ })).not.toHaveFocus();
      fireEvent.touchEnd(other, touchAt(other, 120, 60));
      await advance(100);
    } finally {
      focus.mockRestore();
      vi.useRealTimers();
    }
  });

  it('does not refocus the rejected card when a keyboard grab starts on another card', async () => {
    vi.useFakeTimers();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    try {
      const { container } = render(<Confirm />);
      await rejectTouchDrag(container);
      act(() => (document.activeElement as HTMLElement).blur());
      focus.mockClear();
      fireEvent.keyDown(screen.getByRole('button', { name: /Card A/ }), { key: ' ' });
      await advance(50);
      expect(focusedCards(focus)).not.toContain('b');
    } finally {
      focus.mockRestore();
      vi.useRealTimers();
    }
  });

  it('does not refocus the rejected card when a mouse drag starts on another card', async () => {
    vi.useFakeTimers();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    try {
      const { container } = render(<Confirm />);
      await rejectTouchDrag(container);
      act(() => (document.activeElement as HTMLElement).blur());
      focus.mockClear();
      firePointer(screen.getByRole('button', { name: /Card A/ }), 'pointerdown', { x: 100, y: 60 });
      firePointer(document, 'pointermove', { x: 200, y: 60 });
      await advance(50);
      expect(focusedCards(focus)).not.toContain('b');
    } finally {
      focus.mockRestore();
      vi.useRealTimers();
    }
  });

  it('does not refocus the rejected card once focus moved elsewhere and the page dropped it again', async () => {
    vi.useFakeTimers();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    try {
      const blip = { current: () => {} };
      const { container } = render(
        <>
          <button type="button">Elsewhere</button>
          <Confirm blip={blip} />
        </>,
      );
      await rejectTouchDrag(container);
      act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
      act(() => (document.activeElement as HTMLElement).blur());
      focus.mockClear();
      act(() => blip.current());
      await advance(900);
      expect(focusedCards(focus)).not.toContain('b');
    } finally {
      focus.mockRestore();
      vi.useRealTimers();
    }
  });
});
