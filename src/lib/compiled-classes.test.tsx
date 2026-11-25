/**
 * Guard: every utility class a primitive renders must generate CSS through the real token preset.
 * A class that compiles to nothing (typo, token that does not exist, utility missing from the
 * preset) silently renders as "no style", which is how dead classes like `bg-input` crept in.
 *
 * Renders the primitives in their relevant states (overlays open), collects every class on every
 * node, compiles them with Tailwind + the repo config, and fails on any class with no rule.
 */
import { render } from '@testing-library/react';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { Fragment } from 'react';

import { DesignSystemProvider } from '../components/ui/design-system-provider';
import { InputDigit } from '../components/ui/input-digit';
import { Kbd } from '../components/ui/kbd';
import { ObjectIcon } from '../components/ui/object-icon';
import { RadioCard, RadioCardGroup } from '../components/ui/radio-cards';
import { Toast, ToastProvider, ToastViewport } from '../components/ui/toast';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Alert, AlertActions, AlertDescription } from '../components/ui/alert';
import { Avatar, AvatarFallback, AvatarGroup } from '../components/ui/avatar';
import { ColorInput, ColorSwatchPicker } from '../components/ui/color-picker';
import { StatusDot } from '../components/ui/status-dot';
import { StepMarker } from '../components/ui/step-marker';
import { ListItem } from '../components/ui/list-item';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Card as CardDefault } from '../components/ui/card/Card';
import { Checkbox } from '../components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/ui/hover-card';
import { Input, InputHint } from '../components/ui/input';
import { Sidebar, SidebarLayout, SidebarNavItem } from '../components/ui/sidebar';
import { Chip } from '../components/ui/chip';
import { MonthGridCell } from '../components/ui/calendar-grid';
import { Kanban, KanbanCard, KanbanColumn } from '../components/ui/kanban';
import { Progress } from '../components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableLeadCell, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { LogoTile } from '../components/ui/logo-tile';
import { TableBadgeCell } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Toggle } from '../components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import {
  fieldHaloZero,
  focusRing,
  invalidRing,
  menuItem,
  menuItemZero,
  overlaySurfaceZero,
  menuItemDestructive,
  openRing,
  overlayMotion,
  overlaySurface,
  transitionBase,
} from './recipes';

// Classes that are legitimately not Tailwind utilities (state hooks, marker classes) or that come
// from the CSS layers in tailwind.css rather than the utility pass. Keep this list short.
// `card` is a plain marker class on Card; `lucide*` are the icon library's own classes.
const NON_UTILITY = new Set<string>(['group', 'peer', 'dark', 'card', 'inverse', 'destructive', 'snack']);
const NON_UTILITY_PATTERN = /^lucide(-|$)/;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= ResizeObserverStub;
  Element.prototype.scrollIntoView ??= () => {};
});

