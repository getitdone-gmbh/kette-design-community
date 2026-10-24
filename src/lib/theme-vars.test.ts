import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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
