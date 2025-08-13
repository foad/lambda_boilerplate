module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.integration.test.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // Exclude integration and smoke tests by default
  testPathIgnorePatterns: [
    "/node_modules/",
    "\\.integration\\.test\\.ts$",
    "smoke\\.test\\.ts$",
  ],
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
};
