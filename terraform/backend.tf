# Terraform Backend Configuration
# This file configures remote state storage in S3 with DynamoDB locking

terraform {
  backend "s3" {
    # These values will be provided via terraform init -backend-config
    # bucket         = "terraform-state-serverless-todo-api"
    # key            = "environments/{environment}/terraform.tfstate"
    # region         = "eu-west-2"
    # dynamodb_table = "{environment}-terraform-state-lock"
    # encrypt        = true
  }
}

# Random suffix for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Note: Remote state is now managed externally via setup script
# S3 bucket and configuration are created by scripts/setup-remote-state.sh
# No Terraform resources needed here since we use native S3 locking
