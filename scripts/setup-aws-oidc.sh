#!/bin/bash

# AWS OIDC Setup Script for GitHub Actions
# This script helps set up AWS OIDC authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get user input
read -p "Enter your AWS Account ID: " ACCOUNT_ID
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter your GitHub repository name: " REPO_NAME
read -p "Enter your preferred AWS region (default: eu-west-2): " AWS_REGION
AWS_REGION=${AWS_REGION:-eu-west-2}

print_status "Setting up OIDC for ${GITHUB_USERNAME}/${REPO_NAME} in account ${ACCOUNT_ID}"

# Create OIDC Identity Provider
print_status "Creating OIDC Identity Provider..."
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  2>/dev/null || print_warning "OIDC provider may already exist"

# Create trust policy files
print_status "Creating trust policy files..."

cat > trust-policy-dev.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_USERNAME}/${REPO_NAME}:*"
        }
      }
    }
  ]
}
EOF

cat > trust-policy-prod.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_USERNAME}/${REPO_NAME}:*"
        }
      }
    }
  ]
}
EOF

# Use centralized deployment policy
print_status "Using centralized deployment policy..."
POLICY_FILE=".github/policies/github-actions-deployment-policy.json"

if [ ! -f "$POLICY_FILE" ]; then
    print_error "Policy file not found: $POLICY_FILE"
    print_error "Please ensure the repository contains the centralized policy file."
    exit 1
fi

# Create IAM roles
print_status "Creating IAM roles..."

aws iam create-role \
  --role-name GitHubActions-ServerlessTodo-Dev \
  --assume-role-policy-document file://trust-policy-dev.json \
  2>/dev/null || print_warning "Development role may already exist"

aws iam create-role \
  --role-name GitHubActions-ServerlessTodo-Prod \
  --assume-role-policy-document file://trust-policy-prod.json \
  2>/dev/null || print_warning "Production role may already exist"

# Create and attach policy
print_status "Creating and attaching deployment policy..."

aws iam create-policy \
  --policy-name ServerlessTodoDeploymentPolicy \
  --policy-document file://$POLICY_FILE \
  2>/dev/null || print_warning "Policy may already exist"

aws iam attach-role-policy \
  --role-name GitHubActions-ServerlessTodo-Dev \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/ServerlessTodoDeploymentPolicy \
  2>/dev/null || print_warning "Policy may already be attached to dev role"

aws iam attach-role-policy \
  --role-name GitHubActions-ServerlessTodo-Prod \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/ServerlessTodoDeploymentPolicy \
  2>/dev/null || print_warning "Policy may already be attached to prod role"

# Clean up temporary files
rm -f trust-policy-dev.json trust-policy-prod.json

print_success "AWS OIDC setup completed!"
print_status "Next steps:"
echo "1. Add these secrets to your GitHub repository:"
echo "   - AWS_ROLE_ARN_DEV: arn:aws:iam::${ACCOUNT_ID}:role/GitHubActions-ServerlessTodo-Dev"
echo "   - AWS_ROLE_ARN_PROD: arn:aws:iam::${ACCOUNT_ID}:role/GitHubActions-ServerlessTodo-Prod"
echo ""
echo "2. Add this variable to your GitHub repository:"
echo "   - AWS_REGION: ${AWS_REGION}"
echo ""
echo "3. Set up environment protection rules in GitHub for 'production' environment"
echo ""
print_success "Setup complete! Your GitHub Actions workflows are ready to deploy."