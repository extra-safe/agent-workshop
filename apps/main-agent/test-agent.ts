import { NatsService, MongoService, IAgentCapability } from '@agent-workshop/common';
import { AgentManager } from './src/agent/graph';
import { loadConfig } from './src/utils/config';

async function testAgent() {
  const config = loadConfig();
  
  const nats = new NatsService();
  await nats.connect(config.nats.url);

  const mongo = new MongoService();
  await mongo.connect(config.mongodb.uri, config.mongodb.db_name);

  const agentManager = new AgentManager(nats, mongo, config);

  // 1. Ensure test data exists in Mongo
  const collection = mongo.getCollection<IAgentCapability>(config.mongodb.collection_name);
  await collection.updateOne(
    { name: "OrderAgent" },
    { 
      $set: { 
        description: "Agent for order query, cancellation, and status tracking", 
        subjectSuffix: "orders.process" 
      } 
    },
    { upsert: true }
  );

  console.log("--- Test Case 1: Category Matched ---");
  const result1 = await agentManager.run("I want to check the status of my order 12345", {
    channel_id: "C123",
    user_id: "U123",
    ts: "111.222"
  });
  console.log("Agent Response:", result1);

  console.log("\n--- Test Case 2: No Category Matched ---");
  const result2 = await agentManager.run("Hello, how is the weather today?", {
    channel_id: "C123",
    user_id: "U123",
    ts: "111.222"
  });
  console.log("Agent Response:", result2);

  await nats.close();
  await mongo.close();
  process.exit(0);
}

testAgent().catch(console.error);

