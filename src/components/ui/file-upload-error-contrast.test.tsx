import { render, screen } from '@testing-library/react';

import { contrast, loadThemes } from '../../lib/token-contrast';
import { DesignSystemProvider } from './design-system-provider';
import { FileUpload } from './file-upload';

// R-LIB-16 (L-28, DR-11 of pkg3-finance): the drop zone error reads red in dark mode too. The on-subtle role (near white in zero dark) is for red ground only.
describe('FileUpload error text role and contrast (R-LIB-16)', () => {
  it('uses the destructive text role on the zero drop zone, not the on-subtle role', () => {
    render(
      <DesignSystemProvider preset="zero">
        <FileUpload hint="PDF up to 10 MB" error="This file is larger than 10 MB." />
      </DesignSystemProvider>,
    );
    const error = screen.getByText('This file is larger than 10 MB.');
    expect(error).toHaveClass('text-text-destructive');
    expect(error).not.toHaveClass('text-text-destructive-on-subtle');
  });

  it('keeps the destructive text role in the other presets', () => {
    render(<FileUpload hint="PDF up to 10 MB" error="This file is larger than 10 MB." />);
    expect(screen.getByText('This file is larger than 10 MB.')).toHaveClass('text-text-destructive');
  });

  it('clears 4.5:1 on the drop zone fills (muted for zero, page surface otherwise) in every theme and mode', () => {
    const failing: string[] = [];
    for (const theme of loadThemes()) {
      for (const mode of ['light', 'dark'] as const) {
        const t = theme[mode];
        for (const fill of ['utility-muted', 'background']) {
          if (!t[fill] || !t['text-destructive']) continue;
          const ratio = contrast(t['text-destructive'], t[fill]);
          if (ratio < 4.5) failing.push(`${theme.name} ${mode} ${fill} ${ratio.toFixed(2)}`);
        }
      }
    }
    expect(failing).toEqual([]);
  });
});

// R-LIB-16 (L-02): the info alert text keeps 4.5:1 on its fill in zero dark (default size: info tint over the page, compact: info subtle).
describe('Info alert contrast in zero dark (R-LIB-16)', () => {
  it('clears 4.5:1 for both sizes', () => {
    const zero = loadThemes().find((theme) => theme.name === 'zero');
    expect(zero).toBeDefined();
    const t = zero!.dark;
    const page = t['background'];
    const tint = [0, 1, 2].map((i) => page[i] * 0.9 + t['general-info-default'][i] * 0.1) as [number, number, number];
    expect(contrast(t['general-info-hover'], tint)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['text-default'], t['background-info-subtle'])).toBeGreaterThanOrEqual(4.5);
  });
});
