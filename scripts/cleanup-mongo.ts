import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import toml from 'toml';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanup() {
  // 1. Load config from the main-agent app
  // We navigate from /scripts to /apps/main-agent/config.toml
  const configPath = path.resolve(__dirname, '../apps/main-agent/config.toml');
  
  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file not found at ${configPath}`);
    console.log(`Current directory: ${process.cwd()}`);
    console.log(`Target path: ${configPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(configPath, 'utf-8');
  const config = toml.parse(fileContent);

  console.log(`Connecting to MongoDB Atlas...`);
  const client = new MongoClient(config.mongodb.uri);

  try {
    await client.connect();
    const db = client.db(config.mongodb.db_name);
    const collection = db.collection(config.mongodb.collection_name);

    console.log(`Targeting collection: ${config.mongodb.db_name}.${config.mongodb.collection_name}`);

    // Count documents before deletion
    const countBefore = await collection.countDocuments();
    console.log(`Current document count: ${countBefore}`);

    if (countBefore === 0) {
      console.log('Collection is already empty. No action needed.');
      return;
    }

    // Perform cleanup
    const result = await collection.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} documents.`);
    console.log('MongoDB cleanup completed successfully.');

  } catch (error) {
    console.error('Error during MongoDB cleanup:', error);
  } finally {
    await client.close();
  }
}

cleanup().catch(console.error);
