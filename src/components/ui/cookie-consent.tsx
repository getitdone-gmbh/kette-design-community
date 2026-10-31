'use client';

import * as React from 'react';

import { findReplacement, focusPageStart, regionOf } from '../../lib/return-focus';
import { useToastInset } from '../../lib/toast-inset';
import { cn } from '../../lib/utils';
import type { HeadingTag } from './heading-tag';
import { Button } from './button';
import { ButtonClose } from './button-close';
import type { LabelOverrides } from './labels';
import { useLabels } from './labels-context';
import { Switch } from './switch';

export interface CookieConsentCategory {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  // Strictly necessary categories are always on and cannot be switched off. All others start off.
  necessary?: boolean;
  // Notice under the description in the settings view, for example a link to the privacy policy. Kept out of the switch description so its link stays a normal link.
  notice?: React.ReactNode;
}

export type CookieConsentSelection = Record<string, boolean>;

// Element of the banner title: a heading level, or `p` for a title that is not part of the document outline.
export type CookieConsentTitleTag = HeadingTag | 'p';

export interface CookieConsentProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  // Visibility is owned by the consumer, who also persists the decision.
  open?: boolean;
  title?: React.ReactNode;
  // Element of the title. h1-h6 fit the banner into the document outline (default h2), `p` renders a plain paragraph so the banner adds no heading to the page.
  titleAs?: CookieConsentTitleTag;
  // What is stored and why. Link the privacy policy inside the text.
  description: React.ReactNode;
  onAccept: () => void;
  // Declines everything that is not strictly necessary. Always offered as an equal action next to accept.
  onDecline: () => void;
  // Optional third path for per-category choices. Rendered as a quiet link button.
  onCustomize?: () => void;
  // Per-category choices. Adds a settings view with one switch per category (nothing pre-selected except necessary ones).
  categories?: CookieConsentCategory[];
  // Stored choice that the settings view starts from, for example the cookie value of a returning visitor. Uncontrolled: the switches stay editable and a changed `initialConsent` resets them. Unknown ids are ignored, missing ids stay off, necessary categories are always on. Without it nothing is pre-selected.
  initialConsent?: CookieConsentSelection;
  // Controlled selection of the settings view. Wins over `initialConsent`; pair it with `onValueChange`. Without `value` the component keeps the switch state itself.
  value?: CookieConsentSelection;
  // Called on every switch change in the settings view with the full selection (both modes).
  onValueChange?: (selection: CookieConsentSelection) => void;
  // Called when `openCookieSettings()` or `useCookieConsent().reopen()` asks for the banner. A controlled consumer sets its `open` state to true here. The banner shows itself for the request even without this handler, and hides again after a decision.
  onReopen?: () => void;
  // Receives the chosen categories from the settings view.
  onSave?: (selection: CookieConsentSelection) => void;
  // Shows a close button. By default closing gives no consent: it calls `onDecline`, exactly like declining (see `dismissBehavior`).
  closable?: boolean;
  // What the close button does. `decline` (default) calls `onDecline`. `defer` closes without deciding: nothing is decided or stored, `onDismiss` is called, the banner hides itself and shows again on the next mount (next visit).
  dismissBehavior?: 'decline' | 'defer';
  // Called when the banner is closed with `dismissBehavior="defer"`.
  onDismiss?: () => void;
  // `compact` is the bottom-left card, `centered-wide` is a wide centred bar/card.
  layout?: 'compact' | 'centered-wide';
  // Opt-in brand fill for both decisions. Accept and decline always render with identical variant, size and contrast
  // on the first layer, because declining must be as easy and as prominent as accepting (GDPR / TTDSG).
  acceptEmphasis?: boolean;
  acceptLabel?: string;
  declineLabel?: string;
  customizeLabel?: string;
  closeLabel?: string;
  saveLabel?: string;
  backLabel?: string;
  // Text beside the locked switch of necessary categories in the settings view. Default "Always active" (en) or "Immer aktiv" (de).
  alwaysActiveLabel?: string;
  settingsTitle?: React.ReactNode;
  // Accessible name of the region.
  regionLabel?: string;
  // `fixed` pins the banner to the bottom of the window, `static` leaves placement to the layout.
  positioning?: 'fixed' | 'static';
  // Size of the buttons: `default` (40px) or `sm` (32px, for dense pages and the compact card).
  size?: 'default' | 'sm';
}

