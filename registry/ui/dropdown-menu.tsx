'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';

import { menuItem, menuItemDestructive, menuItemZero, overlayMotion, overlaySurface, overlaySurfaceZero } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { usePreset } from '@/components/ui/labels-context';

const DropdownMenu = DropdownMenuPrimitive.Root;

// Row density of the open menu: `touch` makes rows 44px high (touch-target-lg token) below the sm breakpoint, `auto` on coarse pointers (touch screens) at any width.
type DropdownMenuDensity = 'default' | 'touch' | 'auto';

const DropdownMenuDensityContext = React.createContext<DropdownMenuDensity>('default');

const densityRowClass = (density: DropdownMenuDensity) =>
  density === 'touch' ? 'max-sm:min-h-[var(--size-touch-target-lg)]' : density === 'auto' ? '[@media(pointer:coarse)]:min-h-[var(--size-touch-target-lg)]' : undefined;

/**
 * Plain re-export — Radix's `Menu.Group` already spreads arbitrary div props (incl.
 * `aria-labelledby`) onto its `role="group"` node (verified directly in
 * `@radix-ui/react-menu/dist/index.js`: `Primitive.div, { role: "group", ...groupProps }`), so no
 * wrapper is needed to *accept* the prop. What was missing (DROPDOWNMENU-A11Y-03) was a reliable id
 * to point it at: pair this with a `DropdownMenuLabel` by giving the label an explicit `id` and
 * passing that same string as this group's `aria-labelledby` — see the "My Account" pairing in
 * dropdown-menu.stories.tsx. `DropdownMenuLabel` also self-assigns a `React.useId()` fallback so it
 * is never id-less even when a consumer forgets to pair it.
 */
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/**
 * Left unstyled by design — matches the repo-wide "headless trigger, styled child" convention
 * already used by `PopoverTrigger`/`DialogTrigger` (see popover.tsx/dialog.tsx). A consumer always
 * composes this with `asChild` around a real focusable element (typically `<Button>`, see
 * dropdown-menu.stories.tsx), and that child already carries the system's token-based
 * `focus-visible:ring-2 ring-ring-default` treatment — adding a second, redundant ring here would
 * conflict rather than help. The Figma "Dropdown" component's own Button/Icon/Avatar trigger
 * looks are therefore not new props on this primitive; they're achieved by composition (see
 * dropdown-menu.figma.tsx).
 */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/**
 * Same passthrough-`aria-labelledby` note as `DropdownMenuGroup` above (Radix's `MenuRadioGroup`
 * renders through `MenuGroup` internally, so it inherits the same prop spread) — pair with a
 * `DropdownMenuLabel`'s `id`, as done for "Panel position" in dropdown-menu.stories.tsx.
 */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const density = React.useContext(DropdownMenuDensityContext);
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        zero ? menuItemZero : menuItem,
        densityRowClass(density),
        'data-[state=open]:bg-muted',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

/**
 * `motion-reduce:animate-none` (plus killing the transition and the closed-state animate-out
 * variant) gives `prefers-reduced-motion: reduce` users an instant show/hide instead of the
 * slide/zoom/fade — Radix still drives open/close via the `data-state` attribute, so visibility
 * itself is unaffected, only the motion is. Mirrors tooltip.tsx's `TooltipContent` /
 * select.tsx's `SelectContent` exactly.
 */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        'z-dropdown min-w-[8rem] overflow-hidden p-1',
        overlaySurface,
        zero && overlaySurfaceZero,
        overlayMotion,
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  );
});
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    // `touch`: rows are 44px high below the sm breakpoint (WCAG 2.5.5 AAA, always above the 24px minimum of 2.5.8). Use it for menus opened from a mobile trigger, for example the More menu of a page header. `auto`: 44px rows on coarse pointers at any width. Default keeps the dense rows.
    density?: DropdownMenuDensity;
  }
