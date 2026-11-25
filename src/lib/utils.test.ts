import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { TOKEN_FONT_SIZES, TOKEN_LINE_HEIGHTS, TOKEN_RADII, cn } from './utils';

const require = createRequire(import.meta.url);

// Font-size keys of the installed token preset that Tailwind's default theme does not ship
const presetTokenFontSizes = (): string[] => {
  const resolveConfig = require('tailwindcss/resolveConfig');
  const defaultTheme = require('tailwindcss/defaultTheme');
  const preset = require('../../tailwind/preset.cjs');
  const resolved = resolveConfig({ content: [], presets: [preset] });
  const defaults = new Set(Object.keys(defaultTheme.fontSize));
  return Object.keys(resolved.theme.fontSize).filter((key) => !defaults.has(key));
};

// Line-height keys of the installed token preset that Tailwind's default theme does not ship
const presetTokenLineHeights = (): string[] => {
  const resolveConfig = require('tailwindcss/resolveConfig');
  const defaultTheme = require('tailwindcss/defaultTheme');
  const preset = require('../../tailwind/preset.cjs');
  const resolved = resolveConfig({ content: [], presets: [preset] });
  const defaults = new Set(Object.keys(defaultTheme.lineHeight));
  return Object.keys(resolved.theme.lineHeight).filter((key) => !defaults.has(key));
};

// Border-radius keys of the installed token preset that Tailwind's default theme does not ship
const presetTokenRadii = (): string[] => {
  const resolveConfig = require('tailwindcss/resolveConfig');
  const defaultTheme = require('tailwindcss/defaultTheme');
  const preset = require('../../tailwind/preset.cjs');
  const resolved = resolveConfig({ content: [], presets: [preset] });
  const defaults = new Set(Object.keys(defaultTheme.borderRadius));
  return Object.keys(resolved.theme.borderRadius).filter((key) => !defaults.has(key));
};

describe('cn / tailwind-merge token radii (ZERO-806)', () => {
  it('TOKEN_RADII matches the border radii of the installed token preset', () => {
    expect([...TOKEN_RADII].sort()).toEqual(presetTokenRadii().sort());
  });

  // Regression (DR-05): `rounded-default` and `rounded-tight` were unknown to tailwind-merge, so a consumer `rounded-full` stayed next to them and lost in the cascade
  it('a later radius replaces the token radii', () => {
    expect(cn('rounded-default', 'rounded-tight', 'rounded-full')).toBe('rounded-full');
    expect(cn('rounded-card', 'rounded-none')).toBe('rounded-none');
    expect(cn('rounded-md', 'rounded-default')).toBe('rounded-default');
  });

  it('a later side radius replaces a token side radius and a full radius replaces the sides', () => {
    expect(cn('rounded-l-surface', 'rounded-l-none')).toBe('rounded-l-none');
    expect(cn('rounded-l-surface rounded-r-surface', 'rounded-none')).toBe('rounded-none');
    expect(cn('rounded-none', 'rounded-l-surface')).toBe('rounded-none rounded-l-surface');
  });

  it('keeps a token radius next to unrelated utilities', () => {
    expect(cn('rounded-tight bg-muted', 'h-4')).toBe('rounded-tight bg-muted h-4');
  });
});

describe('cn / tailwind-merge token line heights', () => {
  it('TOKEN_LINE_HEIGHTS matches the line heights of the installed token preset', () => {
    expect([...TOKEN_LINE_HEIGHTS].sort()).toEqual(presetTokenLineHeights().sort());
  });

  it('a later leading class replaces a token line height', () => {
    expect(cn('text-sm leading-ui-relaxed', 'leading-normal')).toBe('text-sm leading-normal');
    expect(cn('leading-none', 'leading-ui-relaxed')).toBe('leading-ui-relaxed');
  });
});

describe('cn / tailwind-merge token config', () => {
  it('TOKEN_FONT_SIZES matches the font sizes of the installed token preset', () => {
    expect([...TOKEN_FONT_SIZES].sort()).toEqual(presetTokenFontSizes().sort());
  });

  // Regression: tailwind-merge treated token sizes like `text-ui` as colors and dropped one of the two classes
  it.each(TOKEN_FONT_SIZES)('keeps text-%s next to a text color', (size) => {
    expect(cn(`text-${size}`, 'text-text-muted')).toBe(`text-${size} text-text-muted`);
    expect(cn('text-text-muted', `text-${size}`)).toBe(`text-text-muted text-${size}`);
  });

  it('still lets a later token size override an earlier one', () => {
    expect(cn('text-ui', 'text-micro', 'text-text-muted')).toBe('text-micro text-text-muted');
    expect(cn('text-sm', 'text-ui-lg')).toBe('text-ui-lg');
  });

  it('still lets a later text color override an earlier one', () => {
    expect(cn('text-ui text-text-muted', 'text-text-subtle')).toBe('text-ui text-text-subtle');
  });

  it('lets size, padding and gap overrides win over the named spacing tokens', () => {
    expect(cn('px-control-px-sm', 'px-0')).toBe('px-0');
    expect(cn('h-control-md', 'h-7')).toBe('h-7');
    expect(cn('gap-gap-control', 'gap-2')).toBe('gap-2');
    expect(cn('h-icon-md w-icon-md', 'h-4 w-4')).toBe('h-4 w-4');
  });

  it('treats the 4.28 sizing and radius tokens as sizes, not colors', () => {
    expect(cn('h-badge', 'h-5')).toBe('h-5');
    expect(cn('h-status-dot w-status-dot', 'h-2 w-2')).toBe('h-2 w-2');
    expect(cn('px-button-px-sm', 'px-0')).toBe('px-0');
    expect(cn('gap-button-gap-sm', 'gap-2')).toBe('gap-2');
    expect(cn('rounded-popover', 'rounded-none')).toBe('rounded-none');
  });

  it('keeps the focus ring width, offset and color side by side', () => {
    const ring = 'focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default';
    expect(cn(ring)).toBe(ring);
    expect(cn('focus-visible:ring-focus', 'focus-visible:ring-halo')).toBe('focus-visible:ring-halo');
  });

  it('keeps unrelated spacing utilities side by side', () => {
    expect(cn('px-control-px-sm', 'py-2')).toBe('px-control-px-sm py-2');
  });

  it('lets a later type role override an earlier one without touching colors', () => {
    expect(cn('typography-input-text text-text-subtle', 'typography-detail')).toBe('text-text-subtle typography-detail');
    expect(cn('typography-ui', 'typography-ui-semibold', 'typography-detail')).toBe('typography-detail');
  });
});

describe('cn page frame width', () => {
  it('lets max-w-none or another cap replace max-w-content', () => {
    expect(cn('max-w-content mx-auto', 'max-w-none')).toBe('mx-auto max-w-none');
    expect(cn('max-w-[1170px]', 'max-w-content')).toBe('max-w-content');
  });
});
