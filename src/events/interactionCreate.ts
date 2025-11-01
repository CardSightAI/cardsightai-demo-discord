/**
 * Interaction Create Event Handler
 *
 * Handles all Discord interactions, including slash commands.
 */

import type { Interaction } from 'discord.js';
import { Events } from 'discord.js';
import { logger, logInteraction, logError } from '../utils/logger.js';
import { createErrorEmbed } from '../utils/embedBuilder.js';
import type { Command } from '../types/index.js';

/**
 * Handles the interactionCreate event
 */
export async function handleInteractionCreate(
  interaction: Interaction,
  commands: Map<string, Command>
): Promise<void> {
  // Only handle chat input commands
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown command: ${interaction.commandName}`, {
      user: interaction.user.tag,
      userId: interaction.user.id,
    });

    await interaction.reply({
      embeds: [createErrorEmbed('Unknown command.')],
      ephemeral: true,
    });
    return;
  }

  try {
    logInteraction(interaction, 'command-start');

    // Execute the command
    await command.execute(interaction);

    logInteraction(interaction, 'command-success');
  } catch (error) {
    logError(`Error executing command ${interaction.commandName}`, error, {
      user: interaction.user.tag,
      userId: interaction.user.id,
    });

    // Send error message to user
    const errorEmbed = createErrorEmbed(
      'There was an error while executing this command.\n' +
        'Please try again later or contact support if the issue persists.'
    );

    // Try to reply or follow up depending on interaction state
    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else if (interaction.replied) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (replyError) {
      logError('Failed to send error message to user', replyError);
    }
  }
}

/**
 * Creates the interactionCreate event handler
 */
export function createInteractionHandler(commands: Map<string, Command>) {
  return {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
      await handleInteractionCreate(interaction, commands);
    },
  };
}
