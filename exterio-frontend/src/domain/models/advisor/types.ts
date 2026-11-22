export type AdvisorRole = 'user' | 'assistant';

export interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

export interface AdvisorSource {
  title: string;
}

export interface AdvisorChatParams {
  projectId: string;
  designId?: string;
  messages: AdvisorMessage[];
}

export interface AdvisorReply {
  reply: string;
  sources: AdvisorSource[];
}

export type AdvisorStepStatus = 'running' | 'done';

/** One stage of the work behind an answer, e.g. searching the material notes. */
export interface AdvisorStep {
  key: string;
  label: string;
  status: AdvisorStepStatus;
  /** What the stage found, e.g. the notes it matched. Empty while it runs. */
  detail: string;
}

/** What a streamed answer sends, in order: steps, the text in pieces, then the reply. */
export type AdvisorStreamEvent =
  | { type: 'step'; step: AdvisorStep }
  | { type: 'text'; text: string }
  | { type: 'done'; reply: AdvisorReply };
