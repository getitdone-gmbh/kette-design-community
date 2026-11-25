import { vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { DesignSystemProvider } from './design-system-provider';
import { getPaginationItems, Pagination } from './pagination';

describe('getPaginationItems', () => {
  it('lists every page when it fits', () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses the far side at the start and the near side at the end', () => {
    expect(getPaginationItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20]);
    expect(getPaginationItems(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20]);
  });

  it('collapses both sides in the middle', () => {
    expect(getPaginationItems(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
  });

  it('honours boundary and sibling counts', () => {
    expect(getPaginationItems(10, 30, 1, 2)).toEqual([1, 2, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 29, 30]);
  });
});

describe('Pagination', () => {
  it('is a labelled navigation with the current page marked', () => {
    render(<Pagination pageCount={10} defaultPage={3} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Page 2' })).not.toHaveAttribute('aria-current');
  });

  it('page variant: top hairline, ghost Previous/Next, 32px numbers with the muted current fill', () => {
    render(<Pagination pageCount={10} defaultPage={2} />);
    expect(screen.getByRole('navigation')).toHaveClass('border-t', 'border-border-default', 'justify-between', 'pt-5');
    const cur = screen.getByRole('button', { name: 'Page 2' });
    expect(cur).toHaveClass('h-control-sm', 'w-control-sm', 'rounded-control', 'aria-[current=page]:bg-muted', 'typography-label');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('circle shape rounds the number cells', () => {
    render(<Pagination pageCount={4} shape="circle" />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveClass('rounded-full');
  });

  it('uncontrolled: Next, Previous and number buttons move the page and report it', async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).toHaveBeenLastCalledWith(5);
    await userEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it('controlled: the page prop wins and nothing moves without it changing', async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination pageCount={5} page={1} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    rerender(<Pagination pageCount={5} page={3} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('disables Previous on the first page and Next on the last (State=Disabled)', () => {
    const { rerender } = render(<Pagination pageCount={3} page={1} />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
    rerender(<Pagination pageCount={3} page={3} />);
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });

  it('disabled disables everything', () => {
    render(<Pagination pageCount={3} disabled />);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });

  it('clamps an out of range page', () => {
    render(<Pagination pageCount={3} page={9} />);
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('ellipses are hidden from assistive tech', () => {
    const { container } = render(<Pagination pageCount={30} page={15} />);
    expect(container.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(2);
  });

  it('is keyboard operable: tab reaches pages and Enter selects', async () => {
    render(<Pagination pageCount={5} />);
    // Previous is disabled on page 1, so the first tab stop is page 1.
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  describe('card variants', () => {
    it('card uses outline buttons with the card padding', () => {
      render(<Pagination variant="card" pageCount={5} />);
      expect(screen.getByRole('navigation')).toHaveClass('px-6', 'pb-4', 'pt-3');
    });

    it('card minimal shows "Page x of y" with Previous and Next', async () => {
      render(<Pagination variant="card-minimal" pageCount={10} />);
      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('Page 2 of 10')).toBeInTheDocument();
    });

    it('card minimal center aligned keeps the label between the buttons', () => {
      render(<Pagination variant="card-minimal" align="center" pageCount={10} />);
      const labels = screen.getByText('Page 1 of 10');
      expect(labels.previousElementSibling).toHaveTextContent('Previous');
      expect(labels.nextElementSibling).toHaveTextContent('Next');
    });

    it('card button group renders a segmented control with the current page marked', async () => {
      render(<Pagination variant="card-button-group" pageCount={6} align="center" />);
      const group = screen.getByRole('group', { name: 'Pages' });
      expect(group).toHaveClass('rounded-control');
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveClass('data-[current]:bg-muted');
      await userEvent.click(screen.getByRole('button', { name: 'Page 4' }));
      expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('compact (zero)', () => {
    it('shows the range summary, per page text and icon arrows', () => {
      render(<Pagination variant="compact" total={214} pageSize={20} defaultPage={2} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('h-auto', 'flex-wrap', 'sm:h-pager', 'bg-card', 'border-t');
      expect(screen.getByText('21 to 40 of 214')).toBeInTheDocument();
      expect(screen.getByText('20 per page')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveClass('aria-[current=page]:bg-background');
    });

    it('derives the page count from total and pageSize and caps the last range', async () => {
      render(<Pagination variant="compact" total={45} pageSize={20} />);
      await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
      expect(screen.getByText('41 to 45 of 45')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('empty result reads 0 to 0', () => {
      render(<Pagination variant="compact" total={0} pageSize={20} />);
      expect(screen.getByText('0 to 0 of 0')).toBeInTheDocument();
    });

    it('offers a per page selector when onPageSizeChange is provided', () => {
      render(<Pagination variant="compact" total={100} pageSize={20} pageSizeOptions={[10, 20, 50]} onPageSizeChange={vi.fn()} />);
      expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveTextContent('20 per page');
    });
  });

  describe('lazy', () => {
    it('shows progress and a Load more button that calls back', async () => {
      const onLoadMore = vi.fn();
      render(<Pagination variant="lazy" pageSize={20} total={134} onLoadMore={onLoadMore} />);
      expect(screen.getByText('Showing 20 of 134')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('loading shows a spinner, sets aria-busy and blocks a second request', async () => {
      const onLoadMore = vi.fn();
      render(<Pagination variant="lazy" pageSize={20} total={134} loading onLoadMore={onLoadMore} />);
      const btn = screen.getByRole('button', { name: /Load more/ });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status', { name: 'Loading more' })).toBeInTheDocument();
      await userEvent.click(btn);
      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('exhausted hides the button', () => {
      render(<Pagination variant="lazy" pageSize={134} total={134} exhausted />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});

describe('Pagination loading markup', () => {
  // The loading summary holds the spinner block, so it must not sit inside a paragraph.
  it.each([
    ['page-minimal', 'left'],
    ['page-minimal', 'center'],
    ['card-minimal', 'right'],
    ['compact', 'left'],
  ] as const)('renders %s (%s) loading without a DOM nesting warning', (variant, align) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Pagination variant={variant} align={align} pageCount={5} total={50} loading />);
    const nesting = spy.mock.calls.filter((call) => String(call[0]).includes('validateDOMNesting') || String(call.join(' ')).includes('cannot be a descendant'));
    spy.mockRestore();
    expect(nesting).toEqual([]);
    expect(screen.getByText(/Loading/).closest('[aria-live="polite"]')).not.toBeNull();
    expect(document.querySelector('p [role="presentation"]')).toBeNull();
  });
});

// C-1: link mode, crawlable pager without JavaScript.
describe('Pagination link mode (getPageHref)', () => {
  const href = (page: number) => `/servers?page=${page}`;

  it('renders page numbers, Previous and Next as real links', () => {
    render(<Pagination pageCount={10} page={3} getPageHref={href} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    const current = within(nav).getByRole('link', { name: 'Page 3' });
    expect(current).toHaveAttribute('href', '/servers?page=3');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Page 2' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: /Previous/ })).toHaveAttribute('href', '/servers?page=2');
    expect(within(nav).getByRole('link', { name: /Previous/ })).toHaveAttribute('rel', 'prev');
    expect(within(nav).getByRole('link', { name: /Next/ })).toHaveAttribute('href', '/servers?page=4');
    expect(within(nav).getByRole('link', { name: /Next/ })).toHaveAttribute('rel', 'next');
    expect(within(nav).queryAllByRole('button')).toHaveLength(0);
  });

  it('does not track or report the page itself, the URL does', async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={5} page={1} onPageChange={onPageChange} getPageHref={href} />);
    const link = screen.getByRole('link', { name: 'Page 2' });
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('first page Previous and last page Next are disabled and not links', () => {
    const { rerender } = render(<Pagination pageCount={3} page={1} getPageHref={href} />);
    expect(screen.queryByRole('link', { name: /Previous/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    rerender(<Pagination pageCount={3} page={3} getPageHref={href} />);
    expect(screen.queryByRole('link', { name: /Next/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });

  it('a disabled pager has no href anywhere', () => {
    render(<Pagination pageCount={4} page={2} disabled getPageHref={href} />);
    const nav = screen.getByRole('navigation');
    expect(nav.querySelectorAll('a[href]')).toHaveLength(0);
    expect(within(nav).getByText('2').closest('[aria-disabled="true"]')).not.toBeNull();
  });

  it.each(['page', 'card', 'page-minimal', 'card-minimal', 'card-button-group', 'compact'] as const)('%s variant keeps links', (variant) => {
    render(<Pagination variant={variant} pageCount={6} page={3} total={120} pageSize={20} getPageHref={href} />);
    const nav = screen.getByRole('navigation');
    expect(nav.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(2);
    expect(nav.querySelector('a[rel="next"]')).toHaveAttribute('href', '/servers?page=4');
    expect(nav.querySelector('a[rel="prev"]')).toHaveAttribute('href', '/servers?page=2');
  });

  it('lazy ignores link mode', () => {
    render(<Pagination variant="lazy" total={100} pageSize={20} onLoadMore={() => undefined} getPageHref={href} />);
    expect(screen.getByRole('button', { name: /Load more/ })).toBeInTheDocument();
  });
});

describe('Pagination busy controls (KETTE-84)', () => {
  it.each(['page', 'card', 'compact', 'card-button-group'] as const)('%s keeps Previous and Next focusable and gated while loading', async (variant) => {
    const onPageChange = vi.fn();
    render(<Pagination variant={variant} pageCount={10} page={5} onPageChange={onPageChange} loading />);
    const next = screen.getByRole('button', { name: /Next/ });
    next.focus();
    expect(next).toHaveFocus();
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).not.toBeDisabled();
    await userEvent.click(next);
    await userEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('still disables every control with disabled', () => {
    render(<Pagination variant="compact" pageCount={10} page={5} disabled />);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
});

describe('Pagination compact on a phone (KETTE-82)', () => {
  it('shows Page x of y between the arrows and hides the page numbers below sm', () => {
    render(<Pagination variant="compact" total={2404} pageSize={20} page={3} />);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Page 3 of 121')).toHaveClass('sm:hidden');
    expect(nav.querySelector('ol')).toHaveClass('max-sm:hidden');
  });

  it('keeps arrows and the Page x of y text in one group that does not break across lines', () => {
    render(<Pagination variant="compact" total={2404} pageSize={20} page={3} />);
    const group = screen.getByText('Page 3 of 121').parentElement as HTMLElement;
    expect(group).toHaveClass('shrink-0', 'sm:contents');
    expect(within(group).getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Next page' })).toBeInTheDocument();
  });
});

describe('Pagination compact page size trigger (DR-KB-03)', () => {
  it('uses the small control type, not the 16px field floor below sm', () => {
    render(<Pagination variant="compact" total={2404} pageSize={20} pageSizeOptions={[20, 50]} onPageSizeChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', { name: 'Rows per page' });
    expect(trigger.className).not.toContain('max-sm:text-[max(16px');
    expect(trigger).toHaveClass('!typography-caption-regular');
  });
});

describe('Pagination number formatting (KETTE-82)', () => {
  it('formats the record range with the locale grouping (en)', () => {
    render(<Pagination variant="compact" total={2404} pageSize={20} page={121} />);
    expect(screen.getByText('2,401 to 2,404 of 2,404')).toBeInTheDocument();
    expect(screen.getByText('Page 121 of 121')).toBeInTheDocument();
  });

  it('formats the record range with the locale grouping (de)', () => {
    render(
      <DesignSystemProvider locale="de">
        <Pagination variant="compact" total={2404} pageSize={20} page={2} />
      </DesignSystemProvider>,
    );
    expect(screen.getByText('21 bis 40 von 2.404')).toBeInTheDocument();
  });

  it('formats the lazy summary', () => {
    render(<Pagination variant="lazy" pageSize={1200} total={2404} />);
    expect(screen.getByText('Showing 1,200 of 2,404')).toBeInTheDocument();
  });

  it('hands plain numbers to a custom rangeText', () => {
    render(<Pagination variant="compact" total={2404} pageSize={20} rangeText={(a, b, t) => `${typeof a}${typeof b}${typeof t}`} />);
    expect(screen.getByText('numbernumbernumber')).toBeInTheDocument();
  });
});
