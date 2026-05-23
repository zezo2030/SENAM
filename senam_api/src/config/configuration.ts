import { EnvironmentVariables } from './env.schema.js';

export type AppConfig = EnvironmentVariables;

export function loadConfig(): Partial<AppConfig> {
  return process.env as unknown as Partial<AppConfig>;
}
