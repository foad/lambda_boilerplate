# GitHub Actions Workflows

This document describes the GitHub Actions workflows configured for the Lambda Boilerplate project.

## Workflows Overview

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Environment Variables:**

- `NODE_VERSION: "22"` - Node.js runtime version
- `TERRAFORM_VERSION: "1.6.0"` - Terraform version

**Jobs:**

#### Test & Build Job

**Runs on:** All triggers (push and PR)

**Actions:**

- Checkout code
- Setup Node.js 22
- Install dependencies with `npm ci`
- Run ESLint for code quality
- Execute unit tests with Jest
- Generate test coverage reports
- Build Lambda functions with webpack
- Upload coverage to Codecov
- Cache build artifacts for deployment jobs

#### Terraform Plan Job

**Runs on:** Pull requests only

**Actions:**

- Restore build artifacts from cache
- Configure AWS credentials via OIDC
- Setup Terraform
- Initialize Terraform with development backend
- Run `terraform plan` for development environment
- Comment plan results on PR

#### Deploy Development Job

**Runs on:** Push to `develop` branch only

**Environment:** `development`

**Actions:**

- Restore build artifacts from cache
- Configure AWS credentials via OIDC
- Setup Terraform with development backend
- Run Terraform plan and apply
- Get API Gateway URL from Terraform output
- **Run smoke tests against deployed API**
- Create GitHub deployment record
- Handle deployment failures with proper status updates

#### Deploy Production Job

**Runs on:** Push to `main` branch only

**Environment:** `production`

**Actions:**

- Restore build artifacts from cache
- Configure AWS credentials via OIDC
- Setup Terraform with production backend
- Run Terraform plan and apply
- Get API Gateway URL from Terraform output
- **Run smoke tests against deployed API**
- Create GitHub deployment record
- Handle deployment failures with proper status updates

### 2. Destroy Infrastructure (`destroy.yml`)

**Triggers:**

- Manual workflow dispatch only

**Inputs:**

- `environment`: Choose development or production
- `confirm`: Must type "destroy" to proceed

**Actions:**

- Validate confirmation input
- Configure AWS credentials
- Run Terraform destroy
- Confirm destruction completion

## Key Features

### Integrated Smoke Testing

- Smoke tests run automatically after each deployment
- Tests verify API functionality before marking deployment as successful
- Uses the actual deployed API endpoints
- Includes health checks, error handling, and CORS validation

### Build Artifact Caching

- Build artifacts cached between jobs for efficiency
- Reduces deployment time by avoiding redundant builds
- Cache key based on commit SHA for accuracy

### Comprehensive Error Handling

- Deployment failures properly recorded in GitHub
- Terraform apply failures handled gracefully
- Smoke test failures mark deployment as failed
- Detailed error logging for debugging

### Environment Separation

- Development: Auto-deploys from `develop` branch
- Production: Auto-deploys from `main` branch
- Separate Terraform state files for each environment
- Environment-specific AWS credentials and permissions

## Security Features

### OIDC Authentication

- Uses AWS OIDC provider for secure authentication
- No long-lived AWS access keys stored in GitHub
- Role-based access with least-privilege permissions

### Environment Protection

- Production environment can be configured with manual approval
- Separate IAM roles for development and production
- Branch-based deployment restrictions

### Deployment Permissions

```yaml
permissions:
  id-token: write # For OIDC authentication
  contents: read # For repository access
  deployments: write # For GitHub deployment records
  pull-requests: write # For PR comments (plan job only)
```

## Configuration Requirements

### Repository Secrets

- `AWS_ROLE_ARN_DEV`: Development deployment role ARN
- `AWS_ROLE_ARN_PROD`: Production deployment role ARN

### Repository Variables

- `AWS_REGION`: AWS region for deployments (default: eu-west-2)

### GitHub Environments

- `development`: Auto-deploys from develop branch
- `production`: Auto-deploys from main branch

## Deployment Process

### Development Deployment

1. Push code to `develop` branch
2. CI/CD pipeline runs automatically:
   - Tests and builds code
   - Deploys to development environment
   - Runs smoke tests against deployed API
   - Marks deployment as successful if all tests pass

### Production Deployment

1. Create PR to `main` branch
2. Terraform plan shown in PR comments
3. Merge PR after review
4. Production deployment triggers automatically:
   - Tests and builds code
   - Deploys to production environment
   - Runs smoke tests against production API
   - Marks deployment as successful if all tests pass

### Manual Infrastructure Cleanup

1. Go to Actions → Destroy Infrastructure
2. Select environment (development/production)
3. Type "destroy" to confirm
4. Infrastructure destroyed completely

## Testing Strategy

### Unit Tests

- Run on every push and PR
- Use Jest with TypeScript
- Include coverage reporting
- Mock external dependencies (DynamoDB, etc.)

### Integration Tests

- Test actual Lambda functions against LocalStack
- Use real DynamoDB table (cleared between tests)
- Test end-to-end API workflows

### Smoke Tests

- Run against deployed environments
- Test critical API endpoints
- Verify CORS configuration
- Validate error handling
- 30-second timeout for deployed APIs

## Runtime Configuration

### Node.js Version

- **Runtime:** Node.js 22.x (updated from 18.x for continued AWS support)
- **CI/CD:** Node.js 22 for builds and tests
- **Lambda:** nodejs22.x runtime for all functions

### Build Process

- Uses webpack for Lambda function bundling
- Separate bundles for each Lambda function
- TypeScript compilation with strict settings
- Source maps enabled for debugging

## Monitoring and Debugging

### Workflow Status

- Check Actions tab for workflow status
- View detailed logs for each step
- Monitor deployment progress in real-time
- GitHub deployment records track status

### Common Issues

- **OIDC Authentication Failures**: Check role ARNs and trust policies
- **Terraform Errors**: Review AWS permissions and resource conflicts
- **Build Failures**: Check Node.js version and dependency issues
- **Smoke Test Failures**: API may not be responding correctly
- **Cache Issues**: Clear build artifact cache if needed

### Debugging Tips

1. Check workflow logs for detailed error messages
2. Verify AWS credentials and permissions
3. Ensure Terraform state backend is accessible
4. Test smoke tests locally with deployed API URL
5. Validate environment variables and secrets

## Best Practices

### Branch Strategy

- Use `develop` for development and testing
- Use `main` for production releases
- Create feature branches for new development
- Use pull requests for code review and Terraform planning

### Deployment Safety

- Always review Terraform plans in PRs
- Monitor smoke test results after deployments
- Use environment protection rules for production
- Keep dependencies and runtime versions up to date

### Performance

- Build artifact caching reduces deployment time
- Parallel job execution where possible
- Efficient Docker layer caching
- Optimized Lambda bundle sizes

## Customization

### Adding New Environments

1. Create new IAM role with appropriate trust policy
2. Add role ARN to repository secrets
3. Create new environment in GitHub settings
4. Add deployment job to `ci-cd.yml` workflow
5. Configure separate Terraform backend

### Extending Tests

- Add more smoke test scenarios in `src/smoke-tests/`
- Extend integration tests for new features
- Add performance testing steps
- Include security scanning (Snyk, CodeQL)

### Notifications

- Add Slack notifications for deployment status
- Integrate with monitoring tools (DataDog, New Relic)
- Set up alerts for deployment failures
- Configure email notifications for critical issues
