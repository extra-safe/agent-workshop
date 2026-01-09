import fs from 'fs';
import path from 'path';
import toml from 'toml';

/**
 * Configuration interface for the Agent.
 * This structure should match your config.toml file.
 */
export interface Config {
  nats: {
    url: string;
    subject_registration: string;
    subject_suffix: string;
  };
  openai: {
    api_key: string;
    model: string;
  };
  slack: {
    bot_token: string;
  };
  // Add any additional service configurations here (e.g., API keys for external tools)
}

/**
 * Loads configuration from config.toml in the current working directory.
 * If config.toml is missing, it falls back to config.toml.template.
 */
export function loadConfig(): Config {
  const configPath = path.resolve(process.cwd(), 'config.toml');
  
  if (!fs.existsSync(configPath)) {
    console.warn('config.toml not found, using template values. Please ensure you have configured your environment.');
    const templatePath = path.resolve(process.cwd(), 'config.toml.template');
    const fileContent = fs.readFileSync(templatePath, 'utf-8');
    return toml.parse(fileContent) as Config;
  }
  
  const fileContent = fs.readFileSync(configPath, 'utf-8');
  return toml.parse(fileContent) as Config;
}

