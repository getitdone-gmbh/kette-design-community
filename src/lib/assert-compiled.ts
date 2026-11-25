// Shared dead-class guard helper: compiles every class rendered under `root` through the real token preset.
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const NON_UTILITY = new Set<string>(['group', 'peer', 'dark', 'card']);
// Lucide icon classes and named group or peer markers (group/checkbox) generate no CSS of their own.
const NON_UTILITY_PATTERN = /^(lucide(-|$)|(group|peer)\/)/;

const unescapeSelector = (selector: string) =>
  selector
    .replace(/\\([0-9a-f]{1,6}) ?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');

const cssClassNames = (css: string): Set<string> => {
  const out = new Set<string>();
  for (const m of css.matchAll(/\.((?:\\[0-9a-f]{1,6} ?|\\.|[A-Za-z0-9_-])+)/gi)) out.add(unescapeSelector(m[1]));
  return out;
};

export const collectRenderedClasses = (root: ParentNode): string[] => {
  const found = new Set<string>();
  root.querySelectorAll('*').forEach((el) => {
    const cls = el.getAttribute('class');
    if (cls) cls.split(/\s+/).filter(Boolean).forEach((c) => found.add(c));
  });
  return [...found];
};

// Returns the classes (sorted) that produce no CSS rule. Expect an empty array.
export const missingCompiledClasses = async (classes: string[]): Promise<string[]> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require('../../tailwind.config.cjs');
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw: classes.join(' '), extension: 'html' }] }),
  ]).process('@tailwind components;\n@tailwind utilities;', { from: undefined });
  const compiled = cssClassNames(result.css);
  return [...new Set(classes)].filter((c) => !NON_UTILITY.has(c) && !NON_UTILITY_PATTERN.test(c) && !compiled.has(c)).sort();
};
