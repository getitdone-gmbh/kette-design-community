'use client';

import { cva } from 'class-variance-authority';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { focusRing } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { ButtonGroup, ButtonGroupItem } from './button-group';
import { LoadingSpinner } from './loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useLabels, usePreset } from './labels-context';
import type { LabelProp } from './labels';

// Figma Pagination (1115:68622): Type Page default | Page minimal | Card default | Card minimal | Card button group | Lazy | Compact (zero),
// Shape Square | Circle, State Default | Disabled | Loading (Lazy).
type PaginationVariant = 'page' | 'page-minimal' | 'card' | 'card-minimal' | 'card-button-group' | 'compact' | 'lazy';
type PaginationShape = 'square' | 'circle';
type PaginationAlign = 'left' | 'center' | 'right';
type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

// Page list with ellipses: boundary pages at both ends, a sibling window around the current page.
const getPaginationItems = (page: number, count: number, siblingCount = 1, boundaryCount = 1): PaginationItem[] => {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);
  const siblingsStart = Math.max(Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2);
  const siblingsEnd = Math.min(Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2), endPages.length > 0 ? endPages[0] - 2 : count - 1);
  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2 ? (['ellipsis-start'] as const) : boundaryCount + 1 < count - boundaryCount ? [boundaryCount + 1] : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1 ? (['ellipsis-end'] as const) : count - boundaryCount > boundaryCount ? [count - boundaryCount] : []),
    ...endPages,
  ];
};

const frameVariants = cva('flex w-full items-center border-t border-solid border-border-default', {
  variants: {
    variant: {
      page: 'justify-between pt-5',
      'page-minimal': 'justify-between pt-5',
      card: 'justify-between px-6 pb-4 pt-3',
      'card-minimal': 'justify-between px-6 pb-4 pt-3',
      'card-button-group': 'px-6 pb-4 pt-3',
      lazy: 'justify-center gap-3 px-6 pb-4 pt-3',
      compact: 'h-auto flex-wrap gap-2 sm:h-pager sm:flex-nowrap bg-card px-4 py-2',
    },
  },
  defaultVariants: { variant: 'page' },
});

const numberVariants = cva(
  [
    'inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center transition-colors',
    'hover:bg-muted hover:text-text-default',
    'disabled:pointer-events-none disabled:opacity-disabled',
    ...focusRing,
  ],
  {
    variants: {
      shape: { square: 'rounded-control', circle: 'rounded-full' },
      // Compact (zero): idle pages are default text on no fill, the current page is a white chip with a hairline border.
      tone: {
        default: 'typography-label text-text-subtle aria-[current=page]:bg-muted aria-[current=page]:text-text-default',
        // Zero page list (variant page and card): 13px pages, 12/500 current page, no 16px label role.
        zeroPage: 'typography-ui-sm text-text-subtle aria-[current=page]:typography-detail aria-[current=page]:bg-muted aria-[current=page]:text-text-default',
        // Compact before the zero preset: kept as shipped for every other theme.
        compactLegacy:
          'typography-label aria-[current=page]:bg-muted aria-[current=page]:text-text-default border border-solid border-transparent text-text-default hover:bg-muted aria-[current=page]:border-border-default aria-[current=page]:bg-background',
        compact:
          'typography-ui-sm aria-[current=page]:typography-detail border border-solid border-transparent text-text-default hover:bg-muted aria-[current=page]:border-border-default aria-[current=page]:bg-background',
      },
    },
    defaultVariants: { shape: 'square', tone: 'default' },
  },
);

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  variant?: PaginationVariant;
  // `sm` puts every control on the Button sm height (control-sm token: 32, zero 28). The page, card, minimal, lazy and compact variants already sit on that height, so for them `sm` changes nothing. The button group variant drops from control-md (40, zero 32) to control-sm.
  size?: 'default' | 'sm';
  shape?: PaginationShape;
  // Controlled current page (1 based).
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  // Total number of pages. Derived from `total` and `pageSize` when omitted.
  pageCount?: number;
  // Total number of records, used by `compact` ("1 to 20 of 214") and `lazy` ("Showing 20 of 134").
  total?: number;
  // Records per page (`compact`) or records loaded so far (`lazy`).
  pageSize?: number;
  // Options for the per-page selector in `compact`. Without `onPageSizeChange` the text is static.
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  // Alignment of the actions for the minimal and button group cards.
  align?: PaginationAlign;
  // Number of pages shown on each side of the current page.
  siblingCount?: number;
  // Number of pages always shown at each end.
  boundaryCount?: number;
  // Disables every control.
  disabled?: boolean;
  // A load is in flight. `lazy`: spinner on Load more. Other variants: the summary reads "Loading…", the pager is `aria-busy` and its controls are disabled.
  loading?: boolean;
  // Text shown instead of the range or page summary while `loading`. Wins over the provider text.
  loadingText?: string;
  // Announce the summary changes politely. Set false when another live region already announces the load (a table first load), so the pager stays silent.
  announce?: boolean;
  // `lazy`: called by the Load more button.
  onLoadMore?: () => void;
  // `lazy`: no further records, hides the button.
  exhausted?: boolean;
  // Built-in texts. Each wins over the provider text; the function forms receive the numbers.
  previousLabel?: string;
  nextLabel?: string;
  previousText?: string;
  nextText?: string;
  rowsPerPageLabel?: string;
  pagesLabel?: string;
  pageLabel?: LabelProp<[number]>;
  pageOfText?: LabelProp<[number, number]>;
  perPageText?: LabelProp<[number]>;
  rangeText?: LabelProp<[number, number, number | undefined]>;
  showingText?: LabelProp<[number, number]>;
  loadMoreText?: string;
  loadingMoreLabel?: string;
}

