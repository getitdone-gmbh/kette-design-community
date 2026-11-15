import { render, screen } from '@testing-library/react';

import { VerifiedTick, verifiedTickSizes, verifiedTickTones } from './verified-tick';

describe('VerifiedTick', () => {
  it('is an image named Verified, 16px by default, info coloured', () => {
    render(<VerifiedTick />);
    const tick = screen.getByRole('img', { name: 'Verified' });
    expect(tick).toHaveAttribute('width', '16');
    expect(tick).toHaveClass('text-general-info-default');
  });

  it.each(Object.entries(verifiedTickSizes))('size %s is %spx', (size, px) => {
    render(<VerifiedTick size={size as keyof typeof verifiedTickSizes} />);
    expect(screen.getByRole('img')).toHaveAttribute('height', String(px));
  });

  it('can be hidden when the label is empty', () => {
    const { container } = render(<VerifiedTick label="" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the info colours for the default tone and takes brand colours with tone="brand"', () => {
    const { container, rerender } = render(<VerifiedTick />);
    expect(container.querySelector('g')).toHaveClass('text-general-info-on');
    rerender(<VerifiedTick tone="brand" />);
    expect(screen.getByRole('img')).toHaveClass('text-background-brand-bold-default');
    expect(container.querySelector('g')).toHaveClass('text-text-on-brand');
  });

  it.each(Object.keys(verifiedTickTones))('tone %s sets a fill and a check colour', (tone) => {
    const { container } = render(<VerifiedTick tone={tone as keyof typeof verifiedTickTones} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-tone', tone);
    expect(container.querySelector('g')?.getAttribute('class')).toMatch(/^text-/);
  });
});
