'use client';

import { Grid3x3 } from 'lucide-react';
import { Children, forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, type TdHTMLAttributes } from 'react';

import { focusRing, transitionBase } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { DataStatePanel, SkeletonBar } from './data-state-panel';
import type { SkillCategory } from './skill-category';
import { useLabels, usePreset } from './labels-context';

// Full class strings so Tailwind's content scan finds every token.
const heatmapTone = {
  free: 'border-transparent bg-data-workload-free-bg text-data-workload-free-fg',
  ok: 'border-transparent bg-data-workload-ok-bg text-data-workload-ok-fg',
  over: 'border-transparent bg-data-workload-over-bg text-data-workload-over-fg',
  need: 'border-dashed border-data-workload-need-border bg-data-workload-need-bg text-data-workload-need-fg',
  empty: 'border-transparent bg-data-workload-empty-bg text-data-workload-empty-fg',
  // Revenue states: paid is settled, unpaid is open, forecast is planned and not yet invoiced.
  paid: 'border-transparent bg-general-success-container text-general-success-on-container',
  unpaid: 'border-transparent bg-general-warning-container text-general-warning-on-container',
  forecast: 'border-dashed border-border-default bg-transparent text-muted-foreground',
  // Continuous scale: the fill is a brand overlay whose opacity follows `intensity`.
  intensity: 'border-transparent bg-data-workload-empty-bg text-data-workload-ok-fg',
  'skill-1': 'border-transparent',
  'skill-2': 'border-transparent',
  'skill-3': 'border-transparent',
  'skill-4': 'border-transparent',
  'coverage-full': 'border-transparent bg-transparent text-foreground',
  'coverage-partial': 'border-transparent bg-transparent text-foreground',
  'coverage-none': 'border-transparent bg-transparent text-muted-foreground',
} as const;

// Skill level fills per category (colors/data/skill/<category>): levels 1 and 2 use subtle, level 3 the strong fill, level 4 the strong fill plus an inset on-fill ring (TOKEN GAP: no darker fourth fill token yet).
const skillClasses: Record<SkillCategory, { subtle: string; strong: string }> = {
  frontend: { subtle: 'bg-data-skill-frontend-subtle text-data-skill-frontend-on', strong: 'bg-data-skill-frontend-default text-data-skill-frontend-on-fill' },
  backend: { subtle: 'bg-data-skill-backend-subtle text-data-skill-backend-on', strong: 'bg-data-skill-backend-default text-data-skill-backend-on-fill' },
  'devops-cloud': { subtle: 'bg-data-skill-devops-cloud-subtle text-data-skill-devops-cloud-on', strong: 'bg-data-skill-devops-cloud-default text-data-skill-devops-cloud-on-fill' },
  'data-ai': { subtle: 'bg-data-skill-data-ai-subtle text-data-skill-data-ai-on', strong: 'bg-data-skill-data-ai-default text-data-skill-data-ai-on-fill' },
  'design-ux': { subtle: 'bg-data-skill-design-ux-subtle text-data-skill-design-ux-on', strong: 'bg-data-skill-design-ux-default text-data-skill-design-ux-on-fill' },
  mobile: { subtle: 'bg-data-skill-mobile-subtle text-data-skill-mobile-on', strong: 'bg-data-skill-mobile-default text-data-skill-mobile-on-fill' },
  security: { subtle: 'bg-data-skill-security-subtle text-data-skill-security-on', strong: 'bg-data-skill-security-default text-data-skill-security-on-fill' },
  'testing-qa': { subtle: 'bg-data-skill-testing-qa-subtle text-data-skill-testing-qa-on', strong: 'bg-data-skill-testing-qa-default text-data-skill-testing-qa-on-fill' },
  infrastructure: { subtle: 'bg-data-skill-infrastructure-subtle text-data-skill-infrastructure-on', strong: 'bg-data-skill-infrastructure-default text-data-skill-infrastructure-on-fill' },
  'project-management': { subtle: 'bg-data-skill-project-management-subtle text-data-skill-project-management-on', strong: 'bg-data-skill-project-management-default text-data-skill-project-management-on-fill' },
  'business-strategy': { subtle: 'bg-data-skill-business-strategy-subtle text-data-skill-business-strategy-on', strong: 'bg-data-skill-business-strategy-default text-data-skill-business-strategy-on-fill' },
  fallback: { subtle: 'bg-data-skill-fallback-subtle text-data-skill-fallback-on', strong: 'bg-data-skill-fallback-default text-data-skill-fallback-on-fill' },
};

