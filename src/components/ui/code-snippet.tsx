'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Copy } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { codeTokenClasses, tokenizeCode, type CodeLanguage } from './code-highlight';
import { useLabels } from './labels-context';

// Figma "Code snippet": Type Block (multi line, line numbers) | Inline (one line + copy), Color Primary | Gray, Theme Light | Dark.
const snippetVariants = cva('relative flex rounded-surface border border-solid', {
  variants: {
    tone: {
      default: 'border-border-default bg-muted text-foreground',
      inverse: 'border-transparent bg-foreground text-background',
    },
  },
  defaultVariants: { tone: 'default' },
});

// One row of the terminal variant. `cmd` is a typed command, `meta` a quiet note, `agent` a name with a status column and an optional note, `route` an indented hand-over line.
export type CodeSnippetTerminalLine =
  | { type: 'cmd'; text: React.ReactNode }
  | { type: 'meta'; text: React.ReactNode }
  | { type: 'agent'; name: React.ReactNode; status: React.ReactNode; note?: React.ReactNode; tone?: 'muted' | 'success' | 'warning' }
  | { type: 'route'; text: React.ReactNode };

export interface CodeSnippetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof snippetVariants> {
  // Source text for `block` and `inline`. The `terminal` variant renders `lines` instead.
  code?: string;
  // `block` shows every line with an optional gutter; `inline` is a single line with the copy button. `terminal` is an illustrated terminal window with structured rows (see `lines`).
  variant?: 'block' | 'inline' | 'terminal';
  // Terminal only. The rows of the window.
  terminalLines?: CodeSnippetTerminalLine[];
  // Terminal only. Title in the title bar, in mono.
  terminalTitle?: React.ReactNode;
  // Terminal only. Slot at the right end of the title bar, for example a Badge.
  terminalAction?: React.ReactNode;
  // Terminal only. Caption under the rows.
  terminalCaption?: React.ReactNode;
  // Terminal only. Sizes the name column of agent rows to its content (up to 24rem) and aligns the status column across rows. Default is a fixed 160px name column.
  terminalWide?: boolean;
  // Terminal only. Rows fade in once, one after the other (90 ms apart). Default on, skipped for reduced motion.
  terminalAnimate?: boolean;
  // Accessible name of the code region, for example "TypeScript example". Defaults to "Code".
  language?: string;
  lineNumbers?: boolean;
  // Hides the copy button.
  copy?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  onCopied?: (code: string) => void;
  // Opt-in syntax highlighting for the given language. Omit for plain code.
  highlight?: CodeLanguage;
  // Block only. Shows a header row with this label on the left and the copy button on the right (Figma Sheet block Code block).
  label?: React.ReactNode;
  // Block only. `block` uses the code block type role (12/19, Figma Code block). `compact` keeps the earlier smaller code size.
  textSize?: 'block' | 'compact';
  // Block and inline. Long lines break onto the next line (also inside a long word or URL) instead of scrolling sideways. Then nothing scrolls, so the code area is not a tab stop. Whitespace and line breaks of the source are kept, line numbers are left out. Default off.
  wrap?: boolean;
}

// The snippet clips its content (overflow-hidden), so the focus ring of the scrollable code area is drawn inside it.
const focusRingInset = ['focus-visible:outline-none', 'focus-visible:ring-focus', 'focus-visible:ring-inset', 'focus-visible:ring-ring-default'];

const terminalTone = {
  muted: 'text-text-subtle',
  success: 'text-text-success',
  warning: 'text-text-warning',
} as const;

interface CodeSnippetTerminalProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  lines: CodeSnippetTerminalLine[];
  title?: React.ReactNode;
  titleSlot?: React.ReactNode;
  caption?: React.ReactNode;
  wide: boolean;
  animate: boolean;
}

// Staggered fade-in per row. Reduced motion shows every row at once (motion-safe only).
const rowMotion = 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-backwards motion-safe:duration-300';
const ROW_STAGGER_MS = 90;

