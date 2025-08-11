#!/bin/bash

echo "Invoking lambda functions locally for testing..."

# Invoke create-todo function
echo "Invoking create-todo function..."
PAYLOAD_JSON='{
  "body": "{\"title\": \"Test Todo\"}",
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json"
  }
}'

awslocal lambda invoke \
  --function-name create-todo \
  --payload "$PAYLOAD_JSON" \
  --endpoint-url=http://localhost:4566 \
  --cli-binary-format raw-in-base64-out \
  --region us-east-1 \
  response.json
if [ $? -ne 0 ]; then
  echo "Failed to invoke create-todo function."
  exit 1
fi
cat response.json

echo "create-todo function invoked successfully!"

# Invoke read-todos function
echo "Invoking read-todos function..."
awslocal lambda invoke \
  --function-name read-todos \
  --payload '{}' \
  --endpoint-url=http://localhost:4566 \
  --cli-binary-format raw-in-base64-out \
  --region us-east-1 \
  response.json
if [ $? -ne 0 ]; then
  echo "Failed to invoke read-todos function."
  exit 1
fi
cat response.json

echo "read-todos function invoked successfully!"

# Invoke update-todo function
echo "Invoking update-todo function..."
PAYLOAD_JSON='{
  "pathParameters": {
    "id": "<todo-id>"  # Replace with a valid todo ID
  },
  "body": "{\"title\": \"Updated Todo\"}",
  "httpMethod": "PUT",
  "headers": {
    "Content-Type": "application/json"
  }
}'
awslocal lambda invoke \
  --function-name update-todo \
  --payload "$PAYLOAD_JSON" \
  --endpoint-url=http://localhost:4566 \
  --cli-binary-format raw-in-base64-out \
  --region us-east-1 \
  response.json
if [ $? -ne 0 ]; then
  echo "Failed to invoke update-todo function."
  exit 1
fi
cat response.json

echo "Local tests completed!"