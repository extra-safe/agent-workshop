import fs from 'fs';
import path from 'path';
import toml from 'toml';

export interface Config {
  server: {
    port: number;
  };
  nats: {
    url: string;
    subject_registration: string;
  };
  mongodb: {
    uri: string;
    db_name: string;
    collection_name: string;
  };
  slack: {
    bot_token: string;
    signing_secret: string;
  };
  openai: {
    api_key: string;
    model: string;
  };
}

export function loadConfig(): Config {
  const configPath = path.resolve(process.cwd(), 'config.toml');
  const fileContent = fs.readFileSync(configPath, 'utf-8');
  return toml.parse(fileContent) as Config;
}

