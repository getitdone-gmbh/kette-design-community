'use client';

import { Eye, EyeOff, Loader2, Search } from 'lucide-react';
import * as React from 'react';

import { fieldHaloZero, focusRingField, invalidRing, transitionBase } from '../../lib/recipes';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { useLabels, usePreset } from './labels-context';

// Field heights: `xs` is the compact `--size-control-xs` height (28, 24 in zero), `sm`, `md` and `lg` follow the `--size-control-*` tokens (compact in zero). No size keeps the legacy field, and in the zero preset the `md` field.
export type InputSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<InputSize, string> = {
  xs: 'h-control-xs px-control-px-sm py-0',
  sm: 'h-control-sm px-control-px-sm py-0',
  md: 'h-control-md px-control-px-sm py-0',
  lg: 'h-control-lg px-control-px-sm py-0',
};

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Field height, see `InputSize`. Overrides `compact`. A number is the native `size` attribute (visible characters) and keeps the field height.
  size?: InputSize | number;
  clamp?: boolean;
  // Dense 32px field for inline rows (tables, toolbars). Default keeps the 40px field.
  compact?: boolean;
  /** `default` is the plain field; `search` wraps it with a decorative leading icon (`className` lands on the wrapper, `inputClassName` on the field). */
  variant?: 'default' | 'search';
  // Extra classes for the inner field. In the search variant `className` styles the wrapper instead.
  inputClassName?: string;
  // `readonly` sets the native readOnly attribute and the muted Figma read-only surface. Default keeps the plain look.
  appearance?: 'default' | 'readonly';
  // Trailing spinner while a value is validated or loaded (sets aria-busy).
  loading?: boolean;
  // Success border (Figma Color=Success). Invalid still wins via aria-invalid.
  success?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  // Attached blocks before/after the field: text such as "https://", a Select, or a Button.
  leadingAddon?: React.ReactNode;
  trailingAddon?: React.ReactNode;
  // Password only: adds an eye toggle (aria-pressed) that switches the field between masked and plain text.
  revealable?: boolean;
  // Accessible names of the reveal toggle. Win over the provider text.
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  // Interactive trailing slot sized for a button (copy, send). Use an icon Button with size control-sm.
  trailingAction?: React.ReactNode;
}

