/**
 * Discord Embed Builder
 *
 * Creates rich Discord embeds for displaying card identification results.
 */

import { EmbedBuilder } from 'discord.js';
import { ConfidenceColors, ConfidenceEmojis } from '../types/index.js';
import type { CardDetection, CardIdentificationResult } from './cardsight.js';
import { formatCardDisplay } from './cardsight.js';

/**
 * Creates an embed for successful card identification
 *
 * @param result - The identification result
 * @param imageUrl - Optional URL of the uploaded image for thumbnail
 * @returns Discord embed
 */
export function createIdentificationEmbed(
  result: CardIdentificationResult,
  imageUrl?: string
): EmbedBuilder {
  // Handle no detections
  if (result.detections.length === 0) {
    return createNoDetectionEmbed();
  }

  // Handle single detection
  if (result.detections.length === 1) {
    return createSingleCardEmbed(result.detections[0], result.processingTime, imageUrl);
  }

  // Handle multiple detections
  return createMultipleCardsEmbed(result.detections, result.processingTime, imageUrl);
}

/**
 * Creates an embed for a single card detection
 */
function createSingleCardEmbed(
  detection: CardDetection,
  processingTime: number,
  imageUrl?: string
): EmbedBuilder {
  const { card, confidence } = detection;

  const embed = new EmbedBuilder()
    .setTitle('📸 Card Identified!')
    .setColor(ConfidenceColors[confidence])
    .addFields(
      {
        name: '**Card Details**',
        value: formatCardDetails(card),
        inline: false,
      },
      {
        name: '**Set Information**',
        value: formatSetInfo(card),
        inline: true,
      },
      {
        name: '**Confidence**',
        value: `${ConfidenceEmojis[confidence]} ${confidence}`,
        inline: true,
      }
    )
    .setFooter({
      text: `Powered by CardSight AI • ${(processingTime / 1000).toFixed(2)}s`,
    })
    .setTimestamp();

  // Add thumbnail if URL provided
  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  // Add parallel information if applicable
  if (card.parallel) {
    embed.addFields({
      name: '**Parallel Information**',
      value: formatParallelInfo(card),
      inline: false,
    });
  }

  return embed;
}

/**
 * Creates an embed for multiple card detections
 */
function createMultipleCardsEmbed(
  detections: CardDetection[],
  processingTime: number,
  imageUrl?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`📸 ${detections.length} Cards Identified!`)
    .setColor(ConfidenceColors.Info)
    .setDescription('Multiple cards detected in the image:')
    .setFooter({
      text: `Powered by CardSight AI • ${(processingTime / 1000).toFixed(2)}s`,
    })
    .setTimestamp();

  // Add thumbnail if URL provided
  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  // Add each detection as a field
  detections.forEach((detection, index) => {
    const { card, confidence } = detection;
    const cardName = formatCardDisplay(card);
    const confidenceStr = `${ConfidenceEmojis[confidence]} ${confidence} Confidence`;

    embed.addFields({
      name: `Card ${index + 1}`,
      value: `**${cardName}**\n${confidenceStr}`,
      inline: false,
    });
  });

  return embed;
}

/**
 * Creates an embed for when no cards are detected
 */
function createNoDetectionEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ No Cards Detected')
    .setColor(ConfidenceColors.Error)
    .setDescription(
      'No trading cards were detected in the image.\n\n' +
        '**Tips for better results:**\n' +
        '• Ensure the card is clearly visible\n' +
        '• Use good lighting\n' +
        '• Avoid blurry or angled photos\n' +
        '• Try to capture the entire card'
    )
    .setFooter({
      text: 'Powered by CardSight AI',
    })
    .setTimestamp();
}

/**
 * Creates an error embed
 *
 * @param errorMessage - The error message to display
 * @param requestId - Optional request ID for debugging
 * @returns Discord embed
 */
export function createErrorEmbed(errorMessage: string, requestId?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('❌ Error')
    .setColor(ConfidenceColors.Error)
    .setDescription(errorMessage)
    .setTimestamp();

  if (requestId) {
    embed.setFooter({
      text: `Request ID: ${requestId}`,
    });
  }

  return embed;
}

/**
 * Creates a processing embed (shown while identifying)
 */
export function createProcessingEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🔍 Identifying Card...')
    .setColor(ConfidenceColors.Info)
    .setDescription('Please wait while we identify your card.')
    .setFooter({
      text: 'Powered by CardSight AI',
    })
    .setTimestamp();
}

/**
 * Formats card details for display
 */
function formatCardDetails(card: CardDetection['card']): string {
  const lines: string[] = [];
  if (card.name) {
    lines.push(`**Name:** ${card.name}`);
  }
  if (card.number) {
    lines.push(`**Card Number:** ${card.number}`);
  }
  if (card.year) {
    lines.push(`**Year:** ${card.year}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'No card details available';
}

/**
 * Formats set information for display
 */
function formatSetInfo(card: CardDetection['card']): string {
  const lines: string[] = [];
  if (card.setName) {
    lines.push(`**Set:** ${card.setName}`);
  }
  if (card.releaseName) {
    lines.push(`**Release:** ${card.releaseName}`);
  }
  if (card.manufacturer) {
    lines.push(`**Manufacturer:** ${card.manufacturer}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'No set information available';
}

/**
 * Formats parallel information for display
 */
function formatParallelInfo(card: CardDetection['card']): string {
  const lines: string[] = [];

  if (card.parallel?.name) {
    lines.push(`**Parallel:** ${card.parallel.name}`);
  }

  if (card.parallel?.numberedTo) {
    lines.push(`**Numbered:** /${card.parallel.numberedTo}`);
  }

  return lines.join('\n');
}

/**
 * Creates an embed for invalid file type
 */
export function createInvalidFileEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ Invalid File Type')
    .setColor(ConfidenceColors.Error)
    .setDescription(
      'Please upload a valid image file.\n\n' +
        '**Supported formats:**\n' +
        '• JPEG/JPG\n' +
        '• PNG\n' +
        '• WebP\n' +
        '• GIF'
    )
    .setFooter({
      text: 'Powered by CardSight AI',
    })
    .setTimestamp();
}

/**
 * Creates an embed for file too large
 */
export function createFileTooLargeEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ File Too Large')
    .setColor(ConfidenceColors.Error)
    .setDescription(
      'The uploaded file is too large.\n\n' +
        '**Maximum file size:** 8MB\n\n' +
        'Please compress or resize your image and try again.'
    )
    .setFooter({
      text: 'Powered by CardSight AI',
    })
    .setTimestamp();
}
