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
      // Token radius tiers and the `font-regular` weight, so variants can override the base.
      rounded: [{ rounded: ['item', 'control', 'surface', 'dialog', 'popover'] }],
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
