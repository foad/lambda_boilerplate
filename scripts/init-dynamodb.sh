#!/bin/bash

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
until awslocal dynamodb list-tables --endpoint-url=http://localhost:4566 > /dev/null 2>&1; do
  echo "Waiting for DynamoDB service to be responsive..."
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
    --region us-east-1

echo "DynamoDB table 'todos' created successfully!"

# Verify table creation
awslocal dynamodb list-tables \
    --region us-east-1