import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { Badge } from './badge';
import { Button } from './button';
import { Chip } from './chip';
import { Kanban, KanbanCard, KanbanColumn } from './kanban';
import { KpiStrip, MetricItem } from './metric';

// Contrast is computed from the real token CSS of every shipped theme, light and dark.
type Rgb = [number, number, number];

// The package vendors one theme (zero) in styles/theme.css.
const distDir = path.resolve(process.cwd(), 'styles');

const readBlock = (css: string, start: string): Record<string, Rgb> => {
  const open = css.indexOf('{', css.indexOf(start));
  let depth = 0;
  let end = open;
  for (; end < css.length; end += 1) {
    if (css[end] === '{') depth += 1;
    if (css[end] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const out: Record<string, Rgb> = {};
  for (const m of css.slice(open, end).matchAll(/--([\w-]+):\s*(\d+) (\d+) (\d+);/g)) out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  return out;
};

const themes = ['theme_shadcn_zero']
  .filter(() => existsSync(path.join(distDir, 'theme.css')))
  .map((d) => {
    const css = readFileSync(path.join(distDir, 'theme.css'), 'utf8');
    const light = readBlock(css, ':root {');
    return { name: d, light, dark: { ...light, ...readBlock(css, '.dark {') } };
  });

const luminance = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Maps a Tailwind color utility name (after bg- or text-) to its CSS variable.
const toVar = (name: string) => (name.startsWith('general-') ? `colors-${name}` : name.startsWith('background-destructive-bold') || name === 'text-on-destructive' ? `semantic-${name}` : `colors-utility-${name}`);

const minContrast = (bgToken: string, fgToken: string) => {
  let min = Infinity;
  for (const t of themes) {
    for (const mode of ['light', 'dark'] as const) {
      const bg = t[mode][toVar(bgToken)];
      const fg = t[mode][toVar(fgToken)];
      expect(bg).toBeDefined();
      expect(fg).toBeDefined();
      min = Math.min(min, ratio(fg, bg));
    }
  }
  return min;
};

const pairOf = (className: string) => {
  const bg = /(?:^|\s)bg-(general-[\w-]+|muted)(?=\s|$)/.exec(className)?.[1] ?? '';
  const fg = /(?:^|\s)text-(general-[\w-]+|foreground)(?=\s|$)/.exec(className)?.[1] ?? '';
  return { bg, fg };
};

describe('0.12.1 regressions', () => {
  it('reads every shipped theme', () => {
    expect(themes.length).toBeGreaterThanOrEqual(1);
  });

  describe('filled status text contrast (WCAG 1.4.3)', () => {
    it.each(['success', 'warning'] as const)('Chip %s rests on a fill that passes 4.5:1 in all themes, light and dark', (variant) => {
      const { container } = render(<Chip variant={variant} label="Chip" />);
      const { bg, fg } = pairOf((container.firstChild as HTMLElement).className);
      expect(bg).toBe(`general-${variant}-hover`);
      expect(minContrast(bg, fg)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(['success', 'warning'] as const)('selected Chip %s keeps a passing fill', (variant) => {
      const { container } = render(<Chip variant={variant} selected label="Chip" />);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveClass(`bg-general-${variant}-hover`);
      expect(minContrast(`general-${variant}-hover`, `general-${variant}-on`)).toBeGreaterThanOrEqual(4.5);
    });

    // kette-tokens 5.23.1 fixed the -default pairs that were 3.6 and 3.4:1 (fill one step darker), so they now pass 4.5:1 as well.
    it('the -default pairs pass 4.5:1 since kette-tokens 5.23.1 (pinned zero theme, light)', () => {
      const zero = themes.find((t) => t.name === 'theme_shadcn_zero');
      expect(zero).toBeDefined();
      expect(ratio(zero!.light['colors-general-success-on'], zero!.light['colors-general-success-default'])).toBeGreaterThanOrEqual(4.5);
      expect(ratio(zero!.light['colors-general-warning-on'], zero!.light['colors-general-warning-default'])).toBeGreaterThanOrEqual(4.5);
    });

    it.each(['success', 'warning'] as const)('Badge %s container pair passes 4.5:1', (variant) => {
      render(<Badge variant={variant}>Tone</Badge>);
      const { bg, fg } = pairOf(screen.getByText('Tone').closest('div')!.className);
      expect(bg).toBe(`general-${variant}-container`);
      expect(minContrast(bg, fg)).toBeGreaterThanOrEqual(4.5);
    });

    it('Badge destructive passes 4.5:1', () => {
      render(<Badge variant="destructive">Tone</Badge>);
      const { bg, fg } = pairOf(screen.getByText('Tone').closest('div')!.className);
      expect(minContrast(bg, fg)).toBeGreaterThanOrEqual(4.5);
    });

    it('Button destructive passes 4.5:1 at rest, hover, open and active', () => {
      render(<Button variant="destructive">Delete</Button>);
      const cls = screen.getByRole('button').className;
      expect(cls).toContain('text-text-on-destructive');
      for (const bg of ['background-destructive-bold-default', 'background-destructive-bold-hover', 'background-destructive-bold-active']) {
        expect(minContrast(bg, 'text-on-destructive')).toBeGreaterThanOrEqual(4.5);
      }
      expect(cls).toContain('hover:bg-background-destructive-bold-hover');
      expect(cls).toContain('active:bg-background-destructive-bold-active');
      expect(cls).toContain('data-[state=open]:bg-background-destructive-bold-hover');
    });
  });

  describe('Kanban', () => {
    it('column text sits on bg-muted with a passing text token', () => {
      render(
        <Kanban aria-label="Board">
          <KanbanColumn id="a" title="Lead" count={0} meta="EUR 0" emptyLabel="Nothing here" onAdd={() => undefined} />
        </Kanban>,
      );
      const empty = screen.getByText('Nothing here');
      expect(empty).not.toHaveClass('text-muted-foreground');
      const { fg } = pairOf(empty.className);
      expect(minContrast('muted', fg)).toBeGreaterThanOrEqual(4.5);
      expect(screen.getByRole('region', { name: 'Lead' }).className).toContain('bg-muted');
    });

    // Tokens 4.22 fixed muted-foreground on muted (was 4.34:1); now AA in every theme and mode
    it('muted-foreground on muted passes AA in every theme (tokens >= 4.22)', () => {
      for (const t of themes) {
        expect(ratio(t.light['colors-utility-muted-foreground'], t.light['colors-utility-muted'])).toBeGreaterThanOrEqual(4.5);
        if (t.dark['colors-utility-muted-foreground'] && t.dark['colors-utility-muted']) {
          expect(ratio(t.dark['colors-utility-muted-foreground'], t.dark['colors-utility-muted'])).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    it('renders headerExtra under the title and keeps the title a plain heading', () => {
      render(
        <Kanban aria-label="Board">
          <KanbanColumn id="a" title="Lead" headerExtra={<span>32% conversion</span>}>
            <KanbanCard id="c1" title="Card" />
          </KanbanColumn>
        </Kanban>,
      );
      expect(screen.getByRole('heading', { name: 'Lead' })).toBeInTheDocument();
      expect(screen.getByText('32% conversion')).toBeInTheDocument();
    });

    it('omits the header slot when headerExtra is not passed', () => {
      const { container } = render(
        <Kanban aria-label="Board">
          <KanbanColumn id="a" title="Lead" />
        </Kanban>,
      );
      expect(container.querySelector('[data-kanban-header-extra]')).toBeNull();
    });

    it('keeps the sr-only live region inside the relative root', () => {
      render(
        <Kanban aria-label="Board">
          <KanbanColumn id="a" title="Lead" />
        </Kanban>,
      );
      const root = screen.getByRole('group', { name: 'Board' });
      expect(root).toHaveClass('relative');
      const status = screen.getByRole('status');
      expect(status).toHaveClass('sr-only');
      expect(root.contains(status)).toBe(true);
    });
  });

  describe('KpiStrip and MetricItem wrapping', () => {
    it('delta and caption wrap below md and truncate from md', () => {
      render(<MetricItem label="Revenue" value="1" delta="+12 percent versus last quarter" caption="Target 160 hours per month" />);
      for (const el of [screen.getByText('+12 percent versus last quarter'), screen.getByText('Target 160 hours per month')]) {
        expect(el).toHaveClass('break-words', 'md:truncate');
        expect(el).not.toHaveClass('truncate');
      }
    });

    it('strip drops the fixed height from md so wrapped content is not clipped', () => {
      render(<KpiStrip aria-label="KPIs" />);
      const strip = screen.getByRole('group', { name: 'KPIs' });
      expect(strip).toHaveClass('md:flex');
      expect(strip).not.toHaveClass('md:h-kpi-strip');
    });
  });
});
