/**
 * CardSight AI Discord Bot Demo
 *
 * Main entry point for the Discord bot that demonstrates CardSight AI's
 * card identification capabilities.
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { createReadyHandler } from './events/ready.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import { identifyCommand } from './commands/identify.js';
import type { Command } from './types/index.js';

// Store commands in a Map for easy access
const commands = new Map<string, Command>();

// Register commands
commands.set(identifyCommand.data.name, identifyCommand);

/**
 * Initialize and start the Discord bot
 */
async function main() {
  try {
    logger.info('🤖 Starting CardSight AI Discord Bot...');

    // Validate configuration
    validateConfig();

    // Create Discord client with necessary intents
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds, // Required for bot to function
        GatewayIntentBits.GuildMessages, // Required to receive messages
      ],
    });

    // Register event handlers
    const readyHandler = createReadyHandler(commands);
    client.once(Events.ClientReady, readyHandler.execute);

    const interactionHandler = createInteractionHandler(commands);
    client.on(Events.InteractionCreate, interactionHandler.execute);

    // Handle process signals for graceful shutdown
    process.on('SIGINT', () => handleShutdown(client));
    process.on('SIGTERM', () => handleShutdown(client));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      handleShutdown(client);
    });

    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled rejection', { error });
    });

    // Connect to Discord
    await client.login(config.discord.token);
  } catch (error) {
    logger.error('Failed to start bot', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Gracefully shut down the bot
 */
function handleShutdown(client: Client): void {
  logger.info('Shutting down bot...');

  // Destroy the Discord client connection
  void client.destroy();

  // Exit the process
  process.exit(0);
}

// Start the bot
void main().catch((error) => {
  logger.error('Fatal error in main function', { error });
  process.exit(1);
});
