import type { Meta, StoryObj } from '@storybook/react';

import { TableOfContents, type TableOfContentsProps } from './table-of-contents';

const items = [
  { id: 'toc-intro', label: 'Introduction' },
  { id: 'toc-setup', label: 'Setup', level: 2 as const },
  { id: 'toc-usage', label: 'Usage' },
  { id: 'toc-faq', label: 'FAQ' },
];

const meta = {
  id: 'navigation-table-of-contents',
  title: 'Patterns · Interface/Table of contents',
  component: TableOfContents,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { items },
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

const Page = (args: TableOfContentsProps) => (
    <div className="mx-auto flex max-w-page gap-12 p-6">
      <div className="flex-1">
        {items.map((item) => (
          <section key={item.id} className="min-h-screen">
            <h2 id={item.id} className="typography-h2">{item.label}</h2>
            <p className="typography-body text-text-subtle">Scroll to see the active entry follow the page.</p>
          </section>
        ))}
      </div>
      <aside className="sticky top-6 h-fit w-aside">
        <TableOfContents {...args} />
      </aside>
    </div>
);

export const Default: Story = { render: (args) => <Page {...args} /> };

// Jumps keep room for a sticky header (topbar token by default) and the active entry can use the brand colour.
export const BrandActiveWithOffset: Story = { args: { activeTone: 'brand', scrollOffset: 'topbar-lg' }, render: (args) => <Page {...args} /> };

export const Controlled: Story = { args: { activeId: 'toc-usage' } };
