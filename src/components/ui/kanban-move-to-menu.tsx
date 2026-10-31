'use client';

import { MoreHorizontal } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';

import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './dropdown-menu';
import { useKanbanMoveNotice } from './kanban';
import { useLabels } from './labels-context';

export interface KanbanMoveTarget {
  id: string;
  label: string;
}

export interface KanbanMoveToMenuLabels {
  // Heading of the target list.
  moveTo: string;
  // Accessible name of the trigger.
  actions: (title: string) => string;
  // Text of the disabled entry of the column the card is in.
  current: (column: string) => string;
}

export interface KanbanMoveToMenuProps {
  // Card title, names the trigger, e.g. "Actions for Data platform pilot".
  title: string;
  // Columns in board order.
  targets: KanbanMoveTarget[];
  // Column the card is in. It is listed disabled and marked as current.
  currentId: string;
  onMove: (targetId: string) => void;
  // Further card actions below the move targets, e.g. open or archive.
  children?: ReactNode;
  // Visible texts. Win over the provider text.
  labels?: Partial<KanbanMoveToMenuLabels>;
}

// Card actions for the `actions` slot of KanbanCard: a pointer and keyboard way to move a card without dragging, also for touch without long press.
const KanbanMoveToMenu = ({ title, targets, currentId, onMove, children, labels }: KanbanMoveToMenuProps) => {
  const l = useLabels();
  const labelId = useId();
  const moveTo = labels?.moveTo ?? l.kanbanMoveTo;
  const actions = labels?.actions ?? l.kanbanCardActions;
  const current = labels?.current ?? l.kanbanCurrentColumn;
  const noteMove = useKanbanMoveNotice();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const movedRef = useRef(false);
  const select = (target: KanbanMoveTarget) => {
    // Announce the move and hand focus to the card in its new column. Without a card around the trigger there is nothing to focus.
    const cardId = triggerRef.current?.closest<HTMLElement>('[data-kanban-card]')?.dataset.cardId;
    if (cardId) {
      movedRef.current = true;
      noteMove(cardId, target.label);
    }
    onMove(target.id);
  };
  return (
    // Non-modal: a modal menu sets aria-hidden on the board and page around it, which leaves focusable content inside hidden regions (axe aria-hidden-focus). Focus return, Escape and outside click still close it.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" ref={triggerRef} variant="ghost" size="icon-sm" aria-label={actions(title)}>
          <MoreHorizontal aria-hidden="true" className="h-icon-sm w-icon-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => {
          // The card (and this trigger) already moved to another column: the board focuses the card, so the menu must not pull focus back. While the board still waits for the server response the trigger is attached, so focus stays on it until the card appears.
          if (movedRef.current && !triggerRef.current?.isConnected) event.preventDefault();
          movedRef.current = false;
        }}
      >
        <DropdownMenuLabel id={labelId}>{moveTo}</DropdownMenuLabel>
        <DropdownMenuGroup aria-labelledby={labelId}>
          {targets.map((t) => (
            <DropdownMenuItem key={t.id} disabled={t.id === currentId} onSelect={() => select(t)}>
              {t.id === currentId ? current(t.label) : t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
KanbanMoveToMenu.displayName = 'KanbanMoveToMenu';

export { KanbanMoveToMenu };
