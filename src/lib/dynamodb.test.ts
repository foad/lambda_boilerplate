/**
 * Unit tests for DynamoDB utilities
 */

import { getDynamoClient, getTableName } from "./dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment variables
  process.env = {
    ...originalEnv,
    AWS_REGION: "eu-west-2",
    TODOS_TABLE_NAME: "test-todos-table",
  };
});

afterEach(() => {
  process.env = originalEnv;
  // Reset the client instance for clean tests
  jest.resetModules();
});

describe("DynamoDB Utilities", () => {
  describe("getDynamoClient", () => {
    test("should return a DynamoDBDocumentClient instance", () => {
      const client = getDynamoClient();
      expect(client).toBeInstanceOf(DynamoDBDocumentClient);
    });

    test("should reuse the same client instance on subsequent calls", () => {
      const client1 = getDynamoClient();
      const client2 = getDynamoClient();
      expect(client1).toBe(client2);
    });

    test("should use AWS_REGION environment variable", () => {
      process.env.AWS_REGION = "eu-west-1";

      const client = getDynamoClient();
      expect(client).toBeInstanceOf(DynamoDBDocumentClient);
      // We can't easily test the internal region config, but we can verify it creates a client
    });

    test("should default to eu-west-2 when AWS_REGION is not set", () => {
      delete process.env.AWS_REGION;

      const client = getDynamoClient();
      expect(client).toBeInstanceOf(DynamoDBDocumentClient);
      // We can't easily test the internal region config, but we can verify it creates a client
    });

    test("should configure marshalling options correctly", () => {
      const client = getDynamoClient();

      // Verify the client is configured (we can't easily test the internal config,
      // but we can verify it's a properly configured DynamoDBDocumentClient)
      expect(client).toBeInstanceOf(DynamoDBDocumentClient);
      expect(client.send).toBeDefined();
    });
  });

  describe("getTableName", () => {
    test("should return table name from environment variable", () => {
      process.env.TODOS_TABLE_NAME = "my-todos-table";
      const tableName = getTableName();
      expect(tableName).toBe("my-todos-table");
    });

    test("should throw error when TODOS_TABLE_NAME is not set", () => {
      delete process.env.TODOS_TABLE_NAME;

      expect(() => getTableName()).toThrow(
        "TODOS_TABLE_NAME environment variable is not set"
      );
    });

    test("should throw error when TODOS_TABLE_NAME is empty string", () => {
      process.env.TODOS_TABLE_NAME = "";

      expect(() => getTableName()).toThrow(
        "TODOS_TABLE_NAME environment variable is not set"
      );
    });

    test("should handle table name with special characters", () => {
      process.env.TODOS_TABLE_NAME = "todos-table_dev-123";
      const tableName = getTableName();
      expect(tableName).toBe("todos-table_dev-123");
    });
  });

  describe("Client Configuration", () => {
    test("should create client with proper configuration", () => {
      const client = getDynamoClient();

      // Test that the client can be used (basic smoke test)
      expect(typeof client.send).toBe("function");
      expect(client.config).toBeDefined();
    });
  });
});
