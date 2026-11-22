import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AdvisorMessage,
  AdvisorSource,
  AdvisorStep,
  AdvisorStreamEvent,
} from '@/domain/models/advisor';
import { useAdvisorContext } from '@/presentation/features/advisor/contexts/AdvisorContext';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

export interface AdvisorChatEntry extends AdvisorMessage {
  id: number;
  /** Where an assistant answer came from. */
  sources: AdvisorSource[];
  /** The work behind an assistant answer, as it was reported. */
  steps: AdvisorStep[];
  /** `streaming` while an answer is still arriving. */
  status: 'streaming' | 'done';
}

const toHistory = (entries: readonly AdvisorChatEntry[]): AdvisorMessage[] =>
  entries.map(({ role, content }) => ({ role, content }));

/** A step's later report replaces its earlier one; a new step goes at the end. */
const upsertStep = (steps: readonly AdvisorStep[], step: AdvisorStep): AdvisorStep[] =>
  steps.some((existing) => existing.key === step.key)
    ? steps.map((existing) => (existing.key === step.key ? step : existing))
    : [...steps, step];

function applyEvent(entry: AdvisorChatEntry, event: AdvisorStreamEvent): AdvisorChatEntry {
  switch (event.type) {
    case 'step':
      return { ...entry, steps: upsertStep(entry.steps, event.step) };
    case 'text':
      return { ...entry, content: entry.content + event.text };
    case 'done':
      return {
        ...entry,
        content: event.reply.reply,
        sources: event.reply.sources,
        status: 'done',
      };
  }
}

/**
 * The material advisor conversation for one project.
 * The whole history is sent with every question so the advisor keeps the thread, together
 * with the design the user is currently looking at. The answer is streamed: its entry appears
 * at once and fills in as the advisor reports each step and writes the text.
 */
export function useAdvisorChat(projectId: string, designId: string | undefined) {
  const { advisorService } = useAdvisorContext();
  const [entries, setEntries] = useState<AdvisorChatEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextIdRef = useRef(1);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const ask = useCallback(
    async (history: AdvisorChatEntry[]) => {
      requestRef.current?.abort();
      const request = new AbortController();
      requestRef.current = request;

      const answerId = nextIdRef.current++;
      const answer: AdvisorChatEntry = {
        id: answerId,
        role: 'assistant',
        content: '',
        sources: [],
        steps: [],
        status: 'streaming',
      };
      setEntries([...history, answer]);
      setErrorMessage(null);
      setIsThinking(true);

      try {
        await advisorService.chatStream(
          { projectId, designId, messages: toHistory(history) },
          (event) =>
            setEntries((current) =>
              current.map((entry) => (entry.id === answerId ? applyEvent(entry, event) : entry))
            ),
          request.signal
        );
      } catch (error) {
        if (request.signal.aborted) {
          return;
        }
        // The question stays as the last entry, so "Try again" can ask it again.
        setEntries((current) => current.filter((entry) => entry.id !== answerId));
        setErrorMessage(getErrorMessage(error));
      } finally {
        if (requestRef.current === request) {
          requestRef.current = null;
          setIsThinking(false);
        }
      }
    },
    [advisorService, projectId, designId]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || isThinking) {
        return;
      }
      const question: AdvisorChatEntry = {
        id: nextIdRef.current++,
        role: 'user',
        content,
        sources: [],
        steps: [],
        status: 'done',
      };
      void ask([...entries, question]);
    },
    [ask, entries, isThinking]
  );

  /** Asks again after a failure; the unanswered question is still the last entry. */
  const retry = useCallback(() => {
    if (entries.length > 0 && entries[entries.length - 1].role === 'user') {
      void ask(entries);
    }
  }, [ask, entries]);

  const clearConversation = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setEntries([]);
    setErrorMessage(null);
    setIsThinking(false);
  }, []);

  return { entries, sendMessage, retry, clearConversation, isThinking, errorMessage };
}
