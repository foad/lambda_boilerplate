import {
  TestAuthManager,
  createMockAuthorizerContext,
} from "./test-auth-utils";
import { extractUserContext, isAuthError } from "./auth";
import { createMockEventWithClaims } from "./test-event-utils";

// Mock the Cognito client for unit tests
jest.mock("@aws-sdk/client-cognito-identity-provider");

describe("Test Auth Utils", () => {
  describe("createMockAuthorizerContext", () => {
    it("should create proper mock authorizer context", () => {
      const context = createMockAuthorizerContext(
        "user-123",
        "test@example.com",
        "testuser"
      );

      expect(context.claims.sub).toBe("user-123");
      expect(context.claims.email).toBe("test@example.com");
      expect(context.claims.username).toBe("testuser");
      expect(context.claims["cognito:username"]).toBe("testuser");
    });

    it("should handle optional fields", () => {
      const context = createMockAuthorizerContext("user-123");

      expect(context.claims.sub).toBe("user-123");
      expect(context.claims.email).toBeUndefined();
      expect(context.claims.username).toBeUndefined();
      expect(context.claims["cognito:username"]).toBeUndefined();
    });
  });

  describe("Integration with auth utilities", () => {
    it("should work with extractUserContext", () => {
      // Create a mock API Gateway event with the authorizer claims
      const mockEvent = createMockEventWithClaims({
        sub: "user-123",
        email: "test@example.com",
        "cognito:username": "testuser",
      });

      const userContext = extractUserContext(mockEvent);

      expect(isAuthError(userContext)).toBe(false);
      if (!isAuthError(userContext)) {
        expect(userContext.userId).toBe("user-123");
        expect(userContext.email).toBe("test@example.com");
        expect(userContext.username).toBe("testuser");
      }
    });
  });

  describe("TestAuthManager", () => {
    it("should create auth headers correctly", () => {
      const authManager = new TestAuthManager("pool-id", "client-id");
      const headers = authManager.getAuthHeaders("test-token");

      expect(headers).toEqual({
        Authorization: "Bearer test-token",
      });
    });

    it("should handle missing environment variables gracefully", () => {
      // Clear environment variables
      const originalPoolId = process.env.COGNITO_USER_POOL_ID;
      const originalClientId = process.env.COGNITO_CLIENT_ID;

      delete process.env.COGNITO_USER_POOL_ID;
      delete process.env.COGNITO_CLIENT_ID;

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const authManager = new TestAuthManager();
      authManager.getAuthHeaders("test-token");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID not set"
        )
      );

      consoleSpy.mockRestore();

      // Restore environment variables
      if (originalPoolId) process.env.COGNITO_USER_POOL_ID = originalPoolId;
      if (originalClientId) process.env.COGNITO_CLIENT_ID = originalClientId;
    });
  });
});
