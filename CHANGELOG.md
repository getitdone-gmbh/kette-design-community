# Changelog

This package is a copy of the general components of the Get IT Done design system. Each release names the library and token versions it was synced from. Only changes to components that are part of this package are listed.

## 0.4.6

Synced from kette-design-enterprise 0.31.0 and kette-tokens 5.26.0 (library changelogs 0.27.19 to 0.31.0, token changelogs 5.25.0 and 5.26.0). Only the changes to components and theme parts that are in this package are listed.

### Components

- **Theme expression** (kette-tokens 5.26.0): `Button` (gradient and bevel per variant and state over its own elevation, filled button font, case, tracking and text shadow), `Card` and the content `Card`, `Dialog`, `Sheet`, `Tabs`, `Table` header, `TopBar`, `Sidebar`, `Badge`, `Alert`, `Input`, `Checkbox`, `Switch` and `FileIcon` read the new expression roles (`image-*`, `bevel-*`, `frame-*`, `glow-focus`, `font-display`, `font-button-filled`, `font-tab`, `font-data`). In the zero theme every role has its neutral default, so the look does not change.
- **Checked controls**: `Checkbox`, `RadioGroupItem`, the radio mark of `RadioCards` and `Switch` take their border from `border-border-control-checked` (an alias of the brand fill in zero, no visible change).
- **`Button` `outline-destructive`**: text and border on `text-text-destructive` and `border-border-destructive` instead of the fill token. **`FileIcon`** error tag text on `text-text-on-destructive`.
- **`Sheet`**: opens on the first visible focusable element, links included; the close button is first in the tab order; `focusOnOpen={false}` focuses the sheet container; `SheetHeader` keeps a long title clear of the close button. New **`SheetNavLink`** for section jumps (closes the sheet, waits for the scroll lock, scrolls with `scroll-mt-*`, focuses the section; `variant="nav"`, `closeOnNavigate`, `onNavigate`). New lib module `first-focusable`.
- **`TopBar`**: `TopBarMobileMenu` links are `SheetNavLink`s (`#section` jumps, `onNavigate`, new type `TopBarMobileMenuLink`); `TopBarBreadcrumb` truncates every level, the middle levels give way first, below 640px the level above stays as a back link; `data-topbar-action` collapses labelled buttons and `NavigationMenuTrigger` to their icon below sm; `TopBar` is a named size container.
- **`AutosaveStatus`**: the label hides by the width of its top bar (named container), not by the viewport, and always shows outside a top bar; a single polite live region, no double announcement.
- **`Tabs` `line`**: one scrolling row on phones with the active tab centred and kept clear of the edge fades; full width by default (pass `className="w-auto"` for an inline list); zero line tabs keep 2px at the ends. **`SecondaryNav`**: 44px touch target under `(pointer: coarse)`, active item centred in the row, arrow keys scroll the column; **`SecondaryNavLayout`** gets `title` and `actions` slots for the column header. New lib module `row-scroll`.
- **`Table`**: the scroll region draws its focus as a complete inset outline above the sticky header (`z-sticky`, `isolate`); `TableEmpty` is centred in the visible width.
- **`SingleSelect`** and **`MultiSelect`**: every internal button is `type="button"` (no accidental form submit), the combobox has an `id`, Enter works on chevron and remove button, Escape closes the sheet and the Add dialog, the chevron name includes the field label, the chevron focus ring is no longer clipped. Same `type="button"` fix in `Carousel`, `Chip`, `PhoneInput`, `KanbanMoveToMenu`, `Versions`, `ButtonGroup` and others.
- **`Select`**: `size="xs"` and `"sm"` triggers use `text-ui` at every width.
- **Gated controls**: `AvatarUpload`, `Link` and `ButtonGroupItem` with `aria-disabled` keep pointer events; the click goes to the new `onGatedClick` instead of `onClick`.
- **`ToggleGroup` segmented**: content width by default, new `fullWidth` prop for the stretched look.
- **`Accordion`** (zero): the trigger keeps 8px above and below a wrapped question. **`CardHeader`**: `actions` sit in the title row only, the description gets the full width.
- **`CookieConsent`**: compact on phones (less padding, "Show more" toggle). **`Notification`**: inverse description and progress label on `text-text-inverse-subtle`; close-button space only when dismissible; inverse actions wrap.
- **`NavigationMenu`**, **`Breadcrumb`** (`min-w-0` items), **`ScrollArea`**, **`Multiselect`**, **`Input`**, **`labels`** (new strings for the select, top bar and cookie changes), `lib/nested-layer` (`data-persistent-list`), `lib/recipes`, `lib/utils`.
- Tests: the library tests of these files, `form-buttons.test.tsx`, `compiled-classes-028`, `-0281`, `-0290`, `-0291`, `-0300`. Adapted to the one theme this package ships: `notification.test.tsx` (inverse-subtle contrast read from `styles/theme.css`), `theme-expression.test.ts` (roles read from `styles/theme.css`), `confirm-dialog.test.tsx` (destructive fill class). The zero-only versions of `button-sizes`, `small-sizes`, `progress-contrast` and `text-pairs-contrast` keep their zero values (unchanged in zero).
- Not taken: the `UntitledIcon` removal and `BurgerBar` (not in this package), the global base CSS of the library (`html`/`body` overflow, the `h1` to `h3` display voice, which comes with the token preset here), `root-overflow.test.ts`, the all-theme tables of the size and contrast tests, the Storybook theme toolbar entries and fonts of the new themes, visual baselines and review probes.

