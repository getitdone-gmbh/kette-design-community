'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { Camera, User } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { useLabels, usePreset } from '@/components/ui/labels-context';

/**
 * Sizes match the Figma "Avatar" component set (Component Library file "🚧 GetITDone-Basic",
 * page "↳ Avatars" 18:1350, frame "Avatar" 19:1012): Size={xs,sm,md,lg,xl,2xl} = {24,32,40,48,
 * 56,64}px. Every step lands on Tailwind's default spacing scale, so no arbitrary bracket value
 * is needed: xs=h-6/w-6, sm=h-8/w-8, md=h-10/w-10 (the pre-existing default), lg=h-12/w-12,
 * xl=h-14/w-14, 2xl=h-16/w-16.
 */
const avatarVariants = cva(
  [
    // AVATAR-A11Y-03: the circular clip lives on an inner wrapper (see the `Avatar` component
    // body below), not here — clipping this root would also clip AvatarBadge/AvatarOnlineIndicator,
    // which are positioned against this element's *square* bounding box corner and rendered as its
    // siblings, not its children. `rounded-full` (without `overflow-hidden`) is kept so the
    // focus-visible ring below still reads as a circle; it does not, on its own, clip anything.
    'relative inline-flex shrink-0 transition-colors',
    // AVATAR-MAT-03: disabled must dim/block regardless of the `interactive` computation — mirrors
    // Chip's identical base-array placement (chip.tsx) — since `disabled=true` always forces
    // `interactive` to false and an `interactive:true`-gated class would never apply here.
    'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-disabled',
  ],
  {
    variants: {
      size: {
        // 16px for use inside tabs, chips and other dense inline slots (one step below Figma's xs).
        '2xs': 'h-4 w-4',
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-14 w-14',
        '2xl': 'h-16 w-16',
        // Profile page picture, 192px. Pair with AvatarUpload for an edit affordance.
        profile: 'h-48 w-48',
      },
      // Avatar is a static image/initials display by default (matching Figma's Default/Hover/
      // Focused states, which only exist to support the common "click an avatar to open a
      // profile menu" pattern). Interactive mode is opt-in — see `onClick` below — so a purely
      // decorative avatar (e.g. inside a read-only comment list) never gets an unreachable focus
      // ring or a false hover affordance (mirrors Chip's `interactive` gating).
      //
      // MAT-AVATAR-02 (closed): hover/active feedback is a real token-driven state layer, not a
      // bare CSS filter. Unlike Chip/Alert — flat, single-color surfaces where a `hover:bg-*`
      // token swap is visible on its own — Avatar's content (`AvatarImage` or `AvatarFallback`)
      // is fully opaque and paints over the root's own background, so swapping the *root's*
      // background token the way Chip does would be invisible whenever a photo or fallback is
      // present. Instead, an `::after` overlay (MD3's literal "state layer" anatomy: a tonal
      // layer drawn *on top of* content) uses the same adaptive `foreground-default` token
      // already used for text elsewhere in this file — dark tint over light content in light
      // mode, light tint over dark content in dark mode — at 0% (rest) / 10% (hover) / 20%
      // (active) opacity, all standard Tailwind opacity steps (no arbitrary value). This
      // uniformly darkens/lightens a photo, initials, or the placeholder glyph alike. The
      // previously-invented `brightness-90` active step is dropped; `active:brightness-95` is
      // kept only as the same secondary accent Chip/Alert already layer on top of their own
      // active background-token change (chip.tsx, alert.tsx).
      // `circle` (default) is fully round; `square` is the Attio-style "squircle" (30% radius),
      // typically used for workspaces/companies as opposed to people.
      shape: {
        circle: 'rounded-full',
        square: 'rounded-[30%]',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default',
          "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-background-inverse after:opacity-0 after:transition-opacity after:content-['']",
          'hover:after:opacity-10',
          'active:after:opacity-20 active:brightness-95',
        ],
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
      interactive: false,
    },
  },
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /**
   * Dims the avatar and blocks pointer/keyboard interaction. Only meaningful together with
   * `onClick` (e.g. a profile-menu trigger that's momentarily unavailable) — mirrors Chip's
   * `disabled`: expressed via `aria-disabled`/`data-disabled` since Radix's `Avatar.Root`
   * renders a `<span>`, not a native form control.
   */
  disabled?: boolean;
}

