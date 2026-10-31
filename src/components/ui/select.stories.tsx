import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import { Input } from './input';
import { Label } from './label';
import { Building2 } from 'lucide-react';

const meta = {
  id: 'primitives-select',
  title: 'Primitives · Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    value: { description: 'Controlled value.' },
    onValueChange: { description: 'Called with the new value when the selection changes.' },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    defaultValue: {
      control: 'text',
      description: 'Default selected value',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Fruit" className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry">Blueberry</SelectItem>
        <SelectItem value="grapes">Grapes</SelectItem>
        <SelectItem value="pineapple">Pineapple</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Timezone" className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
          <SelectItem value="west">Western European Summer Time (WEST)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger aria-label="Option" className="w-[180px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger aria-label="Fruit" className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry">Blueberry</SelectItem>
        <SelectItem value="grapes">Grapes</SelectItem>
        <SelectItem value="pineapple">Pineapple</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Fruit" className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry" disabled>
          Blueberry (Out of stock)
        </SelectItem>
        <SelectItem value="grapes">Grapes</SelectItem>
        <SelectItem value="pineapple" disabled>
          Pineapple (Not available)
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithClamp: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Option" className="w-[300px]" clamp>
        <SelectValue placeholder="Select a very long option with clamping" />
      </SelectTrigger>
      <SelectContent clamp>
        <SelectItem value="option1" clamp>
          This is a very long option that should be clamped to fit nicely
        </SelectItem>
        <SelectItem value="option2" clamp>
          Another extremely long option that demonstrates text clamping behavior
        </SelectItem>
        <SelectItem value="option3" clamp>
          Yet another option with lots of text to show clamping in action
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Scrollable: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Country" className="w-[200px]">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="af">Afghanistan</SelectItem>
        <SelectItem value="al">Albania</SelectItem>
        <SelectItem value="dz">Algeria</SelectItem>
        <SelectItem value="ad">Andorra</SelectItem>
        <SelectItem value="ao">Angola</SelectItem>
        <SelectItem value="ar">Argentina</SelectItem>
        <SelectItem value="am">Armenia</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
        <SelectItem value="at">Austria</SelectItem>
        <SelectItem value="az">Azerbaijan</SelectItem>
        <SelectItem value="bh">Bahrain</SelectItem>
        <SelectItem value="bd">Bangladesh</SelectItem>
        <SelectItem value="bb">Barbados</SelectItem>
        <SelectItem value="by">Belarus</SelectItem>
        <SelectItem value="be">Belgium</SelectItem>
        <SelectItem value="bz">Belize</SelectItem>
        <SelectItem value="bj">Benin</SelectItem>
        <SelectItem value="bt">Bhutan</SelectItem>
        <SelectItem value="bo">Bolivia</SelectItem>
        <SelectItem value="ba">Bosnia and Herzegovina</SelectItem>
        <SelectItem value="bw">Botswana</SelectItem>
        <SelectItem value="br">Brazil</SelectItem>
        <SelectItem value="bn">Brunei</SelectItem>
        <SelectItem value="bg">Bulgaria</SelectItem>
        <SelectItem value="bf">Burkina Faso</SelectItem>
        <SelectItem value="bi">Burundi</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const FullWidthSelect: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <Select>
        <SelectTrigger aria-label="Option" className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
          <SelectItem value="option4">Option 4</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroupsAndClamp: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Language" className="w-[350px]" clamp>
        <SelectValue placeholder="Select a programming language or framework" />
      </SelectTrigger>
      <SelectContent clamp>
        <SelectGroup>
          <SelectLabel clamp>Frontend Frameworks</SelectLabel>
          <SelectItem value="react" clamp>
            React - A JavaScript library for building user interfaces with component-based architecture
          </SelectItem>
          <SelectItem value="vue" clamp>
            Vue.js - The Progressive JavaScript Framework with reactive data binding
          </SelectItem>
          <SelectItem value="angular" clamp>
            Angular - Platform for building mobile and desktop web applications
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel clamp>Backend Languages</SelectLabel>
          <SelectItem value="node" clamp>
            Node.js - JavaScript runtime built on Chrome's V8 JavaScript engine
          </SelectItem>
          <SelectItem value="python" clamp>
            Python - High-level programming language with emphasis on code readability
          </SelectItem>
          <SelectItem value="java" clamp>
            Java - Object-oriented programming language designed for portability
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="space-y-2">
      <Select>
        <SelectTrigger aria-label="Fruit" className="w-[180px]" aria-invalid aria-describedby="select-fruit-error">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
        </SelectContent>
      </Select>
      {/*
        `text-input-foreground-hint-error` (not `text-error`) — the raw `error` swatch
        (rgb(239,68,68)) is 3.76:1 on white, below the 4.5:1 AA minimum for body text.
        `input-foreground-hint-error` is the semantic on-surface/hint-text pairing
        (rgb(220,38,38) in light mode) and clears 4.83:1.
        `aria-describedby` wires this message to the trigger so screen-reader users
        landing on the invalid trigger hear it, not just sighted users seeing the border.
      */}
      <p id="select-fruit-error" className="text-sm text-input-foreground-hint-error">
        Please select a fruit.
      </p>
    </div>
  ),
};

