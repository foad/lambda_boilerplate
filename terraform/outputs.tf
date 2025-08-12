output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.todos.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.todos.arn
}

output "dynamodb_table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.todos.id
}

# Lambda function outputs
output "create_todo_function_name" {
  description = "Name of the create todo Lambda function"
  value       = aws_lambda_function.create_todo.function_name
}

output "create_todo_function_arn" {
  description = "ARN of the create todo Lambda function"
  value       = aws_lambda_function.create_todo.arn
}

output "create_todo_invoke_arn" {
  description = "Invoke ARN of the create todo Lambda function"
  value       = aws_lambda_function.create_todo.invoke_arn
}

output "read_todos_function_name" {
  description = "Name of the read todos Lambda function"
  value       = aws_lambda_function.read_todos.function_name
}

output "read_todos_function_arn" {
  description = "ARN of the read todos Lambda function"
  value       = aws_lambda_function.read_todos.arn
}

output "read_todos_invoke_arn" {
  description = "Invoke ARN of the read todos Lambda function"
  value       = aws_lambda_function.read_todos.invoke_arn
}

output "update_todo_function_name" {
  description = "Name of the update todo Lambda function"
  value       = aws_lambda_function.update_todo.function_name
}

output "update_todo_function_arn" {
  description = "ARN of the update todo Lambda function"
  value       = aws_lambda_function.update_todo.arn
}

output "update_todo_invoke_arn" {
  description = "Invoke ARN of the update todo Lambda function"
  value       = aws_lambda_function.update_todo.invoke_arn
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}
# API Gateway outputs
output "api_gateway_rest_api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.todos_api.id
}

output "api_gateway_rest_api_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.todos_api.arn
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.todos_api.execution_arn
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.todos_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.todos_api_stage.stage_name
}

# Remote state outputs (when enabled)
output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = var.enable_remote_state ? aws_s3_bucket.terraform_state[0].bucket : null
}

output "terraform_state_lock_table" {
  description = "DynamoDB table for Terraform state locking"
  value       = var.enable_remote_state ? aws_dynamodb_table.terraform_state_lock[0].name : null
}
