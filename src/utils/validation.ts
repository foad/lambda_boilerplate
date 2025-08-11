/**
 * Input validation utilities for API requests
 */

// Import types as needed for validation

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate create todo request
 */
export function validateCreateTodoRequest(body: any): ValidationResult {
  const errors: string[] = [];

  // Check if body exists
  if (!body) {
    errors.push("Request body is required");
    return { isValid: false, errors };
  }

  // Validate title field
  if (body.title === undefined || body.title === null) {
    errors.push("Title is required");
  } else if (typeof body.title !== "string") {
    errors.push("Title must be a string");
  } else if (body.title.trim().length === 0) {
    errors.push("Title cannot be empty");
  } else if (body.title.length > 255) {
    errors.push("Title cannot exceed 255 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate todo ID parameter
 */
export function validateTodoId(id: unknown): ValidationResult {
  const errors: string[] = [];

  if (!id) {
    errors.push("Todo ID is required");
  } else if (typeof id !== "string") {
    errors.push("Todo ID must be a string");
  } else if (id.trim().length === 0) {
    errors.push("Todo ID cannot be empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize and normalize string input
 */
export function sanitizeString(input: string): string {
  return input.trim();
}

/**
 * Parse and validate JSON request body
 */
export function parseRequestBody<T>(body: string | null): T | null {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}
