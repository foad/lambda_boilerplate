module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // Only run integration and smoke tests
  testMatch: [
    "**/*.integration.test.ts",
    "**/smoke-tests/**/*.test.ts",
    "**/*smoke*.test.ts",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  // Don't collect coverage for integration tests
  collectCoverage: false,
  // Setup files with integration-specific environment
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.integration.ts"],
  // Longer timeout for integration tests
  testTimeout: 30000,
};
