# Serverless Todo API

[![Test](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/test.yml)
[![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/deploy.yml)

A serverless todo API built with AWS Lambda, DynamoDB, and API Gateway with automated CI/CD deployment.

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

## Deployment

This project uses GitHub Actions for automated deployment to AWS.

### Environments

- **Development:** Deploys automatically on push to `develop` branch
- **Production:** Deploys automatically on push to `main` branch

### Setup AWS Deployment

1. **Configure AWS OIDC Authentication:**
   Follow the detailed setup guide in [.github/DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md)

2. **Set Repository Secrets:**

   - `AWS_ROLE_ARN_DEV`: Development deployment role ARN
   - `AWS_ROLE_ARN_PROD`: Production deployment role ARN

3. **Set Repository Variables:**
   - `AWS_REGION`: AWS region for deployment (default: eu-west-2)

### Deployment Workflow

- **Pull Requests:** Shows Terraform plan in PR comments
- **Develop Branch:** Deploys to development environment
- **Main Branch:** Deploys to production environment
- **Manual Destroy:** Use "Destroy Infrastructure" workflow for cleanup

### Cost Estimation

- **Idle Cost:** ~$0.00-0.02/month (minimal metadata storage)
- **Light Usage:** ~$2-5/month for development
- **Pay-per-use:** Only charged for actual API calls and data storage

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda Functions │───▶│    DynamoDB     │
│                 │    │                  │    │                 │
│ • REST API      │    │ • Create Todo    │    │ • todos table   │
│ • CORS enabled  │    │ • Read Todos     │    │ • Pay-per-req   │
│ • Regional      │    │ • Update Todo    │    │ • Encrypted     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Development

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for local development)
- AWS CLI (for deployment)

### Local Development

```bash
# Install dependencies
npm install

# Start local environment
npm run local:setup

# Run tests
npm test
npm run test:integration

# Build for deployment
npm run build
```

### Testing

- **Unit Tests:** `npm test`
- **Integration Tests:** `npm run test:integration`
- **Coverage:** `npm run test:coverage`
- **Linting:** `npm run lint`
