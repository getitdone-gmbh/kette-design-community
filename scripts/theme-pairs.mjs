// Fill/text pair lists and the colour maths shared by src/lib/theme-pairs.test.ts and src/lib/theme-vars.test.ts.

// Pairs that must travel together, the 51 pairs of kette-tokens scripts/color-pairs.js (check:pairs, check:standalone, 5.23.2). 'shared' marks a fill that reuses the text of another pair.
export const PAIRS = [
  ['button default', '--colors-button-background-default', '--colors-button-foreground-default'],
  ['button hover', '--colors-button-background-hover', '--colors-button-foreground-hover'],
  ['button primary', '--colors-button-background-primary-default', '--colors-button-foreground-primary-default'],
  ['button primary hover', '--colors-button-background-primary-hover', '--colors-button-foreground-primary-default', 'shared'],
  ['button destructive', '--colors-button-background-destructive', '--colors-button-foreground-destructive'],
  ['button destructive hover', '--colors-button-background-destructive-hover', '--colors-button-foreground-destructive', 'shared'],
  ['brand fill', '--colors-general-brand-default', '--colors-general-brand-on-fill'],
  ['brand active', '--colors-general-brand-active', '--colors-general-brand-on-fill', 'shared'],
  ['brand hover', '--colors-general-brand-hover', '--colors-general-brand-on-hover'],
  ['brand on', '--colors-general-brand-default', '--colors-general-brand-on', 'shared'],
  ['brand container', '--colors-general-brand-container', '--colors-general-brand-on-container'],
  ['brand bold', '--semantic-background-brand-bold-default', '--semantic-text-on-brand'],
  ['brand bold hover', '--semantic-background-brand-bold-hover', '--semantic-text-on-brand', 'shared'],
  ['brand bold active', '--semantic-background-brand-bold-active', '--semantic-text-on-brand', 'shared'],
  ['brand bold icon', '--semantic-background-brand-bold-default', '--semantic-icon-on-brand', 'shared'],
  ['utility primary', '--colors-primary', '--colors-utility-primary-foreground'],
  ['utility destructive', '--colors-utility-destructive', '--colors-utility-destructive-foreground'],
  ['background destructive', '--colors-background-destructive', '--colors-foreground-destructive'],
  ['background accent', '--colors-background-accent', '--colors-foreground-accent'],
  ['utility accent', '--colors-utility-accent', '--colors-utility-accent-foreground'],
  ['utility secondary', '--colors-utility-secondary', '--colors-utility-secondary-foreground'],
  ['utility card', '--colors-utility-card', '--colors-utility-card-foreground'],
  ['utility popover', '--colors-utility-popover', '--colors-utility-popover-foreground'],
  ['utility muted', '--colors-utility-muted', '--colors-utility-muted-foreground'],
  ['sidebar', '--colors-sidebar-background', '--colors-sidebar-foreground'],
  ['sidebar muted', '--colors-sidebar-background', '--colors-sidebar-muted-foreground', 'shared'],
  ['sidebar accent', '--colors-sidebar-accent', '--colors-sidebar-accent-foreground'],
  ['success bold', '--semantic-background-success-bold-default', '--semantic-text-on-success'],
  ['success bold hover', '--semantic-background-success-bold-hover', '--semantic-text-on-success', 'shared'],
  ['success bold active', '--semantic-background-success-bold-active', '--semantic-text-on-success', 'shared'],
  ['success general', '--colors-general-success-default', '--colors-general-success-on'],
  ['success general hover', '--colors-general-success-hover', '--colors-general-success-on', 'shared'],
  ['success general active', '--colors-general-success-active', '--colors-general-success-on', 'shared'],
  ['warning bold', '--semantic-background-warning-bold-default', '--semantic-text-on-warning'],
  ['warning bold hover', '--semantic-background-warning-bold-hover', '--semantic-text-on-warning', 'shared'],
  ['warning bold active', '--semantic-background-warning-bold-active', '--semantic-text-on-warning', 'shared'],
  ['warning general', '--colors-general-warning-default', '--colors-general-warning-on'],
  ['warning general hover', '--colors-general-warning-hover', '--colors-general-warning-on', 'shared'],
  ['warning general active', '--colors-general-warning-active', '--colors-general-warning-on', 'shared'],
  ['info bold', '--semantic-background-info-bold-default', '--semantic-text-on-info'],
  ['info bold hover', '--semantic-background-info-bold-hover', '--semantic-text-on-info', 'shared'],
  ['info bold active', '--semantic-background-info-bold-active', '--semantic-text-on-info', 'shared'],
  ['info general', '--colors-general-info-default', '--colors-general-info-on'],
  ['info general hover', '--colors-general-info-hover', '--colors-general-info-on', 'shared'],
  ['info general active', '--colors-general-info-active', '--colors-general-info-on', 'shared'],
  ['destructive bold', '--semantic-background-destructive-bold-default', '--semantic-text-on-destructive'],
  ['destructive bold hover', '--semantic-background-destructive-bold-hover', '--semantic-text-on-destructive', 'shared'],
  ['destructive bold active', '--semantic-background-destructive-bold-active', '--semantic-text-on-destructive', 'shared'],
  ['destructive general', '--colors-general-destructive-default', '--colors-general-destructive-on'],
  ['destructive general hover', '--colors-general-destructive-hover', '--colors-general-destructive-on', 'shared'],
  ['destructive general active', '--colors-general-destructive-active', '--colors-general-destructive-on', 'shared'],
];
export const PAIR_VARS = new Set(PAIRS.flatMap(([, fill, text]) => [fill, text]));

