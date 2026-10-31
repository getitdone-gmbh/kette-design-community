// Copies the stories of every component in src/components/ui from a component-library-react checkout (npm run sync:stories -- <path>).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LIB = process.argv[2] && path.resolve(process.argv[2]);
if (!LIB || !fs.existsSync(path.join(LIB, '@/components/ui'))) {
  console.error('Usage: node scripts/sync-stories.mjs <path to component-library-react checkout>');
  process.exit(1);
}
const LIB_UI = path.join(LIB, '@/components/ui');
const UI = path.join(ROOT, 'src/components/ui');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const packages = new Set([...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies), ...Object.keys(pkg.peerDependencies)]);

const replaceOnce = (src, from, to, file) => {
  if (!src.includes(from)) throw new Error(`Patch for ${file} no longer matches: ${from.slice(0, 60)}`);
  return src.replace(from, to);
};

// Story specific cuts: parts that use components which are not in ui or packages ui does not ship.
const patches = {
  'progress-circle.stories.tsx': (src, file) => {
    src = replaceOnce(src, "import { ScoreRing } from './score-ring';\n", '', file);
    const start = src.indexOf('export const Score: Story');
    if (start < 0) throw new Error(`Patch for ${file} no longer matches: Score story`);
    const end = src.indexOf('\n};\n', start) + 4;
    return src.slice(0, start).replace(/\n+$/, '\n') + src.slice(end);
  },
  // The FAQ stories only render; the Storybook types here need args for the single/multiple union of Accordion.
  'accordion.stories.tsx': (src, file) => {
    for (const name of ['FaqLongQuestions390', 'FaqLongQuestions390Zero', 'FaqLongQuestions320Zero']) {
      src = replaceOnce(src, `export const ${name}: Story = {\n`, `export const ${name}: Story = {\n  args: {} as AccordionProps,\n`, file);
    }
    return src;
  },
  'drawer.stories.tsx': (src, file) => {
    src = replaceOnce(src, "import { Bar, BarChart, ResponsiveContainer } from 'recharts';\n", '', file);
    src = replaceOnce(src, "import { Button } from './button';", "import { Button } from './button';\nimport { Sparkline } from './chart';", file);
    const start = src.indexOf('<ResponsiveContainer');
    const end = src.indexOf('</ResponsiveContainer>') + '</ResponsiveContainer>'.length;
    if (start < 0 || end < start) throw new Error(`Patch for ${file} no longer matches: ResponsiveContainer`);
    return src.slice(0, start) + '<Sparkline aria-label="Goal per day" values={data.map((d) => d.goal)} width={384} height={120} className="w-full" />' + src.slice(end);
  },
};

