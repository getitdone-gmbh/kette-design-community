import { screen } from '@testing-library/react';
import { render } from '../../../lib/render-default-look';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { Step, Stepper } from './index';
import { useStepper } from './use-stepper';

const steps = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }];

beforeAll(() => {
  window.matchMedia ??= vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

const renderStepper = (theme?: 'light' | 'mid' | 'dark') =>
  render(
    <Stepper initialStep={1} steps={steps} theme={theme} orientation="vertical" responsive={false}>
      {steps.map((step) => (
        <Step key={step.label} {...step} />
      ))}
    </Stepper>,
  );

describe('Stepper theme', () => {
  it('default look has no theme marker or theme classes', () => {
    const { container } = renderStepper();
    const indicators = container.querySelectorAll('.stepper__step-button-container');
    expect(indicators.length).toBe(3);
    indicators.forEach((indicator) => {
      expect(indicator).not.toHaveAttribute('data-theme');
      expect(indicator.className).not.toMatch(/data-\[active=true\]:border-transparent/);
    });
  });

  it.each(['light', 'mid', 'dark'] as const)('%s marks every indicator with the theme', (theme) => {
    const { container } = renderStepper(theme);
    container.querySelectorAll('.stepper__step-button-container').forEach((indicator) => {
      expect(indicator).toHaveAttribute('data-theme', theme);
    });
  });

  it('light drops the circle, mid keeps an outline, dark fills the current step', () => {
    const light = renderStepper('light').container.querySelector('.stepper__step-button-container');
    expect(light).toHaveClass('border-transparent', 'bg-transparent');
    const mid = renderStepper('mid').container.querySelector('.stepper__step-button-container');
    expect(mid).toHaveClass('bg-transparent');
    expect(mid?.className).not.toContain('data-[current=true]:border-transparent');
    const dark = renderStepper('dark').container.querySelector('.stepper__step-button-container');
    expect(dark?.className).toContain('data-[current=true]:bg-primary');
  });
});

describe('Stepper iconSize', () => {
  const classesOf = (iconSize?: 'default' | 'figma', size: 'sm' | 'md' | 'lg' = 'md') => {
    const { container } = render(
      <Stepper initialStep={1} steps={steps} size={size} iconSize={iconSize} orientation="vertical" responsive={false}>
        {steps.map((step) => (
          <Step key={step.label} {...step} />
        ))}
      </Stepper>,
    );
    return Array.from(container.querySelectorAll('.stepper__step-button-container *, .stepper__vertical-step-content'))
      .map((el) => el.getAttribute('class') ?? '')
      .join('|');
  };

  it('default keeps the legacy classes exactly (size-4, text-md, min-h-4)', () => {
    const output = classesOf();
    expect(output).toContain('size-4');
    expect(output).toContain('text-md');
    expect(output).toContain('min-h-4');
    expect(output).not.toContain('h-icon');
    expect(classesOf('default')).toBe(output);
  });

  it('figma swaps them for compiling icon-size and type-role classes', () => {
    const output = classesOf('figma');
    expect(output).toContain('h-icon-sm w-icon-sm');
    expect(output).toContain('typography-ui-medium');
    expect(output).not.toMatch(/\bsize-4\b|\btext-md\b|\bmin-h-4\b/);
    expect(output).toContain('pb-4');
  });

  it('figma uses the 20px icon for the large size', () => {
    expect(classesOf('figma', 'lg')).toContain('h-icon-md w-icon-md');
    expect(classesOf(undefined, 'lg')).toContain('size-5');
  });
});

const Next = () => {
  const { nextStep, activeStep } = useStepper();
  return (
    <button type="button" onClick={nextStep}>
      next {activeStep}
    </button>
  );
};

describe('Stepper controlled mode', () => {
  it('shows the given active step and only asks the parent to move', async () => {
    const onStepChange = vi.fn();
    const { container, rerender } = render(
      <Stepper initialStep={0} activeStep={1} onStepChange={onStepChange} steps={steps} orientation="vertical" responsive={false}>
        {steps.map((step) => (
          <Step key={step.label} {...step} />
        ))}
        <Next />
      </Stepper>,
    );
    expect(screen.getByRole('button', { name: 'next 1' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'next 1' }));
    expect(onStepChange).toHaveBeenCalledWith(2);
    // The parent did not accept the change, so nothing moved.
    expect(screen.getByRole('button', { name: 'next 1' })).toBeInTheDocument();
    rerender(
      <Stepper initialStep={0} activeStep={2} onStepChange={onStepChange} steps={steps} orientation="vertical" responsive={false}>
        {steps.map((step) => (
          <Step key={step.label} {...step} />
        ))}
        <Next />
      </Stepper>,
    );
    expect(screen.getByRole('button', { name: 'next 2' })).toBeInTheDocument();
    expect(container.querySelectorAll('.stepper__step-button-container').length).toBe(3);
  });

  it('stays uncontrolled without activeStep and reports changes', async () => {
    const onStepChange = vi.fn();
    render(
      <Stepper initialStep={0} onStepChange={onStepChange} steps={steps} orientation="vertical" responsive={false}>
        {steps.map((step) => (
          <Step key={step.label} {...step} />
        ))}
        <Next />
      </Stepper>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'next 0' }));
    expect(screen.getByRole('button', { name: 'next 1' })).toBeInTheDocument();
    expect(onStepChange).toHaveBeenCalledWith(1);
  });
});

