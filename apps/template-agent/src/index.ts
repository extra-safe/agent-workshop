import { NatsService, SlackService, AGENT_SUBJECT_PREFIX, NatsRequestMessage } from "@agent-workshop/common";
import { loadConfig } from "./utils/config";
import { CustomAgent } from "./agent/agent";
import * as readline from 'readline';

/**
 * MAIN ENTRY POINT
 * 
 * This file orchestrates the interaction between NATS, Slack, and your Agent.
 * It handles:
 * 1. Configuration loading.
 * 2. Service initialization (NATS, Slack).
 * 3. Agent registration.
 * 4. Message routing and asynchronous invocation.
 */
async function main() {
  const config = loadConfig();

  // 1. Initialize Infrastructure Services
  const natsService = new NatsService();
  await natsService.connect(config.nats.url);

  const slackService = new SlackService(config.slack.bot_token);

  // 2. Initialize your Custom Agent
  const myAgent = new CustomAgent(config);

  // 3. Register Agent Capabilities to the Main Agent (Dynamic Discovery)
  // This allows the Main Agent to route requests to this sub-agent based on its description.
  await natsService.registerAgent(config.nats.subject_registration, {
    name: "Template Agent", // Change this to your Agent's name
    description: "A generic template agent that can be customized for specific tasks.", // Be descriptive!
    subjectSuffix: config.nats.subject_suffix,
  });

  // 4. Set up NATS Subscription for incoming requests
  const fullSubject = `${AGENT_SUBJECT_PREFIX}${config.nats.subject_suffix}`;
  console.log(`Agent is active and listening on NATS: ${fullSubject}`);

  natsService.subscribe(fullSubject, async (data: NatsRequestMessage) => {
    try {
      console.log(`Processing request: ${data.text}`);
      
      // Invoke the agent and get the response
      const responseContent = await myAgent.invoke(data.text);

      // Reply back to Slack (maintaining conversation context via thread_ts)
      await slackService.postMessage(
        data.slackContext.channel_id,
        `[Agent] Response:\n${responseContent}`,
        data.slackContext.thread_ts || data.slackContext.ts
      );

    } catch (error) {
      console.error('NATS Message processing error:', error);
    }
  });

  // 5. Local CLI Mode for fast Vibe Coding feedback
  // Usage: npm run dev -- --cli
  if (process.argv.includes('--cli')) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n--- Agent CLI Mode Activated ---');
    const ask = () => {
      rl.question('> ', async (input) => {
        if (input.toLowerCase() === 'exit') process.exit(0);
        const response = await myAgent.invoke(input);
        console.log(`\nAgent: ${response}\n`);
        ask();
      });
    };
    ask();
  }
}

main().catch((err) => {
  console.error('Fatal Initialization Error:', err);
  process.exit(1);
});

