import { Request, Response } from 'express';
import { AgentManager } from '../agent/graph';
import { SlackService, SlackContext } from '@agent-workshop/common';

export const handleSlackWebhook = (agentManager: AgentManager, slackService: SlackService) => {
  return async (req: Request, res: Response) => {
    try {
      // Slack Slash Command data is in req.body (x-www-form-urlencoded)
      const { channel_id, user_id, text, command } = req.body;

      if (!text) {
        return res.send("Please enter your question or command.");
      }

      // 1. Respond to Slack immediately (to avoid 3s timeout)
      res.send(`Request received, processing your command: "${text}"...`);

      // 2. Prepare context
      // Note: Slash Command doesn't have a ts itself, we can use the current one or from subsequent replies
      // To support thread replies, we usually post a new message as the thread root after async processing
      const slackContext: SlackContext = {
        channel_id,
        user_id,
        ts: Date.now().toString(), // Temporary placeholder
      };

      // 3. Invoke Agent asynchronously
      const response = await agentManager.run(text, slackContext);

      // 4. Reply the result to the Slack channel
      await slackService.postMessage(channel_id, `<@${user_id}> processing result:\n${response}`);

    } catch (error) {
      console.error('Error handling Slack webhook:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  };
};

