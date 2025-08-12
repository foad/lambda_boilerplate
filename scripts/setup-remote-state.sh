#!/bin/bash

# Script to set up Terraform remote state infrastructure
# This creates the S3 bucket needed for remote state storage with native S3 locking

set -e

# Configuration
REGION="${AWS_REGION:-eu-west-2}"
BUCKET_NAME="terraform-state-serverless-todo-api"
ENVIRONMENT="${1:-development}"

echo "🚀 Setting up Terraform remote state for environment: $ENVIRONMENT"
echo "📍 Region: $REGION"
echo "🪣 Bucket: $BUCKET_NAME (with native S3 locking)"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured or no valid credentials found"
    exit 1
fi

# Create S3 bucket for Terraform state (if it doesn't exist)
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ S3 bucket $BUCKET_NAME already exists"
else
    echo "📦 Creating S3 bucket: $BUCKET_NAME"
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    
    # Enable server-side encryption
    aws s3api put-bucket-encryption --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    # Block public access
    aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    
    echo "✅ S3 bucket configured with versioning, encryption, and public access blocked"
fi

# Create backend configuration file
BACKEND_CONFIG_FILE="terraform/backend-${ENVIRONMENT}.hcl"
cat > "$BACKEND_CONFIG_FILE" << EOF
bucket  = "$BUCKET_NAME"
key     = "environments/$ENVIRONMENT/terraform.tfstate"
region  = "$REGION"
encrypt = true
EOF

echo "📝 Created backend configuration: $BACKEND_CONFIG_FILE"

echo ""
echo "🎉 Remote state setup complete!"
echo ""
echo "Next steps:"
echo "1. Initialize Terraform with remote state:"
echo "   cd terraform && terraform init -backend-config=backend-${ENVIRONMENT}.hcl"
echo ""
echo "2. If you have existing local state, migrate it:"
echo "   terraform init -backend-config=backend-${ENVIRONMENT}.hcl -migrate-state"
echo ""
echo "3. Your state will now be stored at:"
echo "   s3://$BUCKET_NAME/environments/$ENVIRONMENT/terraform.tfstate"