import express from 'express';
import { loadConfig } from './utils/config';
import { NatsService, MongoService, SlackService } from '@agent-workshop/common';
import { RegistrationWorker } from './workers/registration.worker';
import { AgentManager } from './agent/graph';
import { handleSlackWebhook } from './api/slack.webhook';

async function main() {
  // 1. Load configuration
  const config = loadConfig();
  
  // 2. Initialize core services
  console.log('Initializing services...');
  
  const natsService = new NatsService();
  await natsService.connect(config.nats.url);

  const mongoService = new MongoService();
  await mongoService.connect(config.mongodb.uri, config.mongodb.db_name);

  const slackService = new SlackService(config.slack.bot_token);

  // 3. Initialize Agent Manager
  const agentManager = new AgentManager(natsService, mongoService, config);

  // 4. Start background Registration Worker
  const registrationWorker = new RegistrationWorker(natsService, mongoService, config);
  registrationWorker.start();

  // 5. Setup API services
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.send({ status: 'ok' });
  });

  // Slack Webhook route
  app.post('/slack/webhook', handleSlackWebhook(agentManager, slackService));

  app.listen(config.server.port, () => {
    console.log(`Main Agent Server is running on port ${config.server.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start Main Agent:', err);
  process.exit(1);
});
