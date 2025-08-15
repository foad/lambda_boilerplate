variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "foad"
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "todos"
}

variable "enable_remote_state" {
  description = "Enable remote state storage with S3 and DynamoDB"
  type        = bool
  default     = false
}


