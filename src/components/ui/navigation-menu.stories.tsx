import type { Meta, StoryObj } from '@storybook/react';

import { cn } from '../../lib/utils';
import { CookieConsent } from './cookie-consent';
import {
  MenuListItem,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu';

const meta = {
  id: 'primitives-navigationmenu',
  title: 'Primitives · Layout/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const components: { title: string; href: string; description: string }[] = [
  {
    title: 'Alert Dialog',
    href: '/docs/primitives/alert-dialog',
    description: 'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    href: '/docs/primitives/hover-card',
    description: 'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    href: '/docs/primitives/progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    href: '/docs/primitives/scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    href: '/docs/primitives/tabs',
    description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    href: '/docs/primitives/tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
];

const Component = (args) => (
  <div style={{ maxWidth: 500, margin: '0 auto' }}>
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3 bg-button-background-ghost-hover">
                <NavigationMenuLink asChild>
                  <a
                    className={cn(
                      'flex',
                      'h-full',
                      'w-full',
                      'select-none',
                      'flex-col',
                      'justify-end',
                      'rounded-default',
                      'bg-gradient-to-b',
                      'from-muted/50',
                      'to-muted',
                      'p-6',
                      'no-underline',
                      'outline-none',
                      'focus:shadow-md',
                    )}
                    href="/"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
                    <p className={cn('text-sm', 'leading-4', 'text-text-subtle')}>
                      Beautifully designed components built with Radix UI and Tailwind CSS.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <MenuListItem href="/docs" title="Introduction">
                Re-usable components built using Radix UI and Tailwind CSS.
              </MenuListItem>
              <MenuListItem href="/docs/installation" title="Installation">
                How to install dependencies and structure your app.
              </MenuListItem>
              <MenuListItem href="/docs/primitives/typography" title="Typography">
                Styles for headings, paragraphs, lists...etc
              </MenuListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <MenuListItem key={component.title} title={component.title} href={component.href}>
                  {component.description}
                </MenuListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>Documentation</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
);

const defaultArgs = {
  clamp: false,
  disabled: false,
};

export const Default: Story = {
  args: {
    ...defaultArgs,
  } as any,
  render: (args) => Component(args),
};

export const FluidFont: Story = {
  args: {
    ...defaultArgs,
    clamp: true,
  } as any,
  render: (args) => Component(args),
};

export const Disabled: Story = {
  args: {
    ...defaultArgs,
    disabled: true,
  } as any,
  render: (args) => Component(args),
};

// A right-aligned menu opened on load: the Features panel is wider than the space right of its trigger and has to stay inside the viewport.
export const RightAlignedNearEdge: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="flex min-h-[420px] w-full items-start justify-end px-4 pt-4">
      <NavigationMenu defaultValue="features">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Pricing</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="features">
            <NavigationMenuTrigger>Features</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {components.map((component) => (
                  <MenuListItem key={component.title} title={component.title} href={component.href}>
                    {component.description}
                  </MenuListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
};

const tallItems = Array.from({ length: 14 }, (_, index) => ({ title: `Feature ${index + 1}`, href: `/feature-${index + 1}`, description: 'Short description of the feature.' }));

// A header on the chrome layer with a long panel and a fixed cookie banner: the open panel sits on the dropdown layer above the banner, is capped to the space below the header and scrolls. Check it at 390x640, 1024x700 and 1440x900.
export const LongPanelAboveBanner: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen">
      <header className="sticky top-0 z-chrome flex h-16 w-full items-center justify-end border-0 border-b border-solid border-hairline bg-background px-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem value="features">
              <NavigationMenuTrigger>Features</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[calc(100vw-theme(spacing.8))] max-w-[340px] gap-1 p-2">
                  {tallItems.map((item) => (
                    <MenuListItem key={item.title} title={item.title} href={item.href}>
                      {item.description}
                    </MenuListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </header>
      <div className="fixed inset-x-0 bottom-0 p-4">
        <CookieConsent positioning="static" title="Cookies" description="Only the cookies needed to run the site are set by default." onAccept={() => undefined} onDecline={() => undefined} />
      </div>
    </div>
  ),
};
