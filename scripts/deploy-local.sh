#!/bin/bash

echo "Building and deploying Lambda functions to LocalStack..."

# Clean up previous builds
echo "Cleaning up previous builds..."
rm -rf dist

# Build the project
npm run build

# Create zip files for Lambda functions
echo "Creating zip files..."
cd dist
zip -j create-todo.zip create-todo/index.js
zip -j read-todos.zip read-todos/index.js
zip -j update-todo.zip update-todo/index.js
cd ..

# Create Lambda functions in LocalStack
echo "Creating Lambda functions..."

# Delete existing functions first
echo "Deleting existing functions..."
awslocal lambda delete-function --function-name create-todo --region eu-west-2 2>/dev/null || true
awslocal lambda delete-function --function-name read-todos --region eu-west-2 2>/dev/null || true
awslocal lambda delete-function --function-name update-todo --region eu-west-2 2>/dev/null || true

# Create create-todo function
awslocal lambda create-function \
    --function-name create-todo \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/create-todo.zip \
    --environment Variables="{TODOS_TABLE_NAME=todos,AWS_REGION=eu-west-2}" \
    --region eu-west-2

# Create read-todos function
awslocal lambda create-function \
    --function-name read-todos \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/read-todos.zip \
    --environment Variables="{TODOS_TABLE_NAME=todos,AWS_REGION=eu-west-2}" \
    --region eu-west-2

# Create update-todo function
awslocal lambda create-function \
    --function-name update-todo \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/update-todo.zip \
    --environment Variables="{TODOS_TABLE_NAME=todos,AWS_REGION=eu-west-2}" \
    --region eu-west-2

echo "Lambda functions deployed to LocalStack!"
echo "------------------------------------------------"

### API Gateway REST API Setup ###
echo "Setting up API Gateway REST API..."

# Create the REST API and get its ID
API_ID=$(awslocal apigateway create-rest-api --name "todos-rest-api" --region eu-west-2 | jq -r '.id')
echo "REST API created with ID: $API_ID"

# Get the root resource ID
ROOT_ID=$(awslocal apigateway get-resources --rest-api-id $API_ID --region eu-west-2 | jq -r '.items[] | select(.path == "/") | .id')

# Create the /todos resource and get its ID
TODOS_RESOURCE_ID=$(awslocal apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part "todos" --region eu-west-2 | jq -r '.id')

# Create the /{id} resource and get its ID (child of /todos)
TODO_ID_RESOURCE_ID=$(awslocal apigateway create-resource --rest-api-id $API_ID --parent-id $TODOS_RESOURCE_ID --path-part "{id}" --region eu-west-2 | jq -r '.id')


### Setup Integrations for API Methods ###

# POST /todos (Create Todo)
echo "Setting up POST /todos..."
awslocal apigateway put-method --rest-api-id $API_ID --resource-id $TODOS_RESOURCE_ID --http-method POST --authorization-type NONE --region eu-west-2
awslocal apigateway put-integration --rest-api-id $API_ID --resource-id $TODOS_RESOURCE_ID --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:000000000000:function:create-todo/invocations" --region eu-west-2

# GET /todos (Read All Todos)
echo "Setting up GET /todos..."
awslocal apigateway put-method --rest-api-id $API_ID --resource-id $TODOS_RESOURCE_ID --http-method GET --authorization-type NONE --region eu-west-2
awslocal apigateway put-integration --rest-api-id $API_ID --resource-id $TODOS_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:000000000000:function:read-todos/invocations" --region eu-west-2

# PUT /todos/{id} (Update Todo)
echo "Setting up PUT /todos/{id}..."
awslocal apigateway put-method --rest-api-id $API_ID --resource-id $TODO_ID_RESOURCE_ID --http-method PUT --authorization-type NONE --region eu-west-2
awslocal apigateway put-integration --rest-api-id $API_ID --resource-id $TODO_ID_RESOURCE_ID --http-method PUT --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:000000000000:function:update-todo/invocations" --region eu-west-2

# Deploy the API to a stage
echo "Deploying API to 'prod' stage..."
awslocal apigateway create-deployment --rest-api-id $API_ID --stage-name "prod" --region eu-west-2 --no-cli-pager

echo "REST API deployed successfully!"

API_ENDPOINT="http://localhost:4566/restapis/$API_ID/prod/_user_request_"
echo "Your API Endpoint is ready! You can test it at: $API_ENDPOINT"

echo "API_URL=$API_ENDPOINT" > .env.test
echo "Wrote API endpoint to .env.test file."