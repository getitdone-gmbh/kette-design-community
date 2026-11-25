import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Font sizes the design tokens preset adds on top of Tailwind's scale (theme.fontSize).
// tailwind-merge only knows the default sizes and treats any other `text-*` as a color, so e.g. `text-ui`
// would silently drop `text-text-muted`. utils.test.ts asserts this list matches the installed preset.
export const TOKEN_FONT_SIZES = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  'clamp-small',
  'clamp',
  'clamp-large',
  'clamp-xlarge',
  'nano',
  'micro',
  'ui',
  'ui-lg',
  'title-sm',
  'title-md',
  'display-sm',
  'display',
  'title-lg',
  'display-md',
  'file-tag',
  'logo-tile-20',
  'logo-tile-24',
  'logo-tile-32',
  'logo-tile-40',
  'logo-tile-48',
];

// Line heights the token preset adds on top of Tailwind's scale (theme.lineHeight), so a consumer `leading-*` replaces a token line height such as `leading-ui-relaxed`. utils.test.ts asserts this list matches the installed preset.
export const TOKEN_LINE_HEIGHTS = [
  '0', '1', '2',
  'button-sm', 'button', 'button-lg', 'button-xl', 'button-2xl', 'link',
  'clamp-small', 'clamp', 'clamp-large', 'clamp-xlarge',
  'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl',
  'ui-lg', 'title-md', 'ui-sm', 'ui', 'page-title', 'kpi-value', 'nano', 'nav-item',
  'display', 'display-sm', 'lead-lg', 'code-block', 'title-lg', 'display-md', 'ui-relaxed',
];

// Border radii the token preset adds on top of Tailwind's scale (theme.borderRadius), so a later `rounded-*` (full, none, another token) replaces a token radius such as `rounded-default` instead of losing to it in the cascade (DR-05). utils.test.ts asserts this list matches the installed preset.
export const TOKEN_RADII = [
  'xs', 'default', 'button', 'input', 'card', 'badge', 'checkbox', 'hairline', 'tight', 'item', 'control', 'surface', 'dialog', 'popover',
  'logo-tile-20', 'logo-tile-24', 'logo-tile-32', 'logo-tile-40', 'logo-tile-48',
];

// Named spacing tokens of the preset, so size, padding and gap overrides (`px-0` over `px-control-px-sm`) win over the token utilities.
const TOKEN_SPACING = [
  'micro', 'label', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl',
  'control-xs', 'control-sm', 'control-md', 'control-lg', 'control-xl', 'control-2xl',
  'control-px-sm', 'control-px-md', 'control-px-lg', 'control-px-xl', 'control-px-2xl', 'control-py-sm', 'control-py-md',
  'gap-control', 'gap-label',
  'icon-2xs', 'icon-xs', 'icon-sm', 'icon-md', 'icon-lg', 'icon-tile',
  'avatar-xs', 'avatar-sm', 'avatar-md', 'avatar-lg', 'avatar-xl', 'avatar-2xl',
  'checkbox-sm', 'checkbox-md', 'topbar', 'topbar-lg', 'toolbar', 'time-axis',
  'switch-track-w-sm', 'switch-track-h-sm', 'switch-track-w-md', 'switch-track-h-md', 'switch-thumb-sm', 'switch-thumb-md',
  'calendar-cell', 'month-cell', 'heatmap-cell', 'tree-indent', 'swatch-sm', 'swatch-md', 'brand-mark-sm', 'progress-md', 'kbd', 'object-icon', 'stepper-marker',
  'status-dot', 'badge', 'button-px-sm', 'button-gap-sm',
];

const twMerge = extendTailwindMerge<'typography'>({
  extend: {
    theme: { spacing: TOKEN_SPACING },
    classGroups: {
      'font-size': [{ text: TOKEN_FONT_SIZES }],
      leading: [{ leading: TOKEN_LINE_HEIGHTS }],
      // Token radii on every side and corner group, and the `font-regular` weight, so variants and consumers can override the base.
      rounded: [{ rounded: TOKEN_RADII }],
      'rounded-s': [{ 'rounded-s': TOKEN_RADII }],
      'rounded-e': [{ 'rounded-e': TOKEN_RADII }],
      'rounded-t': [{ 'rounded-t': TOKEN_RADII }],
      'rounded-r': [{ 'rounded-r': TOKEN_RADII }],
      'rounded-b': [{ 'rounded-b': TOKEN_RADII }],
      'rounded-l': [{ 'rounded-l': TOKEN_RADII }],
      'rounded-ss': [{ 'rounded-ss': TOKEN_RADII }],
      'rounded-se': [{ 'rounded-se': TOKEN_RADII }],
      'rounded-ee': [{ 'rounded-ee': TOKEN_RADII }],
      'rounded-es': [{ 'rounded-es': TOKEN_RADII }],
      'rounded-tl': [{ 'rounded-tl': TOKEN_RADII }],
      'rounded-tr': [{ 'rounded-tr': TOKEN_RADII }],
      'rounded-br': [{ 'rounded-br': TOKEN_RADII }],
      'rounded-bl': [{ 'rounded-bl': TOKEN_RADII }],
      // Focus ring widths of the preset (ring-focus 2px, ring-halo 3px), so they are widths and never read as a ring color.
      'ring-w': [{ ring: ['focus', 'halo'] }],
      'ring-offset-w': [{ 'ring-offset': ['focus'] }],
      'font-weight': [{ font: ['regular'] }],
      // Page frame width of the preset (`max-w-content`), so `max-w-none` or `max-w-4xl` from a consumer replaces it.
      'max-w': [{ 'max-w': ['content'] }],
      // Type roles (`typography-ui`, `typography-detail`, ...) set a whole font shorthand. The later role wins, so a className override is not swallowed by the component's own role.
      typography: [{ typography: [() => true] }],
      // Composed shadows of the theme expression roles (`shadow-[shadow:var(--bevel-…),…]`), so a consumer shadow class replaces them.
      shadow: [{ shadow: [(v: string) => /^\[shadow:/.test(v)] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// First letters of the first two words of a name, upper case ("Ada Lovelace" gives "AL"). Empty for an empty name.
export function getInitials(name: string, max = 2) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
