'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowLeft, Globe, HelpCircle, Menu, Moon, Sun } from 'lucide-react';
import * as React from 'react';

import { focusRing, focusRingInverse, transitionBase } from '@/lib/recipes';
import { useEscapeKey } from '@/lib/use-escape-key';
import { cn } from '@/lib/utils';
import { BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, Breadcrumbs } from '@/components/ui/breadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useLabels, usePreset } from '@/components/ui/labels-context';
import { SidebarSwatch } from '@/components/ui/sidebar';
import { StatusDot, type StatusDotTone } from '@/components/ui/status-dot';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetNavLink, type SheetNavLinkProps, SheetTitle } from '@/components/ui/sheet';

// App top bar family (Figma "Header navigation": Inset App / Settings / Guest, Simple, Dual-tier, Mobile).
// Composable: TopBar is the landmark, the parts below fill its start and end slots.

const topBarVariants = cva(
  // Theme expression (kette-tokens 5.26.0): top bar image and bevel, accent stripe as the bottom border image; none by default
  '@container/topbar flex w-full shrink-0 items-center gap-2 border-0 border-b border-solid border-hairline bg-background-default text-text-default bg-[image:var(--image-top-bar)] shadow-[shadow:var(--bevel-top-bar)] [border-image-source:var(--image-accent-stripe)] [border-image-slice:1]',
  {
    variants: {
      variant: {
        inset: 'h-topbar px-4',
        guest: 'h-14 px-4',
        simple: 'h-topbar-lg px-8',
        mobile: 'h-16 px-4',
      },
    },
    defaultVariants: { variant: 'inset' },
  },
);

export interface TopBarProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof topBarVariants> {}

const TopBar = React.forwardRef<HTMLElement, TopBarProps>(({ className, variant, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <header
      data-slot="top-bar"
      ref={ref}
      data-variant={variant ?? 'inset'}
      className={cn(topBarVariants({ variant }), zero && 'border-border-default', className)}
      {...props}
    />
  );
});
TopBar.displayName = 'TopBar';

const TopBarStart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex min-w-0 items-center gap-2', className)} {...props} />,
);
TopBarStart.displayName = 'TopBarStart';

const TopBarEnd = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      // Children marked `data-topbar-secondary` drop out below the sm breakpoint (display none, so they leave the tab order too), so a long action row does not push the bar past a phone width. An element marked `data-topbar-action` (a Button with an icon, or a NavigationMenuTrigger with an `icon`, at any depth) keeps only its icon below sm: the label stays its accessible name but is no longer drawn, and its text is the tooltip, so the primary action fits 320px next to the breadcrumb. The chevron of a trigger does not count as the icon. A status chip (`role=status`, such as `AutosaveStatus`) has a width ceiling and truncates its text with an ellipsis (full text as tooltip), so it cannot push the title. Under 448px of top bar the ceiling only fits the icon, so the label of an `AutosaveStatus` (`data-status-label`) is hidden visually instead of cut to a fragment such as "U...": it stays in the live region as the accessible name and the chip is its icon, a button that opens the status text. This follows the width of the top bar (a size container, under 448px), not the viewport.
      className={cn(
        'ml-auto flex shrink-0 items-center gap-2 [&>[role=status]]:max-w-xs [@container_topbar_(max-width:447px)]:[&>[role=status]]:max-w-[var(--size-control-lg)] max-sm:[&>[data-topbar-secondary]]:hidden',
        'max-sm:[&_[data-topbar-action]:has(svg:not([data-chevron]))]:w-control-md max-sm:[&_[data-topbar-action]:has(svg:not([data-chevron]))]:gap-0 max-sm:[&_[data-topbar-action]:has(svg:not([data-chevron]))]:px-0 max-sm:[&_[data-topbar-action]:has(svg:not([data-chevron]))]:text-[0px]',
        className,
      )}
      {...props}
    >
      {/* An action marked `data-topbar-action` loses its label below sm: its text becomes the tooltip, so the icon is still named on hover. */}
      {React.Children.map(children, (child) =>
        React.isValidElement<{ 'data-topbar-action'?: unknown; title?: string; children?: React.ReactNode }>(child) &&
        child.props['data-topbar-action'] !== undefined &&
        child.props.title === undefined &&
        typeof child.props.children === 'string'
          ? React.cloneElement(child, { title: child.props.children })
          : child,
      )}
    </div>
  ),
);
TopBarEnd.displayName = 'TopBarEnd';