// Breathing room in px between a scrolled-to element and the banner edge, so its focus ring stays visible.
const SCROLL_PADDING_GAP = 8;

// Links inside the running text keep an underline: their colour alone is not 3:1 against the surrounding text (WCAG 1.4.1).
const inlineLink = '[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:no-underline';

// Elements that only take programmatic focus (the region and its title, tabIndex -1) are not controls, so they do not get the full focus ring of the library. Pointer users see nothing; keyboard users (:focus-visible) get a thin outline.
const programmaticFocusRing = 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring-default';

// A trigger is a button or link outside the banner. Only such an element holding focus proves that the user asked for the banner.
const isTrigger = (el: Element | null, banner: HTMLElement | null): el is HTMLElement =>
  el instanceof HTMLElement && !banner?.contains(el) && el.matches('button, a[href], [role="button"], [role="link"]');

const scrollsVertically = (el: HTMLElement) => {
  const { overflowY } = window.getComputedStyle(el);
  return /(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight;
};

// Brings a focused element clear of the banner. scrollIntoView covers every ancestor scroller (also horizontal carousels, where the page scroll padding does not apply), the correction afterwards covers scrollers that ignore the document scroll padding.
const revealAboveBanner = (target: Element, banner: HTMLElement) => {
  target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  const bannerRect = banner.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const horizontalOverlap = rect.right > bannerRect.left && rect.left < bannerRect.right;
  const hiddenBy = rect.bottom - (bannerRect.top - SCROLL_PADDING_GAP);
  if (!horizontalOverlap || hiddenBy <= 0 || rect.top >= bannerRect.bottom) return;
  const delta = Math.min(hiddenBy, Math.max(0, rect.top));
  if (delta <= 0) return;
  let ancestor = target.parentElement;
  while (ancestor && ancestor !== document.body && !scrollsVertically(ancestor)) ancestor = ancestor.parentElement;
  if (ancestor && ancestor !== document.body) ancestor.scrollTop += delta;
  else window.scrollBy(0, delta);
};

const REOPEN_EVENT = 'kette:cookie-consent-reopen';

interface ReopenRequest {
  opener: HTMLElement | null;
  handled: boolean;
}

// Opens the consent banner again, for example from a "Cookie settings" link in the footer. Call it from the click handler of the opener: the focused button or link is remembered, focus moves into the banner and returns to the opener when the banner closes. Works with a controlled banner (`open`, pair it with `onReopen`) and an uncontrolled one. Returns false when no CookieConsent is mounted, so keep the component mounted (with `open={false}` while a choice is stored).
const openCookieSettings = (): boolean => {
  if (typeof window === 'undefined') return false;
  const active = document.activeElement;
  const detail: ReopenRequest = { opener: active instanceof HTMLElement && active !== document.body ? active : null, handled: false };
  window.dispatchEvent(new CustomEvent<ReopenRequest>(REOPEN_EVENT, { detail }));
  return detail.handled;
};

// Hook form of `openCookieSettings`, with a stable `reopen` function.
const useCookieConsent = () => React.useMemo(() => ({ reopen: openCookieSettings }), []);

const initialSelection = (categories: CookieConsentCategory[], stored?: CookieConsentSelection): CookieConsentSelection =>
  Object.fromEntries(categories.map((c) => [c.id, Boolean(c.necessary) || Boolean(stored?.[c.id])]));

// Privacy-preserving by design: nothing is pre-selected, accept and decline share variant, size and order weight,
// and the banner does not trap focus or block the page.
const CookieConsent = React.forwardRef<HTMLElement, CookieConsentProps>(
  (
    {
      className,
      open = true,
      title,
      titleAs = 'h2',
      description,
      onAccept,
      onDecline,
      onCustomize,
      categories,
      initialConsent,
      value,
      onValueChange,
      onSave,
      onReopen,
      closable = false,
      dismissBehavior = 'decline',
      onDismiss,
      layout = 'compact',
      acceptEmphasis = false,
      acceptLabel,
      declineLabel,
      customizeLabel,
      closeLabel,
      saveLabel,
      backLabel,
      alwaysActiveLabel,
      settingsTitle,
      regionLabel,
      positioning = 'fixed',
      size = 'default',
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const labels: LabelOverrides = {
      acceptAllCookies: acceptLabel,
      declineNonEssentialCookies: declineLabel,
      cookieSettings: customizeLabel,
      cookieClose: closeLabel,
      cookieSaveSelection: saveLabel,
      cookieBack: backLabel,
      cookieAlwaysActive: alwaysActiveLabel,
      cookieSettingsTitle: typeof settingsTitle === 'string' ? settingsTitle : undefined,
      cookieConsentRegion: regionLabel,
    };
    const l = useLabels(labels);
    const Title = titleAs as React.ElementType;
    const titleId = React.useId();
    const [view, setView] = React.useState<'summary' | 'settings'>('summary');
    const [draft, setDraft] = React.useState<CookieConsentSelection>(() => initialSelection(categories ?? [], value ?? initialConsent));
    const controlled = value !== undefined;
    const selection = controlled ? initialSelection(categories ?? [], value) : draft;
    // A new stored choice (for example after saving) resets the uncontrolled switches.
    const storedKey = JSON.stringify(initialConsent ?? null);
    const firstStored = React.useRef(true);
    React.useEffect(() => {
      if (firstStored.current) {
        firstStored.current = false;
        return;
      }
      setDraft(initialSelection(categories ?? [], initialConsent));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storedKey]);
    const [deferred, setDeferred] = React.useState(false);
    // Below sm the description is clamped to two lines (the card stays small and covers little of the page); a toggle shows the rest. It only appears when the text really is longer.
    const [expanded, setExpanded] = React.useState(false);
    const [clamped, setClamped] = React.useState(false);
    const descriptionRef = React.useRef<HTMLDivElement | null>(null);
    const detailsId = `${titleId}-details`;
    const headingRef = React.useRef<HTMLElement | null>(null);
    const sectionRef = React.useRef<HTMLElement | null>(null);
    const settingsButtonRef = React.useRef<HTMLButtonElement | null>(null);
    // The banner never takes focus on its own. Only a user-driven switch between the views moves it: into the settings panel on open, back to the Settings button on return.
    const viewChanged = React.useRef(false);
    React.useEffect(() => {
      if (!viewChanged.current) return;
      if (view === 'settings') (headingRef.current ?? sectionRef.current)?.focus({ preventScroll: true });
      else settingsButtonRef.current?.focus({ preventScroll: true });
    }, [view]);
    // A reopen request shows the banner even when the consumer's `open` is false. A decision or `open` turning false takes it back.
    const [requested, setRequested] = React.useState(false);
    const visible = (open || requested) && !deferred;
    const visibleRef = React.useRef(visible);
    visibleRef.current = visible;
    const onReopenRef = React.useRef(onReopen);
    onReopenRef.current = onReopen;
    const requestedOpener = React.useRef<HTMLElement | null>(null);
    const opener = React.useRef<HTMLElement | null>(null);
    const openerScope = React.useRef<HTMLElement | null>(null);
    const rememberOpener = (el: HTMLElement | null) => {
      opener.current = el;
      openerScope.current = regionOf(el);
    };
    // True while keyboard focus sits inside the banner. Only then does closing it owe the user a new place for focus.
    const focusInside = React.useRef(false);
    // Restores focus to the opener. The replacement is searched in the opener's region only, and the page never scrolls: nobody asked for the move.
    // Without an opener (first visit, the banner appeared on its own) focus that was inside the banner goes to the start of the page content instead of being lost to the body (Escape, accept, decline).
    const restoreFocus = () => {
      const target = findReplacement(opener.current, openerScope.current);
      opener.current = null;
      openerScope.current = null;
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (target && lost) target.focus({ preventScroll: true });
      else if (!target && lost && focusInside.current) focusPageStart();
      focusInside.current = false;
    };
    const wasVisible = React.useRef(false);
    const wasOpen = React.useRef(open);
    React.useEffect(() => {
      if (wasOpen.current && !open) setRequested(false);
      wasOpen.current = open;
    }, [open]);
    React.useEffect(() => {
      const onRequest = (event: Event) => {
        const detail = (event as CustomEvent<ReopenRequest>).detail;
        if (detail) detail.handled = true;
        requestedOpener.current = detail?.opener ?? null;
        setDeferred(false);
        setRequested(true);
        onReopenRef.current?.();
        // Already showing: no visibility change follows, so the focus move happens here.
        if (visibleRef.current && isTrigger(requestedOpener.current, sectionRef.current)) {
          rememberOpener(requestedOpener.current);
          requestedOpener.current = null;
          viewChanged.current = false;
          setView('summary');
          (headingRef.current ?? sectionRef.current)?.focus({ preventScroll: true });
        }
      };
      window.addEventListener(REOPEN_EVENT, onRequest);
      return () => window.removeEventListener(REOPEN_EVENT, onRequest);
    }, []);
    // A reopen (`open` turns true again) shows a banner that was dismissed before, so a deferred dismissal no longer hides it.
    React.useEffect(() => {
      if (open) setDeferred(false);
    }, [open]);
    // The very first automatic appearance never moves focus. When the banner appears while a button or link outside it holds focus (a "Cookie settings" trigger in the footer), focus moves to the heading, or to the region without a title, and the trigger is remembered. When the banner goes away (accept, decline, save, close) focus returns to that trigger, also if it was re-rendered meanwhile.
    React.useEffect(() => {
      if (visible) {
        const fromRequest = requestedOpener.current;
        requestedOpener.current = null;
        const active = fromRequest?.isConnected ? fromRequest : document.activeElement;
        if (isTrigger(active, sectionRef.current)) {
          rememberOpener(active);
          viewChanged.current = false;
          setView('summary');
          (headingRef.current ?? sectionRef.current)?.focus({ preventScroll: true });
        } else {
          rememberOpener(null);
        }
      } else if (wasVisible.current) {
        restoreFocus();
      }
      wasVisible.current = visible;
    }, [visible]);
    // A banner that a consumer removes from the tree (conditional rendering) also hands focus back.
    React.useEffect(
      () => () => restoreFocus(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );
    // Measures whether the clamped description hides text. Runs while collapsed; an expanded description keeps its toggle.
    React.useEffect(() => {
      const node = descriptionRef.current;
      if (!node || expanded || typeof ResizeObserver === 'undefined') return undefined;
      const measure = () => setClamped(node.scrollHeight > node.clientHeight + 1);
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [expanded, visible, view, description]);
    const reserveScrollSpace = visible && positioning === 'fixed';
    // On phones a toast rides above the fixed banner instead of covering its buttons.
    useToastInset(sectionRef, { enabled: reserveScrollSpace });
    // While a fixed banner is showing, keep focused page content above it. Its height is reserved as scroll padding on the document scroller, and as an end-of-body spacer so the end of the page can scroll clear of it too, whatever the body height.
    React.useEffect(() => {
      const node = sectionRef.current;
      if (!reserveScrollSpace || !node || typeof ResizeObserver === 'undefined') return undefined;
      const root = document.documentElement;
      const previous = root.style.scrollPaddingBottom;
      const spacer = document.createElement('div');
      spacer.setAttribute('aria-hidden', 'true');
      spacer.setAttribute('data-cookie-consent-spacer', '');
      document.body.appendChild(spacer);
      const update = () => {
        const rect = node.getBoundingClientRect();
        const covered = Math.ceil(rect.height + Math.max(0, root.clientHeight - rect.bottom)) + SCROLL_PADDING_GAP;
        root.style.scrollPaddingBottom = `${covered}px`;
        spacer.style.height = `${covered}px`;
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => {
        observer.disconnect();
        root.style.scrollPaddingBottom = previous;
        spacer.remove();
      };
    }, [reserveScrollSpace]);
    // Keyboard focus moving into page content while the banner is open must never end up behind it, in horizontal scrollers too.
    React.useEffect(() => {
      const node = sectionRef.current;
      if (!reserveScrollSpace || !node) return undefined;
      const onFocusIn = (event: FocusEvent) => {
        const target = event.target;
        if (!(target instanceof Element) || node.contains(target) || target === document.body) return;
        revealAboveBanner(target, node);
      };
      document.addEventListener('focusin', onFocusIn);
      return () => document.removeEventListener('focusin', onFocusIn);
    }, [reserveScrollSpace]);
    if (!visible) return null;
    const hasSettings = Boolean(categories?.length);
    const inSettings = hasSettings && view === 'settings';
    const wide = layout === 'centered-wide';
    // Both decisions share one variant so neither can be made more prominent than the other.
    const decisionVariant = acceptEmphasis ? 'primary' : 'outline';
    const heading = inSettings ? (settingsTitle ?? l.cookieSettingsTitle) : title;
    // Every decision also ends a reopen request.
    const decline = () => {
      setRequested(false);
      onDecline();
    };
    const accept = () => {
      setRequested(false);
      onAccept();
    };
    const close = () => {
      if (dismissBehavior === 'defer') {
        setDeferred(true);
        setRequested(false);
        onDismiss?.();
      } else {
        decline();
      }
    };
    const openSettings = () => {
      onCustomize?.();
      if (hasSettings) {
        if (!controlled && initialConsent) setDraft(initialSelection(categories ?? [], initialConsent));
        viewChanged.current = true;
        setView('settings');
      }
    };
    const closeSettings = () => {
      viewChanged.current = true;
      setView('summary');
    };
    // Escape closes the banner exactly like the close button, so it only does something when `closable` is set (decline by default, or the deferral with `dismissBehavior="defer"`). Without a close action the banner stays: Escape never grants or declines consent on its own. In the settings view Escape goes back to the summary first.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== 'Escape') return;
      if (inSettings) {
        event.preventDefault();
        closeSettings();
      } else if (closable) {
        event.preventDefault();
        close();
      }
    };
    const buttonSize = size === 'sm' ? 'sm' : 'default';
    return (
      <section
        onKeyDown={handleKeyDown}
        onFocus={() => {
          focusInside.current = true;
        }}
        onKeyDownCapture={() => {
          focusInside.current = true;
        }}
        onClickCapture={() => {
          focusInside.current = true;
        }}
        onBlur={(event) => {
          // Moving between controls of the banner keeps it. Focus that left for the page ends it. A control that was removed while it had focus (the banner closing) is not a move.
          const next = event.relatedTarget as Node | null;
          if (!event.currentTarget.contains(next) && (next || (event.target as Element).isConnected)) focusInside.current = false;
        }}
        data-size={size}
        ref={(node) => {
          sectionRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        tabIndex={-1}
        aria-label={heading ? undefined : l.cookieConsentRegion}
        aria-labelledby={heading ? titleId : undefined}
        className={cn(
          'relative z-banner flex flex-col gap-4 rounded-surface border border-solid border-border bg-popover p-6 text-popover-foreground shadow-elevation-raised max-sm:gap-3 max-sm:p-4',
          programmaticFocusRing,
          wide ? 'max-w-4xl' : 'max-w-reading sm:flex-row sm:items-end',
          wide && !inSettings && 'md:flex-row md:items-end',
          positioning === 'fixed' && (wide ? 'fixed inset-x-4 bottom-4 mx-auto' : 'fixed bottom-4 left-4 right-4 sm:right-auto sm:w-[calc(100%-2rem)]'),
          positioning === 'static' && 'w-full',
          positioning === 'static' && wide && 'mx-auto',
          className,
        )}
        {...props}
      >
        {closable ? (
          <ButtonClose aria-label={l.cookieClose} className="absolute right-3 top-3" onClick={close} />
        ) : null}
        {/* Below sm the text area has a ceiling and scrolls inside the card, so a long description or a list of categories never pushes the buttons off a short screen. */}
        <div className={cn('flex min-w-0 flex-1 flex-col gap-2 max-sm:max-h-[min(50dvh,20rem)] max-sm:overflow-y-auto', closable && 'pr-8')}>
          {heading ? (
            <Title ref={headingRef} id={titleId} tabIndex={-1} className={cn('typography-ui-semibold m-0', programmaticFocusRing)}>
              {heading}
            </Title>
          ) : null}
          {inSettings ? (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {categories?.map((category) => {
                const nameId = `${titleId}-${category.id}-name`;
                const descId = `${titleId}-${category.id}-desc`;
                return (
                  <li key={category.id} className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span id={nameId} className="typography-ui-semibold">
                        {category.title}
                      </span>
                      {category.description ? (
                        <span id={descId} className="typography-ui text-text-subtle">
                          {category.description}
                        </span>
                      ) : null}
                      {category.notice ? (
                        <span data-slot="notice" className={cn('typography-ui text-text-subtle', inlineLink)}>
                          {category.notice}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {category.necessary ? <span className="typography-ui text-text-subtle">{l.cookieAlwaysActive}</span> : null}
                      <Switch
                        checked={category.necessary ? true : Boolean(selection[category.id])}
                        disabled={category.necessary}
                        onCheckedChange={(checked) => {
                          const next = { ...selection, [category.id]: checked };
                          if (!controlled) setDraft(next);
                          onValueChange?.(next);
                        }}
                        aria-labelledby={nameId}
                        aria-describedby={category.description ? descId : undefined}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div
                ref={descriptionRef}
                id={detailsId}
                // A link inside the clamped text that takes keyboard focus opens the text, so it is never focused out of sight.
                onFocus={() => setExpanded(true)}
                className={cn('typography-ui text-text-subtle', inlineLink, !expanded && 'max-sm:line-clamp-2')}
              >
                {description}
              </div>
          )}
        </div>
        {inSettings ? (
          <div className="grid shrink-0 grid-cols-2 items-stretch gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="button" variant="outline" size={buttonSize} onClick={closeSettings}>
              {l.cookieBack}
            </Button>
            <Button type="button" variant="outline" size={buttonSize} onClick={() => {
                setRequested(false);
                onSave?.({ ...selection });
              }}>
              {l.cookieSaveSelection}
            </Button>
          </div>
        ) : (
          // Below sm the two decisions stay full width (a label never wraps) and the settings link and the Show more toggle share the row below them, as links of 32px: the card was 370px tall at 320x568 with three full stacked buttons and no clamp.
          <div className="grid shrink-0 grid-cols-2 items-stretch gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="button" variant={decisionVariant} size={buttonSize} className="max-sm:col-span-2" onClick={decline}>
              {l.declineNonEssentialCookies}
            </Button>
            <Button type="button" variant={decisionVariant} size={buttonSize} className="max-sm:col-span-2" onClick={accept}>
              {l.acceptAllCookies}
            </Button>
            {onCustomize || hasSettings ? (
              <Button ref={settingsButtonRef} type="button" variant="link" size={buttonSize} className="max-sm:col-start-1 max-sm:justify-self-start" onClick={openSettings}>
                {l.cookieSettings}
              </Button>
            ) : null}
            {clamped || expanded ? (
              <Button
                type="button"
                variant="link"
                size={buttonSize}
                aria-expanded={expanded}
                aria-controls={detailsId}
                className="max-sm:col-start-2 max-sm:justify-self-end sm:hidden"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? l.cookieShowLess : l.cookieShowMore}
              </Button>
            ) : null}
          </div>
        )}
      </section>
    );
  },
);
CookieConsent.displayName = 'CookieConsent';

export { CookieConsent, openCookieSettings, useCookieConsent };
