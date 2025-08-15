import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthError, extractUserContext, getUserId, isAuthError } from "./auth";
import { createMockEventWithClaims } from "./test-event-utils";

describe("Authentication Utilities", () => {
  describe("extractUserContext", () => {
    it("should extract user context from Cognito authorizer claims", () => {
      const event = {
        requestContext: {
          authorizer: {
            claims: {
              sub: "user-123",
              email: "test@example.com",
              "cognito:username": "testuser",
            },
          },
        },
      } as any as APIGatewayProxyEvent;

      const result = extractUserContext(event);

      expect(isAuthError(result)).toBe(false);
      if (!isAuthError(result)) {
        expect(result.userId).toBe("user-123");
        expect(result.email).toBe("test@example.com");
        expect(result.username).toBe("testuser");
      }
    });

    it("should handle missing authorizer context", () => {
      const event = {
        requestContext: {},
      } as any as APIGatewayProxyEvent;

      const result = extractUserContext(event);

      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.code).toBe("MISSING_AUTHORIZER");
        expect(result.message).toBe("No authorizer context found in request");
      }
    });

    it("should return error when claims are missing", () => {
      const event = {
        requestContext: {
          authorizer: {},
        },
      } as any as APIGatewayProxyEvent;

      const result = extractUserContext(event);

      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.code).toBe("MISSING_CLAIMS");
        expect(result.message).toBe(
          "No user claims found in authorization context"
        );
      }
    });

    it("should return error when user ID (sub) is missing", () => {
      const event = {
        requestContext: {
          authorizer: {
            claims: {
              email: "test@example.com",
            },
          },
        },
      } as any as APIGatewayProxyEvent;

      const result = extractUserContext(event);

      expect(isAuthError(result)).toBe(true);
      if (isAuthError(result)) {
        expect(result.code).toBe("MISSING_USER_ID");
        expect(result.message).toBe("User ID not found in JWT claims");
      }
    });

    it("should handle username from different claim formats", () => {
      const event = {
        requestContext: {
          authorizer: {
            claims: {
              sub: "user-123",
              username: "testuser", // Standard username claim
            },
          },
        },
      } as any as APIGatewayProxyEvent;

      const result = extractUserContext(event);

      expect(isAuthError(result)).toBe(false);
      if (!isAuthError(result)) {
        expect(result.userId).toBe("user-123");
        expect(result.username).toBe("testuser");
      }
    });
  });

  describe("getUserId", () => {
    it("should return user ID when extraction is successful", () => {
      const event = {
        requestContext: {
          authorizer: {
            claims: {
              sub: "user-123",
            },
          },
        },
      } as any as APIGatewayProxyEvent;

      const result = getUserId(event);

      expect(typeof result).toBe("string");
      expect(result).toBe("user-123");
    });

    it("should return error when extraction fails", () => {
      const event = createMockEventWithClaims({});

      const context = extractUserContext(event);
      const result = getUserId(event);

      expect(isAuthError(context)).toBe(true);
      expect((result as AuthError).code).toBe("MISSING_USER_ID");
    });
  });

  describe("isAuthError", () => {
    it("should return true for auth error objects", () => {
      const error = {
        message: "Test error",
        code: "TEST_ERROR",
      };

      expect(isAuthError(error)).toBe(true);
    });

    it("should return false for user context objects", () => {
      const userContext = {
        userId: "user-123",
        email: "test@example.com",
      };

      expect(isAuthError(userContext)).toBe(false);
    });
  });
});
