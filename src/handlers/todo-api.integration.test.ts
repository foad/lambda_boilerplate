import * as dotenv from "dotenv";
import { clearTodosTable } from "../lib/test-utils";

dotenv.config({ path: ".env.test" });

const API_URL = process.env.API_URL;

interface Todo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  error?: { message: string; code?: string };
}

describe("Todo API E2E Integration Tests", () => {
  beforeAll(async () => {
    if (!API_URL) {
      throw new Error("API_URL environment variable is not set");
    }

    process.env.AWS_REGION = "eu-west-2";
    process.env.AWS_ENDPOINT_URL = "http://localhost:4566";
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
  });

  beforeEach(async () => {
    await clearTodosTable();
  });

  it("should create, read, and update todos end-to-end", async () => {
    // 1. Create a todo via the API
    const createResponse = await fetch(`${API_URL}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "E2E Test Todo" }),
    });

    expect(createResponse.status).toBe(201);
    const createBody = await createResponse.json();
    const createdTodo = (createBody as ApiResponse<Todo>).data;

    expect(createdTodo.title).toBe("E2E Test Todo");
    expect(createdTodo.status).toBe("pending");
    expect(createdTodo.id).toBeDefined();

    // 2. Read todos via the API
    const readResponse = await fetch(`${API_URL}/todos`);
    expect(readResponse.status).toBe(200);
    const readBody = await readResponse.json();
    const todos = (readBody as ApiResponse<Todo>).data;

    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe(createdTodo.id);

    // 3. Update todo via the API
    const updateResponse = await fetch(`${API_URL}/todos/${createdTodo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    expect(updateResponse.status).toBe(200);
    const updateBody = await updateResponse.json();
    const updatedTodo = (updateBody as ApiResponse<Todo>).data;

    expect(updatedTodo.status).toBe("completed");
    expect(updatedTodo.id).toBe(createdTodo.id);

    // 4. Verify update by reading again
    const finalReadResponse = await fetch(`${API_URL}/todos`);
    const finalReadBody = await finalReadResponse.json();
    const finalTodos = (finalReadBody as ApiResponse<Todo[]>).data;
    expect(finalTodos[0].status).toBe("completed");
  });

  it("should handle empty todo list", async () => {
    const response = await fetch(`${API_URL}/todos`);

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect((responseBody as ApiResponse<Todo[]>).data).toEqual([]);
  });

  it("should handle updating non-existent todo", async () => {
    const updateResponse = await fetch(`${API_URL}/todos/non-existent-id`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    expect(updateResponse.status).toBe(404);
    const errorBody = await updateResponse.json();
    expect((errorBody as ApiResponse<null>).error?.message).toBe(
      "Todo not found"
    );
  });
});
