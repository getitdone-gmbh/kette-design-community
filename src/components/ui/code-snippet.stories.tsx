import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';
import { CodeSnippet } from './code-snippet';

const sample = `// Collection name
export const collection = 'Design';

const schema = new Schema({
  name: { type: String, required: true },
});`;

const meta = {
  id: 'primitives-codesnippet',
  title: 'Primitives · Display/CodeSnippet',
  component: CodeSnippet,
  tags: ['autodocs'],
  args: { code: sample, language: 'TypeScript example' },
  argTypes: {
    variant: { control: { type: 'select' }, options: ['block', 'inline', 'terminal'] },
    tone: { control: { type: 'select' }, options: ['default', 'inverse'] },
  },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeSnippet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Block: Story = {};
export const BlockInverse: Story = { args: { tone: 'inverse' } };
export const WithHeader: Story = { args: { label: 'Terminal', lineNumbers: false, code: 'npm run build' } };
export const Compact: Story = { args: { textSize: 'compact' } };
export const NoLineNumbers: Story = { args: { lineNumbers: false } };
export const Inline: Story = { args: { variant: 'inline', code: 'npm i @getitdone-gmbh/kette-design-community' } };
export const InlineInverse: Story = {
  args: { variant: 'inline', tone: 'inverse', code: 'npm i @getitdone-gmbh/kette-design-community' },
};

export const Highlighted: Story = { args: { highlight: 'ts', code: "import { Schema } from 'mongoose';\n\n// Collection name\nexport const collection = 'Design';\nconst limit = 20;\nconst schema = new Schema({ name: String });" } };
export const HighlightedPython: Story = { args: { highlight: 'python', code: '@dataclass\nclass Design:\n    name: str\n\n    def label(self) -> str:\n        # Collection name\n        return f"{self.name}" if self.name else "none"' } };
export const HighlightedInverse: Story = { args: { highlight: 'ts', tone: 'inverse', code: "// Collection name\nexport const collection = 'Design';\nconst limit = 20;" } };
export const HighlightedJson: Story = { args: { highlight: 'json', code: '{\n  "name": "ui",\n  "private": true,\n  "version": 1\n}' } };

// Illustrated terminal window with structured rows: typed command, quiet note, agent rows with a status column, and a hand-over line.
// Rows fade in once on mount (default). Static for the review and test stories below.
export const Terminal: Story = {
  args: {
    variant: 'terminal',
    terminalAnimate: false,
    terminalTitle: 'build-loop',
    terminalAction: <Badge variant="secondary">Example</Badge>,
    terminalCaption: 'Illustration. Output is shortened.',
    terminalLines: [
      { type: 'cmd', text: 'loop run --feature checkout' },
      { type: 'meta', text: 'run 41 · 5 agents' },
      { type: 'agent', name: 'requirements', status: 'PASS', tone: 'success', note: 'contract v3' },
      { type: 'agent', name: 'component-library', status: 'CHANGED', note: '2 gaps closed' },
      { type: 'agent', name: 'accessibility', status: 'FAIL', tone: 'warning', note: 'contrast 4.3:1' },
      { type: 'route', text: 'routed to component-library' },
      { type: 'agent', name: 'qa', status: 'WAIT...' },
    ],
  },
};

export const TerminalWide: Story = { args: { ...Terminal.args, terminalWide: true } };
export const TerminalAnimated: Story = { args: { ...Terminal.args, terminalAnimate: true }, parameters: { a11y: { disable: true } } };
