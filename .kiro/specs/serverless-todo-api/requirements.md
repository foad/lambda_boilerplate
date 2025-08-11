# Requirements Document

## Introduction

This feature creates a serverless todo API using AWS Lambda, DynamoDB, and API Gateway, deployed via Terraform and GitHub Actions. The system provides a cost-effective alternative to serverless framework while maintaining organized structure and deployment automation. The API will be built in TypeScript and use AWS SDK v3 with OIDC authentication for secure deployments.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a well-structured serverless project template, so that I can efficiently manage and deploy Lambda functions without paying for serverless framework.

#### Acceptance Criteria

1. WHEN the project is created THEN the system SHALL provide a clear directory structure separating Lambda functions, infrastructure code, and deployment configurations
2. WHEN organizing the codebase THEN the system SHALL use TypeScript for all Lambda functions
3. WHEN structuring the project THEN the system SHALL separate concerns between API handlers, business logic, and data access layers
4. WHEN building the project THEN the system SHALL exclude AWS SDK v3 modules from deployment packages since they are pre-installed in Lambda runtime

### Requirement 2

**User Story:** As a developer, I want to create todos via API, so that I can add new tasks to my todo list.

#### Acceptance Criteria

1. WHEN a POST request is made to /todos THEN the system SHALL create a new todo item in DynamoDB
2. WHEN creating a todo THEN the system SHALL require a "title" field in the request body
3. WHEN creating a todo THEN the system SHALL automatically generate a unique ID and timestamp
4. WHEN creating a todo THEN the system SHALL set the initial status to "pending"
5. WHEN a todo is successfully created THEN the system SHALL return the created todo with HTTP 201 status
6. WHEN the request is invalid THEN the system SHALL return appropriate error messages with HTTP 400 status

### Requirement 3

**User Story:** As a developer, I want to retrieve todos via API, so that I can view all tasks in my todo list.

#### Acceptance Criteria

1. WHEN a GET request is made to /todos THEN the system SHALL return all todo items from DynamoDB
2. WHEN retrieving todos THEN the system SHALL return items in JSON format with all fields (id, title, status, createdAt, updatedAt)
3. WHEN no todos exist THEN the system SHALL return an empty array with HTTP 200 status
4. WHEN todos exist THEN the system SHALL return the array of todos with HTTP 200 status
5. WHEN a database error occurs THEN the system SHALL return HTTP 500 status with error message

### Requirement 4

**User Story:** As a developer, I want to mark todos as done via API, so that I can update the status of completed tasks.

#### Acceptance Criteria

1. WHEN a PUT request is made to /todos/{id}/complete THEN the system SHALL update the todo status to "completed"
2. WHEN marking a todo complete THEN the system SHALL update the "updatedAt" timestamp
3. WHEN the todo exists THEN the system SHALL return the updated todo with HTTP 200 status
4. WHEN the todo does not exist THEN the system SHALL return HTTP 404 status with error message
5. WHEN a database error occurs THEN the system SHALL return HTTP 500 status with error message

### Requirement 5

**User Story:** As a DevOps engineer, I want infrastructure deployed via Terraform, so that I can manage AWS resources as code with proper versioning and state management.

#### Acceptance Criteria

1. WHEN deploying infrastructure THEN the system SHALL use Terraform to provision all AWS resources
2. WHEN creating resources THEN the system SHALL provision API Gateway, Lambda functions, and DynamoDB table
3. WHEN tagging resources THEN the system SHALL apply consistent tags to all AWS resources for application grouping
4. WHEN configuring Lambda THEN the system SHALL set appropriate memory, timeout, and runtime settings
5. WHEN setting up API Gateway THEN the system SHALL configure proper CORS settings and request/response mappings
6. WHEN creating DynamoDB table THEN the system SHALL configure appropriate read/write capacity and indexes

### Requirement 6

**User Story:** As a DevOps engineer, I want automated deployment via GitHub Actions, so that I can deploy changes securely without managing long-lived credentials.

#### Acceptance Criteria

1. WHEN setting up CI/CD THEN the system SHALL use GitHub Actions for automated deployment
2. WHEN authenticating with AWS THEN the system SHALL use OIDC instead of long-lived access keys
3. WHEN deploying THEN the system SHALL run Terraform plan and apply commands
4. WHEN building Lambda functions THEN the system SHALL compile TypeScript and package functions appropriately
5. WHEN packaging functions THEN the system SHALL exclude AWS SDK v3 modules from deployment packages
6. WHEN deployment fails THEN the system SHALL provide clear error messages and fail the workflow

### Requirement 7

**User Story:** As a system administrator, I want all AWS resources properly tagged, so that I can identify and manage resources belonging to this application.

#### Acceptance Criteria

1. WHEN creating any AWS resource THEN the system SHALL apply a consistent set of tags
2. WHEN tagging resources THEN the system SHALL include "Application", "Environment", and "ManagedBy" tags
3. WHEN viewing AWS console THEN the system SHALL allow filtering resources by application tags
4. WHEN calculating costs THEN the system SHALL enable cost allocation by application through proper tagging