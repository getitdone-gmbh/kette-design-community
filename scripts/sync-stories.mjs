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
  // The search input has min-w-0 since 0.39.0, so a w-full frame collapses to content width in the centred layout (KDC-DR-01). Skipped once the library ships the fixed frame.
  'command.stories.tsx': (src) => src.split("'w-full max-w-[456px] ").join("'w-[456px] max-w-full "),
  // ConfirmDialog stories (KDC-UX-02, KDC-UX-05): the AlertDialog story opens from its button with own state (library PR #183, commit 38b29b2, taken over when the source still has the open story), the scrim is found by its overlay attribute (the zero scrim has no .bg-overlay class), and a PlainDialog story shows role="dialog", which an outside click closes.
  'confirm-dialog.stories.tsx': (src, file) => {
    if (!src.includes('const AlertDialogExample')) {
      src = replaceOnce(src, "import { AlertTriangle } from 'lucide-react';\n", "import { AlertTriangle } from 'lucide-react';\nimport { useState } from 'react';\n", file);
      const start = src.indexOf('// An alert dialog (role alertdialog)');
      const end = src.indexOf('\n};\n', start) + 4;
      if (start < 0 || end < start) throw new Error(`Patch for ${file} no longer matches: AlertDialog story`);
      src = src.slice(0, start) + `const AlertDialogExample = (props: React.ComponentProps<typeof ConfirmDialog>) => {
  const [open, setOpen] = useState(false);
  return <ConfirmDialog {...props} open={open} onOpenChange={setOpen} />;
};

// An alert dialog (role alertdialog): it interrupts and asks for an answer. Focus starts on Cancel (the safe action) and stays trapped, a click outside does not close it, Escape does. It opens from its button; the play function checks that a click outside leaves it open.
export const AlertDialog: Story = {
  render: (args) => <AlertDialogExample {...args} />,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button');
    if (!trigger) throw new Error('No trigger button rendered');
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const dialog = document.querySelector('[role="alertdialog"]');
    if (!dialog) throw new Error('No alertdialog rendered');
    if (document.activeElement?.textContent !== 'Cancel') throw new Error(\`Focus is on "\${document.activeElement?.textContent}", expected Cancel\`);
    // A click on the scrim must not close an alert dialog
    const scrim = document.querySelector<HTMLElement>('.bg-overlay');
    scrim?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    scrim?.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!document.querySelector('[role="alertdialog"]')) throw new Error('A click outside closed the alert dialog');
  },
};
` + src.slice(end);
    }
    src = src.split("document.querySelector<HTMLElement>('.bg-overlay')").join("document.querySelector<HTMLElement>('[data-modal-overlay]')");
    if (src.includes('export const PlainDialog')) return src;
    const anchor = '// An alert dialog opened from a sheet';
    if (!src.includes(anchor)) throw new Error(`Patch for ${file} no longer matches: AlertDialogInSheet story`);
    const story = `// A plain dialog (role="dialog") for a confirmation that may be dismissed. It opens from its button like the alert dialog; the play function checks that a click outside closes it.
export const PlainDialog: Story = {
  args: { role: 'dialog' },
  render: (args) => <AlertDialogExample {...args} />,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button');
    if (!trigger) throw new Error('No trigger button rendered');
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!document.querySelector('[role="dialog"]')) throw new Error('No dialog rendered');
    if (document.querySelector('[role="alertdialog"]')) throw new Error('Rendered an alertdialog, expected role dialog');
    // A click on the scrim closes a plain dialog
    const scrim = document.querySelector<HTMLElement>('[data-modal-overlay]');
    if (!scrim) throw new Error('No scrim rendered');
    scrim.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    scrim.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (document.querySelector('[role="dialog"]')) throw new Error('A click outside did not close the dialog');
  },
};

`;
    return src.replace(anchor, story + anchor);
  },
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
  // TableProjectCell and TableFigureCell (library 0.36.0, project revenue) are not in this package, so the ProjectAndFigures story goes.
  'table-cells.stories.tsx': (src, file) => {
    src = replaceOnce(src, ', TableProjectCell, TableFigureCell }', ' }', file);
    const start = src.indexOf('// Project revenue (ZERO-626)');
    if (start < 0) throw new Error(`Patch for ${file} no longer matches: ProjectAndFigures story`);
    const end = src.indexOf('\n};\n', start) + 4;
    return src.slice(0, start).replace(/\n+$/, '\n') + src.slice(end);
  },
  // MaterialIcon is not in this package; the matching lucide glyph keeps the icon and label story.
  'toggle-group.stories.tsx': (src, file) => {
    src = replaceOnce(src, "import { MaterialIcon } from '../icons/Icon';\n", "import { LayoutDashboard } from 'lucide-react';\n", file);
    return src.split('<MaterialIcon name="dashboard" ').join('<LayoutDashboard ');
  },
  // The story named Error shadows the global Error inside this file.
  'sheet-zero.stories.tsx': (src, file) => replaceOnce(src, "throw new Error('Focus did not move into the push sheet')", "throw new globalThis.Error('Focus did not move into the push sheet')", file),
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

// ONLY=<file>[,<file>] syncs just these story files and leaves the others as they are (for a fix commit of the library that is ported as a diff).
const only = process.env.ONLY?.split(',');
// Start from a clean state, so stories removed in the library disappear here as well.
if (!only) for (const f of fs.readdirSync(UI, { recursive: true })) if (isStory(f)) fs.rmSync(path.join(UI, f));

const copied = [];
const skipped = [];
const assets = new Set();
// Stories of components that live outside ui in the library but in ui here: library path (from @/components) to the file name in ui, imports rewritten to ui.
const extra = {
  'compositions/dialog/confirm-dialog.stories.tsx': 'confirm-dialog.stories.tsx',
};
const sources = [
  ...fs.readdirSync(LIB_UI, { recursive: true }).filter(isStory).sort().map((rel) => [rel, path.join(LIB_UI, rel), (src) => src]),
  ...Object.entries(extra).map(([from, rel]) => [rel, path.join(LIB, '@/components', from), (src) => src.split("'../../ui/").join("'./")]),
];
for (const [rel, from, rewrite] of sources.filter(([rel]) => !only || only.includes(rel))) {
  const target = path.join(UI, rel);
  if (!fs.existsSync(path.dirname(target))) {
    skipped.push(`${rel} (folder not in ui)`);
    continue;
  }
  if (!fs.existsSync(from)) {
    skipped.push(`${rel} (not in the library)`);
    continue;
  }
  let src = rewrite(fs.readFileSync(from, 'utf8'));
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
