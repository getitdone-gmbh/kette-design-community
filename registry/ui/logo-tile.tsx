'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { avatarFallbackColors } from '@/components/ui/avatar';

// Figma `_Logo tile` (10526:297214): Color=1..8 -> colors/data/project/N, initials in the logo tile font size per size (11/13/16px, weight 700), on-brand text.
// Radius is size x 0.25 (prototype): 24px 6, 32px 8, 40px 10.
// The colour map is shared with Avatar (`project-N`), so the two stay in lockstep.
type LogoTileColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const logoTileVariants = cva('inline-flex shrink-0 select-none items-center justify-center', {
  variants: {
    size: {
      xs: 'h-avatar-xs w-avatar-xs rounded-logo-tile-24 text-logo-tile-24 font-bold leading-none',
      sm: 'h-avatar-sm w-avatar-sm rounded-logo-tile-32 text-logo-tile-32 font-bold leading-none',
      md: 'h-avatar-md w-avatar-md rounded-logo-tile-40 text-logo-tile-40 font-bold leading-none',
    },
  },
  defaultVariants: { size: 'xs' },
});

export interface LogoTileProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof logoTileVariants> {
  // `color` (default) is the project-coloured initials tile. `neutral` is a bordered surface tile for third-party brand logos (integrations), so the logo keeps its own colours. `outline` is the same bordered surface tile: it shows `src` or the children when given, otherwise the initials in the default text colour.
  tone?: 'color' | 'neutral' | 'outline';
  // Logo image in every tone. Neutral and outline inset it (alternatively pass the logo as children); `color` fills the tile with it (an uploaded workspace or client logo) and the initials stay the fallback without `src`. Decorative inside the tile; `label` names the tile.
  src?: string;
  // Project colour 1..8 (`colors/data/project/N`).
  color?: LogoTileColor;
  // One to three characters, e.g. `AC`.
  initials?: string;
  // Accessible name. Without it the tile is decorative (`aria-hidden`), which is right next to a visible name.
  label?: string;
}

const LogoTile = React.forwardRef<HTMLSpanElement, LogoTileProps>(
  ({ className, color = 1, tone = 'color', src, initials, label, size, children, ...props }, ref) => {
    const neutral = tone === 'neutral';
    const outline = tone === 'outline';
    return (
      <span
        ref={ref}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        data-color={neutral || outline ? undefined : color}
        data-tone={tone}
        className={cn(
          logoTileVariants({ size }),
          outline
            ? 'border border-solid border-border-default bg-background text-text-default [&>img]:h-3/5 [&>img]:w-3/5 [&>img]:object-contain [&>svg]:h-3/5 [&>svg]:w-3/5'
            : neutral
            ? 'border border-solid border-border bg-background text-text-default [&>img]:h-3/5 [&>img]:w-3/5 [&>img]:object-contain [&>svg]:h-3/5 [&>svg]:w-3/5'
            : [avatarFallbackColors[`project-${color}`], src && 'overflow-hidden [&>img]:h-full [&>img]:w-full [&>img]:object-cover'],
          className,
        )}
        {...props}
      >
        {neutral || outline ? (
          <>
            {src ? <img src={src} alt="" /> : null}
            {children}
            {src || children ? null : initials}
          </>
        ) : src ? (
          <img src={src} alt="" />
        ) : (
          initials
        )}
      </span>
    );
  },
);
LogoTile.displayName = 'LogoTile';

export { LogoTile, logoTileVariants, type LogoTileColor };
