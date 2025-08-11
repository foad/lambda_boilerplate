/**
 * Update Todo Lambda function handler
 * Handles PUT requests to mark todo items as completed
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoClient, getTableName } from "../lib/dynamodb";
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from "../lib/responses";
import { validateTodoId } from "../utils/validation";
import { Todo } from "../lib/types";

/**
 * Lambda handler for updating a todo item to completed status
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract todo ID from path parameters
    const todoId = event.pathParameters?.id;

    // Validate todo ID
    const validation = validateTodoId(todoId);
    if (!validation.isValid) {
      return createValidationErrorResponse("Invalid todo ID", {
        errors: validation.errors,
      });
    }

    // Get DynamoDB client and table name
    const dynamoClient = getDynamoClient();
    const tableName = getTableName();

    // First, check if the todo exists
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { id: todoId },
    });

    const getResult = await dynamoClient.send(getCommand);

    if (!getResult.Item) {
      return createNotFoundResponse("Todo not found");
    }

    // Update the todo status to completed and update timestamp
    const now = new Date().toISOString();

    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { id: todoId },
      UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": "completed",
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await dynamoClient.send(updateCommand);

    // Return the updated todo
    const updatedTodo = updateResult.Attributes as Todo;
    return createSuccessResponse(updatedTodo, 200);
  } catch (error) {
    console.error("Error updating todo:", error);

    // Handle DynamoDB errors and other failures
    return createInternalErrorResponse("Failed to update todo", {
      errorType: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
