import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import { createRef } from 'react';

import { Progress } from './progress';

describe('Progress', () => {
  it('exposes progressbar semantics', () => {
    render(<Progress aria-label="Upload" value={40} />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar.querySelector('[data-progress-indicator]')).toHaveStyle({ width: '40%' });
  });

  it('clamps out-of-range values and honours max', () => {
    const { rerender } = render(<Progress aria-label="p" value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<Progress aria-label="p" value={-5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    rerender(<Progress aria-label="p" value={5} max={20} />);
    expect(screen.getByRole('progressbar').querySelector('[data-progress-indicator]')).toHaveStyle({ width: '25%' });
  });

  it('is indeterminate without a value', () => {
    render(<Progress aria-label="Loading" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-state', 'indeterminate');
  });

  it('applies destructive variant and sizes', () => {
    render(<Progress aria-label="p" value={10} variant="destructive" size="sm" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveClass('h-1');
    expect(bar.querySelector('[data-progress-indicator]')).toHaveClass('bg-text-destructive');
  });

  it('forwards ref and className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Progress ref={ref} aria-label="p" value={1} className="custom" />);
    expect(ref.current).toHaveClass('custom');
  });

  it('renders success and warning tones', () => {
    const { rerender } = render(<Progress aria-label="p" value={10} variant="success" />);
    expect(screen.getByRole('progressbar').querySelector('[data-progress-indicator]')).toHaveClass('bg-text-success');
    rerender(<Progress aria-label="p" value={10} variant="warning" />);
    expect(screen.getByRole('progressbar').querySelector('[data-progress-indicator]')).toHaveClass('bg-text-warning');
  });

  it('stacks segments and reports their sum', () => {
    render(
      <Progress
        aria-label="Capacity"
        segments={[
          { value: 30, tone: 'success', label: 'Done' },
          { value: 20, tone: 'warning', label: 'Review' },
        ]}
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Capacity' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', 'Done 30, Review 20');
    const parts = bar.querySelectorAll('[data-progress-segment]');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveClass('bg-text-success');
    expect(parts[1]).toHaveClass('bg-text-warning');
    expect(parts[0]).toHaveStyle({ width: '30%' });
  });

  it('clamps stacked segments to the maximum', () => {
    render(<Progress aria-label="p" segments={[{ value: 80 }, { value: 80 }]} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Progress segment colour (0.15)', () => {
  it('applies a bg- token utility instead of the tone class and keeps the aria', () => {
    render(
      <Progress
        aria-label="Budget"
        segments={[
          { value: 30, color: 'bg-data-project-1', label: 'Alpha' },
          { value: 20, tone: 'success', label: 'Beta' },
        ]}
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Budget' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', 'Alpha 30, Beta 20');
    const [first, second] = bar.querySelectorAll('[data-progress-segment]');
    expect(first).toHaveClass('bg-data-project-1');
    expect(first).not.toHaveClass('bg-general-ring-default');
    expect(second).toHaveClass('bg-text-success');
  });

  it('applies a CSS colour as the background', () => {
    render(<Progress aria-label="Budget" segments={[{ value: 40, color: 'rgb(10, 20, 30)' }]} />);
    const seg = screen.getByRole('progressbar').querySelector('[data-progress-segment]') as HTMLElement;
    expect(seg.style.backgroundColor).toBe('rgb(10, 20, 30)');
    expect(seg.style.width).toBe('40%');
    expect(seg.className).not.toMatch(/bg-/);
  });
});