// Inset ring colour per category for level 4 (the on-fill token), so level 4 differs from level 3 without a new fill.
const skillRing: Record<SkillCategory, string> = {
  frontend: 'ring-data-skill-frontend-on-fill',
  backend: 'ring-data-skill-backend-on-fill',
  'devops-cloud': 'ring-data-skill-devops-cloud-on-fill',
  'data-ai': 'ring-data-skill-data-ai-on-fill',
  'design-ux': 'ring-data-skill-design-ux-on-fill',
  mobile: 'ring-data-skill-mobile-on-fill',
  security: 'ring-data-skill-security-on-fill',
  'testing-qa': 'ring-data-skill-testing-qa-on-fill',
  infrastructure: 'ring-data-skill-infrastructure-on-fill',
  'project-management': 'ring-data-skill-project-management-on-fill',
  'business-strategy': 'ring-data-skill-business-strategy-on-fill',
  fallback: 'ring-data-skill-fallback-on-fill',
};

export type HeatmapTone = keyof typeof heatmapTone;

export interface HeatmapCellProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  tone?: HeatmapTone;
  // Skill category that colors the skill-1 to skill-4 tones. Defaults to frontend.
  category?: SkillCategory;
  selected?: boolean;
  // Continuous heat from 0 to 1. Setting it switches the cell to the continuous scale (tone `intensity`) and caps the fill so the text keeps 4.5:1 in light and dark.
  intensity?: number;
  // Accessible text for tones that show a symbol instead of text, e.g. "Covered".
  label?: string;
}

// Largest overlay opacity. Computed from the theme tokens: text stays above 4.5:1 up to 0.4 in light and dark.
const intensityCap = 0.4;

const dotClass = {
  'coverage-full': 'bg-foreground',
  'coverage-partial': 'border border-solid border-foreground',
  'coverage-none': 'border border-solid border-hairline',
} as const;

// Heat cell. A plain element until onClick is set, then a button with the shared focus ring.
const HeatmapCell = forwardRef<HTMLButtonElement, HeatmapCellProps>(
  ({ className, tone: toneProp = 'free', category = 'frontend', selected, intensity, label, children, onClick, type = 'button', ...props }, ref) => {
    const zero = usePreset() === 'zero';
    const tone: HeatmapTone = intensity !== undefined ? 'intensity' : toneProp;
    const dot = tone === 'coverage-full' || tone === 'coverage-partial' || tone === 'coverage-none' ? dotClass[tone] : null;
    const content = dot ? (
      <>
        <span aria-hidden="true" className={cn('block h-2 w-2 rounded-full', dot)} />
        <span className="sr-only">{label ?? children}</span>
      </>
    ) : intensity !== undefined ? (
      <>
        <span aria-hidden="true" data-heat-fill="" className="absolute inset-0 bg-chart-brand" style={{ opacity: Math.min(Math.max(intensity, 0), 1) * intensityCap }} />
        <span className="relative">{children}</span>
      </>
    ) : (
      children
    );
    const base = cn(
      intensity !== undefined && 'relative overflow-hidden',
      'flex h-heatmap-cell w-full items-center justify-center rounded-item border border-solid tabular-nums',
      tone === 'skill-1' ? 'typography-text-extra-small font-medium' : tone === 'skill-2' || tone === 'skill-3' || tone === 'skill-4' ? 'typography-ui-medium' : zero ? 'typography-detail' : 'typography-ui',
      tone === 'skill-1' || tone === 'skill-2' ? skillClasses[category].subtle : tone === 'skill-3' || tone === 'skill-4' ? skillClasses[category].strong : null,
      tone === 'skill-4' && cn('font-semibold ring-2 ring-inset', skillRing[category]),
      heatmapTone[tone],
      selected && 'ring-2 ring-ring',
      className,
    );
    if (!onClick) {
      return (
        <span data-tone={tone} data-selected={selected || undefined} className={base}>
          {content}
        </span>
      );
    }
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        aria-pressed={selected === undefined ? undefined : selected}
        data-tone={tone}
        data-selected={selected || undefined}
        className={cn(base, 'cursor-pointer hover:brightness-95', transitionBase, focusRing)}
        {...props}
      >
        {content}
      </button>
    );
  },
);
HeatmapCell.displayName = 'HeatmapCell';