// Second row of the Dual-tier header (sub navigation, search).
const TopBarSubRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-16 w-full items-center gap-2 border-0 border-b border-solid border-hairline bg-background-default px-8',
        className,
      )}
      {...props}
    />
  ),
);
TopBarSubRow.displayName = 'TopBarSubRow';

/* -------------------------------------------------------------------------------------------------
 * Breadcrumb (up to three levels)
 * -----------------------------------------------------------------------------------------------*/

export interface TopBarBreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface TopBarBreadcrumbProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  items: TopBarBreadcrumbItem[];
  /** Leading object icon tile, e.g. `<ObjectIcon app="vacancy" />`. */
  icon?: React.ReactNode;
  /** Muted trailing context, e.g. the selected projects. */
  context?: React.ReactNode;
  /** Project colours shown as small squares before the context text (user data, passed as CSS colours). */
  contextSwatches?: string[];
  /** Levels shown at most. Longer trails keep the first and the last items and collapse the middle. Default 3. */
  maxLevels?: number;
}

const ELLIPSIS = Symbol('ellipsis');

const backArrow = <ArrowLeft aria-hidden="true" className="mr-1 inline-block h-icon-md w-icon-md align-middle sm:hidden" />;
const backLinkClass = 'block min-w-0 max-w-full truncate leading-[var(--size-control-sm)]';

