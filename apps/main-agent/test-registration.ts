import { NatsService } from '@agent-workshop/common';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

async function test() {
  // Manually read config to get NATS URL
  const configPath = path.resolve(__dirname, 'config.toml');
  const config = toml.parse(fs.readFileSync(configPath, 'utf-8'));

  const nats = new NatsService();
  console.log(`Connecting to NATS at ${config.nats.url}...`);
  await nats.connect(config.nats.url);
  
  const mockRegistration = {
    name: "OrderAgent",
    description: "Agent for order query, cancellation, and status tracking",
    subjectSuffix: "orders.process"
  };

  const registrationSubject = config.nats.subject_registration;
  console.log(`Sending mock registration to subject: ${registrationSubject}`);
  
  await nats.publish(registrationSubject, mockRegistration);
  console.log("Message published successfully.");
  
  // Wait for a while to ensure message is sent
  setTimeout(async () => {
    await nats.close();
    console.log("Test script finished.");
    process.exit(0);
  }, 1000);
}

test().catch(console.error);

