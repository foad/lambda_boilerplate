import {
  TestAuthManager,
  setupTestUsers,
  cleanupTestUsers,
  DEFAULT_TEST_USERS,
} from "../lib/test-auth-utils";

// Define the shape of your application's data objects
interface Todo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

interface ApiResponse<T> {
  data: T;
  error?: { message: string; code?: string };
}

describe("Smoke Tests - Deployed API", () => {
  const API_URL = process.env.API_BASE_URL;
  const ENABLE_COGNITO_AUTH = process.env.ENABLE_COGNITO_AUTH === "true";
  let authManager: TestAuthManager;
  let authHeaders: Record<string, string> = {};

  beforeAll(async () => {
    if (!API_URL) {
      throw new Error(
        "API_BASE_URL environment variable is not set. This should be the deployed API Gateway URL."
      );
    }
    console.log(`Running smoke tests against: ${API_URL}`);

    // Setup authentication if enabled
    if (ENABLE_COGNITO_AUTH) {
      console.log("Setting up authentication for smoke tests...");

      // For smoke tests against deployed API, we need to use the deployed Cognito
      // The user pool and client should already exist from deployment
      authManager = new TestAuthManager(
        process.env.COGNITO_USER_POOL_ID,
        process.env.COGNITO_CLIENT_ID
      );

      // Create test users in the deployed environment
      await setupTestUsers(authManager);

      // Authenticate the first test user
      const testUser = DEFAULT_TEST_USERS[0];
      const tokens = await authManager.authenticateUser(
        testUser.username,
        testUser.password
      );
      authHeaders = authManager.getAuthHeaders(tokens.idToken);
      console.log("Authentication setup complete for smoke tests");
    } else {
      console.log("Running smoke tests without authentication");
    }
  });

  afterAll(async () => {
    // Cleanup test users if authentication was enabled
    if (ENABLE_COGNITO_AUTH && authManager) {
      console.log("Cleaning up smoke test users...");
      await cleanupTestUsers(authManager);
    }
  });

  describe("API Health Checks", () => {
    it("should successfully create a todo", async () => {
      const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
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
      const response = await fetch(`${API_URL}/todos`, {
        headers: authHeaders,
      });

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
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
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
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
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
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
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
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
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
      const response = await fetch(`${API_URL}/todos`, {
        headers: authHeaders,
      });

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