### Theme and Tailwind preset

- `styles/theme.css` from kette-tokens 5.26.0 (zero): the expression roles with their neutral defaults, `--semantic-border-control-checked`, and zero letter spacings written as `0em`. No colour value of zero changed.
- `tailwind/tailwind.theme.cjs` and `tailwind/tailwind.preset.cjs` copied again: `border-border-control-checked`, `font-display`, `font-button-filled`, `font-tab`, `font-data`, the `image-*`, `bevel-*` and `frame-*` utilities, typography classes add `--tracking-extra`, the display voice base style for `h1` to `h3`. Like windows-95 before, the token preset lists the new generic themes; `styles/theme.css` stays zero only. `tailwind/preset.cjs` is unchanged. `npm run theme:prune` removes nothing. `styles/document-surface.css` regenerated. `scripts/theme-pairs.mjs` unchanged (kette-tokens `color-pairs.js` unchanged).
- `src/lib/theme-vars.test.ts` accepts `--tracking-extra`, which components set and the typography utilities read with a `0em` fallback.

### Storybook

- 130 story files with 1141 stories (new: `modal-scroll-lock.stories.tsx`), same 9 skipped. `scripts/sync-stories.mjs` gives the three render-only FAQ stories of Accordion `args` for the type check.

### Registry

- `public/r` rebuilt (155 files): new items `first-focusable` and `row-scroll` (dependencies of `sheet`, `tabs` and `secondary-nav`), 47 items changed.

### Sellability

- No consumer or customer names added; example data stays on the shared cast. Git history is unchanged.

## 0.4.5

No component or theme changes, same sources as 0.4.4 (kette-design-enterprise 0.27.18, kette-tokens 5.24.0). First release published by the release workflow: npmjs.com with provenance, GitHub Packages and a GitHub release from one tag.

## 0.4.4

Synced from kette-design-enterprise 0.27.18 and kette-tokens 5.24.0 (library changelogs 0.27.16 to 0.27.18, token changelogs 5.23.3 to 5.24.0). Only the changes to components and theme parts that are in this package are listed.

### Components

- **`Button`**: a label stays on one line (`whitespace-nowrap`), so two-word labels no longer wrap and spill out of small buttons on phones. The `link` variant is running text and keeps wrapping. Pass `className="whitespace-normal"` if you really want a wrapping label.
- **`PageHeader`**: on phones the primary action sits directly under the title block and above the tabs slot, so the Tab order equals the reading order (WCAG 2.4.3, 1.3.2). The title block keeps a minimum width of 240px (capped at the row width); when the actions do not fit beside it they wrap below the title instead of squeezing it.
- **`FormMessage`**: a validation error renders as `role="alert"` and is announced once when it appears (WCAG 4.1.3). Helper text without an error gets no role.
- **`Toast`**: after a toast that held focus is dismissed, focus returns to the element that had it before focus entered the toast, and is no longer left on the empty toast list. The comment about the close icon contrast now lists the measured values (4.34:1 in the default light toast of the zero theme, which passes the 3:1 floor for icons).
- **`useToastInset`**: follows the element. A bar that appears late, is swapped, hidden or removed reports or releases its inset; it re-measures on resize, orientation change, visibility change and scrolling. The signature `useToastInset(ref, { enabled? })` is unchanged.
- Tests: `button.test.tsx`, `form.test.tsx`, `page-header.test.tsx`, `toast.test.tsx`, `toast-inset.test.tsx` (without the FooterOneLiner case). `sidebar-nav.test.tsx` uses the shared cast instead of a sample persona.
- Not taken: the Untitled UI aliases and icon components (not in this package), the `layoutInvariants` runner parameter and the test-runner checks (this package has no Storybook test runner; the stories still carry the parameter), FooterOneLiner and the visual baselines.

### Theme and Tailwind preset

- `styles/theme.css` from kette-tokens 5.24.0. Only the link colour changed so that every link holds 4.5:1 on every surface: light default `37 99 235` -> `29 78 216`, hover and active `29 78 216` -> `30 64 175`; dark default `59 130 246` -> `147 197 253`, hover and active `96 165 250` -> `191 219 254`. `--semantic-link-visited` follows the default. The `.dark` block, the OS dark block and the paper scope carry the same steps. No variable was added or removed.
- `tailwind/tailwind.theme.cjs` and `tailwind/tailwind.preset.cjs` copied again (`link-default`, `link-hover`, `link-active`, `link-visited` follow the theme). `tailwind/preset.cjs` is unchanged. `npm run theme:prune` removes nothing. `styles/document-surface.css` regenerated.
- Tests: `scripts/theme-pairs.mjs` lists the 55 pairs of kette-tokens `color-pairs.js` (was 51): page text and page muted text on `--colors-background`, outline button and ghost button. `src/lib/theme-vars.test.ts` expects the 84 pair variables. All pairs hold 4.5:1 or more in the 4 mode contexts of the pair test and the 12 cascade contexts of the standalone test (lowest measured ratio 4.62:1, `utility destructive` in light mode).

### Registry

- `public/r` rebuilt (153 files): `button`, `form`, `page-header`, `toast`, `toast-inset` and `theme` changed.

