# Smoke Tests

This directory contains smoke tests that validate the deployed API endpoints to ensure the production deployment is working correctly.

## What are Smoke Tests?

Smoke tests are a subset of tests that verify the basic functionality of the deployed application. They are designed to:

- Run quickly (under 2 minutes)
- Test critical user journeys
- Validate that the deployment is accessible and functional
- Catch major deployment issues early

## Test Coverage

The smoke tests cover:

1. **Create Todo** - Validates POST /todos endpoint
2. **Read Todos** - Validates GET /todos endpoint
3. **Update Todo** - Validates PUT /todos/{id}/complete endpoint
4. **Error Handling** - Tests invalid requests and error responses
5. **CORS Configuration** - Validates cross-origin headers
6. **API Response Format** - Ensures consistent response structure

## Running Smoke Tests

### Automated (GitHub Actions)

Smoke tests run automatically after successful production deployments via the `smoke-tests.yml` workflow.

### Manual Execution

#### Option 1: Using the script (Recommended)

```bash
# Run against production (gets URL from Terraform)
./scripts/run-smoke-tests.sh --environment production

# Run against development
./scripts/run-smoke-tests.sh --environment development

# Run against a specific URL
./scripts/run-smoke-tests.sh --url https://abc123.execute-api.eu-west-2.amazonaws.com/production
```

#### Option 2: Using npm directly

```bash
# Set the API URL and run tests
export API_BASE_URL="https://your-api-gateway-url.amazonaws.com/production"
npm run test:smoke
```

#### Option 3: Using environment variable

```bash
API_BASE_URL="https://your-api-gateway-url.amazonaws.com/production" npm run test:smoke
```

## Test Configuration

### Environment Variables

- `API_BASE_URL` - The base URL of the deployed API (required)

### Test Timeouts

- Individual tests have a 30-second timeout to account for cold starts
- The overall test suite timeout is 60 seconds

### Test Data

- Tests create temporary todos with predictable names (e.g., "Smoke Test Todo")
- Tests clean up after themselves when possible
- Tests are designed to be safe to run against production

## Troubleshooting

### Common Issues

1. **API_BASE_URL not set**

   - Ensure the environment variable is set correctly
   - Check that Terraform outputs are available

2. **Tests timeout**

   - Lambda cold starts can cause delays
   - Check CloudWatch logs for Lambda function errors

3. **404 errors**

   - Verify API Gateway deployment is complete
   - Check that the correct stage is deployed

4. **403/401 errors**
   - Verify IAM permissions for Lambda functions
   - Check API Gateway resource policies

### Debugging

1. Check the API Gateway URL:

   ```bash
   cd terraform
   terraform output api_gateway_url
   ```

2. Test the API manually:

   ```bash
   curl -X GET "https://your-api-url/todos"
   ```

3. Check CloudWatch logs for Lambda functions

4. Verify DynamoDB table exists and has correct permissions

## Adding New Smoke Tests

When adding new endpoints or critical functionality:

1. Add test cases to `smoke.test.ts`
2. Keep tests focused on critical paths
3. Ensure tests are idempotent and safe for production
4. Add appropriate timeouts for network requests
5. Update this README with new test coverage

## Best Practices

- **Keep tests simple** - Focus on happy path and critical errors
- **Make tests independent** - Each test should work regardless of others
- **Use realistic data** - Test with data similar to production usage
- **Handle async properly** - Use proper async/await patterns
- **Add meaningful assertions** - Verify both status codes and response structure
