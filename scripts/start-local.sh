#!/bin/bash

echo "Starting LocalStack environment..."

# Start LocalStack with docker compose
docker compose up -d

echo "LocalStack started. Waiting for services to be ready..."

# Wait for LocalStack to be fully ready
sleep 10

# Initialize DynamoDB table
./scripts/init-dynamodb.sh

echo "Local development environment is ready!"
echo "LocalStack Dashboard: http://localhost:4566"
echo "DynamoDB endpoint: http://localhost:4566"