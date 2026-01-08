import { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  capabilities: any[]; // List of registered agent capabilities from Mongo
  slackContext: {
    channel_id: string;
    user_id: string;
    ts: string;
    thread_ts?: string;
  };
  requestCategory?: string;
}