const iconPadLeft = 'pl-[calc(theme(spacing.4)+theme(spacing.icon-xs)+theme(spacing.gap-control))]';
const iconPadRight = 'pr-[calc(theme(spacing.4)+theme(spacing.icon-xs)+theme(spacing.gap-control))]';
// Same room when the field padding is the control token (sized fields and the zero preset).
const iconPadLeftSized = 'pl-[calc(theme(spacing.control-px-sm)+theme(spacing.icon-xs)+theme(spacing.gap-control))]';
const iconPadRightSized = 'pr-[calc(theme(spacing.control-px-sm)+theme(spacing.icon-xs)+theme(spacing.gap-control))]';
// Right padding for 0 to 2 control-sm sized actions, with or without a trailing icon before them.
const actionPad = {
  '1': 'pr-[calc(theme(spacing.control-sm)+theme(spacing.2))]',
  '2': 'pr-[calc(theme(spacing.control-sm)*2+theme(spacing.2))]',
  '1i': 'pr-[calc(theme(spacing.control-sm)+theme(spacing.2)+theme(spacing.icon-xs)+theme(spacing.gap-control))]',
  '2i': 'pr-[calc(theme(spacing.control-sm)*2+theme(spacing.2)+theme(spacing.icon-xs)+theme(spacing.gap-control))]',
} as const;
const addonBase =
  'flex shrink-0 items-center border border-solid border-input bg-muted px-3 typography-input-text text-text-muted';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      type,
      clamp = false,
      compact = false,
      size: sizeProp,
      variant = 'default',
      appearance = 'default',
      loading = false,
      success = false,
      leadingIcon,
      trailingIcon,
      leadingAddon,
      trailingAddon,
      readOnly,
      revealable = false,
      showPasswordLabel,
      hidePasswordLabel,
      trailingAction,
      ...props
    },
    ref,
  ) => {
    const l = useLabels({ showPassword: showPasswordLabel, hidePassword: hidePasswordLabel });
    const zero = usePreset() === 'zero';
    // Zero: padding follows the control padding token (10) and the field is the md height unless a size is given.
    const size = typeof sizeProp === 'string' ? sizeProp : undefined;
    const effectiveSize = size ?? (zero ? (compact ? 'sm' : 'md') : undefined);
    const [revealed, setRevealed] = React.useState(false);
    const canReveal = revealable && type === 'password';
    const effectiveType = canReveal && revealed ? 'text' : type;
    const actionCount = (canReveal ? 1 : 0) + (trailingAction ? 1 : 0);
    const readonlyLook = appearance === 'readonly';
    const trailing = loading ? (
      <Loader2 aria-hidden="true" className="h-icon-xs w-icon-xs animate-spin text-icon-subtle motion-reduce:animate-none" />
    ) : (
      trailingIcon
    );
    const hasActions = actionCount > 0;
    const decorated = Boolean(leadingIcon || trailing || leadingAddon || trailingAddon || hasActions);
    const field = (
      <input
        data-slot="input"
        type={effectiveType}
        size={typeof sizeProp === 'number' ? sizeProp : undefined}
        className={cn(
          'flex',
          'w-full',
          'rounded-control',
          'border',
          'border-solid',
          'border-input',
          'px-4',
          'py-2',
          'bg-background',
          'text-foreground',
          'file:border-0',
          'file:bg-transparent',
          'file:text-sm',
          'file:font-medium',
          'placeholder:text-input-foreground-placeholder',
          'typography-input-text',
          // Below sm the field text is at least 16px so iOS Safari does not zoom on focus.
          'max-sm:text-[max(16px,var(--typo-input-text-size,1rem))]',
          'leading-normal',
          transitionBase,
          // Hover: darker border + soft field shadow (no resting shadow, no background tint).
          'hover:border-border-bold',
          // Theme expression (kette-tokens 5.26.0): engraved bevel at rest and under the field hover shadow, data font and figures; the defaults change nothing
          'shadow-[shadow:var(--bevel-input)]',
          'hover:shadow-[shadow:var(--bevel-input),theme(boxShadow.field-hover)]',
          '[font-family:var(--font-data),sans-serif]',
          '[:where(&)]:[font-variant-numeric:var(--numeric-data)]',
          !zero && focusRingField,
          // Invalid state driven by `aria-invalid` (forwarded by <FormControl> or set directly).
          invalidRing,
          'disabled:cursor-not-allowed',
          'disabled:opacity-disabled',
          { 'text-clamp': clamp },
          { 'leading-clamp': clamp },
          zero && fieldHaloZero,
          compact && !effectiveSize && 'h-8 px-3 py-1',
          effectiveSize && SIZE_CLASS[effectiveSize],
          readonlyLook && 'bg-muted hover:border-input hover:shadow-none',
          success && 'border-border-success',
          leadingIcon && variant !== 'search' && (effectiveSize ? iconPadLeftSized : iconPadLeft),
          trailing && !hasActions && (effectiveSize ? iconPadRightSized : iconPadRight),
          hasActions && actionPad[`${actionCount as 1 | 2}${trailing ? 'i' : ''}` as keyof typeof actionPad],
          leadingAddon && 'rounded-l-none',
          trailingAddon && 'rounded-r-none',
          // Room for the leading icon: field padding + icon + control gap, all from tokens.
          variant === 'search' && (effectiveSize ? iconPadLeftSized : iconPadLeft),
          variant === 'search' ? undefined : className,
          inputClassName,
        )}
        ref={ref}
        readOnly={readonlyLook ? true : readOnly}
        aria-busy={loading || undefined}
        {...props}
      />
    );

    if (decorated && variant !== 'search') {
      return (
        <div className="flex w-full items-stretch" data-input-group="">
          {leadingAddon ? <span className={cn(addonBase, 'rounded-l-control border-r-0')}>{leadingAddon}</span> : null}
          <div className="relative min-w-0 flex-1">
            {leadingIcon ? (
              <span aria-hidden="true" className={cn('pointer-events-none absolute top-1/2 flex h-icon-xs w-icon-xs -translate-y-1/2 items-center justify-center text-icon-subtle', effectiveSize ? 'left-control-px-sm' : 'left-4')}>
                {leadingIcon}
              </span>
            ) : null}
            {field}
            {hasActions ? (
              <span className="absolute inset-y-0 right-1 flex items-center gap-1">
                {trailing ? (
                  <span className="flex h-icon-xs w-icon-xs items-center justify-center text-icon-subtle">{trailing}</span>
                ) : null}
                {canReveal ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="control-sm"
                    className="w-control-sm px-0"
                    aria-pressed={revealed}
                    aria-label={revealed ? l.hidePassword : l.showPassword}
                    disabled={props.disabled}
                    onClick={() => setRevealed((value) => !value)}
                  >
                    {revealed ? <EyeOff aria-hidden="true" className="h-icon-xs w-icon-xs" /> : <Eye aria-hidden="true" className="h-icon-xs w-icon-xs" />}
                  </Button>
                ) : null}
                {trailingAction}
              </span>
            ) : trailing ? (
              <span className={cn('absolute top-1/2 flex h-icon-xs w-icon-xs -translate-y-1/2 items-center justify-center text-icon-subtle', effectiveSize ? 'right-control-px-sm' : 'right-4')}>{trailing}</span>
            ) : null}
          </div>
          {trailingAddon ? <span className={cn(addonBase, 'rounded-r-control border-l-0')}>{trailingAddon}</span> : null}
        </div>
      );
    }

    if (variant !== 'search') return field;

    return (
      <div className={cn('relative w-full', className)} data-input-search="">
        <span
          aria-hidden="true"
          className={cn('pointer-events-none absolute top-1/2 flex h-icon-xs w-icon-xs -translate-y-1/2 items-center justify-center text-icon-subtle', effectiveSize ? 'left-control-px-sm' : 'left-4')}
        >
          {leadingIcon ?? <Search className="h-icon-xs w-icon-xs" />}
        </span>
        {field}
      </div>
    );
  },
);
Input.displayName = 'Input';

