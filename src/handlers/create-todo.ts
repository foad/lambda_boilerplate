/**
 * Create Todo Lambda function handler
 * Handles POST requests to create new todo items
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getDynamoClient, getTableName } from "../lib/dynamodb";
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "../lib/responses";
import {
  validateCreateTodoRequest,
  parseRequestBody,
} from "../utils/validation";
import { Todo, CreateTodoRequest } from "../lib/types";

/**
 * Lambda handler for creating a new todo item
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse and validate request body
    let requestBody: CreateTodoRequest;

    try {
      const parsedBody = parseRequestBody<CreateTodoRequest>(event.body);
      if (!parsedBody) {
        return createValidationErrorResponse("Request body is required");
      }
      requestBody = parsedBody;
    } catch (error) {
      return createValidationErrorResponse("Invalid JSON in request body");
    }

    // Validate the request
    const validation = validateCreateTodoRequest(requestBody);
    if (!validation.isValid) {
      return createValidationErrorResponse("Validation failed", {
        errors: validation.errors,
      });
    }

    // Generate new todo item
    const now = new Date().toISOString();
    const newTodo: Todo = {
      id: uuidv4(),
      title: requestBody.title.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    // Save to DynamoDB
    const dynamoClient = getDynamoClient();
    const tableName = getTableName();

    const putCommand = new PutCommand({
      TableName: tableName,
      Item: newTodo,
    });

    await dynamoClient.send(putCommand);

    // Return success response with created todo
    return createSuccessResponse(newTodo, 201);
  } catch (error) {
    console.error("Error creating todo:", error);

    // Handle other errors
    return createInternalErrorResponse("Failed to create todo", {
      errorType: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