### Sellability

- No consumer, customer or tool-vendor names in the repository, the package or the registry. The sample persona e-mail in `sidebar-nav.test.tsx` and in `scripts/sync-stories.mjs` is neutral. Git history is unchanged.

## 0.4.3

Synced from kette-design-enterprise 0.27.15 and kette-tokens 5.23.2 (library changelogs 0.27.14 and 0.27.15, token changelog 5.23.2). Only the changes to components and theme parts that are in this package are listed.

### Components

- **`FormLabel`, `FormMessage`**: the error state uses the destructive text colour (`text-text-destructive`) instead of the raw error colour. With the self-contained theme of this release the raw colour (`239 68 68`) would have been 3.76:1 on white; the text role is 6.47:1 in light mode and on the paper surface, 7.29:1 in dark mode. Borders and icons keep the error colour.
- **`Toast`**: the close button uses the full text colour of its variant at rest instead of 70 percent opacity (was about 2.7:1 on the default and 2.9:1 on the destructive toast in light mode, under the 3:1 minimum of WCAG 1.4.11; now 4.6:1 or more in every variant and mode).
- **`useToastInset`, `reportToastInset`**: new public API (with the type `UseToastInsetOptions`). A fixed bar at the bottom of the screen tells the phone toast where it starts, so the toast rides above it instead of covering its buttons. A fixed `CookieConsent` banner uses it; a static banner reports nothing. In the shadcn registry `cookie-consent` now depends on `toast-inset`.
- **`Card`** (both versions) and the disabled **`Label`**: disabled dimming uses the `opacity-disabled` utility (`--opacity-disabled`) instead of `opacity-50` and `opacity-70`.
- **`PageHeader`**: when the actions wrap onto a second row, the primary action stays on the last actions row, aligned to the bottom, and the actions group can shrink (`min-w-0`), so wide tabs next to it no longer push the page sideways between 640 and 712px.
- **`Avatar`**: comment clean-up only (the interactive Avatar already uses the shared ring token).
- Tests: `form.test.tsx`, `toast-inset.test.tsx` (without the FooterOneLiner case), `compiled-classes-02714.test.tsx`, the updated `card`, `Card`, `toast` and `avatar` tests.
- Not taken: FooterOneLiner (not in this package), the library contrast test pins for the neutral theme and the full theme set (this package ships the zero theme only; its adapted tests already assert 4.5:1 and 3:1 floors).


### Theme and Tailwind preset

- `styles/theme.css` is self-contained. 0.4.2 lacked 58 colour roles and the typography role `button` in the light `:root`, because the zero theme does not define them itself and relied on the generic kette-tokens `theme.css`, which this package does not ship. kette-tokens 5.23.2 completes them from its reference theme. Most visible fix: `--colors-background-accent`, `--colors-background-destructive`, `--colors-foreground-accent`, `--colors-foreground-destructive` and `--colors-error` were undefined in light mode, so `border-error` and `ring-error` (Card, Select, Single Select, Multiselect error states) and `bg-background-accent` drew nothing in light mode. They now have their light values, and the paper scope carries them too.
- New in `:root`: 63 names (58 colour roles such as `--colors-avatar-*`, `--colors-checkbox-*`, `--colors-navigation-*`, `--colors-switch-*`, `--colors-textarea-*`, plus `--typo-button-*` and the class `.typography-button`). New in `.dark` and the dark media block: 47 names with dark values. New in the paper scope: 52 names with light values (the 47 plus the four accent and destructive pair variables and `--colors-error`, which inside a paper surface on a dark page is now the light red instead of the dark red). No variable was removed or renamed, no existing value changed. `styles/document-surface.css` gains the 47 names.
- `tailwind/tailwind.theme.cjs` copied again from the token package: `npm run theme:prune` now removes nothing, so the 49 colours removed in 0.4.2 (for example `avatar-background-default`, `switch-background-activated`) are back, each with a declared variable. `tailwind/tailwind.preset.cjs` and `tailwind/preset.cjs` are unchanged.
- Tests: `scripts/theme-pairs.mjs` lists the 51 pairs of kette-tokens `color-pairs.js` (was 27, the status on-colour pairs of 5.23.1 are now part of it). `src/lib/theme-vars.test.ts` loads `styles/theme.css` alone (port of the kette-tokens `check:standalone` gate): every variable the Tailwind config references without a fallback and every pair variable is declared in `:root`, every pair variable in `.dark`, the dark media block and the paper scope, and all of them resolve in the 12 cascade contexts (html class none, light, dark x OS light, dark x page, paper surface). `src/lib/theme-pairs.test.ts` checks all 51 pairs at 4.5:1 in those 12 contexts. Against the 0.4.2 theme the new tests report 25 failures.

### Docs

- README Theming: the `kette theme` command of the free Kette CLI replaces the placeholder (options, drop-in import, install).

### Stories

- Synced from the v0.27.15 tag: 129 story files with 1080 stories (new: Form `Error` and `ErrorOnPaper`, Page Header `WrappedActions640`, `-700`, `-900`, `-1024`, Toast `PhoneAboveCookieBanner`), same 9 skipped.

## 0.4.2