/**
 * Passing `onClick` opts a given Avatar into the interactive "profile trigger" pattern: a real
 * tab stop with Enter/Space activation, hover/active/focus-visible feedback, and an optional
 * `disabled` state. Without `onClick` the Avatar stays a plain, non-focusable image/initials
 * display (the common case).
 *
 * AVATAR-A11Y-02 — accessible name is the consumer's responsibility: `role="button"` is only
 * ever reliably named by an `AvatarImage`'s `alt` text, a visible text `AvatarFallback` child
 * (e.g. initials), or an explicit `aria-label`/`aria-labelledby` passed to `Avatar` itself (already
 * available — `AvatarProps` extends Radix `Avatar.Root`'s native props). A `<AvatarFallback />`
 * placeholder glyph alone provides none of these (its icon is `aria-hidden`), so an interactive
 * Avatar composed with only the placeholder MUST be given an explicit `aria-label` describing the
 * action (e.g. `aria-label="Open profile menu"`) — see the `InteractivePlaceholder` story and the
 * regression test in avatar.test.tsx. This is intentionally not auto-generated: Avatar cannot infer
 * a truthful label from a decorative glyph.
 *
 * KNOWN TOKEN GAP — focus treatment (AVATAR-MAT-01): Figma's Focused state (node 1198:100676)
 * renders a 4px tonal halo in `semantic/primary/100`, not the thin ring used elsewhere. That
 * scale token is a static PRIMITIVE (defined once in `figma-tokens/core.json`/`default_theme.json`,
 * no light/dark pair), so reusing it here would render an identical pale-violet halo in dark mode
 * — failing the "keep light+dark" requirement and WCAG 1.4.11 non-text contrast against a dark
 * surface. Until an adaptive "avatar focus ring" (or dark-aware `primary-100`) token exists,
 * interactive Avatar reuses the system's standard ring focus-visible treatment (consistent with
 * Chip, Tooltip's trigger wrapper, and Button) rather than fabricating the halo without a safe
 * dark-mode value.
 *
 */
// True while the surrounding Avatar is disabled. An AvatarUpload inside then behaves as aria-disabled.
const AvatarDisabledContext = React.createContext(false);

// Size of the surrounding Avatar, so the initials pick their type role without a repeated `size` prop.
const AvatarSizeContext = React.createContext<NonNullable<VariantProps<typeof avatarVariants>['size']> | undefined>(undefined);

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, shape, disabled, onClick, onKeyDown, children, ...props }, ref) => {
    const interactive = Boolean(onClick) && !disabled;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
      onKeyDown?.(event);
      if (!interactive || event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as unknown as React.MouseEvent<HTMLSpanElement>);
      }
    };

    // AVATAR-A11Y-03: AvatarBadge/AvatarOnlineIndicator are positioned against this root's
    // *square* bounding-box corner, but the root's visible region is the inscribed circle — so
    // clipping the root itself (the previous `overflow-hidden` here) clips almost all of the
    // badge away. Split children so AvatarImage/AvatarFallback (and any other content) render
    // inside a circularly-clipped inner wrapper, while the badge renders as an un-clipped sibling
    // of that wrapper, still visually anchored to this root via `absolute bottom-0 right-0`.
    const { content, badges } = React.Children.toArray(children).reduce<{
      content: React.ReactNode[];
      badges: React.ReactNode[];
    }>(
      (acc, child) => {
        if (React.isValidElement(child) && (child.type === AvatarBadge || child.type === AvatarOnlineIndicator || child.type === AvatarUpload)) {
          acc.badges.push(child);
        } else {
          acc.content.push(child);
        }
        return acc;
      },
      { content: [], badges: [] },
    );

    return (
      <AvatarPrimitive.Root
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={handleKeyDown}
        className={cn(avatarVariants({ size, shape, interactive }), className)}
        {...props}
      >
        <span
          className={cn(
            'absolute inset-0 overflow-hidden border border-solid border-hairline',
            shape === 'square' ? 'rounded-[30%]' : 'rounded-full',
          )}
        >
          <AvatarSizeContext.Provider value={size ?? 'md'}>{content}</AvatarSizeContext.Provider>
        </span>
        <AvatarDisabledContext.Provider value={Boolean(disabled)}>{badges}</AvatarDisabledContext.Provider>
      </AvatarPrimitive.Root>
    );
  },
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/**
 * Covers both of Figma's non-image content variants under one slot, matching how they share
 * identical anatomy (a `background-muted` circle, centered content) and only differ in what's
 * centered inside:
 * - `Text=True` (initials, e.g. "OR") — pass the initials as `children`.
 * - `Placeholder=True, Text=False` (no data available) — omit `children` and a generic person
 *   glyph is rendered, matching Figma's placeholder icon.
 *
 * KNOWN TOKEN GAP (AVATAR-MAT-02): a dedicated `avatar-background-default` /
 * `avatar-foreground-default` token pair exists and is the closer literal match to Figma's
 * `semantic/gray/100` (bg) / `semantic/gray/600` (text) bindings — but the *published*
 * the design tokens (`styles/theme.css`) package has not rebuilt with the dark-mode override that
 * already exists in the token source (`figma-tokens/default_theme_dark.json` → `avatar.background.
 * default` = slate.700, `avatar.foreground.default` = slate.50), the same stale-package pattern
 * already flagged for Tooltip (see tooltip.figma.tsx). Until design-tokens-maintainer rebuilds and
 * republishes, this file intentionally keeps the pre-existing `background-muted` semantic token
 * (already dark-mode-safe) instead of switching to the not-yet-adaptive avatar-scoped background
 * token.
 *
 * MAT-AVATAR-01 / AVATAR-A11Y-01 (closed): the foreground half of that same pre-existing pair —
 * `text-text-subtle` — computed to only ~4.34:1 against `bg-background-neutral-default` in light mode
 * (slate.500 #64748b on slate.100 #f1f5f9), under the 4.5:1 AA minimum for 14px/500-weight text
 * (dark mode already passed at ~5.71:1). Swapped to `text-text-default`, which is verified
 * ≥13:1 against `bg-background-neutral-default` in BOTH modes (light: slate.900 on slate.100 ≈16.3:1; dark:
 * slate.50 on slate.800 ≈14:1) — restoring light/dark parity without introducing a new token.
 */
