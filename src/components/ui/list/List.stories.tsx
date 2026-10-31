import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button';
import { Grid } from '../grid';
import { List } from './List';
import { ListProps } from './list.interface';

const meta = {
  id: 'primitives-list',
  title: 'Primitives · Display/List',
  component: List,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: {
        disable: true,
      },
    },
    type: {
      control: {
        type: 'select',
        options: ['ordered', 'unordered'],
      },
    },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'bullet',
  } as ListProps,
  render: ({ type }) => (
    <List type={type}>
      <List.Item>List item</List.Item>
      <List.Item>Super long list item Super long list item Super long list item Super long list item</List.Item>
      <List.Item>
        <Button underline variant="link">
          I am a Button
        </Button>
      </List.Item>
    </List>
  ),
};

export const Ordered: Story = {
  args: {
    type: 'numeric',
  } as ListProps,
  render: ({ type }) => (
    <List type={type}>
      <List.Item>List item</List.Item>
      <List.Item>Super long list item Super long list item Super long list item Super long list item</List.Item>
      <List.Item>
        <Button underline variant="link">
          I am a Button
        </Button>
      </List.Item>
    </List>
  ),
};

export const Mixed: Story = {
  args: {
    type: 'numeric',
  } as ListProps,
  render: ({ type }) => (
    <List type={type}>
      <List.Item>List item</List.Item>
      <List.Item>
        <Button underline variant="link">
          I am a Button
        </Button>
      </List.Item>
      <List type="alphabetical">
        <List.Item>List item</List.Item>
        <List.Item>Super long list item Super long list item Super long list item Super long list item</List.Item>
        <List.Item>
          <Button underline variant="link">
            I am a Button
          </Button>
        </List.Item>
      </List>
    </List>
  ),
};

export const LinkItems: Story = {
  args: {
    type: 'bullet',
  } as ListProps,
  render: ({ type }) => (
    <List type={type}>
      <List.Item>
        <Button underline variant="link">
          I am a Button
        </Button>
      </List.Item>
      <List.Item>
        <Button underline variant="link">
          I am a Button
        </Button>
      </List.Item>
      <List.Item>
        <Button underline variant="link">
          I am a Button
        </Button>
      </List.Item>
    </List>
  ),
};


export const History: Story = {
  args: {
    type: 'history',
  } as ListProps,
  render: ({ type }) => (
    <Grid columns={{ xs: 1, sm: 1, md: 2 }} className="container">
      <List type={type}>
        <List.HistoryItem date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
      </List>
      <List type={type}>
        <List.HistoryItem date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
      </List>
    </Grid>
  ),
};
export const HistoryFluid: Story = {
  args: {
    type: 'history',
  } as ListProps,
  render: ({ type }) => (
    <Grid columns={{ xs: 1, sm: 1, md: 2 }} className="container">
      <List type={type}>
        <List.HistoryItem clamp date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem clamp date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem clamp date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
      </List>
      <List type={type}>
        <List.HistoryItem clamp date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem clamp date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
        <List.HistoryItem clamp date="03/2023 - today" title="Nordwind Handel GmbH" description="Senior Software Engineer" />
      </List>
    </Grid>
  ),
};
