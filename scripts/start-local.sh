#!/bin/bash

echo "Starting LocalStack environment..."

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Start LocalStack with docker compose
docker compose up -d

echo "LocalStack started. Waiting for services to be ready..."

# Wait for LocalStack to be fully ready
sleep 10

# Initialize DynamoDB table
./scripts/init-dynamodb.sh

# Note: Cognito is not available in LocalStack free tier
# For local development, integration tests will use direct Lambda invocation
# with mock Cognito authorizer context instead of going through API Gateway
echo ""
echo "Note: Cognito User Pool initialization skipped (not available in LocalStack free tier)"
echo "Integration tests will use direct Lambda invocation with mock auth context"
echo "Use smoke tests against deployed environment for full end-to-end testing"

echo ""
echo "Local development environment is ready!"
echo "LocalStack Dashboard: http://localhost:4566"
echo "DynamoDB endpoint: http://localhost:4566"
echo ""
echo "For local testing:"
echo "- Unit tests: npm test (uses mocked auth context)"
echo "- Integration tests: npm run test:integration (direct Lambda invocation with LocalStack DynamoDB)"
echo "- Smoke tests: npm run test:smoke (against deployed environment with real Cognito)"