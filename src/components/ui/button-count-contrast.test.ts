import { contrast, loadThemes, type Rgb } from '../../lib/token-contrast';

const mix = (fill: Rgb, ink: Rgb, alpha: number): Rgb => [0, 1, 2].map((i) => fill[i] * (1 - alpha) + ink[i] * alpha) as Rgb;

// The count on a filled button is the on-fill text colour at 5 percent over the fill. A label that clears 5:1 on its fill keeps 4.5:1 (WCAG 1.4.3) on the pill, a weaker label loses at most 0.5 of its ratio, in every theme and mode. Labels that are below AA on their own fill are a token issue outside this test.
const PAIRS: Array<[string, string, string]> = [
  ['default', 'button-background-default', 'button-foreground-default'],
  ['primary', 'button-background-primary-default', 'button-foreground-primary-default'],
  ['destructive', 'background-destructive-bold-default', 'text-on-destructive'],
];

describe('Filled button count contrast', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`keeps the count pill readable on the filled button in ${mode}`, () => {
      const failing: string[] = [];
      for (const theme of loadThemes()) {
        for (const [name, fillKey, inkKey] of PAIRS) {
          const fill = theme[mode][fillKey];
          const ink = theme[mode][inkKey];
          if (!fill || !ink) continue;
          const own = contrast(ink, fill);
          const value = contrast(ink, mix(fill, ink, 0.05));
          if (own >= 5 ? value < 4.5 : own - value > 0.5) failing.push(`${theme.name} ${name} own ${own.toFixed(2)} pill ${value.toFixed(2)}`);
        }
      }
      expect(failing).toEqual([]);
    });
  }
});
