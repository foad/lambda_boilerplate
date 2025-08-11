#!/bin/bash

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "running"'; do
  echo "Waiting for DynamoDB service..."
  sleep 2
done

echo "LocalStack is ready. Creating DynamoDB table..."

# Create the todos table
awslocal dynamodb create-table \
    --table-name todos \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1 \
    --no-cli-pager

echo "DynamoDB table 'todos' created successfully!"

# Verify table creation (without pager)
awslocal dynamodb list-tables \
    --region us-east-1 \
    --no-cli-pager