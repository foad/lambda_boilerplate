/**
 * Authentication utilities for extracting user context from API Gateway events
 */

import { APIGatewayProxyEvent } from "aws-lambda";

export interface UserContext {
  userId: string;
  email?: string;
  username?: string;
}

export interface AuthError {
  message: string;
  code: string;
}

/**
 * Extract user context from API Gateway event when using Cognito User Pool authorizer
 * When authentication is enabled, API Gateway adds the authorizer context to the event
 */
export function extractUserContext(
  event: APIGatewayProxyEvent
): UserContext | AuthError {
  try {
    // Check if authentication is enabled by looking for authorizer context
    const authContext = event.requestContext.authorizer;

    if (!authContext) {
      // If no authorizer context, authentication might be disabled
      // For backward compatibility, we'll use a default user
      return {
        userId: "anonymous",
        username: "anonymous",
      };
    }

    // Extract user information from Cognito User Pool authorizer claims
    // The authorizer context contains the JWT claims
    const claims = authContext.claims;

    if (!claims) {
      return {
        message: "No user claims found in authorization context",
        code: "MISSING_CLAIMS",
      };
    }

    // Extract user ID from the 'sub' claim (standard JWT claim for subject/user ID)
    const userId = claims.sub;
    if (!userId) {
      return {
        message: "User ID not found in JWT claims",
        code: "MISSING_USER_ID",
      };
    }

    // Extract additional user information if available
    const email = claims.email;
    const username = claims["cognito:username"] || claims.username;

    return {
      userId,
      email,
      username,
    };
  } catch (error) {
    console.error("Error extracting user context:", error);
    return {
      message: "Failed to extract user context from request",
      code: "AUTH_EXTRACTION_ERROR",
    };
  }
}

/**
 * Check if the extracted context is an error
 */
export function isAuthError(
  context: UserContext | AuthError
): context is AuthError {
  return "message" in context && "code" in context;
}

/**
 * Get user ID from the event, handling both authenticated and anonymous cases
 */
export function getUserId(event: APIGatewayProxyEvent): string | AuthError {
  const context = extractUserContext(event);

  if (isAuthError(context)) {
    return context;
  }

  return context.userId;
}
