import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { collectRenderedClasses, missingCompiledClasses } from '../../lib/assert-compiled';
import { contrast, loadThemes, type Tokens } from '../../lib/token-contrast';
import { Avatar, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Treemap } from './chart';
import { DesignSystemProvider } from './design-system-provider';
import { MetricItem } from './metric';
import { Tabs, TabsCount, TabsList } from './tabs';

// 0.24.0: text on tinted and muted surfaces uses the tokens 4.29 contrast roles. Every swapped pair must hold 4.5:1 in every theme, light and dark.
type Pair = { use: string; fg: string; bg: string };

const pairs: Pair[] = [
  { use: 'Badge tinted destructive, Metric delta, FileIcon error tile', fg: 'text-destructive-on-subtle', bg: 'background-destructive-subtle' },
  { use: 'ActionBar destructive action, FileUpload error while dragging', fg: 'text-destructive-on-subtle', bg: 'background-brand-subtle' },
  { use: 'Badge zero info (brand tint)', fg: 'text-info-on-subtle', bg: 'background-brand-subtle' },
  { use: 'Info text on info tint', fg: 'text-info-on-subtle', bg: 'background-info-subtle' },
  { use: 'Metric selected label, FileUpload title while dragging', fg: 'text-brand-on-subtle', bg: 'background-brand-subtle' },
  { use: 'Muted surfaces: Tabs count, Kanban column meta, Calendar and Heatmap heads, SidebarNav card, selected ListItem', fg: 'text-subtle-on-muted', bg: 'utility-muted' },
  { use: 'Subtle text on brand tint: RadioCards, CheckboxGroup, BlindModeToggle, Metric caption, FileUpload', fg: 'general-brand-on-container', bg: 'background-brand-subtle' },
  { use: 'Versions card, current row (selected tint)', fg: 'general-brand-on-container', bg: 'background-selected-default' },
  { use: 'Metric success delta chip', fg: 'general-success-on-container', bg: 'background-success-subtle' },
  { use: 'Metric warning delta chip', fg: 'general-warning-on-container', bg: 'background-warning-subtle' },
  ...[1, 2, 3, 4, 5, 6, 7, 8].flatMap((n) => [
    { use: `Avatar project-${n} initials`, fg: `data-project-${n}-on`, bg: `data-project-${n}` },
    { use: `Treemap tone ${n} label`, fg: `chart-${n}-on`, bg: `chart-${n}` },
  ]),
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ use: `Treemap tone brand-${n} label`, fg: `chart-brand-${n}-on`, bg: `chart-brand-${n}` })),
  ...['brand', 'neutral', 'success', 'destructive', 'warning'].map((k) => ({ use: `Treemap tone ${k} label`, fg: `chart-${k}-on`, bg: `chart-${k}` })),
];

const ratioOf = (tokens: Tokens, p: Pair) => {
  const fg = tokens[p.fg];
  const bg = tokens[p.bg];
  expect(fg, `${p.fg} missing`).toBeDefined();
  expect(bg, `${p.bg} missing`).toBeDefined();
  return contrast(fg, bg);
};

describe('0.24.0 contrast roles (text, 4.5:1)', () => {
  const themes = loadThemes();
  it('covers the shipped theme', () => {
    expect(themes.length).toBeGreaterThanOrEqual(1);
  });
  for (const p of pairs) {
    it(`${p.fg} on ${p.bg} (${p.use})`, () => {
      for (const t of themes) {
        expect(ratioOf(t.light, p), `${t.name} light`).toBeGreaterThanOrEqual(4.5);
        expect(ratioOf(t.dark, p), `${t.name} dark`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

describe('0.24.0 rendered classes', () => {
  it('Badge uses the on-subtle roles', () => {
    const { getByText } = render(
      <>
        <Badge variant="destructive" tinted>
          a
        </Badge>
        <DesignSystemProvider preset="zero">
          <Badge variant="info">b</Badge>
        </DesignSystemProvider>
      </>,
    );
    expect(getByText('a').closest('div')).toHaveClass('text-text-destructive-on-subtle');
    expect(getByText('a').closest('div')).not.toHaveClass('text-text-destructive');
    expect(getByText('b').closest('div')).toHaveClass('bg-background-info-subtle', 'text-text-info-on-subtle');
  });

  it('Metric selected and tones use the on-subtle roles', () => {
    const { getByText } = render(<MetricItem label="Revenue" value="1" selected caption="cap" delta="+1" deltaTone="success" variant="card" />);
    expect(getByText('Revenue')).toHaveClass('text-text-brand-on-subtle');
    expect(getByText('cap')).toHaveClass('text-general-brand-on-container');
    expect(getByText('+1')).toHaveClass('text-general-success-on-container');
  });

  it('Avatar project initials use the project on role', () => {
    const { getByText } = render(
      <Avatar>
        <AvatarFallback color="project-3">AB</AvatarFallback>
      </Avatar>,
    );
    expect(getByText('AB')).toHaveClass('bg-data-project-3', 'text-data-project-3-on');
  });

  it('Treemap labels use the chart on role matching the fill', () => {
    const { container } = render(
      <Treemap title="t"
        items={[
          { id: 'a', label: 'A', value: 10, tone: 'brand-5' },
          { id: 'b', label: 'B', value: 5, color: 'bg-data-project-2' },
        ]}
      />,
    );
    expect(container.querySelector('.bg-chart-brand-5')).toHaveClass('text-chart-brand-5-on');
    expect(container.querySelector('.bg-data-project-2')).toHaveClass('text-data-project-2-on');
  });

  it('Treemap warning tone uses the chart warning fill and its on role', () => {
    const { container } = render(<Treemap title="t" items={[{ id: 'w', label: 'W', value: 3, tone: 'warning' }]} />);
    expect(container.querySelector('.bg-chart-warning')).toHaveClass('text-chart-warning-on');
  });

  it('Tabs count on a muted track uses the on-muted role', () => {
    const { getByText } = render(
      <Tabs defaultValue="a">
        <TabsList variant="segment">
          <TabsCount>3</TabsCount>
        </TabsList>
      </Tabs>,
    );
    expect(getByText('3')).toHaveClass('text-text-subtle-on-muted');
  });

  it('every new class compiles to CSS', async () => {
    const { container } = render(
      <>
        <Treemap title="t" items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: String(n), label: String(n), value: n, tone: n as 1 }))} />
        <Treemap title="t" items={['brand', 'brand-1', 'brand-4', 'neutral', 'success', 'destructive'].map((t, i) => ({ id: t, label: t, value: i + 1, tone: t as 'brand' }))} />
        <Treemap title="t" items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: String(n), label: String(n), value: n, color: `bg-data-project-${n}` }))} />
        <span className="text-text-destructive-on-subtle text-text-info-on-subtle text-text-brand-on-subtle text-text-subtle-on-muted text-general-brand-on-container group-data-[state=checked]:text-general-brand-on-container" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <Avatar key={n}>
            <AvatarFallback color={`project-${n}` as 'project-1'}>x</AvatarFallback>
          </Avatar>
        ))}
      </>,
    );
    expect(await missingCompiledClasses(collectRenderedClasses(container))).toEqual([]);
  });
});
