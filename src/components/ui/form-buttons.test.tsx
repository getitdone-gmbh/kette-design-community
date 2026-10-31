import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { Alert, AlertClose, AlertTitle } from './alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { ButtonClose } from './button-close';
import { ButtonGroup, ButtonGroupItem } from './button-group';
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';
import { Chip } from './chip';
import { DatePicker } from './date-picker';
import { FileUpload, FileUploadItem } from './file-upload';
import { FilterChipBar } from './filter-chip-bar';
import { Input } from './input';
import { KanbanMoveToMenu } from './kanban-move-to-menu';
import { MultiSelect, MultiSelectProvider } from './multiselect';
import { Pagination } from './pagination';
import { PhoneInput } from './phone-input';
import { SingleSelect, SingleSelectProvider } from './singleselect';
import { Step, Stepper } from './stepper';
import { TagInput } from './tag-input';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { Versions } from './versions';
import { Avatar, AvatarFallback, AvatarUpload } from './avatar';

// jsdom has no ResizeObserver / pointer-capture / scrollIntoView, which the comboboxes and popovers touch.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = MockResizeObserver;
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
window.matchMedia =
  window.matchMedia ||
  ((query: string) =>
    ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }) as unknown as MediaQueryList);

const options = [
  { label: 'Design', id: 'design' },
  { label: 'Development', id: 'development' },
];

// Every button inside the page (portals included) must declare its type, and clicking it must never submit the surrounding form.
const expectNoSubmit = (onSubmit: ReturnType<typeof vi.fn>) => {
  const buttons = Array.from(document.body.querySelectorAll('button'));
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    // The message names the offender when the assertion fails.
    if (!button.hasAttribute('type')) throw new Error(`button without explicit type: ${button.outerHTML.slice(0, 160)}`);
    expect(['button', 'reset']).toContain(button.getAttribute('type'));
  }
  for (const button of buttons) {
    if (!button.isConnected || (button as HTMLButtonElement).disabled) continue;
    fireEvent.click(button);
  }
  expect(onSubmit).not.toHaveBeenCalled();
};

type Case = { name: string; ui: React.ReactElement; prepare?: (user: ReturnType<typeof userEvent.setup>) => Promise<void> };

