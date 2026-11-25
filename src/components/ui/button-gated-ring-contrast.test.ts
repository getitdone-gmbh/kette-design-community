import { contrast, loadThemes, type Rgb } from '../../lib/token-contrast';

const GATED_FOCUS_OPACITY = 0.55;

const mix = (page: Rgb, ink: Rgb, alpha: number): Rgb => [0, 1, 2].map((i) => page[i] * (1 - alpha) + ink[i] * alpha) as Rgb;

// A gated button stays dimmed on keyboard focus (opacity-disabled 0.5, eased to the done token 0.55 on focus-visible), so the focus ring is drawn at that strength over the page. The gated ring takes the text-default role (the strongest ink of the theme) instead of ring-default, which only reaches about 2:1 at that strength. At 0.5 the strongest ink alone gives 2.71:1 in vscode light and 2.82:1 in snes light, hence 0.55. WCAG 1.4.11 needs 3:1 for it in every theme and mode.
describe('Gated button focus ring contrast', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`keeps the dimmed focus ring at 3:1 on the page in ${mode}`, () => {
      const failing: string[] = [];
      for (const theme of loadThemes()) {
        const page = theme[mode]['background-default'];
        const ring = theme[mode]['text-default'];
        if (!page || !ring) continue;
        const value = contrast(mix(page, ring, GATED_FOCUS_OPACITY), page);
        if (value < 3) failing.push(`${theme.name} ${value.toFixed(2)}`);
      }
      expect(failing).toEqual([]);
    });
  }
});
