/**
 * Unit tests for response utilities
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from "./responses";

describe("Response Utilities", () => {
  describe("createSuccessResponse", () => {
    test("should create success response with default status code 200", () => {
      const data = { message: "Success" };
      const response = createSuccessResponse(data);

      expect(response.statusCode).toBe(200);
      expect(response.headers["Content-Type"]).toBe("application/json");
      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Headers"]).toContain(
        "Content-Type"
      );
      expect(response.headers["Access-Control-Allow-Methods"]).toContain("GET");

      const body = JSON.parse(response.body);
      expect(body.data).toEqual(data);
    });

    test("should create success response with custom status code", () => {
      const data = { id: "123", title: "New Todo" };
      const response = createSuccessResponse(data, 201);

      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.data).toEqual(data);
    });

    test("should handle null data", () => {
      const response = createSuccessResponse(null);

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data).toBeNull();
    });

    test("should handle array data", () => {
      const data = [{ id: "1" }, { id: "2" }];
      const response = createSuccessResponse(data);

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data).toEqual(data);
    });
  });

  describe("createErrorResponse", () => {
    test("should create error response with default values", () => {
      const message = "Something went wrong";
      const response = createErrorResponse(message);

      expect(response.statusCode).toBe(500);
      expect(response.headers["Content-Type"]).toBe("application/json");
      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(message);
      expect(body.error.code).toBe("INTERNAL_ERROR");
      expect(body.error.details).toBeUndefined();
    });

    test("should create error response with custom values", () => {
      const message = "Validation failed";
      const statusCode = 400;
      const code = "VALIDATION_ERROR";
      const details = { field: "title", issue: "required" };

      const response = createErrorResponse(message, statusCode, code, details);

      expect(response.statusCode).toBe(statusCode);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(message);
      expect(body.error.code).toBe(code);
      expect(body.error.details).toEqual(details);
    });

    test("should handle undefined details", () => {
      const response = createErrorResponse("Error", 400, "BAD_REQUEST");

      const body = JSON.parse(response.body);
      expect(body.error.details).toBeUndefined();
    });
  });

  describe("createValidationErrorResponse", () => {
    test("should create validation error response", () => {
      const message = "Invalid input";
      const response = createValidationErrorResponse(message);

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(message);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    test("should create validation error response with details", () => {
      const message = "Validation failed";
      const details = { errors: ["Title is required", "Title too long"] };
      const response = createValidationErrorResponse(message, details);

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(message);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(details);
    });
  });

  describe("createNotFoundResponse", () => {
    test("should create not found response with default message", () => {
      const response = createNotFoundResponse();

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe("Resource not found");
      expect(body.error.code).toBe("NOT_FOUND");
    });

    test("should create not found response with custom message", () => {
      const message = "Todo not found";
      const response = createNotFoundResponse(message);

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(message);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("createInternalErrorResponse", () => {
    test("should create internal error response with default message", () => {
      const response = createInternalErrorResponse();

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe("Internal server error");
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });

    test("should create internal error response with custom message and details", () => {
      const message = "Database connection failed";
      const details = { errorType: "ConnectionError", retryable: true };
      const response = createInternalErrorResponse(message, details);

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(message);
      expect(body.error.code).toBe("INTERNAL_ERROR");
      expect(body.error.details).toEqual(details);
    });
  });

  describe("CORS Headers", () => {
    test("should include all required CORS headers in success response", () => {
      const response = createSuccessResponse({});

      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Headers"]).toBe(
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
      );
      expect(response.headers["Access-Control-Allow-Methods"]).toBe(
        "GET,POST,PUT,DELETE,OPTIONS"
      );
    });

    test("should include all required CORS headers in error response", () => {
      const response = createErrorResponse("Error");

      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Headers"]).toBe(
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
      );
      expect(response.headers["Access-Control-Allow-Methods"]).toBe(
        "GET,POST,PUT,DELETE,OPTIONS"
      );
    });
  });
});
