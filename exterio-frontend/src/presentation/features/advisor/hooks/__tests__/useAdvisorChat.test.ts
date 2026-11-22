import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdvisorStreamEvent } from '@/domain/models/advisor';
import { useAdvisorChat } from '@/presentation/features/advisor/hooks/useAdvisorChat';

const chatStream = vi.fn();

vi.mock('@/presentation/features/advisor/contexts/AdvisorContext', () => ({
  useAdvisorContext: () => ({ advisorService: { chatStream } }),
}));

describe('useAdvisorChat', () => {
  beforeEach(() => {
    chatStream.mockReset();
  });

  it('fills the answer in as steps and text arrive', async () => {
    let emit: (event: AdvisorStreamEvent) => void = () => undefined;
    let finish: () => void = () => undefined;
    chatStream.mockImplementation((_params, onEvent: typeof emit) => {
      emit = onEvent;
      return new Promise<void>((resolve) => (finish = resolve));
    });
    const { result } = renderHook(() => useAdvisorChat('p1', 'd1'));

    act(() => result.current.sendMessage('Is stone worth it?'));
    const step = { key: 'notes', label: 'Searching material notes', status: 'running', detail: '' };
    act(() => emit({ type: 'step', step: step as never }));
    act(() => emit({ type: 'text', text: 'Stone ' }));

    const answer = () => result.current.entries[1];
    expect(answer().status).toBe('streaming');
    expect(answer().steps).toEqual([step]);
    expect(answer().content).toBe('Stone ');
    expect(result.current.isThinking).toBe(true);

    act(() =>
      emit({ type: 'step', step: { ...step, status: 'done', detail: 'Found 2' } as never })
    );
    act(() =>
      emit({ type: 'done', reply: { reply: 'Stone lasts.', sources: [{ title: 'Stone' }] } })
    );
    await act(async () => finish());

    expect(answer().steps).toHaveLength(1);
    expect(answer().steps[0].detail).toBe('Found 2');
    expect(answer()).toMatchObject({ content: 'Stone lasts.', status: 'done' });
    expect(result.current.isThinking).toBe(false);
  });

  it('drops the half answer on failure so the question can be asked again', async () => {
    chatStream.mockRejectedValueOnce(new Error('The advisor is busy.'));
    const { result } = renderHook(() => useAdvisorChat('p1', undefined));

    await act(async () => result.current.sendMessage('hi'));

    expect(result.current.entries.map((entry) => entry.role)).toEqual(['user']);
    expect(result.current.errorMessage).toBe('The advisor is busy.');

    chatStream.mockResolvedValueOnce(undefined);
    await act(async () => result.current.retry());
    expect(chatStream).toHaveBeenCalledTimes(2);
    expect(chatStream.mock.calls[1][0].messages).toEqual([{ role: 'user', content: 'hi' }]);
  });
});
