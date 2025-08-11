#!/bin/bash

echo "Running integration tests against LocalStack..."

# Run the Jest integration tests
npm run test:integration

echo "Integration tests completed!"