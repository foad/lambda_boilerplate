/**
 * Test authentication utilities for creating mock auth contexts and managing smoke test users
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  UserNotFoundException,
} from "@aws-sdk/client-cognito-identity-provider";

export interface TestUser {
  username: string;
  email: string;
  password: string;
  temporaryPassword?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface MockAuthorizerContext {
  claims: {
    sub: string;
    email?: string;
    username?: string;
    "cognito:username"?: string;
  };
}

/**
 * Create mock authorizer context for unit and integration tests
 * This simulates what API Gateway would add to the event when using Cognito authorizer
 */
export function createMockAuthorizerContext(
  userId: string,
  email?: string,
  username?: string
): MockAuthorizerContext {
  const claims: MockAuthorizerContext["claims"] = {
    sub: userId,
  };

  if (email !== undefined) {
    claims.email = email;
  }

  if (username !== undefined) {
    claims.username = username;
    claims["cognito:username"] = username;
  }

  return { claims };
}

/**
 * Test authentication manager for deployed Cognito operations (smoke tests only)
 */
export class TestAuthManager {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(userPoolId?: string, clientId?: string) {
    // For smoke tests against deployed environment
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || "eu-west-2",
    });

    // Use environment variables or provided values
    this.userPoolId = userPoolId || process.env.COGNITO_USER_POOL_ID || "";
    this.clientId = clientId || process.env.COGNITO_CLIENT_ID || "";

    if (!this.userPoolId || !this.clientId) {
      console.warn(
        "COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID not set. Smoke test auth operations may fail."
      );
    }
  }

  /**
   * Create a test user in the deployed Cognito User Pool (for smoke tests)
   */
  async createTestUser(user: TestUser): Promise<void> {
    try {
      // Check if user already exists
      try {
        await this.client.send(
          new AdminGetUserCommand({
            UserPoolId: this.userPoolId,
            Username: user.username,
          })
        );
        console.log(`Test user ${user.username} already exists`);
        return;
      } catch (error) {
        if (!(error instanceof UserNotFoundException)) {
          throw error;
        }
        // User doesn't exist, continue with creation
      }

      // Create the user
      await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: this.userPoolId,
          Username: user.username,
          UserAttributes: [
            { Name: "email", Value: user.email },
            { Name: "email_verified", Value: "true" },
          ],
          TemporaryPassword: user.temporaryPassword || "TempPass123!",
          MessageAction: "SUPPRESS", // Don't send welcome email
        })
      );

      // Set permanent password
      await this.client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: this.userPoolId,
          Username: user.username,
          Password: user.password,
          Permanent: true,
        })
      );

      console.log(`Created test user: ${user.username}`);
    } catch (error) {
      console.error(`Failed to create test user ${user.username}:`, error);
      throw error;
    }
  }

  /**
   * Delete a test user from the deployed Cognito User Pool (for smoke tests)
   */
  async deleteTestUser(username: string): Promise<void> {
    try {
      await this.client.send(
        new AdminDeleteUserCommand({
          UserPoolId: this.userPoolId,
          Username: username,
        })
      );
      console.log(`Deleted test user: ${username}`);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        console.log(`Test user ${username} does not exist`);
        return;
      }
      console.error(`Failed to delete test user ${username}:`, error);
      throw error;
    }
  }

  /**
   * Authenticate a test user and get tokens (for smoke tests)
   */
  async authenticateUser(
    username: string,
    password: string
  ): Promise<AuthTokens> {
    try {
      const response = await this.client.send(
        new AdminInitiateAuthCommand({
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthFlow: "ADMIN_NO_SRP_AUTH",
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
          },
        })
      );

      if (!response.AuthenticationResult) {
        throw new Error("Authentication failed - no tokens returned");
      }

      const { AccessToken, IdToken, RefreshToken } =
        response.AuthenticationResult;

      if (!AccessToken || !IdToken || !RefreshToken) {
        throw new Error("Authentication failed - incomplete token set");
      }

      return {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
      };
    } catch (error) {
      console.error(`Failed to authenticate user ${username}:`, error);
      throw error;
    }
  }

  /**
   * Get authorization headers for API requests (for smoke tests)
   */
  getAuthHeaders(idToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${idToken}`,
    };
  }
}

/**
 * Default test users for smoke tests
 */
export const DEFAULT_TEST_USERS: TestUser[] = [
  {
    username: "testuser@example.com",
    email: "testuser@example.com",
    password: "TestPass123!",
  },
  {
    username: "testuser2@example.com",
    email: "testuser2@example.com",
    password: "TestPass123!",
  },
];

/**
 * Create a test auth manager instance for smoke tests
 */
export function createTestAuthManager(): TestAuthManager {
  return new TestAuthManager();
}

/**
 * Setup test users for smoke tests (deployed environment only)
 */
export async function setupTestUsers(
  authManager?: TestAuthManager
): Promise<TestAuthManager> {
  const manager = authManager || createTestAuthManager();

  for (const user of DEFAULT_TEST_USERS) {
    await manager.createTestUser(user);
  }

  return manager;
}

/**
 * Cleanup test users after smoke tests (deployed environment only)
 */
export async function cleanupTestUsers(
  authManager?: TestAuthManager
): Promise<void> {
  const manager = authManager || createTestAuthManager();

  for (const user of DEFAULT_TEST_USERS) {
    await manager.deleteTestUser(user.username);
  }
}
