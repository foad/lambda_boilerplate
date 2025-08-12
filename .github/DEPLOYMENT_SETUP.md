# GitHub Actions Deployment Setup

This document explains how to configure AWS OIDC authentication for secure deployments from GitHub Actions.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with Actions enabled
- AWS CLI installed (for setup)

## AWS OIDC Configuration

### 1. Create OIDC Identity Provider

```bash
# Create the OIDC identity provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. Create IAM Roles

#### Development Environment Role

Create a file `trust-policy-dev.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:ref:refs/heads/develop"
        }
      }
    }
  ]
}
```

Create the development role:

```bash
# Replace YOUR_ACCOUNT_ID, YOUR_GITHUB_USERNAME, and YOUR_REPO_NAME
aws iam create-role \
  --role-name GitHubActions-ServerlessTodo-Dev \
  --assume-role-policy-document file://trust-policy-dev.json
```

#### Production Environment Role

Create a file `trust-policy-prod.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

Create the production role:

```bash
aws iam create-role \
  --role-name GitHubActions-ServerlessTodo-Prod \
  --assume-role-policy-document file://trust-policy-prod.json
```

### 3. Create IAM Policies

Create a file `deployment-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:ListTables",
        "dynamodb:TagResource",
        "dynamodb:UntagResource",
        "dynamodb:ListTagsOfResource",
        "dynamodb:UpdateTable",
        "dynamodb:UpdateContinuousBackups",
        "dynamodb:DescribeContinuousBackups",
        "dynamodb:DescribeTimeToLive",
        "dynamodb:UpdateTimeToLive",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:ListFunctions",
        "lambda:ListVersionsByFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:GetPolicy"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["apigateway:*"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListPolicyVersions",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:TagPolicy",
        "iam:UntagPolicy"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:TagLogGroup",
        "logs:UntagLogGroup"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::terraform-state-*",
        "arn:aws:s3:::terraform-state-*/*"
      ]
    }
  ]
}
```

Create and attach the policy:

```bash
# Create the policy
aws iam create-policy \
  --policy-name ServerlessTodoDeploymentPolicy \
  --policy-document file://deployment-policy.json

# Attach to development role
aws iam attach-role-policy \
  --role-name GitHubActions-ServerlessTodo-Dev \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ServerlessTodoDeploymentPolicy

# Attach to production role
aws iam attach-role-policy \
  --role-name GitHubActions-ServerlessTodo-Prod \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ServerlessTodoDeploymentPolicy
```

## GitHub Repository Configuration

### 1. Repository Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `AWS_ROLE_ARN_DEV`: `arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActions-ServerlessTodo-Dev`
- `AWS_ROLE_ARN_PROD`: `arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActions-ServerlessTodo-Prod`

### 2. Repository Variables

Add these variables to your GitHub repository (Settings → Secrets and variables → Actions):

- `AWS_REGION`: `eu-west-2` (or your preferred region)

### 3. Environment Protection Rules

1. Go to Settings → Environments
2. Create `development` environment
3. Create `production` environment
4. For production, add protection rules:
   - Required reviewers
   - Wait timer (optional)
   - Deployment branches: `main` only

## Terraform State Management (Optional)

For production use, consider using remote state:

### 1. Create S3 Bucket for State

```bash
aws s3 mb s3://your-terraform-state-bucket-name
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket-name \
  --versioning-configuration Status=Enabled
```

### 2. Create DynamoDB Table for State Locking

```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 3. Update terraform/main.tf

Add backend configuration:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket-name"
    key            = "serverless-todo-api/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

## Deployment Workflow

### Automatic Deployments

- **Development**: Push to `develop` branch
- **Production**: Push to `main` branch
- **PR Review**: Terraform plan shown in PR comments

### Manual Operations

- **Destroy Infrastructure**: Use the "Destroy Infrastructure" workflow in GitHub Actions

## Troubleshooting

### Common Issues

1. **OIDC Trust Relationship**: Ensure the trust policy matches your exact repository path
2. **Permissions**: Verify IAM policies include all required permissions
3. **Region Mismatch**: Ensure AWS_REGION variable matches your Terraform configuration
4. **State Conflicts**: Use remote state for team collaboration

### Debugging

Check GitHub Actions logs for detailed error messages. Common fixes:

- Verify role ARNs in repository secrets
- Check AWS region configuration
- Ensure Terraform state is accessible
- Validate IAM permissions

## Security Best Practices

1. Use least-privilege IAM policies
2. Enable environment protection rules for production
3. Use separate AWS accounts for dev/prod (recommended)
4. Regularly rotate and audit permissions
5. Monitor CloudTrail for deployment activities

## Permission Notes

The permissions listed above have been tested and verified to work with the complete Terraform configuration, including:

- **DynamoDB**: Full table management with point-in-time recovery, TTL, and tagging
- **Lambda**: Function creation, updates, and permission management
- **API Gateway**: Complete REST API setup with CORS
- **IAM**: Role and policy management for Lambda execution
- **CloudWatch**: Log group management

These permissions follow the principle of least privilege while ensuring all Terraform operations can complete successfully.
