export const AGENT_SUBJECT_PREFIX = "agents.capability.";

export interface IAgentCapability {
  id: string;
  name: string;
  description: string;
  subjectSuffix: string; // Only store the suffix
  version?: string;
}

export interface SlackContext {
  channel_id: string;
  user_id: string;
  thread_ts?: string;
  ts: string;
}

export interface NatsRequestMessage {
  requestId: string;
  category: string;
  text: string;
  slackContext: SlackContext;
}

export interface NatsRegistrationMessage {
  name: string;
  description: string;
  subjectSuffix: string; // Provide suffix when registering
}

