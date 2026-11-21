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