const CodeSnippetTerminal = React.forwardRef<HTMLElement, CodeSnippetTerminalProps>(
  ({ className, lines, title, titleSlot, caption, wide, animate, ...props }, ref) => (
    <figure
      ref={ref}
      data-variant="terminal"
      className={cn('m-0 flex flex-col overflow-hidden rounded-card border border-solid border-border-default bg-background-subtle text-foreground', className)}
      {...props}
    >
      <div className="flex min-h-control-md items-center gap-3 border-0 border-b border-solid border-border-subtle px-4 py-2">
        <span aria-hidden="true" className="flex shrink-0 gap-2">
          <span className="h-2 w-2 rounded-full bg-border-default" />
          <span className="h-2 w-2 rounded-full bg-border-default" />
          <span className="h-2 w-2 rounded-full bg-border-default" />
        </span>
        <span className="typography-code min-w-0 flex-1 truncate text-text-subtle">{title}</span>
        {titleSlot ? <span className="shrink-0">{titleSlot}</span> : null}
      </div>
      <ol className={cn('typography-code m-0 flex list-none flex-col gap-2 p-4', wide && 'sm:grid sm:[grid-template-columns:fit-content(24rem)_auto_minmax(0,1fr)]')}>
        {lines.map((line, index) => {
          const motion = animate ? rowMotion : undefined;
          const style = animate ? { animationDelay: `${index * ROW_STAGGER_MS}ms` } : undefined;
          if (line.type === 'agent') {
            return (
              <li key={index} data-line="agent" style={style} className={cn('flex flex-wrap items-baseline gap-x-4', wide && 'sm:col-span-full sm:grid sm:[grid-template-columns:subgrid]', motion)}>
                <span className={cn('min-w-0 flex-1 text-foreground sm:flex-none', !wide && 'sm:w-40')}>{line.name}</span>
                <span className={cn('text-right sm:text-left', wide ? 'sm:min-w-16' : 'sm:w-16', terminalTone[line.tone ?? 'muted'])}>{line.status}</span>
                {line.note ? <span className="basis-full pl-4 text-text-subtle sm:min-w-0 sm:flex-1 sm:basis-0 sm:pl-0">{line.note}</span> : null}
              </li>
            );
          }
          if (line.type === 'route') {
            return (
              <li key={index} data-line="route" style={style} className={cn('pl-4 text-text-warning', wide && 'sm:col-span-full', motion)}>
                {line.text}
              </li>
            );
          }
          if (line.type === 'meta') {
            return (
              <li key={index} data-line="meta" style={style} className={cn('text-text-subtle', wide && 'sm:col-span-full', motion)}>
                {line.text}
              </li>
            );
          }
          return (
            <li key={index} data-line="cmd" style={style} className={cn('text-foreground', wide && 'sm:col-span-full', motion)}>
              <span aria-hidden="true" className="text-text-subtle">
                {'> '}
              </span>
              {line.text}
            </li>
          );
        })}
      </ol>
      {caption ? <figcaption className="typography-text-extra-small border-0 border-t border-solid border-border-subtle px-4 py-2 text-text-subtle">{caption}</figcaption> : null}
    </figure>
  ),
);
CodeSnippetTerminal.displayName = 'CodeSnippetTerminal';

