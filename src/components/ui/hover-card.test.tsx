import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

describe('HoverCard', () => {
  it('has no backdrop by default', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>Trigger</HoverCardTrigger>
        <HoverCardContent>Body</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(document.querySelector('[data-hover-card-backdrop]')).toBeNull();
  });

  it('renders a hidden, pointer-transparent scrim behind the card with backdrop', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>Trigger</HoverCardTrigger>
        <HoverCardContent backdrop>Body</HoverCardContent>
      </HoverCard>,
    );
    const scrim = document.querySelector('[data-hover-card-backdrop]') as HTMLElement;
    expect(scrim).toHaveAttribute('aria-hidden', 'true');
    expect(scrim).toHaveClass('pointer-events-none', 'bg-overlay');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('removes the scrim when closed', () => {
    render(
      <HoverCard open={false}>
        <HoverCardTrigger>Trigger</HoverCardTrigger>
        <HoverCardContent backdrop>Body</HoverCardContent>
      </HoverCard>,
    );
    expect(document.querySelector('[data-hover-card-backdrop]')).toBeNull();
  });
});
