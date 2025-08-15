# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "main" {
  name = "${var.environment}-todo-user-pool"

  # Free tier optimized configuration
  # Standard attributes only (no custom attributes to avoid costs)
  alias_attributes = ["email"]

  # Password policy - use standard settings
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Email configuration - use Cognito default (free)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Account recovery - email only (SMS incurs costs)
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # User pool add-ons - disable advanced security features to stay in free tier
  user_pool_add_ons {
    advanced_security_mode = "OFF" # Disable risk-based authentication
  }

  # Verification message templates
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your verification code"
    email_message        = "Your verification code is {####}"
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Username configuration
  username_configuration {
    case_sensitive = false
  }

  # Device configuration - disable to avoid costs
  device_configuration {
    challenge_required_on_new_device      = false
    device_only_remembered_on_user_prompt = false
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-todo-user-pool"
    Type = "Cognito-UserPool"
  })
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.environment}-todo-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Client settings optimized for API access
  generate_secret = false # For public clients (web/mobile apps)

  # Auth flows - enable only what's needed
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH" # Required for smoke tests using ADMIN_NO_SRP_AUTH
  ]

  # Token validity - reasonable defaults
  access_token_validity  = 60 # 1 hour
  id_token_validity      = 60 # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Prevent user existence errors for security
  prevent_user_existence_errors = "ENABLED"

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified"
  ]

  write_attributes = [
    "email"
  ]
}
