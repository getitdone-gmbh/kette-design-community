import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HEADERS, PAIR_VARS, STANDALONE_CONTEXTS, blockDecls, resolveAlone } from '../../scripts/theme-pairs.mjs';

// Every CSS variable the Tailwind config references must be declared in styles/theme.css, or the class compiles to an invalid value.
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const declared = new Set([...read('styles/theme.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
// Set at runtime by Radix, not by the theme.
const RUNTIME = /^--radix-/;

describe.each(['tailwind/tailwind.theme.cjs', 'tailwind/tailwind.preset.cjs', 'tailwind/preset.cjs'])('%s', (file) => {
  it('references only variables that styles/theme.css declares', () => {
    const refs = new Set([...read(file).matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
    const missing = [...refs].filter((v) => !declared.has(v) && !RUNTIME.test(v)).sort();
    expect(missing).toEqual([]);
  });
});

describe('tailwind/tailwind.theme.cjs', () => {
  it('resolves every colour to a declared variable', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { theme } = require(join(process.cwd(), 'tailwind/tailwind.theme.cjs'));
    const missing: string[] = [];
    for (const [key, value] of Object.entries(theme.extend.colors as Record<string, unknown>)) {
      const css = typeof value === 'function' ? value({}) : String(value);
      for (const m of String(css).matchAll(/var\((--[\w-]+)/g)) if (!declared.has(m[1])) missing.push(`${key}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
});

// styles/theme.css is shipped alone (no generic kette-tokens theme.css underneath), so it must be self-contained: port of kette-tokens check:standalone (5.24.0) for this theme.
describe('styles/theme.css alone', () => {
  type Decls = Record<string, string>;
  const css = read('styles/theme.css');
  const blocks = Object.fromEntries(Object.entries(HEADERS).map(([k, h]) => [k, blockDecls(css, h)])) as Record<'root' | 'dark' | 'media' | 'paper', Decls>;
  // References without a fallback; runtime variables (--radix-*, --tw-*) are not theme variables.
  const refs = new Set(
    ['tailwind/tailwind.theme.cjs', 'tailwind/tailwind.preset.cjs', 'tailwind/preset.cjs'].flatMap((file) =>
      [...read(file).matchAll(/var\((--[\w-]+)\s*([,)])/g)].filter((m) => m[2] === ')' && !/^--(radix|tw)-/.test(m[1])).map((m) => m[1]),
    ),
  );
  const pairVars = [...(PAIR_VARS as Set<string>)];
  const SCOPES: Array<[string, Decls]> = [
    ['.dark', blocks.dark],
    ['OS dark', blocks.media],
    ['paper scope', blocks.paper],
  ];

  it('finds the Tailwind references and the 84 variables of the 55 pairs', () => {
    expect(refs.size).toBeGreaterThan(800);
    expect(pairVars.length).toBe(84);
  });

  it('declares every Tailwind-referenced variable in :root', () => {
    expect([...refs].filter((v) => !(v in blocks.root)).sort()).toEqual([]);
  });

  it('declares every pair variable in :root', () => {
    expect(pairVars.filter((v) => !(v in blocks.root)).sort()).toEqual([]);
  });

  it.each(SCOPES)('declares every pair variable in the %s block', (_name, block) => {
    expect(pairVars.filter((v) => !(v in block)).sort()).toEqual([]);
  });

  it.each(SCOPES.slice(1))('declares every variable of the .dark block in the %s block', (_name, block) => {
    expect(Object.keys(blocks.dark).filter((v) => !(v in block)).sort()).toEqual([]);
  });

  it.each(STANDALONE_CONTEXTS.map((c) => [c.name, c] as const))('resolves every Tailwind-referenced and pair variable in %s', (_name, c) => {
    const vars = resolveAlone(blocks, c.cls, c.os, c.surface) as Decls;
    expect([...refs, ...pairVars].filter((v) => !(v in vars)).sort()).toEqual([]);
  });
});