const unescape = (selector: string) =>
  selector
    .replace(/\\([0-9a-f]{1,6}) ?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');

const cssClassNames = (css: string): Set<string> => {
  const out = new Set<string>();
  for (const m of css.matchAll(/\.((?:\\[0-9a-f]{1,6} ?|\\.|[A-Za-z0-9_-])+)/gi)) out.add(unescape(m[1]));
  return out;
};

const collectClasses = (root: ParentNode): Set<string> => {
  const found = new Set<string>();
  root.querySelectorAll('*').forEach((el) => {
    const cls = el.getAttribute('class');
    if (cls) cls.split(/\s+/).filter(Boolean).forEach((c) => found.add(c));
  });
  return found;
};

const Everything = () => (
  <TooltipProvider>
    <div>
      {(['default', 'primary', 'destructive', 'outline', 'outline-destructive', 'secondary', 'ghost', 'link'] as const).map((v) => (
        <Fragment key={v}>
          <Button variant={v}>{v}</Button>
          <Button variant={v} size="icon" aria-label={`${v}-icon`} />
          <Button variant={v} size="sm" icon={<span />} dotLeading />
          <Button variant={v} size="control-sm">c</Button>
          <Button variant={v} size="control-md">c</Button>
          <Button variant={v} size="control-lg">c</Button>
        </Fragment>
      ))}
      <Input aria-invalid placeholder="i" />
      <Input clamp placeholder="c" />
      <Input compact placeholder="d" />
      <Input variant="search" placeholder="s" />
      <InputHint>h</InputHint>
      <InputHint invalid>h</InputHint>
      <Chip size="control" label="f" onRemove={() => {}} />
      <Chip size="control" variant="outline" label="f" />
      <Alert size="compact" variant="warning">
        <svg />
        <AlertDescription>n</AlertDescription>
      </Alert>
      <Alert size="compact" variant="info">
        n
      </Alert>
      <Switch size="sm" defaultChecked />
      <AvatarGroup overflowCount={2}>
        <Avatar size="xs">
          <AvatarFallback size="xs">A</AvatarFallback>
        </Avatar>
      </AvatarGroup>
      <Avatar size="sm">
        <AvatarFallback size="sm">B</AvatarFallback>
      </Avatar>
      <Tabs defaultValue="a">
        <TabsList variant="segment">
          <TabsTrigger value="a" count={3}>
            A
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Table headerTone="muted" rowHover="table" elevated>
        <TableHeader>
          <TableRow>
            <TableHead select>h</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell select>1</TableCell>
            <TableLeadCell name="n" supportingText="s" logo={<span />} />
          </TableRow>
        </TableBody>
      </Table>
      <SidebarLayout>
        <Sidebar>
          <SidebarNavItem variant="nav" href="#" label="n" count={2} active />
        </Sidebar>
      </SidebarLayout>
      <Tabs defaultValue="1">
        <TabsList variant="segment">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <TabsTrigger key={n} value={String(n)} count={n}>
              T{n}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Skeleton variant="row-single" />
      <Skeleton variant="row" />
      <LogoTile color={3} initials="AB" />
      <LogoTile tone="neutral" src="/x.svg" size="md" />
      <ColorSwatchPicker aria-label="c" defaultValue="project-2" size="sm" invalid />
      <ColorInput defaultValue="#112233" compact />
      {(['success', 'warning', 'destructive', 'info', 'credit', 'neutral'] as const).map((tone) => (
        <StatusDot key={tone} tone={tone} size="md" />
      ))}
      {(['upcoming', 'current', 'complete', 'error'] as const).map((state) => (
        <StepMarker key={state} step={1} state={state} size="sm" />
      ))}
      <Table>
        <TableBody>
          <TableRow selected>
            <TableLeadCell name="n" logo={<LogoTile color={1} initials="A" size="xs" />} />
            <TableBadgeCell>
              <Badge>b</Badge>
            </TableBadgeCell>
          </TableRow>
        </TableBody>
      </Table>
      <Textarea aria-invalid />
      <Chip variant="outline" label="o" dotLeading dotColor="bg-general-info-default" />
      <Chip variant="outline" label="o" selected />
      <Progress aria-label="a" value={20} />
      <Progress aria-label="b" value={null} size="sm" variant="destructive" />
      <Badge>d</Badge>
      <Badge variant="secondary">s</Badge>
      <Badge variant="destructive">x</Badge>
      <Badge variant="outline">o</Badge>
      <Badge variant="ghost">g</Badge>
      <Badge variant="subtle">u</Badge>
      <Badge variant="link">l</Badge>
      <Badge variant="product-backoffice" bordered readable>p</Badge>
      <Badge variant="product-accent" bordered>a</Badge>
      <Switch defaultChecked />
      <Switch />
      <Checkbox defaultChecked />
      <Checkbox checked="indeterminate" />
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>
      <Separator />
      <Separator orientation="vertical" decorative={false} />
      <Avatar size="2xs">
        <AvatarFallback size="2xs">A</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <Avatar shape="square" onClick={() => {}}>
        <AvatarFallback>B</AvatarFallback>
      </Avatar>
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" count={3}>
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">a</TabsContent>
      </Tabs>
      <Tabs defaultValue="a">
        <TabsList variant="line">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>
      <Toggle>t</Toggle>
      <Toggle variant="outline">t</Toggle>
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">a</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant="outline">
        <ToggleGroupItem value="a">a</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant="segmented" defaultValue="a">
        <ToggleGroupItem value="a">a</ToggleGroupItem>
      </ToggleGroup>
      <Card>
        <CardHeader>
          <CardTitle>t</CardTitle>
          <CardDescription>d</CardDescription>
        </CardHeader>
        <CardContent>c</CardContent>
        <CardFooter>f</CardFooter>
      </Card>
      <Card href="#" selected>
        link
      </Card>
      <ListItem title="l" href="#" selected />
      <Alert variant="info">
        <AlertActions>a</AlertActions>
      </Alert>
      <Card onClick={() => {}} selected invalid>
        x
      </Card>
      <CardDefault onClick={() => {}} selected invalid>
        x
      </CardDefault>
      <Accordion type="single" collapsible defaultValue="1">
        <AccordionItem value="1">
          <AccordionTrigger>t</AccordionTrigger>
          <AccordionContent>c</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable sortDirection="asc" onSort={() => {}}>
              h
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell>1</TableCell>
          </TableRow>
          <TableRow invalid>
            <TableCell>2</TableCell>
          </TableRow>
          <TableRow onClick={() => {}}>
            <TableCell>3</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>f</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty>none</CommandEmpty>
          <CommandGroup heading="g">
            <CommandItem>one</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>

      {/* Overlays, rendered open (portalled to document.body) */}
      <Select open defaultValue="a">
        <SelectTrigger compact>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>l</SelectLabel>
            <SelectItem value="a">a</SelectItem>
            <SelectSeparator />
            <SelectItem value="b">b</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <DropdownMenu open>
        <DropdownMenuTrigger>o</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>l</DropdownMenuLabel>
          <DropdownMenuItem>i</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            d<DropdownMenuShortcut>k</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>c</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">r</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>s</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>si</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open>
        <PopoverTrigger>p</PopoverTrigger>
        <PopoverContent>p</PopoverContent>
      </Popover>
      <HoverCard open>
        <HoverCardTrigger>h</HoverCardTrigger>
        <HoverCardContent>h</HoverCardContent>
      </HoverCard>
      <Tooltip open>
        <TooltipTrigger>t</TooltipTrigger>
        <TooltipContent>t</TooltipContent>
      </Tooltip>
      <Dialog open>
        <DialogContent size="xl" scrollable>
          <DialogBody>b</DialogBody>
        </DialogContent>
      </Dialog>
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>t</DialogTitle>
            <DialogDescription>d</DialogDescription>
          </DialogHeader>
          <DialogFooter>f</DialogFooter>
        </DialogContent>
      </Dialog>
      {(['right', 'left', 'top', 'bottom'] as const).map((side) => (
        <Sheet key={side} open>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>t</SheetTitle>
              <SheetDescription>d</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
      <MonthGridCell day={1} label="First" disabled />
      <MonthGridCell day={2} label="Second" outside selected />
      <Kanban aria-label="Board">
        <KanbanColumn id="a" title="A">
          <KanbanCard id="c1" title="Card" />
        </KanbanColumn>
      </Kanban>
      <Kanban aria-label="Board loading" state="loading" />
      <Input variant="search" className="max-w-full" inputClassName="uppercase" leadingIcon={<span />} placeholder="s2" />
    </div>
  </TooltipProvider>
);

// New props and preset paths (Input sizes, tinted Badge, Chip suffix and dashed selected, InputDigit code, avatar 9 and 10).
const Extras = () => (
  <div>
    {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
      <Input key={size} size={size} placeholder={size} leadingIcon={<span />} />
    ))}
    <Input size="sm" variant="search" placeholder="s" />
    <Select>
      <SelectTrigger size="xs">
        <SelectValue />
      </SelectTrigger>
    </Select>
    <Badge variant="destructive" tinted>
      t
    </Badge>
    <Badge variant="info">i</Badge>
    <Badge dot>d</Badge>
    <Chip size="compact" dotLeading dotShape="square" label="c" selected onClick={() => {}} />
    <LogoTile tone="outline" initials="AB" />
    <Tabs defaultValue="a">
      <TabsList size="sm">
        <TabsTrigger value="a">A</TabsTrigger>
      </TabsList>
    </Tabs>
    <Progress aria-label="p" size="sm" value={30} />
    <Chip chipStyle="productDot" dotColor="bg-general-info-default" label="Vacancy" suffix=".zero" />
    <Chip size="control" dashed selected label="d" onClick={() => {}} />
    <Chip size="control" dashed label="d" />
    <Chip label="plain" />
    <InputDigit size="code" length={4} />
    <InputDigit />
    <Avatar>
      <AvatarFallback color="indigo">A</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback color={10}>A</AvatarFallback>
    </Avatar>
    <Kbd>K</Kbd>
    <ObjectIcon app="vacancy" />
    <Button count={3}>c</Button>
    <Button size="icon-sm" aria-label="i" />
    <Alert variant="info" size="compact">
      n
    </Alert>
    <Alert variant="warning">n</Alert>
    <StepMarker step={1} state="current" />
    <StepMarker step={2} state="complete" />
    <RadioCardGroup defaultValue="a">
      <RadioCard value="a" title="A" icon={<span />} />
    </RadioCardGroup>
    <ToastProvider>
      <Toast open>
        <span>t</span>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  </div>
);

const compile = async (classes: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require('../../tailwind.config.cjs');
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw: classes.join(' '), extension: 'html' }] }),
  ]).process('@tailwind components;\n@tailwind utilities;', { from: undefined });
  return cssClassNames(result.css);
};