// Example data on the shared fictional cast (docs/MAINTAINING.md, step 4). Longest matches first.
const cast = [
  ['@getitdone-gmbh/kette-design-enterprise', '@getitdone-gmbh/kette-design-community'],
  ['@getitdone-gmbh/component-library-react', '@getitdone-gmbh/kette-design-community'],
  ['sk_' + 'live_51Hx9a2b3c4d5e6f7g8h9i0j', 'demo_key_51Hx9a2b3c4d5e6f7g8h9i0j'],
  ['<AvatarInitials>OR</AvatarInitials>', '<AvatarInitials>LH</AvatarInitials>'],
  ['<AvatarFallback>KM</AvatarFallback>', '<AvatarFallback>EP</AvatarFallback>'],
  ["av('AM')", "av('AB')"],
  ["av('LS')", "av('ST')"],
  ["av('PB')", "av('TL')"],
  ["name: 'Acme Corp', sub: 'Berlin', initials: 'AC'", "name: 'Acme GmbH', sub: 'Berlin', initials: 'AG'"],
  ["name: 'Initech', sub: 'Hamburg', initials: 'IN'", "name: 'Hansa Logistik', sub: 'Hamburg', initials: 'HL'"],
  ["r.name === 'Initech'", "r.name === 'Hansa Logistik'"],
  ['value="Acme Group" initials="AG"', 'value="Example Studio GmbH" initials="ES"'],
  ["['Ada', 'Grace', 'Linus', 'Margaret']", "['Lena', 'Tobias', 'Anna', 'Jonas']"],
  ['Olivia Rhye', 'Lena Hartmann'],
  ['Hey Olivia', 'Hey Lena'],
  ['olivia' + '@example.com', 'lena.hartmann@example.com'],
  ['@olivia', '@lena'],
  ['value="olivia"', 'value="lena"'],
  ['Phoenix Baker', 'Tobias Lindner'],
  ['@phoenix', '@tobias'],
  ['value="phoenix"', 'value="tobias"'],
  ['Lana Steiner', 'Sarah Tran'],
  ['Anna Meier', 'Anna Becker'],
  ['Anna Berger', 'Anna Becker'],
  ['anna.berger@example.com', 'anna.becker@example.com'],
  ['Tom Weber', 'Jonas Weber'],
  ['Mia Schulz', 'Mia Hofmann'],
  ['Max Mustermann', 'Lena Hartmann'],
  ['Katherine Moss', 'Emily Park'],
  ['Ada Lovelace', 'Lena Hartmann'],
  ['Alan Turing', 'Tobias Lindner'],
  ['John Doe', 'Lena Hartmann'],
  ['Jane Smith', 'Tobias Lindner'],
  ['Bob Johnson', 'Anna Becker'],
  ['Alice Johnson', 'Jonas Weber'],
  ['Bob Smith', 'Emily Park'],
  ['Carol Williams', 'Sarah Tran'],
  ['David Brown', 'Mia Hofmann'],
  ['Eve Davis', 'Jonas Meier'],
  ['<TableCell>Alice</TableCell>', '<TableCell>Jonas</TableCell>'],
  ['john@example.com', 'lena.hartmann@example.com'],
  ['jane@example.com', 'tobias.lindner@example.com'],
  ['alice@example.com', 'jonas.weber@example.com'],
  ['bob@example.com', 'emily.park@example.com'],
  ['carol@example.com', 'sarah.tran@example.com'],
  ['david@example.com', 'mia.hofmann@example.com'],
  ['eve@example.com', 'jonas.meier@example.com'],
  ['Acme Corp', 'Acme GmbH'],
  ['DGTL', 'NWH'],
  ['+1 (408) 996\u20131010', '+49 30 12345678'],
];

const isStory = (f) => f.endsWith('.stories.tsx');
const resolves = (from, spec) => {
  const target = path.resolve(path.dirname(from), spec);
  return ['.tsx', '.ts', '/index.ts', '/index.tsx', ''].some((ext) => fs.existsSync(target + ext) && fs.statSync(target + ext).isFile());
};
const problems = (file, src) => {
  const out = [];
  // Only real import statements count (line start), not code samples inside strings.
  for (const [, spec] of src.matchAll(/^(?:(?:import|export)\b[^'"\n]*\bfrom|\}\s*from|import)\s*['"]([^'"]+)['"];?\s*$/gm)) {
    if (spec.startsWith('.')) {
      if (!resolves(file, spec)) out.push(spec);
    } else {
      const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      if (!packages.has(name)) out.push(spec);
    }
  }
  return out;
};

// Start from a clean state, so stories removed in the library disappear here as well.
for (const f of fs.readdirSync(UI, { recursive: true })) if (isStory(f)) fs.rmSync(path.join(UI, f));

const copied = [];
const skipped = [];
const assets = new Set();
for (const rel of fs.readdirSync(LIB_UI, { recursive: true }).filter(isStory).sort()) {
  const target = path.join(UI, rel);
  if (!fs.existsSync(path.dirname(target))) {
    skipped.push(`${rel} (folder not in ui)`);
    continue;
  }
  let src = fs.readFileSync(path.join(LIB_UI, rel), 'utf8');
  if (patches[rel]) src = patches[rel](src, rel);
  const missing = problems(target, src);
  if (missing.length) {
    skipped.push(`${rel} (imports ${missing.join(', ')})`);
    continue;
  }
  for (const [from, to] of cast) src = src.split(from).join(to);
  for (const [, asset] of src.matchAll(/['"(](\/img\/[^'")]+)/g)) assets.add(asset);
  fs.writeFileSync(target, src);
  copied.push(rel);
}

// Static images the stories reference, served from .storybook/public like in the library.
for (const asset of assets) {
  const from = path.join(LIB, '.storybook/public', asset);
  const to = path.join(ROOT, '.storybook/public', asset);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

console.log(`Copied ${copied.length} stories, ${assets.size} images.`);
if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join('\n  ')}`);
