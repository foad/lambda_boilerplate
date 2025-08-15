# Lambda Boilerplate Setup Guide

This guide shows you how to extend this Lambda boilerplate by adding new API endpoints and integrating additional AWS services.

## 🚀 Quick Start

This boilerplate comes with a working authenticated todo API. Use these guides to:

- **Customize Project Settings** - Update naming and configuration
- **Configure Authentication** - Set up Cognito User Pool for your project
- **Add New Endpoints** - Extend your API with additional resources
- **Integrate AWS Services** - Add services like SNS, S3, etc.

---

## 🔧 Project Customization Checklist

When you first clone this boilerplate, follow this checklist to customize it for your project. This focuses on project metadata, documentation, and configuration rather than code changes.

### Step 1: Project Identity & Metadata

**`package.json`** - Update project information:

```jsonc
{
  "name": "your-project-name", // Change from "lambda_boilerplate"
  "description": "Your project description", // Update description
  "author": "Your Name <your.email@example.com>", // Add your details
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo-name.git"
  },
  "homepage": "https://github.com/your-username/your-repo-name#readme"
}
```

**`terraform/main.tf`** - Update resource tags:

```terraform
locals {
  common_tags = {
    Application = "your-application-name"     // Change from "lambda_boilerplate"
    Repository  = "https://github.com/your-username/your-repo-name"  // Update repo URL
    Owner       = "your-name"                 // Update owner
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

### Step 2: Documentation Updates

**`README.md`** - Complete rewrite for your project:

1. **Update the header section:**

   ```markdown
   # Your Project Name

   [![CI/CD Pipeline](https://github.com/your-username/your-repo-name/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/your-repo-name/actions/workflows/ci-cd.yml)

   Brief description of what your API does and its main features.
   ```

2. **Replace the features section** with your project's specific features

3. **Update API documentation** - Replace the todo API examples with your endpoints

4. **Update deployment URLs:**

   - Line ~304: `https://github.com/your-username/your-repo-name/deployments`
   - Line ~358: Update clone command with your repo URL

5. **Update cost estimation** if your usage patterns differ significantly

**`.github/DEPLOYMENT_SETUP.md`** - Update with your project details:

- Replace repository references
- Update IAM role names if you customize them
- Add any project-specific deployment notes

**`.github/REMOTE_STATE_SETUP.md`** - Update bucket names:

- Replace `terraform-state-serverless-todo-api` with your bucket name pattern

### Step 3: Infrastructure Configuration

**`terraform/variables.tf`** - Update default values:

```terraform
variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "your-name"              // Change from "foad"
}

# Add any project-specific variables you need
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "your-project-name"
}
```

**`terraform/outputs.tf`** - Add any additional outputs your project needs

**API Gateway naming** - If you want to rename the API:

```terraform
# In terraform/api-gateway.tf
resource "aws_api_gateway_rest_api" "todos_api" {
  name        = "${var.environment}-your-api-name"    // Update this
  description = "Your API Description"                // Update this
}
```

**Environment-specific configurations:**

- Add environment-specific variables in `terraform/variables.tf`
- Update `terraform/main.tf` if you need different configurations per environment

### Step 4: GitHub Actions Configuration

**`.github/workflows/ci-cd.yml`** - Update state bucket names:

```yaml
# In both development and production sections, update:
bucket = "terraform-state-your-project-name" # Change from "terraform-state-serverless-todo-api"
```

**GitHub Repository Settings:**

1. **Secrets** (Settings → Secrets and variables → Actions):

   - `AWS_ROLE_ARN_DEV` - Your development deployment role ARN
   - `AWS_ROLE_ARN_PROD` - Your production deployment role ARN

2. **Variables**:

   - `AWS_REGION` - Your preferred AWS region (default: eu-west-2)

3. **Branch Protection** (Settings → Branches):
   - Protect `main` branch
   - Require PR reviews
   - Require status checks to pass

### Step 5: Local Development Configuration

**`docker-compose.yml`** - Update if you have one, or create for additional services

**`scripts/setup-remote-state.sh`** - Update bucket names:

```bash
# Update the bucket name pattern throughout the script
BUCKET_NAME="terraform-state-your-project-name"
```

### Step 6: Remove Boilerplate References

**Search and replace these globally:**

1. **Repository references:**

   - Find: `foad/lambda_boilerplate`
   - Replace: `your-username/your-repo-name`

2. **Project name:**

   - Find: `lambda_boilerplate`
   - Replace: `your-project-name`

**Files that need attention:**

- `README.md` - Complete rewrite
- `package.json` - Metadata updates
- `terraform/main.tf` - Tag updates
- `.github/workflows/ci-cd.yml` - Bucket names
- `.github/DEPLOYMENT_SETUP.md` - Repository references
- `.github/REMOTE_STATE_SETUP.md` - Bucket names
- `scripts/setup-remote-state.sh` - Bucket names

### Step 7: Verification Checklist

After making changes, verify:

- [ ] **Build works:** `npm run build`
- [ ] **Tests pass:** `npm test`
- [ ] **Terraform validates:** `cd terraform && terraform validate`
- [ ] **No broken links** in README.md
- [ ] **GitHub Actions workflow** references correct repository
- [ ] **All repository URLs** updated consistently
- [ ] **Project name** updated in all relevant files
- [ ] **Owner/author information** updated everywhere

### Step 8: Initial Deployment Setup

1. **Set up AWS OIDC** following `.github/DEPLOYMENT_SETUP.md`

2. **Create remote state buckets:**

   ```bash
   ./scripts/setup-remote-state.sh development
   ./scripts/setup-remote-state.sh production
   ```

3. **Configure GitHub secrets** with your AWS role ARNs

4. **Test deployment** by pushing to `develop` branch

### Step 9: Configure Authentication

The boilerplate includes AWS Cognito User Pool authentication. Here's how to customize it:

**`terraform/cognito.tf`** - Update Cognito configuration:

```terraform
# Update user pool name and settings
resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.environment}-your-app-users"  // Change from "lambda-boilerplate-users"

  # Customize password policy if needed
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Customize user attributes
  schema {
    attribute_data_type = "String"
    name               = "email"
    required           = true
    mutable            = true
  }

  # Add custom attributes if needed
  schema {
    attribute_data_type = "String"
    name               = "company"
    required           = false
    mutable            = true
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "${var.environment}-your-app-client"  // Update client name
  user_pool_id = aws_cognito_user_pool.user_pool.id

  # Customize authentication flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"  // Add if you want SRP authentication
  ]
}
```

**Creating Test Users:**

After deployment, create test users for development:

```bash
# Create a test user
aws cognito-idp admin-create-user \
  --user-pool-id <your-user-pool-id> \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id <your-user-pool-id> \
  --username testuser \
  --password YourPassword123! \
  --permanent
```

### Step 10: Clean Up Todo References

If you want to remove the example todo functionality entirely:

**Keep these files** (they're generic infrastructure):

- `src/lib/dynamodb.ts`
- `src/lib/responses.ts`
- `src/utils/validation.ts` (modify as needed)
- All Terraform files (just update naming)
- All GitHub Actions files
- Build configuration files

**Remove or replace these** (they're todo-specific):

- `src/handlers/create-todo.ts`
- `src/handlers/read-todos.ts`
- `src/handlers/update-todo.ts`
- `src/handlers/*.test.ts` files
- Todo-related types in `src/lib/types.ts`
- Todo-specific API Gateway resources in `terraform/api-gateway.tf`
- Todo-specific Lambda functions in `terraform/lambda.tf`

**Update these:**

- `webpack.config.js` - Remove todo entry points, add your own
- `terraform/dynamodb.tf` - Replace todos table with your tables
- `scripts/deploy-local.sh` - Replace todo functions with your functions

---

## 🔐 Authentication Setup Guide

This boilerplate uses AWS Cognito User Pool for authentication. All API endpoints require a valid JWT token.

### Understanding the Authentication Flow

1. **User Registration/Login** → Cognito User Pool
2. **Receive JWT Token** → Include in API requests
3. **API Gateway** → Validates token with Cognito
4. **Lambda Functions** → Extract user context from validated token

### Local Development with Authentication

For local development, the boilerplate includes test utilities:

```typescript
// src/lib/test-auth-utils.ts provides utilities for testing
import { createMockAuthContext } from "../lib/test-auth-utils";

// In your tests
const mockEvent = {
  ...baseEvent,
  requestContext: {
    ...baseEvent.requestContext,
    authorizer: createMockAuthContext("test-user-id"),
  },
};
```

### LocalStack Limitations:

LocalStack's free tier doesn't include Cognito, so local development uses mock authentication:

- API Gateway authorizer is disabled in local environment
- Lambda functions receive mock user context
- Integration tests use test utilities to simulate authentication

---

## 📋 Adding a New API Endpoint

Follow this pattern to add new endpoints to your API. We'll use a "users" endpoint as an example.

### Step 1: Define Data Types

**`src/lib/types.ts`** - Add your new interfaces:

```typescript
// Add alongside existing Todo types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
}

export interface UpdateUserRequest {
  name?: string;
}
```

### Step 2: Create Lambda Handler

**`src/handlers/create-user.ts`** - New handler file:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getDynamoClient } from "../lib/dynamodb";
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createUnauthorizedResponse,
} from "../lib/responses";
import { parseRequestBody } from "../utils/validation";
import { getUserFromEvent } from "../lib/auth";
import { User, CreateUserRequest } from "../lib/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract authenticated user context
    const userContext = getUserFromEvent(event);
    if (!userContext) {
      return createUnauthorizedResponse("Authentication required");
    }

    const requestBody = parseRequestBody<CreateUserRequest>(event.body);
    if (!requestBody) {
      return createValidationErrorResponse("Request body is required");
    }

    // Add validation logic here
    if (!requestBody.email || !requestBody.name) {
      return createValidationErrorResponse("Email and name are required");
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: uuidv4(),
      email: requestBody.email.trim(),
      name: requestBody.name.trim(),
      userId: userContext.userId, // Associate with authenticated user
      createdAt: now,
      updatedAt: now,
    };

    const dynamoClient = getDynamoClient();
    const putCommand = new PutCommand({
      TableName: process.env.USERS_TABLE_NAME!,
      Item: newUser,
      ConditionExpression: "attribute_not_exists(id)",
    });

    await dynamoClient.send(putCommand);
    return createSuccessResponse(newUser, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return createInternalErrorResponse("Failed to create user");
  }
};
```

### Step 3: Add to Webpack Configuration

**`webpack.config.js`** - Add new entry point:

```javascript
module.exports = {
  entry: {
    "create-todo": "./src/handlers/create-todo.ts",
    "read-todos": "./src/handlers/read-todos.ts",
    "update-todo": "./src/handlers/update-todo.ts",
    // Add your new handlers
    "create-user": "./src/handlers/create-user.ts",
    "read-users": "./src/handlers/read-users.ts",
    "update-user": "./src/handlers/update-user.ts",
  },
  // ... rest of config
};
```

### Step 4: Create DynamoDB Table

**`terraform/dynamodb.tf`** - Add new table:

```terraform
# Add alongside existing todos table
resource "aws_dynamodb_table" "users" {
  name           = "${var.environment}-users"
  billing_mode   = "ON_DEMAND"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Optional: Add GSI for email lookups
  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name     = "email-index"
    hash_key = "email"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-users-table"
    Type = "DynamoDB-Table"
  })
}
```

### Step 5: Create Lambda Function

**`terraform/lambda.tf`** - Add new Lambda function:

```terraform
# Add alongside existing Lambda functions
data "archive_file" "create_user_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../dist/create-user"
  output_path = "${path.root}/../dist/create-user.zip"
}