Synced from kette-design-enterprise 0.27.13 and kette-tokens 5.23.1 (library changelogs 0.27.3 to 0.27.13, token changelogs 5.19.0 to 5.23.1). Only the changes to components and theme parts that are in this package are listed. The package description is new.

### Components

- **`Button`**: new `size="inline"` for a link inside running text: it inherits font size, weight and line height, has no fixed height and no border, looks like a link (link colour roles, underline) and keeps a 24px target (WCAG 2.5.8) through a centred hit area that is at most 8px taller than the line. `size="2xl"` and `icon-2xl` now use the `control-2xl` token instead of a fixed 60px: 48px in the zero theme. `hover:font-semibold` applies to the other link sizes only. The element carries `data-variant`.
- **`Alert`**: a link button inside an info, success, warning or destructive alert takes the alert text colour and keeps the underline (the blue link was below 4.5:1 on the warning and destructive tints).
- **`Badge`**: the info tone uses `bg-background-info-subtle` with `text-text-info-on-subtle` in the zero preset. Same look in the zero theme.
- **`ButtonGroup`**, **`Pagination`**, **`MultiSelect`**: new `size="sm"` on the `control-sm` height (28px in zero). New type export `ButtonGroupSize`.
- **`Card`**: `density="compact"` (20px padding, new type `CardDensity`) and `container` (makes the card a size container). `CardHeader` actions sit centred on the title row and taller actions are no longer clipped (`data-slot="card-actions"`).
- **`CookieConsent`**: new `openCookieSettings()` and `useCookieConsent()` (`{ reopen }`) to reopen the banner from a "Cookie settings" link, new `onReopen` and `size` (`default` | `sm`) props. Escape closes the banner like the close button, only when `closable` is set; in the settings view it goes back to the summary first. Focus return after a reopen searches the opener's region only and uses `preventScroll`; without an opener focus goes to `<main>`, else the first `h1`, instead of the body. The region and its title show a thin outline only for keyboard users.
- **`Dialog`**, **`Sheet`**, **`Drawer`**, **`LoadingOverlay`**: while modal they make everything outside their layer inert (with `aria-hidden` as fallback), also when a live region sits in the page; nested layers stack, non-modal layers leave the page alone. The page is freed as soon as the layer starts closing. Toasts and elements with `data-modal-exempt` stay reachable. New `onAfterClose` on `SheetContent` and `DialogContent`. The Radix focus guards are no longer made inert, so Shift+Tab stays in the document. Drawer gets the focus return of Dialog and Sheet.
- **`DropdownMenu`**: a menu item that opens a Dialog, Sheet, Drawer or Confirm Dialog returns focus to the menu trigger when the overlay closes (WCAG 2.4.3). New `density` on `DropdownMenuContent` (`default`, `touch`: 44px rows below `sm`, `auto`: 44px rows on coarse pointers), new type `DropdownMenuDensity`.
- **`Grid`**: the page frame (`max-w-content`) is centred with `mx-auto`, and classes merge through `cn`, so `gap-6` or `max-w-none` replace the defaults.
- **`ListItem`**: `responsive` puts the trailing controls under the title and moves them to the end of the row from the `@area-2xs` container screen (420px).
- **`MetricItem`**: `href` (with `target` and `rel`) renders the tile as one link, `asChild` merges it into your own link element. Link and button tiles share hover and pressed states; in a `KpiStrip` the focus ring sits inside the tile.
- **`PageHeader`**: new `overflow` and `overflowLabel` (below `sm` the `actions` collapse into a More menu with touch rows) and `primaryAction` (always visible; on a phone it follows the title and the tabs slot, from `sm` up it is the last item of the actions group). Empty action wrappers leave the layout.
- **`SecondaryNav`**: `orientation="horizontal"` (one scrollable row with edge fades, arrow keys, Home and End, current item kept in view) and `orientation="responsive"` (a row below the `@area` container screen, 860px, the column from there). New `SecondaryNavLayout` (nav slot plus content, `fill` takes the parent height). New types `SecondaryNavOrientation`, `SecondaryNavLayoutProps`.
- **`Section`**: new `contentClassName` for the inner frame; no invalid inline `max-width` without `maxWidth`.
- **`Toast`**: below `sm` the viewport sits at the bottom, full width and centred, with swipe down to dismiss; it rides above a sticky Sheet footer or a Drawer footer (`--toast-inset-bottom`). The viewport is exempt from modal inertness, so F8 and its action work while a Sheet or Dialog is open. The region name and the text spoken before each toast come from the labels (`toastRegion`, `toastNotification` in English and German).
- **Labels**: `toastRegion` and `toastNotification` in `Labels`, `labels-en` and `labels-de`.
- **Helpers** (`src/lib`): new `modal-inert`, `toast-inset` and `use-collapse-empty`; `return-focus` finds the opener's region (`regionOf`); `sticky-inset` reports sheet footers to the toast; `cn` knows `max-w-content`.
- Tests: the library tests of the changed components, plus `menu-focus-return.test.tsx`, `modal-inert.test.tsx`, `modal-close.test.tsx`, `compiled-classes-0273` to `-0279` and `-0713` (without the FooterOneLiner case). `small-sizes.test.tsx` and `button-sizes.test.tsx` check the zero preset against `styles/theme.css` only, because this package ships the zero theme only. `patch-0121.test.tsx` now expects the zero success and warning `-default` pairs to pass 4.5:1 (it pinned their old 3.6 and 3.4:1, fixed in kette-tokens 5.23.1).
- Not taken: FooterOneLiner and ServicePage (not in this package), the Code Connect files.

