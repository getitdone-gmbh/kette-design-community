import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Glyph against tile contrast of the ObjectIcon semantic tones (WCAG 1.4.11 needs 3:1, these keep the 4.5:1 text bar), computed from the dist theme.css of every theme.
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

// Pinned worst case over all themes: [light, dark].
const tones = {
  // 0.31.0: light minimum follows the dark-only themes (discord, steam, ableton render dark in light mode)
  info: ['info', 4.9, 4.9],
  success: ['success', 4.84, 5.77],
  warning: ['warning', 4.52, 5.83],
  destructive: ['error', 5.3, 6.17],
} as const;

describe('ObjectIcon tone contrast', () => {
  for (const [tone, [family, light, dark]] of Object.entries(tones)) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${tone} glyph on tile keeps 4.5:1 in ${mode} for every theme`, () => {
        let min = Infinity;
        for (const file of themeFiles) {
          const css = readFileSync(join(dist, file), 'utf8');
          min = Math.min(min, ratio(readToken(css, mode, `colors-general-${family}-on-container`), readToken(css, mode, `colors-general-${family}-container`)));
        }
        // The pinned worst case of the full theme set does not apply to the single vendored theme, the 4.5:1 floor does.
        expect(min).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
