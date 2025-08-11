/**
 * Unit tests for validation utilities
 */

import {
  validateCreateTodoRequest,
  validateTodoId,
  sanitizeString,
  parseRequestBody,
} from "./validation";

describe("Validation Utilities", () => {
  describe("validateCreateTodoRequest", () => {
    test("should validate valid request", () => {
      const validRequest = { title: "Valid todo title" };
      const result = validateCreateTodoRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject null body", () => {
      const result = validateCreateTodoRequest(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Request body is required");
    });

    test("should reject undefined body", () => {
      const result = validateCreateTodoRequest(undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Request body is required");
    });

    test("should reject missing title", () => {
      const request = {};
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title is required");
    });

    test("should reject null title", () => {
      const request = { title: null };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title is required");
    });

    test("should reject non-string title", () => {
      const request = { title: 123 };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title must be a string");
    });

    test("should reject empty string title", () => {
      const request = { title: "" };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title cannot be empty");
    });

    test("should reject whitespace-only title", () => {
      const request = { title: "   " };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title cannot be empty");
    });

    test("should reject title exceeding 255 characters", () => {
      const longTitle = "a".repeat(256);
      const request = { title: longTitle };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title cannot exceed 255 characters");
    });

    test("should accept title with exactly 255 characters", () => {
      const maxTitle = "a".repeat(255);
      const request = { title: maxTitle };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should accept title with leading/trailing whitespace", () => {
      const request = { title: "  Valid title  " };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should handle multiple validation errors", () => {
      const request = { title: 123 };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title must be a string");
    });

    test("should accept valid title with special characters", () => {
      const request = { title: "Todo with émojis 🚀 and symbols @#$%" };
      const result = validateCreateTodoRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateTodoId", () => {
    const validUUID = "123e4567-e89b-42d3-a456-426614174000";

    test("should validate valid UUID", () => {
      const result = validateTodoId(validUUID);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject null ID", () => {
      const result = validateTodoId(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Todo ID is required");
    });

    test("should reject undefined ID", () => {
      const result = validateTodoId(undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Todo ID is required");
    });

    test("should reject empty string ID", () => {
      const result = validateTodoId("");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Todo ID is required");
    });

    test("should reject whitespace-only ID", () => {
      const result = validateTodoId("   ");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Todo ID cannot be empty");
    });

    test("should reject non-string ID", () => {
      const result = validateTodoId(123);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Todo ID must be a string");
    });

    test("should accept any non-empty string as valid ID", () => {
      const validIds = [
        "123e4567-e89b-42d3-a456-426614174000",
        "simple-id",
        "123",
        "todo_1",
        "UPPERCASE-ID",
        "mixed-Case_123",
      ];

      validIds.forEach((validId) => {
        const result = validateTodoId(validId);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe("sanitizeString", () => {
    test("should trim whitespace from string", () => {
      const input = "  hello world  ";
      const result = sanitizeString(input);

      expect(result).toBe("hello world");
    });

    test("should handle string with no whitespace", () => {
      const input = "hello";
      const result = sanitizeString(input);

      expect(result).toBe("hello");
    });

    test("should handle empty string", () => {
      const input = "";
      const result = sanitizeString(input);

      expect(result).toBe("");
    });

    test("should handle whitespace-only string", () => {
      const input = "   ";
      const result = sanitizeString(input);

      expect(result).toBe("");
    });

    test("should handle string with internal whitespace", () => {
      const input = "  hello   world  ";
      const result = sanitizeString(input);

      expect(result).toBe("hello   world");
    });

    test("should handle string with newlines and tabs", () => {
      const input = "\n\t  hello world  \t\n";
      const result = sanitizeString(input);

      expect(result).toBe("hello world");
    });
  });

  describe("parseRequestBody", () => {
    test("should parse valid JSON", () => {
      const jsonString = '{"title": "Test todo", "priority": "high"}';
      const result = parseRequestBody(jsonString);

      expect(result).toEqual({ title: "Test todo", priority: "high" });
    });

    test("should return null for null input", () => {
      const result = parseRequestBody(null);

      expect(result).toBeNull();
    });

    test("should return null for empty string", () => {
      const result = parseRequestBody("");

      expect(result).toBeNull();
    });

    test("should throw error for invalid JSON", () => {
      const invalidJson = '{"title": "Test todo", "priority":}';

      expect(() => parseRequestBody(invalidJson)).toThrow(
        "Invalid JSON in request body"
      );
    });

    test("should throw error for malformed JSON", () => {
      const malformedJson = "not json at all";

      expect(() => parseRequestBody(malformedJson)).toThrow(
        "Invalid JSON in request body"
      );
    });

    test("should parse JSON with nested objects", () => {
      const jsonString = '{"todo": {"title": "Test", "meta": {"priority": 1}}}';
      const result = parseRequestBody(jsonString);

      expect(result).toEqual({
        todo: {
          title: "Test",
          meta: { priority: 1 },
        },
      });
    });

    test("should parse JSON with arrays", () => {
      const jsonString = '{"tags": ["work", "urgent"], "count": 2}';
      const result = parseRequestBody(jsonString);

      expect(result).toEqual({
        tags: ["work", "urgent"],
        count: 2,
      });
    });

    test("should handle JSON with null values", () => {
      const jsonString = '{"title": "Test", "description": null}';
      const result = parseRequestBody(jsonString);

      expect(result).toEqual({
        title: "Test",
        description: null,
      });
    });

    test("should handle JSON with boolean values", () => {
      const jsonString =
        '{"title": "Test", "completed": false, "urgent": true}';
      const result = parseRequestBody(jsonString);

      expect(result).toEqual({
        title: "Test",
        completed: false,
        urgent: true,
      });
    });

    test("should handle JSON with number values", () => {
      const jsonString = '{"title": "Test", "priority": 5, "progress": 0.75}';
      const result = parseRequestBody(jsonString);

      expect(result).toEqual({
        title: "Test",
        priority: 5,
        progress: 0.75,
      });
    });
  });
});
