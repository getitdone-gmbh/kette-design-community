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

  it('default variant has no dashed border and renders actions in a row', () => {
    render(<EmptyState title="No projects" actions={<button type="button">New project</button>} />);
    expect(screen.getByRole('status')).not.toHaveClass('border-dashed');
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument();
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

  it('xs size uses the tighter gap and lighter title', () => {
    const { container } = render(<EmptyState size="xs" title="Empty" />);
    expect(container.firstChild).toHaveClass('gap-3');
    expect(screen.getByText('Empty')).toHaveClass('typography-label-highlight');
  });

  it('size page sets the page title type role with the large tile', () => {
    render(<EmptyState size="page" titleAs="h1" title="Page not found" icon={<span data-testid="ic" />} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toHaveClass('typography-page-title');
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('typography-ui-lg-semibold');
    expect(screen.getByTestId('ic').parentElement).toHaveClass('h-avatar-xl', 'w-avatar-xl');
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
