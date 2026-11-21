import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import type { AdvisorMessage, AdvisorSource } from '@/domain/models/advisor';
import { useAdvisorContext } from '@/presentation/features/advisor/contexts/AdvisorContext';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

export interface AdvisorChatEntry extends AdvisorMessage {
  id: number;
  /** Where an assistant answer came from. */
  sources: AdvisorSource[];
}

const toHistory = (entries: readonly AdvisorChatEntry[]): AdvisorMessage[] =>
  entries.map(({ role, content }) => ({ role, content }));

/**
 * The material advisor conversation for one project.
 * The whole history is sent with every question so the advisor keeps the thread, together
 * with the design the user is currently looking at.
 */
export function useAdvisorChat(projectId: string, designId: string | undefined) {
  const { advisorService } = useAdvisorContext();
  const [entries, setEntries] = useState<AdvisorChatEntry[]>([]);
  const nextIdRef = useRef(1);

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (history: AdvisorMessage[]) =>
      advisorService.chat({ projectId, designId, messages: history }),
    onSuccess: (response) => {
      setEntries((current) => [
        ...current,
        {
          id: nextIdRef.current++,
          role: 'assistant',
          content: response.reply,
          sources: response.sources,
        },
      ]);
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || isPending) {
        return;
      }
      const next: AdvisorChatEntry[] = [
        ...entries,
        { id: nextIdRef.current++, role: 'user', content, sources: [] },
      ];
      setEntries(next);
      mutate(toHistory(next));
    },
    [entries, isPending, mutate]
  );

  /** Asks again after a failure; the unanswered question is still the last entry. */
  const retry = useCallback(() => {
    if (entries.length > 0 && entries[entries.length - 1].role === 'user') {
      mutate(toHistory(entries));
    }
  }, [entries, mutate]);

  const clearConversation = useCallback(() => {
    setEntries([]);
    reset();
  }, [reset]);

  return {
    entries,
    sendMessage,
    retry,
    clearConversation,
    isThinking: isPending,
    errorMessage: error ? getErrorMessage(error) : null,
  };
}
