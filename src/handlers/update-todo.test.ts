/**
 * Unit tests for Update Todo Lambda function
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { handler } from "./update-todo";
import { Todo } from "../lib/types";

// Mock the DynamoDB client
const dynamoMock = mockClient(DynamoDBDocumentClient);

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  dynamoMock.reset();
  process.env = {
    ...originalEnv,
    TODOS_TABLE_NAME: "test-todos-table",
    AWS_REGION: "eu-west-2",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// Helper function to create mock API Gateway event
function createMockEvent(todoId: string | null): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "PUT",
    isBase64Encoded: false,
    path: `/todos/${todoId}/complete`,
    pathParameters: todoId !== null ? { id: todoId } : null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  };
}

// Sample todo for testing
const sampleTodo: Todo = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  title: "Test Todo",
  status: "pending",
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

describe("Update Todo Handler", () => {
  describe("Success Cases", () => {
    test("should update todo status to completed successfully", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      const updatedTodo: Todo = {
        ...sampleTodo,
        status: "completed",
        updatedAt: "2023-01-01T01:00:00.000Z",
      };

      dynamoMock.on(GetCommand).resolves({
        Item: sampleTodo,
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: updatedTodo,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.id).toBe(todoId);
      expect(responseBody.data.status).toBe("completed");
      expect(responseBody.data.title).toBe("Test Todo");

      // Verify DynamoDB was called correctly
      expect(dynamoMock.commandCalls(GetCommand)).toHaveLength(1);
      expect(dynamoMock.commandCalls(UpdateCommand)).toHaveLength(1);

      const getCall = dynamoMock.commandCalls(GetCommand)[0];
      expect(getCall.args[0].input.TableName).toBe("test-todos-table");
      expect(getCall.args[0].input.Key.id).toBe(todoId);

      const updateCall = dynamoMock.commandCalls(UpdateCommand)[0];
      expect(updateCall.args[0].input.TableName).toBe("test-todos-table");
      expect(updateCall.args[0].input.Key.id).toBe(todoId);
      expect(updateCall.args[0].input.UpdateExpression).toBe(
        "SET #status = :status, #updatedAt = :updatedAt"
      );
      expect(
        updateCall.args[0].input.ExpressionAttributeValues[":status"]
      ).toBe("completed");
    });
  });

  describe("Validation Error Cases", () => {
    test("should return 400 when todo ID is missing", async () => {
      // Arrange
      const event = createMockEvent(null);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Invalid todo ID");
      expect(responseBody.error.details.errors).toContain(
        "Todo ID is required"
      );
    });

    test("should return 400 when todo ID is empty string", async () => {
      // Arrange
      const event = createMockEvent("");

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Invalid todo ID");
      expect(responseBody.error.details.errors).toContain(
        "Todo ID is required"
      );
    });

    test("should return 400 when todo ID is whitespace only", async () => {
      // Arrange
      const event = createMockEvent("   ");

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Invalid todo ID");
      expect(responseBody.error.details.errors).toContain(
        "Todo ID cannot be empty"
      );
    });

    test("should accept any non-empty string as valid ID", async () => {
      // Arrange
      const todoId = "simple-id";
      const event = createMockEvent(todoId);

      const updatedTodo: Todo = {
        ...sampleTodo,
        id: todoId,
        status: "completed",
        updatedAt: "2023-01-01T01:00:00.000Z",
      };

      dynamoMock.on(GetCommand).resolves({
        Item: { ...sampleTodo, id: todoId },
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: updatedTodo,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.data.id).toBe(todoId);
    });
  });

  describe("Not Found Cases", () => {
    test("should return 404 when todo does not exist", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      dynamoMock.on(GetCommand).resolves({
        Item: undefined,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(404);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("NOT_FOUND");
      expect(responseBody.error.message).toBe("Todo not found");

      // Verify only GetCommand was called, not UpdateCommand
      expect(dynamoMock.commandCalls(GetCommand)).toHaveLength(1);
      expect(dynamoMock.commandCalls(UpdateCommand)).toHaveLength(0);
    });
  });

  describe("Database Error Cases", () => {
    test("should return 500 when GetCommand fails", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      dynamoMock.on(GetCommand).rejects(new Error("DynamoDB error"));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("INTERNAL_ERROR");
      expect(responseBody.error.message).toBe("Failed to update todo");
    });

    test("should return 500 when UpdateCommand fails", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      dynamoMock.on(GetCommand).resolves({
        Item: sampleTodo,
      });

      dynamoMock.on(UpdateCommand).rejects(new Error("DynamoDB update error"));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("INTERNAL_ERROR");
      expect(responseBody.error.message).toBe("Failed to update todo");
    });

    test("should return 500 when table name environment variable is missing", async () => {
      // Arrange
      delete process.env.TODOS_TABLE_NAME;
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("INTERNAL_ERROR");
      expect(responseBody.error.message).toBe("Failed to update todo");
    });
  });

  describe("Response Format", () => {
    test("should include proper CORS headers", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      const updatedTodo: Todo = {
        ...sampleTodo,
        status: "completed",
        updatedAt: "2023-01-01T01:00:00.000Z",
      };

      dynamoMock.on(GetCommand).resolves({
        Item: sampleTodo,
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: updatedTodo,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.headers).toBeDefined();
      expect(result.headers["Content-Type"]).toBe("application/json");
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers["Access-Control-Allow-Headers"]).toContain(
        "Content-Type"
      );
      expect(result.headers["Access-Control-Allow-Methods"]).toContain("PUT");
    });

    test("should return updated todo with all required fields", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      const updatedTodo: Todo = {
        ...sampleTodo,
        status: "completed",
        updatedAt: "2023-01-01T01:00:00.000Z",
      };

      dynamoMock.on(GetCommand).resolves({
        Item: sampleTodo,
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: updatedTodo,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.id).toBe(todoId);
      expect(responseBody.data.title).toBe("Test Todo");
      expect(responseBody.data.status).toBe("completed");
      expect(responseBody.data.createdAt).toBeDefined();
      expect(responseBody.data.updatedAt).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle already completed todo", async () => {
      // Arrange
      const todoId = "123e4567-e89b-42d3-a456-426614174000";
      const event = createMockEvent(todoId);

      const alreadyCompletedTodo: Todo = {
        ...sampleTodo,
        status: "completed",
      };

      const updatedTodo: Todo = {
        ...alreadyCompletedTodo,
        updatedAt: "2023-01-01T01:00:00.000Z",
      };

      dynamoMock.on(GetCommand).resolves({
        Item: alreadyCompletedTodo,
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: updatedTodo,
      });

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.data.status).toBe("completed");

      // Should still call update to refresh timestamp
      expect(dynamoMock.commandCalls(UpdateCommand)).toHaveLength(1);
    });
  });
});
