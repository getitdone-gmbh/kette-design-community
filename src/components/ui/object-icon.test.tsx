import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { ObjectIcon } from './object-icon';

describe('ObjectIcon', () => {
  it('defaults to the record tile at small size and is decorative', () => {
    const { container } = render(<ObjectIcon data-testid="i" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveClass('bg-product-record-default', 'h-icon-md', 'rounded-tight');
  });

  it.each(['workstream', 'backoffice', 'coldcall', 'vacancy', 'jobsearch', 'record', 'contextual'] as const)('renders app %s', (app) => {
    const { container } = render(<ObjectIcon app={app} />);
    expect((container.firstChild as HTMLElement).className).toMatch(app === 'contextual' ? /bg-product-accent-default/ : new RegExp(`bg-product-${app}-default`));
  });

  it('supports sizes and exposes a label as image', () => {
    render(<ObjectIcon size="lg" label="Vacancy" app="vacancy" />);
    expect(screen.getByRole('img', { name: 'Vacancy' })).toHaveClass('h-avatar-sm');
  });
});

describe('ObjectIcon semantic tones', () => {
  it.each([
    ['neutral', 'bg-background-neutral-default'],
    ['info', 'bg-general-info-container'],
    ['success', 'bg-general-success-container'],
    ['warning', 'bg-general-warning-container'],
    ['destructive', 'bg-general-error-container'],
  ] as const)('%s uses its token fill and drops the product fill', (tone, cls) => {
    const { container } = render(<ObjectIcon tone={tone} label={tone} />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass(cls);
    expect(el.className).not.toMatch(/bg-product-/);
    expect(el).toHaveAttribute('data-tone', tone);
    expect(el).not.toHaveAttribute('data-app');
    expect(el).toHaveAttribute('role', 'img');
  });

  it('keeps the product look without a tone', () => {
    const { container } = render(<ObjectIcon app="vacancy" />);
    expect((container.firstChild as HTMLElement).className).toContain('bg-product-vacancy-default');
  });
});
