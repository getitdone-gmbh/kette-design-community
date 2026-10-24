import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './button';
import { CookieConsent, openCookieSettings, useCookieConsent, type CookieConsentProps } from './cookie-consent';
import { Link } from './link';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';

const DismissibleDemo = (args: CookieConsentProps) => {
  const [open, setOpen] = useState(true);
  return <CookieConsent {...args} open={open} onAccept={() => setOpen(false)} onDecline={() => setOpen(false)} />;
};

const meta = {
  title: 'Overlays/Cookie consent',
  component: CookieConsent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    positioning: 'static',
    title: 'Cookies',
    description: (
      <>
        We only set cookies that are needed to run the site by default. Optional analytics stay off unless you accept. See our <Link href="/privacy">privacy policy</Link>.
      </>
    ),
    onAccept: () => undefined,
    onDecline: () => undefined,
  },
} satisfies Meta<typeof CookieConsent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSettings: Story = { args: { onCustomize: () => undefined } };

export const Dismissible: Story = {
  render: (args) => <DismissibleDemo {...args} />,
};

export const CenteredWide: Story = { args: { layout: 'centered-wide', onCustomize: () => undefined } };

// A paragraph title adds no heading to the page, for banners that must stay outside the document outline.
export const TitleAsParagraph: Story = { args: { titleAs: 'p' } };

export const Closable: Story = { args: { closable: true } };

// Size of the buttons: `default` 40px, `sm` 32px for dense pages. Escape closes a closable banner like the close button, and goes back from the settings view to the summary first.
export const SmallButtons: Story = { args: { size: 'sm', onCustomize: () => undefined, categories: [{ id: 'a', title: 'Analytics', description: 'Anonymous usage statistics.' }] } };

const categories = [
  { id: 'necessary', title: 'Necessary', description: 'Required to run the site. Always active.', necessary: true },
  { id: 'statistics', title: 'Statistics', description: 'Anonymous usage numbers that help us improve the site.' },
  { id: 'marketing', title: 'Marketing', description: 'Used to show relevant offers on other sites.' },
];

export const WithSettingsView: Story = {
  args: { layout: 'centered-wide', closable: true, categories, onSave: () => undefined },
};

// Returning visitor: the settings view starts from the stored choice (`initialConsent`, uncontrolled). Use `value` with `onValueChange` to control the switches.
export const WithStoredConsent: Story = {
  args: { layout: 'centered-wide', categories, initialConsent: { statistics: true, marketing: false }, onSave: () => undefined },
};

// Accept emphasis colours accept AND decline identically. Declining must be as easy and as prominent as accepting
// (GDPR / TTDSG): same variant, size and contrast, both on the first layer, no pre-ticked boxes. Never style one decision louder.
export const AcceptEmphasis: Story = {
  args: { layout: 'centered-wide', closable: true, acceptEmphasis: true, categories, onSave: () => undefined },
};

// Close without deciding: nothing is stored and `onDismiss` fires. The banner shows again on the next visit.
export const DeferDismiss: Story = {
  args: { layout: 'centered-wide', closable: true, dismissBehavior: 'defer', onDismiss: () => undefined, categories, onSave: () => undefined },
};

export const CustomAlwaysActiveText: Story = {
  args: { layout: 'centered-wide', closable: true, alwaysActiveLabel: 'Required', categories, onSave: () => undefined },
};

// Fixed banner over a long page. While it is open the document scroller reserves its height as scroll padding, so Tab scrolls the focused link above the banner.
export const FixedOverLongPage: Story = {
  parameters: { layout: 'fullscreen' },
  args: { positioning: 'fixed', onCustomize: () => undefined },
  render: (args) => (
    <main className="p-4">
      <ul className="m-0 flex list-none flex-col gap-24 p-0">
        {Array.from({ length: 12 }, (_, index) => (
          <li key={index}>
            <Link href={`#section-${index + 1}`}>Page link {index + 1}</Link>
          </li>
        ))}
      </ul>
      <CookieConsent {...args} />
    </main>
  ),
};