describe('compiled classes', () => {
  it('every class rendered by the primitives generates CSS through the token preset', async () => {
    render(<Everything />);
    const rendered = collectClasses(document.body);
    const classes = [
      ...rendered,
      ...focusRing,
      ...openRing,
      ...invalidRing,
      ...transitionBase,
      ...overlaySurface,
      ...overlayMotion,
      ...menuItem,
      ...menuItemDestructive,
    ];
    const compiled = await compile(classes);
    const missing = [...new Set(classes)].filter((c) => !NON_UTILITY.has(c) && !NON_UTILITY_PATTERN.test(c) && !compiled.has(c)).sort();
    expect(missing).toEqual([]);
  }, 60000);

  it('every class of the zero preset and the new props generates CSS', async () => {
    render(
      <DesignSystemProvider preset="zero">
        <Everything />
        <Extras />
      </DesignSystemProvider>,
    );
    const classes = [...collectClasses(document.body), ...fieldHaloZero, ...menuItemZero, ...overlaySurfaceZero];
    const compiled = await compile(classes);
    const missing = [...new Set(classes)].filter((c) => !NON_UTILITY.has(c) && !NON_UTILITY_PATTERN.test(c) && !compiled.has(c)).sort();
    expect(missing).toEqual([]);
  }, 60000);
});