// Status and brand fills with their text roles (text on green, orange, red, blue), wider than the kette-tokens list: containers, on-fill, brand and subtle fills.
const STATUS = ['success', 'warning', 'error', 'info', 'destructive', 'brand'];
export const STATUS_PAIRS = [
  ...[...STATUS, 'secondary'].map((s) => [`${s} on fill`, `--colors-general-${s}-default`, `--colors-general-${s}-on`]),
  ...STATUS.map((s) => [`${s} container`, `--colors-general-${s}-container`, `--colors-general-${s}-on-container`]),
  ...['error', 'destructive'].map((s) => [`${s} on-fill`, `--colors-general-${s}-default`, `--colors-general-${s}-on-fill`]),
  ...['success', 'warning', 'info', 'destructive', 'brand'].flatMap((s) =>
    ['default', 'hover', 'active'].map((state) => [`${s} bold ${state}`, `--semantic-background-${s}-bold-${state}`, `--semantic-text-on-${s}`]),
  ),
  ...['brand', 'destructive', 'info'].map((s) => [`${s} subtle`, `--semantic-background-${s}-subtle`, `--semantic-text-${s}-on-subtle`]),
];

// Badge and status chip pairs on the paper surface, from kette-tokens scripts/check-scopes.js.
export const BADGE_PAIRS = [
  ['--colors-badge-background-subtle-default', '--colors-badge-foreground-subtle-default'],
  ['--colors-general-info-container', '--colors-general-info-on-container'],
  ['--colors-general-success-container', '--colors-general-success-on-container'],
  ['--colors-general-warning-container', '--colors-general-warning-on-container'],
  ['--colors-general-error-container', '--colors-general-error-on-container'],
  ['--semantic-background-info-subtle', '--semantic-text-info-on-subtle'],
  ['--semantic-background-destructive-subtle', '--semantic-text-destructive-on-subtle'],
];

// Selector headers of the colour blocks in styles/theme.css.
export const HEADERS = {
  root: ':root {',
  dark: '\n.dark {',
  media: '@media (prefers-color-scheme: dark) {\n  :root:not(.light) {',
  paper: '\n.light,\n[data-document-surface],\n[data-surface="paper"] {',
};

// Start and end offset of a block, or null.
export const blockRange = (css, header) => {
  const start = css.indexOf(header);
  return start === -1 ? null : [start, css.indexOf('}', start)];
};

// All declarations of a block (name to raw value), also non-colour variables.
export const blockDecls = (css, header) => {
  const range = blockRange(css, header);
  if (!range) return {};
  const vars = {};
  for (const m of css.slice(...range).matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
};

// RGB triplet variables of a block.
export const blockVars = (css, header) => {
  const range = blockRange(css, header);
  if (!range) return {};
  const vars = {};
  for (const m of css.slice(...range).matchAll(/(--[\w-]+):\s*(\d+) (\d+) (\d+);/g)) vars[m[1]] = [+m[2], +m[3], +m[4]];
  return vars;
};

const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [p, q] = [lum(a), lum(b)];
  return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05);
};

// Effective variables of the theme loaded alone, on the html element or on a paper surface inside it, for html class none/light/dark and OS light/dark (kette-tokens check:standalone).
export const resolveAlone = (blocks, cls, os, surface) => ({
  ...blocks.root,
  ...(os === 'dark' && cls !== 'light' ? blocks.media : {}),
  ...(cls === 'dark' ? blocks.dark : {}),
  ...(surface ? blocks.paper : {}),
});

// The 12 cascade contexts of check:standalone.
export const STANDALONE_CONTEXTS = ['none', 'light', 'dark'].flatMap((cls) =>
  ['light', 'dark'].flatMap((os) => [false, true].map((surface) => ({ cls, os, surface, name: `html.${cls}, OS ${os}${surface ? ', paper surface' : ''}` }))),
);
