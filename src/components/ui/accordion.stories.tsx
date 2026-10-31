import type { Meta, StoryObj } from '@storybook/react';

import { expect } from '@storybook/jest';
import { within } from '@storybook/testing-library';
import React from 'react';
import { Card } from './card';
import { DesignSystemProvider } from './design-system-provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta = {
  id: 'primitives-accordion',
  title: 'Primitives · Layout/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Inset rule: a standalone accordion (page, menu, panel) has a px-3 inset on trigger and content so the hover wash has room. Inside a Card the inset is dropped, so labels align with the card heading. Set `inset` on the root or an item to override.',
      },
    },
  },
  argTypes: {},
  render: (args) => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>Yes. It's animated by default, but you can disable it if you prefer.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

type AccordionProps = React.ComponentProps<typeof Accordion>;

export const Default: Story = {
  args: {} as AccordionProps,
};

// Selected/open state — chevron rotates 180° and the content panel reveals; a `defaultValue`
// pins one item open so both the "closed" and "open" (selected) rows render side by side.
export const OpenItem: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {} as AccordionProps,
};

// Disabled state (ACCORDION-A11Y-01) — the whole item is inert: no hover/active/focus treatment,
// pointer-events are off, and the row renders at `opacity-disabled`.
export const DisabledItem: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Coming soon (disabled)</AccordionTrigger>
        <AccordionContent>This section isn&apos;t available yet.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {} as AccordionProps,
};

// Multiple type — several items can be open at once; each still gets the same
// hover/focus-visible/active/disabled/selected treatment independently.
export const MultipleType: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>Both this and the next section can be open together.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>Yes, really — `type=&quot;multiple&quot;` allows it.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {} as AccordionProps,
};

