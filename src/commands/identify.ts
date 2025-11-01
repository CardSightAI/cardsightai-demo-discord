/**
 * Identify Command
 *
 * Slash command for identifying trading cards from uploaded images.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { identifyCard } from '../utils/cardsight.js';
import {
  createIdentificationEmbed,
  createErrorEmbed,
  createProcessingEmbed,
  createInvalidFileEmbed,
  createFileTooLargeEmbed,
} from '../utils/embedBuilder.js';
import { logger, logDebug } from '../utils/logger.js';
import { SupportedImageFormats, MAX_FILE_SIZE, type Command } from '../types/index.js';

/**
 * The /identify command
 */
export const identifyCommand: Command = {
  // Command definition
  data: new SlashCommandBuilder()
    .setName('identify')
    .setDescription('Identify a trading card from an image')
    .addAttachmentOption((option) =>
      option.setName('image').setDescription('The card image to identify').setRequired(true)
    ),

  // Command execution
  async execute(interaction: ChatInputCommandInteraction) {
    // Get the uploaded attachment
    const attachment = interaction.options.getAttachment('image', true);

    // Sanitize filename to prevent path traversal and other attacks
    const sanitizedFilename = attachment.name
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove potentially dangerous characters
      .substring(0, 255); // Limit length

    logDebug('Identify command invoked', {
      user: interaction.user.tag,
      fileName: sanitizedFilename, // Use sanitized filename in logs
      fileSize: attachment.size,
      contentType: attachment.contentType,
    });

    // Validate file type
    if (!attachment.contentType || !SupportedImageFormats.includes(attachment.contentType as any)) {
      await interaction.reply({
        embeds: [createInvalidFileEmbed()],
        ephemeral: true,
      });
      return;
    }

    // Validate file size
    if (attachment.size > MAX_FILE_SIZE) {
      await interaction.reply({
        embeds: [createFileTooLargeEmbed()],
        ephemeral: true,
      });
      return;
    }

    // Show processing message
    await interaction.reply({
      embeds: [createProcessingEmbed()],
    });

    try {
      // Download the image
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Identify the card (pass the MIME type from the attachment)
      const result = await identifyCard(
        imageBuffer,
        sanitizedFilename, // Use sanitized filename
        attachment.contentType || undefined
      );

      // Create response embed (pass attachment URL for thumbnail)
      let embed;
      if (result.success) {
        embed = createIdentificationEmbed(result, attachment.url);
      } else {
        embed = createErrorEmbed(result.error || 'Failed to identify card', result.requestId);
      }

      // Update the reply with results
      await interaction.editReply({
        embeds: [embed],
      });

      // Log successful identification
      if (result.success && result.detections.length > 0) {
        logger.info('Card identification successful', {
          user: interaction.user.tag,
          detectionsCount: result.detections.length,
          processingTime: result.processingTime,
        });
      }
    } catch (error) {
      logger.error('Failed to process card identification', {
        error: error instanceof Error ? error.message : String(error),
        user: interaction.user.tag,
      });

      const errorEmbed = createErrorEmbed(
        'Failed to process the image. Please try again with a different image.'
      );

      await interaction.editReply({
        embeds: [errorEmbed],
      });
    }
  },
};
