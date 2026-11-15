'use client';

import { BarChart3 } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';

import { overlaySurface } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { DataStatePanel, SkeletonBar } from './data-state-panel';
import { useLabels, useLocale, usePreset, type DesignSystemLocale } from './labels-context';
import { skillCategoryFill, type SkillCategory } from './skill-category';

// Tones
// 1 to 8 are the categorical palette, brand and the status roles colour series, and guideline (ideal line), projection, absence (hatch) and non-working (edge and hatch of non-working days, its fill is `bg-chart-subtle-non-working`) are the planning roles of kette-tokens 5.28.0. The planning roles hold 3:1 as lines and hatches; they carry no label colour, so text on them uses the default text role.

// Full class strings so Tailwind's content scan finds every chart token.
const toneText = {
  1: 'text-chart-1',
  2: 'text-chart-2',
  3: 'text-chart-3',
  4: 'text-chart-4',
  5: 'text-chart-5',
  6: 'text-chart-6',
  7: 'text-chart-7',
  8: 'text-chart-8',
  brand: 'text-chart-brand',
  'brand-1': 'text-chart-brand-1',
  'brand-2': 'text-chart-brand-2',
  'brand-3': 'text-chart-brand-3',
  'brand-4': 'text-chart-brand-4',
  'brand-5': 'text-chart-brand-5',
  'brand-6': 'text-chart-brand-6',
  'brand-7': 'text-chart-brand-7',
  neutral: 'text-chart-neutral',
  success: 'text-chart-success',
  destructive: 'text-chart-destructive',
  warning: 'text-text-warning',
  guideline: 'text-chart-guideline',
  projection: 'text-chart-projection',
  absence: 'text-chart-absence',
  'non-working': 'text-chart-non-working',
} as const;

const toneStroke = {
  1: 'stroke-chart-1',
  2: 'stroke-chart-2',
  3: 'stroke-chart-3',
  4: 'stroke-chart-4',
  5: 'stroke-chart-5',
  6: 'stroke-chart-6',
  7: 'stroke-chart-7',
  8: 'stroke-chart-8',
  brand: 'stroke-chart-brand',
  'brand-1': 'stroke-chart-brand-1',
  'brand-2': 'stroke-chart-brand-2',
  'brand-3': 'stroke-chart-brand-3',
  'brand-4': 'stroke-chart-brand-4',
  'brand-5': 'stroke-chart-brand-5',
  'brand-6': 'stroke-chart-brand-6',
  'brand-7': 'stroke-chart-brand-7',
  neutral: 'stroke-chart-neutral',
  success: 'stroke-chart-success',
  destructive: 'stroke-chart-destructive',
  warning: 'stroke-text-warning',
  guideline: 'stroke-chart-guideline',
  projection: 'stroke-chart-projection',
  absence: 'stroke-chart-absence',
  'non-working': 'stroke-chart-non-working',
} as const;

const toneBg = {
  1: 'bg-chart-1',
  2: 'bg-chart-2',
  3: 'bg-chart-3',
  4: 'bg-chart-4',
  5: 'bg-chart-5',
  6: 'bg-chart-6',
  7: 'bg-chart-7',
  8: 'bg-chart-8',
  brand: 'bg-chart-brand',
  'brand-1': 'bg-chart-brand-1',
  'brand-2': 'bg-chart-brand-2',
  'brand-3': 'bg-chart-brand-3',
  'brand-4': 'bg-chart-brand-4',
  'brand-5': 'bg-chart-brand-5',
  'brand-6': 'bg-chart-brand-6',
  'brand-7': 'bg-chart-brand-7',
  neutral: 'bg-chart-neutral',
  success: 'bg-chart-success',
  destructive: 'bg-chart-destructive',
  warning: 'bg-chart-warning',
  guideline: 'bg-chart-guideline',
  projection: 'bg-chart-projection',
  absence: 'bg-chart-absence',
  'non-working': 'bg-chart-subtle-non-working',
} as const;

// Label colour for text drawn on a chart fill (the `-on` roles of the chart tokens), keyed like toneBg.
const toneOn = {
  1: 'text-chart-1-on',
  2: 'text-chart-2-on',
  3: 'text-chart-3-on',
  4: 'text-chart-4-on',
  5: 'text-chart-5-on',
  6: 'text-chart-6-on',
  7: 'text-chart-7-on',
  8: 'text-chart-8-on',
  brand: 'text-chart-brand-on',
  'brand-1': 'text-chart-brand-1-on',
  'brand-2': 'text-chart-brand-2-on',
  'brand-3': 'text-chart-brand-3-on',
  'brand-4': 'text-chart-brand-4-on',
  'brand-5': 'text-chart-brand-5-on',
  'brand-6': 'text-chart-brand-6-on',
  'brand-7': 'text-chart-brand-7-on',
  neutral: 'text-chart-neutral-on',
  success: 'text-chart-success-on',
  destructive: 'text-chart-destructive-on',
  warning: 'text-chart-warning-on',
  guideline: 'text-text-default',
  projection: 'text-text-default',
  absence: 'text-text-default',
  'non-working': 'text-text-default',
} as const;

// Label colour for a custom `bg-*` fill: the project tiles have their own `-on` role, anything else keeps the on-brand label.
const customOn: Record<string, string> = {
  'bg-data-project-1': 'text-data-project-1-on',
  'bg-data-project-2': 'text-data-project-2-on',
  'bg-data-project-3': 'text-data-project-3-on',
  'bg-data-project-4': 'text-data-project-4-on',
  'bg-data-project-5': 'text-data-project-5-on',
  'bg-data-project-6': 'text-data-project-6-on',
  'bg-data-project-7': 'text-data-project-7-on',
  'bg-data-project-8': 'text-data-project-8-on',
};

export type ChartTone = keyof typeof toneText;

// Corner radius of the zero bars, the `borderRadius/tight` token (4). SVG geometry cannot read the CSS variable.
const BAR_TOP_RADIUS = 4;

// Rectangle with only the top corners rounded.
const topRoundedPath = (x: number, y: number, w: number, h: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, w / 2, h));
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

const cycle: ChartTone[] = [1, 2, 3, 4, 5, 6, 7, 8];
const toneAt = (i: number): ChartTone => cycle[i % cycle.length];

// Line style of a series. Colour is never the only cue (WCAG 1.4.1): the ideal line (guideline) is dashed and the projection dotted unless the series sets its own style.
export type ChartLineStyle = 'solid' | 'dashed' | 'dotted';
const lineStyleOf = (tone: ChartTone | undefined, line?: ChartLineStyle): ChartLineStyle => line ?? (tone === 'guideline' ? 'dashed' : tone === 'projection' ? 'dotted' : 'solid');
const DASH: Record<ChartLineStyle, string | undefined> = { solid: undefined, dashed: '6 4', dotted: '1 5' };
// Absence and non-working days are drawn as hatching, not as a flat fill.
const isHatched = (tone: ChartTone | undefined): tone is 'absence' | 'non-working' => tone === 'absence' || tone === 'non-working';

// Hatch pattern of the two hatched roles. Lives in the svg `defs`; the pattern element carries the tone colour, because `currentColor` inside a pattern resolves from the pattern, not from the shape that uses it.
const HatchPattern = ({ id, tone }: { id: string; tone: 'absence' | 'non-working' }) => (
  <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)" className={toneText[tone]}>
    {tone === 'non-working' ? <rect width={6} height={6} className="fill-chart-subtle-non-working" /> : null}
    <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2} />
  </pattern>
);

