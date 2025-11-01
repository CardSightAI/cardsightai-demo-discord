/**
 * Type Definitions
 *
 * Central location for all TypeScript type definitions used across the bot.
 */

import type { ChatInputCommandInteraction } from 'discord.js';

import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

/**
 * Structure of a Discord slash command
 */
export interface Command {
  // Command definition using Discord.js builder
  data: {
    name: string;
    description: string;
    toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody;
  };

  // Command execution handler
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * CardSight identification confidence levels
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Color codes for Discord embeds based on confidence
 */
export const ConfidenceColors = {
  High: 0x00ff00, // Green
  Medium: 0xffff00, // Yellow
  Low: 0xff0000, // Red
  Error: 0x8b0000, // Dark red
  Info: 0x0099ff, // Blue
} as const;

/**
 * Confidence emojis for better visual representation
 */
export const ConfidenceEmojis = {
  High: '🟢',
  Medium: '🟡',
  Low: '🔴',
} as const;

/**
 * Supported image formats for card identification
 */
export const SupportedImageFormats = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Maximum file size for uploads (in bytes)
 * Discord's limit is 8MB for regular users
 */
export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
