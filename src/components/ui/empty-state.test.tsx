import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { EmptyState } from './empty-state';
import { Illustration } from './illustration';

describe('EmptyState', () => {
  it.each(['first-use', 'no-results', 'no-access'] as const)('%s renders a polite status with a dashed tile', (variant) => {
    render(<EmptyState variant={variant} title="Title" description="Text" />);
    const root = screen.getByRole('status');
    expect(root).toHaveClass('border-dashed');
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('error variant is an assertive alert', () => {
    render(<EmptyState variant="error" title="Could not load" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('default variant shares the dashed frame and renders actions in a row', () => {
    render(<EmptyState title="No projects" actions={<button type="button">New project</button>} />);
    expect(screen.getByRole('status')).toHaveClass('border-dashed');
    expect(screen.getByRole('button', { name: 'New project' }).parentElement).toHaveClass('flex-wrap');
  });

  it('icon={null} renders no tile and a custom icon replaces the default', () => {
    const { rerender, container } = render(<EmptyState title="t" icon={null} />);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<EmptyState title="t" icon={<svg data-testid="own" />} />);
    expect(screen.getByTestId('own')).toBeInTheDocument();
  });

  it('renders an illustration instead of the icon tile', () => {
    render(<EmptyState title="t" illustration={<Illustration data-testid="ill" icon={<span />} />} />);
    expect(screen.getByTestId('ill')).toBeInTheDocument();
  });

  it('forwards a ref and merges className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<EmptyState ref={ref} className="max-w-md" title="t" />);
    expect(ref.current).toHaveClass('max-w-md');
  });
});

describe('Illustration', () => {
  it('is decorative', () => {
    const { container } = render(<Illustration />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('EmptyState titleAs and xs size', () => {
  it('renders the title as a paragraph by default', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here').tagName).toBe('P');
  });

  it('renders the title as a heading with titleAs', () => {
    render(<EmptyState title="Page not found" titleAs="h1" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('xs size uses the shared gap and the ui-medium title', () => {
    const { container } = render(<EmptyState size="xs" title="Empty" />);
    expect(container.firstChild).toHaveClass('gap-2');
    expect(screen.getByText('Empty')).toHaveClass('typography-ui-medium');
  });

  it('size page sets the page title type role with the bare icon', () => {
    render(<EmptyState size="page" titleAs="h1" title="Page not found" icon={<span data-testid="ic" />} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toHaveClass('typography-page-title');
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('typography-ui-lg-semibold');
    expect(screen.getByTestId('ic').parentElement).toHaveClass('h-icon-md', 'w-icon-md');
  });
});

describe('EmptyState page adoption options', () => {
  it('centers by default and aligns to the start with align start', () => {
    const { container, rerender } = render(<EmptyState title="T" actions={<button type="button">Go</button>} />);
    expect(container.firstChild).toHaveClass('items-center', 'text-center');
    rerender(<EmptyState align="start" title="T" actions={<button type="button">Go</button>} />);
    expect(container.firstChild).toHaveClass('items-start', 'text-left');
    expect(container.firstChild).not.toHaveClass('text-center');
    expect(screen.getByText('T').parentElement).toHaveClass('items-start');
    expect(screen.getByRole('button', { name: 'Go' }).parentElement).toHaveClass('justify-start');
  });

  it('renders a kicker above the title', () => {
    render(<EmptyState size="page" titleAs="h1" kicker="404" title="Page not found" />);
    const kicker = screen.getByText('404');
    expect(kicker).toHaveAttribute('data-slot', 'kicker');
    expect(kicker.compareDocumentPosition(screen.getByRole('heading', { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps a string description as one paragraph', () => {
    render(<EmptyState title="T" description="Plain" />);
    expect(screen.getByText('Plain').tagName).toBe('P');
  });

  it('renders a node description in a block so paragraphs are not nested', () => {
    const { container } = render(
      <EmptyState
        title="T"
        description={
          <>
            <p>First</p>
            <p>Second</p>
          </>
        }
      />,
    );
    expect(screen.getByText('First').parentElement?.tagName).toBe('DIV');
    expect(container.querySelectorAll('p p')).toHaveLength(0);
  });

  it('renders children below the description', () => {
    render(
      <EmptyState title="T" description="D">
        <p>More</p>
      </EmptyState>,
    );
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('titleSize display sets the display-sm title role', () => {
    render(<EmptyState title="Gone" titleAs="h1" size="page" titleSize="display" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('typography-display-sm');
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('typography-page-title');
  });

  it('locked by plan: a no-access state with what stays free and one primary action', () => {
    render(<EmptyState variant="no-access" title="Recommended is part of jobsearch.zero" description="Your profile stays free." actions={<button type="button">Choose jobsearch.zero</button>} />);
    expect(screen.getByRole('status')).toHaveTextContent('Recommended is part of jobsearch.zero');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('EmptyState shared body (ZERO-790)', () => {
  it.each(['default', 'first-use', 'no-results', 'error', 'no-access'] as const)('%s renders the dashed frame, a bare icon and no tile', (variant) => {
    const { container } = render(<EmptyState variant={variant} title="Title" icon={<svg data-testid="ic" />} />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('border-dashed', 'rounded-card', 'justify-center', 'flex-1', 'w-full');
    expect(root).not.toHaveClass('rounded-surface');
    const tile = screen.getByTestId('ic').parentElement as HTMLElement;
    expect(tile).toHaveClass('h-icon-md', 'w-icon-md');
    expect(tile.className).not.toMatch(/rounded-full|border-8|border-4|bg-muted|h-avatar/);
  });

  it('outlined={false} drops the frame classes but keeps the centred body', () => {
    const { container } = render(<EmptyState outlined={false} title="Title" />);
    const root = container.firstChild as HTMLElement;
    expect(root).not.toHaveClass('border-dashed');
    expect(root).not.toHaveClass('rounded-card');
    expect(root).toHaveClass('justify-center', 'items-center', 'text-center');
  });

  it('error stays an alert and keeps the neutral dashed frame', () => {
    render(<EmptyState variant="error" title="Could not load" />);
    const root = screen.getByRole('alert');
    expect(root).toHaveClass('border-dashed');
    expect(root).not.toHaveClass('border-border-destructive');
  });

  it('xs and sm use the ui-medium title and the extra-small text of the data state panel', () => {
    render(<EmptyState size="sm" title="Empty" description="Text" />);
    expect(screen.getByText('Empty')).toHaveClass('typography-ui-medium');
    expect(screen.getByText('Text')).toHaveClass('typography-text-extra-small');
  });

  it('size page keeps the page title role without a tile', () => {
    render(<EmptyState size="page" titleAs="h1" title="Page not found" icon={<span data-testid="ic" />} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('typography-page-title');
    expect(screen.getByTestId('ic').parentElement?.className).not.toMatch(/h-avatar/);
  });

  it('keeps the icon decorative and tone primary colours only the icon', () => {
    const { container } = render(<EmptyState tone="primary" title="t" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')?.parentElement).toHaveClass('text-icon-brand');
  });
});
