import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { handler as createTodoHandler } from "./create-todo";
import { handler as readTodosHandler } from "./read-todos";
import { handler as updateTodoHandler } from "./update-todo";
import { APIGatewayProxyEvent } from "aws-lambda";

// This test file is designed to run against LocalStack
// Run with: npm run test:integration

describe("Todo API Integration Tests", () => {
  let dynamoClient: DynamoDBDocumentClient;
  const tableName = process.env.TODOS_TABLE_NAME || "todos";

  beforeAll(() => {
    // Set environment variables for LocalStack
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ENDPOINT_URL = "http://localhost:4566";
    process.env.TODOS_TABLE_NAME = "todos";
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";

    // Configure DynamoDB client for LocalStack
    const client = new DynamoDBClient({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    dynamoClient = DynamoDBDocumentClient.from(client);
  });

  beforeEach(async () => {
    // Clean up table before each test
    const scanResult = await dynamoClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    if (scanResult.Items) {
      for (const item of scanResult.Items) {
        await dynamoClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { id: item.id },
          })
        );
      }
    }
  });

  const createMockEvent = (
    body: Record<string, unknown>,
    pathParameters?: Record<string, string> | null
  ): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    pathParameters,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/todos",
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: "123456789012",
      apiId: "test-api",
      authorizer: {},
      protocol: "HTTP/1.1",
      httpMethod: "POST",
      path: "/todos",
      stage: "test",
      requestId: "test-request-id",
      requestTimeEpoch: Date.now(),
      resourceId: "test-resource",
      resourcePath: "/todos",
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: "127.0.0.1",
        user: null,
        userAgent: "test-agent",
        userArn: null,
      },
    },
    resource: "",
  });

  it("should create, read, and update todos end-to-end", async () => {
    // 1. Create a todo
    const createEvent = createMockEvent({ title: "Integration Test Todo" });
    const createResponse = await createTodoHandler(createEvent);

    expect(createResponse.statusCode).toBe(201);
    const createResponseBody = JSON.parse(createResponse.body);
    const createdTodo = createResponseBody.data;
    expect(createdTodo.title).toBe("Integration Test Todo");
    expect(createdTodo.status).toBe("pending");
    expect(createdTodo.id).toBeDefined();

    // 2. Read todos
    const readEvent = createMockEvent({});
    const readResponse = await readTodosHandler(readEvent);

    expect(readResponse.statusCode).toBe(200);
    const readResponseBody = JSON.parse(readResponse.body);
    const todos = readResponseBody.data;
    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe(createdTodo.id);

    // 3. Update todo
    const updateEvent = createMockEvent({}, { id: createdTodo.id });
    updateEvent.httpMethod = "PUT";
    const updateResponse = await updateTodoHandler(updateEvent);

    expect(updateResponse.statusCode).toBe(200);
    const updateResponseBody = JSON.parse(updateResponse.body);
    const updatedTodo = updateResponseBody.data;
    expect(updatedTodo.status).toBe("completed");
    expect(updatedTodo.id).toBe(createdTodo.id);

    // 4. Verify update by reading again
    const finalReadResponse = await readTodosHandler(readEvent);
    const finalReadResponseBody = JSON.parse(finalReadResponse.body);
    const finalTodos = finalReadResponseBody.data;
    expect(finalTodos[0].status).toBe("completed");
  });

  it("should handle empty todo list", async () => {
    const readEvent = createMockEvent({});

    const response = await readTodosHandler(readEvent);

    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    const todos = responseBody.data;
    expect(todos).toEqual([]);
  });

  it("should handle updating non-existent todo", async () => {
    const updateEvent = createMockEvent({}, { id: "non-existent-id" });
    updateEvent.httpMethod = "PUT";

    const response = await updateTodoHandler(updateEvent);

    expect(response.statusCode).toBe(404);
    const error = JSON.parse(response.body);
    expect(error.error.message).toBe("Todo not found");
  });
});