// Initials colours (Figma Avatar Color=1..8 -> data/avatar/N default + on; Color=Brand; Color=Project 1..8 -> data/project/N + on-brand).
const avatarFallbackColors = {
  brand: 'bg-background-brand-bold-default text-text-on-brand',
  1: 'bg-data-avatar-1-default text-data-avatar-1-on',
  2: 'bg-data-avatar-2-default text-data-avatar-2-on',
  3: 'bg-data-avatar-3-default text-data-avatar-3-on',
  4: 'bg-data-avatar-4-default text-data-avatar-4-on',
  5: 'bg-data-avatar-5-default text-data-avatar-5-on',
  6: 'bg-data-avatar-6-default text-data-avatar-6-on',
  7: 'bg-data-avatar-7-default text-data-avatar-7-on',
  8: 'bg-data-avatar-8-default text-data-avatar-8-on',
  9: 'bg-data-avatar-9-default text-data-avatar-9-on',
  10: 'bg-data-avatar-10-default text-data-avatar-10-on',
  // Named aliases of slots 9 and 10 (Figma Avatar Color=Indigo, Color=Red).
  indigo: 'bg-data-avatar-9-default text-data-avatar-9-on',
  red: 'bg-data-avatar-10-default text-data-avatar-10-on',
  'project-1': 'bg-data-project-1 text-data-project-1-on',
  'project-2': 'bg-data-project-2 text-data-project-2-on',
  'project-3': 'bg-data-project-3 text-data-project-3-on',
  'project-4': 'bg-data-project-4 text-data-project-4-on',
  'project-5': 'bg-data-project-5 text-data-project-5-on',
  'project-6': 'bg-data-project-6 text-data-project-6-on',
  'project-7': 'bg-data-project-7 text-data-project-7-on',
  'project-8': 'bg-data-project-8 text-data-project-8-on',
} as const;

type AvatarFallbackColor = keyof typeof avatarFallbackColors;

const hashName = (value: string) => Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  Omit<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>, 'color'> & {
    /** Opt-in initials role: `xs` avatar-xs (10/600), `sm` ui-semibold (13/600), `profile` display (44/600) for the 192px profile avatar; omit for the default. */
    size?: '2xs' | 'xs' | 'sm' | 'profile';
    // Opt-in initials colour: `brand`, `1`..`10` (person), `indigo` (9), `red` (10) or `project-1`..`project-8`. Omit for the neutral default.
    color?: AvatarFallbackColor;
  }
