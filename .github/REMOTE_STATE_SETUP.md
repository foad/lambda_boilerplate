# Terraform Remote State Setup

This guide explains how to set up Terraform remote state storage using S3 with native locking.

## Overview

Remote state storage ensures that:

- Multiple team members can work on the same infrastructure
- State is preserved between CI/CD runs
- State is backed up and versioned
- Concurrent access is safely handled with native S3 locking

## Architecture

- **S3 Bucket**: `terraform-state-serverless-todo-api` - stores state files with native S3 locking
- **State Files**:
  - `environments/development/terraform.tfstate` - development state
  - `environments/production/terraform.tfstate` - production state

**Benefits of Native S3 Locking**:

- No additional DynamoDB tables needed
- Simplified setup and maintenance
- Lower cost (no DynamoDB charges)
- Built-in Terraform feature

## Setup Instructions

### 1. Run the Setup Script

For development environment:

```bash
./scripts/setup-remote-state.sh development
```

For production environment:

```bash
./scripts/setup-remote-state.sh production
```

### 2. Initialize Terraform with Remote State

The script will create a backend configuration file. Use it to initialize Terraform:

```bash
cd terraform
terraform init -backend-config=backend-development.hcl
```

### 3. Migrate Existing State (if applicable)

If you have existing local state files, Terraform will ask if you want to migrate them:

```bash
terraform init -backend-config=backend-development.hcl -migrate-state
```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create S3 Bucket

```bash
aws s3api create-bucket \
  --bucket terraform-state-serverless-todo-api \
  --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket terraform-state-serverless-todo-api \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket terraform-state-serverless-todo-api \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket terraform-state-serverless-todo-api \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 2. No Additional Resources Needed

With native S3 locking, no DynamoDB tables are required. Terraform handles locking automatically within S3.

## CI/CD Integration

The GitHub Actions workflows automatically:

1. Create the appropriate backend configuration for each environment
2. Initialize Terraform with remote state using S3 native locking
3. Use the correct state file based on the branch/environment

## Troubleshooting

### State Lock Issues

If you encounter state lock issues:

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Backend Configuration Issues

If backend initialization fails:

1. Verify AWS credentials have proper permissions
2. Ensure S3 bucket exists
3. Check the backend configuration file syntax

### Permissions Required

Your AWS credentials need these permissions:

- S3: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on the state bucket
- S3: `s3:ListBucket` on the state bucket (for locking)
- Plus all permissions needed for the infrastructure resources

## Security Considerations

- State files may contain sensitive information
- S3 bucket has encryption enabled and public access blocked
- Access is controlled through IAM policies
- Native S3 locking provides safe concurrent access

## Cost Impact

- S3 storage: ~$0.023 per GB per month
- S3 requests: Minimal cost for state operations
- **No DynamoDB costs**: Native S3 locking eliminates DynamoDB table charges
- Total expected cost: <$0.50 per month for typical usage

## Migration from DynamoDB Locking

If you previously used DynamoDB for locking:

1. Update your backend configuration to remove `dynamodb_table`
2. Run `terraform init -migrate-state`
3. Optionally delete the old DynamoDB lock tables to save costs
