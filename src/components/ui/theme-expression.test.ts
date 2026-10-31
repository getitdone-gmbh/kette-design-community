import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Theme expression roles (kette-tokens 5.26.0): every role the theme declares is consumed by a component, so a theme's look comes from tokens alone.
// Port of the library test: the roles come from the vendored zero theme (styles/theme.css) instead of the token package.
const css = readFileSync(join(__dirname, '../../../styles/theme.css'), 'utf8');
const KINDS = ['image', 'bevel', 'frame', 'glow', 'case', 'tracking', 'text-shadow', 'numeric', 'indicator'];
const FONT_ROLES = ['--font-display', '--font-button-filled', '--font-tab', '--font-data'];
const declared = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const roleVars = [...[...declared].filter((v) => KINDS.some((k) => v.startsWith(`--${k}-`))), ...FONT_ROLES].sort();

const uiDir = __dirname;
const sources = [
  ...readdirSync(uiDir).filter((f) => f.endsWith('.tsx') && !f.includes('.test.') && !f.includes('.stories.')).map((f) => readFileSync(join(uiDir, f), 'utf8')),
  readFileSync(join(uiDir, '../../lib/recipes.ts'), 'utf8'),
].join('\n');

describe('theme expression roles', () => {
  it('the theme declares the roles', () => {
    expect(roleVars.length).toBeGreaterThan(90);
    FONT_ROLES.forEach((v) => expect(declared.has(v)).toBe(true));
  });
  it.each(roleVars)('%s is used by a component', (cssVar) => {
    expect(sources.includes(`var(${cssVar})`)).toBe(true);
  });
});
