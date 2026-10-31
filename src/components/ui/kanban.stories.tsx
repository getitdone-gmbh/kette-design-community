import type { Meta, StoryObj } from '@storybook/react';
import { DesignSystemProvider } from './design-system-provider';
import { useState } from 'react';

import { DropdownMenuItem } from './dropdown-menu';
import { Chip } from './chip';
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
