# Serverless Todo API

A serverless todo API built with AWS Lambda, DynamoDB, and API Gateway.

## Local Development with LocalStack

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- AWS CLI with LocalStack wrapper (`awslocal`)

### Quick Start

1. **Start LocalStack and deploy functions:**

   ```bash
   npm run local:setup
   ```

2. **Run integration tests:**

   ```bash
   npm run test:integration
   ```

3. **Stop LocalStack:**
   ```bash
   npm run stop-local
   ```

### Available Scripts

- `npm run start-local` - Start LocalStack and initialize DynamoDB table
- `npm run deploy-local` - Build and deploy Lambda functions to LocalStack
- `npm run test-local` - Run integration tests against LocalStack
- `npm run stop-local` - Stop LocalStack containers
- `npm run local:setup` - Complete setup (start + deploy)

### Environment

The local environment uses:

- **LocalStack Endpoint:** http://localhost:4566
- **DynamoDB Table:** todos
- **AWS Region:** eu-west-2
- **AWS Credentials:** test/test (LocalStack defaults)

### API Endpoints

- **Create Todo:** POST with `{"title": "Todo title"}`
- **Read Todos:** GET returns all todos
- **Update Todo:** PUT toggles todo status between pending/completed
