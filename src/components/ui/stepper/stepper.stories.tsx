import type { Meta, StoryObj } from '@storybook/react';

import { FC, useState } from 'react';
import { Button } from '../button';
import { Step, StepItem, Stepper, useStepper } from './index';

const meta = {
  id: 'primitives-stepper',
  title: 'Primitives · Display/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }] satisfies StepItem[];

const StepperDemo: FC = () => {
  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper initialStep={0} steps={steps}>
        {steps.map((stepProps, index) => {
          return (
            <Step key={stepProps.label} {...stepProps}>
              <div className="h-40 flex items-center justify-center my-2 border border-solid bg-secondary text-primary rounded-default">
                <h1 className="text-xl text-foreground">Step {index + 1}</h1>
              </div>
            </Step>
          );
        })}
        <Footer />
      </Stepper>
    </div>
  );
};

const Footer = () => {
  const { nextStep, prevStep, resetSteps, hasCompletedAllSteps, isLastStep, isOptionalStep, isDisabledStep } =
    useStepper();
  return (
    <>
      {hasCompletedAllSteps && (
        <div className="h-40 flex items-center justify-center my-2 border border-solid bg-secondary text-primary rounded-default">
          <h1 className="text-xl text-foreground">All steps completed</h1>
        </div>
      )}
      <div className="w-full flex justify-end gap-2">
        {hasCompletedAllSteps ? (
          <Button size="sm" onClick={resetSteps}>
            Reset
          </Button>
        ) : (
          <>
            <Button disabled={isDisabledStep} onClick={prevStep} size="sm" variant="secondary">
              Prev
            </Button>
            <Button size="sm" onClick={nextStep}>
              {isLastStep ? 'Finish' : isOptionalStep ? 'Skip' : 'Next'}
            </Button>
          </>
        )}
      </div>
    </>
  );
};

const Component = (args) => (
  <div style={{ maxWidth: 500, margin: '0 auto' }}>
    <StepperDemo />
  </div>
);

const defaultArgs = {};

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args) => Component(args),
};

export const Themes: Story = {
  args: {} as any,
  render: () => (
    <div className="flex flex-col gap-8">
      {(['light', 'mid', 'dark'] as const).map((theme) => (
        <Stepper key={theme} initialStep={1} steps={steps} theme={theme} orientation="vertical" responsive={false}>
          {steps.map((stepProps) => (
            <Step key={stepProps.label} {...stepProps} />
          ))}
        </Stepper>
      ))}
    </div>
  ),
};

// `iconSize="figma"` is opt in: the default classes `size-4` and `text-md` are not in the token preset, so default icons and step numbers have no explicit size.
export const FigmaIconSize: Story = {
  args: {} as any,
  render: () => (
    <Stepper initialStep={1} steps={steps} iconSize="figma" orientation="vertical" responsive={false}>
      {steps.map((stepProps) => (
        <Step key={stepProps.label} {...stepProps} />
      ))}
    </Stepper>
  ),
};

const ControlledDemo: FC = () => {
  const [active, setActive] = useState(1);
  return (
    <div className="flex flex-col gap-4">
      <Stepper initialStep={0} activeStep={active} onStepChange={setActive} steps={steps} orientation="vertical" responsive={false}>
        {steps.map((stepProps) => (
          <Step key={stepProps.label} {...stepProps} />
        ))}
      </Stepper>
      <Button type="button" onClick={() => setActive((v) => Math.min(v + 1, steps.length))}>
        Next (owned by the parent)
      </Button>
    </div>
  );
};

export const Controlled: Story = {
  args: {} as any,
  render: () => <ControlledDemo />,
};

const fiveSteps = [{ label: 'Source account' }, { label: 'Target account' }, { label: 'Scope' }, { label: 'Review' }, { label: 'Run' }] satisfies StepItem[];

// Figma Progress text with line Style=Number and Sheet block Stepper: numbered circles, check on done steps, per-step state (here the current step failed).
export const NumberedFiveSteps: Story = {
  args: {} as any,
  render: () => (
    <div className="flex w-[720px] max-w-full flex-col gap-8">
      <Stepper initialStep={3} steps={fiveSteps} iconSize="figma" size="sm" responsive={false}>
        {fiveSteps.map((stepProps) => (
          <Step key={stepProps.label} {...stepProps} />
        ))}
      </Stepper>
      <Stepper initialStep={3} steps={fiveSteps} iconSize="figma" size="sm" responsive={false}>
        {fiveSteps.map((stepProps, index) => (
          <Step key={stepProps.label} {...stepProps} state={index === 3 ? 'error' : undefined} />
        ))}
      </Stepper>
    </div>
  ),
};
