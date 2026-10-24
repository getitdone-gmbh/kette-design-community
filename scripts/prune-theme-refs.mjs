// Runs after the theme is copied from kette-tokens (docs/MAINTAINING.md, step 3). Idempotent.
// Removes colour entries from tailwind/tailwind.theme.cjs whose variable styles/theme.css does not declare: component roles the zero theme does not define, whose class would compile to an invalid colour.
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles/theme.css', import.meta.url), 'utf8');
const twUrl = new URL('../tailwind/tailwind.theme.cjs', import.meta.url);
const declared = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

const removed = [];
const pruned = readFileSync(twUrl, 'utf8').replace(
  /^\s*'([^']+)': \(\{ opacityValue \}\) =>\n\s*opacityValue === undefined\n\s*\? `rgb\(var\((--[\w-]+)\)\)`\n\s*: `rgb\(var\(\2\) \/ \$\{opacityValue\}\)`,\n/gm,
  (entry, key, name) => (declared.has(name) ? entry : (removed.push(key), '')),
);
writeFileSync(twUrl, pruned);
console.log(`prune-theme-refs: ${removed.length} colours without a theme variable removed${removed.length ? `: ${removed.join(', ')}` : ''}`);