// Thin header wrapper over Breadcrumbs (type path): adds the icon tile slot, the context slot and the level cap.
const TopBarBreadcrumb = React.forwardRef<HTMLElement, TopBarBreadcrumbProps>(
  ({ className, items, icon, context, contextSwatches, maxLevels = 3, ...props }, ref) => {
    const limit = Math.max(2, maxLevels);
    // The ellipsis counts as a level. With only two levels there is no room for it, so the trail becomes first and last.
    const collapsed: Array<TopBarBreadcrumbItem | typeof ELLIPSIS> =
      limit === 2 ? [items[0], items[items.length - 1]] : [items[0], ELLIPSIS, ...items.slice(items.length - (limit - 2))];
    const visible: Array<TopBarBreadcrumbItem | typeof ELLIPSIS> = items.length > limit ? collapsed : items;
    // The level above the current page, for the back link below sm. A level without a target is not offered.
    const parent = items.length > 1 && (items[items.length - 2].href || items[items.length - 2].onClick) ? items[items.length - 2] : null;
    // The trail stays on one line. Every level truncates with an ellipsis (the full text is the tooltip), the parents give way first and the current page keeps its room. Below sm only the back link (the level above) and the current page are drawn: the other parents are display none, so they are neither visible nor focusable. The context text drops out below sm.
    return (
      <div className={cn('flex min-w-0 items-center gap-2', className)}>
        {icon}
        <Breadcrumbs ref={ref} type="path" className="-m-1 min-w-0 overflow-hidden p-1 [&>ol]:flex-nowrap [&_li]:whitespace-nowrap" {...props}>
          {parent && !visible.includes(parent) && (
            // The level above is not drawn on its own (a collapsed trail): below sm it is still offered as the way back.
            <li data-back-link="" className="group/crumb inline-flex min-w-[calc(var(--size-control-lg)*2)] shrink-[100000] items-center sm:hidden">
              <BreadcrumbLink href={parent.href} onClick={parent.onClick} title={typeof parent.label === 'string' ? parent.label : undefined} className={backLinkClass}>
                {backArrow}
                {parent.label}
              </BreadcrumbLink>
            </li>
          )}
          {visible.map((item, index) => {
            const last = index === visible.length - 1;
            // Below sm the level above the current page stays as the back link (arrow plus label); the other parents are hidden.
            const back = item === parent;
            return (
              <BreadcrumbItem
                key={item === ELLIPSIS ? 'ellipsis' : index}
                // The middle levels give way first (weight 100000), then the root (10), then the current page (1): a weight below 1 would absorb almost nothing, so the title could never end in an ellipsis. Every level keeps a floor of a few characters.
                className={cn('min-w-0', last ? 'shrink min-w-[var(--size-control-lg)]' : index === 0 ? 'shrink-[10]' : 'shrink-[100000]', !last && !back && 'max-sm:hidden', !last && item !== ELLIPSIS && 'min-w-[calc(var(--size-control-lg)*2)]', back && 'max-sm:[&>span:last-child]:hidden')}
              >
                {item === ELLIPSIS ? (
                  <BreadcrumbEllipsis label="Hidden levels" />
                ) : (
                  <BreadcrumbLink
                    href={last ? undefined : item.href}
                    onClick={item.onClick}
                    current={last}
                    title={typeof item.label === 'string' ? item.label : undefined}
                    className={cn('block min-w-0 max-w-full truncate leading-[var(--size-control-sm)]', last && 'typography-ui-medium text-text-default')}
                  >
                    {back && backArrow}
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </Breadcrumbs>
        {context && (
          <span className="typography-ui-sm flex min-w-0 shrink-[3] items-center gap-1 text-text-subtle max-md:hidden">
            {contextSwatches?.map((color) => <SidebarSwatch key={color} color={color} size="sm" className="mx-0 shrink-0" />)}
            <span className="min-w-0 truncate">{context}</span>
          </span>
        )}
      </div>
    );
  },
);
TopBarBreadcrumb.displayName = 'TopBarBreadcrumb';

/* -------------------------------------------------------------------------------------------------
 * Timer pill
 * -----------------------------------------------------------------------------------------------*/

export interface TimerPillProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Elapsed time, already formatted (e.g. `01:24:37`). */
  time: string;
  /** Shows the pulsing recording dot. Respects reduced motion (the dot stays static). Default true. */
  running?: boolean;
  /** Accessible name prefix. Default `Timer`. */
  label?: string;
  /** Optional details panel (e.g. project, note, stop button). When set, the pill opens it as a popover. */
  details?: React.ReactNode;
  /** Accessible name of the details panel. Defaults to the pill name. */
  detailsLabel?: string;
}

const TimerPill = React.forwardRef<HTMLButtonElement, TimerPillProps>(
  ({ className, time, running = true, label: labelProp, details, detailsLabel, ...props }, ref) => {
    const l = useLabels();
    const label = labelProp ?? l.timer;
    const name = l.timerState(label, running, time);
    const zero = usePreset() === 'zero';
    const pill = (
    <button
      ref={ref}
      type="button"
      aria-label={name}
      data-running={running || undefined}
      className={cn(
        'typography-ui-sm-semibold inline-flex h-control-md items-center gap-2 rounded-control border border-solid border-border-brand-subtle bg-background-brand-subtle tabular-nums text-text-default',
        zero ? 'px-[var(--size-control-padding-x-sm)]' : 'px-2',
        transitionBase,
        'hover:bg-background-brand-subtle-hover',
        focusRing,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'h-2 w-2 shrink-0 rounded-full bg-background-destructive-bold-default',
          running && 'motion-safe:animate-pulse',
          !running && 'bg-icon-disabled',
        )}
      />
      <span aria-hidden>{time}</span>
    </button>
    );
    if (details == null) return pill;
    return (
      <Popover>
        <PopoverTrigger asChild>{pill}</PopoverTrigger>
        <PopoverContent align="end" aria-label={detailsLabel ?? name}>
          {details}
        </PopoverContent>
      </Popover>
    );
  },
);
TimerPill.displayName = 'TimerPill';

/* -------------------------------------------------------------------------------------------------
 * Icon button + escape hint + menu button
 * -----------------------------------------------------------------------------------------------*/

export interface TopBarIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name. */
  label: string;
  /** Unread or pending count shown as a small badge. */
  count?: number;
  // Toggle state, for example an open notification panel. Sets aria-pressed and the pressed surface.
  pressed?: boolean;
  // Open state of a popover or menu trigger. Sets aria-expanded and the open surface. Do not combine with `pressed`: expanded wins and no aria-pressed is set.
  expanded?: boolean;
  // Counts above this show as `<max>+`. Default 99.
  maxCount?: number;
  // Small status dot in the bottom corner (for example connection or sync state). Pair it with `statusLabel`, colour alone is not enough.
  status?: StatusDotTone;
  // Text for assistive tech, appended to the accessible name, e.g. `Offline`.
  statusLabel?: string;
}

const TopBarIconButton = React.forwardRef<HTMLButtonElement, TopBarIconButtonProps>(
  ({ className, label, count, pressed: pressedProp, expanded, maxCount = 99, status, statusLabel, children, ...props }, ref) => {
    // A disclosure trigger exposes aria-expanded only, never aria-pressed.
    const pressed = expanded === undefined ? pressedProp : undefined;
    const shown = count && count > maxCount ? `${maxCount}+` : count;
    const zero = usePreset() === 'zero';
    return (
    <button
      ref={ref}
      type="button"
      aria-label={[label, count ? shown : undefined, status ? statusLabel : undefined].filter(Boolean).join(', ')}
      data-status={status}
      aria-pressed={pressed}
      aria-expanded={expanded}
      data-pressed={pressed || undefined}
      data-expanded={expanded || undefined}
      className={cn(
        'relative inline-flex h-control-md w-control-md shrink-0 items-center justify-center rounded-control [&>svg]:h-icon-sm [&>svg]:w-icon-sm',
        zero ? 'text-icon-default' : 'text-icon-subtle',
        transitionBase,
        'hover:bg-muted hover:text-icon-default active:bg-muted-strong',
        'data-[pressed]:bg-muted data-[pressed]:text-icon-default',
        'data-[expanded]:bg-muted data-[expanded]:text-icon-default',
        'disabled:pointer-events-none disabled:opacity-disabled',
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
      {count ? (
        <span
          aria-hidden
          className={cn(
            'absolute right-0 top-0 grid h-4 min-w-icon-sm place-items-center rounded-full bg-background-brand-bold-default text-text-on-brand',
            zero ? 'typography-avatar-xs px-micro' : 'typography-text-extra-small px-1',
          )}
        >
          {shown}
        </span>
      ) : null}
      {status ? <StatusDot tone={status} size="md" className="absolute bottom-0 right-0 ring-2 ring-background" /> : null}
    </button>
    );
  },
);
TopBarIconButton.displayName = 'TopBarIconButton';

export interface TopBarHelpButtonProps extends Omit<TopBarIconButtonProps, 'label' | 'children'> {
  // Accessible name. Defaults to the provider text, then English `Help`.
  label?: string;
}

// Help icon button (Figma Header navigation Mode=Settings, Help button). Alternative to the close button in settings mode.
const TopBarHelpButton = React.forwardRef<HTMLButtonElement, TopBarHelpButtonProps>(({ label: labelProp, ...props }, ref) => {
  const l = useLabels();
  return (
    <TopBarIconButton ref={ref} label={labelProp ?? l.help} {...props}>
      <HelpCircle aria-hidden />
    </TopBarIconButton>
  );
});
TopBarHelpButton.displayName = 'TopBarHelpButton';

export interface TopBarEscapeHintProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Called when Escape is pressed. Omit to render the hint text only. */
  onEscape?: () => void;
}

const TopBarEscapeHint = React.forwardRef<HTMLSpanElement, TopBarEscapeHintProps>(
  ({ className, onEscape, children: childrenProp, ...props }, ref) => {
    const l = useLabels();
    const children = childrenProp ?? l.escClosesSettings;
    useEscapeKey(onEscape);
    return (
      // A keyboard hint is no use on a phone: it also took the room of the page title below sm.
      <span ref={ref} className={cn('typography-ui-sm text-text-subtle max-sm:hidden', className)} {...props}>
        {children}
      </span>
    );
  },
);
TopBarEscapeHint.displayName = 'TopBarEscapeHint';

// Mobile menu trigger: pair with a Sheet or any disclosure; exposes the disclosure state.
export interface TopBarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  open?: boolean;
  // `inverse` is for a bar on an inverse surface (dark band in light mode, light band in dark mode): icon, hover and focus ring follow the band. `inverse-fixed` needs no change, its dark scope already resolves the default roles.
  tone?: 'default' | 'inverse' | 'inverse-fixed';
}

const TopBarMenuButton = React.forwardRef<HTMLButtonElement, TopBarMenuButtonProps>(
  ({ className, open = false, tone = 'default', 'aria-label': ariaLabelProp, children, ...props }, ref) => {
    const l = useLabels();
    const ariaLabel = ariaLabelProp ?? l.menu;
    return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control',
        // Exactly 40x40 in every theme and preset: a fixed scale size, not a control token (control-md is 32px without preset zero).
        'h-10 w-10',
        transitionBase,
        tone === 'inverse'
          ? ['text-text-inverse hover:bg-text-inverse/10 active:bg-text-inverse/20', focusRingInverse]
          : ['text-icon-default hover:bg-muted active:bg-muted-strong', focusRing],
        className,
      )}
      {...props}
    >
      {children ?? <Menu className="h-icon-lg w-icon-lg" aria-hidden />}
    </button>
  );
  },
);
TopBarMenuButton.displayName = 'TopBarMenuButton';

/* -------------------------------------------------------------------------------------------------
 * Primary navigation (Guest, Simple, Dual-tier)
 * -----------------------------------------------------------------------------------------------*/

export interface TopBarNavItem extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> {
  label: React.ReactNode;
  href: string;
  // `true` and `page` mark the current page. `location` marks the current in-page anchor section.
  current?: boolean | 'page' | 'location';
}

export interface TopBarNavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  items: TopBarNavItem[];
  /** `muted` renders inactive items in the subtle text color (Guest header). Default `default`. */
  tone?: 'default' | 'muted';
}