// Legend key: a short line in the line style, a hatched square for the hatched roles, otherwise the filled swatch.
const LegendKey = ({ tone, line, swatch }: { tone: ChartTone; line?: ChartLineStyle; swatch: string }) => {
  const id = useId();
  const style = lineStyleOf(tone, line);
  if (style !== 'solid') {
    return (
      <svg aria-hidden="true" width={20} height={8} viewBox="0 0 20 8" focusable="false" className={cn('shrink-0', toneText[tone])}>
        <line x1={1} y1={4} x2={19} y2={4} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeDasharray={DASH[style]} />
      </svg>
    );
  }
  if (isHatched(tone)) {
    return (
      <svg aria-hidden="true" width={12} height={12} viewBox="0 0 12 12" focusable="false" className="shrink-0">
        <defs>
          <HatchPattern id={id} tone={tone} />
        </defs>
        <rect width={12} height={12} fill={`url(#${id})`} className={cn(toneText[tone], 'stroke-current')} strokeWidth={1} />
      </svg>
    );
  }
  return <span aria-hidden="true" className={cn('shrink-0', swatch, toneBg[tone])} />;
};

// Legend

export interface ChartLegendItem {
  id: string;
  label: ReactNode;
  tone?: ChartTone;
  // Line style of the key. Defaults to the style of the tone (guideline dashed, projection dotted, otherwise solid).
  line?: ChartLineStyle;
  // Custom swatch colour (user data): a CSS colour such as `var(--colors-data-project-3)` or a token utility such as `bg-data-project-3`. Wins over `tone`.
  color?: string;
}

export interface ChartLegendProps extends HTMLAttributes<HTMLUListElement> {
  items: ChartLegendItem[];
  // Direction of the list: a row (top, bottom) or a column (right).
  layout?: 'row' | 'column';
}

const ChartLegend = forwardRef<HTMLUListElement, ChartLegendProps>(({ className, items, layout = 'row', ...props }, ref) => {
  const l = useLabels();
  const zero = usePreset() === 'zero';
  const swatch = zero ? 'h-swatch-sm w-swatch-sm rounded-hairline' : 'h-2 w-2 rounded-full';
  return (
  <ul
    ref={ref}
    aria-label={l.legend}
    className={cn('typography-text-small m-0 flex list-none p-0 text-text-subtle', layout === 'row' ? 'flex-row flex-wrap items-center gap-4' : 'flex-col gap-1', className)}
    {...props}
  >
    {items.map((item, i) => (
      <li key={item.id} className="flex items-center gap-2">
        {item.color ? (
          <span
            aria-hidden="true"
            data-legend-swatch=""
            className={cn('shrink-0', swatch, item.color.startsWith('bg-') ? item.color : 'bg-current')}
            style={item.color.startsWith('bg-') ? undefined : { backgroundColor: item.color }}
          />
        ) : (
          <LegendKey tone={item.tone ?? toneAt(i)} line={item.line} swatch={swatch} />
        )}
        <span>{item.label}</span>
      </li>
    ))}
  </ul>
  );
});
ChartLegend.displayName = 'ChartLegend';

// Frame (name, description, table alternative, states)

export interface ChartTable {
  caption?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ChartFrameProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  // Accessible name of the chart.
  title: string;
  // Short text summary, read after the name.
  description?: string;
  // Data table alternative. Rendered visually hidden unless `showTable` is set.
  table?: ChartTable;
  showTable?: boolean;
  legend?: ChartLegendItem[];
  legendPosition?: 'top' | 'right' | 'bottom';
  state?: 'default' | 'loading' | 'empty' | 'error';
  // The chart holds a keyboard focus target (LineBarChart with `tooltip`). The frame then has no role and no name of its own, because the children of an image are presentational and cannot hold focus: the focus target carries the name and the description.
  interactive?: boolean;
  // Id of the description paragraph, for a focus target that points `aria-describedby` at it. Defaults to a generated id.
  descriptionId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  loadingLabel?: string;
}