const CodeSnippet = React.forwardRef<HTMLDivElement, CodeSnippetProps>(
  (
    {
      className,
      code: codeProp,
      variant = 'block',
      terminalLines,
      terminalTitle,
      terminalAction,
      terminalCaption,
      terminalWide = false,
      terminalAnimate = true,
      tone,
      language,
      lineNumbers = true,
      copy = true,
      copyLabel: copyLabelProp,
      copiedLabel: copiedLabelProp,
      onCopied,
      highlight,
      label,
      textSize = 'block',
      wrap = false,
      ...props
    },
    ref,
  ) => {
    const code = codeProp ?? '';
    const l = useLabels();
    const copyLabel = copyLabelProp ?? l.copyCode;
    const copiedLabel = copiedLabelProp ?? l.copied;
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout>>();
    React.useEffect(() => () => clearTimeout(timer.current), []);

    const handleCopy = async () => {
      try {
        await navigator.clipboard?.writeText(code);
      } catch {
        return;
      }
      onCopied?.(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    };

    if (variant === 'terminal') {
      return (
        <CodeSnippetTerminal
          ref={ref as React.Ref<HTMLElement>}
          className={className}
          lines={terminalLines ?? []}
          title={terminalTitle}
          titleSlot={terminalAction}
          caption={terminalCaption}
          wide={terminalWide}
          animate={terminalAnimate}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        />
      );
    }

    const inverse = tone === 'inverse';
    const content = highlight
      ? tokenizeCode(code, highlight).map((token, index) => (
          <span
            key={index}
            data-token={token.type}
            className={codeTokenClasses[inverse ? 'inverse' : 'default'][token.type] || undefined}
          >
            {token.text}
          </span>
        ))
      : code;
    const button = copy ? (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        className={cn(
          'inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-item transition-colors motion-reduce:transition-none',
          inverse
            ? 'text-background hover:bg-background/10'
            : 'text-icon-subtle hover:bg-background hover:text-icon-default',
          focusRingInset,
        )}
      >
        {copied ? (
          <Check aria-hidden="true" className="h-icon-xs w-icon-xs" />
        ) : (
          <Copy aria-hidden="true" className="h-icon-xs w-icon-xs" />
        )}
      </button>
    ) : null;
    const status = (
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    );

    if (variant === 'inline') {
      return (
        <div
          ref={ref}
          data-variant="inline"
          className={cn(snippetVariants({ tone }), 'items-center gap-2 px-3 py-1', className)}
          {...props}
        >
          <code
            className={cn('min-w-0 flex-1 rounded-item typography-code font-normal', wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : ['overflow-x-auto whitespace-nowrap', focusRingInset])}
            // A scrolling code line is a keyboard stop (WCAG 2.1.1); a wrapping one scrolls nothing and is not.
            tabIndex={wrap ? undefined : 0}
            role={wrap ? 'group' : undefined}
            aria-label={language ?? l.code}
          >
            {content}
          </code>
          {button}
          {status}
        </div>
      );
    }

    const lines = code.split('\n');
    const typeRole = textSize === 'compact' ? 'typography-code' : 'typography-code-block';
    const hasHeader = label !== undefined && label !== null && label !== false;
    // Wrapped lines no longer line up with a separate number column, so `wrap` leaves the line numbers out.
    const gutter = lineNumbers && !wrap ? (
      <pre
        aria-hidden="true"
        data-gutter=""
        className={cn(
          'select-none border-0 border-r border-solid px-3 py-4 text-right font-normal tabular-nums',
          typeRole,
          inverse
            ? 'border-background/20 text-text-inverse-subtle'
            : 'border-border-default bg-background-neutral-subtle text-text-subtle-on-muted',
        )}
      >
        {lines.map((_, index) => index + 1).join('\n')}
      </pre>
    ) : null;
    const codeArea = (
      <pre
        // A scrolling code area is a keyboard stop (WCAG 2.1.1); a wrapping one scrolls nothing and is not.
        tabIndex={wrap ? undefined : 0}
        role={wrap ? 'group' : undefined}
        aria-label={language ?? l.code}
        className={cn(
          'min-w-0 flex-1 py-4 pl-4 font-normal',
          wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : ['overflow-x-auto', focusRingInset],
          typeRole,
          hasHeader ? 'pr-4' : 'pr-12',
        )}
      >
        <code>{content}</code>
      </pre>
    );

    if (hasHeader) {
      return (
        <div
          ref={ref}
          data-variant="block"
          data-header=""
          className={cn(snippetVariants({ tone }), 'flex-col overflow-hidden', className)}
          {...props}
        >
          <div
            className={cn(
              'flex h-control-md items-center gap-2 border-0 border-b border-solid pl-4 pr-2',
              inverse ? 'border-background/20' : 'border-border-default',
            )}
          >
            <span
              data-code-label=""
              className={cn('typography-text-extra-small min-w-0 flex-1 truncate', inverse ? 'text-text-inverse-subtle' : 'text-text-subtle-on-muted')}
            >
              {label}
            </span>
            {button}
          </div>
          <div className="flex min-w-0 items-stretch">
            {gutter}
            {codeArea}
          </div>
          {status}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-variant="block"
        className={cn(snippetVariants({ tone }), 'items-stretch overflow-hidden', className)}
        {...props}
      >
        {gutter}
        {codeArea}
        {button ? <div className="absolute right-2 top-2">{button}</div> : null}
        {status}
      </div>
    );
  },
);
CodeSnippet.displayName = 'CodeSnippet';

export { CodeSnippet, snippetVariants };