### Theme and Tailwind preset

- From kette-tokens 5.19.0 to 5.23.1: container screens `@area-2xs` (420) to `@area-xl` (900) with `--size-breakpoint-container-area-*`, `--opacity-disabled` and `opacity-disabled`, `max-w-content` and the `grid-margin` and `grid-gutter` spacing keys, `text-destructive` as the AA error text. Status, brand and selected text roles reach 4.5:1 on every surface, fill and text pairs are set together in every mode block and in the paper scope, the page background inside the paper is the paper colour, the destructive button text `--colors-button-foreground-destructive` is defined, and the destructive hover follows the theme. Status on-colour pairs hold 4.5:1 (5.23.1): in light the success and warning fills are one ramp step darker (`emerald.700`, `orange.700`, hover and active step along) with the white label, in dark the labels on bold success, warning and info fills are `slate.900`. The zero dark sidebar stays black on the black canvas with the `#1e293b` border, as in the prototype.
- `tailwind/tailwind.theme.cjs` no longer lists 49 colours whose variable the zero theme does not declare (for example `avatar-background-default`, `switch-background-activated`); their classes compiled to an invalid colour and no component used them. `npm run theme:prune` removes them after every theme copy.
- New tests: `src/lib/theme-vars.test.ts` (every variable the Tailwind config references exists in `styles/theme.css`) and `src/lib/theme-pairs.test.ts` (the kette-tokens `check:pairs` and `check:scopes` gates for this theme, plus the status pairs).
- Variable names: no variable was removed or renamed. New in `:root`: `--colors-button-foreground-destructive`, `--opacity-disabled`, `--size-breakpoint-container-area` and `-2xs`, `-xs`, `-sm`, `-md`, `-lg`, `-xl`. New in `.dark`, the dark media block and the paper scope (31 names each, pinned fill/text pair variables such as `--colors-button-background-primary-default`, `--colors-general-brand-*`, `--semantic-background-brand-bold-*`, `--semantic-text-on-brand`, `--semantic-text-on-destructive`, `--semantic-text-on-success`, `--semantic-text-on-warning`, `--semantic-text-on-info`); `document-surface.css` follows.

### Stories

- Synced from the v0.27.13 tag: 128 story files with 1073 stories. The stories with play functions need `@storybook/jest` and `@storybook/testing-library` (dev dependencies, not shipped).

## 0.4.1

Synced from kette-design-enterprise 0.27.2 and kette-tokens 5.18.1 (was component-library-react 0.26.23 and figma-design-tokens 5.16.0; both upstream packages were renamed in between, kette-design-enterprise 0.27.0 and kette-tokens 5.18.0 have no component or theme changes).

### Components

- **`Button` icon-only heights**: every icon size now has the height of the text size with the same name, from the control tokens. In the zero theme of this package: `icon-sm` 28, `icon` 32, `icon-lg` 36 (was 44), `icon-xl` 40 (was 48), `icon-2xl` 60 (was 56). Mixed rows of text and icon buttons line up.
- **New `Button` size `icon-xs`**: dense icon button for list rows, tags, comments and chat. Hit area `control-xs` (24px in zero, meets the 24px target size minimum, WCAG 2.5.8), glyph `icon-xs` (14px), also for the `icon` prop.
- **`Button` link padding**: `variant="link"` sets plain `p-0` instead of `!p-0`, so a `className` such as `px-3` wins without `!`. New prop `padded` (link variant only) keeps the horizontal padding of the size, for a link button in a toolbar or button group. Other variants ignore it.
- **`CookieConsent` focus on reopen**: when the banner opens again while a button or link outside it has focus (for example a "Cookie settings" link in the footer), focus moves to the banner title, or to the region when there is no title. After accept, decline, save or close it returns to the opener, also when the opener was re-rendered. The first automatic appearance still takes no focus. A reopen also resets an earlier `dismissBehavior="defer"` dismissal and the settings view. No new props.
- `src/lib/return-focus.tsx` exports `findReplacement`; in the shadcn registry `cookie-consent` now depends on `return-focus`.
- Tests: `button-sizes.test.tsx` (new; checks the zero preset against `styles/theme.css`, the default, neutral and windows-95 cases of the library are left out because this package ships the zero theme only), `button.test.tsx`, `cookie-consent.test.tsx`.
- Comments in Accordion, Alert, Card, Dropdown Menu and Table name the token package by its new name.

### Theme and Tailwind preset

- New tokens from 5.17.0: `--z-chrome-2` (31) and `--z-chrome-3` (32), `z-chrome-2` and `z-chrome-3` in the preset, for stacked page chrome above `z-chrome`.

### Stories

- New: Button `IconOnlyDense`, `SizeScale`, `LinkPadded`, Cookie Consent `ReopenFromFooterLink`. 128 story files with 1031 stories.

## 0.4.0

Renamed from `@getitdone-gmbh/kette-design` to `@getitdone-gmbh/kette-design-community`, repo `getitdone-gmbh/kette-design-community`. Synced from component-library-react 0.26.23 and figma-design-tokens 5.16.0, the same as 0.3.7.

### Migration

