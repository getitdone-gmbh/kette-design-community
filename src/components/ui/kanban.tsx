'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type PointerSensorOptions,
} from '@dnd-kit/core';
import { ArrowDownToLine, Plus } from 'lucide-react';
import {
  Children,
  createContext,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { focusRing, transitionBase } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import type { HeadingTag } from './heading-tag';
import { DataStatePanel, SkeletonBar } from './data-state-panel';
import type { LabelProp } from './labels';
import { useLabels, usePreset } from './labels-context';

export interface KanbanMove {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  // Insertion index in the target column, counted without the moved card.
  index: number;
}

interface DropTarget {
  columnId: string;
  index: number;
  // The column takes no cards from other columns (KanbanColumn dropDisabled): no drop marker, a release puts the card back.
  refused?: boolean;
}

// Announcement for a card let go over a column with dropDisabled: a string, or a function of the card title and the origin column name.
export type KanbanDropDisabledText = LabelProp<[title: string | undefined, origin: string]>;

interface KanbanColumnOptions {
  dropDisabled: boolean;
  dropDisabledText?: KanbanDropDisabledText;
  dropLabel?: string;
}

type KanbanColumnWidth = 'fixed' | 'fluid';

interface KanbanContextValue {
  columnWidth: KanbanColumnWidth;
  movable: boolean;
  grabbedId: string | null;
  target: DropTarget | null;
  setTarget: (target: DropTarget | null) => void;
  grab: (id: string) => void;
  commit: () => void;
  cancel: () => void;
  getBoard: () => HTMLElement | null;
  registerFace: (id: string, face: ReactNode) => void;
  // A move made outside the board's own drag and keyboard model (the "Move to" menu): announces it and returns focus to the moved card.
  noteMove: (cardId: string, columnLabel: string) => void;
  registerColumn: (id: string, options: KanbanColumnOptions | null) => void;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

const useKanban = () => {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('KanbanColumn must be rendered inside <Kanban>');
  return ctx;
};

// Inert context for a KanbanCard rendered outside a Kanban: not draggable, nothing to grab.
const standaloneKanban: KanbanContextValue = {
  columnWidth: 'fixed',
  movable: false,
  grabbedId: null,
  target: null,
  setTarget: () => undefined,
  grab: () => undefined,
  commit: () => undefined,
  cancel: () => undefined,
  getBoard: () => null,
  registerFace: () => undefined,
  noteMove: () => undefined,
  registerColumn: () => undefined,
};

// For KanbanMoveToMenu: reports a menu move to the surrounding Kanban. A no-op outside a Kanban.
export const useKanbanMoveNotice = () => useContext(KanbanContext)?.noteMove ?? standaloneKanban.noteMove;

// Mouse and pen start after a small movement, touch needs a long press so scrolling keeps working.
export const KANBAN_POINTER_ACTIVATION = { distance: 4 } as const;
// 12px tolerance: a finger landing on a board that is still coasting drifts a few pixels before the 250ms press completes.
export const KANBAN_TOUCH_ACTIVATION = { delay: 250, tolerance: 12 } as const;

// While a finger is down the board must not run scroll snap animations (they keep the scroller moving under the long press); the flag is a DOM attribute so no re-render happens mid gesture.
const suspendSnapWhileTouching = (board: HTMLElement) => {
  board.dataset.touching = 'true';
  const release = () => {
    delete board.dataset.touching;
    document.removeEventListener('pointerup', release, true);
    document.removeEventListener('pointercancel', release, true);
    document.removeEventListener('touchend', release, true);
    document.removeEventListener('touchcancel', release, true);
  };
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
  document.addEventListener('touchend', release, true);
  document.addEventListener('touchcancel', release, true);
};

// Auto-scroll stays off after a drag starts until the pointer has travelled this many pixels from where it was pressed. Without it a long press that lands in the 15% edge zone scrolls the board away under the finger before the user has moved at all; a deliberate drag crosses the distance within a few frames.
export const KANBAN_AUTOSCROLL_ARM_DISTANCE = 16;

// Edge zone (share of the board) and speed of the auto-scroll. Slower than the dnd-kit default so a narrow viewport does not run past the target column.
export const KANBAN_AUTOSCROLL = { acceleration: 4, threshold: { x: 0.15, y: 0.15 } } as const;
// The autoScroll prop of a DndContext for a board that scrolls sideways. Pass it only after the pointer travelled KANBAN_AUTOSCROLL_ARM_DISTANCE (use `false` before), see the Kanban story.
export const kanbanAutoScroll = KANBAN_AUTOSCROLL;

// How long the board waits for a moved card to appear (async moves) before it gives up on moving focus.
export const KANBAN_FOCUS_WAIT_MS = 5000;

// How long the board keeps watching a moved card for a rollback (the parent puts it back after a failed save). Past this the move counts as accepted.
export const KANBAN_REVERT_WATCH_MS = 15000;

// Pointer sensor for mouse and pen. Touch is handled by the long-press TouchSensor.
class KanbanPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (event: { nativeEvent: PointerEvent }, options: PointerSensorOptions) => {
        if (event.nativeEvent.pointerType === 'touch') return false;
        return PointerSensor.activators[0].handler(event as never, options as never);
      },
    },
  ];
}

// The drag sensors of the Kanban board: mouse and pen after 4px (never touch), touch after a 250ms long press. The built-in keyboard model is not a dnd-kit sensor.
// For custom cards on dnd-kit: `<DndContext sensors={useKanbanSensors()} autoScroll={kanbanAutoScroll}>`. Must be called in a component.
export const useKanbanSensors = () =>
  useSensors(
    useSensor(KanbanPointerSensor, { activationConstraint: KANBAN_POINTER_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: KANBAN_TOUCH_ACTIVATION }),
  );

const columnElements = (board: HTMLElement) => Array.from(board.querySelectorAll<HTMLElement>('[data-kanban-column]'));
const cardElements = (column: HTMLElement) => Array.from(column.querySelectorAll<HTMLElement>('[data-kanban-card]'));