describe('Stepper without matchMedia', () => {
  it('renders when window.matchMedia is missing', () => {
    const original = window.matchMedia;
    // @ts-expect-error simulate an environment without matchMedia
    delete window.matchMedia;
    try {
      render(
        <Stepper initialStep={0} steps={steps}>
          {steps.map((step) => (
            <Step key={step.label} {...step} />
          ))}
        </Stepper>,
      );
      expect(screen.getByText('Two')).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });
});

describe('Numbered five steps', () => {
  const five = ['Source', 'Target', 'Scope', 'Review', 'Run'].map((label) => ({ label }));

  it('shows a check for steps before the current one and numbers for the rest', () => {
    const { container } = render(
      <Stepper initialStep={3} steps={five} iconSize="figma" size="sm" responsive={false}>
        {five.map((step) => (
          <Step key={step.label} {...step} />
        ))}
      </Stepper>,
    );
    const markers = container.querySelectorAll('.stepper__step-button-container');
    expect(markers).toHaveLength(5);
    expect(container.querySelectorAll('svg')).toHaveLength(3);
    expect(markers[3]).toHaveAttribute('aria-current', 'step');
    expect(markers[3]).toHaveTextContent('4');
    expect(markers[4]).toHaveTextContent('5');
  });

  it('marks a step with state error as invalid', () => {
    const { container } = render(
      <Stepper initialStep={3} steps={five} iconSize="figma" size="sm" responsive={false}>
        {five.map((step, index) => (
          <Step key={step.label} {...step} state={index === 3 ? 'error' : undefined} />
        ))}
      </Stepper>,
    );
    expect(container.querySelectorAll('.stepper__step-button-container')[3]).toHaveAttribute('data-invalid', 'true');
  });
});

describe('Stepper upcoming label', () => {
  it('uses the subtle text role at full opacity instead of an opacity on the label', () => {
    const { container } = renderStepper();
    const labels = container.querySelectorAll<HTMLElement>('.stepper__step-label-container');
    expect(labels.length).toBe(3);
    labels.forEach((label) => expect(label.style.opacity).toBe(''));
    expect(labels[0]).not.toHaveClass('text-text-subtle');
    expect(labels[1]).not.toHaveClass('text-text-subtle');
    expect(labels[2]).toHaveClass('text-text-subtle');
  });
});
