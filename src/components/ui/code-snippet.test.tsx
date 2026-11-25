import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CodeSnippet } from './code-snippet';

const code = "import a from 'a';\nconst b = 1;";

describe('CodeSnippet terminal wide', () => {
  const lines = [{ type: 'agent' as const, name: 'a-very-long-agent-name-that-wraps', status: 'ok', note: 'done' }];

  it('sizes the name column to its content instead of a fixed width', () => {
    const { container } = render(<CodeSnippet variant="terminal" terminalLines={lines} terminalWide />);
    expect(container.querySelector('ol')?.className).toContain('fit-content(24rem)');
    const name = screen.getByText('a-very-long-agent-name-that-wraps');
    expect(name.className).not.toContain('sm:w-');
  });

  it('keeps the fixed 160px name column without terminalWide', () => {
    render(<CodeSnippet variant="terminal" terminalLines={lines} />);
    expect(screen.getByText('a-very-long-agent-name-that-wraps')).toHaveClass('sm:w-40');
  });
});

describe('CodeSnippet', () => {
  it('block renders every line with a line number gutter', () => {
    const { container } = render(<CodeSnippet code={code} language="TypeScript" />);
    expect(screen.getByLabelText('TypeScript')).toHaveTextContent("import a from 'a';");
    expect(container.querySelector('[data-gutter]')).toHaveTextContent('1 2');
    expect(container.firstChild).toHaveAttribute('data-variant', 'block');
  });

  it('hides the gutter on request', () => {
    const { container } = render(<CodeSnippet code={code} lineNumbers={false} />);
    expect(container.querySelector('[data-gutter]')).toBeNull();
  });

  it('inline renders one line with the copy button', () => {
    const { container } = render(<CodeSnippet variant="inline" code="npm i pkg" />);
    expect(container.firstChild).toHaveAttribute('data-variant', 'inline');
    expect(screen.getByText('npm i pkg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
  });

  it('copies the code, announces it and resets the label', async () => {
    const user = userEvent.setup();
    const onCopied = vi.fn();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CodeSnippet variant="inline" code="npm i pkg" onCopied={onCopied} />);
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('npm i pkg');
    expect(onCopied).toHaveBeenCalledWith('npm i pkg');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('can hide the copy button and use the inverse tone', () => {
    const { container } = render(<CodeSnippet code={code} copy={false} tone="inverse" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-foreground', 'text-background');
  });

  it('the code region is keyboard focusable for scrolling', async () => {
    const user = userEvent.setup();
    render(<CodeSnippet code={code} copy={false} />);
    await user.tab();
    expect(screen.getByLabelText('Code')).toHaveFocus();
  });
});

describe('CodeSnippet block type role and header', () => {
  it('uses the code block type role by default and keeps the compact size on request', () => {
    const { rerender } = render(<CodeSnippet code={code} language="TS" />);
    expect(screen.getByLabelText('TS')).toHaveClass('typography-code-block');
    rerender(<CodeSnippet code={code} language="TS" textSize="compact" />);
    expect(screen.getByLabelText('TS')).toHaveClass('typography-code');
    expect(screen.getByLabelText('TS')).not.toHaveClass('typography-code-block');
  });

  it('inline keeps the compact code type role', () => {
    render(<CodeSnippet variant="inline" code="x" language="sh" />);
    expect(screen.getByLabelText('sh')).toHaveClass('typography-code');
  });

  it('label adds a header row with the copy button and no floating button', () => {
    const { container } = render(<CodeSnippet code={code} label="Terminal" />);
    expect(container.firstChild).toHaveAttribute('data-header');
    expect(container.querySelector('[data-code-label]')).toHaveTextContent('Terminal');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(container.querySelector('.absolute')).toBeNull();
  });

  it('without a label the layout is unchanged', () => {
    const { container } = render(<CodeSnippet code={code} />);
    expect(container.firstChild).not.toHaveAttribute('data-header');
    expect(container.querySelector('.absolute')).not.toBeNull();
  });

  it('terminal renders title, rows with status tone and caption as a figure', () => {
    const { container } = render(
      <CodeSnippet
        variant="terminal"
        terminalTitle="loop"
        terminalCaption="Illustration"
        terminalAnimate={false}
        terminalLines={[
          { type: 'cmd', text: 'run' },
          { type: 'agent', name: 'qa', status: 'PASS', tone: 'success', note: 'ok' },
          { type: 'route', text: 'routed' },
        ]}
      />,
    );
    const figure = container.querySelector('figure');
    expect(figure).toHaveAttribute('data-variant', 'terminal');
    expect(screen.getByText('loop')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('PASS')).toHaveClass('text-text-success');
    expect(screen.getByText('Illustration').tagName).toBe('FIGCAPTION');
  });
});

describe('CodeSnippet wrap', () => {
  const long = 'curl -fsSL https://example.test/install | sh && example login VERY-LONG-LICENCE-KEY-WITHOUT-ANY-SPACES-1234567890';

  it('block breaks long lines and is no keyboard stop', () => {
    render(<CodeSnippet code={long} wrap language="Install" />);
    const area = screen.getByLabelText('Install');
    expect(area).toHaveClass('whitespace-pre-wrap', '[overflow-wrap:anywhere]');
    expect(area).not.toHaveClass('overflow-x-auto');
    expect(area).not.toHaveAttribute('tabindex');
    expect(area).toHaveAttribute('role', 'group');
  });

  it('keeps the scroll area and its tab stop without wrap', () => {
    render(<CodeSnippet code={long} language="Install" />);
    const area = screen.getByLabelText('Install');
    expect(area).toHaveClass('overflow-x-auto');
    expect(area).toHaveAttribute('tabindex', '0');
    expect(area).not.toHaveAttribute('role');
  });

  it('leaves the line numbers out of a wrapping block', () => {
    const { container } = render(<CodeSnippet code={'a\nb'} wrap />);
    expect(container.querySelector('[data-gutter]')).toBeNull();
  });

  it('inline wraps too and drops the tab stop and the ring', () => {
    render(<CodeSnippet variant="inline" code={long} wrap language="Install" />);
    const line = screen.getByLabelText('Install');
    expect(line).toHaveClass('whitespace-pre-wrap');
    expect(line).not.toHaveClass('whitespace-nowrap');
    expect(line).not.toHaveAttribute('tabindex');
  });

  it('wraps with a header and keeps the copy button as the only tab stop', async () => {
    const user = userEvent.setup();
    render(<CodeSnippet code={long} wrap label="Terminal" />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy code' })).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });
});
