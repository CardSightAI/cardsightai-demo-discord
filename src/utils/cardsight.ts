/**
 * CardSight API Integration
 *
 * This module wraps the CardSight AI SDK and provides helper functions
 * for card identification and processing.
 */

import { CardSightAI, AuthenticationError, CardSightAIError } from 'cardsightai';
import { config } from '../config/index.js';
import { logger, logApiCall, logError, logDebug } from './logger.js';
import type { ConfidenceLevel } from '../types/index.js';

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
 * Individual card detection
 */
export interface CardDetection {
  confidence: ConfidenceLevel;
  card: {
    id: string;
    name: string;
    year: number;
    manufacturer: string;
    releaseName: string;
    setName: string;
    number: string;
    // Optional parallel information
    isParallel?: boolean;
    parallelName?: string;
    numberedTo?: number;
  };
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
    const detections: CardDetection[] = result.data.detections.map((detection: any) => ({
      confidence: detection.confidence as ConfidenceLevel,
      card: {
        id: detection.card.id,
        name: detection.card.name,
        year: detection.card.year,
        manufacturer: detection.card.manufacturer,
        releaseName: detection.card.releaseName,
        setName: detection.card.setName,
        number: detection.card.number,
        isParallel: detection.card.isParallel,
        parallelName: detection.card.parallelName,
        numberedTo: detection.card.numberedTo,
      },
    }));

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
 * Filters detections by confidence level
 *
 * @param detections - Array of card detections
 * @param minConfidence - Minimum confidence level to include
 * @returns Filtered detections
 */
export function filterByConfidence(
  detections: CardDetection[],
  minConfidence: ConfidenceLevel = 'Low'
): CardDetection[] {
  const confidenceOrder = ['Low', 'Medium', 'High'];
  const minIndex = confidenceOrder.indexOf(minConfidence);

  return detections.filter((detection) => {
    const detectionIndex = confidenceOrder.indexOf(detection.confidence);
    return detectionIndex >= minIndex;
  });
}

/**
 * Gets the highest confidence detection from results
 *
 * @param detections - Array of card detections
 * @returns The detection with highest confidence, or undefined
 */
export function getHighestConfidenceDetection(
  detections: CardDetection[]
): CardDetection | undefined {
  if (detections.length === 0) {
    return undefined;
  }

  const confidenceOrder = ['High', 'Medium', 'Low'];

  return detections.reduce((best, current) => {
    const bestIndex = confidenceOrder.indexOf(best.confidence);
    const currentIndex = confidenceOrder.indexOf(current.confidence);
    return currentIndex < bestIndex ? current : best;
  });
}

/**
 * Formats a card display name
 *
 * @param card - Card information
 * @returns Formatted display string
 */
export function formatCardDisplay(card: CardDetection['card']): string {
  let display = `${card.year} ${card.setName} - ${card.name} #${card.number}`;

  if (card.isParallel && card.parallelName) {
    display += ` (${card.parallelName}`;
    if (card.numberedTo) {
      display += ` /${card.numberedTo}`;
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

    if (health.data) {
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