const cases: Case[] = [
  {
    name: 'SingleSelect with a value, opened',
    ui: (
      <SingleSelectProvider>
        <SingleSelect id="job" label="Job" options={options} selected="design" onChange={() => {}} onAddItemClick={() => {}} />
      </SingleSelectProvider>
    ),
    prepare: async (user) => {
      await user.click(screen.getByRole('button', { name: /^Open options/  }));
    },
  },
  {
    name: 'SingleSelect with search, opened',
    ui: (
      <SingleSelectProvider>
        <SingleSelect id="job" label="Job" options={options} selected={null} onChange={() => {}} onAddItemClick={() => {}} enableSearch />
      </SingleSelectProvider>
    ),
    prepare: async (user) => {
      await user.click(screen.getByRole('button', { name: /^Open options/  }));
    },
  },
  {
    name: 'SingleSelect in a sheet',
    ui: (
      <SingleSelectProvider>
        <SingleSelect id="job" label="Job" options={options} selected="design" onChange={() => {}} useSheet />
      </SingleSelectProvider>
    ),
    prepare: async (user) => {
      await user.click(screen.getByRole('button', { name: /^Open options/  }));
    },
  },
  {
    name: 'MultiSelect with values, opened',
    ui: (
      <MultiSelectProvider>
        <MultiSelect id="jobs" label="Jobs" options={options} selected={['design']} onChange={() => {}} onUpdateOrder={() => {}} onAddItemClick={() => {}} />
      </MultiSelectProvider>
    ),
    prepare: async (user) => {
      await user.click(screen.getAllByRole('combobox')[0]);
    },
  },
  { name: 'DatePicker open', ui: <DatePicker aria-label="Start" defaultValue={new Date(2022, 0, 6)} />, prepare: async (user) => user.click(screen.getByRole('button', { name: 'Start' })) },
  {
    name: 'DatePicker range open',
    ui: <DatePicker aria-label="Period" mode="range" defaultValue={{ from: undefined, to: undefined }} />,
    prepare: async (user) => user.click(screen.getByRole('button', { name: 'Period' })),
  },
  { name: 'Input with password toggle', ui: <Input type="password" revealable placeholder="Password" /> },
  { name: 'TagInput with tags', ui: <TagInput defaultValue={['a', 'b']} /> },
  {
    name: 'FileUpload with items',
    ui: (
      <>
        <FileUpload hint="PNG" />
        <ul>
          <FileUploadItem name="a.pdf" size={1200} status="complete" onRemove={() => {}} />
          <FileUploadItem name="b.pdf" size={1200} status="error" onRemove={() => {}} onRetry={() => {}} />
        </ul>
      </>
    ),
  },
  { name: 'PhoneInput', ui: <PhoneInput /> },
  {
    name: 'Stepper',
    ui: (
      <Stepper initialStep={1} steps={[{ label: 'One' }, { label: 'Two' }, { label: 'Three' }]} orientation="vertical" responsive={false}>
        {[{ label: 'One' }, { label: 'Two' }, { label: 'Three' }].map((step) => (
          <Step key={step.label} {...step} />
        ))}
      </Stepper>
    ),
  },
  { name: 'Pagination', ui: <Pagination pageCount={10} defaultPage={3} /> },
  { name: 'Pagination compact', ui: <Pagination variant="compact" total={214} pageSize={20} pageSizeOptions={[10, 20]} onPageSizeChange={() => {}} defaultPage={2} /> },
  {
    name: 'Carousel',
    ui: (
      <Carousel aria-label="Photos">
        <CarouselContent>
          {[1, 2, 3].map((n) => (
            <CarouselItem key={n}>{n}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots indicator="line" />
      </Carousel>
    ),
  },
  {
    name: 'Versions',
    ui: <Versions items={[{ id: '1', version: 2, current: true }, { id: '2', version: 1 }]} onRestore={() => {}} onDownload={() => {}} />,
  },
  {
    name: 'KanbanMoveToMenu opened',
    ui: <KanbanMoveToMenu title="Pilot" targets={[{ id: 'a', label: 'Backlog' }, { id: 'b', label: 'Doing' }]} currentId="a" onMove={() => {}} />,
    prepare: async (user) => user.click(screen.getByRole('button')),
  },
  { name: 'Chip with remove and click', ui: <Chip label="Design" onRemove={() => {}} onClick={() => {}} /> },
  { name: 'FilterChipBar', ui: <FilterChipBar chips={['Status: open', 'Owner: me']} onRemove={() => {}} onAdd={() => {}} /> },
  {
    name: 'AvatarUpload',
    ui: (
      <Avatar size="profile">
        <AvatarFallback>AF</AvatarFallback>
        <AvatarUpload />
      </Avatar>
    ),
  },
  {
    name: 'ButtonGroup',
    ui: (
      <ButtonGroup aria-label="View">
        <ButtonGroupItem current>List</ButtonGroupItem>
        <ButtonGroupItem>Board</ButtonGroupItem>
      </ButtonGroup>
    ),
  },
  { name: 'ButtonClose', ui: <ButtonClose aria-label="Close" /> },
  {
    name: 'Alert with close',
    ui: (
      <Alert>
        <AlertTitle>Saved</AlertTitle>
        <AlertClose aria-label="Dismiss" />
      </Alert>
    ),
  },
  {
    name: 'Accordion',
    ui: (
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    name: 'Tabs',
    ui: (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    ),
  },
];

describe('buttons inside a form never submit it', () => {
  it.each(cases)('$name', async ({ ui, prepare }) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={onSubmit}>{ui}</form>);
    await prepare?.(user);
    await waitFor(() => expect(document.body.querySelectorAll('button').length).toBeGreaterThan(0));
    expectNoSubmit(onSubmit);
  });
});

// Static guard: a raw <button> or a library <Button> inside the components needs an explicit type (a Button used as a link carrier with asChild is exempt).
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry) && !/\.(stories|test|figma|fixtures)\.tsx$/.test(entry) ? [path] : [];
  });

// Returns the opening tags of `<name` with their attribute text, honouring braces and quotes.
const openingTags = (source: string, name: string): string[] => {
  const tags: string[] = [];
  const start = new RegExp(`<${name}(?=[\\s>/])`, 'g');
  for (let match = start.exec(source); match; match = start.exec(source)) {
    let depth = 0;
    let quote: string | null = null;
    let i = match.index + match[0].length;
    for (; i < source.length; i += 1) {
      const c = source[i];
      if (quote) {
        if (c === quote && source[i - 1] !== '\\') quote = null;
      } else if (depth === 0 && (c === '"' || c === "'")) quote = c;
      else if (c === '{') depth += 1;
      else if (c === '}') depth -= 1;
      else if (c === '>' && depth === 0 && source[i - 1] !== '=') break;
    }
    tags.push(source.slice(match.index, i + 1));
  }
  return tags;
};

describe('every internal button declares its type', () => {
  const dir = join(__dirname);
  const missing: string[] = [];
  for (const file of sourceFiles(dir)) {
    // Comments may mention <button>.
    const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
    for (const tag of openingTags(source, 'button')) if (!/\stype=/.test(tag)) missing.push(`${file.replace(dir, '')}: ${tag.replace(/\s+/g, ' ').slice(0, 100)}`);
    for (const tag of openingTags(source, 'Button')) if (!/\stype=|\sasChild\b/.test(tag)) missing.push(`${file.replace(dir, '')}: ${tag.replace(/\s+/g, ' ').slice(0, 100)}`);
  }
  it('has no <button> or <Button> without type', () => {
    expect(missing).toEqual([]);
  });
});
