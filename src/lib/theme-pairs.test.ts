import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BADGE_PAIRS, HEADERS, PAIRS, PAIR_VARS, STATUS_PAIRS, blockVars, ratio } from '../../scripts/theme-pairs.mjs';

// Port of the kette-tokens gates check:pairs and check:scopes for the one theme this package ships (styles/theme.css, zero), plus the status pairs.
type Rgb = [number, number, number];
type Vars = Record<string, Rgb>;
type Pair = [string, string, string, string?];

const css = readFileSync(join(process.cwd(), 'styles/theme.css'), 'utf8');
const root: Vars = blockVars(css, HEADERS.root);
const dark: Vars = blockVars(css, HEADERS.dark);
const media: Vars = blockVars(css, HEADERS.media);
const paper: Vars = blockVars(css, HEADERS.paper);
const pairs = PAIRS as Pair[];
const statusPairs = STATUS_PAIRS as Pair[];
const contrast = ratio as (a: Rgb, b: Rgb) => number;
const BLOCKS: Array<[string, Vars]> = [
  ['light', root],
  ['.dark', dark],
  ['OS dark', media],
  ['paper', paper],
];

// Mode contexts: light, html.dark, OS dark without html.light, and the paper scope (light values on the document surface) inside a dark page.
const CONTEXTS: Array<[string, Vars]> = [
  ['light', root],
  ['.dark', { ...root, ...dark }],
  ['OS dark', { ...root, ...media }],
  ['paper in .dark', { ...root, ...dark, ...paper }],
];

const low = (vars: Vars, list: Pair[]) =>
  list.flatMap(([label, fill, text]) => {
    if (!(fill in vars) || !(text in vars)) return [];
    const r = contrast(vars[fill], vars[text]);
    return r < 4.5 ? [`${label}: ${r.toFixed(2)}:1 (${vars[fill].join(' ')} / ${vars[text].join(' ')})`] : [];
  });

describe('theme.css blocks', () => {
  it.each(BLOCKS)('has the %s block', (_name, vars) => {
    expect(Object.keys(vars).length).toBeGreaterThan(100);
  });
});

describe('fill/text pairs (kette-tokens check:pairs)', () => {
  it('sets each side of a pair only together with its partner, in every block', () => {
    const errors = BLOCKS.flatMap(([name, vars]) =>
      pairs.flatMap(([label, fill, text, shared]) => [
        ...(fill in vars && !(text in vars) ? [`${name} ${label}: ${fill} without ${text}`] : []),
        ...(text in vars && !(fill in vars) && !shared ? [`${name} ${label}: ${text} without ${fill}`] : []),
      ]),
    );
    expect(errors).toEqual([]);
  });

  it('pins every pair variable of the light block in both dark blocks', () => {
    const missing = [...(PAIR_VARS as Set<string>)].filter((v) => v in root).flatMap((v) => [['.dark', dark], ['OS dark', media]].filter(([, b]) => !(v in (b as Vars))).map(([n]) => `${n} ${v}`));
    expect(missing).toEqual([]);
  });

  it('defines the destructive button text in every block', () => {
    for (const [, vars] of BLOCKS) expect(vars['--colors-button-foreground-destructive']).toBeDefined();
  });

  it.each(CONTEXTS)('every pair holds 4.5:1 in %s', (_name, vars) => {
    expect(low(vars, pairs)).toEqual([]);
  });

  it.each(CONTEXTS)('every status pair holds 4.5:1 in %s', (_name, vars) => {
    expect(low(vars, statusPairs)).toEqual([]);
  });

  it('checks the status pairs the theme defines', () => {
    expect(statusPairs.filter(([, fill, text]) => fill in root && text in root).length).toBeGreaterThanOrEqual(20);
  });
});

describe('scopes (kette-tokens check:scopes)', () => {
  it('resolves every variable of the paper scope to its light value', () => {
    expect(Object.keys(paper).filter((k) => k in root && paper[k].join(' ') !== root[k].join(' '))).toEqual([]);
  });

  it('keeps the default text at 4.5:1 or more on the paper surface', () => {
    const scope = { ...root, ...paper };
    const bg = scope['--semantic-surface-paper'];
    expect(bg).toBeDefined();
    for (const v of ['--semantic-text-default', '--colors-utility-foreground', '--semantic-text-on-paper']) {
      if (scope[v]) expect(contrast(scope[v], bg), v).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('shows every badge fill on the paper surface with text of 4.5:1 or more', () => {
    const scope = { ...root, ...paper };
    const bg = scope['--semantic-surface-paper'];
    const errors = (BADGE_PAIRS as Array<[string, string]>).flatMap(([fill, text]) => {
      const f = scope[fill];
      const t = scope[text];
      if (!f || !t) return [];
      return [
        ...(Math.max(...f.map((v, i) => Math.abs(v - bg[i]))) < 12 ? [`${fill} is not visible on the paper surface`] : []),
        ...(contrast(f, t) < 4.5 ? [`${text} on ${fill}: ${contrast(f, t).toFixed(2)}:1`] : []),
      ];
    });
    expect(errors).toEqual([]);
  });

  it('gives OS dark the same value as .dark for every variable .dark sets', () => {
    expect(Object.keys(dark).filter((k) => !media[k] || media[k].join(' ') !== dark[k].join(' '))).toEqual([]);
  });
});
