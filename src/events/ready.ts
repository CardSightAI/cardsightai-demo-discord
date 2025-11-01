/**
 * Ready Event Handler
 *
 * This event is triggered when the Discord bot successfully connects and is ready.
 */

import type { Client } from 'discord.js';
import { Events, REST, Routes } from 'discord.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { validateCardSightConnection } from '../utils/cardsight.js';
import type { Command } from '../types/index.js';

/**
 * Handles the ready event
 */
export async function handleReady(client: Client, commands: Map<string, Command>): Promise<void> {
  if (!client.user) {
    logger.error('Bot user is not available');
    return;
  }

  logger.info(`✅ Bot is online as ${client.user.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} guilds`);

  // Set bot activity
  client.user.setActivity('for /identify', { type: 2 }); // Type 2 = "Listening"

  // Validate CardSight connection
  const isCardSightValid = await validateCardSightConnection();
  if (!isCardSightValid) {
    logger.error(
      'Failed to validate CardSight connection - bot will continue but may not work properly'
    );
  }

  // Register slash commands
  await registerCommands(commands);
}

/**
 * Registers slash commands with Discord
 */
async function registerCommands(commands: Map<string, Command>): Promise<void> {
  try {
    logger.info('Started refreshing application (/) commands.');

    const rest = new REST({ version: '10' }).setToken(config.discord.token);

    // Convert commands to JSON for registration
    const commandsData = Array.from(commands.values()).map((command) => command.data.toJSON());

    // Register commands globally
    const data = (await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: commandsData,
    })) as any[];

    logger.info(`Successfully registered ${data.length} application (/) commands globally.`);

    // Log registered commands
    data.forEach((cmd) => {
      logger.info(`  - /${cmd.name}: ${cmd.description}`);
    });
  } catch (error) {
    logger.error('Failed to register commands', { error });
  }
}

/**
 * Creates the ready event handler
 */
export function createReadyHandler(commands: Map<string, Command>) {
  return {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
      await handleReady(client, commands);
    },
  };
}
