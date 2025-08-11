/**
 * Read Todos Lambda function handler
 * Handles GET requests to retrieve all todo items
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoClient, getTableName } from "../lib/dynamodb";
import {
  createSuccessResponse,
  createInternalErrorResponse,
} from "../lib/responses";
import { Todo } from "../lib/types";

/**
 * Lambda handler for retrieving all todo items
 */
export const handler = async (
  _: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get DynamoDB client and table name
    const dynamoClient = getDynamoClient();
    const tableName = getTableName();

    // Scan the table to get all todos
    const scanCommand = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoClient.send(scanCommand);

    // Extract todos from the result, ensuring type safety
    const todos: Todo[] = (result.Items || []) as Todo[];

    // Return success response with todos array (empty array if no todos exist)
    return createSuccessResponse(todos, 200);
  } catch (error) {
    console.error("Error reading todos:", error);

    // Handle DynamoDB errors and other failures
    return createInternalErrorResponse("Failed to retrieve todos", {
      errorType: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
