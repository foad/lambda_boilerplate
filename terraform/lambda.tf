# Data source to create ZIP files for Lambda functions
data "archive_file" "create_todo_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../dist/create-todo"
  output_path = "${path.root}/../dist/create-todo.zip"
}

data "archive_file" "read_todos_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../dist/read-todos"
  output_path = "${path.root}/../dist/read-todos.zip"
}

data "archive_file" "update_todo_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../dist/update-todo"
  output_path = "${path.root}/../dist/update-todo.zip"
}

# Create Todo Lambda Function
resource "aws_lambda_function" "create_todo" {
  filename      = data.archive_file.create_todo_zip.output_path
  function_name = "${var.environment}-create-todo"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 10

  source_code_hash = data.archive_file.create_todo_zip.output_base64sha256

  environment {
    variables = {
      TODOS_TABLE_NAME     = aws_dynamodb_table.todos.name
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.main.id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-create-todo"
    Type = "Lambda-Function"
  })
}

# Read Todos Lambda Function
resource "aws_lambda_function" "read_todos" {
  filename      = data.archive_file.read_todos_zip.output_path
  function_name = "${var.environment}-read-todos"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 10

  source_code_hash = data.archive_file.read_todos_zip.output_base64sha256

  environment {
    variables = {
      TODOS_TABLE_NAME     = aws_dynamodb_table.todos.name
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.main.id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-read-todos"
    Type = "Lambda-Function"
  })
}

# Update Todo Lambda Function
resource "aws_lambda_function" "update_todo" {
  filename      = data.archive_file.update_todo_zip.output_path
  function_name = "${var.environment}-update-todo"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 10

  source_code_hash = data.archive_file.update_todo_zip.output_base64sha256

  environment {
    variables = {
      TODOS_TABLE_NAME     = aws_dynamodb_table.todos.name
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.main.id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-update-todo"
    Type = "Lambda-Function"
  })
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "create_todo_logs" {
  name              = "/aws/lambda/${aws_lambda_function.create_todo.function_name}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${var.environment}-create-todo-logs"
    Type = "CloudWatch-LogGroup"
  })
}

resource "aws_cloudwatch_log_group" "read_todos_logs" {
  name              = "/aws/lambda/${aws_lambda_function.read_todos.function_name}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${var.environment}-read-todos-logs"
    Type = "CloudWatch-LogGroup"
  })
}

resource "aws_cloudwatch_log_group" "update_todo_logs" {
  name              = "/aws/lambda/${aws_lambda_function.update_todo.function_name}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${var.environment}-update-todo-logs"
    Type = "CloudWatch-LogGroup"
  })
}
