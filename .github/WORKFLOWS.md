# GitHub Actions Workflows

This document describes the GitHub Actions workflows configured for the Serverless Todo API.

## Workflows Overview

### 1. Test Workflow (`test.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Actions:**

- Install Node.js dependencies
- Run ESLint for code quality
- Execute unit tests with Jest
- Generate test coverage reports
- Build Lambda functions
- Upload coverage to Codecov (optional)

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**

- Push to `develop` branch → Deploy to development
- Push to `main` branch → Deploy to production
- Pull requests → Show Terraform plan in comments

**Jobs:**

#### Test Job

- Runs all tests and builds before deployment
- Required for all deployment jobs

#### Deploy Development

- **Trigger:** Push to `develop` branch
- **Environment:** `development`
- **Actions:**
  - Build Lambda functions
  - Configure AWS credentials via OIDC
  - Run Terraform plan and apply
  - Output API Gateway URL

#### Deploy Production

- **Trigger:** Push to `main` branch
- **Environment:** `production`
- **Actions:**
  - Build Lambda functions
  - Configure AWS credentials via OIDC
  - Run Terraform plan and apply
  - Output API Gateway URL
  - Run integration tests against production

#### Plan PR

- **Trigger:** Pull requests
- **Actions:**
  - Build Lambda functions
  - Run Terraform plan
  - Comment plan results on PR

### 3. Destroy Workflow (`destroy.yml`)

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

## Security Features

### OIDC Authentication

- Uses AWS OIDC provider for secure authentication
- No long-lived AWS access keys stored in GitHub
- Role-based access with least-privilege permissions

### Environment Protection

- Production environment requires manual approval
- Separate IAM roles for development and production
- Branch-based deployment restrictions

### Secrets Management

- AWS role ARNs stored as repository secrets
- Environment-specific configurations
- No sensitive data in workflow files

## Environment Configuration

### Repository Secrets

- `AWS_ROLE_ARN_DEV`: Development deployment role
- `AWS_ROLE_ARN_PROD`: Production deployment role

### Repository Variables

- `AWS_REGION`: AWS region for deployments (default: eu-west-2)

### GitHub Environments

- `development`: Auto-deploys from develop branch
- `production`: Auto-deploys from main branch with protection rules

## Workflow Permissions

Each workflow uses minimal required permissions:

```yaml
permissions:
  id-token: write # For OIDC authentication
  contents: read # For repository access
  pull-requests: write # For PR comments (plan-pr job only)
```

## Deployment Process

### Development Deployment

1. Push code to `develop` branch
2. Test workflow runs automatically
3. If tests pass, deploy workflow triggers
4. Infrastructure deployed to development environment
5. API URL output in workflow logs

### Production Deployment

1. Create PR to `main` branch
2. Terraform plan shown in PR comments
3. Merge PR after review
4. Production deployment triggers automatically
5. Integration tests run against production API

### Manual Cleanup

1. Go to Actions → Destroy Infrastructure
2. Select environment (development/production)
3. Type "destroy" to confirm
4. Infrastructure destroyed completely

## Monitoring and Debugging

### Workflow Status

- Check Actions tab for workflow status
- View detailed logs for each step
- Monitor deployment progress in real-time

### Common Issues

- **OIDC Authentication Failures**: Check role ARNs and trust policies
- **Terraform Errors**: Review AWS permissions and resource conflicts
- **Build Failures**: Check Node.js version and dependency issues
- **Test Failures**: Review test output and fix failing tests

### Debugging Tips

1. Check workflow logs for detailed error messages
2. Verify AWS credentials and permissions
3. Ensure Terraform state is accessible
4. Validate environment variables and secrets
5. Test locally before pushing to remote branches

## Best Practices

### Branch Strategy

- Use `develop` for development and testing
- Use `main` for production releases
- Create feature branches for new development
- Use pull requests for code review

### Deployment Safety

- Always review Terraform plans in PRs
- Use environment protection rules for production
- Monitor AWS costs and resource usage
- Keep dependencies up to date

### Security

- Regularly rotate IAM roles and policies
- Monitor CloudTrail for deployment activities
- Use least-privilege access principles
- Keep secrets and variables up to date

## Customization

### Adding New Environments

1. Create new IAM role with appropriate trust policy
2. Add role ARN to repository secrets
3. Create new environment in GitHub settings
4. Add deployment job to `deploy.yml` workflow

### Modifying Deployment Steps

1. Update workflow files in `.github/workflows/`
2. Test changes in feature branch first
3. Ensure proper error handling and rollback
4. Update documentation as needed

### Integration with Other Tools

- Add Slack notifications for deployment status
- Integrate with monitoring tools (DataDog, New Relic)
- Add security scanning (Snyk, CodeQL)
- Include performance testing steps
