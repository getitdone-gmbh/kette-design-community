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
  // 0.33.0: the warning family is amber (kette-tokens 5.28.0), the light worst case rises from 4.52
  warning: ['warning', 5.84, 5.83],
  destructive: ['error', 5.3, 6.17],
} as const;

// Add-on and brand tones read a fill role and its on role: [fill token, on token]
const addonTones = {
  teal: ['colors-product-backoffice-default', 'colors-product-backoffice-on'],
  strong: ['semantic-surface-inverse-static', 'semantic-text-on-inverse-static'],
  muted: ['colors-product-record-default', 'colors-product-record-on'],
} as const;

// The glyph is a graphic (WCAG 1.4.11, 3:1). Teal measures 3.95:1 (the prototype teal #0d9488 with a white glyph is 3.74:1), the other two keep the 4.5:1 text bar.
const addonMin = { teal: 3, strong: 4.5, muted: 4.5 } as const;

describe('ObjectIcon add-on tone contrast', () => {
  for (const [tone, [fill, on]] of Object.entries(addonTones)) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${tone} glyph on tile keeps ${addonMin[tone as keyof typeof addonMin]}:1 in ${mode} for every theme`, () => {
        let min = Infinity;
        for (const file of themeFiles) {
          const css = readFileSync(join(dist, file), 'utf8');
          min = Math.min(min, ratio(readToken(css, mode, on), readToken(css, mode, fill)));
        }
        expect(min).toBeGreaterThanOrEqual(addonMin[tone as keyof typeof addonMin]);
      });
    }
  }
});

const hue = (c: Rgb) => {
  const [r, g, b] = c.map((v) => v / 255);
  const d = Math.max(r, g, b) - Math.min(r, g, b);
  if (!d) return 0;
  const h = Math.max(r, g, b) === r ? ((g - b) / d) % 6 : Math.max(r, g, b) === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

describe('ObjectIcon add-on tone identity', () => {
  it('teal stays teal and strong stays dark in every theme and mode', () => {
    const off: string[] = [];
    for (const file of themeFiles) {
      const css = readFileSync(join(dist, file), 'utf8');
      for (const mode of ['light', 'dark'] as const) {
        const teal = readToken(css, mode, 'colors-product-backoffice-default');
        if (hue(teal) < 160 || hue(teal) > 190) off.push(`${file} ${mode} teal hue ${Math.round(hue(teal))}`);
        const strong = readToken(css, mode, 'semantic-surface-inverse-static');
        if ((strong[0] + strong[1] + strong[2]) / 3 > 80) off.push(`${file} ${mode} strong ${strong.join(',')}`);
      }
    }
    expect(off).toEqual([]);
  });
});

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