// Maps a viewport point to a column and an insertion index, null when the point is outside the board.
export const resolveKanbanTarget = (board: HTMLElement, point: { x: number; y: number }, grabbedId: string | null): DropTarget | null => {
  const rect = board.getBoundingClientRect();
  if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) return null;
  const columns = columnElements(board);
  if (columns.length === 0) return null;
  const distance = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return point.x < r.left ? r.left - point.x : point.x > r.right ? point.x - r.right : 0;
  };
  const column = columns.reduce((best, el) => (distance(el) < distance(best) ? el : best), columns[0]);
  const items = cardElements(column).filter((el) => el.dataset.cardId !== grabbedId);
  const at = items.findIndex((el) => {
    const r = el.getBoundingClientRect();
    return point.y < r.top + r.height / 2;
  });
  return { columnId: column.dataset.columnId ?? '', index: at === -1 ? items.length : at };
};

const pointerOf = (event: Event | null | undefined): { x: number; y: number } | null => {
  if (!event) return null;
  const touch = (event as TouchEvent).touches?.[0] ?? (event as TouchEvent).changedTouches?.[0];
  const source = touch ?? (event as MouseEvent);
  return typeof source.clientX === 'number' ? { x: source.clientX, y: source.clientY } : null;
};

// Fluid: flex 1 1 0 with a floor, the `kanban-column-min` size token (208px, tokens 5.0.1).
const columnWidthClass = (width: KanbanColumnWidth, grow: boolean) =>
  width === 'fluid'
    ? 'min-w-kanban-column-min flex-1 basis-kanban-column-min'
    : cn('w-kanban-column min-w-kanban-column shrink-0', grow && 'grow');

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
};

export interface KanbanProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  // Accessible name of the board.
  'aria-label': string;
  state?: 'default' | 'loading' | 'error';
  // Enables drag and the keyboard move model. Called once on drop, the parent owns card order.
  onMove?: (move: KanbanMove) => void;
  onRetry?: () => void;
  errorTitle?: string;
  errorDescription?: string;
  loadingLabel?: string;
  // Number of skeleton columns while loading.
  loadingColumns?: number;
  // `fluid` columns share the board width and shrink down to the column minimum before the board scrolls. `fixed` keeps the token column width and always scrolls. Default `fluid`, `fixed` in the zero preset.
  columnWidth?: KanbanColumnWidth;
  // Fades the edge(s) of the board that can still scroll, so cut-off columns read as scrollable. Only visible while the board overflows.
  overflowHint?: boolean;
}

