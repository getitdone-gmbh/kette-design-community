'use client';

import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, X } from 'lucide-react';
import { cloneElement, forwardRef, isValidElement, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { useLabels, usePreset } from './labels-context';
import type { LabelProp } from './labels';
import type { SkillCategory } from './skill-category';

const CATEGORY_DOT = {
  1: 'bg-chart-1',
  2: 'bg-chart-2',
  3: 'bg-chart-3',
  4: 'bg-chart-4',
  5: 'bg-chart-5',
  6: 'bg-chart-6',
  7: 'bg-chart-7',
  8: 'bg-chart-8',
} as const;

// Weighted skill chip fills (Figma Chip Style=Weighted): skill category fill with its on-fill text pair. Full class strings so Tailwind finds every token.
// The on-fill pair is the AA-safe one per category (the Figma file asks for white on all fills, which fails 4.5:1 on several of them).
const SKILL_FILL: Record<SkillCategory, string> = {
  frontend: 'bg-data-skill-frontend-default text-data-skill-frontend-on-fill hover:bg-data-skill-frontend-default active:bg-data-skill-frontend-default',
  backend: 'bg-data-skill-backend-default text-data-skill-backend-on-fill hover:bg-data-skill-backend-default active:bg-data-skill-backend-default',
  'devops-cloud': 'bg-data-skill-devops-cloud-default text-data-skill-devops-cloud-on-fill hover:bg-data-skill-devops-cloud-default active:bg-data-skill-devops-cloud-default',
  'data-ai': 'bg-data-skill-data-ai-default text-data-skill-data-ai-on-fill hover:bg-data-skill-data-ai-default active:bg-data-skill-data-ai-default',
  'design-ux': 'bg-data-skill-design-ux-default text-data-skill-design-ux-on-fill hover:bg-data-skill-design-ux-default active:bg-data-skill-design-ux-default',
  mobile: 'bg-data-skill-mobile-default text-data-skill-mobile-on-fill hover:bg-data-skill-mobile-default active:bg-data-skill-mobile-default',
  security: 'bg-data-skill-security-default text-data-skill-security-on-fill hover:bg-data-skill-security-default active:bg-data-skill-security-default',
  'testing-qa': 'bg-data-skill-testing-qa-default text-data-skill-testing-qa-on-fill hover:bg-data-skill-testing-qa-default active:bg-data-skill-testing-qa-default',
  infrastructure: 'bg-data-skill-infrastructure-default text-data-skill-infrastructure-on-fill hover:bg-data-skill-infrastructure-default active:bg-data-skill-infrastructure-default',
  'project-management': 'bg-data-skill-project-management-default text-data-skill-project-management-on-fill hover:bg-data-skill-project-management-default active:bg-data-skill-project-management-default',
  'business-strategy': 'bg-data-skill-business-strategy-default text-data-skill-business-strategy-on-fill hover:bg-data-skill-business-strategy-default active:bg-data-skill-business-strategy-default',
  fallback: 'bg-data-skill-fallback-default text-data-skill-fallback-on-fill hover:bg-data-skill-fallback-default active:bg-data-skill-fallback-default',
};

// Selected check size per chip size, from the icon size tokens.
const CHECK_SIZE = {
  small: 'h-icon-2xs w-icon-2xs',
  dense: 'h-icon-2xs w-icon-2xs',
  compact: 'h-icon-2xs w-icon-2xs',
  medium: 'h-icon-xs w-icon-xs',
  control: 'h-icon-xs w-icon-xs',
  large: 'h-icon-sm w-icon-sm',
} as const;

const chipVariants = cva(
  [
    'font-regular inline-flex max-w-full items-center whitespace-nowrap rounded-full border border-solid transition-colors',
    'focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-ring-default focus-visible:ring-offset-focus focus-visible:ring-offset-background',
    // Chip renders a <div>, not a native form control, so the disabled look is driven by
    // `aria-disabled`/`data-disabled` rather than the (inapplicable) `disabled:` pseudo-class.
    'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-disabled',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-transparent bg-background-neutral-subtle text-text-default',
          'hover:bg-background-neutral-default',
          'active:bg-background-neutral-default active:brightness-95',
        ],
        // Opt-in stronger neutral fill (slate-200) for chips on white surfaces.
        neutral: [
          'border-transparent bg-background-neutral-default text-text-default',
          'hover:bg-background-neutral-hover',
          'active:bg-background-neutral-hover active:brightness-95',
        ],
        // Regular `border-default` edge (same family as Card/Input); the near-black general-border-default was too heavy.
        secondary: [
          'border-border-default bg-transparent text-text-subtle',
          'hover:bg-background-neutral-subtle',
          'active:bg-background-neutral-default active:brightness-95',
        ],
        // Attio-style outline tag: transparent fill, 1px hairline, `rounded-item` (6px), 12px/500
        // `text-foreground`. At size `small` the height is a fixed 22px.
        outline: [
          'rounded-item border-hairline bg-transparent text-xs font-medium text-foreground',
          'hover:bg-muted',
          'active:bg-muted-strong',
        ],
        // Muted neutral: quiet surface fill for low-emphasis tags. text-muted is >= 5.71:1 on bg-muted in every theme (text-subtle was 4.34:1 in light). Hover is the neutral hover fill (one step above muted), press is muted-strong; both with text-default.
        muted: [
          'border-transparent bg-muted text-text-muted',
          'hover:bg-background-neutral-hover hover:text-text-default',
          'active:bg-muted-strong active:text-text-default',
        ],
        info: [
          'border-transparent bg-general-info-default text-general-info-on',
          'hover:bg-general-info-hover',
          'active:bg-general-info-active',
        ],
        success: [
          // Rest fill is the `-hover` step: `-default` fails 4.5:1 with `-on` in light themes.
          'border-transparent bg-general-success-hover text-general-success-on',
          'hover:brightness-95',
          'active:brightness-90',
        ],
        destructive: [
          'border-transparent bg-general-error-default text-general-error-on',
          'hover:bg-general-error-hover',
          'active:bg-general-error-active',
        ],
        // Reserved for a normal, frequent high-priority state: `destructive` stays reserved
        // for true errors, so high priority uses the warning hue.
        warning: [
          // Rest fill is the `-hover` step: `-default` fails 4.5:1 with `-on` in light themes.
          'border-transparent bg-general-warning-hover text-general-warning-on',
          'hover:brightness-95',
          'active:brightness-90',
        ],
      },
      size: {
        small: 'text-xs px-2 leading-5',
        // Medium shares the Button sm height (h-control-sm token), so chips and buttons line up in one row.
        medium: 'h-control-sm text-xs px-2 leading-none',
        large: 'text-sm px-3 leading-[32px]',
        // Filter chip: control height (28), 8px padding, item radius, extra-small type role.
        // Denser than small: 20px high, 4px padding, extra-small type role, for tables and tight rows.
        dense: 'h-5 gap-1 px-1 typography-text-extra-small leading-none',
        control: 'h-control-sm gap-gap-control rounded-item px-2 leading-none',
        // Tag size of the zero chips: 24px high, item radius, detail type role.
        compact: 'h-6 gap-gap-control rounded-item px-2 typography-detail leading-none',
      },
      // Persistent chosen/toggled-on look (e.g. an active filter chip). The color per variant is
      // resolved via the compoundVariants below, since "selected" augments whichever variant is
      // active rather than replacing it.
      //
      // KNOWN TOKEN GAP: none of the general-{info,success,error} color families ship a token
      // dedicated to "selected" — the compoundVariants below fall back to the same `-active` token
      // used for the transient `:active` (mouse-down) press state, and `default`/`secondary`
      // selected falls back to the same token used for `:hover`. Per the design-tokens source
      // (the design tokens), `general-{info,success,error}-active` is in fact
      // byte-identical to `-default` in both themes today, so there is no existing token that can
      // give "selected" a color identity distinct from hover/press without a token-repo change.
      // Until that token gap is closed, the leading checkmark rendered below — not this background
      // color — is the authoritative "this is selected" signal; never assume color alone proves it.
      selected: {
        true: '',
      },
      // Tinted status form (container fill, on-container text) of info, success, warning and destructive.
      tinted: {
        true: '',
      },
      // Categorical palette (1 to 8, chart tokens): tinted chart-subtle fill with a category coloured border and dot.
      category: {
        1: 'border-chart-1',
        2: 'border-chart-2',
        3: 'border-chart-3',
        4: 'border-chart-4',
        5: 'border-chart-5',
        6: 'border-chart-6',
        7: 'border-chart-7',
        8: 'border-chart-8',
      },
      // Text strength of the muted variant. muted (default) uses text-muted, default aligns with the neutral variant (text-default).
      mutedText: {
        muted: '',
        default: '',
      },
      // Figma Tag Style=Dashed: transparent chip with a dashed outline ("add filter" affordance).
      dashed: {
        true: '',
      },
      // Figma Tag Hit=True: search/skill match highlight.
      hit: {
        true: '',
      },
      // Figma Chip Style=Default|Text only|Product dot. `default` leaves the variant look untouched.
      // Product preset (DesignSystemProvider `preset`). `zero` gives the default chip the outline tag look and the control label the 12/500 detail role.
      preset: {
        default: '',
        zero: '',
      },
      chipStyle: {
        default: '',
        textOnly: '',
        productDot: '',
        weighted: '',
      },
    },
    compoundVariants: [
      // Control label type: extra-small by default, detail (12/500) in zero. Exclusive classes, so the roles never fight over the font size.
      { size: 'control', preset: 'default', className: 'typography-text-extra-small' },
      { size: 'control', preset: 'zero', className: 'typography-detail' },
      // Zero: the plain chip is the outline tag (item radius, default border, page fill). Placed first so selected and the other compounds can still override the fill.
      { preset: 'zero', variant: 'default', className: 'rounded-item border-border-default bg-background text-foreground hover:bg-muted active:bg-muted-strong' },
      { preset: 'zero', variant: ['outline', 'secondary'], className: 'border-border-default' },
      // Zero: tag heights sit on the control scale (24 and 28) and the label is 12/500. Status meaning (info, success, warning, destructive) is the tinted item-radius badge look, not a solid pill.
      { preset: 'zero', size: 'small', className: 'h-control-xs leading-none' },
      { preset: 'zero', size: 'large', className: 'h-control-sm leading-none' },
      { preset: 'zero', size: ['small', 'medium', 'large'], variant: ['default', 'outline', 'secondary', 'neutral', 'muted'], className: 'font-medium' },
      { preset: 'zero', variant: ['info', 'success', 'warning', 'destructive'], className: 'rounded-item font-medium' },
      { variant: 'outline', size: 'small', className: 'h-badge leading-none' },
      // Filter chip surface: muted fill with a hairline border on the neutral variants.
      { variant: 'default', size: 'control', className: 'border-hairline bg-muted text-foreground' },
      { variant: 'outline', size: 'control', className: 'border-hairline bg-muted text-foreground' },
      { variant: 'default', selected: true, className: 'bg-background-neutral-default' },
      // Neutral already rests on the default fill, so selected steps up to the hover fill.
      { variant: 'neutral', selected: true, className: 'bg-background-neutral-hover' },
      // Muted text at the neutral strength (text-default instead of text-muted). Hover and press keep text-default.
      { variant: 'muted', mutedText: 'default', className: 'text-text-default' },
      { variant: 'secondary', selected: true, className: 'bg-background-neutral-default' },
      { variant: 'outline', selected: true, className: 'bg-muted' },
      { variant: 'info', selected: true, className: 'bg-general-info-active' },
      { variant: 'success', selected: true, className: 'bg-general-success-hover' },
      { variant: 'destructive', selected: true, className: 'bg-general-error-active' },
      { variant: 'warning', selected: true, className: 'bg-general-warning-hover' },
      { variant: 'info', tinted: true, className: 'bg-general-info-container text-general-info-on-container hover:bg-general-info-container active:bg-general-info-container active:brightness-95' },
      { variant: 'success', tinted: true, className: 'bg-general-success-container text-general-success-on-container hover:bg-general-success-container active:bg-general-success-container active:brightness-95' },
      { variant: 'warning', tinted: true, className: 'bg-general-warning-container text-general-warning-on-container hover:bg-general-warning-container active:bg-general-warning-container active:brightness-95' },
      { variant: 'destructive', tinted: true, className: 'bg-general-error-container text-general-error-on-container hover:bg-general-error-container active:bg-general-error-container active:brightness-95' },
      // A selected tinted chip has no stronger fill, so it gets a currentColor border instead.
      { tinted: true, selected: true, className: 'border-current' },
      // Categorical chips use the tinted chart fill (AA text contrast in light and dark); border and dot keep the category colour.
      { category: 1, className: 'bg-chart-subtle-1 text-text-default hover:bg-chart-subtle-1 hover:brightness-95' },
      { category: 2, className: 'bg-chart-subtle-2 text-text-default hover:bg-chart-subtle-2 hover:brightness-95' },
      { category: 3, className: 'bg-chart-subtle-3 text-text-default hover:bg-chart-subtle-3 hover:brightness-95' },
      { category: 4, className: 'bg-chart-subtle-4 text-text-default hover:bg-chart-subtle-4 hover:brightness-95' },
      { category: 5, className: 'bg-chart-subtle-5 text-text-default hover:bg-chart-subtle-5 hover:brightness-95' },
      { category: 6, className: 'bg-chart-subtle-6 text-text-default hover:bg-chart-subtle-6 hover:brightness-95' },
      { category: 7, className: 'bg-chart-subtle-7 text-text-default hover:bg-chart-subtle-7 hover:brightness-95' },
      { category: 8, className: 'bg-chart-subtle-8 text-text-default hover:bg-chart-subtle-8 hover:brightness-95' },
      // Text only: no fill, no border, coloured text. The colour follows the variant tone.
      { chipStyle: 'textOnly', className: 'rounded-item border-transparent bg-transparent text-text-default hover:bg-transparent active:bg-transparent active:brightness-100' },
      { chipStyle: 'textOnly', variant: 'info', className: 'text-text-brand' },
      { chipStyle: 'textOnly', variant: 'success', className: 'text-text-success' },
      { chipStyle: 'textOnly', variant: 'warning', className: 'text-text-warning' },
      { chipStyle: 'textOnly', variant: 'destructive', className: 'text-text-destructive' },
      // Product dot: neutral surface and hairline border, square dot in the product colour, dark text.
      { chipStyle: 'productDot', className: 'gap-2 rounded-item border-hairline bg-background-default text-xs font-medium text-text-default hover:bg-background-default active:bg-background-default active:brightness-100' },
      // Weighted: filled skill chip, no hairline border, fixed 22px height. Fill and text come from `skill`.
      { chipStyle: 'weighted', className: 'h-badge border-transparent font-medium leading-none active:brightness-100' },
      { preset: 'zero', size: 'control', variant: ['default', 'outline'], className: 'border-border-default' },
      { preset: 'zero', chipStyle: 'productDot', className: 'border-border-default' },
      { dashed: true, className: 'border-dashed border-input bg-transparent text-text-subtle hover:bg-muted' },
      // Zero: dashed rests on the page fill with default text, chosen takes the brand tint without a check icon (see `hideCheck`).
      { dashed: true, preset: 'zero', className: 'bg-background text-text-default' },
      { selected: true, preset: 'zero', variant: ['default', 'outline', 'secondary', 'neutral'], className: 'border-chip-border-selected bg-chip-background-selected text-chip-foreground-selected hover:bg-chip-background-selected' },
      { dashed: true, selected: true, preset: 'zero', className: 'border-chip-border-selected bg-chip-background-selected text-chip-foreground-selected hover:bg-chip-background-selected' },
      { hit: true, className: 'border-transparent bg-highlight-hit-default text-highlight-hit-on hover:bg-highlight-hit-default' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'small',
      preset: 'default',
    },
  },
);

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement>, Omit<VariantProps<typeof chipVariants>, 'preset'> {
  /**
   * Dims the chip and blocks pointer interaction. Chip is not a native form control, so this is
   * expressed via `aria-disabled`/`data-disabled` rather than the HTML `disabled` attribute — a
   * nested interactive child (e.g. a trailing remove button) still needs its own `disabled` prop
   * set independently (see `MultiSelect`'s usage). Also suppresses interactive mode (see `onClick`).
   */
  disabled?: boolean;
  /**
   * Forces the destructive/error token treatment and sets `aria-invalid`, e.g. for an invalid tag
   * inside a tag/email input. Takes precedence over `variant`. `aria-invalid` alone is not
   * reliably announced on a non-widget element, so an additional screen-reader-only "(invalid)"
   * cue is appended to the label.
   */
  invalid?: boolean;
  label?: string;
  /**
   * Optional leading icon — e.g. a status glyph so the `info`/`success`/`destructive`/`invalid`
   * treatments aren't color-only. Ignored while `selected` is true: per Material's filter-chip
   * anatomy, the leading position always shows the checkmark once selected (mirrors `Button`'s
   * `dotLeading` taking precedence over `icon`).
   */
  icon?: ReactNode;
  /**
   * Renders a small leading dot (like `Button`'s `dotLeading`), e.g. a project color. Takes
   * precedence over `icon` but not over the `selected` checkmark. Purely decorative (`aria-hidden`),
   * so the label must carry the meaning.
   */
  dotLeading?: boolean;
  /**
   * Color of the leading dot: any CSS color (`var(--project-blue)`, `#2563eb`) or a token utility
   * class (`bg-general-info-default`). Classes (strings starting with `bg-`) are applied as
   * `className`, everything else as inline `background-color`. Defaults to `currentColor`.
   */
  dotColor?: string;
  /** Opt-in trailing close button (icon-xs glyph, 24px hit area); use on static chips, not with `onClick`. */
  onRemove?: () => void;
  /** Accessible name of the remove button, a string or a function of the label. Defaults to `Remove <label>`. */
  removeLabel?: LabelProp<[string | undefined]>;
  // Screen reader suffixes for a chosen or invalid static chip. Win over the provider text.
  selectedLabel?: string;
  invalidLabel?: string;
  // Visual style (Figma Chip Style). `textOnly` shows only coloured text (tone from `variant`: info, success, warning, destructive, default). `productDot` shows a neutral bordered chip with a square leading dot in `dotColor` (a product or project colour) and dark text.
  chipStyle?: 'default' | 'textOnly' | 'productDot' | 'weighted';
  // Skill category of a `weighted` chip: sets the fill and its on-fill text colour. Defaults to `fallback` (Figma Color=Skill Other).
  skill?: SkillCategory;
  // Weight text of a `weighted` chip after the label, for example `weight 3` (Figma Weight text, Show weight).
  weight?: ReactNode;
  // Text strength of the muted variant. `muted` (default) keeps the quiet text role, `default` aligns the text with the neutral variant.
  mutedText?: 'muted' | 'default';
  // Shape of the leading dot. Defaults to `round`, or `square` for a `productDot` chip. An explicit value wins in every chip style.
  dotShape?: 'round' | 'square';
  // Muted suffix after the label of a `productDot` chip, for example `.zero` (Figma Chip Style=Product dot, Show suffix). Regular weight, subtle text.
  suffix?: ReactNode;
  // Muted secondary text after the label (Figma Tag Meta), for example "3+ yrs".
  meta?: ReactNode;
  // Small count pill after the label (Figma Tag Action=Count).
  count?: number | string;
  // Renders an anchor (link mode). Ignored while `disabled`; the remove button is not rendered in link mode.
  href?: string;
  // Renders the single child (for example a router link) with the chip styling and content inside it.
  asChild?: boolean;
  // Leading avatar. Unlike `icon` it stays visible when the chip is selected.
  avatar?: ReactNode;
  // Keeps `icon` (or `avatar`) in place when selected instead of swapping it for the checkmark.
  keepLeadingWhenSelected?: boolean;
}

