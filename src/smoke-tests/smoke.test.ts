// Define the shape of your application's data objects
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

describe("Smoke Tests - Deployed API", () => {
  const API_URL = process.env.API_BASE_URL;

  beforeAll(() => {
    if (!API_URL) {
      throw new Error(
        "API_BASE_URL environment variable is not set. This should be the deployed API Gateway URL."
      );
    }
    console.log(`Running smoke tests against: ${API_URL}`);
  });

  describe("API Health Checks", () => {
    it("should successfully create a todo", async () => {
      const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Smoke Test Todo" }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      const todo = (body as ApiResponse<Todo>).data;

      expect(todo).toBeDefined();
      expect(todo.title).toBe("Smoke Test Todo");
      expect(todo.status).toBe("pending");
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    }, 30000); // 30 second timeout for deployed API

    it("should successfully read todos", async () => {
      const response = await fetch(`${API_URL}/todos`);

      expect(response.status).toBe(200);
      const body = await response.json();
      const todos = (body as ApiResponse<Todo[]>).data;

      expect(Array.isArray(todos)).toBe(true);
      // We don't assert on length since other tests or users might have created todos
    }, 30000);

    it("should successfully update a todo", async () => {
      // First create a todo to update
      const createResponse = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Todo to Update" }),
      });

      expect(createResponse.status).toBe(201);
      const createBody = await createResponse.json();
      const createdTodo = (createBody as ApiResponse<Todo>).data;

      // Now update it
      const updateResponse = await fetch(
        `${API_URL}/todos/${createdTodo.id}/complete`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      expect(updateResponse.status).toBe(200);
      const updateBody = await updateResponse.json();
      const updatedTodo = (updateBody as ApiResponse<Todo>).data;

      expect(updatedTodo.status).toBe("completed");
      expect(updatedTodo.id).toBe(createdTodo.id);
    }, 30000);
  });

  describe("API Error Handling", () => {
    it("should handle invalid create requests", async () => {
      const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Missing title
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect((body as ApiResponse<null>).error).toBeDefined();
    }, 30000);

    it("should handle updating non-existent todo", async () => {
      const response = await fetch(
        `${API_URL}/todos/non-existent-id/complete`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect((body as ApiResponse<null>).error?.message).toBe("Todo not found");
    }, 30000);
  });

  describe("API Response Format", () => {
    it("should return proper CORS headers", async () => {
      const response = await fetch(`${API_URL}/todos`);

      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
    }, 30000);

    it("should handle OPTIONS requests for CORS preflight", async () => {
      const response = await fetch(`${API_URL}/todos`, {
        method: "OPTIONS",
      });

      // Should not fail - API Gateway should handle OPTIONS
      expect(response.status).toBeLessThan(500);
    }, 30000);
  });
});
