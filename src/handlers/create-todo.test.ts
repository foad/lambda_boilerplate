/**
 * Unit tests for Create Todo Lambda function
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "./create-todo";

// Mock the DynamoDB client
const dynamoMock = mockClient(DynamoDBDocumentClient);

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  dynamoMock.reset();
  process.env = {
    ...originalEnv,
    TODOS_TABLE_NAME: "test-todos-table",
    AWS_REGION: "us-east-1",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// Helper function to create mock API Gateway event
function createMockEvent(body: string | null): APIGatewayProxyEvent {
  return {
    body,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/todos",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  };
}

describe("Create Todo Handler", () => {
  describe("Success Cases", () => {
    test("should create a new todo successfully", async () => {
      // Arrange
      const requestBody = { title: "Test Todo" };
      const event = createMockEvent(JSON.stringify(requestBody));

      dynamoMock.on(PutCommand).resolves({});

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(201);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.title).toBe("Test Todo");
      expect(responseBody.data.status).toBe("pending");
      expect(responseBody.data.id).toBeDefined();
      expect(responseBody.data.createdAt).toBeDefined();
      expect(responseBody.data.updatedAt).toBeDefined();

      // Verify DynamoDB was called correctly
      expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
      const putCall = dynamoMock.commandCalls(PutCommand)[0];
      expect(putCall.args[0].input.TableName).toBe("test-todos-table");
      expect(putCall.args[0].input.Item.title).toBe("Test Todo");
      expect(putCall.args[0].input.Item.status).toBe("pending");
    });

    test("should trim whitespace from title", async () => {
      // Arrange
      const requestBody = { title: "  Test Todo  " };
      const event = createMockEvent(JSON.stringify(requestBody));

      dynamoMock.on(PutCommand).resolves({});

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(201);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.data.title).toBe("Test Todo");
    });
  });

  describe("Validation Error Cases", () => {
    test("should return 400 when body is null", async () => {
      // Arrange
      const event = createMockEvent(null);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Request body is required");
    });

    test("should return 400 when body is invalid JSON", async () => {
      // Arrange
      const event = createMockEvent("invalid json");

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Invalid JSON in request body");
    });

    test("should return 400 when title is missing", async () => {
      // Arrange
      const requestBody = {};
      const event = createMockEvent(JSON.stringify(requestBody));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.details.errors).toContain("Title is required");
    });

    test("should return 400 when title is empty string", async () => {
      // Arrange
      const requestBody = { title: "" };
      const event = createMockEvent(JSON.stringify(requestBody));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.details.errors).toContain(
        "Title cannot be empty"
      );
    });

    test("should return 400 when title is not a string", async () => {
      // Arrange
      const requestBody = { title: 123 };
      const event = createMockEvent(JSON.stringify(requestBody));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.details.errors).toContain(
        "Title must be a string"
      );
    });

    test("should return 400 when title exceeds 255 characters", async () => {
      // Arrange
      const longTitle = "a".repeat(256);
      const requestBody = { title: longTitle };
      const event = createMockEvent(JSON.stringify(requestBody));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.details.errors).toContain(
        "Title cannot exceed 255 characters"
      );
    });
  });

  describe("Database Error Cases", () => {
    test("should return 500 when DynamoDB operation fails", async () => {
      // Arrange
      const requestBody = { title: "Test Todo" };
      const event = createMockEvent(JSON.stringify(requestBody));

      dynamoMock.on(PutCommand).rejects(new Error("DynamoDB error"));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("INTERNAL_ERROR");
      expect(responseBody.error.message).toBe("Failed to create todo");
    });

    test("should return 500 when conditional check fails", async () => {
      // Arrange
      const requestBody = { title: "Test Todo" };
      const event = createMockEvent(JSON.stringify(requestBody));

      const conditionalError = new Error("Conditional check failed");
      conditionalError.name = "ConditionalCheckFailedException";
      dynamoMock.on(PutCommand).rejects(conditionalError);

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("INTERNAL_ERROR");
      expect(responseBody.error.message).toBe(
        "Todo with this ID already exists"
      );
    });

    test("should return 500 when table name environment variable is missing", async () => {
      // Arrange
      delete process.env.TODOS_TABLE_NAME;
      const requestBody = { title: "Test Todo" };
      const event = createMockEvent(JSON.stringify(requestBody));

      // Act
      const result = await handler(event);

      // Assert
      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe("INTERNAL_ERROR");
      expect(responseBody.error.message).toBe("Failed to create todo");
    });
  });

  describe("Response Format", () => {
    test("should include proper CORS headers", async () => {
      // Arrange
      const requestBody = { title: "Test Todo" };
      const event = createMockEvent(JSON.stringify(requestBody));

      dynamoMock.on(PutCommand).resolves({});

      // Act
      const result = await handler(event);

      // Assert
      expect(result.headers).toBeDefined();
      expect(result.headers["Content-Type"]).toBe("application/json");
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers["Access-Control-Allow-Headers"]).toContain(
        "Content-Type"
      );
      expect(result.headers["Access-Control-Allow-Methods"]).toContain("POST");
    });
  });
});
