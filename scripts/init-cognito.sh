#!/bin/bash

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
until awslocal cognito-idp list-user-pools --max-results 1 --endpoint-url=http://localhost:4566 > /dev/null 2>&1; do
  echo "Waiting for Cognito service to be responsive..."
  sleep 2
done

echo "LocalStack is ready. Creating Cognito User Pool..."

# Create the user pool
USER_POOL_ID=$(awslocal cognito-idp create-user-pool \
    --pool-name "development-todo-user-pool" \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }' \
    --alias-attributes email \
    --auto-verified-attributes email \
    --username-configuration '{
        "CaseSensitive": false
    }' \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "EmailSubject": "Your verification code",
        "EmailMessage": "Your verification code is {####}"
    }' \
    --account-recovery-setting '{
        "RecoveryMechanisms": [
            {
                "Name": "verified_email",
                "Priority": 1
            }
        ]
    }' \
    --user-pool-add-ons '{
        "AdvancedSecurityMode": "OFF"
    }' \
    --device-configuration '{
        "ChallengeRequiredOnNewDevice": false,
        "DeviceOnlyRememberedOnUserPrompt": false
    }' \
    --region eu-west-2 \
    --query 'UserPool.Id' \
    --output text)

echo "User Pool created with ID: $USER_POOL_ID"

# Create the user pool client
CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "development-todo-app-client" \
    --generate-secret false \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
    --access-token-validity 60 \
    --id-token-validity 60 \
    --refresh-token-validity 30 \
    --token-validity-units '{
        "AccessToken": "minutes",
        "IdToken": "minutes",
        "RefreshToken": "days"
    }' \
    --prevent-user-existence-errors ENABLED \
    --read-attributes email email_verified \
    --write-attributes email \
    --region eu-west-2 \
    --query 'UserPoolClient.ClientId' \
    --output text)

echo "User Pool Client created with ID: $CLIENT_ID"

# Create a test user for local development
echo "Creating test user for local development..."
awslocal cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "testuser@example.com" \
    --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \
    --temporary-password "TempPass123!" \
    --message-action SUPPRESS \
    --region eu-west-2

# Set permanent password for test user
awslocal cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "testuser@example.com" \
    --password "TestPass123!" \
    --permanent \
    --region eu-west-2

echo "Test user created: testuser@example.com / TestPass123!"

# Export environment variables for local development
echo ""
echo "=== Local Development Environment Variables ==="
echo "export COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "export COGNITO_CLIENT_ID=$CLIENT_ID"
echo "export ENABLE_COGNITO_AUTH=true"
echo ""
echo "Add these to your .env.local file or export them in your shell"

# Save to a local env file for convenience
cat > .env.cognito.local << EOF
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
ENABLE_COGNITO_AUTH=true
EOF

echo "Environment variables saved to .env.cognito.local"
echo "Cognito User Pool setup complete!"