- `npm uninstall @getitdone-gmbh/kette-design && npm install @getitdone-gmbh/kette-design-community`
- Replace `@getitdone-gmbh/kette-design` with `@getitdone-gmbh/kette-design-community` in imports, CSS `@import`s, the Tailwind `presets` entry and the Tailwind `content` path (`./node_modules/@getitdone-gmbh/kette-design-community/dist/**/*.js`).
- No component, theme or preset changes. `@getitdone-gmbh/kette-design` stays at 0.3.7 and is deprecated with a pointer to the new name.
- The shadcn registry at `zero-design.itdone.de/r` keeps its URLs.

## 0.3.7

Synced from component-library-react 0.26.23 and figma-design-tokens 5.16.0 (was 0.26.22 and 5.15.0).

### Components

- **`NavigationMenu` placement**: the open panel is placed on the first open, when its content changes, on window resize and on page scroll. Before, it moved only on resize.
- **`NavigationMenu` layer**: the open panel renders in a portal on `body` on the dropdown layer (`z-dropdown`, 65), so a header on the chrome layer no longer clips it and a cookie banner (`z-banner`, 40) can no longer cover its last rows. The viewport anchor is now `position: fixed` with viewport coordinates for `left` and `top` (before: an offset from the root). A header that wrapped the panel in its own `z-index` or a resize workaround can drop it.
- **`NavigationMenu` height**: the panel is capped to the viewport height below the trigger minus `collisionPadding` (`--navigation-menu-available-height`) and scrolls inside, reachable by keyboard.
- **Page chrome layer**: the fixed `Sidebar` uses `z-chrome` (30, was a raw 30). Put `sticky top-0 z-chrome` on your own app header or `TopBar`.
- **Sticky bars in `Sheet`, `Dialog` and `Drawer`**: a sticky or fixed `SheetHeader`, `SheetFooter`, `DialogHeader`, `DialogFooter`, `DrawerHeader` or `DrawerFooter` reports its height as `--sticky-inset-top` or `--sticky-inset-bottom` on the content. The content panel, `SheetBody` and `DialogBody` use it as scroll padding, so a focused element is never hidden under the bar (WCAG 2.4.11). A bar in normal flow adds no padding. The six parts now forward a `ref`. New helper `src/lib/sticky-inset.ts`, in the shadcn registry as `sticky-inset` (pulled in by `sheet`, `dialog` and `drawer`).
- **Focus return**: an opener that is re-created with a new key while a controlled overlay is open gets focus back on close. It is found again by id, else by tag, accessible name and text.
- Tests: `navigation-menu.test.tsx`, `src/lib/overlay-behaviour.test.tsx`, `src/lib/css-selectors.test.ts`, `src/lib/z-layers.test.ts` (chrome layer), `src/lib/icon-stroke.test.tsx`.

### Theme and Tailwind preset

- New token from 5.16.0: `--z-chrome` (30, `z-chrome`).
- **Fix: malformed selector in `dist/styles.css` and the preset.** The 2.25 rule for 12px glyphs is now three rules with one selector each, and the size classes are matched as `[class~='h-icon-2xs']` and `[class~='size-icon-2xs']`. Before, Tailwind treated the class selector in the base rule as a utility and re-emitted it under `[&>svg]:h-icon-2xs`, which produced the dead selector `...h-icon-2xs>svgsvg.lucide`. The new test `src/lib/css-selectors.test.ts` builds the package CSS and parses every selector. `postcss-selector-parser` is a new dev dependency for that test.

### Stories

- New: Dialog `StickyHeaderAndFooter`, Navigation Menu `LongPanelAboveBanner`, Sheet `StickyHeaderReverseTab`. 128 story files with 1027 stories.

## 0.3.6

Synced from component-library-react 0.26.22 and figma-design-tokens 5.15.0 (was 0.26.18 and 5.13.0).

### Components

- **`LogoTile` initials** use the logo tile font sizes and weight 700 (`font-bold`): `xs` (24px) `text-logo-tile-24` (11px), `sm` (32px) `text-logo-tile-32` (13px), `md` (40px) `text-logo-tile-40` (16px). Was the avatar-xs role (10px, weight 600) for `xs` and the ui-semibold role (weight 600) for `sm` and `md`. `DescriptionList` uses `LogoTile` and follows.
- **`Sidebar` workspace switcher**: the trigger logo (24px) uses `rounded-logo-tile-24 text-logo-tile-24` instead of `rounded-[6px]` and `text-micro` (same pixels, weight 700). The menu item logo (20px) uses `rounded-logo-tile-20 text-logo-tile-20 font-bold leading-none` (radius 5, 10px, weight 700), was `rounded-item text-micro`.
- **`CookieConsent`**: `titleAs` also accepts `p` (new exported type `CookieConsentTitleTag`, `HeadingTag | 'p'`). With `titleAs="p"` the banner title is a plain paragraph, the region keeps its accessible name and the banner adds no heading to the page. Default stays `h2`.
- **Layering**: one z-index order for fixed and overlay components, see `docs/layering.md`. Page chrome (below 40), banners (40), sheet (50), dialog (60), menus and popovers (65), toast (70), tooltip (80). `CookieConsent` and the floating `ChatWindow` use `z-banner` (40, was 50), so every sheet and dialog now covers them (WCAG 2.4.11). `Sheet` and `Drawer` use `z-sheet`, `Toast` uses `z-toast` (70, was a raw 100), `HoverCard` content uses `z-dropdown` (65, was a raw 250) and its backdrop `z-dialog`, `Table` uses `z-sticky` and `z-raised`, the `NavigationMenu` root and indicator `z-sticky` and `z-raised`. Consumers that wrap a banner in their own z-index above 40 should drop that value.
- **`NavigationMenu`**: the open panel stays inside the viewport. It is shifted left when it would pass the right edge and right when it would pass the left edge. New prop `collisionPadding` (px, default 16) on `NavigationMenu` and `NavigationMenuViewport`. The panel width is capped at the viewport width minus that margin.
- `cn()` knows the `text-logo-tile-20/24/32/40/48` font sizes, so a later text colour class no longer merges them away.
- Tests: Logo Tile, Sidebar logo tiles, Cookie Consent `titleAs="p"`, `navigation-menu.test.tsx`, `src/lib/z-layers.test.ts` (no raw z-index of 40 or more in a component, banner below the modal layers).

