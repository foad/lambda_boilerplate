// Integration test setup
// This file runs before each integration test file

import * as dotenv from "dotenv";

// Load environment variables from .env.local for local testing
dotenv.config({ path: ".env.local" });

// Set test environment variables
process.env.NODE_ENV = "test";

// LocalStack free doesn't have Cognito
// Integration tests will mock the authorizer context instead

console.log(
  "Integration test setup: Authentication always enabled, LocalStack uses mocked auth context"
);

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === "test") {
  // You can add integration-specific test setup here
}
