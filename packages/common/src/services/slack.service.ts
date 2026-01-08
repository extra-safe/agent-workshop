import { WebClient } from '@slack/web-api';
import { SlackContext } from '../models/types';

export class SlackService {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async postMessage(channel: string, text: string, threadTs?: string) {
    return await this.client.chat.postMessage({
      channel,
      text,
      thread_ts: threadTs,
    });
  }

  async replyToThread(context: SlackContext, text: string) {
    return await this.postMessage(
      context.channel_id,
      text,
      context.thread_ts || context.ts
    );
  }
}

