#!/bin/bash

echo "Building and deploying Lambda functions to LocalStack..."

# Build the project
npm run build

# Create zip files for Lambda functions
echo "Creating zip files..."
cd dist
zip -r create-todo.zip create-todo/
zip -r read-todos.zip read-todos/
zip -r update-todo.zip update-todo/
cd ..

# Create Lambda functions in LocalStack
echo "Creating Lambda functions..."

# Delete existing functions first
echo "Deleting existing Lambda functions..."
awslocal lambda delete-function --function-name create-todo --region us-east-1 --no-cli-pager 2>/dev/null || true
awslocal lambda delete-function --function-name read-todos --region us-east-1 --no-cli-pager 2>/dev/null || true
awslocal lambda delete-function --function-name update-todo --region us-east-1 --no-cli-pager 2>/dev/null || true

# Create create-todo function
awslocal lambda create-function \
    --function-name create-todo \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/create-todo.zip \
    --environment Variables="{TODOS_TABLE_NAME=todos,AWS_REGION=us-east-1}" \
    --region us-east-1 \
    --no-cli-pager

# Create read-todos function
awslocal lambda create-function \
    --function-name read-todos \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/read-todos.zip \
    --environment Variables="{TODOS_TABLE_NAME=todos,AWS_REGION=us-east-1}" \
    --region us-east-1 \
    --no-cli-pager

# Create update-todo function
awslocal lambda create-function \
    --function-name update-todo \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/update-todo.zip \
    --environment Variables="{TODOS_TABLE_NAME=todos,AWS_REGION=us-east-1}" \
    --region us-east-1 \
    --no-cli-pager

echo "Lambda functions deployed to LocalStack!"