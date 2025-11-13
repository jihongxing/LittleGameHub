/**
 * OAuth Service
 * OAuth 服务
 *
 * Manages OAuth providers and handles OAuth flows
 * 管理OAuth提供商并处理OAuth流程
 */

import { IOAuthProvider, OAuthConfig, OAuthUser, OAuthTokens } from './oauth-provider.interface';
import { generateOAuthState, validateOAuthState } from './utils/state';
import { OAuthError, OAuthErrorType, createOAuthError } from './utils/errors';

/**
 * OAuth Service Configuration
 * OAuth 服务配置
 */
export interface OAuthServiceConfig {
  /** 默认的重定向URI */
  defaultRedirectUri?: string;
  /** 状态参数过期时间（毫秒） */
  stateExpirationMs?: number;
  /** 是否启用状态验证 */
  enableStateValidation?: boolean;
  /** 支持的OAuth提供商 */
  providers: Record<string, IOAuthProvider>;
}

/**
 * OAuth Service
 * OAuth 服务类
 */
export class OAuthService {
  private config: OAuthServiceConfig;
  private stateStore: Map<string, { state: string; expiresAt: number }> = new Map();

  constructor(config: OAuthServiceConfig) {
    this.config = {
      stateExpirationMs: 10 * 60 * 1000, // 10 minutes
      enableStateValidation: true,
      ...config,
    };
  }

  /**
   * 获取OAuth授权URL
   *
   * @param providerName 提供商名称
   * @param redirectUri 重定向URI
   * @returns 授权URL和状态信息
   */
  getAuthorizationUrl(providerName: string, redirectUri?: string): {
    url: string;
    state: string;
    provider: string;
  } {
    const provider = this.getProvider(providerName);

    // 生成状态参数
    const state = generateOAuthState();
    const expiresAt = Date.now() + (this.config.stateExpirationMs || 600000);

    // 存储状态参数
    if (this.config.enableStateValidation) {
      this.stateStore.set(state, { state, expiresAt });
    }

    // 生成授权URL
    const authUrl = provider.getAuthorizationUrl(state);

    return {
      url: authUrl,
      state,
      provider: providerName,
    };
  }

  /**
   * 处理OAuth回调
   *
   * @param providerName 提供商名称
   * @param code 授权码
   * @param state 状态参数
   * @returns 用户信息
   */
  async handleCallback(
    providerName: string,
    code: string,
    state?: string
  ): Promise<OAuthUser> {
    const provider = this.getProvider(providerName);

    try {
      // 验证状态参数
      if (this.config.enableStateValidation && state) {
        this.validateState(state);
      }

      // 交换授权码获取令牌
      const tokens = await provider.exchangeCodeForToken(code);

      // 获取用户信息
      const user = await provider.getUserInfo(tokens.accessToken);

      return user;
    } catch (error) {
      throw createOAuthError(error, providerName);
    }
  }

  /**
   * 验证访问令牌
   *
   * @param providerName 提供商名称
   * @param accessToken 访问令牌
   * @returns 是否有效
   */
  async validateToken(providerName: string, accessToken: string): Promise<boolean> {
    const provider = this.getProvider(providerName);

    if (!provider.validateToken) {
      // 如果提供商不支持令牌验证，默认认为有效
      return true;
    }

    try {
      return await provider.validateToken(accessToken);
    } catch (error) {
      return false;
    }
  }

  /**
   * 刷新访问令牌
   *
   * @param providerName 提供商名称
   * @param refreshToken 刷新令牌
   * @returns 新的令牌
   */
  async refreshToken(providerName: string, refreshToken: string): Promise<OAuthTokens> {
    const provider = this.getProvider(providerName);

    if (!provider.refreshToken) {
      throw new OAuthError(
        OAuthErrorType.INVALID_REQUEST,
        'Token refresh not supported by this provider',
        providerName,
        400
      );
    }

    try {
      return await provider.refreshToken(refreshToken);
    } catch (error) {
      throw createOAuthError(error, providerName);
    }
  }

  /**
   * 获取所有支持的提供商
   */
  getSupportedProviders(): string[] {
    return Object.keys(this.config.providers);
  }

  /**
   * 检查是否支持指定的提供商
   */
  isProviderSupported(providerName: string): boolean {
    return providerName in this.config.providers;
  }

  /**
   * 获取提供商实例
   */
  private getProvider(providerName: string): IOAuthProvider {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new OAuthError(
        OAuthErrorType.INVALID_REQUEST,
        `Unsupported OAuth provider: ${providerName}`,
        providerName,
        400
      );
    }
    return provider;
  }

  /**
   * 验证状态参数
   */
  private validateState(state: string): void {
    const stored = this.stateStore.get(state);
    if (!stored) {
      throw OAuthError.invalidState('unknown');
    }

    // 检查是否过期
    if (Date.now() > stored.expiresAt) {
      this.stateStore.delete(state);
      throw OAuthError.invalidState('unknown');
    }

    // 验证状态值
    if (!validateOAuthState(state, stored.state)) {
      this.stateStore.delete(state);
      throw OAuthError.invalidState('unknown');
    }

    // 使用后删除状态
    this.stateStore.delete(state);
  }

  /**
   * 清理过期的状态参数
   */
  cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now > data.expiresAt) {
        this.stateStore.delete(state);
      }
    }
  }
}