// A plain container is not a Card: the accordion keeps its inset.
export const InsideCard: Story = {
  args: { type: 'single', collapsible: true },
  render: () => (
    <div className="w-full max-w-md rounded-card border border-solid border-border-default bg-card p-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-b-0">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>Yes.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// Inside a Card the inset is dropped by default, so the labels align with the card heading (the workload.zero prototype aligns card content with the card heading).
export const InCardComponent: Story = {
  args: { type: 'single', collapsible: true },
  render: () => (
    <Card className="w-full max-w-md p-4">
      <h3 className="typography-ui-medium pb-2">Experience</h3>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-b-0">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>Yes.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  ),
};

// Standalone (page body, menu, panel) the accordion keeps its px-3 inset. `inset` on the root or an item overrides the context either way.
export const InCardInsetOptIn: Story = {
  args: { type: 'single', collapsible: true },
  render: () => (
    <Card className="w-full max-w-md p-4">
      <Accordion type="single" collapsible inset className="w-full">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger>Inset on purpose</AccordionTrigger>
          <AccordionContent>The label sits 12px in from the card padding.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  ),
};

const faq = [
  'How long does it take until the first version of my project is live and reachable for my customers?',
  'Can I change the plan later?',
  'What happens to my data and to the pages I built when I cancel my subscription at the end of the term?',
];

const FaqLongQuestions = () => (
  <div style={{ width: 390 }}>
    <Accordion type="single" collapsible className="w-full">
      {faq.map((question, index) => (
        <AccordionItem key={question} value={`q-${index}`}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>Short answer.</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

// Distance between the label text and the edge of its trigger, top and bottom. Measured on the text range, not the box.
const labelClearance = (trigger: HTMLElement) => {
  const box = trigger.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents([...trigger.childNodes].find((node) => node.nodeType === 3) as Node);
  const text = range.getBoundingClientRect();
  return { top: text.top - box.top, bottom: box.bottom - text.bottom, height: box.height };
};

// The zero preset reads its line height from the zero ui token (16px). A story run under another toolbar theme (the default is neutral, 20px) keeps the preset but not that token set, so the exact row heights only hold on the zero tokens; every theme keeps rows on the 4px grid, at least 44px.
const expectZeroRows = (triggers: HTMLElement[], zeroHeights: number[]) => {
  const heights = triggers.map((trigger) => Math.round(trigger.getBoundingClientRect().height));
  if (getComputedStyle(triggers[0]).lineHeight === '16px') expect(heights).toEqual(zeroHeights);
  else heights.forEach((height) => { expect(height % 4).toBe(0); expect(height).toBeGreaterThanOrEqual(44); });
};

const checkFaq = (canvasElement: HTMLElement) => {
  const triggers = within(canvasElement).getAllByRole('button');
  triggers.forEach((trigger, index) => {
    const { top, bottom, height } = labelClearance(trigger);
    // At least 8px above and below the label, at any number of lines.
    expect(top).toBeGreaterThanOrEqual(8);
    expect(bottom).toBeGreaterThanOrEqual(8);
    // The glyphs stay inside the trigger: nothing overflows the box.
    expect(trigger.scrollHeight).toBeLessThanOrEqual(trigger.clientHeight);
    // One line stays at the 44px row height, wrapped questions grow.
    if (index === 1) expect(Math.round(height)).toBeLessThanOrEqual(56);
    else expect(height).toBeGreaterThan(44);
  });
};

// DR-ZP-01: FAQ with long questions at 390 in the default preset: the label keeps its padding at any number of lines.
export const FaqLongQuestions390: Story = {
  args: {} as AccordionProps,
  render: () => <FaqLongQuestions />,
  play: async ({ canvasElement }) => checkFaq(canvasElement),
};

// DR-ZP-01: the zero preset had a 44px row with no vertical padding, so a wrapped question nearly touched the dividers. The row is a 44px minimum now, with 8px above and below the label.
export const FaqLongQuestions390Zero: Story = {
  args: {} as AccordionProps,
  render: () => (
    <DesignSystemProvider preset="zero">
      <FaqLongQuestions />
    </DesignSystemProvider>
  ),
  play: async ({ canvasElement }) => {
    checkFaq(canvasElement);
    // On the 4px grid: one line 44, two lines 56 (16px token line height, 12px padding).
    expectZeroRows(within(canvasElement).getAllByRole('button'), [56, 44, 56]);
  },
};

// DR-ZP-01 at 320: three-line questions grow, the glyphs stay inside the trigger with at least 8px above and below, the focus ring (outside the box) does not cover the text, and the answer has a gap below the question.
export const FaqLongQuestions320Zero: Story = {
  args: {} as AccordionProps,
  render: () => (
    <DesignSystemProvider preset="zero">
      <div style={{ width: 320 }}>
        <Accordion type="single" collapsible defaultValue="q-0" className="w-full">
          {faq.map((question, index) => (
            <AccordionItem key={question} value={`q-${index}`}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>Short answer.</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DesignSystemProvider>
  ),
  play: async ({ canvasElement }) => {
    const triggers = within(canvasElement).getAllByRole('button');
    triggers.forEach((trigger) => {
      const { top, bottom } = labelClearance(trigger);
      expect(top).toBeGreaterThanOrEqual(8);
      expect(bottom).toBeGreaterThanOrEqual(8);
      expect(trigger.scrollHeight).toBeLessThanOrEqual(trigger.clientHeight);
    });
    // Three lines are 72px, one line 44px (4px grid).
    expectZeroRows(triggers, [72, 44, 72]);
    // Focus ring: drawn outside the trigger box (offset ring), so it never lies on the glyphs.
    triggers[0].focus();
    const ring = getComputedStyle(triggers[0]).boxShadow;
    expect(ring).not.toContain('inset');
    // The answer starts below the question with a gap of at least 8px.
    const text = document.createRange();
    text.selectNodeContents([...triggers[0].childNodes].find((node) => node.nodeType === 3) as Node);
    const answer = within(canvasElement).getByText('Short answer.');
    expect(answer.getBoundingClientRect().top - text.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(8);
  },
};
