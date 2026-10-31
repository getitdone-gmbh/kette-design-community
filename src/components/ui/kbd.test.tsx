import { screen } from '@testing-library/react';
import { render } from '../../lib/render-default-look';
import { createRef } from 'react';

import { Kbd, KbdGroup } from './kbd';

describe('Kbd', () => {
  it('renders a kbd element with the md key by default', () => {
    render(<Kbd>Ctrl</Kbd>);
    const key = screen.getByText('Ctrl');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveClass('h-control-sm', 'typography-ui');
  });

  it('renders the compact sm key', () => {
    render(<Kbd size="sm">K</Kbd>);
    expect(screen.getByText('K')).toHaveClass('h-kbd', 'typography-micro');
  });

  it('forwards the ref and merges className', () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd ref={ref} className="ml-auto">C</Kbd>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveClass('ml-auto', 'rounded-item');
  });

  it('groups keys and connecting text', () => {
    render(
      <KbdGroup data-testid="group">
        <Kbd>Ctrl K</Kbd> then <Kbd>C</Kbd>
      </KbdGroup>,
    );
    expect(screen.getByTestId('group')).toHaveTextContent('Ctrl K then C');
    expect(screen.getAllByText(/Ctrl K|C/, { selector: 'kbd' })).toHaveLength(2);
  });
});
