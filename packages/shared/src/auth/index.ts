/**
 * OAuth Authentication Module
 * OAuth 认证模块
 *
 * Provides unified OAuth 2.0 authentication across multiple platforms
 * 在多个平台上提供统一的OAuth 2.0认证
 */

// Interfaces and Types
export type {
  OAuthConfig,
  OAuthUser,
  OAuthTokens,
  IOAuthProvider,
} from './oauth-provider.interface';

// Abstract Base Class
export { OAuthProvider } from './oauth-provider.abstract';

// Concrete Providers
export { GitHubOAuthProvider } from './providers/github.provider';

// Services
export { OAuthService, type OAuthServiceConfig } from './oauth.service';

// Utilities
export { generateOAuthState, validateOAuthState } from './utils/state';
export { OAuthError, createOAuthError, OAuthErrorType } from './utils/errors';
