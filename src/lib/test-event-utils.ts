/**
 * Test utilities for creating mock API Gateway events
 */

import { APIGatewayProxyEvent } from "aws-lambda";

export interface MockEventOptions {
  httpMethod?: string;
  path?: string;
  body?: string | null;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  headers?: Record<string, string>;
  userId?: string;
  userEmail?: string;
  username?: string;
  withAuth?: boolean;
}

/**
 * Creates a mock API Gateway event with authentication
 */
export function createMockEvent(
  options: MockEventOptions = {}
): APIGatewayProxyEvent {
  const {
    httpMethod = "GET",
    path = "/todos",
    body = null,
    pathParameters = null,
    queryStringParameters = null,
    headers = {},
    userId = "test-user-123",
    userEmail = "test@example.com",
    username = "testuser",
    withAuth = true,
  } = options;

  const baseEvent: APIGatewayProxyEvent = {
    body,
    headers,
    multiValueHeaders: {},
    httpMethod,
    isBase64Encoded: false,
    path,
    pathParameters,
    queryStringParameters,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: "123456789012",
      apiId: "test-api-id",
      authorizer: withAuth
        ? {
            claims: {
              sub: userId,
              email: userEmail,
              "cognito:username": username,
            },
          }
        : null,
      protocol: "HTTP/1.1",
      httpMethod,
      path,
      stage: "test",
      requestId: "test-request-id",
      requestTime: "09/Apr/2015:12:34:56 +0000",
      requestTimeEpoch: 1428582896000,
      identity: {
        cognitoIdentityPoolId: null,
        accountId: null,
        cognitoIdentityId: null,
        caller: null,
        accessKey: null,
        sourceIp: "127.0.0.1",
        cognitoAuthenticationType: null,
        cognitoAuthenticationProvider: null,
        userArn: null,
        userAgent: "Custom User Agent String",
        user: null,
        apiKey: null,
        apiKeyId: null,
        clientCert: null,
        principalOrgId: null,
      },
      resourceId: "123456",
      resourcePath: path,
    },
    resource: path,
  };

  return baseEvent;
}

/**
 * Creates a mock event for POST /todos (create todo)
 */
export function createMockCreateTodoEvent(
  body: string | null,
  userId: string = "test-user-123"
): APIGatewayProxyEvent {
  return createMockEvent({
    httpMethod: "POST",
    path: "/todos",
    body,
    userId,
  });
}

/**
 * Creates a mock event for GET /todos (read todos)
 */
export function createMockReadTodosEvent(
  userId: string = "test-user-123"
): APIGatewayProxyEvent {
  return createMockEvent({
    httpMethod: "GET",
    path: "/todos",
    userId,
  });
}

/**
 * Creates a mock event for PUT /todos/{id}/complete (update todo)
 */
export function createMockUpdateTodoEvent(
  todoId: string | null,
  userId: string = "test-user-123"
): APIGatewayProxyEvent {
  return createMockEvent({
    httpMethod: "PUT",
    path: todoId ? `/todos/${todoId}/complete` : "/todos/null/complete",
    pathParameters: todoId ? { id: todoId } : null,
    userId,
  });
}

/**
 * Creates a mock event with custom authorizer claims
 */
export function createMockEventWithClaims(
  claims: Record<string, unknown>,
  options: Omit<
    MockEventOptions,
    "withAuth" | "userId" | "userEmail" | "username"
  > = {}
): APIGatewayProxyEvent {
  const event = createMockEvent({ ...options, withAuth: true });
  if (event.requestContext.authorizer) {
    event.requestContext.authorizer.claims = claims;
  }
  return event;
}

/**
 * Creates a mock event with empty authorizer (for testing auth failures)
 */
export function createMockEventWithEmptyAuth(
  options: Omit<MockEventOptions, "withAuth"> = {}
): APIGatewayProxyEvent {
  const event = createMockEvent({ ...options, withAuth: true });
  event.requestContext.authorizer = {};
  return event;
}