const Kanban = forwardRef<HTMLDivElement, KanbanProps>(
  (
    {
      className,
      children,
      state = 'default',
      onMove,
      onRetry,
      errorTitle: errorTitleProp,
      errorDescription: errorDescriptionProp,
      loadingLabel: loadingLabelProp,
      loadingColumns = 4,
      columnWidth: columnWidthProp,
      overflowHint = false,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const zeroPreset = usePreset() === 'zero';
    const columnWidth: KanbanColumnWidth = columnWidthProp ?? (zeroPreset ? 'fixed' : 'fluid');
    const errorTitle = errorTitleProp ?? l.kanbanErrorTitle;
    const errorDescription = errorDescriptionProp ?? l.kanbanErrorDescription;
    const loadingLabel = loadingLabelProp ?? l.kanbanLoading;
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [grabbedId, setGrabbedId] = useState<string | null>(null);
    const [target, setTarget] = useState<DropTarget | null>(null);
    const [announcement, setAnnouncement] = useState('');
    // fromColumnId: the card is only focused once it left this column (async moves keep the old card on the board until the server answers).
    const [focusAfterMove, setFocusAfterMove] = useState<{ id: string; fromColumnId?: string } | null>(null);
    // Where a card came from. When the card leaves this position and later returns to it, the move was rolled back and the card gets its focus back.
    // node: the card's handle at the time of the move. When it was replaced by a new node at the same position without the card ever leaving, the parent remounted the board (confirm-then-move: a loading state or refetch around a rejected save) and the focus it held is gone.
    const [revertWatch, setRevertWatch] = useState<{ id: string; columnId: string; index: number; nonce: number; node: HTMLElement | null } | null>(null);
    const leftOrigin = useRef(false);
    // A drag or a keyboard grab is running: no pending refocus may move focus or scroll the board then.
    const interactingRef = useRef(false);
    const movable = Boolean(onMove);
    const dndId = useId();
    const reducedMotion = useReducedMotion();
    const targetRef = useRef<DropTarget | null>(null);
    // Touch lists are emptied after the event, so the press point is stored when it happens.
    const pointerRef = useRef<{ x: number; y: number } | null>(null);
    const faces = useRef(new Map<string, ReactNode>());
    const columnOptions = useRef(new Map<string, KanbanColumnOptions>());
    const [dragId, setDragId] = useState<string | null>(null);
    interactingRef.current = Boolean(dragId || grabbedId);
    // Auto-scroll is armed once the pointer moved KANBAN_AUTOSCROLL_ARM_DISTANCE after the drag started.
    const [scrollArmed, setScrollArmed] = useState(false);
    const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
    // Detached node: the own live region announces moves, so the dnd-kit one is kept out of the document.
    const [dndContainer] = useState<HTMLElement | undefined>(() => (typeof document === 'undefined' ? undefined : document.createElement('div')));
    const sensors = useKanbanSensors();

    const setRefs = (node: HTMLDivElement | null) => {
      boardRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    };

    const findCard = useCallback((id: string) => {
      const board = boardRef.current;
      if (!board) return null;
      const el = board.querySelector<HTMLElement>(`[data-kanban-card][data-card-id="${CSS.escape(id)}"]`);
      const column = el?.closest<HTMLElement>('[data-kanban-column]');
      if (!el || !column) return null;
      const siblings = cardElements(column).filter((c) => c !== el);
      return { el, column, columnId: column.dataset.columnId ?? '', index: cardElements(column).indexOf(el), others: siblings };
    }, []);

    const columnName = useCallback((columnId: string) => {
      const board = boardRef.current;
      const column = board ? columnElements(board).find((c) => c.dataset.columnId === columnId) : undefined;
      // Announcements say the visible title; the label may carry more (e.g. the stage state) for the region name.
      return column ? column.dataset.columnTitle ?? column.getAttribute('aria-label') ?? columnId : null;
    }, []);

    const describe = useCallback((t: DropTarget) => {
      const name = columnName(t.columnId);
      return name == null ? '' : l.kanbanPosition(name, t.index + 1);
    }, [columnName, l]);

    // A column with dropDisabled refuses cards from other columns; its own cards still reorder and leave.
    const refuses = useCallback(
      (cardId: string, columnId: string) => Boolean(columnOptions.current.get(columnId)?.dropDisabled) && findCard(cardId)?.columnId !== columnId,
      [findCard],
    );

    const grab = useCallback(
      (id: string) => {
        const info = findCard(id);
        if (!info) return;
        setGrabbedId(id);
        const initial = { columnId: info.columnId, index: info.index };
        targetRef.current = initial;
        setTarget(initial);
        setAnnouncement(l.kanbanPickedUp(info.el.dataset.cardTitle, describe(initial)));
      },
      [describe, findCard, l],
    );

    const cancel = useCallback(() => {
      if (grabbedId) setAnnouncement(l.kanbanMoveCancelled);
      setFocusAfterMove(grabbedId ? { id: grabbedId } : null);
      setGrabbedId(null);
      targetRef.current = null;
      setTarget(null);
    }, [grabbedId, l]);

    const finish = useCallback(
      (id: string, next: DropTarget) => {
        const info = findCard(id);
        const refused = Boolean(info) && refuses(id, next.columnId);
        if (info && onMove && refused) {
          const title = info.el.dataset.cardTitle;
          const origin = columnName(info.columnId) ?? info.columnId;
          const text = columnOptions.current.get(next.columnId)?.dropDisabledText;
          setAnnouncement(text === undefined ? l.kanbanDropDisabled(columnName(next.columnId) ?? next.columnId, title, origin) : typeof text === 'string' ? text : text(title, origin));
        } else if (info && onMove) {
          const unchanged = info.columnId === next.columnId && info.index === next.index;
          if (!unchanged) {
            leftOrigin.current = false;
            setRevertWatch({ id, columnId: info.columnId, index: info.index, nonce: Date.now(), node: info.el.querySelector<HTMLElement>('[data-kanban-handle]') });
            onMove({ cardId: id, fromColumnId: info.columnId, toColumnId: next.columnId, index: next.index });
            setAnnouncement(l.kanbanDropped(info.el.dataset.cardTitle, describe(next)));
          } else {
            setAnnouncement(l.kanbanDroppedInPlace);
          }
        }
        setFocusAfterMove({ id, fromColumnId: info && !refused && info.columnId !== next.columnId ? info.columnId : undefined });
        setGrabbedId(null);
        targetRef.current = null;
        setTarget(null);
      },
      [columnName, describe, findCard, onMove, refuses, l],
    );

    const commit = useCallback(() => {
      if (grabbedId && target) finish(grabbedId, target);
    }, [finish, grabbedId, target]);

    const updateTarget = useCallback(
      (next: DropTarget | null) => {
        const prev = targetRef.current;
        if (prev?.columnId === next?.columnId && prev?.index === next?.index) return;
        const marked = next && grabbedId && refuses(grabbedId, next.columnId) ? { ...next, refused: true } : next;
        targetRef.current = marked;
        setTarget(marked);
        if (!marked || !grabbedId) return;
        // Over a refusing column the position does not matter: it is announced once on entering it.
        if (marked.refused) {
          if (!(prev?.refused && prev.columnId === marked.columnId)) setAnnouncement(l.kanbanDropDisabledTarget(columnName(marked.columnId) ?? marked.columnId));
        } else {
          // A card from another column hears the drop label in place of the column name, like the sighted user sees it in the marker; the label names the column already, so it is not said twice.
          const dropLabel = columnOptions.current.get(marked.columnId)?.dropLabel;
          const fromOther = dropLabel ? findCard(grabbedId)?.columnId !== marked.columnId : false;
          setAnnouncement(fromOther && dropLabel ? l.kanbanPosition(dropLabel, marked.index + 1) : describe(marked));
        }
      },
      [columnName, describe, findCard, grabbedId, refuses, l],
    );

    const registerFace = useCallback((id: string, face: ReactNode) => {
      faces.current.set(id, face);
    }, []);

    const registerColumn = useCallback((id: string, options: KanbanColumnOptions | null) => {
      if (options) columnOptions.current.set(id, options);
      else columnOptions.current.delete(id);
    }, []);

    const noteMove = useCallback(
      (cardId: string, columnLabel: string) => {
        setAnnouncement(l.kanbanMovedTo(columnLabel));
        const origin = findCard(cardId);
        leftOrigin.current = false;
        if (origin) setRevertWatch({ id: cardId, columnId: origin.columnId, index: origin.index, nonce: Date.now(), node: origin.el.querySelector<HTMLElement>('[data-kanban-handle]') });
        setFocusAfterMove({ id: cardId, fromColumnId: origin?.columnId });
      },
      [l, findCard],
    );

    // The drag delta includes the auto-scroll offset, so the live pointer position is tracked directly.
    useEffect(() => {
      if (!dragId) return;
      const track = (event: Event) => {
        const point = pointerOf(event);
        if (!point) return;
        pointerRef.current = point;
        const origin = dragOriginRef.current;
        if (origin && Math.hypot(point.x - origin.x, point.y - origin.y) >= KANBAN_AUTOSCROLL_ARM_DISTANCE) {
          dragOriginRef.current = null;
          setScrollArmed(true);
        }
      };
      document.addEventListener('pointermove', track, { capture: true, passive: true });
      document.addEventListener('touchmove', track, { capture: true, passive: true });
      return () => {
        document.removeEventListener('pointermove', track, { capture: true });
        document.removeEventListener('touchmove', track, { capture: true });
      };
    }, [dragId]);

    const pointerTarget = (event: DragMoveEvent) => {
      const point = pointerRef.current ?? pointerOf(event.activatorEvent);
      const board = boardRef.current;
      if (!point || !board) return null;
      return resolveKanbanTarget(board, point, String(event.active.id));
    };

    const handleDragStart = (event: DragStartEvent) => {
      const id = String(event.active.id);
      setDragId(id);
      dragOriginRef.current = pointerOf(event.activatorEvent);
      setScrollArmed(false);
      grab(id);
    };

    const handleDragMove = (event: DragMoveEvent) => {
      if (grabbedId !== String(event.active.id)) return;
      updateTarget(pointerTarget(event));
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const id = String(event.active.id);
      const next = pointerTarget(event as DragMoveEvent) ?? targetRef.current;
      setDragId(null);
      if (next) finish(id, next);
      else cancel();
    };

    const handleDragCancel = () => {
      setDragId(null);
      cancel();
    };

    useEffect(() => {
      if (!focusAfterMove) return undefined;
      const board = boardRef.current;
      // Focus moves to the card only while it is on the body or inside the board; focus the user moved elsewhere stays.
      const mayTakeFocus = () => {
        const active = document.activeElement;
        return !active || active === document.body || Boolean(board?.contains(active));
      };
      // A new interaction (drag, long press timer, finger down) owns focus and scroll; the refocus waits or gives up.
      const busy = () => interactingRef.current || Boolean(board?.dataset.touching);
      const tryFocus = () => {
        if (busy()) return false;
        const info = findCard(focusAfterMove.id);
        const handle = info?.el.querySelector<HTMLElement>('[data-kanban-handle]');
        if (focusAfterMove.fromColumnId && info?.columnId === focusAfterMove.fromColumnId) {
          // The card has not left its column: the move is pending or was rejected (confirm-then-move). Focus that fell to the page after the drop (touch and pointer drags, a dragged node that unmounted) goes back to the card; a pending move still focuses it in the new column later.
          const active = document.activeElement;
          if (handle && (!active || active === document.body)) handle.focus({ preventScroll: true });
          return false;
        }
        if (!handle) return false;
        if (mayTakeFocus()) handle.focus();
        setFocusAfterMove(null);
        return true;
      };
      if (tryFocus()) return undefined;
      // The parent may update the board only after a server response: watch the board until the moved card appears, but not forever.
      const observer = new MutationObserver(() => {
        if (tryFocus()) observer.disconnect();
      });
      if (board) observer.observe(board, { childList: true, subtree: true });
      const timer = setTimeout(() => setFocusAfterMove(null), KANBAN_FOCUS_WAIT_MS);
      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    }, [focusAfterMove, findCard, children]);

    // Rollback: a move that failed on the server puts the card back, which remounts it and drops focus to the page. Once the card is back at its original position, focus returns to it.
    useEffect(() => {
      if (!revertWatch) return undefined;
      const board = boardRef.current;
      const atOrigin = () => {
        const info = findCard(revertWatch.id);
        return info ? info.columnId === revertWatch.columnId && info.index === revertWatch.index : null;
      };
      const check = () => {
        if (interactingRef.current || board?.dataset.touching) return false;
        const here = atOrigin();
        if (here === null) return false;
        if (!here) {
          leftOrigin.current = true;
          return false;
        }
        // Still or again at the origin. Without a departure only a remounted handle counts: the card never moved (rejected drop) but the node that held focus is gone.
        if (!leftOrigin.current && (!revertWatch.node || revertWatch.node.isConnected)) return false;
        const active = document.activeElement;
        const handle = findCard(revertWatch.id)?.el.querySelector<HTMLElement>('[data-kanban-handle]');
        if (handle && (!active || active === document.body || Boolean(board?.contains(active)))) {
          handle.focus({ preventScroll: true });
          setAnnouncement(l.kanbanMoveReverted(handle.closest<HTMLElement>('[data-kanban-card]')?.dataset.cardTitle ?? ''));
        }
        setRevertWatch(null);
        return true;
      };
      if (check()) return undefined;
      const observer = new MutationObserver(() => {
        if (check()) observer.disconnect();
      });
      if (board) observer.observe(board, { childList: true, subtree: true });
      const timer = setTimeout(() => setRevertWatch(null), KANBAN_REVERT_WATCH_MS);
      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    }, [revertWatch, findCard, l]);

    // A pending refocus (rejected or reverted move) belongs to the interaction that started it. Any new interaction disarms it: a press, a touch or a key on another card, or focus that lands somewhere else.
    const pendingId = focusAfterMove?.id ?? revertWatch?.id ?? null;
    const armed = Boolean(focusAfterMove || revertWatch);
    useEffect(() => {
      if (!armed) return undefined;
      const insidePending = (target: EventTarget | null) => {
        const card = target instanceof Element ? target.closest<HTMLElement>('[data-kanban-card]') : null;
        return Boolean(card && card.dataset.cardId === pendingId);
      };
      const disarm = () => {
        setFocusAfterMove(null);
        setRevertWatch(null);
      };
      const onPress = () => disarm();
      const onKey = (event: Event) => {
        if (!insidePending(event.target)) disarm();
      };
      const onFocusIn = (event: Event) => {
        const target = event.target;
        if (target === document.body || target === document.documentElement || insidePending(target)) return;
        disarm();
      };
      document.addEventListener('pointerdown', onPress, true);
      document.addEventListener('touchstart', onPress, true);
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('focusin', onFocusIn, true);
      return () => {
        document.removeEventListener('pointerdown', onPress, true);
        document.removeEventListener('touchstart', onPress, true);
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('focusin', onFocusIn, true);
      };
    }, [armed, pendingId]);

    // A board that scrolls sideways but holds nothing focusable (empty columns) must still be reachable by keyboard (WCAG 2.1.1).
    const [needsTabStop, setNeedsTabStop] = useState(false);
    useEffect(() => {
      const board = boardRef.current;
      if (!board) return undefined;
      const measure = () => {
        const scrollable = board.scrollWidth - board.clientWidth > 1;
        const focusable = board.querySelector('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        setNeedsTabStop(scrollable && !focusable);
      };
      measure();
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
      observer?.observe(board);
      Array.from(board.children).forEach((child) => observer?.observe(child));
      return () => observer?.disconnect();
    });

    // Which sides of the board can still scroll, for the overflow hint.
    const [overflowSides, setOverflowSides] = useState({ start: false, end: false });
    useEffect(() => {
      const board = boardRef.current;
      if (!overflowHint || !board) return;
      const measure = () => {
        const max = board.scrollWidth - board.clientWidth;
        const start = max > 1 && board.scrollLeft > 1;
        const end = max > 1 && board.scrollLeft < max - 1;
        setOverflowSides((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
      };
      measure();
      board.addEventListener('scroll', measure, { passive: true });
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
      observer?.observe(board);
      Array.from(board.children).forEach((child) => observer?.observe(child));
      return () => {
        board.removeEventListener('scroll', measure);
        observer?.disconnect();
      };
    }, [overflowHint, state, children]);

    const value = useMemo<KanbanContextValue>(
      () => ({
        columnWidth,
        movable,
        grabbedId,
        target,
        setTarget: updateTarget,
        grab,
        commit,
        cancel,
        getBoard: () => boardRef.current,
        registerFace,
        noteMove,
        registerColumn,
      }),
      [columnWidth, movable, grabbedId, target, updateTarget, grab, commit, cancel, registerFace, noteMove, registerColumn],
    );

    if (state === 'loading') {
      return (
        <div
          ref={setRefs}
          className={cn('flex min-w-0 max-w-full snap-x gap-3 overflow-x-auto overscroll-x-contain pb-1', className)}
          {...props}
          role="status"
          aria-label={loadingLabel}
          aria-busy="true"
        >
          {Array.from({ length: loadingColumns }).map((_, i) => (
            <div key={i} className={cn('flex flex-col gap-2 rounded-surface bg-muted p-2', columnWidthClass(columnWidth, true))}>
              <SkeletonBar className="mx-1 my-1 h-3 w-1/3" />
              {[0, 1].map((c) => (
                <div key={c} className="flex flex-col gap-2 rounded-surface border border-solid border-hairline bg-card p-3">
                  <SkeletonBar className="w-2/3" />
                  <SkeletonBar className="w-1/2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div ref={setRefs} className={className} {...props}>
          <DataStatePanel kind="error" outlined title={errorTitle} description={errorDescription} onRetry={onRetry} />
        </div>
      );
    }

    return (
      <KanbanContext.Provider value={value}>
        <DndContext
          id={dndId}
          sensors={movable ? sensors : []}
          autoScroll={movable && scrollArmed ? kanbanAutoScroll : false}
          accessibility={{
            container: dndContainer,
            announcements: {
              onDragStart: () => undefined,
              onDragOver: () => undefined,
              onDragEnd: () => undefined,
              onDragCancel: () => undefined,
            },
            screenReaderInstructions: { draggable: '' },
          }}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            ref={setRefs}
            role="group"
            tabIndex={needsTabStop ? 0 : undefined}
            data-overflow-start={overflowHint && overflowSides.start ? 'true' : undefined}
            data-overflow-end={overflowHint && overflowSides.end ? 'true' : undefined}
            data-autoscroll={dragId ? (scrollArmed ? 'armed' : 'pending') : undefined}
            className={cn(
              'relative flex min-w-0 max-w-full snap-x gap-3 overflow-x-auto overscroll-x-contain pb-1 data-[touching=true]:snap-none',
              // Auto scroll while dragging and scroll snap fight each other.
              dragId && 'snap-none',
              // Edge fade: a mask on the scroll container, so it works on any surface colour. The width is the spacing-8 step.
              overflowHint && '[--kanban-fade:theme(spacing.8)] data-[overflow-end=true]:[mask-image:linear-gradient(to_right,#000_calc(100%_-_var(--kanban-fade)),transparent)] data-[overflow-start=true]:[mask-image:linear-gradient(to_left,#000_calc(100%_-_var(--kanban-fade)),transparent)] data-[overflow-start=true]:data-[overflow-end=true]:[mask-image:linear-gradient(to_right,transparent,#000_var(--kanban-fade),#000_calc(100%_-_var(--kanban-fade)),transparent)]',
              className,
            )}
            {...props}
            onTouchStartCapture={(event) => {
              suspendSnapWhileTouching(event.currentTarget);
              pointerRef.current = pointerOf(event.nativeEvent);
              props.onTouchStartCapture?.(event);
            }}
            onPointerDownCapture={(event) => {
              if (event.pointerType === 'touch') suspendSnapWhileTouching(event.currentTarget);
              pointerRef.current = pointerOf(event.nativeEvent);
              props.onPointerDownCapture?.(event);
            }}
          >
            {children}
            {/* Inside the positioned root so the sr-only box cannot widen a scroll wrapper around it. */}
            <div aria-live="assertive" role="status" className="sr-only">
              {announcement}
            </div>
          </div>
          <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
            {/* Over a refusing column the dragged copy shows the not-allowed cursor, it sits under the pointer. */}
            {dragId ? (
              <div data-drop-refused={target?.refused || undefined} className={target?.refused ? 'cursor-not-allowed [&_*]:cursor-not-allowed' : undefined}>
                {faces.current.get(dragId)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </KanbanContext.Provider>
    );
  },
);
Kanban.displayName = 'Kanban';

// Full class strings so Tailwind's content scan finds every stage token.
const stageDot = {
  1: 'bg-data-stage-1',
  2: 'bg-data-stage-2',
  3: 'bg-data-stage-3',
  4: 'bg-data-stage-4',
  5: 'bg-data-stage-5',
  // Beyond five stages: the project colour slots and the internal colour (data tokens).
  6: 'bg-data-project-1',
  7: 'bg-data-project-2',
  8: 'bg-data-project-3',
  9: 'bg-data-project-4',
  10: 'bg-data-project-5',
  11: 'bg-data-project-6',
  12: 'bg-data-project-7',
  13: 'bg-data-project-8',
  internal: 'bg-data-internal',
} as const;

export interface KanbanColumnProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  id: string;
  title: ReactNode;
  // Heading element of the column title, so the board fits the document outline. Default h3.
  titleAs?: HeadingTag;
  // Accessible name of the column. Defaults to the title when it is a string. Move announcements still say a string title, the label only stands in for other titles.
  label?: string;
  count?: number;
  // Right aligned header slot: a sum, a share or nothing.
  meta?: ReactNode;
  // Header slot right after the count, e.g. a status badge. Does not raise the header row.
  badge?: ReactNode;
  // Second header line under the title, e.g. a conversion rate or probability.
  headerExtra?: ReactNode;
  // Shown dashed when the column has no cards.
  emptyLabel?: ReactNode;
  // Deprecated: use addText.
  addLabel?: string;
  // Visible texts of the column. Win over the provider text.
  emptyText?: ReactNode;
  addText?: string;
  onAdd?: () => void;
  // Highlights the column as the active one (e.g. a stage in focus).
  selected?: boolean;
  // Pipeline stage color 1 to 5 (data-stage tokens), 6 to 13 (project colours 1 to 8) or `internal`, shown as a dot before the title.
  stage?: keyof typeof stageDot;
  // Custom dot colour (user data): a CSS colour or a token utility such as `bg-data-project-3`. Wins over `stage`.
  dotColor?: string;
  // Reads the card id of a child element. Only needed when a wrapper hides the id; without it the id prop is tried, then the rendered card.
  getItemId?: (child: ReactElement) => string | undefined;
  // Takes no cards from other columns: while a card is over it a dashed outline and the not-allowed cursor show, no drop marker, and on release the card stays where it was (onMove is not called). Its own cards still reorder and leave. Does not filter the KanbanMoveToMenu targets: leave the column out of them yourself.
  dropDisabled?: boolean;
  // Announcement when a card is let go over this column with dropDisabled. Wins over the provider text (kanbanDropDisabled).
  dropDisabledText?: KanbanDropDisabledText;
  // Text of the drop place while a card from another column is over this column, e.g. "Drop here · Proposal 50%": the marker becomes a dashed box with the text, and the keyboard move announces it. Moves inside the column keep the line.
  dropLabel?: string;
  // A control at the end of the title row, e.g. a select-all checkbox: the row keeps its height and a long title shortens with an ellipsis (full text as tooltip) instead of wrapping. false, null and undefined leave the slot out; other values such as "" or 0 render.
  headerAction?: ReactNode;
}

const KanbanColumn = forwardRef<HTMLElement, KanbanColumnProps>(
  ({ className, id, title, titleAs: Title = 'h3', label, count, meta, badge, headerExtra, emptyLabel: emptyLabelProp, emptyText, addLabel, addText, onAdd, selected, stage, dotColor, getItemId, dropDisabled = false, dropDisabledText, dropLabel, headerAction, children, ...props }, ref) => {
    const l = useLabels();
    const zero = usePreset() === 'zero';
    const emptyLabel = emptyText ?? emptyLabelProp ?? l.kanbanEmptyColumn;
    const ctx = useKanban();
    const cards = Children.toArray(children).filter(isValidElement) as ReactElement<{ id?: string }>[];
    const isTarget = ctx.target?.columnId === id && ctx.grabbedId != null;
    const refusing = isTarget && Boolean(ctx.target?.refused);
    const showMarker = isTarget && !refusing;
    const { registerColumn } = ctx;
    // false, null and undefined leave the slot out, so `mode && <Checkbox />` keeps the plain header outside the mode.
    const hasAction = headerAction != null && headerAction !== false;
    useEffect(() => {
      registerColumn(id, { dropDisabled, dropDisabledText, dropLabel });
      return () => registerColumn(id, null);
    }, [registerColumn, id, dropDisabled, dropDisabledText, dropLabel]);
    const name = label ?? (typeof title === 'string' ? title : id);
    const listRef = useRef<HTMLUListElement | null>(null);
    // Position of the grabbed card read from the rendered card, so wrappers without an id prop still work.
    const [domGrabbed, setDomGrabbed] = useState(-1);
    useLayoutEffect(() => {
      const grabbedId = ctx.grabbedId;
      if (grabbedId == null) {
        setDomGrabbed(-1);
        return;
      }
      const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>(':scope > [data-kanban-card]') ?? []);
      setDomGrabbed(items.findIndex((el) => el.dataset.cardId === grabbedId));
    }, [ctx.grabbedId, cards.length]);
    const idOf = (card: ReactElement<{ id?: string }>) => getItemId?.(card) ?? (typeof card.props.id === 'string' ? card.props.id : undefined);
    const propGrabbed = ctx.grabbedId == null ? -1 : cards.findIndex((card) => idOf(card) === ctx.grabbedId);
    const grabbedIndex = propGrabbed >= 0 ? propGrabbed : domGrabbed;
    // Zero: count and sum are quiet detail text, the empty slot sits directly under the header and the add row is subtle.
    const headerMeta = zero ? 'typography-detail text-text-subtle-on-muted' : 'typography-text-extra-small text-foreground';
    const emptySlot =
      cards.length === 0 ? (
        <div className={cn('typography-text-extra-small rounded-surface border border-dashed px-3 py-6 text-center', zero ? 'border-border-default text-text-subtle-on-muted' : 'border-hairline text-foreground')}>
          {emptyLabel}
        </div>
      ) : null;

    // The label shows only for a card from another column; a reorder inside the column keeps the line.
    const markerLabel = grabbedIndex < 0 ? dropLabel : undefined;
    const rendered: ReactNode[] = [];
    let slot = 0;
    cards.forEach((card, position) => {
      const grabbed = position === grabbedIndex;
      if (showMarker && !grabbed && ctx.target?.index === slot) rendered.push(<DropMarker key="drop-marker" label={markerLabel} />);
      rendered.push(card);
      if (!grabbed) slot += 1;
    });
    if (showMarker && ctx.target && ctx.target.index >= slot) rendered.push(<DropMarker key="drop-marker" label={markerLabel} />);

    return (
      <section
        ref={ref}
        aria-label={name}
        data-kanban-column=""
        data-column-id={id}
        data-column-title={typeof title === 'string' ? title : undefined}
        data-selected={selected || undefined}
        data-stage={stage}
        data-drop-target={showMarker || undefined}
        data-drop-disabled={dropDisabled || undefined}
        data-drop-refused={refusing || undefined}
        className={cn(
          'flex snap-start flex-col gap-2 rounded-surface border border-solid border-transparent bg-muted p-2',
          columnWidthClass(ctx.columnWidth, !zero),
          'data-[selected=true]:border-border-focus data-[drop-target=true]:border-border-focus data-[drop-target=true]:bg-muted-strong',
          // Refusing: an outline 2px inside the column instead of a border, so nothing shifts; the background stays.
          'data-[drop-refused=true]:cursor-not-allowed data-[drop-refused=true]:outline-dashed data-[drop-refused=true]:outline-2 data-[drop-refused=true]:-outline-offset-2 data-[drop-refused=true]:outline-border-control',
          className,
        )}
        {...props}
      >
        <header className="mx-1 mt-1 flex flex-col gap-micro text-foreground">
          <div className={cn('typography-ui-semibold flex items-center gap-2', hasAction && 'h-5')}>
            {dotColor ? (
              <span
                aria-hidden="true"
                data-column-dot=""
                className={cn('h-2 w-2 shrink-0 rounded-full', dotColor.startsWith('bg-') ? dotColor : 'bg-current')}
                style={dotColor.startsWith('bg-') ? undefined : { backgroundColor: dotColor }}
              />
            ) : stage ? (
              <span aria-hidden="true" data-column-dot="" className={cn('h-2 w-2 shrink-0 rounded-full', stageDot[stage])} />
            ) : null}
            <Title className={cn('typography-ui-semibold', hasAction && 'min-w-0 truncate')} title={hasAction && typeof title === 'string' ? title : undefined}>
              {title}
            </Title>
            {count != null ? <span className={cn('tabular-nums', headerMeta)}>{count}</span> : null}
            {badge != null ? (
              <span data-kanban-badge="" className="-my-1 inline-flex shrink-0 items-center">
                {badge}
              </span>
            ) : null}
            {meta != null ? <span className={cn('ml-auto tabular-nums', hasAction && 'shrink-0 whitespace-nowrap', headerMeta)}>{meta}</span> : null}
            {hasAction ? (
              <span data-kanban-header-action="" className={cn('flex h-5 shrink-0 items-center', meta == null && 'ml-auto')}>
                {headerAction}
              </span>
            ) : null}
          </div>
          {headerExtra != null ? <div className="typography-text-extra-small text-foreground" data-kanban-header-extra="">{headerExtra}</div> : null}
        </header>
        {zero ? emptySlot : null}
        <ul ref={listRef} className="-m-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1">
          {rendered}
        </ul>
        {zero ? null : emptySlot}
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              'typography-text-extra-small flex h-6 items-center rounded-item px-2 py-1 text-left hover:bg-muted-strong',
              zero ? 'gap-gap-control text-text-subtle-on-muted' : 'gap-2 text-foreground',
              transitionBase,
              focusRing,
            )}
          >
            <Plus aria-hidden="true" className="h-icon-xs w-icon-xs" />
            {addText ?? addLabel ?? l.add}
          </button>
        ) : null}
      </section>
    );
  },
);
KanbanColumn.displayName = 'KanbanColumn';

// Rendered actions, with fragments flattened and empty children dropped, so `<><A /><B /></>` counts as two.
const flattenActions = (node: ReactNode): ReactNode[] =>
  Children.toArray(node).flatMap((child) => (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flattenActions(child.props.children) : [child]));

// The line, or with a label the dashed drop box of the prototype (.kb-drop: 160 px high, brand subtle fill, brand text, arrow above the text at the top, so the dragged card below leaves it readable). Hidden from screen readers: the live region says the same.
const DropMarker = ({ label }: { label?: string }) =>
  label ? (
    <li
      aria-hidden="true"
      data-kanban-drop-marker=""
      data-drop-label=""
      className="flex min-h-[theme(spacing.40)] shrink-0 flex-col items-center justify-start gap-2 rounded-surface border-2 border-dashed border-border-focus bg-background-brand-subtle p-3 text-center typography-ui-medium text-text-brand-on-subtle"
    >
      <ArrowDownToLine className="h-icon-sm w-icon-sm shrink-0" />
      <span className="min-w-0">{label}</span>
    </li>
  ) : (
    <li aria-hidden="true" data-kanban-drop-marker="" className="h-1 shrink-0 rounded-full bg-border-focus" />
  );

export interface KanbanCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  id: string;
  title: string;
  subtitle?: ReactNode;
  // Record id or reference, shown in the code type role at the right of the title.
  code?: string;
  // Leading tile, e.g. a logo tile or avatar.
  leading?: ReactNode;
  selected?: boolean;
  // Controls shown at the top right of the card, outside the drag handle (e.g. a "Move to" menu button). Keeps the move possible without dragging.
  actions?: ReactNode;
  // Where the actions sit. 'top' is the top right corner next to the title, 'bottom' a row under the content so the title keeps the full width. 'inline' centres them on the title line at the card padding (right 12px, top 12px) so they read as part of the title row; the title truncates before them.
  actionsPlacement?: 'top' | 'bottom' | 'inline';
  // Title lines before it is cut off. 2 lets a long title wrap.
  titleLines?: 1 | 2;
}

const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ className, id, title, subtitle, code, leading, selected, actions, actionsPlacement = 'top', titleLines = 1, children, onClick, onKeyDown, ...props }, ref) => {
    const boardCtx = useContext(KanbanContext);
    const zero = usePreset() === 'zero';
    const standalone = boardCtx === null;
    const ctx = boardCtx ?? standaloneKanban;
    const grabbed = ctx.grabbedId === id;
    const { setNodeRef, listeners } = useDraggable({ id, disabled: !ctx.movable });
    const setRefs = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    };
    // Run the consumer handler first, then the sensor activator.
    const composed: Record<string, (event: never) => void> = {};
    Object.entries(listeners ?? {}).forEach(([name, handler]) => {
      const own = (props as Record<string, unknown>)[name] as ((event: unknown) => void) | undefined;
      composed[name] = (event: never) => {
        own?.(event);
        (handler as (event: never) => void)(event);
      };
    });

    const move = (dx: number, dy: number) => {
      const board = ctx.getBoard();
      const t = ctx.target;
      if (!board || !t) return;
      const columns = columnElements(board);
      const at = Math.max(0, columns.findIndex((c) => c.dataset.columnId === t.columnId));
      const nextColumn = Math.min(columns.length - 1, Math.max(0, at + dx));
      const col = columns[nextColumn];
      const count = cardElements(col).filter((c) => c.dataset.cardId !== id).length;
      const index = dx !== 0 ? Math.min(t.index, count) : Math.min(count, Math.max(0, t.index + dy));
      ctx.setTarget({ columnId: col.dataset.columnId ?? t.columnId, index });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        if (grabbed) ctx.commit();
        else event.currentTarget.click();
        return;
      }
      if (!ctx.movable) {
        if (event.key === ' ' && onClick) {
          event.preventDefault();
          event.currentTarget.click();
        }
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        if (grabbed) ctx.commit();
        else ctx.grab(id);
        return;
      }
      if (!grabbed) return;
      const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (keys[event.key]) {
        event.preventDefault();
        move(keys[event.key][0], keys[event.key][1]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        ctx.cancel();
      }
    };

    const actionCount = actions ? flattenActions(actions).length : 0;
    const inlineActions = actionsPlacement === 'inline' && actionCount > 0;
    // Inline actions only reserve space on the title row, so badges and avatars below keep the full card width.
    const inlineActionsPad = inlineActions ? (actionCount === 1 ? 'pr-7' : 'pr-16') : undefined;

    const content = (
      <>
        <div className={cn('flex items-start gap-3', inlineActionsPad)}>
          {leading}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className={cn('typography-ui-medium', titleLines === 2 ? 'line-clamp-2 break-words' : 'truncate')}>{title}</p>
              {code ? <span className="typography-code-sm shrink-0 text-muted-foreground">{code}</span> : null}
            </div>
            {subtitle ? <p className="typography-text-extra-small mt-2 truncate text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {children ? <div className="flex items-center gap-2">{children}</div> : null}
      </>
    );

    const bottomActions = actionsPlacement === 'bottom' && actionCount > 0;
    const faceBase = cn(
      'flex flex-col gap-2 rounded-surface border border-solid bg-card p-3 text-foreground',
      zero ? 'border-border-default shadow-elevation-surface' : 'border-hairline shadow-elevation-control',
      bottomActions && 'pb-11',
      !bottomActions && actionsPlacement !== 'inline' && actionCount === 1 && 'pr-10',
      !bottomActions && actionsPlacement !== 'inline' && actionCount > 1 && 'pr-20',
    );

    // The overlay copy follows the pointer while the original stays as a faded placeholder.
    const { registerFace } = ctx;
    useEffect(() => {
      registerFace(
        id,
        <div data-kanban-overlay="" className={cn(faceBase, 'cursor-grabbing select-none border-border-focus shadow-elevation-raised', className)}>
          {content}
        </div>,
      );
    });

    const touchStyle: CSSProperties | undefined = ctx.movable ? { WebkitTouchCallout: 'none' } : undefined;

    // Standalone and without a click handler the card is plain content, not a control.
    const inert = standalone && !onClick;
    const Wrapper = standalone ? 'div' : 'li';
    return (
      <Wrapper data-kanban-card="" data-card-id={id} data-card-title={title} data-grabbed={grabbed || undefined} className="relative list-none">
        <div
          data-kanban-handle=""
          role={inert ? undefined : 'button'}
          tabIndex={inert ? undefined : 0}
          aria-pressed={inert ? undefined : ctx.movable ? grabbed : selected}
          aria-roledescription={ctx.movable ? 'draggable card' : undefined}
          data-selected={selected || undefined}
          {...props}
          {...composed}
          style={{ ...touchStyle, ...props.style }}
          ref={setRefs}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          className={cn(
            faceBase,
            !inert && 'cursor-pointer',
            ctx.movable && 'select-none',
            'hover:border-border-bold data-[selected=true]:border-border-focus aria-[pressed=true]:border-border-focus aria-[pressed=true]:shadow-elevation-raised',
            zero && 'data-[selected=true]:ring-[3px] data-[selected=true]:ring-ring/30',
            grabbed && 'border-dashed border-border-focus',
            transitionBase,
            focusRing,
            className,
          )}
        >
          {content}
        </div>
        {actions ? <div data-kanban-actions="" data-placement={bottomActions ? 'bottom' : actionsPlacement === 'inline' ? 'inline' : 'top'} className={cn('absolute flex items-center gap-1', bottomActions ? 'bottom-2 right-2' : actionsPlacement === 'inline' ? 'right-3 top-3 h-5' : 'right-2 top-2')}>{actions}</div> : null}
      </Wrapper>
    );
  },
);
KanbanCard.displayName = 'KanbanCard';

export { Kanban, KanbanCard, KanbanColumn };
