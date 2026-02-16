/**
 * CardSight API Integration
 *
 * This module wraps the CardSight AI SDK and provides helper functions
 * for card identification and processing.
 */

import { CardSightAI, AuthenticationError, CardSightAIError } from 'cardsightai';
import type { CardDetection, DetectedCard, IdentifyResult } from 'cardsightai';
import { config } from '../config/index.js';
import { logger, logApiCall, logError, logDebug } from './logger.js';

export type { CardDetection, DetectedCard, IdentifyResult };

// Initialize the CardSight client
export const cardsightClient = new CardSightAI({
  apiKey: config.cardsight.apiKey,
  timeout: config.cardsight.timeout,
});

/**
 * Result from card identification
 */
export interface CardIdentificationResult {
  success: boolean;
  detections: CardDetection[];
  processingTime: number;
  requestId?: string;
  error?: string;
}

/**
 * Identifies cards from an image buffer
 *
 * @param imageBuffer - The image data as a Buffer
 * @param filename - Original filename for context
 * @param mimeType - MIME type of the image
 * @returns Identification results
 */
export async function identifyCard(
  imageBuffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<CardIdentificationResult> {
  const startTime = Date.now();

  try {
    logDebug(`Starting card identification for file: ${filename}`, {
      fileSize: imageBuffer.length,
      mimeType,
    });

    // Call the CardSight API
    // Create a Blob from the Buffer with the correct MIME type
    const blob = new Blob([imageBuffer], {
      type: mimeType || 'image/jpeg',
    });
    const result = await cardsightClient.identify.card(blob);

    const processingTime = Date.now() - startTime;
    logApiCall('identify.card', processingTime, true);

    // Check if we got a successful response
    if (!result.data || !result.data.success) {
      return {
        success: false,
        detections: [],
        processingTime,
        error: 'Card identification failed',
      };
    }

    // Process detections
    const detections: CardDetection[] = result.data.detections ?? [];

    logDebug(`Identification complete`, {
      detectionsCount: detections.length,
      processingTime,
    });

    return {
      success: true,
      detections,
      processingTime,
      requestId: result.data.requestId,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logApiCall('identify.card', processingTime, false);

    // Handle specific error types
    if (error instanceof AuthenticationError) {
      logError('Authentication failed with CardSight API', error);
      return {
        success: false,
        detections: [],
        processingTime,
        error: 'Authentication failed. Please check your API key.',
      };
    } else if (error instanceof CardSightAIError) {
      // CardSightAIError has status property
      logError('CardSight API error', error, {
        status: error.status,
        requestId:
          (error as { requestId?: string; request?: { id?: string } }).requestId ||
          (error as { request?: { id?: string } }).request?.id,
      });

      // Provide user-friendly error messages
      let errorMessage = 'Failed to identify card';
      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.status === 413) {
        errorMessage = 'Image is too large. Please use a smaller image.';
      } else if (error.status && error.status >= 500) {
        errorMessage = 'CardSight service is temporarily unavailable.';
      }

      const errorWithRequest = error as { requestId?: string; request?: { id?: string } };
      return {
        success: false,
        detections: [],
        processingTime,
        error: errorMessage,
        requestId: errorWithRequest.requestId || errorWithRequest.request?.id,
      };
    } else {
      logError('Unexpected error during card identification', error);
      return {
        success: false,
        detections: [],
        processingTime,
        error: 'An unexpected error occurred',
      };
    }
  }
}

/**
 * Formats a card display name
 *
 * @param card - Card information
 * @returns Formatted display string
 */
export function formatCardDisplay(card: CardDetection['card']): string {
  const parts = [
    card.year,
    card.setName,
    card.name ? `- ${card.name}` : null,
    card.number ? `#${card.number}` : null,
  ].filter(Boolean);
  let display = parts.join(' ') || 'Unknown Card';

  if (card.parallel?.name) {
    display += ` (${card.parallel.name}`;
    if (card.parallel.numberedTo) {
      display += ` /${card.parallel.numberedTo}`;
    }
    display += ')';
  }

  return display;
}

/**
 * Validates that the CardSight client is properly configured
 */
export async function validateCardSightConnection(): Promise<boolean> {
  try {
    logger.info('Validating CardSight API connection...');

    // Try to check health
    const health = await cardsightClient.health.check();

    if (health.data?.status) {
      logger.info('CardSight API connection validated successfully');
      return true;
    }

    return false;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logError('Invalid CardSight API key', error);
    } else {
      logError('Failed to validate CardSight connection', error);
    }
    return false;
  }
}
