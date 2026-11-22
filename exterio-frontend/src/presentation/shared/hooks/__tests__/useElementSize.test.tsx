import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useElementSize } from '@/presentation/shared/hooks/useElementSize';

function Probe({ itemKey }: { itemKey: string }) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  return (
    <div key={itemKey} ref={ref} data-key={itemKey}>
      {width}
    </div>
  );
}

describe('useElementSize', () => {
  it('measures the element it is attached to, and the new one after a key change', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.dataset.key === 'b' ? 200 : 100;
      },
    });

    const { rerender } = render(<Probe itemKey="a" />);
    expect(screen.getByText('100')).toBeInTheDocument();

    rerender(<Probe itemKey="b" />);
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});
