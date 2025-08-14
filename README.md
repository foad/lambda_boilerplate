# Lambda Boilerplate

[![CI/CD Pipeline](https://github.com/foad/lambda_boilerplate/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/foad/lambda_boilerplate/actions/workflows/ci-cd.yml)

A boilerplate repository that can be cloned and modified to quickly spin up nearly-free APIs using AWS Lambda.

## 🚀 Features

- **Serverless Architecture**: Built with AWS Lambda, DynamoDB, and API Gateway
- **TypeScript**: Full type safety with modern ES6+ features
- **Cost Optimized**: Pay-per-use model with minimal idle costs (~$0.00-0.02/month)
- **Local Development**: Complete LocalStack environment for offline development
- **Automated CI/CD**: GitHub Actions with AWS OIDC authentication
- **Infrastructure as Code**: Terraform for reproducible deployments
- **Comprehensive Testing**: Unit tests, integration tests, and coverage reporting
- **CORS Enabled**: Ready for frontend integration

## 📋 API Documentation

### Base URL

- **Production**: `https://{api-id}.execute-api.{region}.amazonaws.com/production`
- **Development**: `https://{api-id}.execute-api.{region}.amazonaws.com/development`
- **Local**: `http://localhost:4566/restapis/{api-id}/production/_user_request_`

### Endpoints

#### Create Todo

- **Method**: `POST`
- **Path**: `/todos`
- **Description**: Creates a new todo item

**Request Body:**

```json
{
  "title": "Buy groceries"
}
```

**Success Response (201):**

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy groceries",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "errors": ["Title is required"]
    }
  }
}
```

#### Get All Todos

- **Method**: `GET`
- **Path**: `/todos`
- **Description**: Retrieves all todo items

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Buy groceries",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "987fcdeb-51a2-43d1-9c4f-123456789abc",
      "title": "Walk the dog",
      "status": "completed",
      "createdAt": "2024-01-15T09:15:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
    }
  ]
}
```

**Empty Response (200):**

```json
{
  "data": []
}
```

#### Complete Todo

- **Method**: `PUT`
- **Path**: `/todos/{id}/complete`
- **Description**: Marks a todo as completed

**Success Response (200):**

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy groceries",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Not Found Response (404):**

```json
{
  "error": {
    "message": "Todo not found",
    "code": "NOT_FOUND"
  }
}
```

### Example Usage

#### Using curl

```bash
# Create a todo
curl -X POST https://your-api-url/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn serverless architecture"}'

# Get all todos
curl https://your-api-url/todos

# Complete a todo
curl -X PUT https://your-api-url/todos/123e4567-e89b-12d3-a456-426614174000/complete
```

#### Using JavaScript/Fetch

```javascript
// Create a todo
const response = await fetch("https://your-api-url/todos", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Learn serverless architecture",
  }),
});
const newTodo = await response.json();

// Get all todos
const todosResponse = await fetch("https://your-api-url/todos");
const todos = await todosResponse.json();

// Complete a todo
const completeResponse = await fetch(
  `https://your-api-url/todos/${todoId}/complete`,
  {
    method: "PUT",
  }
);
const completedTodo = await completeResponse.json();
```

## 🛠️ Local Development with LocalStack

### Prerequisites

- **Docker and Docker Compose** - For running LocalStack
- **Node.js 22+** - Runtime environment
- **AWS CLI** - For LocalStack interaction (optional)

### Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start LocalStack and deploy functions:**

   ```bash
   npm run local:setup
   ```

3. **Run integration tests:**

   ```bash
   npm run test:integration
   ```

4. **Stop LocalStack:**
   ```bash
   npm run stop-local
   ```

### Available Scripts

| Script                     | Description                                     |
| -------------------------- | ----------------------------------------------- |
| `npm run start-local`      | Start LocalStack and initialize DynamoDB table  |
| `npm run deploy-local`     | Build and deploy Lambda functions to LocalStack |
| `npm run stop-local`       | Stop LocalStack containers                      |
| `npm run local:setup`      | Complete setup (start + deploy)                 |
| `npm test`                 | Run unit tests                                  |
| `npm run test:integration` | Run integration tests against LocalStack        |
| `npm run test:smoke`       | Run smoke tests against deployed API            |
| `npm run test:coverage`    | Run tests with coverage report                  |
| `npm run build`            | Build TypeScript and package Lambda functions   |
| `npm run lint`             | Run ESLint on source code                       |

### Local Environment Configuration

The local development environment uses:

- **LocalStack Endpoint**: `http://localhost:4566`
- **DynamoDB Table**: `todos`
- **AWS Region**: `eu-west-2`
- **AWS Credentials**: `test/test` (LocalStack defaults)
- **API Gateway**: Auto-generated endpoint URL