const Chip = forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      selected,
      disabled,
      invalid,
      label,
      icon,
      dotLeading = false,
      dotColor,
      onRemove,
      removeLabel,
      selectedLabel,
      invalidLabel,
      meta,
      suffix,
      dotShape,
      count,
      href,
      asChild = false,
      avatar,
      keepLeadingWhenSelected = false,
      tinted,
      mutedText,
      category,
      dashed,
      hit,
      chipStyle,
      skill,
      weight,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    // Chip is a static tag/label by default (a plain <div>, matching how MultiSelect etc. already
    // wire a real nested <button> for the parts of a chip that need to be operable). Passing
    // `onClick` opts a given Chip into the interactive "filter chip" pattern instead: a real tab
    // stop, `aria-pressed` reflecting `selected`, and Enter/Space activation — so the focus-visible
    // ring above is only ever reachable on a chip that is actually keyboard-operable.
    const l = useLabels({ remove: removeLabel, selectedSuffix: selectedLabel, invalidSuffix: invalidLabel });
    const zero = usePreset() === 'zero';
    const isLink = (href != null || asChild) && !disabled;
    const interactive = Boolean(onClick) && !disabled && !isLink;

    // WCAG 2.2 SC 2.5.8 (Target Size Minimum): `size="small"` renders a ~22px line box (20px
    // line-height + 1px border per edge), which clears the 24x24 CSS-px floor for a purely visual
    // tag/label but not for a real pointer/touch target. Only bump the hit area when the chip is
    // actually operable (`interactive`) — a static small tag stays visually compact, since it
    // carries no click/touch target to protect. `min-h-target` = 24px (token utility; the preset replaces the min-height scale, so `min-h-6` compiles to nothing), matching the Tailwind spacing
    // scale already used for other minimum-dimension cases (e.g. Switch's 24px track height).
    const effectiveSize = size ?? 'small';
    const resolvedVariant = invalid ? 'destructive' : variant;
    // Zero routes status meaning to the tinted look unless the caller sets `tinted` itself.
    const statusVariant = resolvedVariant === 'info' || resolvedVariant === 'success' || resolvedVariant === 'warning' || resolvedVariant === 'destructive';
    // Filled status chips (info, success, warning, destructive) carry the on-fill text role; the secondary text inherits it instead of the muted grey.
    const metaOnFill = statusVariant && chipStyle !== 'textOnly' && chipStyle !== 'productDot' && chipStyle !== 'weighted';
    // Dense chips that are operable get the same 24px floor.
    const meetsMinTargetSize = interactive && (effectiveSize === 'small' || effectiveSize === 'dense') ? 'min-h-target' : undefined;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (!interactive || event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as unknown as MouseEvent<HTMLDivElement>);
      }
    };

    // Categorical chips show a dot in the category colour unless a dot colour is given.
    const categoryDot = category != null && !dotColor ? CATEGORY_DOT[category] : undefined;
    const effectiveDotColor = dotColor ?? categoryDot;
    const dotIsClass = effectiveDotColor?.startsWith('bg-');
    const isProductDot = chipStyle === 'productDot' && !invalid;
    const isTextOnly = chipStyle === 'textOnly' && !invalid;
    const isWeighted = chipStyle === 'weighted' && !invalid;
    const showDot = (dotLeading || isProductDot || isWeighted || categoryDot != null) && !isTextOnly;
    const dot = showDot ? (
      <span
        aria-hidden="true"
        data-chip-dot=""
        className={cn(
          'inline-block h-2 w-2 shrink-0',
          (dotShape ?? (isProductDot ? 'square' : 'round')) === 'square' ? 'rounded-xs' : 'rounded-full',
          !isProductDot && 'mr-[6px]',
          dotIsClass ? effectiveDotColor : 'bg-current',
        )}
        style={effectiveDotColor && !dotIsClass ? { backgroundColor: effectiveDotColor } : undefined}
      />
    ) : null;

    const keepLeading = keepLeadingWhenSelected || avatar != null;
    const ownLeading = avatar ?? icon;
    // Zero: a chosen chip shows the brand tint and no check icon.
    const hideCheck = zero && !keepLeading;
    const rawIcon = isTextOnly
      ? null
      : selected && hideCheck
        ? showDot
          ? null
          : ownLeading
      : selected && !(keepLeading && ownLeading)
        ? <Check aria-hidden="true" data-chip-check="" className={CHECK_SIZE[effectiveSize]} />
        : showDot
          ? null
          : ownLeading;
    const leadingIcon = rawIcon
      ? isValidElement<{ className?: string; 'data-chip-check'?: string }>(rawIcon)
        ? cloneElement(rawIcon, { className: cn('mr-1 shrink-0', rawIcon.props['data-chip-check'] !== undefined ? undefined : avatar != null ? 'h-4 w-4' : 'h-3 w-3', rawIcon.props.className) })
        : rawIcon
      : null;

    const Comp = (asChild ? Slot : isLink ? 'a' : 'div') as React.ElementType;
    const keptSelected = Boolean(selected && keepLeading && ownLeading);

    return (
      <Comp
        ref={ref}
        href={isLink && !asChild ? href : undefined}
        aria-current={isLink && selected ? 'true' : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive && selected != null ? Boolean(selected) : undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          chipVariants({ variant: invalid ? 'destructive' : variant, size, preset: zero ? 'zero' : 'default', selected, tinted: tinted ?? (zero && statusVariant ? true : undefined), mutedText, category: invalid ? undefined : category, dashed, hit, chipStyle: invalid ? 'default' : chipStyle }),
          isWeighted && SKILL_FILL[skill ?? 'fallback'],
          meetsMinTargetSize,
          isLink && 'min-h-target',
          keptSelected && 'border-general-border-default',
          className,
        )}
        {...props}
      >
        {dot}
        {leadingIcon}
        {label != null || !asChild ? (
          <span className="-my-1 min-w-0 truncate py-1" title={label}>
            {label}
          </span>
        ) : null}
        {/* aria-pressed already announces selection on an interactive chip; a non-interactive
            "chosen" chip has no ARIA widget role to carry that state, so say it in text instead
            of relying solely on the (currently color-duplicated, see token-gap note above)
            background tint or the decorative checkmark alone. */}
        {suffix != null && isProductDot && (
          <span className="-ml-1 shrink-0 font-regular text-text-subtle" data-chip-suffix="">
            {suffix}
          </span>
        )}
        {meta != null && <span className={cn('ml-1 shrink-0 font-regular', metaOnFill ? 'text-current' : 'text-text-muted')} data-chip-meta="">
            {meta}
          </span>}
        {count != null && (
          <span
            className={cn('ml-1 shrink-0 rounded-full px-1 tabular-nums', tinted ? 'bg-transparent text-current' : 'bg-muted text-text-muted')}
            data-chip-count=""
          >
            {count}
          </span>
        )}
        {isWeighted && weight != null && (
          <span className="ml-1 shrink-0 font-regular typography-text-extra-small" data-chip-weight="">
            {weight}
          </span>
        )}
        {selected && !interactive && <span className="sr-only">{l.selectedSuffix}</span>}
        {invalid && <span className="sr-only">{l.invalidSuffix}</span>}
        <Slottable>{children}</Slottable>
        {onRemove && !isLink && (
          <button
            type="button"
            disabled={disabled}
            aria-label={l.remove(label)}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className={cn(
              '-my-1 -mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-item text-icon-subtle transition-colors',
              'hover:text-icon-default focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default',
              'disabled:pointer-events-none',
            )}
          >
            <X aria-hidden="true" className="h-icon-xs w-icon-xs" />
          </button>
        )}
      </Comp>
    );
  },
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };

// --- KNOWN TOKEN GAPS (component-library-maintainer cannot close these from Chip.tsx — they are
// color VALUES owned by the design tokens; Chip only consumes the token by name
// and must not hardcode a raw hex/palette value around them) ---
//
// 1. `secondary` border (CHIP-MAT-01): deliberately moved to the regular `border-default` token (same
//    family as Card/Input). The edge is intentionally soft; a non-interactive chip needs no 3:1 boundary.
//
// 2. `success` and `warning` filled text (WCAG 1.4.3, CHIP-A11Y-04): closed in 0.12.1 without a token
//    change. `-default` fails 4.5:1 against `-on` in light themes (3.60 and 3.40), so the filled chip
//    rests on the `-hover` step (5.24 and 4.95 light, 9.29 and 7.89 dark) and presses via brightness.