>(({ className, children, size: sizeProp, color: colorProp, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const parentSize = React.useContext(AvatarSizeContext);
  // The Avatar size drives the initials role unless a fallback size is given. Sizes without an own role keep the default.
  const inherited = parentSize === '2xs' || parentSize === 'xs' || parentSize === 'sm' || parentSize === 'profile' ? parentSize : undefined;
  const size = sizeProp ?? inherited;
  // Zero: initials get one of the eight person colours from the name, so the same person always has the same colour.
  const color = colorProp ?? (zero && typeof children === 'string' && children.length > 0 ? ((hashName(children) % 8) + 1) as AvatarFallbackColor : undefined);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-[inherit]',
        color ? avatarFallbackColors[color] : 'bg-background-neutral-default text-text-default',
        size === '2xs' || size === 'xs' ? 'typography-avatar-xs' : size === 'sm' ? 'typography-ui-semibold' : size === 'profile' ? 'typography-display' : 'text-sm font-medium',
        className,
      )}
      {...props}
    >
      {children ?? <User className="h-3/5 w-3/5" aria-hidden="true" />}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/**
 * Positioning + "cutout" primitive for the bottom-right status corner in Figma's "Avatar" set
 * (Status icon={Online indicator, Company, Verified}). The three Figma variants share this exact
 * anatomy (absolute bottom-right, a border matching whatever surface the Avatar sits on) but
 * diverge completely in payload — a solid color dot vs. an arbitrary company-logo `<img>` vs. a
 * borderless verified-check icon — so this stays a generic slot rather than a rigid `cva` enum
 * that would have to fabricate one true "size"/"shape" across three visually distinct badge
 * types. Consumers size and fill it (see `AvatarOnlineIndicator` below for the one fully
 * token-driven case); a company logo or verified icon is passed as `children`.
 *
 * `border-surface-canvas` (adaptive: white in light mode, near-black in dark mode) is used
 * for the cutout ring rather than Figma's literal `basic/white` binding — a literal white ring
 * would show as an unwanted halo against a dark-mode surface. This intentionally deviates from
 * the literal Figma value to satisfy the "keep light+dark" requirement; flag as NEEDS_DECISION
 * if a designer confirms the ring must always render pure white regardless of theme.
 *
 * AVATAR-A11Y-03 (closed): must be passed as a *direct* child of `Avatar` (as every story does),
 * not nested inside another element — `Avatar` type-checks its direct children against
 * `AvatarBadge`/`AvatarOnlineIndicator` to route the badge outside the circularly-clipped inner
 * content wrapper so this corner cutout is never clipped away (see `Avatar`'s body in this file).
 */
const AvatarBadge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-solid border-surface-canvas',
        className,
      )}
      {...props}
    />
  ),
);
AvatarBadge.displayName = 'AvatarBadge';

export interface AvatarUploadProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  // Replaces the camera glyph.
  icon?: React.ReactNode;
  // Accessible name. Wins over the provider text.
  uploadLabel?: string;
  // Called instead of `onClick` while the button is gated (`aria-disabled`, or inside a disabled Avatar). Explain why here. Nothing else happens.
  onGatedClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Upload affordance in the bottom right corner of an Avatar (most useful with size "profile"). A real button; the parent opens the file picker. Pass it as a direct child of Avatar.
