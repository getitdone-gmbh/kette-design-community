// Fill/text pair lists and the colour maths shared by scripts/repair-theme.mjs and src/lib/theme-pairs.test.ts.

// Pairs that must travel together, from kette-tokens scripts/color-pairs.js (check:pairs). 'shared' marks a fill that reuses the text of another pair.
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
];
export const PAIR_VARS = new Set(PAIRS.flatMap(([, fill, text]) => [fill, text]));

// Status and brand fills with their text roles (text on green, orange, red, blue). kette-tokens check:pairs does not list them yet.
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
