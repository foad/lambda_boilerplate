/**
 * Standardized API response utilities for Lambda functions
 */

import { ApiResponse } from "./types";

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): ApiResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify({
      data,
    }),
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_ERROR",
  details?: any
): ApiResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify({
      error: {
        message,
        code,
        details,
      },
    }),
  };
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  message: string,
  details?: any
): ApiResponse {
  return createErrorResponse(message, 400, "VALIDATION_ERROR", details);
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(
  message: string = "Resource not found"
): ApiResponse {
  return createErrorResponse(message, 404, "NOT_FOUND");
}

/**
 * Create an internal server error response
 */
export function createInternalErrorResponse(
  message: string = "Internal server error",
  details?: unknown
): ApiResponse {
  return createErrorResponse(message, 500, "INTERNAL_ERROR", details);
}