### Theme and Tailwind preset

- New tokens from 5.14.0 and 5.15.0: `--fontSize-logo-tile-20` to `-48` (`text-logo-tile-*`), `--borderRadius-logo-tile-20` (`rounded-logo-tile-20`), `--z-banner` (40, `z-banner`).
- Icon stroke: the 2.25 rule for 12px glyphs in this package's preset now has the same `:not([data-stroke="fixed"])` opt-out as the 1.75 rule. Icons marked `data-stroke="fixed"` keep their own stroke inside 12px wrappers.

### Stories

- New: Cookie Consent `TitleAsParagraph` and `BelowOpenSheet`, Navigation Menu `RightAlignedNearEdge`. 128 story files with 1024 stories.

## 0.3.5

Synced from component-library-react 0.26.18 and figma-design-tokens 5.13.0 (was 0.26.16 and 5.12.0).

### Components

- **Behaviour change: `AlertTitle` renders a `<p>`, not an `<h5>`**. An alert title is rarely a real section heading, and the old default caused heading-order skips. The typography stays (`font-semibold leading-none`). `titleAs` still renders any `h1` to `h6`: where the title belongs to the document outline, pass `titleAs="h3"` (or the level that fits the page). Tests or selectors that looked up `role="heading"` for an alert title need `titleAs` or should query the text. `AlertTitleProps` now extends `React.HTMLAttributes<HTMLElement>`, the ref type is `HTMLElement`.
- **`LogoTile` radius is fixed per size** (size x 0.25, as in the prototype): `xs` (24px) `rounded-logo-tile-24` (6px), `sm` (32px) `rounded-logo-tile-32` (8px), `md` (40px) `rounded-logo-tile-40` (10px). Was `rounded-item` for all sizes. The radius no longer follows the theme radius roles; it is 0 in the windows-95 theme. `DescriptionList` uses `LogoTile` and follows.

### Theme and Tailwind preset

- New tokens from 5.13.0: `--borderRadius-logo-tile-24`, `--borderRadius-logo-tile-32`, `--borderRadius-logo-tile-48` next to `--borderRadius-logo-tile-40` (`rounded-logo-tile-24/-32/-40/-48`).
- Icon stroke opt-out: the 1.75 base rule from the token preset is now `:where(svg.lucide[stroke-width="2"]:not([data-stroke="fixed"]))`. An icon that deliberately sets `strokeWidth={2}` keeps stroke 2 with `data-stroke="fixed"`. Specificity stays zero.

## 0.3.4

Synced from component-library-react 0.26.16 and figma-design-tokens 5.12.0 (was 0.26.14 and 5.10.0).

### Components

- **Icon stroke**: lucide icons that keep their default `stroke-width="2"` render with the prototype stroke `var(--size-icon-stroke, 1.75)`, 12px glyphs (`h-icon-2xs`, `size-icon-2xs` or the direct `svg` child of such a wrapper, for example `StepMarker` sm) with `var(--size-icon-stroke-sm, 2.25)`. An explicit `strokeWidth` prop such as `1.5` is kept. Both rules are wrapped in `:where()`, so a utility class still wins. This is a slight visible change: icons are thinner than before (was 2).
- **Check marks**: `Checkbox`, the `CheckboxGroup` card tick, the completed `Stepper` step and `StepMarker` draw the check with `var(--size-icon-stroke-check, 3)`. `Checkbox` now uses the lucide `Check` instead of the Radix check glyph, same 12px (`sm`) and 16px sizes.
- **Navigation icons are 15px** (`icon-nav`): `SecondaryNav` item icons (wrapper and the svg inside it) and the icons in vertical `Tabs` triggers. Was 16px for `SecondaryNav`.

### Theme and Tailwind preset

- New tokens from 5.11.0 to 5.12.0: `--size-icon-nav` (15px, `h-icon-nav`, `w-icon-nav`, `size-icon-nav`), `--size-icon-stroke`, `--size-icon-stroke-sm`, `--size-icon-stroke-check` and the Figma pixel strokes `--size-icon-stroke-px-*`, `--borderRadius-logo-tile-40` (`rounded-logo-tile-40`).
- The preset (`@getitdone-gmbh/kette-design/tailwind/preset`) carries the stroke rules as base styles plus `safelist: ['lucide']`, so apps that build their own Tailwind with the preset get them without importing `styles.css`. The 1.75 rule comes from the token preset, the 2.25 rule for 12px glyphs is added by this package's preset; `dist/styles.css` and Storybook are built from the same preset, so each rule exists exactly once.