const alignClass: Record<PaginationAlign, string> = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      variant = 'page',
      size = 'default',
      shape = 'square',
      page: pageProp,
      defaultPage = 1,
      onPageChange,
      pageCount: pageCountProp,
      total,
      pageSize = 20,
      pageSizeOptions,
      onPageSizeChange,
      align = 'right',
      siblingCount = 1,
      boundaryCount = 1,
      disabled = false,
      loading = false,
      announce = true,
      onLoadMore,
      exhausted = false,
      'aria-label': ariaLabelProp,
      previousLabel,
      nextLabel,
      previousText,
      nextText,
      rowsPerPageLabel,
      pagesLabel,
      pageLabel,
      pageOfText,
      perPageText,
      rangeText,
      showingText,
      loadMoreText,
      loadingMoreLabel,
      loadingText,
      ...props
    },
    ref,
  ) => {
    const l = useLabels({
      previousPage: previousLabel,
      nextPage: nextLabel,
      previous: previousText,
      next: nextText,
      rowsPerPage: rowsPerPageLabel,
      pages: pagesLabel,
      page: pageLabel,
      pageOf: pageOfText,
      perPage: perPageText,
      range: rangeText,
      showing: showingText,
      loadMore: loadMoreText,
      loadingMore: loadingMoreLabel,
      loading: loadingText,
    });
    const ariaLabel = ariaLabelProp ?? l.pagination;
    // Non-lazy pagers block navigation while a page loads
    const zero = usePreset() === 'zero';
    const pagerBusy = loading && variant !== 'lazy';
    const off = disabled || pagerBusy;
    const live = announce ? 'polite' : 'off';
    const loadingSummary = (
      <span className="inline-flex items-center gap-2">
        <LoadingSpinner size="sm" role="presentation" aria-hidden />
        {`${l.loading}…`}
      </span>
    );
    const [inner, setInner] = React.useState(defaultPage);
    const controlled = pageProp !== undefined;
    const pageCount = Math.max(1, pageCountProp ?? (total !== undefined ? Math.ceil(total / pageSize) : 1));
    const page = Math.min(Math.max(1, controlled ? pageProp : inner), pageCount);
    const goTo = (next: number) => {
      const clamped = Math.min(Math.max(1, next), pageCount);
      if (clamped === page) return;
      if (!controlled) setInner(clamped);
      onPageChange?.(clamped);
    };
    const items = getPaginationItems(page, pageCount, siblingCount, boundaryCount);
    const atStart = page <= 1;
    const atEnd = page >= pageCount;
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = total === undefined ? page * pageSize : Math.min(page * pageSize, total);

    const numberCells = (tone: 'default' | 'zeroPage' | 'compact' | 'compactLegacy' = 'default') =>
      items.map((item) =>
        typeof item === 'number' ? (
          <li key={item}>
            <button
              type="button"
              disabled={off}
              aria-label={l.page(item)}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => goTo(item)}
              className={numberVariants({ shape, tone })}
            >
              {item}
            </button>
          </li>
        ) : (
          <li key={item} aria-hidden="true">
            <span className={cn(numberVariants({ shape, tone }), 'pointer-events-none hover:bg-transparent')}>...</span>
          </li>
        ),
      );

    // The page and card lists show the numbers from sm up. Below sm they collapse to "Page x of y" so the row never overflows a 390px screen.
    const pagesTone = variant === 'compact' ? (zero ? 'compact' : 'compactLegacy') : zero ? 'zeroPage' : 'default';
    const collapsible = variant === 'page' || variant === 'card';
    const pages = (
      <>
        <ol className={cn('flex items-center', variant === 'compact' ? cn('flex-wrap', zero ? 'gap-2' : 'gap-1') : 'gap-micro', collapsible && 'max-sm:hidden')}>{numberCells(pagesTone)}</ol>
        {collapsible ? (
          <span aria-live={live} className={cn('min-w-0 text-center text-text-default sm:hidden', zero ? 'typography-ui-sm' : 'typography-label')}>
            {pagerBusy ? loadingSummary : l.pageOf(page, pageCount)}
          </span>
        ) : null}
      </>
    );

    const textButtons = (kind: 'ghost' | 'outline') => (
      <>
        <Button type="button" variant={kind} size="sm" disabled={off || atStart} onClick={() => goTo(page - 1)} icon={<ArrowLeft />}>
          {l.previous}
        </Button>
        {pages}
        <Button type="button" variant={kind} size="sm" disabled={off || atEnd} onClick={() => goTo(page + 1)}>
          {l.next}
          <ArrowRight aria-hidden="true" className="h-icon-md w-icon-md shrink-0" />
        </Button>
      </>
    );

    let body: React.ReactNode;
    if (variant === 'page') {
      body = textButtons('ghost');
    } else if (variant === 'card') {
      body = textButtons('outline');
    } else if (variant === 'page-minimal' || variant === 'card-minimal') {
      // Minimal: "Page x of y" with Previous and Next, the group sits on the chosen side.
      body = (
        <>
          <div aria-live={live} className={cn('typography-label text-text-default', align === 'center' && 'mx-auto')}>
            {pagerBusy ? loadingSummary : l.pageOf(page, pageCount)}
          </div>
          <div className={cn('flex items-start gap-3', align === 'left' && 'order-first', align === 'center' && 'hidden')}>
            <Button type="button" variant="outline" size="sm" disabled={off || atStart} onClick={() => goTo(page - 1)}>
              {l.previous}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={off || atEnd} onClick={() => goTo(page + 1)}>
              {l.next}
            </Button>
          </div>
        </>
      );
      if (align === 'center') {
        body = (
          <div className="flex w-full items-center justify-center gap-3">
            <Button type="button" variant="outline" size="sm" disabled={off || atStart} onClick={() => goTo(page - 1)}>
              {l.previous}
            </Button>
            <div aria-live={live} className="typography-label text-text-default">
              {pagerBusy ? loadingSummary : l.pageOf(page, pageCount)}
            </div>
            <Button type="button" variant="outline" size="sm" disabled={off || atEnd} onClick={() => goTo(page + 1)}>
              {l.next}
            </Button>
          </div>
        );
      }
    } else if (variant === 'card-button-group') {
      body = (
        <div className={cn('flex w-full', alignClass[align])}>
          <ButtonGroup aria-label={l.pages} size={size}>
            <ButtonGroupItem disabled={off || atStart} icon={<ArrowLeft />} onClick={() => goTo(page - 1)}>
              {l.previous}
            </ButtonGroupItem>
            {items.map((item) =>
              typeof item === 'number' ? (
                <ButtonGroupItem
                  key={item}
                  disabled={off}
                  aria-label={l.page(item)}
                  aria-current={item === page ? 'page' : undefined}
                  data-current={item === page ? true : undefined}
                  // Below sm only the current page stays, so the group never overflows a 390px screen.
                  className={cn(size === 'sm' ? 'w-control-sm' : 'w-control-md', 'px-0', item !== page && 'max-sm:hidden')}
                  onClick={() => goTo(item)}
                >
                  {item}
                </ButtonGroupItem>
              ) : (
                <span
                  key={item}
                  aria-hidden="true"
                  className={cn(
                    'inline-flex items-center justify-center border-r border-solid border-input typography-label text-text-subtle max-sm:hidden',
                    size === 'sm' ? 'h-full w-control-sm' : 'h-control-md w-control-md',
                  )}
                >
                  ...
                </span>
              ),
            )}
            <ButtonGroupItem disabled={off || atEnd} onClick={() => goTo(page + 1)}>
              {l.next}
              <ArrowRight aria-hidden="true" className="h-icon-md w-icon-md shrink-0" />
            </ButtonGroupItem>
          </ButtonGroup>
        </div>
      );
    } else if (variant === 'lazy') {
      body = (
        <>
          <p aria-live={live} className="typography-label text-text-default">
            {l.showing(pageSize, total ?? pageSize)}
          </p>
          {!exhausted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || loading}
              aria-busy={loading || undefined}
              onClick={() => onLoadMore?.()}
            >
              {loading && <LoadingSpinner size="sm" label={l.loadingMore} />}
              {l.loadMore}
            </Button>
          )}
        </>
      );
    } else {
      // compact (zero): summary, spacer, per page, arrows, pages
      const sizes = pageSizeOptions ?? [pageSize];
      body = (
        <>
          <div aria-live={live} className="typography-caption-regular shrink-0 text-text-subtle">
            {pagerBusy ? loadingSummary : l.range(first, last, total)}
          </div>
          <div className="flex-1" />
          {onPageSizeChange ? (
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))} disabled={off}>
              <SelectTrigger
                aria-label={l.rowsPerPage}
                className={cn('h-control-sm w-auto gap-1 border-transparent bg-transparent px-2 py-0 text-text-subtle shadow-none', zero ? 'typography-ui-sm' : 'typography-caption-regular')}
              >
                <SelectValue>{l.perPage(pageSize)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {l.perPage(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="typography-caption-regular shrink-0 text-text-subtle">{l.perPage(pageSize)}</p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={l.previousPage}
            disabled={off || atStart}
            onClick={() => goTo(page - 1)}
            className={cn('h-control-sm w-control-sm', zero && 'disabled:!opacity-100 disabled:text-text-subtlest')}
          >
            <ChevronLeft aria-hidden="true" className="h-icon-md w-icon-md" />
          </Button>
          {pages}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={l.nextPage}
            disabled={off || atEnd}
            onClick={() => goTo(page + 1)}
            className={cn('h-control-sm w-control-sm', zero && 'disabled:!opacity-100 disabled:text-text-subtlest')}
          >
            <ChevronRight aria-hidden="true" className="h-icon-md w-icon-md" />
          </Button>
        </>
      );
    }

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        aria-busy={pagerBusy || undefined}
        data-variant={variant}
        data-size={size === 'sm' ? 'sm' : undefined}
        data-shape={shape}
        className={cn(frameVariants({ variant }), className)}
        {...props}
      >
        {body}
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';

export { getPaginationItems, Pagination, type PaginationAlign, type PaginationItem, type PaginationShape, type PaginationVariant };
