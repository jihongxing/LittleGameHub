/**
 * OAuth Error Handling Utilities
 * OAuth 错误处理工具
 *
 * Provides standardized error handling for OAuth operations
 * 为OAuth操作提供标准化的错误处理
 */

/**
 * OAuth Error Types
 * OAuth 错误类型
 */
export enum OAuthErrorType {
  INVALID_REQUEST = 'invalid_request',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  ACCESS_DENIED = 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  INVALID_SCOPE = 'invalid_scope',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  INVALID_STATE = 'invalid_state',
  INVALID_CODE = 'invalid_code',
  INVALID_TOKEN = 'invalid_token',
}

/**
 * OAuth Error Class
 * OAuth 错误类
 */
export class OAuthError extends Error {
  public readonly type: OAuthErrorType;
  public readonly provider: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    type: OAuthErrorType,
    message: string,
    provider: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'OAuthError';
    this.type = type;
    this.provider = provider;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Create invalid request error
   */
  static invalidRequest(message: string, provider: string, details?: any): OAuthError {
    return new OAuthError(
      OAuthErrorType.INVALID_REQUEST,
      message,
      provider,
      400,
      details
    );
  }

  /**
   * Create access denied error
   */
  static accessDenied(message: string, provider: string, details?: any): OAuthError {
    return new OAuthError(
      OAuthErrorType.ACCESS_DENIED,
      message,
      provider,
      403,
      details
    );
  }

  /**
   * Create server error
   */
  static serverError(message: string, provider: string, details?: any): OAuthError {
    return new OAuthError(
      OAuthErrorType.SERVER_ERROR,
      message,
      provider,
      500,
      details
    );
  }

  /**
   * Create invalid state error
   */
  static invalidState(provider: string): OAuthError {
    return new OAuthError(
      OAuthErrorType.INVALID_STATE,
      'Invalid OAuth state parameter',
      provider,
      400
    );
  }

  /**
   * Create invalid code error
   */
  static invalidCode(provider: string): OAuthError {
    return new OAuthError(
      OAuthErrorType.INVALID_CODE,
      'Invalid authorization code',
      provider,
      400
    );
  }

  /**
   * Create temporarily unavailable error
   */
  static temporarilyUnavailable(provider: string): OAuthError {
    return new OAuthError(
      OAuthErrorType.TEMPORARILY_UNAVAILABLE,
      'OAuth service temporarily unavailable',
      provider,
      503
    );
  }
}

/**
 * Parse OAuth provider error
 * 解析OAuth提供商错误
 *
 * @param error Raw error from OAuth provider
 * @param provider Provider name
 * @returns OAuthError instance
 */
export function createOAuthError(error: any, provider: string): OAuthError {
  if (error instanceof OAuthError) {
    return error;
  }

  // Handle common OAuth error formats
  if (typeof error === 'object') {
    const { error: errorType, error_description, error_uri } = error;

    switch (errorType) {
      case 'invalid_request':
        return OAuthError.invalidRequest(
          error_description || 'Invalid OAuth request',
          provider,
          { uri: error_uri }
        );

      case 'unauthorized_client':
        return new OAuthError(
          OAuthErrorType.UNAUTHORIZED_CLIENT,
          error_description || 'Unauthorized OAuth client',
          provider,
          401,
          { uri: error_uri }
        );

      case 'access_denied':
        return OAuthError.accessDenied(
          error_description || 'OAuth access denied',
          provider,
          { uri: error_uri }
        );

      case 'unsupported_response_type':
        return new OAuthError(
          OAuthErrorType.UNSUPPORTED_RESPONSE_TYPE,
          error_description || 'Unsupported response type',
          provider,
          400,
          { uri: error_uri }
        );

      case 'invalid_scope':
        return new OAuthError(
          OAuthErrorType.INVALID_SCOPE,
          error_description || 'Invalid OAuth scope',
          provider,
          400,
          { uri: error_uri }
        );

      case 'server_error':
        return OAuthError.serverError(
          error_description || 'OAuth server error',
          provider,
          { uri: error_uri }
        );

      case 'temporarily_unavailable':
        return OAuthError.temporarilyUnavailable(provider);

      default:
        // Unknown error type
        return OAuthError.serverError(
          error_description || `OAuth error: ${errorType || 'Unknown error'}`,
          provider,
          error
        );
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('timeout') || error.includes('network')) {
      return OAuthError.temporarilyUnavailable(provider);
    }
    return OAuthError.serverError(error, provider);
  }

  // Handle other error types
  return OAuthError.serverError(
    error?.message || 'Unknown OAuth error',
    provider,
    error
  );
}
