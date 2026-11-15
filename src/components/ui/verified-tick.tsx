'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';
import { useLabels } from './labels-context';

// Figma Verified tick (3302:418803): Size xs 10, sm 12, md 14, lg 16, xl 18, 2xl 20, 3xl 24, 4xl 32.
// Fill colors/general/info/default, check colors/general/info/on.
const verifiedTickSizes = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 20, '3xl': 24, '4xl': 32 } as const;

type VerifiedTickSize = keyof typeof verifiedTickSizes;

// Fill and check colour pair per tone: `info` is the Figma default, `brand` follows the themeable brand role (the same pair as a checked Checkbox), `success` and `neutral` are for lists where blue would read as a link.
const verifiedTickTones = {
  info: { fill: 'text-general-info-default', check: 'text-general-info-on' },
  brand: { fill: 'text-background-brand-bold-default', check: 'text-text-on-brand' },
  success: { fill: 'text-general-success-default', check: 'text-general-success-on' },
  neutral: { fill: 'text-foreground', check: 'text-background' },
} as const;

type VerifiedTickTone = keyof typeof verifiedTickTones;

export interface VerifiedTickProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  size?: VerifiedTickSize;
  // Colour pair of the tick. `info` (default) keeps the Figma look, `brand` follows the theme brand colour.
  tone?: VerifiedTickTone;
  // Accessible name. Pass an empty string to hide the tick when the context already says "verified".
  label?: string;
}

const VerifiedTick = React.forwardRef<SVGSVGElement, VerifiedTickProps>(
  ({ className, size = 'lg', tone = 'info', label: labelProp, ...props }, ref) => {
    const l = useLabels();
    const label = labelProp ?? l.verified;
    const px = verifiedTickSizes[size];
    const colors = verifiedTickTones[tone] ?? verifiedTickTones.info;
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={px}
        height={px}
        role={label ? 'img' : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        data-size={size}
        data-tone={tone}
        className={cn('inline-block shrink-0', colors.fill, className)}
        {...props}
      >
        <path
          fill="currentColor"
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        />
        <g className={colors.check}>
          <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  },
);
VerifiedTick.displayName = 'VerifiedTick';

export { VerifiedTick, verifiedTickSizes, verifiedTickTones, type VerifiedTickSize, type VerifiedTickTone };
