import { SlackService, SlackContext } from '@agent-workshop/common';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

async function testSlack() {
  // 1. Load configuration
  const configPath = path.resolve(__dirname, 'config.toml');
  const config = toml.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!config.slack.bot_token || config.slack.bot_token.includes('...')) {
    console.error('Error: Please configure real slack.bot_token in config.toml');
    process.exit(1);
  }

  const slackService = new SlackService(config.slack.bot_token);
  const targetChannel = "C07BS81MLEN";

  console.log(`Sending test message to channel ${targetChannel}...`);

  try {
    // Scenario 1: Send a normal message
    const res1 = await slackService.postMessage(
      targetChannel, 
      "🚀 This is a normal test message from Main Agent."
    );
    console.log("Normal message sent successfully, TS:", res1.ts);

    // Scenario 2: Simulate Thread reply
    if (res1.ts) {
      console.log("Attempting to reply to this message to form a Thread...");
      const mockContext: SlackContext = {
        channel_id: targetChannel,
        user_id: "SYSTEM_TEST",
        ts: res1.ts as string,
      };

      await slackService.replyToThread(
        mockContext,
        "🧵 This is an automated Thread reply for verifying context linkage."
      );
      console.log("Thread reply sent successfully.");
    }

    console.log("\n✅ Slack sending tests completed!");
  } catch (error) {
    console.error("Slack sending failed:", error);
  }
}

testSlack().catch(console.error);
