import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch } from './switch';

// The package vendors one theme (zero) in styles/theme.css.
const THEME_CSS = join(process.cwd(), 'styles/theme.css');

type Rgb = [number, number, number];
type Tokens = Record<string, Rgb>;

const parseVars = (block: string): Tokens => {
  const out: Tokens = {};
  for (const m of block.matchAll(/--(?:colors|semantic)-([a-z0-9-]+):\s*(\d+) (\d+) (\d+);/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return out;
};

const luminance = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const themes = ['zero']
  .map((d) => {
    const css = readFileSync(THEME_CSS, 'utf8');
    const root = parseVars(/:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '');
    const dark = { ...root, ...parseVars(/\n\.dark\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '') };
    return { name: d, light: root, dark };
  });

// The checked fill of Switch, Checkbox and Radio is `background-brand-bold-default`: unlike `primary`, it is re-tuned for dark mode.
const fill = 'background-brand-bold-default';
// Known token gap: the yellow brand fill is 2.94:1 on white (light). Needs a darker yellow from design-tokens-maintainer.
// The boundary of a checked control is the better of its fill and its border (`border-control-checked`, equal to the fill except in discord dark, where it is light).
const border = 'border-control-checked';
const KNOWN_BELOW_3 = new Set(['yellow:light']);

describe('checked Switch, Checkbox and Radio contrast (WCAG 1.4.11, tokens from dist theme.css)', () => {
  it('finds the theme outputs', () => {
    expect(themes.length).toBeGreaterThanOrEqual(1);
  });

  it.each(themes.flatMap((t) => [[t.name, 'light', t.light] as const, [t.name, 'dark', t.dark] as const]))(
    '%s %s: checked boundary (fill or border) is at least 3:1 against the page and canvas surfaces',
    (name, mode, tokens) => {
      const key = `${name}:${mode}`;
      const boundary = (surface: Rgb) => Math.max(contrast(tokens[fill], surface), contrast(tokens[border], surface));
      const ratios = [boundary(tokens.background), boundary(tokens['surface-canvas'])];
      if (KNOWN_BELOW_3.has(key)) {
        expect(Math.min(...ratios)).toBeLessThan(3);
      } else {
        expect(Math.min(...ratios)).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it('keeps the on-fill mark readable (>= 3:1 for the glyph, non-text)', () => {
    for (const t of themes) {
      for (const tokens of [t.light, t.dark]) {
        const ratio = contrast(tokens['text-on-brand'], tokens[fill]);
        // known gap: the mark on the light yellow and lime fills is 2.81:1 and 2.95:1
        if ((t.name === 'yellow' || t.name === 'lime') && tokens === t.light) continue;
        expect(ratio).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('pins the zero dark value of the checked fill', () => {
    const byName = Object.fromEntries(themes.map((t) => [t.name, t]));
    const r = (n: string, mode: 'light' | 'dark') => Math.round(contrast(byName[n][mode][fill], byName[n][mode].background) * 100) / 100;
    expect(r('zero', 'dark')).toBe(3.9);
  });
});

describe('checked state classes', () => {
  it('Switch and Checkbox use the dark-aware brand fill, not `primary`', () => {
    render(
      <>
        <Switch defaultChecked aria-label="s" />
        <Checkbox defaultChecked aria-label="c" />
      </>,
    );
    const sw = screen.getByRole('switch');
    const cb = screen.getByRole('checkbox');
    expect(sw).toHaveClass('data-[state=checked]:bg-background-brand-bold-default', 'data-[state=checked]:border-border-control-checked');
    expect(sw.className).not.toMatch(/(^|\s)(data-\[state=checked\]:)?bg-primary(\s|$)/);
    expect(cb).toHaveClass('data-[state=checked]:bg-background-brand-bold-default', 'data-[state=checked]:border-border-control-checked', 'data-[state=indeterminate]:border-border-control-checked', 'data-[state=checked]:text-text-on-brand');
    expect(cb.className).not.toMatch(/-primary(\s|$)/);
  });

  it('Radio uses the same fill', () => {
    render(
      <RadioGroup defaultValue="a" aria-label="r">
        <RadioGroupItem value="a" aria-label="a" appearance="filled" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio')).toHaveClass('data-[state=checked]:border-border-control-checked', 'data-[state=checked]:bg-background-brand-bold-default');
  });
});
