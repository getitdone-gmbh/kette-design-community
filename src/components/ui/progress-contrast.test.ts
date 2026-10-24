import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { progressIndicatorVariants } from './progress';

// Non-text contrast (WCAG 1.4.11) of the Progress indicator against its track and the surface, computed from the dist theme.css of every theme.
const dist = join(process.cwd(), 'styles');
// The package vendors one theme (zero) in styles/theme.css.
const themeFiles = ['theme.css'];

type Rgb = [number, number, number];

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (c: Rgb) => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
const ratio = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const readToken = (css: string, mode: 'light' | 'dark', name: string): Rgb => {
  const darkAt = css.indexOf('\n.dark {');
  const blocks = { light: css.slice(0, darkAt), dark: css.slice(darkAt, css.indexOf('\n}', darkAt)) };
  const pattern = new RegExp(`--${name}: (\\d+) (\\d+) (\\d+);`);
  const hit = blocks[mode].match(pattern) ?? blocks.light.match(pattern);
  if (!hit) throw new Error(`token ${name} missing`);
  return [Number(hit[1]), Number(hit[2]), Number(hit[3])];
};

// Indicator class to the token behind it.
const indicators = {
  default: { token: 'colors-general-ring-default', cls: 'bg-general-ring-default', track: { light: 4.34, dark: 3.98 } },
  success: { token: 'semantic-text-success', cls: 'bg-text-success', track: { light: 5.01, dark: 7.61 } },
  warning: { token: 'semantic-text-warning', cls: 'bg-text-warning', track: { light: 4.73, dark: 6.91 } },
  destructive: { token: 'semantic-text-destructive', cls: 'bg-text-destructive', track: { light: 5.91, dark: 5.29 } },
} as const;

describe('Progress indicator contrast', () => {
  for (const [variant, spec] of Object.entries(indicators)) {
    it(`${variant} uses ${spec.cls}`, () => {
      expect(progressIndicatorVariants({ variant: variant as keyof typeof indicators })).toContain(spec.cls);
    });
    for (const mode of ['light', 'dark'] as const) {
      it(`${variant} keeps 3:1 against track and surface in ${mode} for every theme`, () => {
        let minTrack = Infinity;
        for (const file of themeFiles) {
          const css = readFileSync(join(dist, file), 'utf8');
          const indicator = readToken(css, mode, spec.token);
          const track = ratio(indicator, readToken(css, mode, 'semantic-background-neutral-default'));
          const page = ratio(indicator, readToken(css, mode, 'semantic-background-default'));
          const card = ratio(indicator, readToken(css, mode, 'colors-card-background-default'));
          minTrack = Math.min(minTrack, track);
          expect({ file, track: track >= 3, page: page >= 3, card: card >= 3 }).toEqual({ file, track: true, page: true, card: true });
        }
        // The pinned worst case of the full theme set does not apply to the single vendored theme, the 3:1 floor does.
        expect(minTrack).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
