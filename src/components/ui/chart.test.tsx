import { vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { ActivityGauge, ChartLegend, HBarList, Histogram, LineBarChart, PieChart, RadarChart, Sparkline, Treemap } from './chart';

const categories = ['Jan', 'Feb', 'Mar'];
const series = [
  { id: 'a', label: 'Active users', values: [10, 20, 30] },
  { id: 'b', label: 'Trials', values: [5, 5, 10] },
];

describe('LineBarChart', () => {
  it('exposes an accessible name, description and a data table alternative', () => {
    render(<LineBarChart title="Users per month" description="Active users grow each month." categories={categories} series={series} />);
    const img = screen.getByRole('img', { name: 'Users per month' });
    expect(img).toHaveAccessibleDescription('Active users grow each month.');
    const table = screen.getByRole('table', { hidden: true });
    expect(within(table).getAllByRole('row', { hidden: true })).toHaveLength(4);
    expect(within(table).getByRole('columnheader', { name: 'Active users', hidden: true })).toBeInTheDocument();
  });

  it('keeps the svg out of the accessibility tree and renders bars per series and category', () => {
    const { container } = render(<LineBarChart title="t" categories={categories} series={series} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('rect')).toHaveLength(6);
  });

  it('renders a line per series for type line', () => {
    const { container } = render(<LineBarChart title="t" type="line" categories={categories} series={series} />);
    expect(container.querySelectorAll('polyline')).toHaveLength(2);
    expect(container.querySelectorAll('circle')).toHaveLength(6);
  });

  it('stacks bars when stacked', () => {
    const { container } = render(<LineBarChart title="t" stacked categories={categories} series={series} />);
    const rects = Array.from(container.querySelectorAll('rect'));
    expect(new Set(rects.slice(0, 2).map((r) => r.getAttribute('x'))).size).toBe(1);
  });

  it('hides axes without axisLabels and shows legend on demand', () => {
    const { container } = render(<LineBarChart title="t" axisLabels={false} legend legendPosition="top" categories={categories} series={series} />);
    expect(container.querySelectorAll('text')).toHaveLength(0);
    expect(screen.getByRole('list', { name: 'Legend' })).toBeInTheDocument();
  });

  it('can show the table visibly', () => {
    render(<LineBarChart title="t" showTable categories={categories} series={series} />);
    expect(screen.getByRole('table')).not.toHaveClass('sr-only');
  });

  it('keeps the hidden data table in a clipped block so it cannot widen the page', () => {
    render(<LineBarChart title="t" categories={categories} series={series} />);
    const table = screen.getByRole('table', { hidden: true });
    expect(table).not.toHaveClass('sr-only');
    expect(table.parentElement).toHaveClass('sr-only');
    expect(screen.getByRole('figure')).toHaveClass('relative');
  });

  it('scrolls a visible data table on its own', () => {
    render(<LineBarChart title="t" showTable categories={categories} series={series} />);
    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto');
  });

  it('shows no tooltip by default', () => {
    const { container } = render(<LineBarChart title="t" categories={categories} series={series} />);
    expect(container.querySelector('[data-chart-hit]')).toBeNull();
    expect(container.querySelector('[data-chart-tooltip]')).toBeNull();
  });

  it('shows a tooltip for the category under the pointer, hides it on leave and Escape', async () => {
    const { container } = render(<LineBarChart title="t" tooltip categories={categories} series={series} />);
    const hits = container.querySelectorAll('[data-chart-hit]');
    expect(hits).toHaveLength(3);
    fireEvent.pointerEnter(hits[1]);
    const tip = container.querySelector('[data-chart-tooltip]') as HTMLElement;
    expect(tip).toHaveAttribute('aria-hidden', 'true');
    expect(tip).toHaveTextContent('Feb');
    expect(tip).toHaveTextContent('Active users');
    expect(tip).toHaveTextContent('20');
    expect(tip).toHaveStyle({ left: '0px' });
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[data-chart-tooltip]')).toBeNull();
    fireEvent.pointerEnter(hits[0]);
    expect(container.querySelector('[data-chart-tooltip]')).not.toBeNull();
    fireEvent.pointerLeave(hits[0].closest('div') as HTMLElement);
    expect(container.querySelector('[data-chart-tooltip]')).toBeNull();
  });

  it('renders loading, empty and error states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<LineBarChart title="t" state="loading" categories={categories} series={series} />);
    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
    rerender(<LineBarChart title="t" state="empty" categories={categories} series={series} />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    rerender(<LineBarChart title="t" state="error" onRetry={onRetry} categories={categories} series={series} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('PieChart', () => {
  it('renders slices, a legend with shares and a table', () => {
    const { container } = render(
      <PieChart title="Share" hole={0.6} slices={[{ id: 'a', label: 'A', value: 3 }, { id: 'b', label: 'B', value: 1 }]} />,
    );
    expect(container.querySelectorAll('path')).toHaveLength(2);
    expect(screen.getByText('A 75 %')).toBeInTheDocument();
    expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument();
  });

  it('renders a single full slice as a circle', () => {
    const { container } = render(<PieChart title="Share" hole={0} slices={[{ id: 'a', label: 'A', value: 3 }]} />);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});

describe('RadarChart', () => {
  it('renders one polygon per series plus grid rings', () => {
    const { container } = render(<RadarChart title="Radar" axes={['Mon', 'Tue', 'Wed']} series={series} rings={3} />);
    expect(container.querySelectorAll('polygon')).toHaveLength(3 + 2);
    expect(screen.getByRole('img', { name: 'Radar' })).toBeInTheDocument();
  });
});

describe('ActivityGauge', () => {
  it('is a labelled meter with clamped value', () => {
    render(<ActivityGauge aria-label="Activity" value={140} max={100} label="Active users" />);
    const meter = screen.getByRole('meter', { name: 'Activity' });
    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '100 of 100');
  });
});

describe('Pie sizes and gauge rings', () => {
  it.each([
    ['xxs', 120],
    ['xs', 160],
    ['sm', 200],
    ['md', 240],
    ['lg', 280],
  ] as const)('PieChart size %s is %ipx and defaults to a donut', (size, px) => {
    const { container } = render(<PieChart title="p" size={size} slices={[{ id: 'a', label: 'A', value: 1 }, { id: 'b', label: 'B', value: 1 }]} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', String(px));
    expect(container.querySelectorAll('path')[0].getAttribute('d')).toMatch(/L .* A /);
  });

  it('PieChart default size is sm 200 and a number is used as pixels', () => {
    const { container, rerender } = render(<PieChart title="p" slices={[{ id: 'a', label: 'A', value: 1 }]} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '200');
    rerender(<PieChart title="p" size={96} slices={[{ id: 'a', label: 'A', value: 1 }]} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '96');
  });

  it.each([
    ['xs', 160],
    ['sm', 200],
    ['md', 240],
    ['lg', 280],
  ] as const)('ActivityGauge size %s is %ipx', (size, px) => {
    const { container } = render(<ActivityGauge aria-label="g" size={size} value={50} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', String(px));
  });

  it('ActivityGauge defaults to xs 160 and draws one track plus one ring per series', () => {
    const { container } = render(<ActivityGauge aria-label="g" series={[{ id: 'a', label: 'A', value: 80 }, { id: 'b', label: 'B', value: 40 }, { id: 'c', label: 'C', value: 0 }]} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '160');
    expect(container.querySelectorAll('circle')).toHaveLength(3 + 2);
  });

  it('multi ring gauge is a group with a labelled meter per ring and an optional legend', () => {
    render(<ActivityGauge aria-label="Activity" legend="right" series={[{ id: 'a', label: 'Series 1', value: 80 }, { id: 'b', label: 'Series 2', value: 40 }]} />);
    expect(screen.getByRole('group', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Series 2' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveClass('flex-col');
  });

  it('shows the label and a custom value text', () => {
    render(<ActivityGauge aria-label="g" label="Active users" valueText="1,000" value={30} />);
    expect(screen.getByText('Active users')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });
});

describe('Sparkline, Histogram, HBarList, Treemap, Legend', () => {
  it('Sparkline is an image with a name', () => {
    render(<Sparkline aria-label="Trend, rising" values={[1, 3, 2, 5]} />);
    expect(screen.getByRole('img', { name: 'Trend, rising' })).toBeInTheDocument();
  });

  it('Histogram highlights a range', () => {
    const { container } = render(<Histogram title="Scores" highlight={[1, 2]} bins={[{ label: '0', value: 1 }, { value: 4 }, { value: 5 }, { label: '100', value: 1 }]} />);
    const rects = container.querySelectorAll('rect');
    expect(rects[1].getAttribute('class')).toContain('text-chart-brand');
    expect(rects[0].getAttribute('class')).toContain('text-chart-neutral');
  });

  it('HBarList renders value labels in both layouts', () => {
    const items = [{ id: 'a', label: 'Figma', value: 3, valueLabel: '3 proj.' }, { id: 'b', label: 'Design', value: 1 }];
    const { rerender } = render(<HBarList aria-label="Skills" items={items} />);
    expect(screen.getByRole('list', { name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByText('3 proj.')).toBeInTheDocument();
    rerender(<HBarList aria-label="Skills" layout="stacked" items={items} />);
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-layout', 'stacked');
  });

  it('Treemap sizes cells by value and hides labels on tiny cells', () => {
    render(<Treemap title="Skills" items={[{ id: 'a', label: 'Frontend', value: 96 }, { id: 'b', label: 'Tiny', value: 1 }]} />);
    expect(screen.getByTitle('Frontend 96')).toBeInTheDocument();
    expect(within(screen.getByTitle('Tiny 1')).queryByText('Tiny')).toBeNull();
    expect(screen.getByTitle('Tiny 1')).toBeInTheDocument();
  });

  it('Legend supports a column layout', () => {
    render(<ChartLegend layout="column" items={[{ id: 'a', label: 'A' }]} />);
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveClass('flex-col');
  });
});

describe('ChartLegend warning tone and custom colours', () => {
  it('renders the warning tone', () => {
    const { container } = render(<ChartLegend items={[{ id: 'w', label: 'At risk', tone: 'warning' }]} />);
    expect(container.querySelector('li span')).toHaveClass('bg-chart-warning');
  });

  it('renders a token utility or a CSS colour for custom items and prefers it over the tone', () => {
    const { container } = render(
      <ChartLegend
        items={[
          { id: 'a', label: 'A', tone: 'success', color: 'bg-data-project-3' },
          { id: 'b', label: 'B', color: 'rgb(1, 2, 3)' },
        ]}
      />,
    );
    const swatches = container.querySelectorAll('[data-legend-swatch]');
    expect(swatches[0]).toHaveClass('bg-data-project-3');
    expect(swatches[0]).not.toHaveClass('bg-chart-success');
    expect(swatches[1]).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });
});

describe('HBarList segments', () => {
  const items = [
    { id: 'a', label: 'Web', value: 0, segments: [{ id: 'open', label: 'Open', value: 2, tone: 'neutral' as const }, { id: 'done', label: 'Done', value: 6, tone: 'success' as const }] },
    { id: 'b', label: 'App', value: 0, segments: [{ id: 'open', label: 'Open', value: 4, tone: 'neutral' as const }, { id: 'done', label: 'Done', value: 4, tone: 'success' as const }] },
  ];

  it('stacks segments per row, sums the total and lists each part for assistive tech', () => {
    const { container } = render(<HBarList aria-label="Tasks" items={items} />);
    const rows = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('data-layout'));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('8');
    expect(rows[0]).toHaveTextContent('Open: 2, Done: 6');
    const segs = container.querySelectorAll('[data-segmented] [data-segment]');
    expect(segs).toHaveLength(4);
    expect(segs[0]).toHaveClass('bg-chart-neutral');
    expect(segs[1]).toHaveClass('bg-chart-success');
    expect(segs[1]).toHaveStyle({ width: '75%' });
  });

  it('shows one legend entry per segment id and can hide it', () => {
    const { rerender } = render(<HBarList aria-label="Tasks" items={items} />);
    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(2);
    rerender(<HBarList aria-label="Tasks" items={items} legend={false} />);
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();
  });

  it('keeps plain rows unchanged', () => {
    const { container } = render(<HBarList aria-label="Plain" items={[{ id: 'a', label: 'A', value: 3 }]} />);
    expect(container.querySelector('[data-segmented]')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();
  });

  it('HBarList lists 12 rows with 8 legend entries and keeps the legend wrapping', () => {
    const segs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    render(
      <HBarList
        aria-label="Deals"
        items={Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, label: `Row ${i}`, value: 0, segments: segs.map((id, si) => ({ id, label: `Seg ${id}`, value: si + 1 })) }))}
      />,
    );
    expect(screen.getAllByRole('listitem').length).toBe(12 + 8);
    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend.children).toHaveLength(8);
    expect(legend).toHaveClass('flex-wrap');
  });

  it('LineBarChart colours bars per data point and labels values above them', () => {
    const { container } = render(
      <LineBarChart
        title="Hours"
        categories={['A', 'B', 'C']}
        series={[{ id: 's', label: 'Hours', values: [10, 20, 30], tone: 1, pointTones: [undefined, 3], pointColors: [undefined, undefined, 'var(--colors-data-project-3)'] }]}
        showValues
      />,
    );
    const bars = container.querySelectorAll('rect[data-bar]');
    expect(bars[0].getAttribute('class')).toContain('text-chart-1');
    expect(bars[1].getAttribute('class')).toContain('text-chart-3');
    expect((bars[2] as SVGElement).style.fill).toBe('var(--colors-data-project-3)');
    const labels = Array.from(container.querySelectorAll('text[data-bar-value]')).map((n) => n.textContent);
    expect(labels).toEqual(['10', '20', '30']);
  });

  it('LineBarChart stacked value labels show the column total once', () => {
    const { container } = render(
      <LineBarChart title="T" stacked showValues categories={['A', 'B']} series={[{ id: 'a', label: 'A', values: [1, 2] }, { id: 'b', label: 'B', values: [3, 4] }]} />,
    );
    expect(Array.from(container.querySelectorAll('text[data-bar-value]')).map((n) => n.textContent)).toEqual(['4', '6']);
  });

  it('LineBarChart shows no value labels by default', () => {
    const { container } = render(<LineBarChart title="T" categories={['A']} series={[{ id: 'a', label: 'A', values: [1] }]} />);
    expect(container.querySelector('text[data-bar-value]')).toBeNull();
  });
});

describe('HBarList stacked layout', () => {
  it('keeps the bar out of the flex main axis so it cannot collapse to zero height', () => {
    // jsdom has no layout: the real height is asserted in the HBarsStacked story (play function, real browser).
    const items = [
      { id: 'a', label: 'A', value: 3 },
      { id: 'b', label: 'B', value: 0, segments: [{ id: 'x', label: 'X', value: 2 }, { id: 'y', label: 'Y', value: 1 }] },
    ];
    const { container } = render(<HBarList aria-label="Skills" layout="stacked" items={items} />);
    container.querySelectorAll('ul[aria-label="Skills"] > li > span[aria-hidden="true"]').forEach((bar) => {
      expect(bar).toHaveClass('h-2', 'w-full', 'shrink-0');
      expect(bar).not.toHaveClass('flex-1');
    });
  });

  it('inline layout still lets the bar fill the row', () => {
    const { container } = render(<HBarList aria-label="Skills" items={[{ id: 'a', label: 'A', value: 3 }]} />);
    expect(container.querySelector('ul[aria-label="Skills"] > li > span[aria-hidden="true"]')).toHaveClass('flex-1');
  });
});

describe('LineBarChart wrapped labels and derived values', () => {
  const long = ['Organic search traffic', 'Paid social campaigns'];
  const rate = { key: 'rate', label: 'Conversion', compute: (d: { values: Record<string, number> }) => (d.values.visits ? d.values.signups / d.values.visits : null), format: (v: number) => `${Math.round(v * 100)}%` };
  const funnel = [
    { id: 'visits', label: 'Visits', values: [200, 100] },
    { id: 'signups', label: 'Signups', values: [50, 10] },
  ];

  it('wraps long category labels into tspans and grows the bottom margin', () => {
    const { container, rerender } = render(<LineBarChart title="Funnel" categories={long} series={funnel} width={300} />);
    const plain = container.querySelectorAll('[data-axis-label]')[0];
    expect(plain.querySelectorAll('tspan')).toHaveLength(1);
    rerender(<LineBarChart title="Funnel" categories={long} series={funnel} width={300} wrapLabels />);
    const wrapped = container.querySelectorAll('[data-axis-label]')[0];
    expect(wrapped.querySelectorAll('tspan').length).toBeGreaterThan(1);
    expect(wrapped.textContent?.replace(/\u2026/g, '')).toContain('Organic');
  });

  it('limits wrapped labels to labelMaxLines with an ellipsis', () => {
    const { container } = render(<LineBarChart title="Funnel" categories={['aaa bbb ccc ddd eee fff ggg hhh']} series={funnel} width={200} wrapLabels labelMaxWidth={50} labelMaxLines={2} />);
    const tspans = container.querySelectorAll('[data-axis-label] tspan');
    expect(tspans).toHaveLength(2);
    expect(tspans[1].textContent).toContain('\u2026');
  });

  it('adds the derived value to the data table', () => {
    render(<LineBarChart title="Funnel" categories={long} series={funnel} derived={rate} />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Conversion' })).toBeInTheDocument();
    expect(within(table).getByText('25%')).toBeInTheDocument();
    expect(within(table).getByText('10%')).toBeInTheDocument();
  });

  it('shows the derived value in the tooltip', () => {
    const { container } = render(<LineBarChart title="Funnel" categories={long} series={funnel} tooltip derived={rate} />);
    fireEvent.pointerEnter(container.querySelector('[data-chart-hit]') as Element);
    const tip = container.querySelector('[data-chart-tooltip]') as HTMLElement;
    expect(within(tip).getByText('Conversion')).toBeInTheDocument();
    expect(within(tip).getByText('25%')).toBeInTheDocument();
  });

  it('shows a dash when the derived value is missing', () => {
    render(<LineBarChart title="Funnel" categories={['A']} series={[{ id: 'visits', label: 'Visits', values: [0] }, { id: 'signups', label: 'Signups', values: [0] }]} derived={rate} />);
    expect(within(screen.getByRole('table')).getByText('\u2013')).toBeInTheDocument();
  });
});

describe('LineBarChart fluid width and category label (0.20)', () => {
  let observers: { cb: ResizeObserverCallback; el: Element }[] = [];
  let boxWidth = 0;
  beforeEach(() => {
    observers = [];
    boxWidth = 390;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        cb: ResizeObserverCallback;
        constructor(cb: ResizeObserverCallback) {
          this.cb = cb;
        }
        observe(el: Element) {
          observers.push({ cb: this.cb, el });
        }
        unobserve() {}
        disconnect() {
          observers = observers.filter((o) => o.cb !== this.cb);
        }
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => boxWidth);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the fixed width by default', () => {
    const { container } = render(<LineBarChart title="t" categories={categories} series={series} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toHaveAttribute('width', '600');
    expect(svg).toHaveAttribute('viewBox', '0 0 600 240');
    expect(observers).toHaveLength(0);
  });

  it('draws at the measured pixel width with width="auto" so the axis text is not scaled by the viewBox', () => {
    const { container } = render(<LineBarChart title="t" width="auto" categories={categories} series={series} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toHaveAttribute('width', '390');
    expect(svg).toHaveAttribute('viewBox', '0 0 390 240');
    expect(container.querySelector('[data-chart-fluid]')).toBeInTheDocument();
  });

  it('follows the container when it is resized and stops observing on unmount', () => {
    const { container, unmount } = render(<LineBarChart title="t" width="auto" categories={categories} series={series} />);
    expect(observers).toHaveLength(1);
    act(() => observers[0].cb([{ contentRect: { width: 720 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(container.querySelector('svg')).toHaveAttribute('width', '720');
    act(() => observers[0].cb([{ contentRect: { width: 20 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(container.querySelector('svg')).toHaveAttribute('width', '120');
    unmount();
    expect(observers).toHaveLength(0);
  });

  it('measures a container that mounts after a loading state and keeps following it (0.21)', () => {
    const { container, rerender } = render(<LineBarChart title="t" width="auto" state="loading" categories={categories} series={series} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(observers).toHaveLength(0);
    boxWidth = 480;
    rerender(<LineBarChart title="t" width="auto" state="default" categories={categories} series={series} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '480');
    expect(observers).toHaveLength(1);
    act(() => observers[0].cb([{ contentRect: { width: 700 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(container.querySelector('svg')).toHaveAttribute('width', '700');
    // Back to an empty state and to data again: the new container is observed, the old observer is gone.
    rerender(<LineBarChart title="t" width="auto" state="empty" categories={categories} series={series} />);
    expect(observers).toHaveLength(0);
    boxWidth = 520;
    rerender(<LineBarChart title="t" width="auto" state="default" categories={categories} series={series} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '520');
    expect(observers).toHaveLength(1);
  });

  it('falls back to 600 where nothing can be measured', () => {
    boxWidth = 0;
    const { container } = render(<LineBarChart title="t" width="auto" categories={categories} series={series} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '600');
  });

  it('names the first column of the data table with categoryLabel and defaults to the localized label', () => {
    const { rerender } = render(<LineBarChart title="t" categories={categories} series={series} />);
    expect(within(screen.getByRole('table', { hidden: true })).getByRole('columnheader', { name: 'Category', hidden: true })).toBeInTheDocument();
    rerender(<LineBarChart title="t" categoryLabel="Week" categories={categories} series={series} />);
    const table = screen.getByRole('table', { hidden: true });
    expect(within(table).getByRole('columnheader', { name: 'Week', hidden: true })).toBeInTheDocument();
    expect(within(table).queryByRole('columnheader', { name: 'Category', hidden: true })).toBeNull();
  });
});
