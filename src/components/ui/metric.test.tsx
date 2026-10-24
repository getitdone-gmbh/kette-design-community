import { expectTypeOf, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type MouseEvent as ReactMouseEvent } from 'react';

import { KpiStrip, MetricItem, type MetricItemProps } from './metric';

describe('MetricItem', () => {
  it('only requires label and value, variant and density stay optional (type level)', () => {
    type RequiredKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? never : K }[keyof T];
    expectTypeOf<RequiredKeys<MetricItemProps>>().toEqualTypeOf<'label' | 'value'>();
    const { container } = render(<MetricItem label="a" value="1" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders label, value and delta', () => {
    render(<MetricItem label="Open demands" value="24" delta="+3 vs last week" deltaTone="success" />);
    expect(screen.getByText('Open demands')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('+3 vs last week')).toHaveClass('text-text-success');
  });

  it('defaults to the strip variant with a divider and no button semantics', () => {
    const { container } = render(<MetricItem label="a" value="1" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[data-kpi-divider]')).not.toBeNull();
  });

  it('omits the divider when divider is false', () => {
    const { container } = render(<MetricItem label="a" value="1" divider={false} />);
    expect(container.querySelector('[data-kpi-divider]')).toBeNull();
  });

  it('becomes a toggle button with aria-pressed when onClick is set and activates with the keyboard', async () => {
    const onClick = vi.fn();
    render(<MetricItem label="Late" value="3" selected onClick={onClick} />);
    const button = screen.getByRole('button', { name: /Late/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('is busy and not interactive while loading', () => {
    const { container } = render(<MetricItem label="a" value="1" loading onClick={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    // The value is only transparent filler for the skeleton and hidden from assistive tech.
    expect(screen.getByText('1').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('keeps the label visible while loading and hides value and delta from assistive tech', () => {
    render(<MetricItem label="Open tasks" value="12" delta="+3" loading />);
    expect(screen.getByText('Open tasks')).toBeVisible();
    expect(screen.getByText('12').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByText('+3').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('is inert and aria-disabled when disabled', () => {
    const { container } = render(<MetricItem label="a" value="1" disabled onClick={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders the compact and card variants with icon and chart slots', () => {
    render(<MetricItem variant="card" label="Views" value="2,000" icon={<svg data-testid="i" />} chart={<svg data-testid="c" />} />);
    expect(screen.getByTestId('i')).toBeInTheDocument();
    expect(screen.getByTestId('c')).toBeInTheDocument();
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLElement>();
    render(<MetricItem ref={ref} label="a" value="1" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});

describe('MetricItem as link', () => {
  it('renders one real anchor named by label and value, with no nested interactive element', () => {
    const { container } = render(<MetricItem label="Open demands" value="24" delta="+3" caption="Across all projects" href="/demands?status=open" />);
    const link = screen.getByRole('link', { name: /Open demands.*24.*\+3.*Across all projects/ });
    expect(link).toHaveAttribute('href', '/demands?status=open');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(link.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is reachable by keyboard and carries the tile hover, focus and no-underline classes', () => {
    render(<MetricItem label="Late" value="3" href="/late" />);
    const link = screen.getByRole('link');
    link.focus();
    expect(link).toHaveFocus();
    expect(link).toHaveClass('hover:bg-muted', 'focus-visible:ring-ring-default', 'focus-visible:ring-inset', 'no-underline', 'flex');
  });

  it('marks the selected link with aria-current and keeps rel safe for new tabs', () => {
    render(<MetricItem label="Late" value="3" href="/late" selected target="_blank" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-current', 'true');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('merges the tile into the child link with asChild and keeps its own props', async () => {
    const onClick = vi.fn((e: ReactMouseEvent) => e.preventDefault());
    render(
      <MetricItem label="Filled" value="8" asChild>
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- content is merged in by asChild */}
        <a href="/filled" data-router-link onClick={onClick} />
      </MetricItem>,
    );
    const link = screen.getByRole('link', { name: /Filled.*8/ });
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveClass('hover:bg-muted');
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('a')).toHaveLength(1);
  });

  it('falls back to a static, non-link tile while loading or disabled', () => {
    const { rerender } = render(<MetricItem label="a" value="1" href="/x" loading />);
    expect(screen.queryByRole('link')).toBeNull();
    rerender(<MetricItem label="a" value="1" href="/x" disabled />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('does not change the markup or classes of non-link tiles', () => {
    const { container } = render(<MetricItem label="a" value="1" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).not.toMatch(/no-underline|cursor-pointer|ring-inset/);
  });

  it('works inside a KpiStrip as peers of button tiles', () => {
    render(
      <KpiStrip aria-label="KPIs">
        <MetricItem label="Open" value="24" href="/open" />
        <MetricItem label="Late" value="3" onClick={() => {}} />
      </KpiStrip>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('KpiStrip', () => {
  it('is a group that hides the first divider via CSS and merges className', () => {
    render(
      <KpiStrip aria-label="Demand KPIs" className="max-w-xl">
        <MetricItem label="a" value="1" />
        <MetricItem label="b" value="2" />
      </KpiStrip>,
    );
    const group = screen.getByRole('group', { name: 'Demand KPIs' });
    expect(group).toHaveClass('max-w-xl', 'rounded-surface');
    expect(group.className).toContain('[&>:first-child_[data-kpi-divider]]:hidden');
  });

  it('holds five tiles that share the width and can shrink', () => {
    render(
      <KpiStrip aria-label="Five">
        {['a', 'b', 'c', 'd', 'e'].map((label) => (
          <MetricItem key={label} label={label} value="1" />
        ))}
      </KpiStrip>,
    );
    const group = screen.getByRole('group', { name: 'Five' });
    expect(group.children).toHaveLength(5);
    Array.from(group.children).forEach((child) => expect(child).toHaveClass('flex-1', 'min-w-0'));
  });

  it('card variant renders a footer action row, but not inside an interactive item', () => {
    const { rerender } = render(<MetricItem variant="card" label="Views" value="2" footerAction={<a href="#r">View report</a>} />);
    expect(screen.getByRole('link', { name: 'View report' })).toBeInTheDocument();
    rerender(<MetricItem variant="card" label="Views" value="2" onClick={() => {}} footerAction={<a href="#r">View report</a>} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});


describe('KpiStrip wrapping and MetricItem slots', () => {
  it('wraps into two columns below md and stays a single bar from md', () => {
    render(
      <KpiStrip aria-label="KPIs">
        <MetricItem label="a" value="1" />
        <MetricItem label="b" value="2" />
        <MetricItem label="c" value="3" />
      </KpiStrip>,
    );
    expect(screen.getByRole('group', { name: 'KPIs' })).toHaveClass('grid', 'grid-cols-2', 'md:flex');
  });

  it('renders a caption under the value in every variant', () => {
    render(
      <>
        <MetricItem label="a" value="1" caption="Target 160 h" />
        <MetricItem variant="compact" label="b" value="2" caption="Cap compact" />
        <MetricItem variant="card" label="c" value="3" caption="Cap card" />
      </>,
    );
    expect(screen.getByText('Target 160 h')).toHaveClass('text-text-subtle');
    expect(screen.getByText('Cap compact')).toBeInTheDocument();
    expect(screen.getByText('Cap card')).toBeInTheDocument();
  });

  it('shows a decorative icon in strip and compact variants', () => {
    const { container } = render(
      <>
        <MetricItem label="a" value="1" icon={<svg data-testid="i1" />} />
        <MetricItem variant="compact" label="b" value="2" icon={<svg data-testid="i2" />} />
      </>,
    );
    expect(container.querySelectorAll('[aria-hidden="true"] > svg')).toHaveLength(2);
  });

  it('tightens card padding with density compact', () => {
    const { container, rerender } = render(<MetricItem variant="card" label="a" value="1" />);
    expect(container.firstElementChild).toHaveClass('p-6');
    rerender(<MetricItem variant="card" density="compact" label="a" value="1" />);
    expect(container.firstElementChild).toHaveClass('p-4');
    expect(container.firstElementChild).not.toHaveClass('p-6');
  });
});