## 0.3.3

Synced from component-library-react 0.26.14 and figma-design-tokens 5.10.0 (was 0.26.13 and 5.9.0).

### Components

- **NotificationMatrix**: new `selected` prop on `NotificationMatrixRow` and `NotificationMatrixCell`. A selected row uses the brand row tint `bg-background-selected-row` (also on hover, active and pinned cells), its description switches to `text-text-subtle-on-selected` for AA contrast. The row keeps `data-state="selected"` and `aria-selected`. New story Selected Row.

### Theme

- New roles from tokens 5.10.0: `background-selected-row` and `text-subtle-on-selected` (zero theme, light and dark, also in `document-surface.css`). The Tailwind preset gains `blue.950`.

### Docs

- The README no longer names the synced library and token versions; it links to the sync history in `docs/MAINTAINING.md`.

## 0.3.2

Synced from component-library-react 0.26.13 and figma-design-tokens 5.9.0 (was 0.26.12 and 5.8.0).

### Components

- **Text roles instead of alpha on text**: the new roles `text-text-inverse-subtle` and `text-text-on-inverse-static-subtle` replace the `text-*/NN` alpha colours in `TopBarBrand` (inverse byline), `MetricPanel` (`inverse` muted text; `inverse-fixed` muted text is now `text-text-subtle`), `HeroSection` (inverse supporting text), `CodeSnippet` (inverse gutter and label) and the inverse code highlight palette (comments, punctuation, numbers, properties, variables).
- **Tooltip** and **HelpIcon**: supporting text on the dark tooltip uses `text-text-inverse-subtle`, which restores the hierarchy at AA contrast.
- **Toast**: the destructive close icon uses the full `text-general-error-on` colour.

### Theme

- New roles from tokens 5.9.0: `text-inverse-subtle` and `text-on-inverse-static-subtle` (zero theme, light and dark, also in `document-surface.css`).

## 0.3.1

Synced from component-library-react 0.26.12 and figma-design-tokens 5.8.0 (was 0.26.7 and 5.5.0).

### Components

- **Heading level props** (`titleAs`, default stays the current level): `AlertTitle` (h5), `CardTitle` (h3), `KanbanColumn` (h3), `Attributes` (h3), `SheetSection` (h3), `NotificationList` (h2), `ChatWindow` (h2), `CookieConsent` (h2), `FacetFilter` (h2), `FacetGroup` (h3). New shared type `HeadingTag`.
- **SingleSelect** and **MultiSelect**: single values can be invalid. New option field `invalid`, new props `invalidValues` and `isValueInvalid`. A selected id that is not in `options` is invalid and shown with its id as label. Invalid chips and values use the destructive style, screen readers get the `invalidSuffix` label text, the trigger gets `aria-invalid`.
- **FileIcon**: the document variant has the extension tag across the lower left edge, the tag uses the new `typography-file-tag` role and a solid type colour with the matching `on-default` text in light and dark.
- **FileUploadItem** and **MessageAttachment** show a FileIcon instead of their own round tile. `FileUploadItem` derives the file type from the file name when `kind` is not set and shows the error look for `status="error"`.
- **Accordion**: new `inset` prop on `Accordion` and `AccordionItem`. Inside a `Card` the inset is dropped by default so labels align with the card heading; `inset` overrides either way.
- **KanbanCard**: a grabbed card stays at full opacity and is marked by a dashed focus border (the reduced opacity broke text contrast).
- **KanbanMoveToMenu**: the menu is non-modal, so the board around it is not hidden from assistive technology.
- **BottomNavigationItem** with `count`: the accessible name starts with the visible label, the count is no longer hidden from screen readers.
- **Stepper**, **Tooltip**, **HelpIcon**: supporting text no longer uses reduced opacity, contrast no longer depends on the surface.
- **KpiStrip** `surface="raised"` uses the `bg-surface-strip-raised` role. Rendering is unchanged.
- **TopBarMobileMenu**, **Sheet** and **Dialog** close buttons are a fixed 40x40 in every theme and preset. Items of a non-collapsible menu group get the same indent as an expanded group.

### Theme

- File type colours (`colors.data.file.<type>.default`) are solid and mode-stable, new `on-default` roles for every type. Image is green instead of violet, PDF follows the document colour.
- New roles: `surface-strip-raised`, `typography-file-tag`, `size-textarea-compact`.

### Storybook

- 128 story files with 1020 stories (was 1015): new stories for Accordion in a Card, FileIcon, Multiselect and Single Select invalid values.

## 0.3.0

Synced from component-library-react 0.26.7 and figma-design-tokens 5.5.0. Storybook with the library stories, package renamed from `@getitdone-gmbh/ui` to `@getitdone-gmbh/kette-design`. Theme roles data rose, surface inverse static, text on inverse static, monospace stack. New props in Cookie Consent (`initialConsent`, `value`, `onValueChange`), Top Bar mobile menu (collapsible groups, footer) and the Message inverse static tone.

## 0.2.0

87 general components added (synced from component-library-react 0.26.4 and figma-design-tokens 5.2.0).
