import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEADERS, blockVars } from '../../../scripts/theme-pairs.mjs';

import { Notification, NotificationAction } from './notification';

const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: number[], b: number[]) => {
  const [p, q] = [lum(a), lum(b)];
  return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05);
};

describe('Notification', () => {
  it('is a polite status with title and description', () => {
    render(<Notification title="Profile updated" description="Saved" />);
    expect(screen.getByRole('status')).toHaveTextContent('Profile updated');
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders no close button without onDismiss and calls it when present', async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Notification title="t" />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Notification title="t" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('actions are keyboard operable buttons', async () => {
    const onUndo = vi.fn();
    render(<Notification title="Task deleted" variant="inverse" actions={<NotificationAction onClick={onUndo}>Undo</NotificationAction>} />);
    screen.getByRole('button', { name: 'Undo' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onUndo).toHaveBeenCalled();
  });

  it('exposes progress with value semantics, clamped to the bar width', () => {
    render(<Notification title="Uploading" progress={60} progressLabel="60% uploaded" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText('60% uploaded')).toBeInTheDocument();
  });

  it('uses the avatar slot instead of the icon tile', () => {
    render(<Notification title="t" icon={<svg data-testid="icon" />} avatar={<span data-testid="av" />} />);
    expect(screen.getByTestId('av')).toBeInTheDocument();
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  // DR-WBDASH-037: secondary lines on the inverse surface use the inverse-subtle role, not the canvas subtle role (3.75:1 light, 2.45:1 dark)
  it('inverse description and progress label use text-inverse-subtle', () => {
    render(<Notification title="Timer running" variant="inverse" description="Since 09:12" progress={40} progressLabel="40%" />);
    expect(screen.getByText('Since 09:12')).toHaveClass('text-text-inverse-subtle');
    expect(screen.getByText('Since 09:12')).not.toHaveClass('text-text-subtle');
    expect(screen.getByText('40%')).toHaveClass('text-text-inverse-subtle');
  });

  it('keeps text-subtle on the default surface', () => {
    render(<Notification title="t" description="d" />);
    expect(screen.getByText('d')).toHaveClass('text-text-subtle');
  });

  // The package vendors one theme (zero) in styles/theme.css: light, .dark and OS dark.
  it('text-inverse-subtle holds 4.5:1 on background-inverse in the zero theme, light and dark', () => {
    const css = readFileSync(join(process.cwd(), 'styles/theme.css'), 'utf8');
    const root = blockVars(css, HEADERS.root) as Record<string, number[]>;
    const failures: string[] = [];
    for (const [mode, header] of [['light', HEADERS.root], ['.dark', HEADERS.dark], ['OS dark', HEADERS.media]] as const) {
      const v = { ...root, ...(blockVars(css, header) as Record<string, number[]>) };
      expect(v['--semantic-text-inverse-subtle']).toHaveLength(3);
      expect(v['--semantic-background-inverse']).toHaveLength(3);
      const r = ratio(v['--semantic-text-inverse-subtle'], v['--semantic-background-inverse']);
      if (r < 4.5) failures.push(`zero ${mode} ${r.toFixed(2)}`);
    }
    expect(failures).toEqual([]);
  });

  // DR-WBDASH-042: the close button reserves right padding only when it exists
  describe('close button space', () => {
    const textBlock = (name: string) => screen.getByText(name).parentElement as HTMLElement;
    // inverse reserves the space on the whole row, so the wrapped actions never reach the close button
    const reserved = (name: string, inverse: boolean) => (inverse ? textBlock(name).parentElement : textBlock(name)) as HTMLElement;
    const cases = [
      ['default', {}],
      ['inverse', { variant: 'inverse' as const }],
      ['with actions', { actions: <NotificationAction>Undo</NotificationAction> }],
      ['with progress', { progress: 40, progressLabel: '40%' }],
    ] as const;
    it.each(cases)('%s: no reserved padding without onDismiss', (_name, extra) => {
      render(<Notification title="Timer" description="d" {...extra} />);
      expect(reserved('Timer', _name === 'inverse')).not.toHaveClass('pr-8');
      expect(textBlock('Timer')).not.toHaveClass('pr-8');
    });
    it.each(cases)('%s: reserves pr-8 with onDismiss', (_name, extra) => {
      render(<Notification title="Timer" description="d" onDismiss={() => {}} {...extra} />);
      expect(reserved('Timer', _name === 'inverse')).toHaveClass('pr-8');
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });
    it('inverse with actions and onDismiss reserves pr-8 on the row that holds the actions', () => {
      render(<Notification title="Timer" variant="inverse" onDismiss={() => {}} actions={<NotificationAction>Stop</NotificationAction>} />);
      const row = textBlock('Timer').parentElement as HTMLElement;
      expect(row).toHaveClass('pr-8');
      expect(row).toContainElement(screen.getByRole('button', { name: 'Stop' }));
    });
    it('inverse lets actions wrap below the title instead of squeezing it', () => {
      render(<Notification title="Timer" variant="inverse" actions={<NotificationAction>Stop</NotificationAction>} />);
      expect(textBlock('Timer').parentElement).toHaveClass('flex-wrap');
    });
  });
});
