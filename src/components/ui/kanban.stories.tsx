import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/jest';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { DesignSystemProvider } from './design-system-provider';
import { useState } from 'react';

import { Badge } from './badge';

import { DropdownMenuItem } from './dropdown-menu';
import { Chip } from './chip';
import { Checkbox } from './checkbox';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { Kanban, KanbanCard, KanbanColumn, kanbanAutoScroll, useKanbanSensors, type KanbanMove } from './kanban';
import { applyKanbanMove, moveToColumn, type KanbanColumnData } from './kanban-move';
import { KanbanMoveToMenu } from './kanban-move-to-menu';
import { ObjectIcon } from './object-icon';

const meta = {
  id: 'patterns-kanban',
  title: 'Patterns · Data/Kanban',
  component: Kanban,
  tags: ['autodocs'],
  // onMove enables drag (mouse, pen and touch long press) and the keyboard move model, onRetry shows the error button
  parameters: {
    actions: { argTypesRegex: '^on(?!Move|Retry)[A-Z].*' },
    docs: {
      description: {
        component:
          'Drag with mouse or pen after a small movement, with touch after a 250 ms long press so scrolling the board and the columns still works. The board and the column bodies auto-scroll near their edges once the pointer has moved a short distance after the drag started, so a long press at the edge does not scroll the board away. Keyboard: Space picks up, arrows choose the target, Space drops, Escape cancels. Pass `actions` to a `KanbanCard` for a move menu that works without dragging.',
      },
    },
  },
  args: { 'aria-label': 'Pipeline' },
} satisfies Meta<typeof Kanban>;

export default meta;
type Story = StoryObj<typeof meta>;

type Card = { id: string; title: string; sub: string };

const initial: Record<string, Card[]> = {
  lead: [
    { id: 'a', title: 'Senior Java Developer', sub: 'Acme GmbH, Munich' },
    { id: 'b', title: 'Platform Engineer', sub: 'Nordlicht AG, Hamburg' },
  ],
  qualified: [{ id: 'c', title: 'Data Engineer', sub: 'Globex, Berlin' }],
  offer: [],
};

const titles: Record<string, string> = { lead: 'Lead', qualified: 'Qualified', offer: 'Offer' };

