# Changelog

This package is a copy of the general components of the Get IT Done design system. Each release names the library and token versions it was synced from. Only changes to components that are part of this package are listed.

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