// With `aria-disabled` (or inside a disabled Avatar) the button stays hoverable, focusable and clickable so the consumer can explain why it is gated. `onClick` is not called then, `onGatedClick` is, and the default action and bubbling are stopped.
const AvatarUpload = React.forwardRef<HTMLButtonElement, AvatarUploadProps>(
  ({ className, icon, uploadLabel, type = 'button', onClick, onGatedClick, ...props }, ref) => {
    const l = useLabels({ avatarUpload: uploadLabel });
    const avatarDisabled = React.useContext(AvatarDisabledContext);
    const ariaDisabled = props['aria-disabled'] === true || props['aria-disabled'] === 'true' || avatarDisabled;
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (ariaDisabled) {
        event.preventDefault();
        event.stopPropagation();
        onGatedClick?.(event);
        return;
      }
      onClick?.(event);
    };
    return (
      <button
        ref={ref}
        type={type}
        aria-label={l.avatarUpload}
        aria-disabled={ariaDisabled || undefined}
        onClick={handleClick}
        className={cn(
          // A disabled Avatar sets pointer-events none on the root. The button takes them back so a gated click still arrives.
          'pointer-events-auto',
          'absolute bottom-0 right-0 inline-flex h-control-md w-control-md cursor-pointer items-center justify-center rounded-full border-2 border-solid border-surface-canvas bg-background-inverse text-text-inverse transition-opacity',
          'hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-disabled',
          'aria-disabled:cursor-not-allowed aria-disabled:opacity-disabled aria-disabled:hover:opacity-disabled aria-disabled:active:opacity-disabled',
          '[&>svg]:h-icon-sm [&>svg]:w-icon-sm',
          'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default',
          className,
        )}
        {...props}
      >
        {icon ?? <Camera aria-hidden="true" />}
      </button>
    );
  },
);
AvatarUpload.displayName = 'AvatarUpload';

/**
 * The one status-corner variant Figma fully specifies with tokens alone (no external asset):
 * a solid dot, sized at a fixed 1/4 of the Avatar's own size at every step (24→6, 32→8, 40→10,
 * 48→12, 56→14, 64→16px — confirmed against Figma nodes 1034:556 (xs) and 1217:104703 (2xl)),
 * which lands on Tailwind's default spacing scale at every size. Color uses the adaptive
 * `general-success-default` role token (dark-mode-safe) rather than the static `success-500`
 * scale primitive Figma's binding names, since the latter has no dark-mode pair either — same
 * token-gap class as AVATAR-MAT-01/02 above.
 */
const avatarOnlineIndicatorSizes = {
  '2xs': 'h-1 w-1',
  xs: 'h-[6px] w-[6px]',
  sm: 'h-2 w-2',
  md: 'h-[10px] w-[10px]',
  lg: 'h-3 w-3',
  xl: 'h-[14px] w-[14px]',
  '2xl': 'h-4 w-4',
  profile: 'h-12 w-12',
} as const;

export interface AvatarOnlineIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof avatarOnlineIndicatorSizes;
  // Screen reader text. Wins over the provider text.
  onlineLabel?: string;
}

const AvatarOnlineIndicator = React.forwardRef<HTMLSpanElement, AvatarOnlineIndicatorProps>(
  ({ className, size = 'md', onlineLabel, ...props }, ref) => {
    const l = useLabels({ online: onlineLabel });
    return (
      <AvatarBadge
        ref={ref}
        className={cn('bg-general-success-default', avatarOnlineIndicatorSizes[size], className)}
        {...props}
      >
        <span className="sr-only">{l.online}</span>
      </AvatarBadge>
    );
  },
);
AvatarOnlineIndicator.displayName = 'AvatarOnlineIndicator';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the optional `+n` overflow avatar; match the grouped avatars. */
  size?: NonNullable<VariantProps<typeof avatarVariants>['size']>;
  /** Number of people not shown; renders a muted `+n` avatar at the end when greater than zero. */
  overflowCount?: number;
  // Screen reader suffix of the `+n` avatar. Wins over the provider text.
  overflowLabel?: string;
}

// Overlapping avatars with a surface-coloured ring (size-avatar-ring). The -6px overlap has no token yet.
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, size = 'xs', overflowCount = 0, overflowLabel, children, ...props }, ref) => {
    const l = useLabels({ overflowMore: overflowLabel });
    return (
    <div
      ref={ref}
      role="group"
      className={cn(
        'flex items-center',
        '[&>*]:ring-[length:var(--size-avatar-ring)] [&>*]:ring-background [&>*+*]:-ml-[6px]',
        className,
      )}
      {...props}
    >
      {children}
      {overflowCount > 0 && (
        <Avatar size={size}>
          <AvatarFallback size={size === '2xs' ? '2xs' : size === 'xs' ? 'xs' : 'sm'} className="bg-muted text-text-muted">
            +{overflowCount}
            <span className="sr-only">{l.overflowMore}</span>
          </AvatarFallback>
        </Avatar>
      )}
    </div>
    );
  },
);
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, avatarFallbackColors, type AvatarFallbackColor, AvatarGroup, avatarVariants, AvatarBadge, AvatarFallback, AvatarImage, AvatarOnlineIndicator, AvatarUpload };
