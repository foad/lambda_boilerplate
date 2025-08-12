# Terraform Backend Configuration
# This file configures remote state storage in S3 with DynamoDB locking

terraform {
  # Uncomment the backend configuration below after creating the S3 bucket and DynamoDB table
  # backend "s3" {
  #   bucket         = "terraform-state-serverless-todo-${random_id.bucket_suffix.hex}"
  #   key            = "serverless-todo-api/terraform.tfstate"
  #   region         = "eu-west-2"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

# Random suffix for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 bucket for Terraform state (optional - for production use)
resource "aws_s3_bucket" "terraform_state" {
  count  = var.enable_remote_state ? 1 : 0
  bucket = "${var.environment}-terraform-state-serverless-todo-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-terraform-state-bucket"
    Type = "S3-Bucket"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  count  = var.enable_remote_state ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  count  = var.enable_remote_state ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  count  = var.enable_remote_state ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking (optional - for production use)
resource "aws_dynamodb_table" "terraform_state_lock" {
  count        = var.enable_remote_state ? 1 : 0
  name         = "${var.environment}-terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-terraform-state-lock"
    Type = "DynamoDB-StateLock"
  })
}
