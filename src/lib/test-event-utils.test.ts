/**
 * Unit tests for test event utilities
 */

import {
  createMockEvent,
  createMockCreateTodoEvent,
  createMockReadTodosEvent,
  createMockUpdateTodoEvent,
  createMockEventWithClaims,
  createMockEventWithEmptyAuth,
} from "./test-event-utils";

describe("Test Event Utils", () => {
  describe("createMockEvent", () => {
    test("should create event with default values", () => {
      const event = createMockEvent();

      expect(event.httpMethod).toBe("GET");
      expect(event.path).toBe("/todos");
      expect(event.body).toBeNull();
      expect(event.requestContext.authorizer?.claims?.sub).toBe(
        "test-user-123"
      );
      expect(event.requestContext.authorizer?.claims?.email).toBe(
        "test@example.com"
      );
    });

    test("should create event with custom values", () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/custom",
        body: '{"test": true}',
        userId: "custom-user",
        userEmail: "custom@example.com",
      });

      expect(event.httpMethod).toBe("POST");
      expect(event.path).toBe("/custom");
      expect(event.body).toBe('{"test": true}');
      expect(event.requestContext.authorizer?.claims?.sub).toBe("custom-user");
      expect(event.requestContext.authorizer?.claims?.email).toBe(
        "custom@example.com"
      );
    });

    test("should create event with path parameters", () => {
      const event = createMockEvent({
        pathParameters: { id: "test-id" },
      });

      expect(event.pathParameters).toEqual({ id: "test-id" });
    });
  });

  describe("createMockCreateTodoEvent", () => {
    test("should create POST /todos event", () => {
      const event = createMockCreateTodoEvent('{"title": "Test"}');

      expect(event.httpMethod).toBe("POST");
      expect(event.path).toBe("/todos");
      expect(event.body).toBe('{"title": "Test"}');
      expect(event.requestContext.authorizer?.claims?.sub).toBe(
        "test-user-123"
      );
    });

    test("should create event with custom user", () => {
      const event = createMockCreateTodoEvent(
        '{"title": "Test"}',
        "custom-user"
      );

      expect(event.requestContext.authorizer?.claims?.sub).toBe("custom-user");
    });
  });

  describe("createMockReadTodosEvent", () => {
    test("should create GET /todos event", () => {
      const event = createMockReadTodosEvent();

      expect(event.httpMethod).toBe("GET");
      expect(event.path).toBe("/todos");
      expect(event.body).toBeNull();
      expect(event.requestContext.authorizer?.claims?.sub).toBe(
        "test-user-123"
      );
    });
  });

  describe("createMockUpdateTodoEvent", () => {
    test("should create PUT /todos/{id}/complete event", () => {
      const todoId = "test-id";
      const event = createMockUpdateTodoEvent(todoId);

      expect(event.httpMethod).toBe("PUT");
      expect(event.path).toBe(`/todos/${todoId}/complete`);
      expect(event.pathParameters).toEqual({ id: todoId });
      expect(event.requestContext.authorizer?.claims?.sub).toBe(
        "test-user-123"
      );
    });

    test("should handle null todo ID", () => {
      const event = createMockUpdateTodoEvent(null);

      expect(event.path).toBe("/todos/null/complete");
      expect(event.pathParameters).toBeNull();
    });
  });

  describe("createMockEventWithClaims", () => {
    test("should create event with custom claims", () => {
      const customClaims = { sub: "custom-user", role: "admin" };
      const event = createMockEventWithClaims(customClaims);

      expect(event.requestContext.authorizer?.claims).toEqual(customClaims);
    });
  });

  describe("createMockEventWithEmptyAuth", () => {
    test("should create event with empty authorizer", () => {
      const event = createMockEventWithEmptyAuth();

      expect(event.requestContext.authorizer).toEqual({});
    });
  });
});
