import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import userEvent from '@testing-library/user-event';

import { Message, MessageAction, MessageActions, MessageAttachment, MessageReaction, MessageReactions } from './message';

describe('Message', () => {
  it('renders author, time, text and the exposed avatar slot', () => {
    render(<Message author="Phoenix Baker" time="Friday 2:20pm" avatar={<span data-testid="av" />} text="Hello" />);
    expect(screen.getByText('Phoenix Baker')).toBeInTheDocument();
    expect(screen.getByText('Friday 2:20pm')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toHaveClass('bg-muted');
    expect(screen.getByTestId('av')).toBeInTheDocument();
  });

  it('own messages use the brand bubble and hide the avatar', () => {
    render(<Message author="You" own avatar={<span data-testid="av" />} text="Sure" />);
    expect(screen.getByText('Sure')).toHaveClass('bg-background-brand-bold-default');
    expect(screen.queryByTestId('av')).toBeNull();
  });

  it('renders an icon reaction named by aria-label, with and without a count', () => {
    render(
      <MessageReactions>
        <MessageReaction icon={<svg data-testid="thumb" />} count={3} aria-label="Thumbs up" />
        <MessageReaction icon={<svg />} aria-label="Like" />
      </MessageReactions>,
    );
    const withCount = screen.getByRole('button', { name: 'Thumbs up' });
    expect(withCount).toHaveTextContent('3');
    expect(withCount.querySelector('[data-reaction-icon]')).toHaveClass('text-icon-subtle');
    expect(screen.getByRole('button', { name: 'Like' })).toHaveTextContent('');
  });

  it('renders an attachment and toggleable reactions', async () => {
    const onClick = vi.fn();
    render(
      <Message
        author="P"
        attachment={<MessageAttachment name="design.jpg" size="1.2 MB" />}
        reactions={
          <MessageReactions>
            <MessageReaction emoji="x" count={2} active onClick={onClick} />
          </MessageReactions>
        }
      />,
    );
    expect(screen.getByText('design.jpg')).toBeInTheDocument();
    const reaction = screen.getByRole('button', { name: /2/ });
    expect(reaction).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(reaction);
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Reactions' })).toBeInTheDocument();
  });

  it('typing shows a labelled status and no text', () => {
    render(<Message author="P" typing text="hidden" />);
    expect(screen.getByRole('status', { name: 'Typing' })).toBeInTheDocument();
    expect(screen.queryByText('hidden')).toBeNull();
  });

  it('compact density uses the UI type role, default keeps the paragraph role', () => {
    const { rerender } = render(<Message author="P" text="Hi" />);
    expect(screen.getByText('Hi')).toHaveClass('typography-p-ui');
    rerender(<Message author="P" text="Hi" density="compact" meta={<span>edited</span>} />);
    expect(screen.getByText('Hi')).toHaveClass('typography-ui');
    expect(screen.getByText('Hi')).not.toHaveClass('typography-p-ui');
    expect(screen.getByText('edited')).toBeInTheDocument();
  });

  it('action slot stays keyboard reachable and operable', async () => {
    const onReply = vi.fn();
    render(
      <Message
        author="P"
        text="Hi"
        actions={
          <MessageActions>
            <MessageAction aria-label="Reply" onClick={onReply} />
          </MessageActions>
        }
      />,
    );
    expect(screen.getByRole('group', { name: 'Message actions' })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onReply).toHaveBeenCalled();
  });

  it('hides the action slot while typing', () => {
    render(<Message author="P" typing actions={<MessageActions />} />);
    expect(screen.queryByRole('group', { name: 'Message actions' })).toBeNull();
  });
});

describe('Message quiet variant', () => {
  it('hides the sender visually but keeps it for assistive tech', () => {
    render(<Message quiet author="Phoenix Baker" time="2:20pm" text="Hi" />);
    expect(screen.getByText('Phoenix Baker')).toHaveClass('sr-only');
    expect(screen.getByText('2:20pm')).toBeInTheDocument();
  });

  it('renders without author and without any header row', () => {
    const { container } = render(<Message quiet text="Hi" />);
    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(container.querySelector('.typography-ui-medium')).toBeNull();
  });

  it('ownTone neutral keeps own messages without the brand colour', () => {
    render(<Message author="You" own ownTone="neutral" text="Sure" />);
    const bubble = screen.getByText('Sure');
    expect(bubble).toHaveClass('bg-background-neutral-active', 'text-text-default');
    expect(bubble).not.toHaveClass('bg-background-brand-bold-default');
  });

  it('bare drops the bubble for incoming and own replies', () => {
    const { rerender } = render(<Message author="P" bare text="Reply" />);
    expect(screen.getByText('Reply')).toHaveClass('bg-transparent', 'p-0');
    expect(screen.getByText('Reply')).not.toHaveClass('bg-muted', 'px-4');
    rerender(<Message author="You" own bare text="Reply" />);
    expect(screen.getByText('Reply')).toHaveClass('bg-transparent', 'p-0');
    expect(screen.getByText('Reply')).not.toHaveClass('bg-background-brand-bold-default');
  });

  it('keeps the bubble on the typing indicator when bare', () => {
    render(<Message author="P" bare typing />);
    expect(screen.getByRole('status', { name: 'Typing' })).toHaveClass('bg-muted');
  });

  it('defaults the own bubble to the brand primary fill', () => {
    render(<Message author="You" own text="Sure" />);
    expect(screen.getByText('Sure')).toHaveClass('bg-background-brand-bold-default', 'text-text-on-brand');
  });

  it('ownTone inverse uses the static inverse surface that stays dark in both modes', () => {
    render(<Message author="You" own ownTone="inverse" text="Sure" />);
    const bubble = screen.getByText('Sure');
    expect(bubble).toHaveClass('bg-surface-inverse-static', 'text-text-on-inverse-static');
    expect(bubble).not.toHaveClass('bg-background-inverse', 'text-text-inverse');
    expect(bubble).not.toHaveClass('bg-background-brand-bold-default');
  });

  it('size sm uses the 14px small role in default density', () => {
    render(<Message author="P" text="Hi" size="sm" />);
    expect(screen.getByText('Hi')).toHaveClass('typography-text-small');
    expect(screen.getByText('Hi')).not.toHaveClass('typography-small', 'typography-p-ui');
  });

  it('compact density keeps the UI role regardless of size', () => {
    render(<Message author="P" text="Hi" size="sm" density="compact" />);
    expect(screen.getByText('Hi')).toHaveClass('typography-ui');
    expect(screen.getByText('Hi')).not.toHaveClass('typography-text-small');
  });

  it('radius defaults to control and accepts token tiers', () => {
    const { rerender } = render(<Message author="P" text="Hi" />);
    expect(screen.getByText('Hi')).toHaveClass('rounded-control');
    rerender(<Message author="P" text="Hi" radius="surface" />);
    expect(screen.getByText('Hi')).toHaveClass('rounded-surface');
    expect(screen.getByText('Hi')).not.toHaveClass('rounded-control');
  });
});

describe('Message timePlacement', () => {
  it('keeps the time in the meta group by default', () => {
    const { container } = render(<Message author="Phoenix" time="2:20pm" meta={<span>edited</span>} text="Hi" />);
    expect(container.querySelector('[data-time-placement="author"]')).toBeNull();
    expect(screen.getByText('2:20pm').parentElement).toContainElement(screen.getByText('edited'));
  });

  it('puts the time next to the author with timePlacement="author" and leaves meta at the end', () => {
    const { container } = render(<Message author="Phoenix" time="2:20pm" meta={<span>edited</span>} timePlacement="author" text="Hi" />);
    const group = container.querySelector('[data-time-placement="author"]') as HTMLElement;
    expect(group).toContainElement(screen.getByText('Phoenix'));
    expect(group).toContainElement(screen.getByText('2:20pm'));
    expect(group).not.toContainElement(screen.getByText('edited'));
  });

  it('ignores the placement for quiet messages', () => {
    const { container } = render(<Message author="Phoenix" quiet time="2:20pm" timePlacement="author" text="Hi" />);
    expect(container.querySelector('[data-time-placement="author"]')).toBeNull();
    expect(screen.getByText('2:20pm')).toBeInTheDocument();
  });
});
