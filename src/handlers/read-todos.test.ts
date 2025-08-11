/**
 * Unit tests for read-todos Lambda function handler
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "./read-todos";
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
    AWS_REGION: "us-east-1",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// Helper function to create mock API Gateway event
const createMockEvent = (): APIGatewayProxyEvent => ({
  httpMethod: "GET",
  path: "/todos",
  pathParameters: null,
  queryStringParameters: null,
  headers: {},
  multiValueHeaders: {},
  body: null,
  isBase64Encoded: false,
  requestContext: {} as any,
  resource: "",
  stageVariables: null,
  multiValueQueryStringParameters: null,
});

describe("read-todos handler", () => {
  it("should return empty array when no todos exist", async () => {
    // Mock DynamoDB scan to return empty result
    dynamoMock.on(ScanCommand).resolves({
      Items: [],
      Count: 0,
      ScannedCount: 0,
    });

    const event = createMockEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers["Content-Type"]).toBe("application/json");
    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");

    const responseBody = JSON.parse(result.body);
    expect(responseBody.data).toEqual([]);
  });

  it("should return array of todos when todos exist", async () => {
    const mockTodos: Todo[] = [
      {
        id: "todo-1",
        title: "First todo",
        status: "pending",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      },
      {
        id: "todo-2",
        title: "Second todo",
        status: "completed",
        createdAt: "2023-01-02T00:00:00.000Z",
        updatedAt: "2023-01-02T12:00:00.000Z",
      },
    ];

    // Mock DynamoDB scan to return todos
    dynamoMock.on(ScanCommand).resolves({
      Items: mockTodos,
      Count: 2,
      ScannedCount: 2,
    });

    const event = createMockEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers["Content-Type"]).toBe("application/json");

    const responseBody = JSON.parse(result.body);
    expect(responseBody.data).toEqual(mockTodos);
    expect(responseBody.data).toHaveLength(2);
  });

  it("should handle DynamoDB scan errors", async () => {
    // Mock DynamoDB scan to throw an error
    const mockError = new Error("DynamoDB connection failed");
    mockError.name = "ServiceException";
    dynamoMock.on(ScanCommand).rejects(mockError);

    const event = createMockEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.headers["Content-Type"]).toBe("application/json");

    const responseBody = JSON.parse(result.body);
    expect(responseBody.error.message).toBe("Failed to retrieve todos");
    expect(responseBody.error.code).toBe("INTERNAL_ERROR");
    expect(responseBody.error.details.errorType).toBe("ServiceException");
    expect(responseBody.error.details.message).toBe(
      "DynamoDB connection failed"
    );
  });

  it("should handle undefined Items in DynamoDB response", async () => {
    // Mock DynamoDB scan to return response without Items property
    dynamoMock.on(ScanCommand).resolves({
      Count: 0,
      ScannedCount: 0,
    });

    const event = createMockEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.data).toEqual([]);
  });

  it("should call DynamoDB scan with correct parameters", async () => {
    dynamoMock.on(ScanCommand).resolves({
      Items: [],
      Count: 0,
      ScannedCount: 0,
    });

    const event = createMockEvent();
    await handler(event);

    // Verify that ScanCommand was called with correct table name
    expect(dynamoMock.commandCalls(ScanCommand)).toHaveLength(1);
    const scanCall = dynamoMock.commandCalls(ScanCommand)[0];
    expect(scanCall.args[0].input).toEqual({
      TableName: "test-todos-table",
    });
  });

  it("should handle missing TODOS_TABLE_NAME environment variable", async () => {
    // Remove the environment variable
    delete process.env.TODOS_TABLE_NAME;

    const event = createMockEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error.message).toBe("Failed to retrieve todos");
  });
});