export type InputHintProps = React.HTMLAttributes<HTMLParagraphElement> & {
  /** Switches to the error hint colour. Pair with `aria-invalid` on the field and link via `aria-describedby`. */
  invalid?: boolean;
  // Hint tone: `warning` uses the warning foreground. `invalid` still wins.
  tone?: 'default' | 'warning';
};

// Helper text under a field in the `input-hint` type role (themeable size/weight).
const InputHint = React.forwardRef<HTMLParagraphElement, InputHintProps>(
  ({ className, invalid = false, tone = 'default', ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'typography-input-hint',
        invalid ? 'text-input-foreground-hint-error' : tone === 'warning' ? 'text-text-warning' : 'text-input-foreground-hint',
        className,
      )}
      {...props}
    />
  ),
);
InputHint.displayName = 'InputHint';

export { Input, InputHint };

// --- KNOWN TOKEN GAP (component-library-maintainer cannot close this from Input.tsx — it is a
// color VALUE owned by the design tokens; Input only consumes tokens by name and
// must not hardcode a raw hex/palette value around it) ---
//
// Selected-text highlight (`::selection`, i.e. the state the browser gives text the user has
// dragged over inside the field) has no dedicated token today — no `selection-background` /
// `selection-foreground` semantic role exists in the token repo, so a `selection:bg-…` utility
// would either fall back to the browser default or require a raw palette value, which is
// disallowed. Leaving the browser default un-styled until that token pair exists; add
// `selection:bg-selection-background selection:text-selection-foreground` here once it ships.
