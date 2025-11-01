/**
 * Logging Utility
 *
 * Structured logging using Winston for better debugging and monitoring.
 */

import winston from 'winston';
import { config } from '../config/index.js';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console log format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `[${String(timestamp)}] ${String(level)}: ${String(message)}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Handle error objects specially
      if (meta.error && meta.error instanceof Error) {
        msg += `\n  Error: ${meta.error.message}`;
        if (meta.error.stack && config.app.nodeEnv === 'development') {
          msg += `\n  Stack: ${meta.error.stack}`;
        }
      } else {
        // Format other metadata
        const metaStr = Object.entries(meta)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(' ');
        if (metaStr) {
          msg += ` | ${metaStr}`;
        }
      }
    }

    return msg;
  })
);

// Create the logger instance
export const logger = winston.createLogger({
  level: config.app.logLevel,
  format: logFormat,
  defaultMeta: { service: 'cardsight-discord-bot' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.app.nodeEnv === 'production' ? logFormat : consoleFormat,
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: logFormat,
    }),

    // File transport for all logs (optional, only in production)
    ...(config.app.nodeEnv === 'production'
      ? [
          new winston.transports.File({
            filename: 'combined.log',
            format: logFormat,
          }),
        ]
      : []),
  ],
});

// Helper functions for common logging patterns

/**
 * Logs a Discord interaction
 */
export function logInteraction(
  interaction: { user: { tag: string; id: string }; commandName?: string },
  action: string
): void {
  logger.info(`Discord interaction: ${action}`, {
    user: interaction.user.tag,
    userId: interaction.user.id,
    command: interaction.commandName,
    action,
  });
}

/**
 * Logs an API call to CardSight
 */
export function logApiCall(endpoint: string, duration?: number, success?: boolean): void {
  logger.info(`CardSight API call`, {
    endpoint,
    duration: duration ? `${duration}ms` : undefined,
    success,
  });
}

/**
 * Logs an error with context
 */
export function logError(message: string, error: unknown, context?: Record<string, unknown>): void {
  logger.error(message, {
    error: error instanceof Error ? error : new Error(String(error)),
    ...context,
  });
}

/**
 * Logs a warning
 */
export function logWarning(message: string, details?: Record<string, unknown>): void {
  logger.warn(message, details);
}

/**
 * Logs debug information (only shown in development or with debug log level)
 */
export function logDebug(message: string, data?: unknown): void {
  logger.debug(message, { data });
}
