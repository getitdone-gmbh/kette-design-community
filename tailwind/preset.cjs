/**
 * Tailwind CSS Preset — CSS Variable Architecture
 *
 * Single import for consuming apps:
 *   const preset = require('@getitdone-gmbh/kette-design-community/tailwind/preset');
 *   module.exports = { presets: [preset], darkMode: ['class'], content: [...] };
 *
 * Automatically handles:
 * - CSS variable colors with opacity support
 * - Font family, border radius, border width via CSS vars
 * - tailwindcss-themer filtering (keeps typography, removes hardcoded colors)
 * - v2.0.5 fallback when CSS var config not available
 */

const path = require('path');
const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');
const distDir = __dirname;

// Load legacy preset
const LegacyPreset = require(path.join(distDir, 'tailwind.preset.cjs'));

// Try loading CSS variable theme config
let themeExtend = {};
try {
  themeExtend = require(path.join(distDir, 'tailwind.theme.cjs')).theme.extend;
} catch {}

const hasCssVars = Object.keys(themeExtend.colors || {}).length > 0;

if (hasCssVars) {
  // --- CSS Variable Architecture ---
  const twColors = require('tailwindcss/colors');
  delete twColors.lightBlue; delete twColors.warmGray; delete twColors.trueGray;
  delete twColors.coolGray; delete twColors.blueGray;

  const { colors: _, ...presetThemeNoColors } = LegacyPreset.theme || {};
  const plugins = (LegacyPreset.plugins || []).filter(p => !p?.__options);

  // Build color functions for Tailwind 3 opacity support
  const colorFns = {};
  for (const [key, val] of Object.entries(themeExtend.colors)) {
    const match = String(val).match(/var\((--[^)]+)\)/);
    // Alpha-carrying utility colours (border-hairline, overlay) ship their own colour function
    // (channel var + `-alpha` companion var); keep it as generated.
    if (typeof val === 'function' && /-alpha\)/.test(String(val))) { colorFns[key] = val; continue; }
    colorFns[key] = match
      ? ({ opacityValue }) => opacityValue === undefined
          ? `rgb(var(${match[1]}))`
          : `rgb(var(${match[1]}) / ${opacityValue})`
      : val;
  }

  // Resolve the full Tailwind default config (includes derived categories like height, width, gap etc.)
  const resolveConfig = require('tailwindcss/resolveConfig');
  const fullDefaults = resolveConfig({ content: [] }).theme;

  // Categories Tailwind auto-derives — must be DELETED from the legacy preset
  // so Tailwind can derive them from spacing/colors/borderRadius/borderWidth.
  const autoFromSpacing = new Set([
    'margin', 'padding', 'gap', 'inset', 'space', 'translate', 'scrollMargin', 'scrollPadding',
    'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
    'flexBasis', 'borderSpacing', 'textIndent',
  ]);
  const autoFromColors = new Set([
    'backgroundColor', 'textColor', 'borderColor', 'ringColor', 'ringOffsetColor',
    'outlineColor', 'placeholderColor', 'divideColor', 'accentColor', 'caretColor', 'fill',
    'gradientColorStops', 'boxShadowColor', 'textDecorationColor',
    'backgroundOpacity', 'textOpacity', 'borderOpacity', 'divideOpacity', 'ringOpacity', 'placeholderOpacity',
  ]);
  const autoFromOther = new Set([
    'borderRadius', 'borderWidth', 'divideWidth', 'outlineWidth', 'ringWidth', 'ringOffsetWidth',
  ]);
  const autoDerived = new Set([...autoFromSpacing, ...autoFromColors, ...autoFromOther, 'colors']);

  // Start with legacy preset, REMOVE all auto-derived keys so Tailwind derives them cleanly
  const mergedTheme = {};
  for (const [key, val] of Object.entries(presetThemeNoColors)) {
    if (!autoDerived.has(key)) mergedTheme[key] = val;
  }
  // Merge Tailwind defaults for non-auto-derived categories
  for (const key of Object.keys(fullDefaults)) {
    if (autoDerived.has(key)) continue;
    const fullVal = fullDefaults[key];
    const legacyVal = mergedTheme[key];
    if (typeof fullVal === 'object' && !Array.isArray(fullVal)) {
      mergedTheme[key] = typeof legacyVal === 'object' && !Array.isArray(legacyVal)
        ? { ...fullVal, ...legacyVal }
        : legacyVal !== undefined ? legacyVal : fullVal;
    } else if (fullVal !== undefined && !(key in mergedTheme)) {
      mergedTheme[key] = fullVal;
    }
  }

  module.exports = {
    darkMode: ['class'],
    // Keeps the icon stroke base rule (from the plugin below): Tailwind drops base rules whose class is not found in the content
    safelist: ['lucide'],
    theme: {
      ...mergedTheme,
      fontFamily: {
        ...defaultTheme.fontFamily,
        ...presetThemeNoColors.fontFamily,
        ...(themeExtend.fontFamily || {}),
      },
      borderRadius: {
        ...defaultTheme.borderRadius,
        ...Object.fromEntries(
          Object.entries(presetThemeNoColors.borderRadius || {}).map(([k, v]) =>
            [k, typeof v === 'string' && /^\d+$/.test(v) ? `${v}px` : v]
          )
        ),
        ...(themeExtend.borderRadius || {}),
      },
      // 4.1: control density keys (h-control-md, size-control-sm, ...) and the shadow scale.
      // Spread over the existing maps so Tailwind's shadow / shadow-sm / md / lg are untouched.
      spacing: {
        ...mergedTheme.spacing,
        ...(themeExtend.spacing || {}),
      },
      boxShadow: {
        ...mergedTheme.boxShadow,
        ...(themeExtend.boxShadow || {}),
      },
      // Name clashes introduced by the 4.1 colour aliases are resolved in favour of what existed:
      //  - `shadow-popover` is the popover SHADOW (the `popover` colour must not also produce a
      //    shadow-colour rule that would override it), same for any colour named like a shadow key.
      //  - `border-card` stays the plugin utility below (border colour + width + style).
      boxShadowColor: ({ theme }) => {
        const shadowKeys = new Set(Object.keys(theme('boxShadow') || {}));
        return Object.fromEntries(Object.entries(theme('colors')).filter(([k]) => !shadowKeys.has(k)));
      },
      borderColor: ({ theme }) => {
        const { card: _card, ...rest } = theme('colors');
        return { ...rest, DEFAULT: theme('colors.gray.200', 'currentColor') };
      },
      // `text-destructive` is the error TEXT step (--semantic-text-destructive, AA on every surface), the same value as
      // `text-text-destructive`. The `destructive` colour itself stays the fill (bg-destructive, border-destructive, ring-destructive).
      textColor: ({ theme }) => {
        const colors = theme('colors');
        return colors['text-destructive'] ? { ...colors, destructive: colors['text-destructive'] } : colors;
      },
      // stroke-chart-* / stroke-data-* (chart and data palettes only), same colour functions as fill-*
      stroke: {
        ...mergedTheme.stroke,
        ...Object.fromEntries(Object.entries(colorFns).filter(([k]) => /^(chart|data)-/.test(k))),
      },
      borderWidth: {
        0: '0px', 2: '2px', 4: '4px', 8: '8px',
        ...presetThemeNoColors.borderWidth,
        ...(themeExtend.borderWidth || {}),
      },
      // Foundations (docs/FOUNDATIONS.md): layout sizes (w-sidebar, max-w-page, h-row, ...), z-index layers
      // (z-sheet, z-dialog, ...), motion (duration-base, ease-enter) and opacity-empty. `extend` keeps the
      // spacing-derived width/height scales intact.
      extend: {
        width: themeExtend.width || {},
        minWidth: themeExtend.minWidth || {},
        flexBasis: themeExtend.flexBasis || {},
        maxWidth: themeExtend.maxWidth || {},
        maxHeight: themeExtend.maxHeight || {},
        minHeight: themeExtend.minHeight || {},
        height: themeExtend.height || {},
        zIndex: themeExtend.zIndex || {},
        transitionDuration: themeExtend.transitionDuration || {},
        transitionTimingFunction: themeExtend.transitionTimingFunction || {},
        opacity: themeExtend.opacity || {},
        // ring-halo (3px field halo), ring-focus and ring-offset-focus (2px shared keyboard focus ring)
        ringWidth: themeExtend.ringWidth || {},
        ringOffsetWidth: themeExtend.ringOffsetWidth || {},
        // Container breakpoints for @tailwindcss/container-queries: @area:, @area-xs: ... @area-xl:
        containers: themeExtend.containers || {},
      },
      colors: {
        ...twColors,
        transparent: 'transparent',
        current: 'currentColor',
        inherit: 'inherit',
        ...colorFns,
      },
    },
    plugins: [
      ...plugins,
      plugin(({ addBase, addUtilities, addComponents }) => {
        addBase({
          '*, ::before, ::after': {
            'border-color': 'rgb(var(--colors-form-border-default, 226 232 240))',
          },
        });
        addUtilities({
          '.border-card': {
            borderColor: 'rgb(var(--colors-form-border-default, 226 232 240))',
            borderWidth: 'var(--borderWidth-default, 1px)',
            borderStyle: 'solid',
          },
        });
        // Bare marker class: inherits the surrounding font. Sized roles (`typography-button-sm`, ...) come from the generated preset and theme.css and must not be overridden here.
        addComponents({
          '.typography-button': { 'font-family': 'inherit', 'font-size': 'inherit' },
        });
        // kette-design-community only: 2.25 stroke for 12px glyphs (library tailwind.css), icons marked data-stroke="fixed" keep their own stroke. The 1.75 rule comes from the token preset above, so it is not repeated here.
        // One selector per rule, and the size classes as [class~=...] attribute selectors: Tailwind treats a class selector in a base rule as a utility and re-emitted it under variants such as `[&>svg]:h-icon-2xs`, which produced the malformed selector `...h-icon-2xs>svgsvg.lucide`.
        const smallStroke = { 'stroke-width': 'var(--size-icon-stroke-sm, 2.25)' };
        addBase({ ":where(svg.lucide[stroke-width='2']:not([data-stroke='fixed'])[class~='h-icon-2xs'])": smallStroke });
        addBase({ ":where(svg.lucide[stroke-width='2']:not([data-stroke='fixed'])[class~='size-icon-2xs'])": smallStroke });
        addBase({ ":where([class*='icon-2xs'] > svg.lucide[stroke-width='2']:not([data-stroke='fixed']))": smallStroke });
      }),
    ],
  };
} else {
  // --- Fallback: v2.0.5 ---
  module.exports = {
    ...LegacyPreset,
    darkMode: ['class'],
  };
}
