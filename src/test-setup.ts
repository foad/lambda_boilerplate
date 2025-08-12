// Global test setup
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.TODOS_TABLE_NAME = "todos-test";

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === "test") {
  // You can add global test setup here
}
