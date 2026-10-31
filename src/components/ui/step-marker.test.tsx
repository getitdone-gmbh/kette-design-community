import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { DesignSystemProvider } from './design-system-provider';
import { StepMarker } from './step-marker';

describe('StepMarker', () => {
  it('shows the number for upcoming and marks the current step', () => {
    render(
      <>
        <StepMarker step={3} data-testid="up" />
        <StepMarker step={2} state="current" data-testid="cur" />
      </>,
    );
    expect(screen.getByTestId('up')).toHaveTextContent('3');
    expect(screen.getByTestId('up')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('cur')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByTestId('cur')).toHaveClass('bg-background-brand-bold-default', 'text-text-on-brand', 'rounded-full');
  });

  it('complete and error swap the number for an icon and keep a text alternative', () => {
    render(
      <>
        <StepMarker step={1} state="complete" data-testid="done" />
        <StepMarker step={2} state="error" data-testid="bad" />
      </>,
    );
    expect(screen.getByTestId('done').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('done')).toHaveTextContent('1, Completed');
    expect(screen.getByTestId('bad')).toHaveTextContent('2, Failed');
    expect(screen.getByTestId('bad')).toHaveClass('bg-general-error-default', 'text-general-error-on');
  });

  it('labels: prop wins, then the provider, then English', () => {
    render(
      <>
        <DesignSystemProvider locale="de">
          <StepMarker step={1} state="complete" data-testid="de" />
        </DesignSystemProvider>
        <StepMarker step={1} state="complete" completedLabel="Done" data-testid="prop" />
      </>,
    );
    expect(screen.getByTestId('de')).toHaveTextContent('1, Abgeschlossen');
    expect(screen.getByTestId('prop')).toHaveTextContent('1, Done');
  });

  it('uses token sizes', () => {
    render(<StepMarker step={1} size="lg" data-testid="m" />);
    expect(screen.getByTestId('m')).toHaveClass('h-avatar-sm', 'w-avatar-sm');
  });
});