const ChartFrame = forwardRef<HTMLElement, ChartFrameProps>(
  (
    {
      className,
      title,
      description,
      table,
      showTable = false,
      legend,
      legendPosition = 'bottom',
      state = 'default',
      interactive = false,
      descriptionId,
      emptyTitle: emptyTitleProp,
      emptyDescription,
      errorTitle: errorTitleProp,
      errorDescription: errorDescriptionProp,
      onRetry,
      loadingLabel: loadingLabelProp,
      children,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const emptyTitle = emptyTitleProp ?? l.chartEmptyTitle;
    const errorTitle = errorTitleProp ?? l.chartErrorTitle;
    const errorDescription = errorDescriptionProp ?? l.chartErrorDescription;
    const loadingLabel = loadingLabelProp ?? l.chartLoading;
    const id = useId();
    const descId = description ? (descriptionId ?? `${id}-desc`) : undefined;
    const tableMarkup = table ? (
      <table className={cn('typography-text-extra-small w-full text-left')}>
        {table.caption ? <caption className={cn(showTable && 'pb-2 text-left text-muted-foreground')}>{table.caption}</caption> : null}
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} scope="col" className="py-1 pr-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) =>
                c === 0 ? (
                  <th key={c} scope="row" className="py-1 pr-3 font-normal">
                    {cell}
                  </th>
                ) : (
                  <td key={c} className="py-1 pr-3 tabular-nums">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    ) : null;
    // A bare `sr-only` table keeps its table layout and widens the page. The hidden variant sits in a clipped block, the visible one scrolls on its own.
    const tableNode = tableMarkup ? (
      showTable ? <div className="max-w-full overflow-x-auto">{tableMarkup}</div> : <div className="sr-only">{tableMarkup}</div>
    ) : null;

    const legendNode =
      legend && legend.length > 0 ? <ChartLegend items={legend} layout={legendPosition === 'right' ? 'column' : 'row'} /> : null;

    return (
      <figure ref={ref} aria-busy={state === 'loading' || undefined} className={cn('relative m-0 flex min-w-0 flex-col gap-3', className)} {...props}>
        {state === 'default' ? (
          <>
            {legendPosition === 'top' ? legendNode : null}
            <div className={cn('flex min-w-0 gap-4', legendPosition === 'right' ? 'flex-row items-center' : 'flex-col')}>
              <div {...(interactive ? null : { role: 'img', 'aria-label': title, 'aria-describedby': descId })} className="min-w-0 flex-1">
                {children}
              </div>
              {legendPosition === 'right' ? legendNode : null}
            </div>
            {description ? (
              <p id={descId} className="sr-only">
                {description}
              </p>
            ) : null}
            {legendPosition === 'bottom' ? legendNode : null}
            {tableNode}
          </>
        ) : null}
        {state === 'loading' ? (
          <div role="status" aria-label={loadingLabel} className="flex h-40 items-end gap-3">
            {[40, 70, 55, 85, 60, 75, 50].map((h, i) => (
              <SkeletonBar key={i} className="flex-1" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : null}
        {state === 'empty' ? (
          <DataStatePanel kind="empty" icon={<BarChart3 className="h-icon-md w-icon-md" />} title={emptyTitle} description={emptyDescription} />
        ) : null}
        {state === 'error' ? <DataStatePanel kind="error" title={errorTitle} description={errorDescription} onRetry={onRetry} /> : null}
      </figure>
    );
  },
);
ChartFrame.displayName = 'ChartFrame';

type FrameShared = Pick<
  ChartFrameProps,
  | 'title'
  | 'description'
  | 'showTable'
  | 'state'
  | 'onRetry'
  | 'emptyTitle'
  | 'emptyDescription'
  | 'errorTitle'
  | 'errorDescription'
  | 'loadingLabel'
  | 'legendPosition'
  | 'className'
>;

// Axis helpers

const niceMax = (max: number) => {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
};

// Whole-number axis for counts and hours: four steps of 1, 2 or 5 times a power of ten, never below 1.
const integerMax = (max: number) => {
  const raw = max / 4;
  if (raw <= 1) return 4;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp * 4;
};

const formatNumber = (n: number, locale: DesignSystemLocale) =>
  new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 }).format(n);

// Number formatter bound to the provider locale (English by default).
const useNumberFormat = () => {
  const locale = useLocale();
  return (n: number) => formatNumber(n, locale);
};

// Value formatter of a chart: `formatValue` wins, then `valueFormat` (Intl options in the provider locale, e.g. a currency), else the plain number format.
const useValueFormat = (formatValue?: (value: number) => string, valueFormat?: Intl.NumberFormatOptions) => {
  const locale = useLocale();
  const plain = useNumberFormat();
  const intl = useMemo(() => (valueFormat ? new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', valueFormat) : null), [locale, valueFormat]);
  if (formatValue) return formatValue;
  return intl ? (n: number) => intl.format(n) : plain;
};

// Line and bar chart

export interface ChartSeries {
  id: string;
  label: string;
  values: number[];
  tone?: ChartTone;
  // Line style of a line chart series: solid, dashed or dotted. Defaults to the style of the tone (guideline dashed, projection dotted, otherwise solid).
  line?: ChartLineStyle;
  // Per data point tone for bars (Figma Column chart, one colour per column). A missing entry falls back to the series tone.
  pointTones?: (ChartTone | undefined)[];
  // Per data point CSS colour for bars, for user data such as `var(--colors-data-project-3)`. Wins over `pointTones`.
  pointColors?: (string | undefined)[];
}

// One category of a LineBarChart as handed to `derived.compute`.
export interface ChartDatum {
  index: number;
  category: string;
  // Value of every series at this category, by series id.
  values: Record<string, number>;
  // Sum of all series at this category.
  total: number;
}

// A value computed from the data of a category, e.g. a conversion rate. It is shown as a tooltip row and as a column of the data table.
export interface ChartDerived {
  key: string;
  label: string;
  compute: (datum: ChartDatum) => number | null | undefined;
  // Formats the computed value. Defaults to the locale number format.
  format?: (value: number) => string;
}

// Approximate glyph width of the axis text in SVG units, used to wrap long category labels without measuring the DOM.
const AXIS_CHAR_WIDTH = 6.5;
const AXIS_LINE_HEIGHT = 14;

// Splits a label into lines of at most `maxChars` characters, breaking at spaces and inside words that are too long. The last line ends with an ellipsis when text is left over.
const wrapAxisLabel = (label: string, maxChars: number, maxLines: number): string[] => {
  const limit = Math.max(1, maxChars);
  const lines: string[] = [];
  let line = '';
  const push = () => {
    if (line) lines.push(line);
    line = '';
  };
  label
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      let rest = word;
      while (rest.length > limit) {
        if (line) push();
        lines.push(rest.slice(0, limit));
        rest = rest.slice(limit);
      }
      if (!line) line = rest;
      else if (line.length + 1 + rest.length <= limit) line = `${line} ${rest}`;
      else {
        push();
        line = rest;
      }
    });
  push();
  if (lines.length <= maxLines) return lines.length ? lines : [label];
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] = `${last.length >= limit ? last.slice(0, Math.max(0, limit - 1)) : last}\u2026`;
  return kept;
};

// Narrowest a fluid chart renders, so a collapsed container does not produce a negative plot.
const FLUID_MIN_WIDTH = 120;

// Pixel width of a container, kept up to date with a ResizeObserver. The node arrives through a callback ref, so a container that mounts later (after a loading or empty state) is measured as soon as it exists. Null while disabled or before the first measurement (and where the DOM has no layout, e.g. jsdom).
const useContainerWidth = (enabled: boolean) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!enabled || !node) {
      setMeasured(null);
      return undefined;
    }
    const apply = (px: number) => {
      if (px <= 0) return;
      const next = Math.max(FLUID_MIN_WIDTH, Math.floor(px));
      setMeasured((prev) => (prev === next ? prev : next));
    };
    apply(node.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) apply(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, enabled]);
  return [setNode, enabled ? measured : null] as const;
};

export interface LineBarChartProps extends FrameShared {
  type?: 'line' | 'bar';
  categories: string[];
  series: ChartSeries[];
  // Stack bar series (Bar zero style).
  stacked?: boolean;
  axisLabels?: boolean;
  xTitle?: string;
  yTitle?: string;
  legend?: boolean;
  // Chart width in px (the svg still shrinks with its container through the viewBox). 'auto' measures the container with a ResizeObserver and draws at the real pixel width, so the axis text keeps its token size at any width. `width` is the fallback until measured: 'auto' uses 600.
  width?: number | 'auto';
  height?: number;
  // First column header of the data table alternative. Defaults to the localized "Category".
  categoryLabel?: string;
  // Pointer tooltip with the values of the category under the pointer. Stays inside the chart, Escape hides it. The data table remains the assistive tech alternative.
  // The plot is also a keyboard focus target: Tab reaches it, the left and right arrow keys (Home and End) move between the categories, the tooltip follows and the values are read in a polite live region. Escape or leaving the plot hides the tooltip.
  tooltip?: boolean;
  // Value label above each vertical bar (above the total on stacked bars).
  showValues?: boolean;
  // Intl number options for the values: value labels and totals above the bars, tooltip, live region and data table. Money: `{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }` gives "1.500 €" (de) and "€1,500" (en). The axis ticks keep the plain number format, name the unit in `yTitle`.
  valueFormat?: Intl.NumberFormatOptions;
  // Formats every value shown for a data point, wins over `valueFormat`. Same places, the axis ticks excluded.
  formatValue?: (value: number) => string;
  // Wraps long category labels onto several lines instead of letting them overlap. The plot gives up the room the extra lines need.
  wrapLabels?: boolean;
  // Widest a wrapped label may get, in chart units. Defaults to the width of one category band.
  labelMaxWidth?: number;
  // Line limit of a wrapped label. The last line ends with an ellipsis when text is cut. Default 3.
  labelMaxLines?: number;
  // Values computed per category, for example a conversion rate. Each one is a row in the tooltip and a column in the data table.
  derived?: ChartDerived | ChartDerived[];
  // Whole-number y-axis for counts and hours: the four steps are 1, 2 or 5 times a power of ten (0 1 2 3 4, 0 5 10 15 20) instead of quarters of a nice maximum.
  integerTicks?: boolean;
}

