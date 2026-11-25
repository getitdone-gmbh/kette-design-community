import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../../tailwind.config.cjs');

// The library adds both variants in its tailwind.config.cjs; here they come from tailwind/preset.cjs, so apps on the preset get them too.
describe('short variant (KETTE-60)', () => {
  it('maps short: to a max-height media query without touching the screens', async () => {
    const result = await postcss([tailwindcss({ ...config, content: [{ raw: '<div class="short:flex-none max-md:hidden"></div>' }] })]).process('@tailwind utilities;', { from: undefined });
    expect(result.css).toMatch(/@media \(max-height: 480px\)\s*{\s*\.short\\:flex-none/);
    expect(result.css).toContain('@media not all and (min-width: 768px)');
    expect(config.theme?.screens).toBeUndefined();
  });
});

describe('forced-colors variant (KETTE-94)', () => {
  it('maps forced-colors: to the forced-colors media query', async () => {
    const result = await postcss([tailwindcss({ ...config, content: [{ raw: '<div class="forced-colors:[border-bottom-color:Canvas]"></div>' }] })]).process('@tailwind utilities;', { from: undefined });
    expect(result.css).toMatch(/@media \(forced-colors: active\)\s*{/);
  });
});
