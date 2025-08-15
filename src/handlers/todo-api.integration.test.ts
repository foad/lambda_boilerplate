import * as dotenv from "dotenv";
import { execSync } from "child_process";
import { clearTodosTable } from "../lib/test-utils";
import {
  createMockCreateTodoEvent,
  createMockReadTodosEvent,
  createMockUpdateTodoEvent,
} from "../lib/test-event-utils";

dotenv.config({ path: ".env.test" });

interface Todo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId?: string; // Added for user scoping
}

interface ApiResponse<T> {
  data: T;
  error?: { message: string; code?: string };
}

interface LambdaInvokeResponse {
  StatusCode: number;
  Payload: string;
}

/**
 * Invoke a Lambda function in LocalStack using awslocal
 */
async function invokeLambda(
  functionName: string,
  payload: unknown
): Promise<LambdaInvokeResponse> {
  const payloadJson = JSON.stringify(payload);
  const tempFile = `/tmp/lambda-response-${Date.now()}.json`;

  try {
    // Write payload to a temporary file to avoid shell escaping issues
    const payloadFile = `/tmp/lambda-payload-${Date.now()}.json`;
    execSync(`echo '${payloadJson}' > ${payloadFile}`, { encoding: "utf8" });

    // Invoke the Lambda function (this returns metadata, not the actual response)
    execSync(
      `awslocal lambda invoke --function-name ${functionName} --payload fileb://${payloadFile} --region eu-west-2 --no-cli-pager ${tempFile}`,
      {
        encoding: "utf8",
        env: {
          ...process.env,
          AWS_REGION: "eu-west-2",
          AWS_ENDPOINT_URL: "http://localhost:4566",
          AWS_ACCESS_KEY_ID: "test",
          AWS_SECRET_ACCESS_KEY: "test",
        },
      }
    );

    // Read the actual response from the temp file
    const responsePayload = execSync(`cat ${tempFile}`, {
      encoding: "utf8",
    }).trim();

    // Clean up temporary files
    execSync(`rm -f ${payloadFile} ${tempFile}`, { encoding: "utf8" });

    return {
      StatusCode: 200, // awslocal invoke succeeded
      Payload: responsePayload,
    };
  } catch (error) {
    console.error(`Lambda invocation failed for ${functionName}:`, error);
    throw error;
  }
}

describe("Todo API Integration Tests", () => {
  beforeAll(async () => {
    // Set up LocalStack environment variables
    process.env.AWS_REGION = "eu-west-2";
    process.env.AWS_ENDPOINT_URL = "http://localhost:4566";
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
    process.env.TODOS_TABLE_NAME = "todos";
  });

  beforeEach(async () => {
    await clearTodosTable();
  });

  it("should create, read, and update todos end-to-end", async () => {
    // 1. Create a todo via LocalStack Lambda invocation
    const createEvent = createMockCreateTodoEvent(
      JSON.stringify({ title: "Integration Test Todo" })
    );
    const createResponse = await invokeLambda("create-todo", createEvent);

    expect(createResponse.StatusCode).toBe(200);
    const createResult = JSON.parse(createResponse.Payload);
    expect(createResult.statusCode).toBe(201);

    const createBody = JSON.parse(createResult.body);
    const createdTodo = (createBody as ApiResponse<Todo>).data;

    expect(createdTodo.title).toBe("Integration Test Todo");
    expect(createdTodo.status).toBe("pending");
    expect(createdTodo.id).toBeDefined();

    // 2. Read todos via LocalStack Lambda invocation
    const readEvent = createMockReadTodosEvent();
    const readResponse = await invokeLambda("read-todos", readEvent);

    expect(readResponse.StatusCode).toBe(200);
    const readResult = JSON.parse(readResponse.Payload);
    expect(readResult.statusCode).toBe(200);

    const readBody = JSON.parse(readResult.body);
    const todos = (readBody as ApiResponse<Todo[]>).data;

    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe(createdTodo.id);

    // 3. Update todo via LocalStack Lambda invocation
    const updateEvent = createMockUpdateTodoEvent(createdTodo.id);
    const updateResponse = await invokeLambda("update-todo", updateEvent);

    expect(updateResponse.StatusCode).toBe(200);
    const updateResult = JSON.parse(updateResponse.Payload);
    expect(updateResult.statusCode).toBe(200);

    const updateBody = JSON.parse(updateResult.body);
    const updatedTodo = (updateBody as ApiResponse<Todo>).data;

    expect(updatedTodo.status).toBe("completed");
    expect(updatedTodo.id).toBe(createdTodo.id);

    // 4. Verify update by reading again
    const finalReadEvent = createMockReadTodosEvent();
    const finalReadResponse = await invokeLambda("read-todos", finalReadEvent);

    const finalReadResult = JSON.parse(finalReadResponse.Payload);
    const finalReadBody = JSON.parse(finalReadResult.body);
    const finalTodos = (finalReadBody as ApiResponse<Todo[]>).data;
    expect(finalTodos[0].status).toBe("completed");
  });

  it("should handle empty todo list", async () => {
    const readEvent = createMockReadTodosEvent();
    const response = await invokeLambda("read-todos", readEvent);

    expect(response.StatusCode).toBe(200);
    const result = JSON.parse(response.Payload);
    expect(result.statusCode).toBe(200);

    const responseBody = JSON.parse(result.body);
    expect((responseBody as ApiResponse<Todo[]>).data).toEqual([]);
  });

  it("should handle updating non-existent todo", async () => {
    const updateEvent = createMockUpdateTodoEvent("non-existent-id");
    const response = await invokeLambda("update-todo", updateEvent);

    expect(response.StatusCode).toBe(200);
    const result = JSON.parse(response.Payload);
    expect(result.statusCode).toBe(404);

    const errorBody = JSON.parse(result.body);
    expect((errorBody as ApiResponse<null>).error?.message).toBe(
      "Todo not found"
    );
  });

  it("should isolate todos between different users", async () => {
    // Create todo with first user
    const createEvent1 = createMockCreateTodoEvent(
      JSON.stringify({ title: "User 1 Todo" }),
      "user-1"
    );
    const createResponse1 = await invokeLambda("create-todo", createEvent1);

    expect(createResponse1.StatusCode).toBe(200);
    const createResult1 = JSON.parse(createResponse1.Payload);
    expect(createResult1.statusCode).toBe(201);

    // Create todo with second user
    const createEvent2 = createMockCreateTodoEvent(
      JSON.stringify({ title: "User 2 Todo" }),
      "user-2"
    );
    const createResponse2 = await invokeLambda("create-todo", createEvent2);

    expect(createResponse2.StatusCode).toBe(200);
    const createResult2 = JSON.parse(createResponse2.Payload);
    expect(createResult2.statusCode).toBe(201);

    // First user should only see their todo
    const readEvent1 = createMockReadTodosEvent("user-1");
    const readResponse1 = await invokeLambda("read-todos", readEvent1);

    const readResult1 = JSON.parse(readResponse1.Payload);
    const todos1 = (JSON.parse(readResult1.body) as ApiResponse<Todo[]>).data;
    expect(todos1).toHaveLength(1);
    expect(todos1[0].title).toBe("User 1 Todo");

    // Second user should only see their todo
    const readEvent2 = createMockReadTodosEvent("user-2");
    const readResponse2 = await invokeLambda("read-todos", readEvent2);

    const readResult2 = JSON.parse(readResponse2.Payload);
    const todos2 = (JSON.parse(readResult2.body) as ApiResponse<Todo[]>).data;
    expect(todos2).toHaveLength(1);
    expect(todos2[0].title).toBe("User 2 Todo");
  });
});