// Hover tooltip of a LineBarChart. It measures itself and clamps into the chart box so it never overflows.
const ChartTooltip = ({ title, rows, anchor, scale, containerRef }: { title: string; rows: { id: string; label: string; value: string; tone?: ChartTone }[]; anchor: number; scale: number; containerRef: RefObject<HTMLDivElement> }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);
  useLayoutEffect(() => {
    const box = containerRef.current?.clientWidth ?? 0;
    const tip = ref.current?.offsetWidth ?? 0;
    const px = anchor * scale;
    const gap = 8;
    const preferred = px + gap + tip > box ? px - gap - tip : px + gap;
    setLeft(Math.max(0, Math.min(preferred, Math.max(0, box - tip))));
  }, [anchor, scale, rows.length, title, containerRef]);
  return (
    <div
      ref={ref}
      data-chart-tooltip=""
      aria-hidden="true"
      style={{ left }}
      className={cn('pointer-events-none absolute top-0 z-raised flex max-w-full flex-col gap-1 px-3 py-2 typography-text-extra-small', overlaySurface)}
    >
      <span className="truncate font-medium text-text-default">{title}</span>
      {rows.map((row) => (
        <span key={row.id} data-derived={row.tone ? undefined : ''} className={cn('flex items-center gap-2 text-text-subtle', !row.tone && 'border-t border-solid border-border-subtle pt-1')}>
          {row.tone ? <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', toneBg[row.tone])} /> : null}
          <span className="min-w-0 flex-1 truncate">{row.label}</span>
          <span className="tabular-nums text-text-default">{row.value}</span>
        </span>
      ))}
    </div>
  );
};

