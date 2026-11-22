import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AdvisorChatEntry } from '@/presentation/features/advisor/hooks/useAdvisorChat';
import { AdvisorMessageBubble } from '@/presentation/features/advisor/molecules/AdvisorMessageBubble';

const ANSWER: AdvisorChatEntry = {
  id: 2,
  role: 'assistant',
  content: 'Texture paint hides uneven plaster well.',
  sources: [{ title: 'Texture finish: hiding uneven plaster' }],
  steps: [],
  status: 'done',
};

describe('AdvisorMessageBubble sources', () => {
  it('asks about a source when it is clicked', async () => {
    const onAskAboutSource = vi.fn();
    render(
      <ul>
        <AdvisorMessageBubble entry={ANSWER} onAskAboutSource={onAskAboutSource} />
      </ul>
    );

    // Sources appear once the answer has finished typing out.
    await userEvent.click(await screen.findByRole('button', { name: /Texture finish/ }));

    expect(onAskAboutSource).toHaveBeenCalledWith('Texture finish: hiding uneven plaster');
  });

  it('cannot start a new question while another answer is arriving', async () => {
    render(
      <ul>
        <AdvisorMessageBubble entry={ANSWER} onAskAboutSource={vi.fn()} isBusy />
      </ul>
    );

    expect(await screen.findByRole('button', { name: /Texture finish/ })).toBeDisabled();
  });
});