export const WithForm: Story = {
  render: () => (
    <form className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-2 block">
          Email
        </Label>
        <Input type="email" id="email" placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="country" className="mb-2 block">
          Country
        </Label>
        <Select>
          <SelectTrigger id="country">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  ),
};

const options = (
  <SelectContent>
    <SelectItem value="lena">Lena Hartmann</SelectItem>
    <SelectItem value="tobias">Tobias Lindner</SelectItem>
  </SelectContent>
);

export const Loading: Story = {
  render: () => (
    <Select defaultValue="olivia">
      <SelectTrigger aria-label="Team member" loading className="w-64">
        <SelectValue />
      </SelectTrigger>
      {options}
    </Select>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <Select defaultValue="olivia">
      <SelectTrigger aria-label="Team member" appearance="readonly" className="w-64">
        <SelectValue />
      </SelectTrigger>
      {options}
    </Select>
  ),
};

// Dense 32px trigger for inline rows.
export const Compact: Story = {
  render: () => (
    <Select defaultValue="olivia">
      <SelectTrigger aria-label="Company" compact className="w-64">
        <SelectValue />
      </SelectTrigger>
      {options}
    </Select>
  ),
};

export const LeadingIcon: Story = {
  render: () => (
    <Select defaultValue="olivia">
      <SelectTrigger aria-label="Company" leading={<Building2 />} className="w-64">
        <SelectValue />
      </SelectTrigger>
      {options}
    </Select>
  ),
};

export const LeadingDot: Story = {
  render: () => (
    <Select defaultValue="olivia">
      <SelectTrigger aria-label="Status" leading={<span className="h-2 w-2 rounded-full bg-general-success-default" />} className="w-64">
        <SelectValue />
      </SelectTrigger>
      {options}
    </Select>
  ),
};

export const Success: Story = {
  render: () => (
    <Select defaultValue="olivia">
      <SelectTrigger aria-label="Team member" success className="w-64">
        <SelectValue />
      </SelectTrigger>
      {options}
    </Select>
  ),
};

// `density="touch"` makes the options 44px high below the sm breakpoint. Resize the viewport to see it.
export const TouchDensity: Story = {
  render: () => (
    <Select defaultOpen>
      <SelectTrigger className="w-[220px]" aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent density="touch">
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// RA-LIB-06: the small triggers (xs, sm) use the 13px type size of the other small controls at every width, also below 640px. Md and lg keep the 16px field text. The play test compares the trigger with a Button of size sm.
export const SmallSizesTypography: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <Select key={size} defaultValue="olivia">
          <SelectTrigger aria-label={`Company ${size}`} size={size} className="w-40" data-size={size}>
            <SelectValue />
          </SelectTrigger>
          {options}
        </Select>
      ))}
      <Button size="sm" variant="outline" data-size="button-sm">Button sm</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const size = (name: string) => parseFloat(getComputedStyle(canvasElement.querySelector(`[data-size="${name}"]`) as HTMLElement).fontSize);
    // 13px like the label of Button sm (zero gives the button label its own 12px token), never the 16px of the field text, at the width the runner uses.
    expect(size('sm')).toBeLessThanOrEqual(13);
    expect(size('xs')).toBe(size('sm'));
    // The trigger is a button, not a text input, so iOS Safari does not zoom on focus.
    expect((canvasElement.querySelector('[data-size="sm"]') as HTMLElement).tagName).toBe('BUTTON');
  },
};