### Testing Your Local API

Once LocalStack is running, you can test the API:

```bash
# Get the API Gateway URL from LocalStack logs
# The URL format is: http://localhost:4566/restapis/{api-id}/production/_user_request_

# Create a todo
curl -X POST http://localhost:4566/restapis/{api-id}/production/_user_request_/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test local development"}'

# Get all todos
curl http://localhost:4566/restapis/{api-id}/production/_user_request_/todos
```

## 🚀 Deployment

### Initial Setup

#### 1. AWS OIDC Configuration

Follow the comprehensive setup guide in [.github/DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md) to configure:

- AWS OIDC Identity Provider
- IAM roles for GitHub Actions
- Required permissions and policies

#### 2. GitHub Repository Configuration

**Required Secrets** (Settings → Secrets and variables → Actions):

- `AWS_ROLE_ARN_DEV`: Development deployment role ARN
- `AWS_ROLE_ARN_PROD`: Production deployment role ARN

**Required Variables**:

- `AWS_REGION`: AWS region for deployment (default: `eu-west-2`)

#### 3. Remote State Setup

```bash
# Run the setup script for each environment
./scripts/setup-remote-state.sh development
./scripts/setup-remote-state.sh production
```

See [.github/REMOTE_STATE_SETUP.md](.github/REMOTE_STATE_SETUP.md) for detailed instructions.

### Deployment Workflow

#### Automatic Deployments

1. **Development**: Push to `develop` branch

2. **Production**: Merge a PR into the `main` branch

#### Accessing Deployment URLs

After successful deployments, API URLs are available on the **GitHub Deployments Page**:

- Visit `https://github.com/foad/lambda_boilerplate/deployments`
- Click on any deployment to see the environment URL

#### Manual Operations

- **Destroy Infrastructure**: Use the "Destroy Infrastructure" workflow in GitHub Actions
- **Manual Deploy**: Trigger workflows manually from the Actions tab

### Cost Estimation

| Component            | Idle Cost             | Light Usage (1000 requests/month) |
| -------------------- | --------------------- | --------------------------------- |
| **API Gateway**      | $0.00                 | ~$0.0035                          |
| **Lambda Functions** | $0.00                 | ~$0.0001                          |
| **DynamoDB**         | $0.00-0.02            | ~$0.25                            |
| **CloudWatch Logs**  | ~$0.01                | ~$0.50                            |
| **Total**            | **~$0.01-0.03/month** | **~$0.75/month**                  |

**Notes**:

- Costs scale with usage (pay-per-request model)
- No charges for idle time on Lambda and API Gateway
- DynamoDB uses on-demand billing
- Development environment has similar costs

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│ Lambda Functions │───▶│    DynamoDB     │
│                 │    │                  │    │                 │
│ • REST API      │    │ • Create Todo    │    │ • todos table   │
│ • CORS enabled  │    │ • Read Todos     │    │ • Pay-per-req   │
│ • Regional      │    │ • Update Todo    │    │ • Encrypted     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧪 Development & Testing

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **Docker & Docker Compose** - For LocalStack (local development)
- **AWS CLI** - For deployment (optional for local dev)

### Development Workflow

1. **Setup**:

   ```bash
   # Clone and install dependencies
   git clone <repository-url>
   cd lambda_boilerplate
   npm install
   ```

2. **Local Development**:

   ```bash
   # Start local environment
   npm run local:setup

   # Make changes to code
   # Re-deploy to LocalStack
   npm run deploy-local
   ```

3. **Testing**:

   ```bash
   # Run unit tests
   npm test

   # Run integration tests (requires local environment)
   npm run test:integration

   # Generate coverage report
   npm run test:coverage
   ```

4. **Build**:

   ```bash
   # Build for production
   npm run build
   ```

### Debugging

**Local Development Issues**:

```bash
# Check LocalStack status
curl http://localhost:4566/health

# View LocalStack logs
docker-compose logs localstack

# List DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