const Board = ({ metaFor, headerExtraFor }: { metaFor?: (id: string, count: number) => string | undefined; headerExtraFor?: (id: string, count: number) => string | undefined }) => {
  const [cols, setCols] = useState(initial);
  const onMove = ({ cardId, fromColumnId, toColumnId, index }: KanbanMove) =>
    setCols((prev) => {
      const card = prev[fromColumnId].find((c) => c.id === cardId);
      if (!card) return prev;
      const next = { ...prev, [fromColumnId]: prev[fromColumnId].filter((c) => c.id !== cardId) };
      const target = [...next[toColumnId]];
      target.splice(index, 0, card);
      return { ...next, [toColumnId]: target };
    });
  return (
    <Kanban aria-label="Pipeline" onMove={onMove}>
      {Object.entries(cols).map(([id, cards]) => (
        <KanbanColumn key={id} id={id} title={titles[id]} count={cards.length} meta={metaFor?.(id, cards.length)} headerExtra={headerExtraFor?.(id, cards.length)} emptyLabel="No Demands in this stage" addLabel="Add Demand" onAdd={() => {}}>
          {cards.map((c) => (
            <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} leading={<ObjectIcon app="vacancy" size="lg">AC</ObjectIcon>}>
              <Chip label="Interview" size="small" />
              <span className="typography-text-extra-small ml-auto tabular-nums text-muted-foreground">EUR 96k</span>
            </KanbanCard>
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
};

export const Pipeline: Story = { render: () => <Board metaFor={(_, n) => `EUR ${n * 96}k`} /> };
export const BoardWithCounts: Story = { render: () => <Board /> };
export const Funnel: Story = { render: () => <Board metaFor={(_, n) => `${n * 33} %`} headerExtraFor={(_, n) => `${n * 33} % conversion`} /> };
export const Loading: Story = { args: { state: 'loading' } };
export const ErrorState: Story = { args: { state: 'error' } };

export const Localized: Story = {
  args: {} as any,
  parameters: {
    docs: {
      description: {
        story:
          'Provider locale `de` translates the column texts and the keyboard announcements. `KanbanColumn` takes `addText` (the older `addLabel` still works) and `emptyText`. Props win over the provider.',
      },
    },
  },
  render: () => (
    <DesignSystemProvider locale="de">
      <Kanban aria-label="Pipeline">
        <KanbanColumn id="lead" title="Lead" onAdd={() => {}} />
        <KanbanColumn id="offer" title="Angebot" onAdd={() => {}} addText="Karte anlegen" emptyText="Hier ist noch nichts" />
      </Kanban>
    </DesignSystemProvider>
  ),
};

const moveCard = (prev: Record<string, Card[]>, { cardId, fromColumnId, toColumnId, index }: KanbanMove) => {
  const card = prev[fromColumnId].find((c) => c.id === cardId);
  if (!card) return prev;
  const next = { ...prev, [fromColumnId]: prev[fromColumnId].filter((c) => c.id !== cardId) };
  const target = [...next[toColumnId]];
  target.splice(index, 0, card);
  return { ...next, [toColumnId]: target };
};

const initialColumns = (): KanbanColumnData<Card>[] => Object.entries(initial).map(([id, items]) => ({ id, items }));

const BoardWithMoveMenu = ({ extraActions = false }: { extraActions?: boolean }) => {
  const [cols, setCols] = useState(initialColumns);
  const targets = cols.map((c) => ({ id: c.id, label: titles[c.id] }));
  return (
    <Kanban aria-label="Pipeline" onMove={(move) => setCols((prev) => applyKanbanMove(prev, move))}>
      {cols.map(({ id, items }) => (
        <KanbanColumn key={id} id={id} title={titles[id]} count={items.length} emptyLabel="No Demands in this stage">
          {items.map((c) => (
            <KanbanCard
              key={c.id}
              id={c.id}
              title={c.title}
              subtitle={c.sub}
              actions={
                <KanbanMoveToMenu title={c.title} targets={targets} currentId={id} onMove={(to) => setCols((prev) => moveToColumn(prev, c.id, to))}>
                  {extraActions ? <DropdownMenuItem>Open</DropdownMenuItem> : null}
                </KanbanMoveToMenu>
              }
            >
              <Chip label="Interview" size="small" />
            </KanbanCard>
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
};

export const MoveToMenu: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The `actions` slot sits outside the drag handle. `KanbanMoveToMenu` offers the same move without dragging, for example for assistive technology or fine pointer control. `applyKanbanMove` and `moveToColumn` update the columns immutably. Text follows the provider locale; the `labels` prop wins.',
      },
    },
  },
  render: () => <BoardWithMoveMenu />,
};

export const MoveToMenuGerman: Story = {
  parameters: { docs: { description: { story: 'German provider locale with a further card action below the move targets.' } } },
  render: () => (
    <DesignSystemProvider locale="de">
      <BoardWithMoveMenu extraActions />
    </DesignSystemProvider>
  ),
};

export const WideBoard: Story = {
  parameters: { docs: { description: { story: 'More columns than the viewport: the board scrolls horizontally and scrolls itself while a card is dragged near the edge.' } } },
  render: () => {
    const Wide = () => {
      const ids = ['lead', 'qualified', 'proposal', 'negotiation', 'offer', 'won'];
      const [cols, setCols] = useState<Record<string, Card[]>>(() =>
        Object.fromEntries(ids.map((id, i) => [id, i < 3 ? [{ id: `${id}-1`, title: `Card ${i + 1}`, sub: 'Acme GmbH' }] : []])),
      );
      return (
        <Kanban aria-label="Pipeline" onMove={(move) => setCols((prev) => moveCard(prev, move))}>
          {ids.map((id) => (
            <KanbanColumn key={id} id={id} title={id.charAt(0).toUpperCase() + id.slice(1)} count={cols[id].length} emptyLabel="Empty">
              {cols[id].map((c) => (
                <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} />
              ))}
            </KanbanColumn>
          ))}
        </Kanban>
      );
    };
    return <Wide />;
  },
};

// Outside a Kanban the card is a static surface, a button only when it has onClick.
export const Standalone: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <KanbanCard id="s1" title="Static card" code="NWH-1" subtitle="No click handler" />
      <KanbanCard id="s2" title="Clickable card" code="NWH-2" onClick={() => {}} />
    </div>
  ),
};

export const NarrowViewport: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: { description: { story: 'At 390px wide the board scrolls horizontally and columns snap to the left edge.' } },
  },
  render: () => (
    <div className="flex w-96 flex-col">
      <Kanban aria-label="Pipeline">
        {['lead', 'qualified', 'proposal'].map((id, i) => (
          <KanbanColumn key={id} id={id} title={id.charAt(0).toUpperCase() + id.slice(1)} stage={(i + 1) as 1 | 2 | 3} count={1}>
            <KanbanCard id={`${id}-1`} title={`Card ${i + 1}`} subtitle="Acme GmbH" />
          </KanbanColumn>
        ))}
      </Kanban>
    </div>
  ),
};

export const ExtendedDotColours: Story = {
  render: () => (
    <Kanban aria-label="Pipeline">
      <KanbanColumn id="a" title="Stage 6" stage={6} emptyLabel="Empty" />
      <KanbanColumn id="b" title="Internal" stage="internal" emptyLabel="Empty" />
      <KanbanColumn id="c" title="Custom" dotColor="bg-data-project-8" emptyLabel="Empty" />
    </Kanban>
  ),
};

export const ActionsAtBottom: Story = {
  parameters: {
    docs: {
      description: {
        story: '`actionsPlacement="bottom"` renders the actions as a row under the content, so the title keeps the full card width. Combine it with `titleLines={2}` to let long titles wrap.',
      },
    },
  },
  render: () => (
    <div className="w-64">
      <KanbanCard
        id="long"
        title="Migrate the customer portal to the new design system and retire the legacy table"
        code="NWH-142"
        actionsPlacement="bottom"
        titleLines={2}
        actions={<KanbanMoveToMenu title="Migrate the customer portal" targets={[{ id: 'a', label: 'Backlog' }, { id: 'b', label: 'Doing' }]} currentId="a" onMove={() => undefined} />}
      >
        <Chip label="Interview" size="small" />
      </KanbanCard>
    </div>
  ),
};

// Optimistic move whose save fails: the card jumps to the new column, then the parent puts it back. Focus must return to the card at its original position. Move a card with the keyboard (Space, arrow, Space) to see it.
const RollbackBoard = () => {
  const [cols, setCols] = useState(initial);
  const onMove = (move: KanbanMove) => {
    setCols((prev) => moveCard(prev, move));
    // The server refuses the move after a moment.
    setTimeout(() => setCols(initial), 800);
  };
  return (
    <Kanban aria-label="Pipeline" onMove={onMove}>
      {Object.entries(cols).map(([id, cards]) => (
        <KanbanColumn key={id} id={id} title={titles[id]} count={cards.length} emptyLabel="No Demands in this stage">
          {cards.map((c) => (
            <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} />
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
};
export const MoveRolledBack: Story = { render: () => <RollbackBoard /> };

// Confirm-then-move: the board never applies the move itself, the app waits for the server and shows the loading state meanwhile. The server refuses, the card is still in its column and focus is back on it. Move a card with the keyboard (Space, arrow, Space), a drag or the move menu.
const ConfirmBoard = () => {
  const [busy, setBusy] = useState(false);
  const onMove = () => {
    setBusy(true);
    // The server refuses the move after a moment, nothing changes on the board.
    setTimeout(() => setBusy(false), 800);
  };
  return (
    <Kanban aria-label="Pipeline" onMove={onMove} state={busy ? 'loading' : 'default'}>
      {Object.entries(initial).map(([id, cards]) => (
        <KanbanColumn key={id} id={id} title={titles[id]} count={cards.length} emptyLabel="No Demands in this stage">
          {cards.map((c) => (
            <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} />
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
};
export const MoveRejected: Story = { render: () => <ConfirmBoard /> };

// A switched-off stage keeps its cards but takes no new ones. Its own cards still reorder and leave.
// Offer starts with a card, as in the product: an empty column would show its dashed empty frame inside the dashed outline.
const dropDisabledInitial: Record<string, Card[]> = { ...initial, offer: [{ id: 'd', title: 'Cloud Architect', sub: 'Initech, Cologne' }] };

const DropDisabledBoard = () => {
  const [cols, setCols] = useState(dropDisabledInitial);
  return (
    <Kanban aria-label="Pipeline" onMove={(move) => setCols((prev) => moveCard(prev, move))}>
      {Object.entries(cols).map(([id, cards]) => (
        <KanbanColumn
          key={id}
          id={id}
          title={titles[id]}
          // As in the product, the region name carries the stage state; announcements still say the title.
          label={id === 'offer' ? 'Offer, stage is off, does not accept cards' : undefined}
          count={cards.length}
          dropDisabled={id === 'offer'}
          badge={id === 'offer' ? <Badge variant="outline" className="bg-background">Off</Badge> : undefined}
          emptyLabel="No Demands in this stage"
        >
          {cards.map((c) => (
            <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} />
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
};

export const DropDisabled: Story = {
  name: 'Drop disabled',
  parameters: {
    docs: {
      description: {
        story:
          '`dropDisabled` on a `KanbanColumn`: while a card from another column is over it, a dashed outline 2px inside the column and the not-allowed cursor show, no drop marker. On release the card stays where it was, `onMove` is not called and the live region says the column does not accept cards (`kanbanDropDisabled`, per column `dropDisabledText`). `badge` puts a status badge right after the count. Announcements name a column by its string `title`, so a `label` with more detail (here the stage state) stays the region name without being read twice. `dropDisabled` does not filter the targets of `KanbanMoveToMenu`: leave the column out of `targets` yourself.',
      },
    },
  },
  render: () => <DropDisabledBoard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const offer = canvas.getByRole('region', { name: 'Offer, stage is off, does not accept cards' });
    await expect(within(offer).getByText('Off')).toBeInTheDocument();
    // Keyboard move of the Qualified card onto the switched-off Offer column.
    canvas.getByRole('button', { name: /Data Engineer/ }).focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(offer).toHaveAttribute('data-drop-refused', 'true'));
    await expect(canvas.getByRole('status')).toHaveTextContent(/^Offer, does not accept cards$/);
    const style = getComputedStyle(offer);
    await expect(style.outlineStyle).toBe('dashed');
    await expect(style.outlineWidth).toBe('2px');
    await expect(style.outlineOffset).toBe('-2px');
    await expect(style.cursor).toBe('not-allowed');
    await expect(offer.querySelector('[data-kanban-drop-marker]')).toBeNull();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Offer does not accept cards. Data Engineer stays in Qualified.'));
    await expect(canvas.getByRole('region', { name: 'Qualified' })).toContainElement(canvas.getByRole('button', { name: /Data Engineer/ }));
  },
};

// ZERO-756 L-36: `dropLabel` per column. A card from another column shows the dashed drop box with the label, a reorder inside a column keeps the line.
const probabilities: Record<string, number> = { lead: 10, qualified: 30, offer: 50 };
const DropLabelBoard = () => {
  const [cols, setCols] = useState(initial);
  return (
    <Kanban aria-label="Pipeline" onMove={(move) => setCols((prev) => moveCard(prev, move))}>
      {Object.entries(cols).map(([id, cards]) => (
        <KanbanColumn key={id} id={id} title={titles[id]} count={cards.length} dropLabel={`Drop here · ${titles[id]} ${probabilities[id]}%`} emptyLabel="No Demands in this stage">
          {cards.map((c) => (
            <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} />
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
};

export const DropLabel: Story = {
  name: 'Drop label',
  parameters: {
    docs: {
      description: {
        story:
          '`dropLabel` on a `KanbanColumn`: while a card from another column is over it, the drop place is a dashed box with the label (arrow icon, brand subtle fill, 160px high) and the keyboard move announces the label before the position. A reorder inside the column keeps the line. The play function picks up the Lead card with Space and moves it right, so the box shows.',
      },
    },
  },
  render: () => <DropLabelBoard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: /Senior Java Developer/ }).focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowRight}');
    const qualified = canvas.getByRole('region', { name: 'Qualified' });
    await waitFor(() => expect(qualified.querySelector('[data-drop-label]')).toHaveTextContent('Drop here · Qualified 30%'));
    await expect(canvas.getByRole('status')).toHaveTextContent(/^Drop here · Qualified 30%, position 1$/);
  },
};

// The same box while a card is dragged with the mouse: the play function presses on the Lead card and moves the pointer over Qualified without letting go. The dragged card sits below the label, the text at the top of the box stays readable.
const pointer = (target: EventTarget, type: string, x: number, y: number) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true }));

export const DropLabelMouseDrag: Story = {
  name: 'Drop label, mouse drag',
  parameters: { docs: { description: { story: 'Mouse drag state of `dropLabel`: the card is held over the next column, the label at the top of the box stays visible above it.' } } },
  render: () => <DropLabelBoard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /Senior Java Developer/ });
    const qualified = canvas.getByRole('region', { name: 'Qualified' });
    // The test runner starts the story in whatever viewport the previous story left: wait for a laid out board and bring the target column into view (at 390 it starts off screen).
    await waitFor(() => expect(card.getBoundingClientRect().width > 0 && qualified.getBoundingClientRect().width > 0).toBe(true));
    qualified.scrollIntoView({ block: 'nearest', inline: 'end' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Press on the visible part of the card (it may be partly scrolled away on a phone).
    const from = card.getBoundingClientRect();
    const startX = Math.max(from.left, 0) + (Math.min(from.right, window.innerWidth) - Math.max(from.left, 0)) / 2;
    const startY = from.top + from.height / 2;
    pointer(card, 'pointerdown', startX, startY);
    let step = 0;
    // Keep moving towards the middle of the target column until the box shows; each try is one more pointer step, so a slow runner simply takes more steps.
    await waitFor(
      () => {
        const to = qualified.getBoundingClientRect();
        step = Math.min(step + 1, 8);
        pointer(document, 'pointermove', startX + ((to.left + to.width / 2 - startX) * step) / 8, startY + 60);
        expect(qualified.querySelector('[data-drop-label]')).toHaveTextContent('Drop here · Qualified 30%');
      },
      { timeout: 8000, interval: 50 },
    );
    // Like the prototype ghost: the held card rests in the lower part of the box, under the label at the top.
    const box = (qualified.querySelector('[data-drop-label]') as HTMLElement).getBoundingClientRect();
    pointer(document, 'pointermove', box.left + box.width / 2, box.top + box.height * 0.7);
    await waitFor(() => expect(qualified.querySelector('[data-drop-label]')).toHaveTextContent('Drop here · Qualified 30%'), { timeout: 4000 });
  },
};

// A select-all checkbox per column in a selection mode: the title row keeps its height, a long title shortens with an ellipsis.
const HeaderActionBoard = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const longTitles: Record<string, string> = { ...titles, qualified: 'Qualified after the first call' };
  return (
    <Kanban aria-label="Pipeline" columnWidth="fixed">
      {Object.entries(initial).map(([id, cards]) => {
        const ids = cards.map((c) => c.id);
        const n = ids.filter((x) => selected.includes(x)).length;
        return (
          <KanbanColumn
            key={id}
            id={id}
            title={longTitles[id]}
            count={cards.length}
            meta={id === 'qualified' ? 'Limit 2' : undefined}
            headerAction={
              <Checkbox
                size="sm"
                aria-label={`Select all in ${longTitles[id]}`}
                checked={n === 0 ? false : n === ids.length ? true : 'indeterminate'}
                onCheckedChange={() => setSelected((prev) => (n === ids.length ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])]))}
              />
            }
            emptyLabel="No Demands in this stage"
          >
            {cards.map((c) => (
              <KanbanCard key={c.id} id={c.id} title={c.title} subtitle={c.sub} />
            ))}
          </KanbanColumn>
        );
      })}
    </Kanban>
  );
};

export const HeaderAction: Story = {
  name: 'Header action',
  parameters: {
    docs: {
      description: {
        story:
          '`headerAction` puts a control at the end of the title row, after `meta`, for example a select-all checkbox in a selection mode. The row keeps its height, so the columns do not move when the mode starts, and a long title shortens with an ellipsis instead of wrapping.',
      },
    },
  },
  render: () => <HeaderActionBoard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lead = canvas.getByRole('region', { name: 'Lead' });
    const qualified = canvas.getByRole('region', { name: 'Qualified after the first call' });
    const rowHeight = (col: HTMLElement) => (col.querySelector('header > div') as HTMLElement).getBoundingClientRect().height;
    await expect(rowHeight(qualified)).toBe(rowHeight(lead));
    const title = within(qualified).getByRole('heading');
    await expect(getComputedStyle(title).textOverflow).toBe('ellipsis');
    const box = canvas.getByRole('checkbox', { name: 'Select all in Lead' });
    await userEvent.click(box);
    await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'true'));
  },
};

// Columns share the board width (flex 1 1 0) and shrink down to the column minimum (208px) before the board scrolls. `overflowHint` fades the side that can still scroll.
export const FluidColumnsWithOverflowHint: Story = {
  parameters: { docs: { description: { story: 'Resize the viewport: the columns shrink to 208px, then the board scrolls and the edge fade shows the side with more columns. `columnWidth="fixed"` keeps the 260px token width.' } } },
  render: () => (
    <Kanban aria-label="Pipeline" overflowHint>
      {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Offer', 'Won'].map((t) => (
        <KanbanColumn key={t} id={t} title={t} count={1}>
          <KanbanCard id={`${t}-1`} title={`${t} card`} subtitle="Acme GmbH" />
        </KanbanColumn>
      ))}
    </Kanban>
  ),
};

export const FixedColumns: Story = {
  render: () => (
    <Kanban aria-label="Pipeline" columnWidth="fixed">
      {['Lead', 'Qualified', 'Proposal'].map((t) => (
        <KanbanColumn key={t} id={t} title={t} count={1}>
          <KanbanCard id={`${t}-1`} title={`${t} card`} subtitle="Acme GmbH" />
        </KanbanColumn>
      ))}
    </Kanban>
  ),
};

const CustomCard = ({ id }: { id: string }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <button ref={setNodeRef} type="button" {...attributes} {...listeners} className="rounded-surface border border-solid border-hairline bg-card p-3 typography-ui">
      Drag me ({id})
    </button>
  );
};

// Eigene Karten mit den Kanban-Sensoren: same drag settings as the library board (mouse 4px, touch 250ms long press, auto-scroll at the board edge).
export const CustomCardsWithKanbanSensors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Eigene Karten mit den Kanban-Sensoren. Wer die Karten selbst auf dnd-kit baut, nutzt dieselben Einstellungen wie das Board: `useKanbanSensors()` liefert Maus und Stift ab 4px und Touch nach 250 ms Long-Press. `kanbanAutoScroll` ist das autoScroll-Objekt des Boards, `KANBAN_AUTOSCROLL_ARM_DISTANCE` (16px) die Strecke, nach der es scharf geschaltet werden sollte (davor `autoScroll={false}`).',
      },
    },
  },
  render: () => {
    const Demo = () => {
      const sensors = useKanbanSensors();
      return (
        <DndContext sensors={sensors} autoScroll={kanbanAutoScroll}>
          <div className="flex gap-3 overflow-x-auto">
            <CustomCard id="one" />
            <CustomCard id="two" />
          </div>
        </DndContext>
      );
    };
    return <Demo />;
  },
};
