'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { InsideCardContext } from './card';
import { usePreset } from './labels-context';

// Horizontal inset of trigger and content. Set on the root or per item, the item wins. Undefined means follow the context: inset on a standalone accordion, none inside a Card.
const AccordionInsetContext = React.createContext<boolean | undefined>(undefined);

type AccordionInsetProp = {
  // Horizontal padding (px-3) of trigger and content. Default follows the context: true standalone (page, menu, panel), false inside a Card so the labels align with the card heading (the workload.zero prototype aligns card content with the card heading). Set true or false to override.
  inset?: boolean;
};

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & AccordionInsetProp
>(({ inset, ...props }, ref) => (
  <AccordionInsetContext.Provider value={inset}>
    <AccordionPrimitive.Root ref={ref} {...(props as React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>)} />
  </AccordionInsetContext.Provider>
));
Accordion.displayName = 'Accordion';

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & AccordionInsetProp
>(({ className, inset: insetProp, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const rootInset = React.useContext(AccordionInsetContext);
  const inCard = React.useContext(InsideCardContext);
  const inset = insetProp ?? rootInset ?? !inCard;
  return (
  <AccordionInsetContext.Provider value={inset}>
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      // Dedicated Accordion surface tokens (Design Tokens "colors/accordion/background/default" +
      // "colors/accordion/foreground/default") — replaces the previous implicit (unstyled) surface
      // and the raw `border-slate-200` palette value (ACCORDION-MAT-01: no raw hex/palette in
      // product code). `border-form-border-default` is the same general-purpose content-divider
      // token already used for this exact role by Card/Dialog/Popover/Tooltip/NavigationMenu/
      // Drawer/Toast/DropdownMenu.
      'border-b border-solid bg-transparent text-foreground',
      // Zero: the default border role, the other themes keep the hairline.
      zero ? 'border-border-default' : 'border-hairline',
      className,
    )}
    {...props}
  />
  </AccordionInsetContext.Provider>
  );
});
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const inset = React.useContext(AccordionInsetContext) ?? true;
  return (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // `text-left` corrects the default `<button>` UA style (`text-align: center`) — Radix
        // renders the Trigger as a real button (see react-collapsible's `Collapsible.Trigger`), and
        // without this a wrapping multi-line header label would center instead of following the
        // left-aligned "label | chevron" row every other disclosure/menu trigger in this system uses.
        'flex flex-1 items-center justify-between gap-2 py-4 text-left transition-all [&[data-state=open]>svg]:rotate-180',
        // Zero: 44px is the minimum row height, not a fixed one, and the label has 12px (space-3) above and below, so a one-line question stays at 44px and a wrapped one grows and never touches the dividers. The line height is the zero ui token (16px; the button reset left a line height equal to the text size and a generic leading gave off-grid rows). With 12px padding the rows are 44 / 56 / 72, on the 4px grid. The chevron stays centred on the row.
        // Type comes from the dedicated `typography-accordion-title` role (size/weight/line-height/
        // letter-spacing token, currently 16px/500/24px) rather than the ad hoc `font-medium` this
        // used before. `leading-normal` is required alongside it because Tailwind Preflight resets
        // `line-height: inherit` on real `<button>` elements — same reset `button.tsx`/`input.tsx`/
        // `tabs.tsx` already work around for the same reason.
        inset && 'px-3',
        zero ? 'typography-ui-medium min-h-row py-3 leading-[var(--typo-ui-medium-lh)]' : 'typography-accordion-title leading-normal',
        // Hover — underline is the non-color-dependent cue (WCAG "don't rely on color alone");
        // paired with a full-row background wash so the entire clickable header shows affordance,
        // not just the text. No dedicated `accordion-*-hover` token exists yet (ACCORDION-MAT-02,
        // flagged below) — reuses the general-purpose `background-muted` surface wash, the same
        // fallback Chip's `default`/`secondary` variants already use for an identical gap.
        'hover:underline hover:bg-background-neutral-default',
        // Press feedback (mouse-down) — same generic fallback as Chip's `active:bg-background-neutral-default
        // active:brightness-95` for the same "no dedicated active token" gap.
        'active:bg-background-neutral-default active:brightness-95',
        // Keyboard focus ring — the system-standard treatment (matches Button, Tabs, Alert, Chip,
        // Dialog, Select, …). Previously this had no focus-visible treatment at all (WCAG 2.4.7).
        'rounded-item',
        'focus-visible:outline-none',
        'focus-visible:ring-focus',
        'focus-visible:ring-offset-focus',
        'focus-visible:ring-offset-background',
        'focus-visible:ring-ring-default',
        // Disabled — Radix's `Collapsible.Trigger` sets both a real `disabled` attribute and
        // `data-disabled` when the parent `AccordionItem` has `disabled` (ACCORDION-A11Y-01:
        // previously unsupported — a `disabled` item rendered fully interactive/clickable).
        'disabled:pointer-events-none disabled:opacity-disabled',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const inset = React.useContext(AccordionInsetContext) ?? true;
  return (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      // Type comes from the dedicated `typography-accordion-content` role (size/weight/line-height/
      // letter-spacing token, currently 14px/400/24px), replacing the ad hoc `text-sm`.
      'overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      // Reduced motion — instant show/hide instead of the height animation, matching
      // DropdownMenuContent/SelectContent/TooltipContent's identical `motion-reduce:` fallback.
      'motion-reduce:animate-none motion-reduce:transition-none',
      zero ? 'typography-ui-relaxed' : 'typography-accordion-content',
    )}
    {...props}
  >
    {/* Same horizontal padding as the trigger so the content text stays aligned with the header label. */}
    <div className={cn(inset && 'px-3', 'pb-4', zero ? 'pt-2' : 'pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };

// --- KNOWN TOKEN / SPEC GAPS (component-library-maintainer cannot close these from accordion.tsx —
// they are either color VALUES owned by the design tokens, or a missing Figma
// frame; this file only consumes token names and must not hardcode a raw hex/palette value or
// fabricate a state matrix that isn't backed by a real spec) ---
//
// 1. ACCORDION-A11Y-02 / ACCORDION-A11Y-03 (light/dark parity): re-verified 2026-07-09 against the
//    installed the design tokens (the only version published to the
//    registry — the token package returns just "3.4.10") —
//    its `dist/theme.css` still defines `--colors-accordion-background-default` and
//    `--colors-accordion-foreground-default` exactly once, in `:root`, with no `.dark` /
//    `prefers-color-scheme: dark` override, so hover:/active:bg-background-neutral-default (which DOES
//    invert in dark) is paired against a foreground that never adapts — contrast collapses to
//    ~1.2:1 in dark mode (needs >=4.5:1, WCAG 1.4.3 AA).
//    IMPORTANT: the source of truth is already fixed — `figma-tokens/default_theme_dark.json` in
//    the kette-tokens repo already carries distinct dark values (accordion/background →
//    slate.900, accordion/foreground → slate.50), and running `npm run build:css-vars` from that
//    repo's current HEAD locally reproduces the correct `.dark`/media overrides. The gap is purely
//    that the last published package (3.4.10) was not rebuilt/republished after that source fix
//    landed, so consumers are stuck on stale compiled output. BLOCKED on design-tokens-maintainer
//    cutting a new release (rebuild + `npm publish`, human release approval required) — no change
//    is possible or needed in accordion.tsx, which already consumes the correct token names. Same
//    published-vs-source staleness likely affects every other component whose only Figma-driven
//    delta is a single default-state key (e.g. dropdown-menu.tsx's own flagged token gap) and is
//    worth a repo-wide re-publish rather than a per-component patch.
//
// 2. ACCORDION-MAT-02 (no dedicated hover/active tokens): unlike Dropdown/Select's "_list item"
//    component sets, the Figma Component Library file has no Accordion frame with
//    Hover/Focus/Disabled state symbols to source exact values from — only the two surface color
//    tokens above plus the `typography/accordion-title` and `typography/accordion-content` text
//    styles exist for this component. The hover/active treatment above reuses the same
//    `background-muted` / `brightness-95` fallback Chip already uses for an identical gap, rather
//    than inventing a new one-off value.
//
// 3. "Invalid" state — not applicable: Accordion is a disclosure widget with no form-validation
//    semantics (like DropdownMenuItem), so `invalid` is intentionally not modeled here.
//
// 4. Missing Figma spec frame (routed to figma-design-sync / design-system-usage maintainers): a
//    `search_design_system` query for "Accordion" against this file (bzBnRLfRJNknGg9UYJIHb0) only
//    surfaces a stale "FAQ section" component_set hit (last updated 2024-07-23) that is not reachable
//    from any of the file's current top-level pages (Welcome, Avatars, Button, Select, Tooltips,
//    CardMetrics, Logos, Icons, Misc icons, Utilities) — i.e. no live Accordion/FAQ frame exists in
//    the file today, only the token pair + two text styles consumed above. Recommend either
//    re-adding an explicit Accordion component frame (with Hover/Focus/Disabled symbols) to the
//    Component Library file, or removing the stale search-index entry, so a future alignment pass
//    has a real states matrix to verify against instead of the Material/repo-precedent fallback
//    used here.