>(({ className, sideOffset = 4, density = 'default', children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        data-density={density === 'default' ? undefined : density}
        className={cn(
          'z-dropdown min-w-[8rem] overflow-hidden p-1',
          overlaySurface,
        zero && overlaySurfaceZero,
          overlayMotion,
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        <DropdownMenuDensityContext.Provider value={density}>{children}</DropdownMenuDensityContext.Provider>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    /** `destructive` renders the row in the destructive role (delete, remove, sign out). */
    variant?: 'default' | 'destructive';
  }
>(({ className, inset, variant = 'default', ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const density = React.useContext(DropdownMenuDensityContext);
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        zero ? menuItemZero : menuItem,
        densityRowClass(density),
        'cursor-pointer',
        variant === 'destructive' && menuItemDestructive,
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const density = React.useContext(DropdownMenuDensityContext);
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        zero ? menuItemZero : menuItem,
        densityRowClass(density),
        'pl-8',
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-[14px] w-[14px] items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const density = React.useContext(DropdownMenuDensityContext);
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        zero ? menuItemZero : menuItem,
        densityRowClass(density),
        'pl-8',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-[14px] w-[14px] items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/**
 * Hierarchy is via size/color only (muted color), never weight — matching the org's "weight 400
 * only" typography rule (ui-laws) and aligning with SelectLabel's identical mechanism
 * (select.tsx:146-165, `typography-input-text text-sm text-text-subtle`, no bold). Previously
 * this used `font-semibold text-menu-foreground-default` (full-contrast + bold), which read
 * visibly heavier than the equivalent Select group label for the same semantic role
 * (MAT-1) with no documented Figma rationale.
 *
 * Checked against Figma: the only bold/Semi-Bold 14px text in this file's Dropdown-adjacent specs
 * is the "_Dropdown list header" component (Component Library file, page "↳ Select" 18:0, frame
 * 3281:382878, `typography/label-highlight`) — but that component renders a person's *name* in an
 * avatar-identity header ("Full name" / "Account menu"), a distinct composed pattern from the
 * plain group/section label role this primitive fills ("My Account", "Appearance", "Panel
 * position" in dropdown-menu.stories.tsx). It is not evidence for bolding this primitive and is
 * not modeled here; an avatar/identity header remains a composition of `Avatar` + text, same as
 * this file's other "achieved by composition" notes (see DropdownMenuTrigger above).
 *
 * Follow-up routed (not fixed here, out of this file's scope): Command's `[cmdk-group-heading]`
 * (command.tsx:82, `text-xs font-medium text-muted-foreground`) is a THIRD divergent mechanism for
 * the same role and should be reconciled to this same muted-color-only rationale.
 *
 * DROPDOWNMENU-A11Y-03 (WCAG 1.3.1): Radix's `Menu.Label` (and the plain `Menu.Group` /
 * `Menu.RadioGroup` re-exports above) render a `role="group"`/label pair with no automatic
 * `id`/`aria-labelledby` link between them — a screen-reader user otherwise hears the label as
 * unstructured text followed by an anonymous "group". This wrapper self-assigns a `React.useId()`
 * fallback so the label always carries a stable `id` (overridable via an explicit `id` prop);
 * pairing it with a sibling `DropdownMenuGroup`/`DropdownMenuRadioGroup`'s `aria-labelledby` is the
 * consumer's responsibility (see dropdown-menu.stories.tsx's "My Account"/"Appearance"/
 * "Panel position" pairings) since Label and Group are unrelated siblings, not parent/child.
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, id, ...props }, ref) => {
  const generatedId = React.useId();
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      id={id ?? generatedId}
      className={cn('px-2 py-[6px] text-xs text-muted-foreground', inset && 'pl-8', className)}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border-subtle', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/**
 * Uses the dedicated `menu-foreground-muted` color token (Figma shortcut text: 12px regular in
 * slate-500/slate-400) rather than dimming the inherited text color via `opacity-disabled` — the
 * previous `opacity-disabled` approach visually double-dimmed a shortcut inside an already-
 * disabled `DropdownMenuItem` (60% x 60% opacity), since `data-[disabled]:opacity-disabled` is
 * also applied one level up on the item itself.
 */
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />;
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  type DropdownMenuDensity,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};

// --- KNOWN TOKEN GAPS (component-library-maintainer cannot close these from dropdown-menu.tsx —
// they are color VALUES owned by the design tokens; this file only consumes
// the token by name and must not hardcode a raw hex/palette value around them) ---
//
// 1. Item/SubTrigger highlight boundary contrast (WCAG 1.4.11 non-text contrast —
//    DROPDOWNMENU-A11Y-01): `colors/menu/background/hover` (slate-100 light / slate-800 dark) is
//    only one step away from `colors/dropdown/background/default` (white light / slate-900 dark)
//    — ~1.1:1 luminance contrast in both themes, under the 3:1 minimum for a UI-component
//    boundary. Mitigated today with an inset `ring-menu-foreground-default` (see Item/SubTrigger/
//    CheckboxItem/RadioItem above); once the token repo gives `menu-background-hover` (or a new
//    dedicated boundary token) more contrast against `dropdown-background-default`, the ring
//    becomes decorative reinforcement rather than the sole boundary cue.
//
// 2. No dedicated "active/pressed" menu token (DROPDOWNMENU-MAT-01): unlike
//    `general-{info,success,error}-active`, there is no `menu-background-active` distinct from
//    `-hover` — the `active:` (mouse-down) press state above reuses `menu-background-hover`.
//    Add a dedicated token if a visually distinct press state is ever required.
//
// 3. "Invalid" state — not applicable: the Figma "_Command dropdown menu item" component set has
//    no Invalid/Error variant and the token search returns no `menu-*` error/invalid color. A menu
//    item selecting an action has no form-validation semantics, so `invalid` is intentionally not
//    modeled here (unlike Chip/Select, which back real form fields) — flagged rather than
//    fabricated.
//
// 4. Light/dark parity is completely missing for this component's tokens (DROPDOWNMENU-A11Y-02):
//    verified against the built the design tokens output in this repo
//    (public/theme.css) — `--colors-dropdown-background-default`, `--colors-menu-background-hover`,
//    `--colors-menu-foreground-default`, `--colors-menu-foreground-muted`,
//    `--colors-form-border-default`, and `--colors-ring-default` are each defined exactly once in
//    `:root` with NO override in the `.dark` block (line 347+) or the
//    `prefers-color-scheme: dark` media block (line 456+) — light and dark render byte-identical
//    values for every one of these 6 keys. This is a token-VALUE gap this file cannot close (this
//    component only consumes the token names above; the values live in
//    the design tokens (`styles/theme.css`), `figma-tokens/default_theme_dark.json` or the relevant
//    per-theme dark override). BLOCKED on design-tokens-maintainer adding distinct dark values for
//    all 6 keys and rebuilding (`build:css-vars`, `build:themes`), each meeting >=4.5:1 (text) /
//    >=3:1 (ring/border) against the new dark panel background — kette-design-enterprise cannot
//    verify or fix this from dropdown-menu.tsx.
