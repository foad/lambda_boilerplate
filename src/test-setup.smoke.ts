// Don't load .env.local for smoke tests - use production AWS configuration
// Smoke tests should use environment variables passed in at runtime

process.env.NODE_ENV = "test";

console.log("Smoke test setup: Using production AWS configuration");