const LineBarChart = forwardRef<HTMLElement, LineBarChartProps>(
  (
    { type = 'bar', categories, series, stacked = false, axisLabels = true, xTitle, yTitle, legend = false, legendPosition = 'bottom', width: widthProp = 600, height = 240, categoryLabel, tooltip = false, showValues: showValuesProp, valueFormat, formatValue, wrapLabels = false, labelMaxWidth, labelMaxLines = 3, derived, integerTicks = false, ...frame },
    ref,
  ) => {
    const l = useLabels();
    const zero = usePreset() === 'zero';
    // Zero: 11px axis text in the subtle colour, value labels above the bars, bars rounded on top.
    const axisText = zero ? 'typography-kpi-label fill-current text-text-subtle' : 'typography-text-extra-small fill-current text-muted-foreground';
    const valueText = zero ? 'typography-kpi-label-strong fill-current text-text-default' : 'typography-text-extra-small fill-current text-muted-foreground';
    const format = useNumberFormat();
    const formatPoint = useValueFormat(formatValue, valueFormat);
    const fluid = widthProp === 'auto';
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [measureRef, measuredWidth] = useContainerWidth(fluid);
    const setWrap = useCallback(
      (node: HTMLDivElement | null) => {
        wrapRef.current = node;
        measureRef(node);
      },
      [measureRef],
    );
    const width = fluid ? (measuredWidth ?? 600) : widthProp;
    const showValues = showValuesProp ?? (zero && type === 'bar');
    const stackedBars = stacked && type === 'bar';
    const totals = categories.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
    const rawMax = stackedBars ? Math.max(0, ...totals) : Math.max(0, ...series.flatMap((s) => s.values));
    const max = integerTicks ? integerMax(rawMax) : niceMax(rawMax);
    const ticks = [0, 1, 2, 3, 4].map((t) => (max / 4) * t);
    // The y-axis gutter grows with the widest tick label (8px gap to the plot, 8px to the edge), never below the 40px default.
    const widestTick = axisLabels ? Math.max(...ticks.map((t) => format(t).length)) * AXIS_CHAR_WIDTH : 0;
    const gutter = Math.max(40, Math.ceil(widestTick) + 16);
    const left = axisLabels ? (yTitle ? gutter + 16 : gutter) : 8;
    // Room above the tallest bar for the value labels.
    const top = showValues && type === 'bar' ? 20 : 8;
    const right = 8;
    const plotW = width - left - right;
    const band = plotW / Math.max(1, categories.length);
    const labelLines = axisLabels
      ? categories.map((c) => (wrapLabels ? wrapAxisLabel(c, Math.floor(((labelMaxWidth ?? band) - 4) / AXIS_CHAR_WIDTH), Math.max(1, labelMaxLines)) : [c]))
      : [];
    const extraLabelRows = Math.max(0, ...labelLines.map((lines) => lines.length - 1));
    const bottom = (axisLabels ? (xTitle ? 44 : 24) : 8) + extraLabelRows * AXIS_LINE_HEIGHT;
    const plotH = height - top - bottom;
    const y = (v: number) => top + plotH - (v / max) * plotH;
    const x = (i: number) => left + band * i + band / 2;
    const barGroupW = band * 0.6;

    const toneOf = (s: ChartSeries, i: number): ChartTone => s.tone ?? toneAt(i);
    const hatchTones = (['absence', 'non-working'] as const).filter((tone) => series.some((s, si) => toneOf(s, si) === tone || (s.pointTones ?? []).includes(tone)));
    const [active, setActive] = useState<number | null>(null);
    // True while the keyboard drives the tooltip: only then the values are announced and the focus band is drawn.
    const [keyboardActive, setKeyboardActive] = useState(false);
    const hintId = useId();
    const descId = useId();
    const hatchId = useId();
    // Last category the keyboard visited: after Escape the next arrow key continues from there.
    const lastRef = useRef<number | null>(null);
    const [scale, setScale] = useState(1);
    useEffect(() => {
      if (active === null) return undefined;
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setActive(null);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [active]);
    const show = (i: number) => {
      const box = wrapRef.current?.clientWidth;
      setScale(box ? Math.min(1, box / width) : 1);
      lastRef.current = i;
      setActive(i);
    };
    const keyboardMove = (next: number) => {
      const clamped = Math.max(0, Math.min(categories.length - 1, next));
      setKeyboardActive(true);
      show(clamped);
    };
    const onPlotKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!tooltip || categories.length === 0) return;
      // Escape hides the tooltip and stays inside the chart (a sheet or dialog around it keeps its own Escape for the next press); the position is kept.
      if (event.key === 'Escape') {
        if (active === null) return;
        event.stopPropagation();
        setActive(null);
        setKeyboardActive(false);
        return;
      }
      const at = active ?? lastRef.current ?? -1;
      if (event.key === 'ArrowRight') keyboardMove(at + 1);
      else if (event.key === 'ArrowLeft') keyboardMove(at < 0 ? 0 : at - 1);
      else if (event.key === 'Home') keyboardMove(0);
      else if (event.key === 'End') keyboardMove(categories.length - 1);
      else return;
      event.preventDefault();
    };
    const derivedList = derived ? (Array.isArray(derived) ? derived : [derived]) : [];
    const datumAt = (i: number): ChartDatum => ({
      index: i,
      category: categories[i],
      values: Object.fromEntries(series.map((s) => [s.id, s.values[i] ?? 0])),
      total: totals[i],
    });
    const derivedAt = (i: number) =>
      derivedList.map((d) => {
        const v = d.compute(datumAt(i));
        return { id: `derived-${d.key}`, label: d.label, value: v == null || Number.isNaN(v) ? '\u2013' : (d.format ?? format)(v) };
      });
    const table: ChartTable = {
      columns: [categoryLabel ?? l.chartCategory, ...series.map((s) => s.label), ...derivedList.map((d) => d.label)],
      rows: categories.map((c, i) => [c, ...series.map((s) => formatPoint(s.values[i] ?? 0)), ...derivedAt(i).map((d) => d.value)]),
    };

    return (
      <ChartFrame
        ref={ref}
        table={table}
        legend={legend ? series.map((s, i) => ({ id: s.id, label: s.label, tone: toneOf(s, i), line: s.line })) : undefined}
        legendPosition={legendPosition}
        interactive={tooltip}
        descriptionId={descId}
        {...frame}
      >
        <div
          ref={setWrap}
          data-chart-fluid={fluid || undefined}
          className={cn(
            tooltip && 'relative max-w-full overflow-hidden [&>svg]:block',
            // The focus ring hugs the plot: a fixed-width chart is as wide as its svg, a fluid one fills the frame.
            tooltip && !fluid && 'w-fit',
            tooltip && 'rounded-item focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-inset focus-visible:ring-ring-default',
            fluid && 'w-full min-w-0 max-w-full overflow-hidden [&>svg]:block',
          )}
          onPointerLeave={tooltip ? () => setActive(null) : undefined}
          {...(tooltip
            ? {
                // The plot is the focus target of the chart (WCAG 2.1.1): arrow keys read the data points one by one.
                role: 'group' as const,
                tabIndex: 0,
                'aria-label': frame.title,
                'aria-roledescription': 'chart',
                'aria-describedby': frame.description ? `${descId} ${hintId}` : hintId,
                'data-chart-tooltip-open': active !== null ? '' : undefined,
                onKeyDown: onPlotKeyDown,
                onFocus: (event: FocusEvent<HTMLDivElement>) => {
                  if (event.target !== event.currentTarget || active !== null) return;
                  let visible = true;
                  try {
                    visible = event.currentTarget.matches(':focus-visible');
                  } catch {
                    visible = true;
                  }
                  if (visible && categories.length > 0) keyboardMove(0);
                },
                onBlur: () => {
                  setKeyboardActive(false);
                  setActive(null);
                },
              }
            : null)}
        >
        {tooltip ? (
          <span id={hintId} className="sr-only">
            {l.chartFocusHint}
          </span>
        ) : null}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="h-auto max-w-full">
          {hatchTones.length > 0 ? (
            <defs>
              {hatchTones.map((tone) => (
                <HatchPattern key={tone} id={`${hatchId}-${tone}`} tone={tone} />
              ))}
            </defs>
          ) : null}
          {tooltip && keyboardActive && active !== null ? (
            <rect data-chart-focus-band="" x={left + band * active} y={top} width={band} height={plotH} className="fill-muted" />
          ) : null}
          <g className="text-border-subtle">
            {ticks.map((t) => (
              <line key={t} x1={left} x2={width - right} y1={y(t)} y2={y(t)} className="stroke-current" strokeWidth={1} />
            ))}
          </g>
          {axisLabels ? (
            <g className={axisText}>
              {ticks.map((t) => (
                <text key={t} x={left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                  {format(t)}
                </text>
              ))}
              {categories.map((c, i) => (
                <text key={c + i} x={x(i)} y={height - bottom + 16} textAnchor="middle" data-axis-label="">
                  {labelLines[i].map((line, li) => (
                    <tspan key={li} x={x(i)} dy={li === 0 ? 0 : AXIS_LINE_HEIGHT}>
                      {line}
                    </tspan>
                  ))}
                </text>
              ))}
              {xTitle ? (
                <text x={left + plotW / 2} y={height - 6} textAnchor="middle">
                  {xTitle}
                </text>
              ) : null}
              {yTitle ? (
                <text transform={`translate(12 ${top + plotH / 2}) rotate(-90)`} textAnchor="middle">
                  {yTitle}
                </text>
              ) : null}
            </g>
          ) : null}
          {type === 'bar'
            ? categories.map((c, i) => {
                let acc = 0;
                return (
                  <g key={c + i}>
                    {series.map((s, si) => {
                      const v = s.values[i] ?? 0;
                      const w = stackedBars ? barGroupW : barGroupW / series.length - 2;
                      const bx = stackedBars ? x(i) - w / 2 : x(i) - barGroupW / 2 + si * (barGroupW / series.length) + 1;
                      const by = stackedBars ? y(acc + v) : y(v);
                      const bh = stackedBars ? y(acc) - y(acc + v) : y(0) - y(v);
                      if (stackedBars) acc += v;
                      const pointColor = s.pointColors?.[i];
                      const pointTone = s.pointTones?.[i];
                      const lastSegment = !stackedBars || series.findLastIndex((x2) => (x2.values[i] ?? 0) > 0) === si;
                      const barTone = pointTone ?? toneOf(s, si);
                      const barProps = {
                        'data-bar': '',
                        className: cn('fill-current', toneText[barTone], isHatched(barTone) && 'stroke-current'),
                        style: pointColor ? { fill: pointColor } : isHatched(barTone) ? { fill: `url(#${hatchId}-${barTone})` } : undefined,
                        strokeWidth: isHatched(barTone) ? 1 : undefined,
                      };
                      return (
                        <g key={s.id}>
                          {zero ? (
                            <path d={topRoundedPath(bx, by, Math.max(0, w), Math.max(0, bh), lastSegment ? BAR_TOP_RADIUS : 0)} {...barProps} />
                          ) : (
                            <rect x={bx} y={by} width={Math.max(0, w)} height={Math.max(0, bh)} rx={2} {...barProps} />
                          )}
                          {showValues && !stackedBars ? (
                            <text data-bar-value="" x={bx + Math.max(0, w) / 2} y={by - 4} textAnchor="middle" className={valueText}>
                              {formatPoint(v)}
                            </text>
                          ) : null}
                        </g>
                      );
                    })}
                    {showValues && stackedBars ? (
                      <text data-bar-value="" x={x(i)} y={y(totals[i]) - 4} textAnchor="middle" className={valueText}>
                        {formatPoint(totals[i])}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : series.map((s, si) => (
                <g key={s.id} className={toneText[toneOf(s, si)]}>
                  <polyline
                    fill="none"
                    className={toneStroke[toneOf(s, si)]}
                    strokeWidth={2}
                    strokeDasharray={DASH[lineStyleOf(toneOf(s, si), s.line)]}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={categories.map((_, i) => `${x(i)},${y(s.values[i] ?? 0)}`).join(' ')}
                  />
                  {categories.map((_, i) => (
                    <circle key={i} cx={x(i)} cy={y(s.values[i] ?? 0)} r={3} className="fill-current" />
                  ))}
                </g>
              ))}
          {tooltip
            ? categories.map((c, i) => (
                <rect
                  key={c + i}
                  data-chart-hit=""
                  x={left + band * i}
                  y={top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => {
                    setKeyboardActive(false);
                    show(i);
                  }}
                  onPointerMove={() => {
                    if (active === i) return;
                    setKeyboardActive(false);
                    show(i);
                  }}
                />
              ))
            : null}
        </svg>
        {tooltip && active !== null ? (
          <ChartTooltip
            title={categories[active]}
            anchor={x(active)}
            scale={scale}
            containerRef={wrapRef}
            rows={[...series.map((s, si) => ({ id: s.id, label: s.label, value: formatPoint(s.values[active] ?? 0), tone: toneOf(s, si) as ChartTone | undefined })), ...derivedAt(active)]}
          />
        ) : null}
        {tooltip ? (
          <span role="status" aria-live="polite" aria-atomic="true" data-chart-live="" className="sr-only">
            {keyboardActive && active !== null
              ? [l.chartPoint(categories[active], active + 1, categories.length), ...series.map((s) => `${s.label} ${formatPoint(s.values[active] ?? 0)}`), ...derivedAt(active).map((d) => `${d.label} ${d.value}`)].join('. ')
              : ''}
          </span>
        ) : null}
        </div>
      </ChartFrame>
    );
  },
);
LineBarChart.displayName = 'LineBarChart';

// Pie chart

export interface PieSlice {
  id: string;
  label: string;
  value: number;
  tone?: ChartTone;
  // Custom colour (stage or project data): a CSS colour such as `var(--colors-data-stage-1)` or a `bg-*` token class. Wins over `tone`.
  color?: string;
}

export interface PieChartProps extends FrameShared {
  slices: PieSlice[];
  // 0 renders a pie, 0.5 a donut (Figma default). Default 0.5.
  hole?: number;
  centerLabel?: ReactNode;
  legend?: boolean;
  // Figma sizes xxs 120, xs 160, sm 200, md 240, lg 280 (px), or a pixel number. Default sm.
  size?: ChartSize | number;
}

export type ChartSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';

const chartSizes: Record<ChartSize, number> = { xxs: 120, xs: 160, sm: 200, md: 240, lg: 280 };

// Fill of an svg shape from a custom colour: a `bg-*` token class becomes its `text-*` twin (fill-current), anything else a CSS colour.
const svgColor = (color: string | undefined) =>
  color ? (color.startsWith('bg-') ? { className: `text-${color.slice(3)}` } : { style: { color } }) : undefined;

// Background of an html shape from a custom colour.
const bgColor = (color: string | undefined) =>
  color ? (color.startsWith('bg-') ? { className: color } : { style: { backgroundColor: color } }) : undefined;

const polar = (cx: number, cy: number, r: number, angle: number) => [cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)];

const PieChart = forwardRef<HTMLElement, PieChartProps>(
  ({ slices, hole = 0.5, centerLabel, legend = true, legendPosition = 'right', size: sizeProp = 'sm', ...frame }, ref) => {
    const l = useLabels();
    const format = useNumberFormat();
    const size = typeof sizeProp === 'number' ? sizeProp : chartSizes[sizeProp];
    const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
    const c = size / 2;
    const r = c - 2;
    const ri = r * Math.min(0.9, Math.max(0, hole));
    let start = 0;
    const paths = slices.map((s, i) => {
      const frac = total > 0 ? Math.max(0, s.value) / total : 0;
      const a0 = start;
      const a1 = start + frac * Math.PI * 2;
      start = a1;
      const tone = s.tone ?? toneAt(i);
      if (frac >= 0.9999) {
        return (
          <g key={s.id} className={cn(toneText[tone], svgColor(s.color)?.className)} style={svgColor(s.color)?.style}>
            <circle cx={c} cy={c} r={r} className="fill-current" />
            {ri > 0 ? <circle cx={c} cy={c} r={ri} className="fill-background" /> : null}
          </g>
        );
      }
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const [x0, y0] = polar(c, c, r, a0);
      const [x1, y1] = polar(c, c, r, a1);
      const [xi1, yi1] = polar(c, c, ri, a1);
      const [xi0, yi0] = polar(c, c, ri, a0);
      const d =
        ri > 0
          ? `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${large} 0 ${xi0} ${yi0} Z`
          : `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
      return <path key={s.id} d={d} className={cn('fill-current', toneText[tone], svgColor(s.color)?.className)} style={svgColor(s.color)?.style} />;
    });
    const table: ChartTable = {
      columns: [l.chartSlice, l.chartValue, l.chartShare],
      rows: slices.map((s) => [s.label, format(s.value), total > 0 ? `${format((s.value / total) * 100)} %` : '0 %']),
    };
    return (
      <ChartFrame
        ref={ref}
        table={table}
        legend={legend ? slices.map((s, i) => ({ id: s.id, label: `${s.label} ${total > 0 ? Math.round((s.value / total) * 100) : 0} %`, tone: s.tone ?? toneAt(i), color: s.color })) : undefined}
        legendPosition={legendPosition}
        {...frame}
      >
        <div className="relative inline-block">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className="h-auto max-w-full">
            {paths}
          </svg>
          {centerLabel ? (
            <span className="typography-ui-lg-semibold absolute inset-0 flex items-center justify-center text-foreground">{centerLabel}</span>
          ) : null}
        </div>
      </ChartFrame>
    );
  },
);
PieChart.displayName = 'PieChart';

// Radar chart

export interface RadarChartProps extends FrameShared {
  axes: string[];
  series: ChartSeries[];
  max?: number;
  rings?: number;
  legend?: boolean;
  size?: number;
}

const RadarChart = forwardRef<HTMLElement, RadarChartProps>(
  ({ axes, series, max, rings = 5, legend = true, legendPosition = 'bottom', size = 372, ...frame }, ref) => {
    const l = useLabels();
    const format = useNumberFormat();
    const c = size / 2;
    const pad = 48;
    const r = c - pad;
    const top = niceMax(max ?? Math.max(0, ...series.flatMap((s) => s.values)));
    const n = Math.max(3, axes.length);
    const angle = (i: number) => (i / n) * Math.PI * 2;
    const pt = (i: number, v: number) => polar(c, c, (v / top) * r, angle(i));
    const ringPoints = (k: number) => axes.map((_, i) => pt(i, (top / rings) * k).join(',')).join(' ');
    const table: ChartTable = {
      columns: [l.chartAxis, ...series.map((s) => s.label)],
      rows: axes.map((a, i) => [a, ...series.map((s) => format(s.values[i] ?? 0))]),
    };
    return (
      <ChartFrame
        ref={ref}
        table={table}
        legend={legend ? series.map((s, i) => ({ id: s.id, label: s.label, tone: s.tone ?? toneAt(i) })) : undefined}
        legendPosition={legendPosition}
        {...frame}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className="h-auto max-w-full">
          <g className="text-border-subtle">
            {Array.from({ length: rings }, (_, k) => (
              <polygon key={k} points={ringPoints(k + 1)} fill="none" className="stroke-current" strokeWidth={1} />
            ))}
            {axes.map((a, i) => {
              const [x, y] = pt(i, top);
              return <line key={a} x1={c} y1={c} x2={x} y2={y} className="stroke-current" strokeWidth={1} />;
            })}
          </g>
          {series.map((s, si) => (
            <g key={s.id} className={toneText[s.tone ?? toneAt(si)]}>
              <polygon
                points={axes.map((_, i) => pt(i, s.values[i] ?? 0).join(',')).join(' ')}
                fillOpacity={0.2}
                className={cn('fill-current', toneStroke[s.tone ?? toneAt(si)])}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </g>
          ))}
          <g className="typography-text-extra-small fill-current text-muted-foreground">
            {axes.map((a, i) => {
              const [x, y] = polar(c, c, r + 16, angle(i));
              return (
                <text key={a} x={x} y={y} textAnchor="middle" dominantBaseline="middle">
                  {a}
                </text>
              );
            })}
          </g>
        </svg>
      </ChartFrame>
    );
  },
);
RadarChart.displayName = 'RadarChart';

// Activity gauge

export interface ActivityGaugeSeries {
  id: string;
  label: string;
  value: number;
  tone?: ChartTone;
}

export interface ActivityGaugeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  'aria-label': string;
  // One value as shorthand for a single ring. Ignored when `series` is set.
  value?: number;
  // Up to three concentric rings, outermost first.
  series?: ActivityGaugeSeries[];
  max?: number;
  tone?: ChartTone;
  // Caption above the center value, e.g. "Active users".
  label?: ReactNode;
  // Center text. Defaults to the first ring's value.
  valueText?: ReactNode;
  // Figma sizes xs 160, sm 200, md 240, lg 280 (px), or a pixel number. Default xs.
  size?: Exclude<ChartSize, 'xxs'> | number;
  legend?: 'right' | 'bottom' | false;
}

const ActivityGauge = forwardRef<HTMLDivElement, ActivityGaugeProps>(
  ({ className, 'aria-label': ariaLabel, value = 0, series, max = 100, tone = 'brand', label, valueText, size: sizeProp = 'xs', legend = false, ...props }, ref) => {
    const l = useLabels();
    const format = useNumberFormat();
    const size = typeof sizeProp === 'number' ? sizeProp : chartSizes[sizeProp];
    const rings: ActivityGaugeSeries[] = series ?? [{ id: 'value', label: ariaLabel, value, tone }];
    const stroke = size / 16;
    const gap = size / 60;
    const center = size / 2;
    const clampOf = (v: number) => Math.min(Math.max(v, 0), max);
    const single = rings.length === 1;
    const lead = clampOf(rings[0]?.value ?? 0);
    const big = size >= 240;
    const meterProps = single
      ? { role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': lead, 'aria-valuetext': l.valueOfMax(format(lead), format(max)) }
      : { role: 'group' };
    return (
      <div className={cn('inline-flex gap-4', legend === 'bottom' ? 'flex-col items-center' : 'flex-row items-center', className)} ref={ref} {...props}>
        <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={ariaLabel} {...meterProps}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className="-rotate-90">
            {rings.slice(0, 3).map((ring, i) => {
              const r = center - stroke / 2 - i * (stroke + gap);
              const pct = max > 0 ? (clampOf(ring.value) / max) * 100 : 0;
              return (
                <g key={ring.id}>
                  <circle cx={center} cy={center} r={r} fill="none" strokeWidth={stroke} className="stroke-current text-muted" />
                  {pct > 0 ? (
                    <circle cx={center} cy={center} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} className={toneStroke[ring.tone ?? (single ? tone : toneAt(i))]} />
                  ) : null}
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {label ? <span className="typography-text-extra-small text-muted-foreground">{label}</span> : null}
            <span className={cn('tabular-nums text-foreground', big ? 'typography-kpi-value' : 'typography-ui-lg-semibold')}>{valueText ?? format(lead)}</span>
          </div>
          {single ? null : (
            <div className="sr-only">
              {rings.map((ring) => (
                <div key={ring.id} role="meter" aria-label={ring.label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={clampOf(ring.value)} aria-valuetext={l.valueOfMax(format(clampOf(ring.value)), format(max))} />
              ))}
            </div>
          )}
        </div>
        {legend ? <ChartLegend layout={legend === 'right' ? 'column' : 'row'} items={rings.map((r, i) => ({ id: r.id, label: r.label, tone: r.tone ?? (single ? tone : toneAt(i)) }))} /> : null}
      </div>
    );
  },
);
ActivityGauge.displayName = 'ActivityGauge';

// Sparkline

export interface SparklineProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  'aria-label': string;
  values: number[];
  tone?: ChartTone;
  width?: number;
  height?: number;
}

const Sparkline = forwardRef<HTMLSpanElement, SparklineProps>(({ className, values, tone = 'brand', width = 56, height = 18, ...props }, ref) => {
  const min = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - min || 1;
  const pad = 2;
  const pts = values.map((v, i) => [pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2), pad + (1 - (v - min) / span) * (height - pad * 2)]);
  const last = pts[pts.length - 1];
  return (
    <span ref={ref} role="img" className={cn('inline-flex', toneText[tone], className)} {...props}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        {pts.length > 1 ? <polyline fill="none" className={toneStroke[tone]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={pts.map((p) => p.join(',')).join(' ')} /> : null}
        {last ? <circle cx={last[0]} cy={last[1]} r={2} className="fill-current" /> : null}
      </svg>
    </span>
  );
});
Sparkline.displayName = 'Sparkline';

// Histogram

export interface HistogramBin {
  label?: string;
  value: number;
}

export interface HistogramProps extends FrameShared {
  bins: HistogramBin[];
  // Inclusive bin index range drawn in the brand tone, the rest is neutral.
  highlight?: [number, number];
  // Axis labels under every n-th bin that has a label.
  axisLabels?: boolean;
  width?: number;
  height?: number;
}

const Histogram = forwardRef<HTMLElement, HistogramProps>(({ bins, highlight, axisLabels = true, width = 320, height = 144, ...frame }, ref) => {
  const l = useLabels();
  const format = useNumberFormat();
  const bottom = axisLabels ? 20 : 0;
  const plotH = height - bottom;
  const maxV = Math.max(1, ...bins.map((b) => b.value));
  const gap = 4;
  const bw = (width - gap * (bins.length - 1)) / Math.max(1, bins.length);
  const table: ChartTable = { columns: [l.chartBin, l.chartCount], rows: bins.map((b, i) => [b.label ?? String(i + 1), format(b.value)]) };
  return (
    <ChartFrame ref={ref} table={table} {...frame}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="h-auto max-w-full">
        {bins.map((b, i) => {
          const on = highlight ? i >= highlight[0] && i <= highlight[1] : false;
          const h = (b.value / maxV) * plotH;
          return <rect key={i} x={i * (bw + gap)} y={plotH - h} width={bw} height={h} rx={2} className={cn('fill-current', on ? toneText.brand : toneText.neutral)} />;
        })}
        {axisLabels ? (
          <g className="typography-text-extra-small fill-current text-muted-foreground">
            {bins.map((b, i) =>
              b.label ? (
                <text key={i} x={i * (bw + gap) + bw / 2} y={height - 4} textAnchor="middle">
                  {b.label}
                </text>
              ) : null,
            )}
          </g>
        ) : null}
      </svg>
    </ChartFrame>
  );
});
Histogram.displayName = 'Histogram';

// Horizontal bar list

export interface HBarItem {
  id: string;
  label: string;
  value: number;
  // Text shown at the right, e.g. "3 proj.". Defaults to the value.
  valueLabel?: ReactNode;
  tone?: ChartTone;
  // Custom colour (stage or project data): a CSS colour or a `bg-*` token class. Wins over `tone`. Ignored when the row has `segments`.
  color?: string;
  // Skill category (as in SkillTree): fills the bar with the category colour. `color` wins over it, it wins over `tone`. Ignored when the row has `segments`.
  skill?: SkillCategory;
  // Splits the bar into stacked parts (for example open, in progress, done). The row total is the sum of the parts and replaces `value`. A segment id shares its tone and legend entry across rows.
  segments?: HBarSegment[];
}

export interface HBarSegment {
  id: string;
  label: string;
  value: number;
  tone?: ChartTone;
  // Custom colour: a CSS colour or a `bg-*` token class. Wins over `tone`.
  color?: string;
}

export interface HBarListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  'aria-label': string;
  items: HBarItem[];
  // Upper bound for the bars. Defaults to the largest value.
  max?: number;
  // Stacked puts label and value above the bar instead of beside it.
  layout?: 'inline' | 'stacked';
  // Legend of the segment ids used by `items[].segments`. Default shows it whenever a row has segments.
  legend?: boolean;
}

const rowTotal = (item: HBarItem) => (item.segments ? item.segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) : item.value);

const HBarList = forwardRef<HTMLUListElement, HBarListProps>(({ className, items, max, layout = 'inline', legend, ...props }, ref) => {
  const format = useNumberFormat();
  const top = max ?? Math.max(1, ...items.map(rowTotal));
  const segmentLegend: ChartLegendItem[] = [];
  items.forEach((item) =>
    item.segments?.forEach((seg, si) => {
      if (!segmentLegend.some((entry) => entry.id === seg.id)) segmentLegend.push({ id: seg.id, label: seg.label, tone: seg.tone ?? toneAt(si), color: seg.color });
    }),
  );
  const showLegend = (legend ?? true) && segmentLegend.length > 0;
  const list = (
    <ul ref={ref} className={cn('typography-ui m-0 flex list-none flex-col gap-3 p-0 text-foreground', className)} {...props}>
      {items.map((item) => {
        const total = rowTotal(item);
        // `flex-1` sets flex-basis 0 on the main axis. In the stacked column that is the height axis, which overrides `h-2` and collapses the bar to 0px, so the stacked bar takes the full width and keeps its height instead.
        const barSize = layout === 'inline' ? 'flex-1' : 'w-full shrink-0';
        const pct = Math.min(100, Math.max(0, (total / top) * 100));
        const bar = item.segments ? (
          <>
            <span aria-hidden="true" data-segmented="" className={cn('flex h-2 overflow-hidden rounded-full bg-muted', barSize)}>
              {item.segments.map((seg, si) => (
                <span
                  key={seg.id}
                  data-segment={seg.id}
                  className={cn('block h-full', seg.color ? bgColor(seg.color)?.className : toneBg[seg.tone ?? toneAt(si)])}
                  style={{ width: `${Math.min(100, Math.max(0, (seg.value / top) * 100))}%`, ...bgColor(seg.color)?.style }}
                />
              ))}
            </span>
            <span className="sr-only">{item.segments.map((seg) => `${seg.label}: ${format(seg.value)}`).join(', ')}</span>
          </>
        ) : (
          <span aria-hidden="true" className={cn('block h-2 overflow-hidden rounded-full bg-muted', barSize)}>
            <span
              className={cn('block h-full rounded-full', item.color ? bgColor(item.color)?.className : item.skill ? skillCategoryFill[item.skill] : toneBg[item.tone ?? 'brand'])}
              style={{ width: `${pct}%`, ...bgColor(item.color)?.style }}
            />
          </span>
        );
        return (
          <li key={item.id} data-layout={layout} className={cn('gap-2', layout === 'inline' ? 'flex items-center' : 'flex flex-col')}>
            {layout === 'inline' ? (
              <>
                <span className="w-1/3 min-w-0 shrink-0 truncate">{item.label}</span>
                {bar}
                <span className="typography-ui-semibold shrink-0 tabular-nums">{item.valueLabel ?? format(total)}</span>
              </>
            ) : (
              <>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate">{item.label}</span>
                  <span className="typography-ui-semibold shrink-0 tabular-nums">{item.valueLabel ?? format(total)}</span>
                </span>
                {bar}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
  if (!showLegend) return list;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {list}
      <ChartLegend items={segmentLegend} />
    </div>
  );
});
HBarList.displayName = 'HBarList';

// Treemap

export interface TreemapItem {
  id: string;
  label: string;
  value: number;
  tone?: ChartTone;
  // Custom colour (stage or project data): a CSS colour or a `bg-*` token class. Wins over `tone`.
  color?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const squarify = (items: { id: string; area: number }[], box: Rect): Record<string, Rect> => {
  const out: Record<string, Rect> = {};
  let rest = [...items].sort((a, b) => b.area - a.area);
  let { x, y, w, h } = box;
  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0);
    if (s === 0) return Infinity;
    const mx = Math.max(...row);
    const mn = Math.min(...row);
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  while (rest.length > 0) {
    const side = Math.min(w, h);
    const row: typeof rest = [];
    let i = 0;
    while (i < rest.length) {
      const candidate = [...row, rest[i]];
      if (row.length === 0 || worst(candidate.map((c) => c.area), side) <= worst(row.map((c) => c.area), side)) {
        row.push(rest[i]);
        i += 1;
      } else break;
    }
    const sum = row.reduce((a, b) => a + b.area, 0);
    if (w >= h) {
      const rw = sum / h;
      let cy = y;
      for (const r of row) {
        const rh = r.area / rw;
        out[r.id] = { x, y: cy, w: rw, h: rh };
        cy += rh;
      }
      x += rw;
      w -= rw;
    } else {
      const rh = sum / w;
      let cx = x;
      for (const r of row) {
        const rw = r.area / rh;
        out[r.id] = { x: cx, y, w: rw, h: rh };
        cx += rw;
      }
      y += rh;
      h -= rh;
    }
    rest = rest.slice(row.length);
  }
  return out;
};

export interface TreemapProps extends FrameShared {
  items: TreemapItem[];
  // Maximum width in px, or 'auto' to fill the container (the cells are percent based, so the layout follows the container at any width). Default 560.
  width?: number | 'auto';
  height?: number;
  // Cells narrower or lower than this share of the box (percent) hide their label.
  minLabelPercent?: number;
}

const Treemap = forwardRef<HTMLElement, TreemapProps>(({ items, width = 560, height = 220, minLabelPercent = 10, ...frame }, ref) => {
  const l = useLabels();
  const format = useNumberFormat();
  const total = items.reduce((s, i) => s + Math.max(0, i.value), 0);
  const positive = items.filter((i) => i.value > 0);
  const rects = total > 0 ? squarify(positive.map((i) => ({ id: i.id, area: (i.value / total) * 100 * 100 })), { x: 0, y: 0, w: 100, h: 100 }) : {};
  const table: ChartTable = { columns: [l.chartItem, l.chartValue], rows: items.map((i) => [i.label, format(i.value)]) };
  return (
    <ChartFrame ref={ref} table={table} {...frame}>
      <div className="relative w-full overflow-hidden rounded-control" style={{ maxWidth: width === 'auto' ? undefined : width, height }}>
        {positive.map((item, idx) => {
          const r = rects[item.id];
          if (!r) return null;
          const showLabel = r.w >= minLabelPercent && r.h >= minLabelPercent;
          return (
            <div
              key={item.id}
              title={`${item.label} ${format(item.value)}`}
              className={cn('typography-ui absolute flex flex-col justify-end border border-solid border-background p-2', item.color ? [bgColor(item.color)?.className, customOn[item.color] ?? 'text-text-on-brand'] : [toneBg[item.tone ?? toneAt(idx)], toneOn[item.tone ?? toneAt(idx)]])}
              style={{ ...bgColor(item.color)?.style, left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
            >
              {showLabel ? (
                <>
                  <span className="typography-ui-medium truncate">{item.label}</span>
                  <span className="typography-text-extra-small tabular-nums">{format(item.value)}</span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
});
Treemap.displayName = 'Treemap';

export { ActivityGauge, ChartFrame, ChartLegend, HBarList, Histogram, LineBarChart, PieChart, RadarChart, Sparkline, Treemap };