const TopBarNav = React.forwardRef<HTMLElement, TopBarNavProps>(
  ({ className, items, tone = 'default', 'aria-label': ariaLabelProp, ...props }, ref) => {
    const l = useLabels();
    const ariaLabel = ariaLabelProp ?? l.primary;
    return (
    <nav ref={ref} aria-label={ariaLabel} className={cn('-m-1 min-w-0 overflow-x-auto p-1', className)} {...props}>
      <ul className="m-0 flex w-max list-none items-center gap-1 p-0">
        {items.map(({ label, href, current, ...rest }, index) => (
          <li key={index}>
            <a
              {...rest}
              href={href}
              aria-current={current ? (current === 'location' ? 'location' : 'page') : undefined}
              className={cn(
                'typography-ui-medium inline-flex h-control-md items-center rounded-control px-2 no-underline',
                transitionBase,
                'hover:bg-muted',
                tone === 'muted' ? 'text-text-subtle' : 'text-text-default',
                'aria-[current=page]:bg-muted aria-[current=page]:text-text-default',
                'aria-[current=location]:bg-muted aria-[current=location]:text-text-default',
                focusRing,
              )}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
  },
);
TopBarNav.displayName = 'TopBarNav';

/* -------------------------------------------------------------------------------------------------
 * Guest header parts: brand with suite byline, language and theme
 * -----------------------------------------------------------------------------------------------*/

export interface TopBarBrandProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  // Leading logo or object icon.
  mark?: React.ReactNode;
  // Wordmark text.
  name: React.ReactNode;
  // Optional suite byline next to the wordmark, for example "by Get IT Done" (Figma Header navigation Guest, Suite byline).
  byline?: React.ReactNode;
  // Wordmark type role: `sm` is the default UI weight, `md` the small title, `lg` the small display style.
  // `18`, `20` and `24` set the wordmark at 18px (large role), 20px (title-sm role, same as `md`) and 24px (page title role) for site headers.
  size?: 'sm' | 'md' | 'lg' | '18' | '20' | '24';
  // `inverse` sets the wordmark and byline for an inverse surface (dark band in light mode, light band in dark mode).
  // `inverse-fixed` stays light on dark in both modes, for bands that are dark in light and dark mode.
  tone?: 'default' | 'inverse' | 'inverse-fixed';
  // Sets the wordmark in capitals.
  uppercase?: boolean;
  // Letter spacing of the wordmark. `default` keeps the type role. `tight`, `wide` and `wider` use the Tailwind tracking steps, usually with `uppercase`.
  tracking?: 'default' | 'tight' | 'wide' | 'wider';
}

const brandSize = {
  sm: 'typography-ui-semibold',
  md: 'typography-title-sm',
  lg: 'typography-display-sm',
  '18': 'typography-large',
  '20': 'typography-title-sm',
  '24': 'typography-page-title',
} as const;

const brandTracking = { default: undefined, tight: 'tracking-tight', wide: 'tracking-wide', wider: 'tracking-wider' } as const;

// The title-sm and display-sm utilities omit the letter-spacing of their type role, so it is read from the role token here. typography-ui-semibold already carries it.
const brandLetterSpacing = {
  sm: undefined,
  md: 'var(--typo-title-sm-ls)',
  lg: 'var(--typo-display-sm-ls)',
  '18': undefined,
  '20': 'var(--typo-title-sm-ls)',
  '24': undefined,
} as const;

const brandTone = {
  default: { name: 'text-text-default', byline: 'text-text-subtle' },
  inverse: { name: 'text-text-inverse', byline: 'text-text-inverse-subtle' },
  // The dark theme is scoped to the brand (class dark), so default text roles resolve light in both modes.
  'inverse-fixed': { name: 'text-text-default', byline: 'text-text-subtle' },
} as const;

const TopBarBrand = React.forwardRef<HTMLDivElement, TopBarBrandProps>(
  ({ className, mark, name, byline, size = 'sm', tone = 'default', uppercase = false, tracking = 'default', ...props }, ref) => (
    <div ref={ref} className={cn('flex min-w-0 items-center gap-2', tone === 'inverse-fixed' && 'dark', className)} {...props}>
      {mark}
      <span
        className={cn(brandSize[size], 'truncate', brandTone[tone].name, uppercase && 'uppercase', brandTracking[tracking])}
        style={{ letterSpacing: tracking === 'default' ? brandLetterSpacing[size] : undefined }}
      >
        {name}
      </span>
      {byline ? (
        <span data-byline="" className={cn('typography-ui-sm truncate', brandTone[tone].byline)}>
          {byline}
        </span>
      ) : null}
    </div>
  ),
);
TopBarBrand.displayName = 'TopBarBrand';

export interface TopBarPreferencesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  // Visible name of the active language, for example "English". The language button renders only when set.
  language?: React.ReactNode;
  onLanguageClick?: React.MouseEventHandler<HTMLButtonElement>;
  // Renders the language switch as a link (crawlable on SEO pages). `onLanguageClick` then fires on the anchor.
  languageHref?: string;
  // Language of the target page, set on the link as hreflang.
  languageHrefLang?: string;
  // Accessible name of the language button. Defaults to the provider text.
  languageLabel?: string;
  // Current theme. Drives the icon (moon in light, sun in dark). The theme button renders only with `onThemeToggle`.
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  // Accessible name of the theme button. Defaults to the provider text.
  themeLabel?: string;
}

// Language switcher and theme toggle slot of the Guest header (Figma Header navigation Guest, Language and theme).
const TopBarPreferences = React.forwardRef<HTMLDivElement, TopBarPreferencesProps>(
  (
    {
      className,
      language,
      onLanguageClick,
      languageHref,
      languageHrefLang,
      languageLabel,
      theme = 'light',
      onThemeToggle,
      themeLabel,
      ...props
    },
    ref,
  ) => {
    const l = useLabels();
    return (
      <div ref={ref} className={cn('flex items-center gap-1', className)} {...props}>
        {language && languageHref ? (
          <Button asChild variant="ghost" size="control-md">
            <a
              href={languageHref}
              hrefLang={languageHrefLang}
              lang={languageHrefLang}
              aria-label={typeof language === 'string' ? `${languageLabel ?? l.language}: ${language}` : (languageLabel ?? l.language)}
              onClick={onLanguageClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
            >
              <Globe aria-hidden className="h-icon-sm w-icon-sm" />
              {language}
            </a>
          </Button>
        ) : language ? (
          <Button
            type="button"
            variant="ghost"
            size="control-md"
            aria-label={typeof language === 'string' ? `${languageLabel ?? l.language}: ${language}` : (languageLabel ?? l.language)}
            onClick={onLanguageClick}
          >
            <Globe aria-hidden className="h-icon-sm w-icon-sm" />
            {language}
          </Button>
        ) : null}
        {onThemeToggle ? (
          <TopBarIconButton label={themeLabel ?? l.switchTheme} onClick={onThemeToggle}>
            {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
          </TopBarIconButton>
        ) : null}
      </div>
    );
  },
);
TopBarPreferences.displayName = 'TopBarPreferences';

/* -------------------------------------------------------------------------------------------------
 * Guest mobile menu: menu button plus a drawer with the primary links
 * -----------------------------------------------------------------------------------------------*/

// A link of the mobile menu: a TopBarNav link plus its own section-jump handler.
export interface TopBarMobileMenuLink extends TopBarNavItem {
  // Replaces the default jump of this link, see `onNavigate` of the menu.
  onNavigate?: SheetNavLinkProps['onNavigate'];
}

export interface TopBarMobileMenuGroup {
  // Label of the group. The group collapses and expands with the library Accordion.
  group: React.ReactNode;
  // Links inside the group.
  items: TopBarMobileMenuLink[];
  // Starts expanded. Default: expanded when one of the links is the current page or section. Ignored when `collapsible` is false.
  defaultOpen?: boolean;
  // `false` shows the group label as a visible, always expanded section heading instead of an accordion trigger. Default `true`.
  collapsible?: boolean;
}

export type TopBarMobileMenuItem = TopBarMobileMenuLink | TopBarMobileMenuGroup;

const isMenuGroup = (item: TopBarMobileMenuItem): item is TopBarMobileMenuGroup => 'items' in item;

export interface TopBarMobileMenuProps {
  // Flat links like TopBarNav, optionally mixed with collapsible groups (`{ group, items }`). A `#section` link closes the drawer, waits until the scroll lock is gone, scrolls to the section and focuses it (give the sections `scroll-mt-*` below a fixed header). Any other plain click closes the drawer as well. A modified click or a link with a `target` keeps it open.
  items: TopBarMobileMenuItem[];
  // Replaces the default jump of every link, for example to scroll with a router. Runs once the drawer is completely gone. A link can set its own `onNavigate`.
  onNavigate?: SheetNavLinkProps['onNavigate'];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Deprecated fallback for `triggerLabel`, `title` and `navLabel` (removed after one minor). Use the three specific names.
  label?: string;
  // Accessible name of the menu button. Defaults to `label`, then the provider text "Menu" / "Menü".
  triggerLabel?: string;
  // Name of the drawer dialog. Defaults to `label`, then the provider text "Menu" / "Menü".
  title?: string;
  // Name of the navigation landmark. Defaults to `label`, then the provider text "Navigation".
  navLabel?: string;
  // Drawer width from the sheet size tokens. Default `sm` (440px, never wider than the viewport minus a scrim edge), so the drawer stays narrow at tablet width.
  size?: React.ComponentProps<typeof SheetContent>['size'];
  // Accessible name of the close button of the drawer. Defaults to the provider text "Close menu" / "Menü schließen".
  closeLabel?: string;
  // Extra content below the links, for example TopBarPreferences or a call to action. Scrolls with the links. A `SheetNavLink` here jumps to a section like the links above.
  children?: React.ReactNode;
  // Sticky footer of the drawer, outside the scrolling list, for actions such as "Sign in" that must stay visible while the links scroll.
  footer?: React.ReactNode;
  // Classes of the menu button. Default hides it from the md breakpoint up (pair TopBarNav with `hidden md:block`).
  triggerClassName?: string;
  // Keeps the menu button at every width, so the drawer replaces a desktop dropdown menu. Standard for landing pages, where the burger always opens this drawer.
  alwaysVisible?: boolean;
  // Surface tone of the bar that holds the menu button. The drawer itself always uses the default surface.
  tone?: TopBarMenuButtonProps['tone'];
  side?: 'left' | 'right';
}

const TopBarMobileMenu = ({
  items,
  onNavigate: onNavigateAll,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label: labelProp,
  triggerLabel,
  title,
  navLabel,
  size = 'sm',
  closeLabel,
  children,
  footer,
  triggerClassName,
  alwaysVisible = false,
  tone,
  side = 'right',
}: TopBarMobileMenuProps) => {
  const l = useLabels({ closeMenu: closeLabel });
  const menuId = React.useId();
  const trigger = triggerLabel ?? labelProp ?? l.menu;
  const dialogTitle = title ?? labelProp ?? l.menu;
  const navName = navLabel ?? labelProp ?? l.navigation;
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };
  const renderLink = ({ label: itemLabel, href, current, onNavigate, ...rest }: TopBarMobileMenuLink, index: number) => (
    <SheetNavLink
      key={index}
      {...(rest as Omit<typeof rest, 'color'>)}
      href={href}
      variant="nav"
      closeOnNavigate
      onNavigate={onNavigate ?? onNavigateAll}
      aria-current={current ? (current === 'location' ? 'location' : 'page') : undefined}
      className={cn(
        'typography-ui-medium inline-flex h-control-lg items-center rounded-control px-3 no-underline',
        transitionBase,
        'hover:bg-muted aria-[current=page]:bg-muted aria-[current=location]:bg-muted',
      )}
    >
      {itemLabel}
    </SheetNavLink>
  );
  return (
    <>
      <TopBarMenuButton open={open} tone={tone} aria-label={trigger} className={cn(!alwaysVisible && 'md:hidden', triggerClassName)} onClick={() => setOpen(!open)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={side} size={size} padded={false} closeLabel={l.closeMenu} className={cn('bg-background-default text-text-default', size !== 'full' && 'max-w-[calc(100%-3rem)]')}>
          <SheetTitle className="sr-only">{dialogTitle}</SheetTitle>
          <SheetDescription className="sr-only">{l.navigation}</SheetDescription>
          <nav
            aria-label={navName}
            className={cn(
              'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4 pt-12',
              // Any other link in the drawer, such as a logo link in the children, gets the shared focus ring too.
              '[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-focus [&_a:focus-visible]:ring-offset-focus [&_a:focus-visible]:ring-offset-background [&_a:focus-visible]:ring-ring-default',
            )}
          >
            {items.map((item, index) => {
              if (isMenuGroup(item) && item.collapsible === false) {
                const headingId = `${menuId}-group-${index}`;
                return (
                  <div key={index} role="group" aria-labelledby={headingId} className="flex flex-col gap-1">
                    <p id={headingId} className="typography-ui-medium px-3 pb-1 pt-3 text-text-subtle">{item.group}</p>
                    {/* Same 12px indent as the items of an expanded accordion group. */}
                    <div className="flex flex-col gap-1 pl-3">{item.items.map((child, childIndex) => renderLink(child, childIndex))}</div>
                  </div>
                );
              }
              if (isMenuGroup(item)) {
                const openByDefault = item.defaultOpen ?? item.items.some((child) => child.current);
                return (
                  <Accordion key={index} type="multiple" defaultValue={openByDefault ? ['group'] : []}>
                    <AccordionItem value="group" className="border-0">
                      <AccordionTrigger className="typography-ui-medium h-control-lg px-3 py-0 text-text-default no-underline hover:bg-muted hover:no-underline active:bg-muted-strong">{item.group}</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-1 pb-0 pl-3">{item.items.map((child, childIndex) => renderLink(child, childIndex))}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              }
              return renderLink(item, index);
            })}
            {children ? <div className="mt-4 flex flex-col gap-2 border-0 border-t border-solid border-hairline pt-4">{children}</div> : null}
          </nav>
          {footer ? <div data-slot="topbar-mobile-menu-footer" className="flex shrink-0 flex-col gap-2 border-0 border-t border-solid border-hairline bg-background-default p-4">{footer}</div> : null}
        </SheetContent>
      </Sheet>
    </>
  );
};
TopBarMobileMenu.displayName = 'TopBarMobileMenu';

export {
  TopBarBrand,
  TopBarMobileMenu,
  TopBarPreferences,
  TimerPill,
  TopBar,
  TopBarBreadcrumb,
  TopBarEnd,
  TopBarEscapeHint,
  TopBarHelpButton,
  TopBarIconButton,
  TopBarMenuButton,
  TopBarNav,
  TopBarStart,
  TopBarSubRow,
  topBarVariants,
};