export interface HeatmapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  'aria-label': string;
  // Column header labels (weeks, skills, demands).
  columns: ReactNode[];
  rowHeaderLabel?: ReactNode;
  state?: 'default' | 'loading' | 'empty' | 'error';
  // HeatmapRow elements.
  children?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  loadingLabel?: string;
  loadingRows?: number;
}

const Heatmap = forwardRef<HTMLDivElement, HeatmapProps>(
  (
    {
      className,
      'aria-label': ariaLabel,
      columns,
      rowHeaderLabel: rowHeaderLabelProp,
      state = 'default',
      children,
      emptyTitle: emptyTitleProp,
      emptyDescription,
      errorTitle: errorTitleProp,
      errorDescription: errorDescriptionProp,
      onRetry,
      loadingLabel: loadingLabelProp,
      loadingRows = 3,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    const rowHeaderLabel = rowHeaderLabelProp ?? l.heatmapRowHeader;
    const emptyTitle = emptyTitleProp ?? l.noDataYet;
    const errorTitle = errorTitleProp ?? l.heatmapErrorTitle;
    const errorDescription = errorDescriptionProp ?? l.dataNotLoaded;
    const loadingLabel = loadingLabelProp ?? l.heatmapLoading;
    const span = columns.length + 1;
    const zero = usePreset() === 'zero';
    // Zero: the header row is a muted band with 12/500 subtle labels.
    const headCell = zero ? 'typography-detail bg-muted text-text-subtle-on-muted' : 'typography-text-extra-small font-normal text-muted-foreground';
    return (
      <div
        ref={ref}
        aria-busy={state === 'loading' || undefined}
        className={cn('overflow-x-auto rounded-surface border border-solid border-hairline bg-card p-3', className)}
        {...props}
      >
        <table aria-label={ariaLabel} className="typography-ui w-full border-separate border-spacing-1 text-foreground">
          <thead>
            <tr>
              <th scope="col" className={cn('px-2 text-left', headCell)}>
                {rowHeaderLabel}
              </th>
              {columns.map((c, i) => (
                <th key={i} scope="col" className={cn('px-1 text-center', headCell)}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state === 'default' ? children : null}
            {state === 'loading'
              ? Array.from({ length: loadingRows }).map((_, r) => (
                  <tr key={r}>
                    {Array.from({ length: span }).map((__, c) => (
                      <td key={c} className="p-0">
                        <SkeletonBar className="h-heatmap-cell" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {state === 'empty' || state === 'error' ? (
              <tr>
                <td colSpan={span}>
                  {state === 'empty' ? (
                    <DataStatePanel kind="empty" outlined={false} icon={<Grid3x3 className="h-icon-md w-icon-md" />} title={emptyTitle} description={emptyDescription} />
                  ) : (
                    <DataStatePanel kind="error" title={errorTitle} description={errorDescription} onRetry={onRetry} />
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {state === 'loading' ? (
          <span role="status" className="sr-only">
            {loadingLabel}
          </span>
        ) : null}
      </div>
    );
  },
);
Heatmap.displayName = 'Heatmap';

export interface HeatmapRowProps extends Omit<HTMLAttributes<HTMLTableRowElement>, 'children'> {
  header: ReactNode;
  // One HeatmapCell per column; wrapped in cells automatically.
  children?: ReactNode;
}

const HeatmapRow = forwardRef<HTMLTableRowElement, HeatmapRowProps>(({ className, header, children, ...props }, ref) => (
  <tr ref={ref} className={className} {...props}>
    <th scope="row" className="typography-ui whitespace-nowrap px-2 text-left font-normal">
      {header}
    </th>
    {Children.toArray(children).map((child, i) => (
      <HeatmapTd key={i}>{child}</HeatmapTd>
    ))}
  </tr>
));
HeatmapRow.displayName = 'HeatmapRow';

const HeatmapTd = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('p-0 text-center', className)} {...props} />;

export { Heatmap, HeatmapCell, HeatmapRow };
