# API Gateway REST API
resource "aws_api_gateway_rest_api" "todos_api" {
  name        = "${var.environment}-todos-api"
  description = "Serverless Todo API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-todos-api"
    Type = "API-Gateway"
  })
}

# API Gateway Resource for /todos
resource "aws_api_gateway_resource" "todos_resource" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  parent_id   = aws_api_gateway_rest_api.todos_api.root_resource_id
  path_part   = "todos"
}

# API Gateway Resource for /todos/{id}
resource "aws_api_gateway_resource" "todo_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  parent_id   = aws_api_gateway_resource.todos_resource.id
  path_part   = "{id}"
}

# API Gateway Resource for /todos/{id}/complete
resource "aws_api_gateway_resource" "todo_complete_resource" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  parent_id   = aws_api_gateway_resource.todo_id_resource.id
  path_part   = "complete"
}

# POST /todos - Create Todo
resource "aws_api_gateway_method" "create_todo_method" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.todos_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# GET /todos - Read Todos
resource "aws_api_gateway_method" "read_todos_method" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.todos_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

# PUT /todos/{id}/complete - Update Todo
resource "aws_api_gateway_method" "update_todo_method" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.todo_complete_resource.id
  http_method   = "PUT"
  authorization = "NONE"
}

# Lambda Integration for Create Todo
resource "aws_api_gateway_integration" "create_todo_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todos_resource.id
  http_method = aws_api_gateway_method.create_todo_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_todo.invoke_arn
}

# Lambda Integration for Read Todos
resource "aws_api_gateway_integration" "read_todos_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todos_resource.id
  http_method = aws_api_gateway_method.read_todos_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.read_todos.invoke_arn
}

# Lambda Integration for Update Todo
resource "aws_api_gateway_integration" "update_todo_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todo_complete_resource.id
  http_method = aws_api_gateway_method.update_todo_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_todo.invoke_arn
}

# Lambda permissions for API Gateway to invoke functions
resource "aws_lambda_permission" "create_todo_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_todo.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.todos_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "read_todos_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.read_todos.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.todos_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "update_todo_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_todo.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.todos_api.execution_arn}/*/*"
}

# CORS OPTIONS method for /todos
resource "aws_api_gateway_method" "todos_options" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.todos_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# CORS OPTIONS method for /todos/{id}/complete
resource "aws_api_gateway_method" "todo_complete_options" {
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  resource_id   = aws_api_gateway_resource.todo_complete_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# CORS Integration for /todos
resource "aws_api_gateway_integration" "todos_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todos_resource.id
  http_method = aws_api_gateway_method.todos_options.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# CORS Integration for /todos/{id}/complete
resource "aws_api_gateway_integration" "todo_complete_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todo_complete_resource.id
  http_method = aws_api_gateway_method.todo_complete_options.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# CORS Method Response for /todos OPTIONS
resource "aws_api_gateway_method_response" "todos_options_response" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todos_resource.id
  http_method = aws_api_gateway_method.todos_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# CORS Method Response for /todos/{id}/complete OPTIONS
resource "aws_api_gateway_method_response" "todo_complete_options_response" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todo_complete_resource.id
  http_method = aws_api_gateway_method.todo_complete_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# CORS Integration Response for /todos OPTIONS
resource "aws_api_gateway_integration_response" "todos_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todos_resource.id
  http_method = aws_api_gateway_method.todos_options.http_method
  status_code = aws_api_gateway_method_response.todos_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS Integration Response for /todos/{id}/complete OPTIONS
resource "aws_api_gateway_integration_response" "todo_complete_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.todos_api.id
  resource_id = aws_api_gateway_resource.todo_complete_resource.id
  http_method = aws_api_gateway_method.todo_complete_options.http_method
  status_code = aws_api_gateway_method_response.todo_complete_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'PUT,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "todos_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.create_todo_integration,
    aws_api_gateway_integration.read_todos_integration,
    aws_api_gateway_integration.update_todo_integration,
    aws_api_gateway_integration.todos_options_integration,
    aws_api_gateway_integration.todo_complete_options_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.todos_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.todos_resource.id,
      aws_api_gateway_resource.todo_id_resource.id,
      aws_api_gateway_resource.todo_complete_resource.id,
      aws_api_gateway_method.create_todo_method.id,
      aws_api_gateway_method.read_todos_method.id,
      aws_api_gateway_method.update_todo_method.id,
      aws_api_gateway_integration.create_todo_integration.id,
      aws_api_gateway_integration.read_todos_integration.id,
      aws_api_gateway_integration.update_todo_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "todos_api_stage" {
  deployment_id = aws_api_gateway_deployment.todos_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.todos_api.id
  stage_name    = var.environment

  tags = merge(local.common_tags, {
    Name = "${var.environment}-todos-api-stage"
    Type = "API-Gateway-Stage"
  })
}