const newsCards = ['Spring collection', 'Workshop recap', 'New store opening'];

// Fixed banner over a page whose last section is a horizontal card carousel. Tabbing into a card scrolls it clear of the banner, vertically and horizontally.
export const OverHorizontalCarousel: Story = {
  args: { positioning: 'fixed' },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <main className="min-h-[1200px] p-4">
      <h1 className="typography-h3 mb-4">News</h1>
      <div className="h-[640px]" aria-hidden="true" />
      <div data-testid="news-scroller" className="flex snap-x gap-4 overflow-x-auto pb-2">
        {newsCards.map((title) => (
          <a key={title} href="#news" className="block min-w-[85%] shrink-0 snap-center rounded-surface border border-solid border-border bg-card p-4 text-foreground no-underline">
            <span className="typography-ui-semibold block">{title}</span>
            <span className="typography-ui block text-text-subtle">Short teaser text of the news card.</span>
          </a>
        ))}
      </div>
      <CookieConsent {...args} />
    </main>
  ),
};

// Layering: a fixed banner sits below an open sheet, so the sheet and its last menu item are never covered (WCAG 2.4.11).
export const BelowOpenSheet: Story = {
  parameters: { layout: 'fullscreen' },
  args: { positioning: 'fixed', onCustomize: () => undefined },
  render: (args) => (
    <main className="p-4">
      <Link href="#top">Page link</Link>
      <Sheet defaultOpen>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigation</SheetDescription>
          </SheetHeader>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {['Features', 'Pricing', 'Docs', 'Contact'].map((item) => (
              <li key={item}>
                <Link href={`#${item.toLowerCase()}`}>{item}</Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
      <CookieConsent {...args} />
    </main>
  ),
};

const ReopenFromFooterLinkDemo = (args: CookieConsentProps) => {
  const [open, setOpen] = useState(false);
  return (
    <main className="flex min-h-64 flex-col justify-between gap-8 p-4">
      <p className="typography-ui m-0">The banner was decided earlier. Use the footer link to open it again: focus moves into the banner and returns to the link when you decide.</p>
      <footer>
        <Button type="button" variant="link" onClick={() => setOpen(true)}>
          Cookie settings
        </Button>
      </footer>
      <CookieConsent {...args} open={open} onAccept={() => setOpen(false)} onDecline={() => setOpen(false)} />
    </main>
  );
};

// A "Cookie settings" link in the footer reopens a banner the visitor dismissed before. Focus moves to the banner title and returns to the link after accept, decline or save. The first automatic appearance never takes focus.
export const ReopenFromFooterLink: Story = {
  render: (args) => <ReopenFromFooterLinkDemo {...args} />,
};

const ReopenApiDemo = (args: CookieConsentProps) => {
  const { reopen } = useCookieConsent();
  const [stored, setStored] = useState(true);
  return (
    <main className="flex min-h-64 flex-col justify-between gap-8 p-4">
      <p className="typography-ui m-0">A choice is stored, so the banner is hidden. The footer button calls reopen(): focus moves into the banner and returns to the button after the decision. No state or window event in the app.</p>
      <footer className="flex gap-4">
        <Button type="button" variant="link" size="inline" onClick={() => reopen()}>
          Cookie settings
        </Button>
        <Button type="button" variant="link" size="inline" onClick={() => openCookieSettings()}>
          Same with the plain function
        </Button>
      </footer>
      <CookieConsent {...args} open={!stored} onReopen={() => setStored(false)} onAccept={() => setStored(true)} onDecline={() => setStored(true)} />
    </main>
  );
};

// Public reopen API. `useCookieConsent().reopen()` or `openCookieSettings()` from a click handler reopens the mounted banner, controlled (`open` plus `onReopen`) or uncontrolled. Keep the component mounted and hide it with `open={false}` while a choice is stored.
export const ReopenApi: Story = {
  render: (args) => <ReopenApiDemo {...args} />,
};
