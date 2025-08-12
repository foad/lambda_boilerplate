/**
 * DynamoDB client wrapper with connection reuse for Lambda functions
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Reuse client across Lambda invocations for better performance
let dynamoClient: DynamoDBDocumentClient | null = null;

/**
 * Get or create DynamoDB document client with connection reuse
 */
export function getDynamoClient(): DynamoDBDocumentClient {
  if (!dynamoClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "eu-west-2",
    });

    dynamoClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });
  }

  return dynamoClient;
}

/**
 * Get the DynamoDB table name from environment variables
 */
export function getTableName(): string {
  const tableName = process.env.TODOS_TABLE_NAME;
  if (!tableName) {
    throw new Error("TODOS_TABLE_NAME environment variable is not set");
  }
  return tableName;
}
