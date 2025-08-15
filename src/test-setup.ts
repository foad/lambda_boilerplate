// Global test setup
// This file runs before each test file

import * as dotenv from "dotenv";

// Load environment variables from .env.local for local testing
dotenv.config({ path: ".env.local" });

// Set test environment variables
process.env.NODE_ENV = "test";

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === "test") {
  // You can add global test setup here
}
