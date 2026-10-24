'use client';

import { OpenerCapture, useReturnFocusFallback } from '../../lib/return-focus';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, X } from 'lucide-react';
import * as React from 'react';

import { MODAL_OVERLAY_ATTRIBUTE, useAfterModalClose, useModalInertRef } from './../../lib/modal-inert';
import { EscapeGuardContext, guardNestedEscape, useGuardedOpen } from './../../lib/nested-layer';
import { INSET_SCOPE_ATTRIBUTE, scrollInsetClasses, useStickyInset } from './../../lib/sticky-inset';
import { cn } from './../../lib/utils';
import type { HeadingTag } from './heading-tag';
import { AutosaveStatus } from './autosave-status';
import { Button } from './button';
import { CodeSnippet, type CodeSnippetProps } from './code-snippet';
import { useLabels, usePreset } from './labels-context';
import { Skeleton } from './skeleton';

// Remembers the modal flag so SheetContent can apply docked (non-modal) focus and Escape rules.
const SheetModalContext = React.createContext(true);

const Sheet = ({ modal = true, open, defaultOpen, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>) => {
  const state = useGuardedOpen({ open, defaultOpen, onOpenChange });
  return (
    <SheetModalContext.Provider value={modal}>
      <EscapeGuardContext.Provider value={state.guard}>
        <SheetPrimitive.Root modal={modal} open={state.open} onOpenChange={state.onOpenChange} {...props} />
      </EscapeGuardContext.Provider>
    </SheetModalContext.Provider>
  );
};
Sheet.displayName = 'Sheet';

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <SheetPrimitive.Overlay
      {...{ [MODAL_OVERLAY_ATTRIBUTE]: '' }}
      className={cn(
        'fixed inset-0 z-sheet data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        zero ? 'bg-overlay-scrim' : 'bg-overlay',
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetBase =
  'fixed z-sheet gap-4 border-hairline bg-background p-6 shadow-dialog transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500';

const sheetVariants = cva(
  sheetBase,
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-solid data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t border-solid data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full border-r border-solid data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right:
          'inset-y-0 right-0 h-full border-l border-solid data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
      // Internal: true when an explicit `size` replaces the responsive default width.
      sized: { true: '', false: '' },
    },
    compoundVariants: [
      { side: 'left', sized: false, className: 'w-3/4 sm:max-w-3xl' },
      { side: 'right', sized: false, className: 'w-3/4 sm:max-w-3xl' },
    ],
    defaultVariants: {
      side: 'right',
      sized: false,
    },
  },
);

type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
// `modal` (default) keeps the scrim and blocks the page. `push` docks a persistent pane without a scrim
// (pair with `modal={false}` on Sheet). `overlay` floats a rounded full-height panel over the page with a scrim.
// `card` floats a rounded panel that hugs its content up to the sheet card max height (Figma Sheet overlay card).
// `centered` places that same card in the middle of the viewport above the scrim (Figma Sheet centered overlay).
type SheetMode = 'modal' | 'push' | 'overlay' | 'card' | 'centered';
// `default` renders the content as given. `loading`, `error` and `dirty` drive SheetBody and SheetFooter.
type SheetState = 'default' | 'loading' | 'error' | 'dirty';
// Docks a fixed sheet to the work area. `topbar` and `topbar-lg` start below the top bar. `topbar-sidebar` and `topbar-sidebar-collapsed`
// also keep a left sheet clear of the expanded or collapsed sidebar. `none` (default) is the window edge.
type SheetInset = 'none' | 'topbar' | 'topbar-lg' | 'topbar-sidebar' | 'topbar-sidebar-collapsed';

const sheetInsetClass: Record<Exclude<SheetInset, 'none'>, string> = {
  topbar: 'top-topbar h-auto bottom-0',
  'topbar-lg': 'top-topbar-lg h-auto bottom-0',
  'topbar-sidebar': 'top-topbar h-auto bottom-0',
  'topbar-sidebar-collapsed': 'top-topbar h-auto bottom-0',
};

const SheetStateContext = React.createContext<SheetState>('default');

const sheetSizeWidth: Record<SheetSize, string> = {
  sm: 'w-sheet-sm max-w-full',
  md: 'w-sheet-md max-w-full',
  lg: 'w-sheet-lg max-w-full',
  xl: 'w-sheet-xl max-w-full',
  full: 'w-full max-w-full',
};

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    Pick<VariantProps<typeof sheetVariants>, 'side'> {
  /** Fixed panel width from the sheet size tokens (440, 520, 640, 900) or `full` (whole width). Never wider than the viewport. Omit for the original responsive width. */
  size?: SheetSize;
  /** Presentation mode, see SheetMode. Default `modal` is unchanged. */
  mode?: SheetMode;
  /** Number of sheets stacked above this one. Each level shifts the panel left by the stack offset and mutes its surface. */
  stackDepth?: number;
  /** Set to false for a zero-padding flex column (header, body and footer manage their own padding). */
  padded?: boolean;
  /** Loading, error and dirty states, read by SheetBody and SheetFooter. */
  state?: SheetState;
  // Accessible name of the close button and the loading skeleton. Win over the provider text.
  closeLabel?: string;
  /** Docks the sheet to the work area instead of the window edge, see SheetInset. Default `none` is unchanged. */
  inset?: SheetInset;
  /** Portals the sheet (and its scrim) into this element instead of the body and positions it `absolute`. The element must be `relative`. */
  container?: HTMLElement | null;
  /** Moves focus into the sheet when it opens. Defaults to true for modal sheets and false when `Sheet` has `modal={false}` (docked usage keeps the page focus). */
  focusOnOpen?: boolean;
  /** Runs once the sheet is completely gone: exit animation done, page no longer inert, scroll lock released and focus returned to the opener. Put "focus this field after closing" code here. */
  onAfterClose?: () => void;
}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  (
    {
      side = 'right',
      className,
      children,
      size,
      mode: modeProp,
      stackDepth = 0,
      padded: paddedProp,
      state = 'default',
      style,
      onInteractOutside,
      onOpenAutoFocus,
      onEscapeKeyDown,
      onCloseAutoFocus,
      closeLabel,
      inset = 'none',
      container,
      focusOnOpen,
      onAfterClose,
      ...props
    },
    ref,
  ) => {
    const returnFocus = useReturnFocusFallback(onCloseAutoFocus);
    const l = useLabels({ close: closeLabel });
    const zero = usePreset() === 'zero';
    // Zero: the default sheet is the rounded 8px inset overlay panel (md width, sections own their padding).
    const mode = modeProp ?? (zero ? 'overlay' : 'modal');
    const padded = paddedProp ?? !zero;
    const nonModal = !React.useContext(SheetModalContext);
    const escapeGuard = React.useContext(EscapeGuardContext);
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    // A modal sheet makes everything outside its portal inert while it is open, see lib/modal-inert.
    const inertRef = useModalInertRef<HTMLDivElement>(!nonModal);
    const afterClose = useAfterModalClose<HTMLDivElement>(onAfterClose);
    const setRefs = (node: HTMLDivElement | null) => {
      contentRef.current = node;
      inertRef(node);
      afterClose.capture(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };
    const scoped = Boolean(container);
    const card = mode === 'card' || mode === 'centered';
    const centered = mode === 'centered';
    // Card modes default to the 520 card width when no size is given.
    const widthSize: SheetSize | undefined = size ?? (card || (zero && modeProp === undefined) ? 'md' : undefined);
    const sized = widthSize !== undefined && (card || side === 'left' || side === 'right');
    const floating = mode === 'overlay' && (side === 'left' || side === 'right');
    const cardDocked = mode === 'card';
    return (
      <SheetPortal container={container ?? undefined}>
        {mode !== 'push' && <SheetOverlay className={scoped ? 'absolute' : undefined} />}
        <SheetPrimitive.Content
          ref={setRefs}
          onOpenAutoFocus={(event) => {
            onOpenAutoFocus?.(event);
            if (!(focusOnOpen ?? !nonModal)) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            returnFocus.onCloseAutoFocus(event);
            afterClose.run();
          }}
          onEscapeKeyDown={(event) => {
            onEscapeKeyDown?.(event);
            // Escape inside a select list, menu or popover closes that layer only.
            guardNestedEscape(escapeGuard, event);
            // A docked sheet shares the page with other widgets: Escape only closes it while focus is inside.
            if (nonModal && !contentRef.current?.contains(document.activeElement)) event.preventDefault();
          }}
          aria-busy={state === 'loading' || undefined}
          data-sheet-mode={mode}
          {...{ [INSET_SCOPE_ATTRIBUTE]: '' }}
          data-sheet-state={state}
          data-sheet-inset={inset !== 'none' ? inset : undefined}
          data-sheet-scoped={scoped || undefined}
          style={stackDepth > 0 ? ({ '--sheet-depth': stackDepth, ...style } as React.CSSProperties) : style}
          onInteractOutside={(event) => {
            if (mode === 'push') event.preventDefault();
            onInteractOutside?.(event);
          }}
          className={cn(
            card ? sheetBase : sheetVariants({ side, sized }),
            sized && widthSize && sheetSizeWidth[widthSize],
            scrollInsetClasses,
            !padded && 'flex flex-col gap-0 p-0',
            mode === 'push' && side === 'right' && 'rounded-l-surface',
            mode === 'push' && side === 'left' && 'rounded-r-surface',
            floating && 'inset-y-2 h-auto rounded-surface border border-solid',
            zero && (floating || card || mode === 'push') && 'border-border-default shadow-elevation-raised',
            // A floating panel keeps its 8px inset on both sides, so a wide size never crosses the viewport edge.
            (floating || cardDocked) && 'max-w-[calc(100%-1rem)]',
            floating && side === 'right' && 'right-2',
            floating && side === 'left' && 'left-2',
            card && 'h-auto max-h-[min(var(--size-sheet-card),calc(100vh-var(--size-inset)*2))] overflow-y-auto rounded-surface border border-solid',
            cardDocked && 'top-2',
            cardDocked &&
              side !== 'left' &&
              'right-2 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            cardDocked &&
              side === 'left' &&
              'left-2 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            centered &&
              'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            inset !== 'none' && !scoped && sheetInsetClass[inset],
            inset === 'topbar-sidebar' && !scoped && side === 'left' && 'left-[var(--size-sidebar)]',
            inset === 'topbar-sidebar-collapsed' && !scoped && side === 'left' && 'left-[var(--size-sidebar-collapsed)]',
            scoped && 'absolute',
            zero && 'typography-ui',
            stackDepth > 0 && 'right-[calc(var(--size-sheet-stack-offset)*var(--sheet-depth))] bg-muted',
            className,
          )}
          {...props}
        >
          <OpenerCapture onCapture={returnFocus.remember} />
          <SheetStateContext.Provider value={state}>{children}</SheetStateContext.Provider>
          <SheetPrimitive.Close data-slot="sheet-close" className={cn('absolute right-3 top-3 inline-flex items-center justify-center rounded-control text-icon-subtle transition-colors hover:bg-muted hover:text-icon-default active:bg-muted-strong focus:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus focus-visible:ring-offset-background focus-visible:ring-ring-default disabled:pointer-events-none data-[state=open]:bg-secondary', 'h-10 w-10')}>
            <X className="h-icon-md w-icon-md" aria-hidden="true" />
            <span className="sr-only">{l.close}</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `zero` is the compact record header: bottom hairline, own padding (use with `padded={false}`). */
  variant?: 'default' | 'zero';
}

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(({ className, variant: variantProp, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  const variant = variantProp ?? (zero ? 'zero' : 'default');
  const stickyRef = useStickyInset<HTMLDivElement>('top', ref);
  return (
    <div
      ref={stickyRef}
      className={cn(
        'flex flex-col text-left',
        variant === 'zero' ? 'gap-2 border-0 border-b border-solid border-hairline px-5 py-4' : 'space-y-2',
        className,
      )}
      {...props}
    />
  );
});
SheetHeader.displayName = 'SheetHeader';

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `zero` is the 56px action footer with a top hairline: status on the left, actions on the right. */
  variant?: 'default' | 'zero';
  /** Zero footer only. Left side status, defaults to the autosave status derived from the sheet state. */
  status?: React.ReactNode;
  /** Zero footer only. Secondary action on the left (for example "Download error list"), shown instead of the status. */
  leftAction?: React.ReactNode;
}

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(({ className, variant: variantProp, status, leftAction, children, ...props }, ref) => {
  const state = React.useContext(SheetStateContext);
  const stickyRef = useStickyInset<HTMLDivElement>('bottom', ref, { place: 'auto' });
  const zero = usePreset() === 'zero';
  const variant = variantProp ?? (zero ? 'zero' : 'default');
  if (variant === 'zero') {
    return (
      <div
        ref={stickyRef}
        className={cn(
          'flex min-h-sheet-footer items-center gap-2 border-0 border-t border-solid border-hairline px-5 py-3',
          className,
        )}
        {...props}
      >
        {leftAction ?? status ?? <AutosaveStatus state={state === 'dirty' ? 'dirty' : state === 'error' ? 'error' : 'saved'} />}
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    );
  }
  return (
    <div ref={stickyRef} className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props}>
      {children}
    </div>
  );
});
SheetFooter.displayName = 'SheetFooter';

interface SheetTitleProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> {
  /** `zero` uses the sheet title type role. */
  variant?: 'default' | 'zero';
}

const SheetTitle = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Title>, SheetTitleProps>(
  ({ className, variant: variantProp, ...props }, ref) => {
    const zero = usePreset() === 'zero';
  const variant = variantProp ?? (zero ? 'zero' : 'default');
    return (
      <SheetPrimitive.Title
        ref={ref}
        className={cn(
          variant === 'zero' ? 'typography-sheet-title text-foreground' : 'text-base font-semibold tracking-[-0.01em] text-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => {
  const zero = usePreset() === 'zero';
  return (
    <SheetPrimitive.Description
      ref={ref}
      className={cn(zero ? 'typography-ui-relaxed text-text-subtle' : 'text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// Top row of the zero header: path on the left, room on the right for the close button and the Esc hint.
const SheetPath = ({
  className,
  showEscHint = true,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showEscHint?: boolean }) => (
  <div className={cn('typography-ui-sm flex items-center gap-2 pr-8 text-text-subtle-on-muted', className)} {...props}>
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {showEscHint && (
      <kbd className="typography-text-extra-small rounded-item bg-muted px-1 font-sans text-text-muted" aria-hidden>
        Esc
      </kbd>
    )}
  </div>
);
SheetPath.displayName = 'SheetPath';

// Meta row under the title: autosave status plus facts such as counts. Separators are drawn between children.
const SheetMeta = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('typography-ui flex flex-wrap items-center gap-2 text-text-subtle-on-muted', className)} {...props} />
);
SheetMeta.displayName = 'SheetMeta';

interface SheetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Overrides the state taken from SheetContent. */
  state?: SheetState;
  /** Error state: message under the error icon. */
  errorMessage?: React.ReactNode;
  /** Error state: renders the Try again button. */
  onRetry?: () => void;
  // Deprecated: use retryText.
  retryLabel?: string;
  // Visible texts of the error state and the loading name. Win over the provider text.
  retryText?: string;
  errorText?: React.ReactNode;
  loadingLabel?: string;
}

// Scrollable body. Renders the children, skeleton rows while loading, or an error block with retry.
const SheetBody = React.forwardRef<HTMLDivElement, SheetBodyProps>(
  (
    { className, state: stateProp, errorMessage: errorMessageProp, errorText, onRetry, retryLabel: retryLabelProp, retryText, loadingLabel, children, ...props },
    ref,
  ) => {
    const l = useLabels({ loading: loadingLabel });
    const errorMessage = errorText ?? errorMessageProp ?? l.sheetLoadError;
    const retryLabel = retryText ?? retryLabelProp ?? l.tryAgain;
    const contextState = React.useContext(SheetStateContext);
    const state = stateProp ?? contextState;
    return (
      <div
        ref={ref}
        data-state={state}
        aria-busy={state === 'loading' || undefined}
        className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', scrollInsetClasses, className)}
        {...props}
      >
        {state === 'loading' ? (
          <div role="status" aria-label={l.loading} className="flex flex-col gap-4 p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : state === 'error' ? (
          <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center">
            <AlertCircle className="h-icon-lg w-icon-lg text-icon-destructive" aria-hidden />
            <p className="typography-ui-semibold m-0 text-text-default">{errorMessage}</p>
            {onRetry && (
              <Button type="button" variant="outline" size="control-sm" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    );
  },
);
SheetBody.displayName = 'SheetBody';

interface SheetSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  // Heading element of the title, so the sheet fits the document outline. Default h3.
  titleAs?: HeadingTag;
  description?: React.ReactNode;
}

// Content slot section: label, helper text and a field area. Sections are separated by a hairline.
const SheetSection = React.forwardRef<HTMLElement, SheetSectionProps>(
  ({ className, title, titleAs: Title = 'h3', description, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('flex flex-col gap-2 border-0 border-b border-solid border-hairline px-5 py-4 last:border-b-0', className)}
      {...props}
    >
      {title && <Title className="typography-ui-medium m-0 text-text-default">{title}</Title>}
      {description && <p className="typography-ui m-0 text-text-subtle-on-muted">{description}</p>}
      {children}
    </section>
  ),
);
SheetSection.displayName = 'SheetSection';

const sheetBannerVariants = cva('flex items-start gap-2 border-0 border-solid px-5 py-3 typography-ui text-text-default', {
  variants: {
    tone: {
      default: 'bg-muted',
      neutral: 'bg-muted',
      primary: 'bg-background-brand-subtle',
      info: 'bg-background-info-subtle',
      success: 'bg-background-success-subtle',
      warning: 'bg-background-warning-subtle',
      error: 'bg-background-destructive-subtle',
    },
    position: {
      top: 'border-b border-hairline',
      bottom: 'border-t border-hairline',
    },
  },
  defaultVariants: { tone: 'default', position: 'top' },
});

const sheetBannerIconTone: Record<NonNullable<VariantProps<typeof sheetBannerVariants>['tone']>, string> = {
  default: 'text-icon-default',
  neutral: 'text-icon-default',
  primary: 'text-icon-default',
  info: 'text-icon-default',
  success: 'text-icon-default',
  warning: 'text-icon-default',
  error: 'text-icon-destructive',
};

interface SheetBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof sheetBannerVariants> {
  // Optional leading icon, decorative.
  icon?: React.ReactNode;
}

// Banner strip inside a sheet (Figma Slide out menu Banner). Place it first in the content for `top` and last for `bottom`.
const SheetBanner = React.forwardRef<HTMLDivElement, SheetBannerProps>(
  ({ className, tone, position, icon, role, children, ...props }, ref) => {
    const resolvedTone = tone ?? 'default';
    return (
      <div
        ref={ref}
        role={role ?? (resolvedTone === 'error' || resolvedTone === 'warning' ? 'alert' : 'status')}
        data-tone={resolvedTone}
        data-position={position ?? 'top'}
        className={cn(sheetBannerVariants({ tone, position }), className)}
        {...props}
      >
        {icon && (
          <span aria-hidden className={cn('flex shrink-0 [&>svg]:h-icon-md [&>svg]:w-icon-md', sheetBannerIconTone[resolvedTone])}>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  },
);
SheetBanner.displayName = 'SheetBanner';

type SheetCodeBlockProps = Omit<CodeSnippetProps, 'variant'>;

// Code block row of the sheet (Figma Sheet block Code block): label on the left, copy action on the right.
const SheetCodeBlock = React.forwardRef<HTMLDivElement, SheetCodeBlockProps>(
  ({ className, label, lineNumbers = false, ...props }, ref) => {
    const l = useLabels();
    return (
      <CodeSnippet
        ref={ref}
        variant="block"
        label={label ?? l.code}
        lineNumbers={lineNumbers}
        className={cn('mx-5 my-4 w-auto', className)}
        {...props}
      />
    );
  },
);
SheetCodeBlock.displayName = 'SheetCodeBlock';

export {
  SheetBanner,
  SheetCodeBlock,
  type SheetBannerProps,
  type SheetCodeBlockProps,
  SheetBody,
  SheetMeta,
  SheetPath,
  SheetSection,
  type SheetBodyProps,
  type SheetContentProps,
  type SheetFooterProps,
  type SheetInset,
  type SheetHeaderProps,
  type SheetMode,
  type SheetSectionProps,
  type SheetSize,
  type SheetState,
  type SheetTitleProps,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