resource "aws_lambda_function" "create_user" {
  filename      = data.archive_file.create_user_zip.output_path
  function_name = "${var.environment}-create-user"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 10

  source_code_hash = data.archive_file.create_user_zip.output_base64sha256

  environment {
    variables = {
      USERS_TABLE_NAME = aws_dynamodb_table.users.name
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-create-user"
    Type = "Lambda-Function"
  })
}

resource "aws_cloudwatch_log_group" "create_user_logs" {
  name              = "/aws/lambda/${aws_lambda_function.create_user.function_name}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${var.environment}-create-user-logs"
    Type = "CloudWatch-LogGroup"
  })
}
```

### Step 6: Add API Gateway Resources

**`terraform/api-gateway.tf`** - Add new API resources:

```terraform
# Add alongside existing todos resources
resource "aws_api_gateway_resource" "users_resource" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  parent_id   = aws_api_gateway_rest_api.todos_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_method" "create_user_method" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "create_user_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.create_user_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_user.invoke_arn
}

resource "aws_lambda_permission" "create_user_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.todos_api.execution_arn}/*/*"
}

# Add CORS support
resource "aws_api_gateway_method" "users_options" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.users_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "users_options_response" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = aws_api_gateway_method_response.users_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
```

### Step 7: Update IAM Permissions

**`terraform/iam.tf`** - Add permissions for new table:

```terraform
# Update the existing DynamoDB policy to include new table
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${var.environment}-lambda-dynamodb-policy"
  description = "IAM policy for Lambda functions to access DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.todos.arn,
          "${aws_dynamodb_table.todos.arn}/*",
          # Add new table permissions
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/*"
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-dynamodb-policy"
    Type = "IAM-Policy"
  })
}
```

### Step 8: Update Local Development

**`scripts/deploy-local.sh`** - Add new function deployment:

```bash
# Add after existing function deployments
echo "Creating create-user function..."
awslocal lambda create-function \
    --function-name create-user \
    --runtime nodejs22.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://dist/create-user.zip \
    --environment Variables="{USERS_TABLE_NAME=users,AWS_REGION=eu-west-2}" \
    --region eu-west-2

# Add API Gateway integration
USERS_RESOURCE_ID=$(awslocal apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part "users" --region eu-west-2 | jq -r '.id')

echo "Setting up POST /users..."
awslocal apigateway put-method --rest-api-id $API_ID --resource-id $USERS_RESOURCE_ID --http-method POST --authorization-type NONE --region eu-west-2
awslocal apigateway put-integration --rest-api-id $API_ID --resource-id $USERS_RESOURCE_ID --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:000000000000:function:create-user/invocations" --region eu-west-2
```

### Step 9: Add Tests

**`src/handlers/create-user.test.ts`** - Unit tests:

```typescript
import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "./create-user";
import { createMockAuthContext } from "../lib/test-auth-utils";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("create-user handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.USERS_TABLE_NAME = "test-users";
  });

  it("should create a user successfully", async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = {
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
      }),
      requestContext: {
        authorizer: createMockAuthContext("test-user-123"),
      },
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data.email).toBe("test@example.com");
    expect(body.data.name).toBe("Test User");
    expect(body.data.userId).toBe("test-user-123");
  });

  it("should return 401 for missing authentication", async () => {
    const event = {
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
      }),
      requestContext: {}, // No authorizer context
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it("should return 400 for missing email", async () => {
    const event = {
      body: JSON.stringify({ name: "Test User" }),
      requestContext: {
        authorizer: createMockAuthContext("test-user-123"),
      },
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });
});
```

---

## 🔗 Adding AWS Service Integration

Let's add SNS (Simple Notification Service) integration as an example. This pattern works for other services like SES, S3, etc.

### Step 1: Install AWS SDK Dependencies

**`package.json`** - Add SNS client:

```jsonc
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/lib-dynamodb": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0", // Add this
    "uuid": "^9.0.1"
  }
}
```

### Step 2: Create Service Wrapper

**`src/lib/sns.ts`** - SNS client wrapper:

```typescript
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

let snsClient: SNSClient;

export function getSNSClient(): SNSClient {
  if (!snsClient) {
    snsClient = new SNSClient({
      region: process.env.AWS_REGION || "eu-west-2",
      // For LocalStack
      ...(process.env.AWS_ENDPOINT_URL && {
        endpoint: process.env.AWS_ENDPOINT_URL,
      }),
    });
  }
  return snsClient;
}

export async function publishNotification(
  topicArn: string,
  message: string,
  subject?: string
): Promise<void> {
  const client = getSNSClient();

  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: message,
    Subject: subject,
  });

  await client.send(command);
}
```

### Step 3: Create SNS Topic in Terraform

**`terraform/sns.tf`** - New file for SNS resources:

```terraform
# SNS Topic for notifications
resource "aws_sns_topic" "notifications" {
  name = "${var.environment}-notifications"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-notifications-topic"
    Type = "SNS-Topic"
  })
}

# Optional: Add email subscription
resource "aws_sns_topic_subscription" "email_notifications" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# Output the topic ARN for use in Lambda functions
output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.notifications.arn
}
```

**`terraform/variables.tf`** - Add SNS variable:

```terraform
variable "notification_email" {
  description = "Email address for SNS notifications (optional)"
  type        = string
  default     = ""
}
```

### Step 4: Update IAM Permissions

**`terraform/iam.tf`** - Add SNS permissions:

```terraform
# Create separate SNS policy
resource "aws_iam_policy" "lambda_sns_policy" {
  name        = "${var.environment}-lambda-sns-policy"
  description = "IAM policy for Lambda functions to publish to SNS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.notifications.arn
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-sns-policy"
    Type = "IAM-Policy"
  })
}

# Attach SNS policy to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_sns_policy_attachment" {
  policy_arn = aws_iam_policy.lambda_sns_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}
```

### Step 5: Update Lambda Functions

**`terraform/lambda.tf`** - Add SNS topic ARN to environment variables:

```terraform
# Update existing Lambda functions to include SNS topic ARN
resource "aws_lambda_function" "create_todo" {
  # ... existing configuration ...

  environment {
    variables = {
      TODOS_TABLE_NAME = aws_dynamodb_table.todos.name
      SNS_TOPIC_ARN    = aws_sns_topic.notifications.arn  // Add this
    }
  }

  # ... rest of configuration ...
}

# Repeat for other Lambda functions that need SNS access
```

### Step 6: Use SNS in Handler

**`src/handlers/create-todo.ts`** - Add notification:

```typescript
import { publishNotification } from "../lib/sns";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // ... existing todo creation logic ...

    await dynamoClient.send(putCommand);

    // Send notification after successful creation
    try {
      await publishNotification(
        process.env.SNS_TOPIC_ARN!,
        `New todo created: ${newTodo.title}`,
        "Todo Created"
      );
    } catch (notificationError) {
      // Log but don't fail the request
      console.warn("Failed to send notification:", notificationError);
    }

    return createSuccessResponse(newTodo, 201);
  } catch (error) {
    // ... existing error handling ...
  }
};
```

### Step 7: Update LocalStack Configuration

**`docker-compose.yml`** - Add SNS service:

```yaml
version: "3.8"
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=dynamodb,lambda,apigateway,sns,logs # Add sns
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack-data:/tmp/localstack"
```

**`scripts/init-dynamodb.sh`** - Add SNS topic creation:

```bash
#!/bin/bash

# ... existing DynamoDB setup ...

# Create SNS topic for local development
echo "Creating SNS topic..."
awslocal sns create-topic --name notifications --region eu-west-2

echo "LocalStack setup complete!"
```

### Step 8: Update Tests with SNS Mocking

**`src/handlers/create-todo.test.ts`** - Mock SNS calls:

```typescript
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

describe("create-todo handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
    process.env.TODOS_TABLE_NAME = "test-todos";
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:eu-west-2:123456789012:test-topic";
  });

  it("should create todo and send notification", async () => {
    ddbMock.on(PutCommand).resolves({});
    snsMock.on(PublishCommand).resolves({ MessageId: "test-message-id" });

    const event = {
      body: JSON.stringify({ title: "Test todo" }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    expect(snsMock.calls()).toHaveLength(1);
  });

  it("should still succeed if notification fails", async () => {
    ddbMock.on(PutCommand).resolves({});
    snsMock.on(PublishCommand).rejects(new Error("SNS error"));

    const event = {
      body: JSON.stringify({ title: "Test todo" }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(201); // Should still succeed
  });
});
```

### Step 9: Update GitHub Actions Role

**GitHub Actions IAM Role** - Add SNS permissions to your deployment role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:ListTopics",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🚀 Deployment Checklist

Before deploying new features:

- [ ] **Unit tests pass** - `npm test`
- [ ] **Build succeeds** - `npm run build`
- [ ] **Local integration works** - `npm run local:setup && npm run test:integration`
- [ ] **Terraform validates** - `cd terraform && terraform validate`
- [ ] **IAM permissions updated** for new AWS services
- [ ] **Environment variables set** in Lambda functions
- [ ] **LocalStack configuration updated** for new services
- [ ] **GitHub Actions role has permissions** for new AWS services
