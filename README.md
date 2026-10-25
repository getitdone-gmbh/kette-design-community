# @getitdone-gmbh/kette-design-community

[![npm](https://img.shields.io/npm/v/@getitdone-gmbh/kette-design-community?label=npm&color=cb3837)](https://www.npmjs.com/package/@getitdone-gmbh/kette-design-community) [![license](https://img.shields.io/npm/l/@getitdone-gmbh/kette-design-community)](LICENSE)

Version 0.4.4 on npm. Free React components from the Get IT Done design system: the primitives plus the general components we build business software with. They are built on shadcn/ui and Radix UI, styled with Tailwind CSS, written in TypeScript, and they include a light and a dark theme.

We build business software with many screens, tables, forms and states. These components are the base layer of that system. We are sharing them in case they are useful to others working on similar products.

This package is the component layer of the Community edition of [Die Kette](https://kette.itdone.de), our design system chain from prototype and tokens to components, domain components, page templates and apps. It is free under the MIT licence. Need the full chain? See the [Enterprise edition](https://kette.itdone.de/en/enterprise).

## Editions

| | Community | Enterprise (Die Kette) |
| --- | --- | --- |
| React components | `@getitdone-gmbh/kette-design-community`: 127 components, the zero theme and a Tailwind preset | `@getitdone-gmbh/kette-design-enterprise`: the full library this package is copied from |
| Design tokens | Theme CSS variables and Tailwind preset inside this package | `@getitdone-gmbh/kette-tokens`: the token source with all themes and the Figma variables |
| Domain components and page templates | | Included |
| Figma files, agents and rule set | | Included |
| Licence | MIT, free | Commercial, with a Die Kette licence |
| Get it | [npm](https://www.npmjs.com/package/@getitdone-gmbh/kette-design-community), [shadcn registry](#with-the-shadcn-cli) | Private package via `kette login`, see [Enterprise edition](https://kette.itdone.de/en/enterprise) |

`@getitdone-gmbh/kette-design-enterprise` and `@getitdone-gmbh/kette-tokens` are private packages for licence holders. Upgrade to the [Enterprise edition](https://kette.itdone.de/en/enterprise), then install via the Kette CLI:

1. `curl -fsSL https://kette.itdone.de/install | sh` (Windows: `irm https://kette.itdone.de/install.ps1 | iex`)
2. `kette login <licence key>` unlocks the Enterprise edition and sets up npm access for the `@getitdone-gmbh` scope (registry `https://npm.kette.itdone.de/`).
3. `npm install @getitdone-gmbh/kette-design-enterprise` (tokens: `@getitdone-gmbh/kette-tokens`)

The CLI itself is free. Without a licence key it sets up the Community rule set and the review agent of Die Kette in your project, see [kette-cli](https://github.com/getitdone-gmbh/kette-cli).

## What is included

127 components: 40 primitives and 87 general components, plus the `useToast` hook, the toast inset helpers `useToastInset` and `reportToastInset`, German and English labels and their helpers.

**Primitives (40):** Accordion, Alert, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Checkbox, Collapsible, Command, Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input, Kbd, Label, Navigation Menu, Pagination, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toast, Toaster, Toggle, Toggle Group, Tooltip.

**General components (87):** Action Bar, Activity Feed (Timeline, Notification List), Autosave Status, Blockquote, Bottom Navigation, Button Close, Button Group, Calendar Grid (Week Grid, Month Grid), Card Default, Cell Grid, Charts (line and bar, pie, radar, histogram, treemap, sparkline, bar list, gauge), Chat Window, Checkbox Group, Chip, Code Snippet, Color Picker, Confirm Dialog, Content Divider, Cookie Consent, Countdown, Data Grid, Data State Panel, Date Picker, Description List (Attributes, Summary List), Design System Provider, Document Surface, Empty State, Facet Filter, Featured Icon, Feed Item, File Icon, File Upload, Filter Chip Bar, Form Section, Grid, Heatmap, Help Icon, Hero Section, Illustration, Inline CTA, Inline Edit, Input Digit, Kanban (with Move To Menu), Layout (Stack, Cluster, Tile Grid, Split View), Link, Link Card, List, List Item, Loading Overlay, Loading Spinner, Logo Tile, Message, Metric (KPI Strip), Metric Panel, Multiselect, Notification, Notification Matrix, Object Icon, Page Header, Pagination Dot Group, Phone Input, Progress Circle, Radio Cards, Rating Input, Rich Text Editor, Rich Text Toolbar, Secondary Nav, Secret Field, Section, Section Footer, Section Header, Section Label, Sidebar, Sidebar Nav, Signature Box, Signature Pad, Single Select, Spacing (Spacing, Spacer), Status Dot, Step Marker, Stepper, Table Cells, Table of Contents, Tag Input, Top Bar, Verified Tick, Versions.

Plus the zero theme as CSS variables (typography, colours, radii, elevation, light and dark) and a Tailwind CSS 3 preset.

Every component with a story in the library comes with it: 129 story files with 1088 stories, see [Storybook](#storybook).

The library and token versions each release is synced from are listed in one place, the [sync history](docs/MAINTAINING.md#sync-history). What changed per release is in [CHANGELOG.md](CHANGELOG.md).

## Install

### As an npm package

```bash
npm install @getitdone-gmbh/kette-design-community
```

```js
// tailwind.config.cjs
module.exports = {
  presets: [require('@getitdone-gmbh/kette-design-community/tailwind/preset')],
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './node_modules/@getitdone-gmbh/kette-design-community/dist/**/*.js'],
};
```

```css
/* app.css */
@import '@getitdone-gmbh/kette-design-community/theme.css';
@import '@getitdone-gmbh/kette-design-community/animation.css';
/* Only needed for DocumentSurface: keeps the paper light inside a dark app. */
@import '@getitdone-gmbh/kette-design-community/document-surface.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@getitdone-gmbh/kette-design-community';

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Atlas</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Open</Button>
      </CardContent>
    </Card>
  );
}
```

No Tailwind in your app? Import the prebuilt stylesheet instead: `import '@getitdone-gmbh/kette-design-community/styles.css'`.

Dark mode follows the `dark` class on `<html>`, or the system setting when no class is set.

`PhoneInput` shows country flags from `/flags/<code>.svg`. Copy `node_modules/@getitdone-gmbh/kette-design-community/flags` into your public folder, or point `flagBasePath` to where you serve them. Missing flags are hidden.

`MultiSelect` and `SingleSelect` open only inside a `MultiSelectProvider` or `SingleSelectProvider` (one per page is enough, it keeps a single list open at a time).

Texts are English by default. Wrap your app in `<DesignSystemProvider locale="de">` for German, or pass your own labels.

### With the shadcn CLI

Every component is also available from our registry at `https://zero-design.itdone.de/r` (index: [registry.json](https://zero-design.itdone.de/r/registry.json)), so you can copy the source into your project and change it:

```bash
npx shadcn@latest add https://zero-design.itdone.de/r/theme.json https://zero-design.itdone.de/r/button.json
```

Each item is `https://zero-design.itdone.de/r/<name>.json`, named after the component file (for example `data-grid`, `date-picker`, `sidebar`). The `theme` item adds `styles/getitdone/theme.css`, `styles/getitdone/animation.css`, `styles/getitdone/document-surface.css` and the Tailwind preset in `tailwind/getitdone/` (inside `src/` when your project has one). Import both CSS files in your global CSS and add the preset to `presets` in your Tailwind config, as shown above. Components pull in their helpers automatically.

## Theming

The public theming interface is the semantic variable layer in `theme.css`. Components read these roles, never raw palette values, so you restyle every component by setting the variables in your own CSS after the import, on `:root` for light, on `.dark` (and the `@media (prefers-color-scheme: dark)` block, if you rely on the system setting) for dark. Colour values are space-separated RGB channels (`--semantic-background-default: 255 255 255;`), so Tailwind opacity modifiers keep working.

| Group | Variables | Used for |
| --- | --- | --- |
| Surfaces | `--semantic-surface-*` (`canvas`, `raised`, `sunken`, `overlay`, `paper`, `inverse-static`, `strip-raised`) | Page, cards, wells, overlays and the document paper |
| Backgrounds | `--semantic-background-*` (`default`, `subtle`, `muted`, `input`, `disabled`, `inverse`, `selected-*`, `neutral-*`, and `brand`, `info`, `success`, `warning`, `destructive` with `subtle` and `bold` steps and their hover and active states) | Fills of controls, rows, badges and status areas |
| Text | `--semantic-text-*` (`default`, `subtle`, `subtlest`, `muted`, `disabled`, `placeholder`, `inverse`, `brand`, `selected`, status texts, `on-*` texts for bold fills, `*-on-subtle` texts for tinted fills) | Every text colour, each paired with the fill it sits on |
| Icons | `--semantic-icon-*` | Icon colours, including status and `on-brand` |
| Borders | `--semantic-border-*` (`default`, `subtle`, `muted`, `bold`, `control`, `control-hover`, `input`, `focus`, `selected`, `disabled`, `brand`, status borders) | Hairlines, control borders and selection |
| Focus rings | `--semantic-ring-*` (`default`, `destructive`) | The shared keyboard focus ring |
| Links | `--semantic-link-*` | Link text and its hover, active and visited states |
| Charts | `--semantic-chart-*` (`1` to `8`, `brand-*`, status series, each with `-on`) | Chart series and the text on them |
| Overlays and interaction | `--semantic-overlay-*`, `--semantic-interaction-*` | Scrims and hover or pressed washes |
| Status scales | `--semantic-primary-*`, `--semantic-success-*`, `--semantic-warning-*`, `--semantic-error-*`, `--semantic-info-*`, `--semantic-gray-*` | Ramp steps behind the status roles |

Alongside the colour roles, the theme sets typography (`--typo-*`, `--font-*`), sizes (`--size-*`, for example `--size-control-sm`), spacing (`--space-*`, `--grid-*`), radii (`--borderRadius-*`), elevation (`--elevation-*`, `--shadow-*`), motion (`--motion-*`), opacity (`--opacity-*`) and layers (`--z-*`). The `--colors-*` variables are the component layer underneath (`--colors-button-*`, `--colors-general-*` and so on). They follow the semantic roles; override them only to change a single component.

Keep every fill and the text on it together: when you change a `--semantic-background-*-bold-*` fill, change its `--semantic-text-on-*` text in the same block, and keep 4.5:1 between them in light and dark. The tests in `src/lib/theme-pairs.test.ts` show the pairs this package checks.

`theme.css` is self-contained: it declares every variable the Tailwind preset references and every fill/text pair, in `:root`, in both dark blocks and in the paper scope, so it works without any other theme file underneath.

### Generate your own theme

The free Kette CLI writes these variables for you from your brand colour. Install it with `curl -fsSL https://kette.itdone.de/install | sh` (Windows: `irm https://kette.itdone.de/install.ps1 | iex`), details on [kette.itdone.de/en/setup](https://kette.itdone.de/en/setup). Then run:

```bash
kette theme --primary <hex> [--accent <hex>] [--neutral cool|warm|neutral|<hex>] [--radius none|sm|md|lg|full|<px>] [--font <family>] [--out theme.css] [--preview]
```

It creates a drop-in replacement for `@getitdone-gmbh/kette-design-community/theme.css`, light and dark, with every fill/text pair at WCAG AA (4.5:1). Without options it asks for the values in the terminal. `--preview` also writes `theme-preview.html` with the components in both modes and the contrast table. Then swap the import:

```css
/* before */
@import '@getitdone-gmbh/kette-design-community/theme.css';
/* after */
@import './theme.css';
```

With the prebuilt `styles.css` instead of Tailwind, import your `theme.css` after it. All options are in the [kette-cli README](https://github.com/getitdone-gmbh/kette-cli#theming).

## The rest of the system

This package is one layer. The full design system goes further, from single components to complete application screens and the rules behind them. These parts are not open source, but you can browse all of them:

| Layer | What it is | Browse |
| --- | --- | --- |
| Design system and drafts | UI and UX rules for complex software with dos and don'ts, plus exploratory drafts of real product screens | [zero-design.itdone.de](https://zero-design.itdone.de) |
| Primitives | The full primitive library this package is taken from, with every variant and state as a story | [components.itdone.de](https://components.itdone.de) |
| Complex application components | Domain components built on the primitives: task boards, time grids, goal and capacity cards, pipelines, file views | [zero.itdone.de](https://zero.itdone.de) |
| Page templates | Complete pages: app frame, dashboard, data grid, guided processes, settings, calendar, mobile, with a build guide per page | [zero-pages.itdone.de](https://zero-pages.itdone.de) |

The complete chain (tokens, primitives, domain components, page templates, Figma files and the rule set) is the [Enterprise edition](https://kette.itdone.de/en/enterprise) of [Die Kette](https://kette.itdone.de), see [Editions](#editions).

## Storybook

The stories sit next to the components (`src/components/ui/**/*.stories.tsx`). They are not part of the npm package or the shadcn registry, and there is no hosted Storybook for this package. Start Storybook locally, with light and dark mode and German or English labels in the toolbar:

```bash
npm install
npm run storybook
```

`npm run build-storybook` writes a static build to `storybook-static/`. The hosted Storybook of the full Enterprise library, which these stories are synced from, is at [components.itdone.de](https://components.itdone.de).

## Development

Maintainers: how this package is synced from the Enterprise library, released and published is in [docs/MAINTAINING.md](docs/MAINTAINING.md).

```bash
npm install
npm run typecheck
npm test
npm run build
npm run build-storybook
```

## Licence

MIT, see [LICENSE](LICENSE). Parts are derived from shadcn/ui, and the country flags come from flag-icons (MIT), see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Made by [Get IT Done GmbH](https://itdone.de). Questions and feedback are welcome as GitHub issues.
