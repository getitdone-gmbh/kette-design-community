// Generates registry/ sources (alias imports) and registry.json for the shadcn CLI from src/.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE_URL = process.env.REGISTRY_URL ?? 'https://zero-design.itdone.de/r';
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const npmDeps = new Set(Object.keys(pkg.dependencies));
// Pin the versions the code was built and tested against, otherwise the shadcn CLI installs the latest major (e.g. react-day-picker 9 instead of 8).
const withVersion = (name) => (pkg.dependencies[name] ? `${name}@${pkg.dependencies[name]}` : name);
const itemNameOfDir = (dir) => (dir === 'card' ? 'card-default' : dir);
// Items exported from the barrel count as components, everything else is a helper.
const COMPONENTS = new Set(
  fs
    .readFileSync(path.join(ROOT, 'src/index.ts'), 'utf8')
    .split('\n')
    .map((line) => line.match(/components\/ui\/([\w-]+)(\/)?/))
    .filter(Boolean)
    .map(([, name, sub]) => (sub ? itemNameOfDir(name) : name)),
);

const outDir = path.join(ROOT, 'registry');
fs.rmSync(outDir, { recursive: true, force: true });

const items = [];
const describe = (name) => name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Tests, test helpers and stories stay in the repo, they are not part of the registry.
const isSource = (f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f) && !['assert-compiled.ts', 'render-default-look.tsx', 'token-contrast.ts'].includes(path.basename(f));

// Flat files are one item each, a sub folder (stepper/, phone-input/, ...) is one item with all of its files.
const collect = (dir, kind) =>
  fs.readdirSync(path.join(ROOT, 'src', dir), { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      const files = fs.readdirSync(path.join(ROOT, 'src', dir, entry.name)).filter(isSource).map((f) => `${entry.name}/${f}`);
      return files.length ? [{ dir, kind, files, name: itemNameOfDir(entry.name), sub: entry.name }] : [];
    }
    return isSource(entry.name) ? [{ dir, kind, files: [entry.name], name: entry.name.replace(/\.tsx?$/, '') }] : [];
  });

// Registry item that owns a target path inside src/ (`components/ui/stepper/step` belongs to `stepper`).
const itemOf = (target) => {
  const rel = path.relative('components/ui', target);
  if (!target.startsWith('lib') && rel.includes('/')) return itemNameOfDir(rel.split('/')[0]);
  return path.basename(target);
};

for (const { dir, kind, files, name, sub } of [...collect('components/ui', 'ui'), ...collect('lib', 'lib')]) {
  const internal = new Set();
  const external = new Set();
  const type = kind === 'ui' ? 'registry:ui' : 'registry:lib';
  for (const file of files) {
    const fileDir = path.dirname(path.join(dir, file));
    const src = fs.readFileSync(path.join(ROOT, 'src', dir, file), 'utf8');
    // Relative imports become shadcn aliases, so the CLI maps them to the consumer's components.json. Imports inside one folder item stay relative.
    const rewritten = src.replace(/((?:from|import)\s*\(?\s*['"])([^'"]+)(['"])/g, (all, pre, spec, post) => {
      if (spec.startsWith('.')) {
        const target = path.normalize(path.join(fileDir, spec));
        const owner = itemOf(target);
        if (sub && owner === name) return all;
        internal.add(owner);
        const alias = target.startsWith('lib') ? `@/lib/${path.relative('lib', target)}` : `@/components/ui/${path.relative('components/ui', target)}`;
        return `${pre}${alias}${post}`;
      }
      const pkgName = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      if (npmDeps.has(pkgName)) external.add(pkgName);
      return all;
    });
    const target = path.join(outDir, kind, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, rewritten);
  }
  const isComponent = COMPONENTS.has(name);
  items.push({
    name,
    type,
    title: describe(name),
    description: isComponent ? `${describe(name)} from the Get IT Done design system.` : `Helper used by the Get IT Done components.`,
    dependencies: [...external].sort().map(withVersion),
    registryDependencies: [...internal].filter((d) => d !== name).sort().map((d) => `${BASE_URL}/${d}.json`).concat(`${BASE_URL}/theme.json`).filter((d) => !(name === 'utils' && d.endsWith('/theme.json'))),
    files: files.map((file) => ({ path: `registry/${kind}/${file}`, type })),
  });
}

// Theme: CSS variables, animations and the Tailwind 3 preset, copied as plain files.
fs.mkdirSync(path.join(outDir, 'theme'), { recursive: true });
for (const f of ['theme.css', 'animation.css', 'document-surface.css']) fs.copyFileSync(path.join(ROOT, 'styles', f), path.join(outDir, 'theme', f));
for (const f of ['preset.cjs', 'tailwind.preset.cjs', 'tailwind.theme.cjs']) fs.copyFileSync(path.join(ROOT, 'tailwind', f), path.join(outDir, 'theme', f));
items.unshift({
  name: 'theme',
  type: 'registry:style',
  title: 'zero theme',
  description: 'CSS variables (light and dark), animations and the Tailwind CSS 3 preset of the Get IT Done design system. Import styles/getitdone/theme.css, animation.css and document-surface.css in your global CSS and add tailwind/getitdone/preset.cjs to presets.',
  dependencies: ['tailwindcss-animate', 'tailwindcss-themer', '@tailwindcss/container-queries'].map(withVersion),
  files: [
    { path: 'registry/theme/theme.css', type: 'registry:file', target: 'styles/getitdone/theme.css' },
    { path: 'registry/theme/animation.css', type: 'registry:file', target: 'styles/getitdone/animation.css' },
    { path: 'registry/theme/document-surface.css', type: 'registry:file', target: 'styles/getitdone/document-surface.css' },
    { path: 'registry/theme/preset.cjs', type: 'registry:file', target: 'tailwind/getitdone/preset.cjs' },
    { path: 'registry/theme/tailwind.preset.cjs', type: 'registry:file', target: 'tailwind/getitdone/tailwind.preset.cjs' },
    { path: 'registry/theme/tailwind.theme.cjs', type: 'registry:file', target: 'tailwind/getitdone/tailwind.theme.cjs' },
  ],
});

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'getitdone',
  homepage: 'https://zero-design.itdone.de',
  items,
};
fs.writeFileSync(path.join(ROOT, 'registry.json'), JSON.stringify(registry, null, 2) + '\n');
console.log(`registry.json: ${items.length} items (${COMPONENTS.size} exported modules)`);
