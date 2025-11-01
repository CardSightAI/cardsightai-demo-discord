/**
 * Configuration Management
 *
 * This module handles all configuration for the Discord bot,
 * loading environment variables and validating required settings.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Bot configuration interface
 */
export interface Config {
  // Discord Configuration
  discord: {
    token: string;
    clientId: string;
  };

  // CardSight AI Configuration
  cardsight: {
    apiKey: string;
    timeout?: number;
  };

  // Application Configuration
  app: {
    logLevel: string;
    nodeEnv: string;
  };
}

/**
 * Validates that a required environment variable is present
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Configuration object containing all app settings
 */
export const config: Config = {
  discord: {
    token: getRequiredEnv('DISCORD_TOKEN'),
    clientId: getRequiredEnv('DISCORD_CLIENT_ID'),
  },

  cardsight: {
    apiKey: getRequiredEnv('CARDSIGHTAI_API_KEY'),
    timeout: process.env['CARDSIGHTAI_TIMEOUT']
      ? parseInt(process.env['CARDSIGHTAI_TIMEOUT'], 10)
      : 30000, // Default 30 seconds
  },

  app: {
    logLevel: getOptionalEnv('LOG_LEVEL', 'info'),
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
  },
};

/**
 * Validates the configuration on startup
 *
 * Note: Uses console.* methods instead of Winston logger to avoid circular dependency,
 * as this runs during initialization before the logger is fully configured.
 */
export function validateConfig(): void {
  // Check Discord configuration
  if (
    !config.discord.token.startsWith('Bot ') &&
    !config.discord.token.match(/^[\w-]+\.[\w-]+\.[\w-]+$/)
  ) {
    console.warn('⚠️  Discord token appears to be in an unexpected format');
  }

  // Check CardSight configuration
  if (config.cardsight.apiKey.length < 10) {
    console.warn('⚠️  CardSight API key appears to be too short');
  }

  // Check timeout is reasonable
  if (
    config.cardsight.timeout &&
    (config.cardsight.timeout < 1000 || config.cardsight.timeout > 300000)
  ) {
    console.warn('⚠️  CardSight timeout should be between 1 and 300 seconds');
  }

  // eslint-disable-next-line no-console
  console.log('✓ Configuration validated successfully');
}
