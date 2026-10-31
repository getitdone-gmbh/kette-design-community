import { render as renderPlain, screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';

import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Chip } from './chip';
import { DesignSystemProvider } from './design-system-provider';
import { Input } from './input';
import { InputDigit } from './input-digit';
import { Switch } from './switch';
import { Tabs, TabsList, TabsTrigger } from './tabs';

const zero = (ui: React.ReactElement) => render(<DesignSystemProvider preset="zero">{ui}</DesignSystemProvider>);

describe('DesignSystemProvider preset', () => {
  it('uses the zero preset without a provider (package default since 0.5.0)', () => {
    renderPlain(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('bg-background', 'border-border-default');
  });

  it('uses the zero preset in a provider that sets no preset', () => {
    renderPlain(
      <DesignSystemProvider locale="de">
        <Button>Go</Button>
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('bg-background', 'border-border-default');
  });

  it('preset="default" brings back the look before 0.5.0', () => {
    renderPlain(
      <DesignSystemProvider preset="default">
        <Button>Go</Button>
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('bg-button-background-default');
  });

  it('zero renders the secondary outline button by default and keeps explicit variants', () => {
    zero(
      <>
        <Button>Plain</Button>
        <Button variant="primary">Primary</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveClass('bg-background', 'border-border-default');
    expect(screen.getByRole('button', { name: 'Primary' })).toHaveClass('bg-button-background-primary-default');
  });

  it('inherits the preset in nested providers', () => {
    render(
      <DesignSystemProvider preset="zero">
        <DesignSystemProvider locale="de">
          <Button>Nested</Button>
        </DesignSystemProvider>
      </DesignSystemProvider>,
    );
    expect(screen.getByRole('button', { name: 'Nested' })).toHaveClass('bg-background');
  });

  it('Input size maps to the control tokens and zero defaults to md', () => {
    const { rerender } = render(<Input aria-label="a" size="xs" />);
    expect(screen.getByLabelText('a')).toHaveClass('h-control-xs');
    rerender(<Input aria-label="a" size="sm" />);
    expect(screen.getByLabelText('a')).toHaveClass('h-control-sm');
    rerender(<Input aria-label="a" />);
    expect(screen.getByLabelText('a')).toHaveClass('px-4');
    rerender(
      <DesignSystemProvider preset="zero">
        <Input aria-label="a" />
      </DesignSystemProvider>,
    );
    expect(screen.getByLabelText('a')).toHaveClass('h-control-md', 'px-control-px-sm');
  });

  it('Badge tinted turns the destructive badge into the soft tone', () => {
    render(
      <Badge variant="destructive" tinted>
        Failed
      </Badge>,
    );
    expect(screen.getByText('Failed').closest('div')).toHaveClass('bg-background-destructive-subtle', 'text-text-destructive-on-subtle');
  });

  it('Chip productDot renders the suffix', () => {
    render(<Chip chipStyle="productDot" label="Vacancy" suffix=".zero" />);
    expect(screen.getByText('.zero')).toHaveAttribute('data-chip-suffix');
  });

  it('zero tabs default to the segment list', () => {
    zero(
      <Tabs defaultValue="a">
        <TabsList aria-label="t">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toHaveClass('rounded-control', 'gap-micro');
  });

  it('checkbox and switch use the 3:1 control roles in every preset', () => {
    render(
      <>
        <Checkbox aria-label="c" />
        <Switch aria-label="s" />
      </>,
    );
    expect(screen.getByRole('checkbox')).toHaveClass('border-checkbox-border-default');
    expect(screen.getByRole('switch')).toHaveClass('data-[state=unchecked]:bg-switch-background-unchecked');
  });

  it('zero defaults the checkbox to sm and the code input to the 40x48 box', () => {
    zero(
      <>
        <Checkbox aria-label="c" />
        <InputDigit length={2} aria-label="code" />
      </>,
    );
    expect(screen.getByRole('checkbox')).toHaveClass('h-checkbox-sm');
    expect(document.querySelector('input[inputmode]')).toHaveClass('h-12', 'w-10');
  });
});
